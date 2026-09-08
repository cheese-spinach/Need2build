#!/usr/bin/env python3
"""Need2Build 实时数据采集器

由 GitHub Actions 定时调用，把各平台的原始内容归一化为 js/live-data.json，
前端 js/live.js 会自动加载该文件并覆盖 js/data.js 中的示例数据。

支持的实时源：
  1. GitHub 官方 REST API（无需密钥，抓最近高分新仓库）
  2. X (Twitter) API v2 recent search（需要把 Bearer Token 配到 Actions Secret）
  3. RSSHub / 任意 RSS 源（可配置知乎热榜等，见 config/rss-feeds.json）
  4. 通用 HTTP 热榜/第三方搜索 API（见 config/http-signals.json）
  5. 手工导入文件 data/manual-signals.json（需要人工维护的精选需求）

用法：python scripts/collect.py
"""

import datetime as dt
import html
import json
import math
import os
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT / "js" / "live-data.json"
MANUAL_SIGNALS_PATH = ROOT / "data" / "manual-signals.json"
TWITTER_OUTPUT_PATH = ROOT / "data" / "twitter_signals.json"

DEFAULT_X_QUERIES = [
    {
        "query": '("I wish there was" OR "someone should build" OR "is there an app") -is:retweet lang:en',
        "label": "海外需求信号",
    },
    {
        "query": "(\u6709\u6ca1\u6709 OR \u6c42\u63a8\u8350 OR \u9700\u8981\u4e00\u4e2a) (AI OR \u5de5\u5177 OR \u8f6f\u4ef6) -is:retweet lang:zh",
        "label": "\u4e2d\u6587\u9700\u6c42\u4fe1\u53f7",
    },
]

LANG_COLORS = {
    "Python": "#3572A5",
    "JavaScript": "#f1e05a",
    "TypeScript": "#3178c6",
    "Go": "#00ADD8",
    "Rust": "#dea584",
    "Java": "#b07219",
    "C++": "#f34b7d",
    "C": "#555555",
    "C#": "#178600",
    "HTML": "#e34c26",
    "CSS": "#563d7c",
    "Shell": "#89e051",
    "Jupyter Notebook": "#DA5B0B",
    "Swift": "#F05138",
    "Kotlin": "#A97BFF",
    "Dart": "#00B4AB",
    "Vue": "#41b883",
    "PHP": "#4F5D95",
    "Ruby": "#701516",
}

PLATFORM_NAMES = {
    "xiaohongshu": "\u5c0f\u7ea2\u4e66",
    "douyin": "\u6296\u97f3",
    "zhihu": "\u77e5\u4e4e",
    "twitter": "X (Twitter)",
    "reddit": "Reddit",
    "github": "GitHub",
}


def log(*args):
    print("[collect]", *args, flush=True)


def read_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return default


