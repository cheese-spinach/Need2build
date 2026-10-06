#!/usr/bin/env node
/**
 * Need2Build · 单平台需求验证通道（抖音 / 巨量算数）
 * =================================================
 * 目的：在接入任何自动采集之前，先用少量真实案例验证「话题 → 搜索意图 → 需求 → 机会」这条判定链。
 *
 * 设计原则（对应 P0「信号源是热榜不是需求」）：
 *   1. 热榜只做话题发现，永远不能单独产出机会卡。
 *   2. 只有带「需求形状」的搜索关联词达到数量门槛，才允许成卡。
 *   3. v1 不产出 0-100 综合分。原来那个 82 分正是热度伪装成需求的产物，
 *      在阈值校准之前，这里只输出可核对的原始证据。
 *   4. 缺什么就明确写进 gaps，不拿内容热度补位。
 *
 * 用法：
 *   node scripts/topic-radar.mjs seed [--limit 12]   # 从 js/live-data.json 的抖音热榜生成待填表
 *   node scripts/topic-radar.mjs report              # 打印待查清单 + 已成型的机会卡
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIVE_DATA_PATH = path.join(ROOT, 'js', 'live-data.json');
const SHEET_PATH = path.join(ROOT, 'data', 'douyin-topic-sheet.json');
const OUT_PATH = path.join(ROOT, 'data', 'douyin-opportunities.json');

const PLATFORM = 'douyin';
const SOURCE_NAME = '巨量算数';

const DEFAULTS = {
    // 成卡门槛：至少几个「需求形状」关联词
    minNeedWords: 2,
    // 话题层榜单取多少条进入待查表
    seedLimit: 12
};

/**
 * 需求形状：判断一个搜索关联词是否表达了「未被满足的意图」。
 * 关键词命中即算，一个词只归到第一个命中的形状（顺序即优先级）。
 */
const DEMAND_SHAPES = [
    {
        id: 'choice',
        label: '选型决策',
        patterns: ['推荐', '哪个好', '哪款', '怎么选', '如何选择', '怎么挑', '对比', '区别', '排行', '榜单', '值不值', '值得', '择校', '报录比', '分数线', '效果图', '好去处', '性价比', '最有效', '最靠谱']
    },
    {
        id: 'howto',
        label: '求解教程',
        patterns: ['怎么', '如何', '怎样', '教程', '攻略', '步骤', '方法', '技巧', '流程', '注意事项', '指南', '难吗', '有多难', '难不难', '能不能', '可不可以']
    },
    {
        id: 'tool',
        label: '工具获取',
        patterns: ['app', '软件', '工具', '小程序', '网站', '平台', '插件', '模板', '脚本', '自动化', '下载', '安装', '监测', '检测', '查询', '计算']
    },
    {
        id: 'cost',
        label: '成本门槛',
        patterns: ['多少钱', '价格', '费用', '免费', '便宜', '贵吗', '成本', '预算', '省钱', '划算']
    },
    {
        id: 'service',
        label: '服务诉求',
        patterns: ['医院', '机构', '培训', '报班', '师傅', '上门', '维修', '搬家', '殡葬', '护理', '月嫂', '保姆', '团购', '训练营', '保险', '证件照', '招聘', '中介'],
        suffixes: ['店', '馆', '所', '公司']
    },
    {
        id: 'purchase',
        label: '品类求购',
        suffixes: ['机', '锅', '器材', '用品', '神器', '设备', '仪器', '眼罩', '面膜', '套装', '套餐', '产品', '零食', '食品', '餐', '壶', '垫', '椅', '箱', '架', '包', '册', '柜', '刀', '仪']
    },
    {
        id: 'crowd',
        label: '人群长尾',
        patterns: ['宝妈', '大学生', '上班族', '新手', '学生党', '兼职', '赚钱', '带娃', '独居', '老年人', '孕妇', '应届生', '就业', '退休', '老人', '宝宝']
    },
    {
        id: 'alt',
        label: '替代平替',
        patterns: ['平替', '替代', '类似']
    },
    {
        id: 'trust',
        label: '验证口碑',
        patterns: ['靠谱吗', '有用吗', '真的吗', '测评', '评价', '口碑', '踩坑', '难吃', '质量', '真假', '智商税']
    },
    {
        id: 'local',
        label: '地域就近',
        patterns: ['附近', '本地', '同城', '周边', '周末', '短途', '一日游', '两日游', '三天两晚']
    }
];

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

function parseCount(raw) {
    const text = String(raw ?? '').trim();
    const num = parseFloat(text.replace(/[^\d.]/g, '')) || 0;
    if (text.includes('亿')) return Math.round(num * 1e8);
    if (/万|w/i.test(text)) return Math.round(num * 1e4);
    if (/k/i.test(text)) return Math.round(num * 1e3);
    return Math.round(num);
}

