#!/usr/bin/env node
/**
 * Need2Build · 需求雷达
 * =====================
 * 把「平台词表 → 关联词扩散 → 需求 → 开源项目」串成一条可重复运行的链。
 *
 * 输入（都不需要人工挑词）：
 *   data/need-radar-raw.json       平台词池 + 各词的关联分析结果
 *   data/douyin-topic-sheet.json   已有的赛道词分析（作为补充扩散源）
 *
 * 输出：
 *   data/need-radar.json           本轮机会卡
 *
 * 用法：
 *   node scripts/need-radar.mjs                  # 完整跑（含 GitHub 匹配）
 *   node scripts/need-radar.mjs --no-github      # 离线跑，只出需求
 *   node scripts/need-radar.mjs --top 12         # 只处理前 12 个种子
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyWord, normalizePairs, isCityName } from './demand-shapes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_PATH = path.join(ROOT, 'data', 'need-radar-raw.json');
const SHEET_PATH = path.join(ROOT, 'data', 'douyin-topic-sheet.json');
const XHS_PATH = path.join(ROOT, 'data', 'xhs-need-raw.json');
const OUT_PATH = path.join(ROOT, 'data', 'need-radar.json');

const MIN_NEED_WORDS = 2;

/**
 * 品类英译词表：GitHub 搜索对纯中文查询几乎不过滤（会返回一堆高星无关仓库），
 * 所以每个赛道种子配一组英文检索词。这只是「翻译词典」，不是人工挑词——
 * 种子依然全部来自平台词表。新赛道按需往下加即可。
 *
 * 选词原则（2026-10-05 人工校准）：
 *   1. 用 GitHub 上真实存在的 topic 名，优先「行业+动作」的复合词；
 *   2. 避开含义过宽的单词——healthcare 会带出 ERP，aging 会带出人脸变老，
 *      storage 会带出云存储，cake/coffee 会带出构建工具和闲聊仓库；
 *   2b. 也要避开「被别的领域占用」的常见词，实测踩到的：
 *      gym → OpenAI Gym 强化学习、espresso → 安卓测试框架、insomnia → API 客户端、
 *      tcm → 安全培训课程、recipes → Git 中文教程；
 *   3. 宁可返回空，也不要塞进一条不相关的项目。
 */
const CATEGORY_EN = {
    '养生': ['wellness', 'health-monitoring'],
    '减肥': ['weight-loss', 'fitness', 'diet'],
    '亲子游': ['travel-planning', 'family-travel', 'itinerary'],
    '副业': ['side-hustle', 'indie-hacker', 'monetization'],
    '零食': ['snack', 'grocery'],
    '养老': ['elderly-care', 'senior-care', 'assisted-living', 'eldercare'],
    '辅食': ['baby-food', 'weaning', 'baby-tracker'],
    '考研': ['exam-prep', 'flashcards'],
    '简历': ['resume', 'cv-builder', 'resume-builder'],
    '考公': ['exam-prep', 'civil-service'],
    '健身': ['fitness', 'workout'],
    '收纳': ['home-organization', 'interior-design', 'furniture'],
    '宠物': ['pet', 'veterinary', 'pet-care'],
    '咖啡': ['coffee', 'coffee-shop'],
    '营养': ['nutrition', 'diet-tracking', 'calorie-tracker'],
    '中医': ['traditional-chinese-medicine', 'chinese-medicine'],
    '口腔': ['dental', 'dentistry', 'oral-health'],
    '蛋糕': ['baking'],
    '海鲜': ['seafood', 'grocery'],
    '装修': ['interior-design', 'home-renovation', 'home-improvement'],
    '火锅': ['food-delivery', 'restaurant-management'],

    // 词池里其它可能成为种子的赛道，先备好
    '儿童': ['parenting', 'early-education', 'kids'],
    '早教': ['early-education', 'parenting'],
    '英语': ['english-learning', 'language-learning'],
    '学习': ['study-tools', 'note-taking'],
    '拍照': ['photography', 'camera'],
    '摄影': ['photography', 'camera'],
    '剪辑': ['video-editing'],
    '穿搭': ['fashion', 'wardrobe'],
    '衣服': ['fashion', 'ecommerce'],
    '汽车': ['car', 'automotive'],
    '二手车': ['used-cars', 'automotive'],
    '酒店': ['hotel', 'booking'],
    '旅游': ['travel', 'travel-planning'],
    '电影': ['movie', 'film'],
    '游戏': ['game', 'gamedev'],
    '手机': ['mobile', 'android'],
    '黄金': ['gold', 'finance'],
    '保险': ['insurance'],
    '厨房': ['kitchen', 'cooking'],
    '设计': ['design-tools'],
    '皮肤': ['skincare', 'dermatology'],
    '牙齿': ['dental', 'teeth'],
    '疼痛': ['pain-management', 'health-monitoring'],
    '关节': ['orthopedics', 'health-monitoring'],
    '减肥餐': ['nutrition', 'meal-planning'],
    '睡眠': ['sleep', 'sleep-tracking'],
    '理财': ['personal-finance', 'budgeting'],
    '家庭理财': ['personal-finance', 'budgeting']
};

