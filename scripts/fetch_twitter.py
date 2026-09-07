#!/usr/bin/env python3
"""
Need2Build - Twitter 需求信号抓取脚本
从 Twitter 搜索高曝光需求，输出为 JSON 供前端读取
"""

import os
import json
import time
import urllib.request
import urllib.parse
from datetime import datetime, timezone

# 搜索关键词列表（覆盖常见的需求表达）
SEARCH_QUERIES = [
    "need an app that",
    "looking for a tool that",
    "wish there was an app",
    "is there an app that",
    "anyone know a tool",
    "recommend a tool for",
    "need a website that",
    "looking for software that",
]

# 每个关键词最多抓取的推文数
MAX_PER_QUERY = 10
# 输出文件路径
OUTPUT_FILE = "data/twitter_signals.json"

def make_request(url, headers):
    """发送 HTTP 请求，返回 JSON 数据"""
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"请求失败: {e}")
        return None

def get_user_info(user_id, headers):
    """获取用户信息"""
    url = f"https://api.twitter.com/2/users/{user_id}?user.fields=name,username,profile_image_url"
    data = make_request(url, headers)
    if data and "data" in data:
        return data["data"]
    return None

def search_tweets(query, bearer_token, max_results=10):
    """搜索推文"""
    headers = {
        "Authorization": f"Bearer {bearer_token}",
        "Content-Type": "application/json",
    }
    
    # 构建查询参数
    params = {
        "query": f"{query} -is:retweet lang:en",
        "max_results": max_results,
        "tweet.fields": "created_at,public_metrics,source",
        "expansions": "author_id",
        "user.fields": "name,username,profile_image_url",
    }
    
    url = f"https://api.twitter.com/2/tweets/search/recent?{urllib.parse.urlencode(params)}"
    data = make_request(url, headers)
    
    if not data or "data" not in data:
        print(f"  未找到结果: {query}")
        return []
    
    tweets = data["data"]
    users = {u["id"]: u for u in data.get("includes", {}).get("users", [])}
    
    results = []
    for tweet in tweets:
        author = users.get(tweet["author_id"], {})
        metrics = tweet.get("public_metrics", {})
        
        # 计算互动总分（用于排序）
        engagement = (
            metrics.get("like_count", 0) * 1 +
            metrics.get("retweet_count", 0) * 2 +
            metrics.get("reply_count", 0) * 3 +
            metrics.get("quote_count", 0) * 2
        )
        
        results.append({
            "id": tweet["id"],
            "text": tweet["text"],
            "created_at": tweet.get("created_at", ""),
            "author_name": author.get("name", "Unknown"),
            "author_username": author.get("username", "unknown"),
            "author_avatar": author.get("profile_image_url", ""),
            "like_count": metrics.get("like_count", 0),
            "retweet_count": metrics.get("retweet_count", 0),
            "reply_count": metrics.get("reply_count", 0),
            "quote_count": metrics.get("quote_count", 0),
            "engagement_score": engagement,
            "url": f"https://twitter.com/{author.get('username', 'unknown')}/status/{tweet['id']}",
            "source_platform": "Twitter",
            "region": "海外",
            "matched_query": query,
        })
    
    return results

def main():
    # 从环境变量读取 Token
    bearer_token = os.environ.get("TWITTER_BEARER_TOKEN", "")
    if not bearer_token:
        print("错误: 未设置 TWITTER_BEARER_TOKEN 环境变量")
        return
    
    print(f"开始抓取 Twitter 需求信号...")
    print(f"搜索关键词数: {len(SEARCH_QUERIES)}")
    
    all_tweets = []
    seen_ids = set()
    
    for i, query in enumerate(SEARCH_QUERIES):
        print(f"[{i+1}/{len(SEARCH_QUERIES)}] 搜索: {query}")
        tweets = search_tweets(query, bearer_token, MAX_PER_QUERY)
        
        for tweet in tweets:
            if tweet["id"] not in seen_ids:
                seen_ids.add(tweet["id"])
                all_tweets.append(tweet)
        
        # 避免请求过快
        time.sleep(1)
    
    # 按互动分数排序
    all_tweets.sort(key=lambda x: x["engagement_score"], reverse=True)
    
    # 只保留前 30 条
    all_tweets = all_tweets[:30]
    
    # 构建输出数据
    output = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_signals": len(all_tweets),
        "source": "Twitter API v2",
        "signals": all_tweets,
    }
    
    # 写入文件
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n抓取完成！共 {len(all_tweets)} 条需求信号")
    print(f"已保存到: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