/** 关联词允许三种写法：字符串 / 逗号分隔字符串 / 对象数组，降低手工填写成本。 */
function normalizeRelated(raw) {
    if (raw == null || raw === '') return [];
    if (typeof raw === 'string') {
        return raw
            .split(/[,，、\n]/)
            .map(s => s.trim())
            .filter(Boolean)
            .map(word => ({ word, searchIndex: null }));
    }
    if (!Array.isArray(raw)) return [];
    return raw
        .map(item => {
            if (typeof item === 'string') return { word: item.trim(), searchIndex: null };
            if (item && typeof item === 'object') {
                const word = String(item.word ?? item.text ?? item.kw ?? '').trim();
                const searchIndex = item.searchIndex ?? item.correlation ?? item.index ?? item.value ?? item.score ?? null;
                return word ? { word, searchIndex } : null;
            }
            return null;
        })
        .filter(Boolean);
}

function classifyWord(word) {
    const text = String(word || '').toLowerCase();
    for (const shape of DEMAND_SHAPES) {
        for (const pattern of shape.patterns || []) {
            if (text.includes(pattern.toLowerCase())) {
                return { id: shape.id, label: shape.label, matched: pattern };
            }
        }
        for (const suffix of shape.suffixes || []) {
            if (text.length > suffix.length && text.endsWith(suffix.toLowerCase())) {
                return { id: shape.id, label: shape.label, matched: `*${suffix}` };
            }
        }
    }
    return null;
}

function douyinSearchUrl(word) {
    return `https://www.douyin.com/search/${encodeURIComponent(word)}`;
}