function log(...args) {
    console.log(...args);
}

function readJson(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return fallback;
    }
}

/** 合并三个来源的扩散结果：抖音词池 + 已有赛道表 + 小红书筛选词。 */
function loadExpansions() {
    const raw = readJson(RAW_PATH, {});
    const sheet = readJson(SHEET_PATH, null);
    const xhs = readJson(XHS_PATH, null);
    const sources = new Map(); // `${platform}:${seed}` -> {seed, platform, rows, origin}

    for (const [seed, pairs] of Object.entries(raw.expansions || {})) {
        sources.set(`douyin:${seed}`, { seed, platform: 'douyin', rows: normalizePairs(pairs), origin: 'platform-pool' });
    }
    for (const topic of sheet?.topics || []) {
        if (!topic.keyword) continue;
        const key = `douyin:${topic.keyword}`;
        const existing = sources.get(key);
        const rows = normalizePairs(topic.relatedWords);
        if (existing) {
            existing.rows = existing.rows.concat(rows);
        } else {
            sources.set(key, { seed: topic.keyword, platform: 'douyin', rows, origin: topic.origin || 'sheet' });
        }
    }
    for (const [seed, words] of Object.entries(xhs?.expansions || {})) {
        if (!words || !words.length) continue;
        sources.set(`xiaohongshu:${seed}`, {
            seed,
            platform: 'xiaohongshu',
            rows: normalizePairs(words),
            origin: 'xhs-filter'
        });
    }
    return { raw, sheet, xhs, sources };
}

/** 一个种子词 → 一张机会卡（含需求方向 + 缺口）。 */
function buildOpportunity(seed, platform, rows, origin) {
    const evidence = [];
    const unmatched = [];
    const geoHints = [];
    const shapeGroups = new Map();

    for (const row of rows) {
        // 地名词是平台的地域筛选器，只作为「本地意图」展示，不计入需求证据
        if (isCityName(row.word)) {
            geoHints.push(row.word);
            continue;
        }
        const shape = classifyWord(row.word);
        if (!shape) {
            unmatched.push(row.word);
            continue;
        }
        evidence.push({ word: row.word, value: row.value ?? null, shape: shape.label, shapeId: shape.id });
        if (!shapeGroups.has(shape.id)) {
            shapeGroups.set(shape.id, { shapeId: shape.id, shape: shape.label, words: [] });
        }
        const group = shapeGroups.get(shape.id);
        if (!group.words.includes(row.word)) group.words.push(row.word);
    }

    if (evidence.length < MIN_NEED_WORDS) return null;

    const directions = [...shapeGroups.values()].sort((a, b) => b.words.length - a.words.length);
    return {
        id: `opp-${platform}-${seed}`,
        seed,
        platform,
        origin,
        status: '可验证',
        demandWordCount: evidence.length,
        relatedWordCount: rows.length,
        directionCount: directions.length,
        directions,
        demandEvidence: evidence,
        geoHints: [...new Set(geoHints)].slice(0, 8),
        unmatchedSample: unmatched.slice(0, 8),
        gaps: [
            '关联词的数值是相关性(0-100)，不是搜索量；要绝对强度需逐词查指数页',
            '还没有真人原话，需要按词去内容平台取证'
        ],
        projects: []
    };
}