def fetch_bytes(url, headers=None, timeout=30):
    req = urllib.request.Request(url, headers=headers or {"User-Agent": "Need2Build-Collector/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_json(url, headers=None, timeout=30):
    return json.loads(fetch_bytes(url, headers=headers, timeout=timeout).decode("utf-8"))


def esc(value, max_len=1000):
    """转义 HTML，避免平台原文注入页面；同时满足渲染层 innerHTML 的安全要求。"""
    if value is None:
        return ""
    text = html.unescape(str(value)).strip()
    if max_len and len(text) > max_len:
        text = text[: max_len - 1] + "\u2026"
    return html.escape(text, quote=True)


def format_count(n):
    try:
        n = int(n or 0)
    except (TypeError, ValueError):
        return "0"
    if n >= 10000:
        return f"{n / 10000:.1f}\u4e07"
    if n >= 1000:
        return f"{n / 1000:.1f}k"
    return str(n)


def parse_iso(value):
    if not value:
        return None
    text = str(value).strip()
    text = text.replace("Z", "+00:00")
    text = re.sub(r"\s(GMT|UTC)$", "+0000", text)
    try:
        return dt.datetime.fromisoformat(text)
    except ValueError:
        try:
            return parsedate_to_datetime(text)
        except (TypeError, ValueError, OverflowError):
            pass
        try:
            # RFC 822（RSS pubDate）
            return dt.datetime.strptime(text, "%a, %d %b %Y %H:%M:%S %z")
        except ValueError:
            return None


def relative_time(value, now=None):
    parsed = parse_iso(value)
    if not parsed:
        return ""
    now = now or dt.datetime.now(dt.timezone.utc)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    seconds = max(0, int((now - parsed).total_seconds()))
    if seconds < 60:
        return "\u521a\u521a"
    if seconds < 3600:
        return f"{seconds // 60} \u5206\u949f\u524d"
    if seconds < 86400:
        return f"{seconds // 3600} \u5c0f\u65f6\u524d"
    return f"{seconds // 86400} \u5929\u524d"


def fetch_github_projects(now):
    """GitHub REST API：最近 7 天创建、评分较高的新仓库。"""
    created_after = (now - dt.timedelta(days=7)).date().isoformat()
    params = urllib.parse.urlencode(
        {
            "q": f"created:>{created_after} stars:>80 archived:false",
            "sort": "stars",
            "order": "desc",
            "per_page": "24",
        }
    )
    url = f"https://api.github.com/search/repositories?{params}"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Need2Build-Collector/1.0",
    }
    if os.environ.get("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {os.environ['GITHUB_TOKEN']}"

    data = fetch_json(url, headers=headers)
    projects = []
    for item in data.get("items", [])[:24]:
        stars = int(item.get("stargazers_count") or 0)
        license_info = item.get("license") or {}
        pushed = parse_iso(item.get("pushed_at"))
        if pushed:
            age_days = max(0, (now - pushed).days) if pushed.tzinfo else 999
            activity = "\u9ad8\u5ea6\u6d3b\u8dc3" if age_days <= 1 else ("\u6d3b\u8dc3" if age_days <= 7 else "\u4e00\u822c")
            last_update = relative_time(item.get("pushed_at"), now)
        else:
            activity = "\u4e00\u822c"
            last_update = ""

        name = item.get("full_name") or item.get("name") or ""
        language = item.get("language") or "Other"
        topics = item.get("topics") or []
        remix_score = min(96, int(48 + math.log10(max(stars, 10)) * 12))
        projects.append(
            {
                "id": f"gh-{esc(name)}",
                "name": esc(name),
                "fullName": esc(name),
                "description": esc(item.get("description") or "", max_len=300),
                "language": esc(language),
                "langColor": LANG_COLORS.get(language, "#8E8E93"),
                "stars": format_count(stars),
                "forks": format_count(item.get("forks_count")),
                "activity": activity,
                "lastUpdate": last_update,
                "topics": [esc(t) for t in topics[:6]],
                "remixScore": remix_score,
                "remixLevel": "\u6781\u9ad8" if remix_score >= 90 else ("\u9ad8" if remix_score >= 80 else ("\u4e2d\u9ad8" if remix_score >= 70 else "\u4e2d")),
                "license": esc(license_info.get("spdx_id") or "\u5f00\u6e90"),
                "url": esc(item.get("html_url") or f"https://github.com/{name}"),
            }
        )
    return projects


def load_x_config():
    path = ROOT / "config" / "x-queries.json"
    config = read_json(path, {"queries": DEFAULT_X_QUERIES})
    queries = config.get("queries") or DEFAULT_X_QUERIES
    try:
        max_results = max(1, min(100, int(os.environ.get("X_MAX_RESULTS") or config.get("maxResults") or 5)))
    except (TypeError, ValueError):
        max_results = 5
    return queries, max_results


def fetch_x_signals(now):
    """抓取 Twitter 并把结果写入 data/twitter_signals.json（豆包版前端 schema）。"""
    token = (
        os.environ.get("TWITTER_BEARER_TOKEN", "")
        or os.environ.get("X_BEARER_TOKEN", "")
    ).strip()
    if not token:
        return None, "未配置 TWITTER_BEARER_TOKEN，跳过 Twitter 数据"

    queries, max_results = load_x_config()
    signals = []
    seen = set()
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": "Need2Build-Collector/1.0",
    }
    any_success = False
    errors = []

    for entry in queries:
        query = str(entry.get("query") or "").strip()
        if not query:
            continue
        params = urllib.parse.urlencode(
            {
                "query": query,
                "max_results": str(max_results),
                "tweet.fields": "created_at,public_metrics,lang,text,author_id",
                "user.fields": "name,username,url",
                "expansions": "author_id",
            }
        )
        url = f"https://api.x.com/2/tweets/search/recent?{params}"
        try:
            data = fetch_json(url, headers=headers)
            any_success = True
        except Exception as exc:
            detail = f"{type(exc).__name__}: {exc}"
            if hasattr(exc, "read"):
                try:
                    detail = exc.read().decode("utf-8", "replace")[:400]
                except Exception:
                    pass
            errors.append(detail)
            log("X search 失败：", detail)
            continue

        users = {u["id"]: u for u in (data.get("includes") or {}).get("users", [])}
        for tweet in data.get("data") or []:
            tweet_id = str(tweet.get("id") or "")
            if not tweet_id or tweet_id in seen:
                continue
            seen.add(tweet_id)
            user = users.get(tweet.get("author_id") or "", {})
            username = user.get("username") or ""
            metrics = tweet.get("public_metrics") or {}
            text = re.sub(r"\s+", " ", tweet.get("text") or "").strip()
            like_count = int(metrics.get("like_count") or 0)
            retweet_count = int(metrics.get("retweet_count") or 0)
            reply_count = int(metrics.get("reply_count") or 0)
            quote_count = int(metrics.get("quote_count") or 0)
            signals.append(
                {
                    "id": tweet_id,
                    "text": text,
                    "created_at": tweet.get("created_at") or "",
                    "author_name": user.get("name") or "",
                    "author_username": username,
                    "author_avatar": "",
                    "like_count": like_count,
                    "retweet_count": retweet_count,
                    "reply_count": reply_count,
                    "quote_count": quote_count,
                    "engagement_score": like_count + retweet_count * 2 + reply_count * 3 + quote_count * 2,
                    "url": f"https://x.com/{username}/status/{tweet_id}",
                    "source_platform": "Twitter",
                    "region": "海外",
                    "matched_query": entry.get("label") or query,
                }
            )

    if not any_success:
        error_text = "；".join(errors[:3])
        return None, f"Twitter API 请求失败：{error_text or '未知错误'}"

    signals.sort(key=lambda s: s["engagement_score"], reverse=True)
    signals = signals[:30]
    payload = {
        "last_updated": now.isoformat().replace("+00:00", "Z"),
        "total_signals": len(signals),
        "source": "Twitter API v2",
        "signals": signals,
    }
    TWITTER_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    TWITTER_OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return signals, f"成功抓取 {len(signals)} 条 Twitter 信号"


def strip_html(value):
    text = re.sub(r"<[^>]+>", "", value or "")
    return html.unescape(text).strip()


def fetch_rss_feeds(now):
    """从 config/rss-feeds.json 读取 RSS 源（例如自建 RSSHub 的知乎热榜）。"""
    feeds = read_json(ROOT / "config" / "rss-feeds.json", [])
    signals = []
    seen = set()
    for feed in feeds:
        url = str(feed.get("url") or "").strip()
        platform = str(feed.get("platform") or "zhihu")
        if not url:
            continue
        if platform not in PLATFORM_NAMES:
            log("RSS \u914d\u7f6e\u4e2d\u7684 platform \u4e0d\u8bc6\u522b\uff1a", platform)
            continue
        try:
            raw = fetch_bytes(url)
            root = ET.fromstring(raw)
        except Exception as exc:
            log("RSS \u5931\u8d25\uff1a", url, exc)
            continue

        entries = []
        if root.tag.endswith("feed"):
            for entry in root.findall("{http://www.w3.org/2005/Atom}entry"):
                link_el = entry.find("{http://www.w3.org/2005/Atom}link")
                author_el = entry.find("{http://www.w3.org/2005/Atom}author")
                name_el = author_el.find("{http://www.w3.org/2005/Atom}name") if author_el is not None else None
                content_el = entry.find("{http://www.w3.org/2005/Atom}content") or entry.find(
                    "{http://www.w3.org/2005/Atom}summary"
                )
                entries.append(
                    {
                        "title": (entry.findtext("{http://www.w3.org/2005/Atom}title") or "").strip(),
                        "link": (link_el.get("href") if link_el is not None else "").strip(),
                        "desc": content_el.text if content_el is not None else "",
                        "author": name_el.text.strip() if name_el is not None else "",
                        "date": entry.findtext("{http://www.w3.org/2005/Atom}updated")
                        or entry.findtext("{http://www.w3.org/2005/Atom}published")
                        or "",
                    }
                )
        else:
            for item in root.iter("item"):
                entries.append(
                    {
                        "title": (item.findtext("title") or "").strip(),
                        "link": (item.findtext("link") or "").strip(),
                        "desc": item.findtext("description") or "",
                        "author": item.findtext("author")
                        or item.findtext("{http://purl.org/dc/elements/1.1/}creator")
                        or "",
                        "date": item.findtext("pubDate") or "",
                    }
                )

        for entry in entries[:15]:
            link = entry["link"]
            if not link or link in seen:
                continue
            seen.add(link)
            content = f"{entry['title']} {strip_html(entry['desc'])}".strip()
            author = entry["author"] or feed.get("label") or "\u77e5\u4e4e\u70ed\u699c"
            signals.append(
                {
                    "platform": platform,
                    "author": esc(author),
                    "time": relative_time(entry["date"], now),
                    "likes": "",
                    "content": esc(content, max_len=400),
                    "keywords": [esc(feed.get("label") or platform)],
                    "url": esc(link),
                    "isReal": True,
                }
            )
    return signals, f"\u6210\u529f\u6293\u53d6 {len(signals)} \u6761 RSS \u4fe1\u53f7"


def load_manual_signals():
    """抖音/小红书等暂无公开 API 的源，可把经授权或第三方导出的内容放进该文件。"""
    data = read_json(MANUAL_SIGNALS_PATH, {"signals": []})
    raw_signals = data.get("signals", []) if isinstance(data, dict) else []
    signals = []
    for item in raw_signals:
        platform = str(item.get("platform") or "").strip()
        if platform not in PLATFORM_NAMES:
            continue
        signals.append(
            {
                "platform": platform,
                "author": esc(item.get("author") or "\u672a\u77e5"),
                "time": esc(item.get("time") or ""),
                "likes": esc(item.get("likes") or ""),
                "content": esc(item.get("content") or "", max_len=400),
                "keywords": [esc(k) for k in (item.get("keywords") or [])],
                "url": esc(item.get("url") or ""),
                "isReal": True,
            }
        )
    return signals


def expand_env_value(value):
    """把配置里的 ${ENV_NAME} 展开为 GitHub Actions Secret / 环境变量。"""
    if isinstance(value, str):
        def replace(match):
            return os.environ.get(match.group(1), "")
        return re.sub(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}", replace, value)
    if isinstance(value, list):
        return [expand_env_value(item) for item in value]
    if isinstance(value, dict):
        return {key: expand_env_value(item) for key, item in value.items()}
    return value


def deep_get(obj, path):
    """按 a.b.c 路径取值，支持数字下标访问 list。"""
    if path is None:
        return obj
    current = obj
    for part in str(path).split("."):
        if isinstance(current, dict):
            current = current.get(part)
        elif isinstance(current, list) and part.isdigit():
            current = current[int(part)]
        else:
            return None
    return current


def request_json(method, url, headers=None, payload=None):
    headers = headers or {}
    if method == "POST":
        body = json.dumps(payload or {}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            headers={**headers, "Content-Type": "application/json"},
            method="POST",
        )
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def normalize_provider_item(item, field_map):
    """把第三方返回的任意字段结构归一化为页面 signal 结构。"""
    aliases = {
        "content": ["content", "note_desc", "desc", "text", "note_title", "title", "body"],
        "author": ["author", "author_name", "nickname", "user_name", "user.nickname", "author.name"],
        "url": ["url", "note_url", "share_url", "link", "post_url", "detail_url"],
        "likes": ["likes", "like_count", "liked_count", "like_num", "fav_count"],
        "time": ["time", "time_text", "created_at", "publish_time", "pub_time"],
        "keywords": ["keywords", "tags", "topics", "key_words"],
    }

    def pick(ours):
        custom_path = field_map.get(ours) if isinstance(field_map, dict) else None
        if custom_path:
            value = deep_get(item, custom_path)
            if value not in (None, ""):
                return value
        for alias in aliases.get(ours, []):
            value = deep_get(item, alias)
            if value not in (None, ""):
                return value
        return ""

    keywords = pick("keywords")
    if isinstance(keywords, list):
        keyword_list = keywords
    else:
        keyword_list = [k for k in str(keywords).replace("，", ",").split(",") if k.strip()]
    return {
        "content": str(pick("content") or ""),
        "author": str(pick("author") or "\u672a\u77e5"),
        "url": str(pick("url") or ""),
        "likes": str(pick("likes") or ""),
        "time": str(pick("time") or ""),
        "keywords": keyword_list,
    }


def fetch_http_signal_feeds(now):
    """通用第三方数据服务适配器：config/http-signals.json 中每个 feed 支持：
    method / headers(可含 ${SECRET}) / query / signalsPath / fieldMap。
    还支持 label / kind(如 hot-list) / maxItems。
    第三方只需返回 JSON，字段映射在 fieldMap 里配置。
    """
    feeds = read_json(ROOT / "config" / "http-signals.json", [])
    signals = []
    seen = set()
    for raw_feed in feeds:
        if raw_feed.get("enabled") is False:
            continue
        feed = expand_env_value(raw_feed)
        url = str(feed.get("url") or "").strip()
        platform = str(feed.get("platform") or "")
        if not url or platform not in PLATFORM_NAMES:
            continue
        feed_label = str(feed.get("label") or "").strip() or PLATFORM_NAMES.get(platform, platform)
        source_kind = str(feed.get("kind") or "signal").strip() or "signal"
        max_items = int(feed.get("maxItems") or 50)

        method = str(feed.get("method") or "GET").upper()
        if feed.get("query"):
            query_string = urllib.parse.urlencode(feed["query"])
            url = url + ("&" if "?" in url else "?") + query_string

        headers = dict(feed.get("headers") or {})
        headers.setdefault(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        )
        headers.setdefault("Accept", "application/json, text/plain, */*")
        try:
            data = request_json(method, url, headers=headers, payload=feed.get("body"))
        except Exception as exc:
            log("HTTP \u4fe1\u53f7\u6e90\u5931\u8d25\uff1a", url, exc)
            continue

        signals_path = feed.get("signalsPath")
        raw_items = deep_get(data, signals_path) if signals_path else data.get("signals")
        if not isinstance(raw_items, list):
            if isinstance(data, list):
                raw_items = data
            elif isinstance(data.get("data"), list):
                raw_items = data["data"]
            else:
                raw_items = []

        field_map = feed.get("fieldMap") or {}
        added = 0
        for item in raw_items:
            if added >= max_items:
                break
            normalized = normalize_provider_item(item, field_map)
            link = normalized["url"]
            if not link or link in seen:
                continue
            seen.add(link)
            author = normalized["author"]
            if not author or author == "\u672a\u77e5":
                author = feed_label
            raw_time = normalized["time"]
            if raw_time:
                time_display = relative_time(raw_time, now) or raw_time
            else:
                time_display = "\u521a\u521a"
            signals.append(
                {
                    "platform": platform,
                    "author": esc(author),
                    "time": esc(time_display),
                    "likes": esc(normalized["likes"]),
                    "content": esc(normalized["content"], max_len=400),
                    "keywords": [esc(k) for k in normalized["keywords"][:6]],
                    "url": esc(link),
                    "isReal": True,
                    "sourceKind": esc(source_kind),
                    "sourceLabel": esc(feed_label),
                }
            )
            added += 1
    return signals, f"\u6210\u529f\u6293\u53d6 {len(signals)} \u6761 HTTP \u4fe1\u53f7"


def dedupe_signals(groups):
    out = []
    seen = set()
    for group in groups:
        for item in group:
            key = item["url"] or f"{item['platform']}-{item['content'][:60]}"
            if key in seen:
                continue
            seen.add(key)
            out.append(item)
    return out


def build_summary(signals, projects, notes):
    platform_counts = {}
    for s in signals:
        platform_counts[s["platform"]] = platform_counts.get(s["platform"], 0) + 1
    top_platforms = sorted(platform_counts.items(), key=lambda kv: kv[1], reverse=True)
    hot_platforms = {s.get("platform") for s in signals if s.get("sourceKind") == "hot-list"}

    trend_items = []
    if top_platforms:
        for i, (pid, count) in enumerate(top_platforms[:3], start=1):
            name = PLATFORM_NAMES.get(pid, pid)
            if pid in hot_platforms:
                title = f"{name}\u5b9e\u65f6\u70ed\u699c"
            else:
                title = f"{name}\u9700\u6c42\u4fe1\u53f7"
            trend_items.append(
                {
                    "id": i,
                    "title": title,
                    "value": f"{count} \u6761",
                    "desc": "\u6700\u8fd1\u4e00\u8f6e\u81ea\u52a8\u6293\u53d6\u7684\u53ef\u6838\u9a8c\u4fe1\u53f7",
                }
            )
    if len(trend_items) < 3:
        trend_items.append(
            {
                "id": len(trend_items) + 1,
                "title": "\u5f85\u63a5\u5165\u6e90",
                "value": "\u2192",
                "desc": "\u914d\u7f6e X Bearer Token / RSS / \u624b\u5de5\u5bfc\u5165\u540e\u81ea\u52a8\u663e\u793a",
            }
        )

    platform_names = "\u00b7".join(PLATFORM_NAMES.get(p, p) for p in sorted(platform_counts))
    dashboard = [
        {
            "value": str(len(signals)),
            "change": "",
            "changeType": "",
            "label": "\u5b9e\u65f6\u4fe1\u53f7",
            "desc": "\u6700\u8fd1\u4e00\u8f6e\u81ea\u52a8\u6293\u53d6\u7684\u53ef\u6838\u9a8c\u4fe1\u53f7",
        },
        {
            "value": str(len(projects)),
            "change": "",
            "changeType": "",
            "label": "GitHub \u65b0\u9879\u76ee",
            "desc": "\u8fd1 7 \u5929\u521b\u5efa\u4e14\u8f83\u6d3b\u8dc3\u7684\u5f00\u6e90\u4ed3\u5e93",
        },
        {
            "value": str(len(platform_counts)),
            "change": "",
            "changeType": "",
            "label": "\u63a5\u5165\u6570\u636e\u6e90",
            "desc": platform_names or "\u5c1a\u672a\u63a5\u5165",
            "platforms": True,
        },
    ]
    return trend_items, dashboard


def main():
    now = dt.datetime.now(dt.timezone.utc)
    notes = []
    projects = []
    signals = []

    try:
        projects = fetch_github_projects(now)
        notes.append(f"GitHub\uff1a\u6210\u529f\u6293\u53d6 {len(projects)} \u4e2a\u4ed3\u5e93")
    except Exception as exc:
        notes.append(f"GitHub\uff1a\u5931\u8d25 {exc}")

    # Twitter 结果写入 data/twitter_signals.json 交给 loadRealTwitterSignals() 展示，
    # 不放进 live-data，避免与豆包版前端逻辑重复
    _, twitter_note = fetch_x_signals(now)
    notes.append(f"Twitter\uff1a{twitter_note}")

    rss_signals, rss_note = fetch_rss_feeds(now)
    signals.extend(rss_signals)
    notes.append(f"RSS\uff1a{rss_note}")

    http_signals, http_note = fetch_http_signal_feeds(now)
    signals.extend(http_signals)
    notes.append(f"\u7b2c\u4e09\u65b9HTTP\uff1a{http_note}")

    manual = load_manual_signals()
    signals.extend(manual)
    notes.append(f"\u624b\u5de5\u5bfc\u5165\uff1a{len(manual)} \u6761")

    signals = dedupe_signals([signals])

    if not projects and not signals:
        log("所有数据源都失败了，保留上一次的 live-data.json")
        return 1

    trends, dashboard = build_summary(signals, projects, notes)
    shanghai_time = now.astimezone(dt.timezone(dt.timedelta(hours=8)))
    dashboard.append(
        {
            "value": shanghai_time.strftime("%H:%M"),
            "change": "",
            "changeType": "",
            "label": "\u672c\u6b21\u5237\u65b0",
            "desc": "\u6bcf 2 \u5c0f\u65f6\u81ea\u52a8\u6293\u53d6\u4e00\u6b21\uff08\u5317\u4eac\u65f6\u95f4\uff09",
        }
    )
    payload = {
        "updatedAt": now.isoformat().replace("+00:00", "Z"),
        "signals": signals,
        "projects": projects,
        "trends": trends,
        "dashboard": dashboard,
        "sourceNotes": notes,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    log(f"\u5df2\u751f\u6210 {OUTPUT_PATH}")
    for note in notes:
        log("  -", note)
    return 0


if __name__ == "__main__":
    sys.exit(main())