// ===== seed：生成/补充待填表 =====
function seedTopics(limit) {
    const live = readJson(LIVE_DATA_PATH, null);
    if (!live || !Array.isArray(live.signals)) {
        log(`× 读不到 ${path.relative(ROOT, LIVE_DATA_PATH)}，无法生成话题表。`);
        return 1;
    }

    const hotTopics = live.signals
        .filter(s => s.platform === PLATFORM)
        .map(s => ({
            title: String(s.content || '').trim(),
            hotValue: parseCount(s.likes),
            url: s.url || ''
        }))
        .filter(t => t.title)
        .sort((a, b) => b.hotValue - a.hotValue)
        .slice(0, limit);

    const hotListDate = String(live.updatedAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    const existing = readJson(SHEET_PATH, null);

    if (!existing) {
        const sheet = {
            platform: PLATFORM,
            sourceName: SOURCE_NAME,
            note: '在巨量算数「关键词分析」里补全 keyword / searchIndex / contentIndex / relatedWords；没查到的字段保持 null，不要猜测填写。',
            hotListDate,
            thresholds: { ...DEFAULTS },
            topics: hotTopics.map((t, i) => ({
                id: `dy-t${String(i + 1).padStart(2, '0')}`,
                rank: i + 1,
                title: t.title,
                hotValue: t.hotValue,
                url: t.url,
                keyword: null,
                searchIndex: null,
                contentIndex: null,
                relatedWords: []
            }))
        };
        fs.mkdirSync(path.dirname(SHEET_PATH), { recursive: true });
        fs.writeFileSync(SHEET_PATH, JSON.stringify(sheet, null, 2) + '\n', 'utf8');
        log(`√ 已生成待填表：${path.relative(ROOT, SHEET_PATH)}（${sheet.topics.length} 个话题）`);
        return 0;
    }

    // 已有表：只追加新话题，绝不覆盖已填写的内容
    const known = new Set(existing.topics.map(t => t.title));
    const fresh = hotTopics.filter(t => !known.has(t.title));
    if (fresh.length === 0) {
        log(`√ 待填表已是最新：${path.relative(ROOT, SHEET_PATH)}（${existing.topics.length} 个话题）`);
        return 0;
    }
    let nextRank = existing.topics.reduce((max, t) => Math.max(max, Number(t.rank) || 0), 0);
    for (const t of fresh) {
        nextRank += 1;
        existing.topics.push({
            id: `dy-t${String(nextRank).padStart(2, '0')}`,
            rank: nextRank,
            title: t.title,
            hotValue: t.hotValue,
            url: t.url,
            keyword: null,
            searchIndex: null,
            contentIndex: null,
            relatedWords: []
        });
    }
    fs.writeFileSync(SHEET_PATH, JSON.stringify(existing, null, 2) + '\n', 'utf8');
    log(`√ 待填表新增 ${fresh.length} 个话题：${path.relative(ROOT, SHEET_PATH)}（共 ${existing.topics.length} 个）`);
    return 0;
}

// ===== report：应用门禁并产出机会卡 =====
function buildCards(sheet) {
    const minNeedWords = Number(sheet.thresholds?.minNeedWords ?? DEFAULTS.minNeedWords);
    const metricLabel = sheet.metricLabel || '搜索指数';
    const subjectLabel = sheet.subjectMetricLabel || metricLabel;
    const cards = [];
    const rejected = [];
    const unmatchedAll = [];
    let analyzedCount = 0;

    for (const topic of sheet.topics || []) {
        const related = normalizeRelated(topic.relatedWords);
        const evidence = [];
        const unmatched = [];
        const shapesSeen = new Set();
        if (topic.keyword) analyzedCount += 1;

        for (const item of related) {
            const shape = classifyWord(item.word);
            if (!shape) {
                unmatched.push(item.word);
                continue;
            }
            shapesSeen.add(shape.id);
            evidence.push({
                word: item.word,
                searchIndex: item.searchIndex ?? null,
                shape: shape.label,
                shapeId: shape.id,
                matched: shape.matched
            });
        }
        if (topic.keyword) unmatchedAll.push(...unmatched);

        if (evidence.length < minNeedWords) {
            rejected.push({
                title: topic.title,
                keyword: topic.keyword || null,
                origin: topic.origin || 'hot-list',
                reason: topic.keyword
                    ? `需求形状关联词 ${evidence.length}/${minNeedWords} 个，未达门槛`
                    : '尚未填写关键词分析（无搜索意图证据）',
                needWords: evidence.map(e => e.word),
                relatedCount: related.length,
                unmatchedSample: unmatched.slice(0, 8)
            });
            continue;
        }

        const missing = [];
        if (topic.searchIndex == null) missing.push(`「${topic.keyword || topic.title}」${subjectLabel}未填`);
        const unfilled = evidence.filter(e => e.searchIndex == null);
        if (unfilled.length) missing.push(`${unfilled.length} 个需求词未填${metricLabel}`);

        evidence.sort((a, b) => (b.searchIndex ?? -1) - (a.searchIndex ?? -1));

        // 把同一类需求形状的词聚成一个「需求方向」，让卡片读起来像机会而不是词表
        const shapeGroups = new Map();
        for (const e of evidence) {
            if (!shapeGroups.has(e.shapeId)) {
                shapeGroups.set(e.shapeId, { shapeId: e.shapeId, shape: e.shape, words: [] });
            }
            shapeGroups.get(e.shapeId).words.push(e.word);
        }
        const directions = [...shapeGroups.values()].sort((a, b) => b.words.length - a.words.length);

        cards.push({
            id: topic.id,
            platform: sheet.platform,
            sourceName: sheet.sourceName || SOURCE_NAME,
            origin: topic.origin || 'hot-list',
            title: topic.keyword ? `${topic.keyword}｜${topic.title}` : topic.title,
            // 门禁只由需求证据决定：主体指数缺失只记为待补，不降级
            status: '可验证',
            dataComplete: missing.length === 0,
            topic: {
                rank: topic.rank,
                title: topic.title,
                hotValue: topic.hotValue ?? null,
                url: topic.url || ''
            },
            subject: {
                keyword: topic.keyword || null,
                searchIndex: topic.searchIndex ?? null,
                contentIndex: topic.contentIndex ?? null
            },
            demandEvidence: evidence,
            directions,
            needWordCount: evidence.length,
            demandShapeCount: shapesSeen.size,
            // 证据层级只反映「需求形状覆盖了几类」，刻意不用 0-100 分
            evidenceLevel: Math.min(3, shapesSeen.size),
            missingData: missing,
            relatedCount: related.length,
            unmatchedCount: unmatched.length,
            unmatchedSample: unmatched.slice(0, 8),
            gaps: [
                `${metricLabel}只反映热度/相关性，不含真人原话；需按 proofLinks 去抖音取证 3 条求助/评论`,
                '本批次用于校准阈值，跑完后再决定是否引入评分'
            ],
            proofLinks: evidence.slice(0, 3).map(e => ({
                word: e.word,
                douyinSearch: douyinSearchUrl(e.word)
            }))
        });
    }

    cards.sort((a, b) =>
        b.demandShapeCount - a.demandShapeCount ||
        b.needWordCount - a.needWordCount ||
        (b.subject.searchIndex ?? -1) - (a.subject.searchIndex ?? -1)
    );
    return {
        cards,
        rejected,
        minNeedWords,
        metricLabel,
        subjectLabel,
        calibration: {
            analyzedCount,
            unmatchedTotal: unmatchedAll.length,
            unmatchedSample: unmatchedAll.slice(0, 12)
        }
    };
}

function report() {
    const sheet = readJson(SHEET_PATH, null);
    if (!sheet) {
        log('× 还没有待填表，先运行：node scripts/topic-radar.mjs seed');
        return 1;
    }

    const topics = sheet.topics || [];
    const filled = topics.filter(t => t.keyword);
    const { cards, rejected, minNeedWords, metricLabel, subjectLabel, calibration } = buildCards(sheet);

    log('');
    log('=== Need2Build · 抖音单平台需求验证通道 ===');
    log(`数据源：${sheet.sourceName || SOURCE_NAME}  热榜日期：${sheet.hotListDate || '未知'}  指标：${metricLabel}`);
    log(`话题 ${topics.length} 个 · 已查 ${filled.length} 个 · 成卡 ${cards.length} 张 · 门槛：需求形状关联词 ≥ ${minNeedWords} 个`);
    log('');

    if (filled.length < topics.length) {
        const pending = topics.filter(t => !t.keyword);
        log(`--- 待查清单（${pending.length} 个，去抖音指数「关键词分析」补 3 个数字）---`);
        pending.slice(0, 12).forEach(t => {
            log(`  [${t.rank}] ${t.title}  (热度 ${t.hotValue ?? '-'})`);
        });
        if (pending.length > 12) log(`  …… 还有 ${pending.length - 12} 个`);
        log('  每个话题要填：keyword(输入的关键词) / searchIndex(搜索指数) / relatedWords(关联词，建议 5-10 个)');
        log('');
    }

    if (cards.length) {
        log(`--- 机会卡（${cards.length} 张）---`);
        for (const c of cards) {
            log('');
            log(`  [${c.id}] ${c.status} · ${c.origin} · 证据层级 ${c.evidenceLevel}/3 · 需求词 ${c.needWordCount}/${c.relatedCount}`);
            log(`  话题：${c.topic.title}${c.topic.rank ? `（热榜 #${c.topic.rank}）` : ''}`);
            log(`  主体：${c.subject.keyword}  ${subjectLabel} ${c.subject.searchIndex ?? '未填'}`);
            log(`  需求方向（${c.directions.length} 类）：`);
            c.directions.forEach(d => {
                log(`    [${d.shape}] ${d.words.join('、')}`);
            });
            if (c.missingData.length) log(`  待补：${c.missingData.join('；')}`);
            log(`  缺口：${metricLabel}不含真人原话，仍需按 proofLinks 取证`);
        }
        log('');
    }

    const blocked = rejected.filter(r => r.keyword);
    log(`--- 未过门禁（${rejected.length} 个）---`);
    rejected.slice(0, 8).forEach(r => {
        log(`  · [${r.origin}] ${r.title}：${r.reason}`);
        if (r.keyword && r.unmatchedSample?.length) {
            log(`      关联词 ${r.relatedCount} 个，全部未命中需求形状：${r.unmatchedSample.slice(0, 6).join('、')}`);
        }
    });
    if (rejected.length > 8) log(`  …… 还有 ${rejected.length - 8} 个`);
    if (blocked.length) {
        log(`  其中 ${blocked.length} 个已查但需求形状不足，说明话题本身只是注意力，不是需求。`);
    }
    log('');
    if (calibration.analyzedCount > 0) {
        log(`--- 校准提示 ---`);
        log(`  已分析 ${calibration.analyzedCount} 个词，共 ${calibration.unmatchedTotal} 个关联词未命中任何需求形状。`);
        if (calibration.unmatchedSample.length) {
            log(`  样例：${calibration.unmatchedSample.join('、')}`);
        }
        log('  这些词未必是噪音，也可能是规则缺口（例如「人群+目标」型长尾需求）。定形状规则时需人工过一遍。');
        log('');
    }
    log(`提示：完整结果写入 ${path.relative(ROOT, OUT_PATH)}`);
    return 0;
}

function main() {
    const [, , command = 'report', ...rest] = process.argv;
    if (command === 'seed') {
        const limitFlag = rest.indexOf('--limit');
        const limit = limitFlag >= 0 ? Number(rest[limitFlag + 1]) || DEFAULTS.seedLimit : DEFAULTS.seedLimit;
        return seedTopics(limit);
    }
    if (command === 'report') {
        const sheet = readJson(SHEET_PATH, null);
        if (sheet) {
            const { cards, rejected, minNeedWords, metricLabel, subjectLabel, calibration } = buildCards(sheet);
            const payload = {
                generatedAt: new Date().toISOString(),
                platform: sheet.platform,
                sourceName: sheet.sourceName || SOURCE_NAME,
                hotListDate: sheet.hotListDate || null,
                metricLabel,
                subjectLabel,
                thresholds: { minNeedWords },
                summary: {
                    topics: (sheet.topics || []).length,
                    analyzed: (sheet.topics || []).filter(t => t.keyword).length,
                    cards: cards.length,
                    rejected: rejected.length
                },
                calibration,
                cards,
                rejected
            };
            fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
            fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
        }
        return report();
    }
    log(`未知命令：${command}`);
    log('用法：node scripts/topic-radar.mjs seed [--limit 12] | report');
    return 1;
}

process.exit(main());