async function fetchSearch(query, token) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=8`;
    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Need2Build-NeedRadar/1.0'
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    let resp;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        // 加超时，避免请求挂住把整轮拖成几十分钟
        resp = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
        // 未登录搜索接口是 10 次/分钟，撞上限就退避重试
        if (resp.status !== 403 && resp.status !== 429) break;
        const waitMs = 15000 * (attempt + 1);
        log(`  （GitHub 限流，等待 ${waitMs / 1000}s 后重试）`);
        await new Promise(r => setTimeout(r, waitMs));
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
}

async function githubSearch(terms, token) {
    // 两层检索，精度优先：
    //   第一层只认 topic 人工标注；第二层退回「词出现在仓库名或 topics」。
    // 故意不搜 description——全文检索会把「easy as cake」「:coffee:」这类单词撞车放进来。
    const tiers = [
        `(${terms.map(t => `topic:${t}`).join(' OR ')}) stars:>10`,
        `(${terms.map(t => `${t} in:name,topics`).join(' OR ')}) stars:>10`
    ];
    let data = { items: [] };
    for (const query of tiers) {
        data = await fetchSearch(query, token);
        if ((data.items || []).length) break;
    }
    const lowered = terms.map(t => t.toLowerCase());
    return (data.items || [])
        .map(item => ({
            name: item.full_name,
            stars: item.stargazers_count,
            description: (item.description || '').slice(0, 120),
            topics: item.topics || [],
            language: item.language || '',
            url: item.html_url
        }))
        // 相关性闸门：检索词必须真的出现在名称/描述/topics 里，挡掉高星无关仓库
        .filter(p => {
            const hay = `${p.name} ${p.description} ${p.topics.join(' ')}`.toLowerCase();
            return lowered.some(t => hay.includes(t));
        })
        .slice(0, 3);
}

async function matchProjects(opportunities, { enabled, token }) {
    if (!enabled) return { matched: 0, errors: [] };
    const errors = [];
    let matched = 0;
    for (const opp of opportunities) {
        try {
            // 用需求词里最靠前的一个去搜，比用宽泛的种子词更准
            const probe = opp.directions[0]?.words?.[0] || opp.seed;
            const terms = CATEGORY_EN[opp.seed] || [opp.seed];
            opp.projects = await githubSearch(terms, token);
            opp.projectProbe = probe;
            if (opp.projects.length) matched += 1;
        } catch (err) {
            errors.push(`${opp.seed}: ${err.message}`);
            opp.projects = [];
        }
        // 带 token 时配额 30 次/分钟，未登录只有 10 次/分钟
        await new Promise(r => setTimeout(r, token ? 1500 : 9000));
    }
    return { matched, errors };
}

async function main() {
    const args = process.argv.slice(2);
    const noGithub = args.includes('--no-github');
    const topFlag = args.indexOf('--top');
    const top = topFlag >= 0 ? Number(args[topFlag + 1]) || 0 : 0;

    const { raw, sources } = loadExpansions();
    if (sources.size === 0) {
        log('× 没有可用的扩散数据，先运行一次抓取。');
        return 1;
    }

    const opportunities = [];
    const rejected = [];
    for (const [, { seed, platform, rows, origin }] of sources) {
        const opp = buildOpportunity(seed, platform, rows, origin);
        if (opp) opportunities.push(opp);
        else rejected.push({ seed, platform, rows: rows.length, reason: rows.length ? `需求形状词 < ${MIN_NEED_WORDS}` : '无关联词数据' });
    }

    opportunities.sort((a, b) =>
        b.directionCount - a.directionCount ||
        b.demandWordCount - a.demandWordCount ||
        a.platform.localeCompare(b.platform)
    );
    const picked = top > 0 ? opportunities.slice(0, top) : opportunities;

    const token = process.env.GITHUB_TOKEN || '';
    const gh = await matchProjects(picked, { enabled: !noGithub, token });

    const poolWords = Object.values(raw.seedPool || {}).reduce((n, list) => n + list.length, 0);
    const byPlatform = {};
    for (const opp of picked) byPlatform[opp.platform] = (byPlatform[opp.platform] || 0) + 1;
    const payload = {
        generatedAt: new Date().toISOString(),
        source: raw.source || '抖音指数',
        poolDomains: Object.keys(raw.seedPool || {}).length,
        poolWords,
        seedCount: sources.size,
        sources: byPlatform,
        opportunityCount: picked.length,
        projectsMatched: gh.matched,
        errors: gh.errors,
        opportunities: picked,
        rejected
    };
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');

    log('');
    log('=== Need2Build · 需求雷达 ===');
    log(`平台词池：${payload.poolDomains} 个领域 / ${poolWords} 个词（零人工挑词）`);
    log(`扩散种子：${sources.size} 个 · 成机会 ${picked.length} 张 · 匹配到项目 ${gh.matched} 张`);
    log(`来源分布：${Object.entries(byPlatform).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    if (gh.errors.length) log(`GitHub 匹配失败 ${gh.errors.length} 个：${gh.errors.slice(0, 3).join('；')}`);
    log('');

    for (const opp of picked) {
        log(`[${opp.platform}] ${opp.seed} — 需求词 ${opp.demandWordCount}/${opp.relatedWordCount} · 方向 ${opp.directionCount} 类 · ${opp.origin}`);
        opp.directions.forEach(d => log(`    需求方向 · ${d.shape}：${d.words.join('、')}`));
        if (opp.geoHints.length) log(`    地域意图 · ${opp.geoHints.join('、')}`);
        if (opp.projects.length) {
            opp.projects.forEach(p => log(`    开源项目 · ${p.name} ★${p.stars} ${p.description}`));
        } else if (!noGithub) {
            log('    开源项目 · 未匹配到');
        }
        log('');
    }

    if (rejected.length) {
        log(`未成机会（${rejected.length} 个）：` + rejected.slice(0, 10).map(r => `${r.seed}(${r.reason})`).join('、'));
        log('');
    }
    log(`完整结果：${path.relative(ROOT, OUT_PATH)}`);
    return 0;
}

process.exit(await main());
