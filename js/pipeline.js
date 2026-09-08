/* ===== Need2Build 需求推理链 =====
 * 作用：把“原始内容摘抄”变成“需求信号”，再把需求信号聚合成机会雷达，
 * 最后把 GitHub 项目反向挂到机会上，形成 信号 → 机会 → 供给 的可追踪链路。
 */

// 主题域：用于把零散话题归类为可追踪的产品/需求主题
const DEMAND_DOMAINS = [
    {
        id: 'auto_ev',
        name: '智能出行 / 新能源',
        keywords: ['汽车', '车', '新能源', '电动车', '增程', '续航', '车企', '特斯拉', '小米', '华为', '定价', '售价', '经销商', '油车', '混动'],
        enKeywords: ['car', 'vehicle', 'ev', 'auto', 'tesla', 'driving', 'transport']
    },
    {
        id: 'digital',
        name: '数码与智能硬件',
        keywords: ['手机', '折叠屏', '苹果', '华为', '小米', '数码', '芯片', 'iphone', '折叠', '平板', '电视', '硬件', '耳机'],
        enKeywords: ['phone', 'foldable', 'iphone', 'device', 'chip', 'hardware', 'wearable']
    },
    {
        id: 'finance',
        name: '理财与消费决策',
        keywords: ['银行', '股价', '基金', '股票', '分红', '理财', '存款', '利率', '房贷', '保险', '房价', '涨价', '消费'],
        enKeywords: ['stock', 'invest', 'financ', 'crypto', 'loan', 'money', 'insurance', 'price']
    },
    {
        id: 'health_silver',
        name: '健康与银发',
        keywords: ['老人', '养老', '护工', '健康', '医疗', '康复', '体检', '照护', '跌倒', '血压', '三高', '独居', '医生', '护理'],
        enKeywords: ['health', 'medical', 'elder', 'care', 'senior', 'nurse', 'clinic', 'aging']
    },
    {
        id: 'pet',
        name: '宠物经济',
        keywords: ['宠物', '猫', '狗', '养宠', '兽医', '宠物医疗'],
        enKeywords: ['pet', 'cat', 'dog', 'veterinary']
    },
    {
        id: 'work_edu',
        name: '职场与学习',
        keywords: ['职场', '求职', '裁员', '就业', '工资', '加班', '英语', '考试', '教育', '留学', '培训', '课程', '学习'],
        enKeywords: ['job', 'career', 'work', 'learn', 'study', 'education', 'course', 'interview', 'english']
    },
    {
        id: 'content_media',
        name: '内容与娱乐消费',
        keywords: ['短视频', '直播', '网红', '自媒体', '主播', '短剧', '影视', '综艺', '吃播', 'mcn', '流量'],
        enKeywords: ['content', 'video', 'stream', 'creator', 'influencer', 'social', 'short']
    },
    {
        id: 'travel_local',
        name: '文旅与本地生活',
        keywords: ['民宿', '旅游', '古镇', '景区', '餐饮', '外卖', '同城', '本地', '社区', '探店', '酒店'],
        enKeywords: ['travel', 'tourism', 'restaurant', 'food', 'hotel', 'local']
    },
    {
        id: 'industry_trend',
        name: '产业与供应链',
        keywords: ['稀土', '供应链', '工厂', '制造', '出口', '关税', '重组', '行业', '产业', '失业'],
        enKeywords: ['supply', 'manufactur', 'factory', 'semiconductor', 'trade', 'tariff', 'industry']
    }
];

const GENERAL_DOMAIN = { id: 'general', name: '综合趋势观察', keywords: [], enKeywords: [] };

// 直接需求表达
const DIRECT_NEED_PATTERNS = [
    /有没有[^。？！]{0,40}(工具|软件|app|产品|平台|方法|课程|服务)?/i,
    /求推荐|求一个|求介绍|哪里能找到|怎么找到/,
    /需要一个|需要.{0,20}(工具|软件|方案|平台|帮助|服务)/,
    /希望.{0,30}(能做|可以|支持|开发|有人)/,
    /能不能.{0,20}(做|开发|推荐|帮我)/,
    /很需要|真的好需要|急需|特别想要/,
    /need an app|looking for a tool|wish there was|is there an app|anyone know a tool|help me find/i,
    /recommend.{0,30}(tool|app|software|website)/i,
    /i (need|want|wish).{0,50}(app|tool|software|help)/i
];

// 潜在需求表达：正在评估、比较、做决策
const EVALUATION_PATTERNS = [
    /如何评价|怎么评价|如何看待|怎么样|怎么看|体验如何|有用吗|值不值得|要不要|该不该|买不买|应该选|怎么选|如何选择|如何购买/,
    /how (is|are)|is it worth|should i|which.{0,30}(choose|buy)|review of|compare/i
];

// 原因/影响类：需要解释，适合转成内容/工具机会
const REASON_PATTERNS = [
    /为什么|为何|什么原因|背后的原因/,
    /why|what.{0,20}cause/i
];

const IMPACT_PATTERNS = [
    /意味着|影响|有什么影响|未来会|趋势|会不会影响/,
    /impact|effect|future|trend|meaning/i
];

function pipelineText(signal) {
    return `${signal.content || ''} ${signal.title || ''} ${signal.needText || ''}`;
}

function cleanTopic(raw) {
    const text = String(raw || '').replace(/\s+/g, ' ').trim();
    const cut = text.split(/[？?。！!]/)[0];
    return (cut || text).slice(0, 80);
}

function matchLegacyCategory(text) {
    for (const category of CATEGORIES) {
        for (const sub of category.subcategories) {
            for (const keyword of sub.keywords) {
                if (text.toLowerCase().includes(keyword.toLowerCase())) {
                    return { category: sub.id, categoryName: sub.name };
                }
            }
        }
    }
    return null;
}

function matchDomain(text) {
    const lower = text.toLowerCase();
    let best = null;
    let bestHits = 0;
    for (const domain of DEMAND_DOMAINS) {
        let hits = 0;
        for (const keyword of domain.keywords) {
            if (lower.includes(keyword.toLowerCase())) hits += 2;
        }
        for (const keyword of domain.enKeywords) {
            if (lower.includes(keyword)) hits += 1;
        }
        if (hits > bestHits) {
            bestHits = hits;
            best = domain;
        }
    }
    return best || GENERAL_DOMAIN;
}

function parseSignalLikes(signal) {
    const raw = String(signal.likes || '0').replace(/[^\d.]/g, '');
    const value = parseFloat(raw) || 0;
    return /万|w|k/i.test(signal.likes || '') ? Math.round(value * 10000) : Math.round(value);
}

function enrichSignal(signal) {
    if (!signal || typeof signal !== 'object') return signal;
    if (signal.needText) return signal;

    const raw = `${signal.content || ''} ${signal.title || ''}`;
    const topic = cleanTopic(signal.content || signal.title || '');
    const isHotList = signal.sourceKind === 'hot-list';
    let needType = '趋势观察';
    let needText = '';
    let confidence = 35;

    if (isHotList) {
        needType = '趋势观察';
        needText = `「${topic}」入选${signal.sourceLabel || '平台'}，正在快速升温，属于趋势信号；仍需回到真实笔记/评论验证其背后需求。`;
        confidence = 30;
    } else if (DIRECT_NEED_PATTERNS.some(p => p.test(raw))) {
        needType = '直接需求';
        needText = `用户正在主动寻找「${topic}」相关的解决方案，属于可立即验证的产品需求。`;
        confidence = 88;
    } else if (EVALUATION_PATTERNS.some(p => p.test(raw))) {
        needType = '潜在需求';
        needText = `用户正在评估「${topic}」：需要可信的口碑、横向比较和决策依据，可能转化为比价/评测/辅助决策类产品机会。`;
        confidence = 68;
    } else if (REASON_PATTERNS.some(p => p.test(raw))) {
        needType = '潜在需求';
        needText = `用户想弄清「${topic}」背后的原因，存在信息差焦虑，可转化为深度解读、避坑科普或问答工具。`;
        confidence = 55;
    } else if (IMPACT_PATTERNS.some(p => p.test(raw))) {
        needType = '趋势观察';
        needText = `用户关心「${topic}」对自身/行业的影响，存在跟踪与解读需求，可转化为行业监控或情报工具。`;
        confidence = 48;
    } else {
        needType = '趋势观察';
        needText = `围绕「${topic}」，用户需要结构化解读与判断依据，建议进一步观察是否沉淀为产品需求。`;
        confidence = 35;
    }

    const domain = matchDomain(raw);
    const legacy = matchLegacyCategory(raw);
    const likes = parseSignalLikes(signal);
    const score = Math.min(95, confidence + Math.min(10, Math.log10(likes + 1) * 2));
    const useLegacyCategory = domain.id === 'general' && legacy;

    signal.needType = needType;
    signal.needText = needText;
    signal.needConfidence = confidence;
    signal.demandScore = Math.round(score);
    signal.domain = domain.id;
    signal.domainName = domain.name;
    signal.category = domain.id === 'general' ? (legacy ? legacy.category : 'general') : domain.id;
    signal.categoryName = useLegacyCategory ? legacy.categoryName : domain.name;
    return signal;
}

function estimateSignalWeight(signal) {
    const base = signal.demandScore || 50;
    const likes = parseSignalLikes(signal);
    return base + Math.min(15, Math.log10(likes + 1) * 3) + (signal.isReal ? 8 : 0);
}

function buildSources(signals) {
    const platformCounts = {};
    signals.forEach(s => {
        platformCounts[s.platform] = (platformCounts[s.platform] || 0) + 1;
    });
    return signals.slice(0, 5).map(s => ({
        platform: s.platform,
        author: s.author || '匿名',
        text: s.needText || String(s.content || '').slice(0, 120),
        percent: Math.max(8, Math.round((platformCounts[s.platform] || 1) / signals.length * 100)),
        url: s.url || '',
        signalId: s.id
    }));
}

function defaultActionPlan() {
    return [
        { step: 1, title: '需求验证', time: 'Day 1-3', desc: '回到关联信号原文，访谈 10 位表达者确认痛点' },
        { step: 2, title: '竞品扫描', time: 'Day 4-7', desc: '检查现有产品与开源方案，找差异化切入点' },
        { step: 3, title: 'MVP 设计', time: 'Week 2-3', desc: '只做解决核心诉求的最小闭环' },
        { step: 4, title: '种子验证', time: 'Week 4', desc: '定向邀请表达者体验并观察留存' },
        { step: 5, title: '二创或立项', time: 'Week 5-6', desc: '有开源底座则走二创路线，无则评估自建成本' }
    ];
}

function defaultTracking(evidenceCount, matchedCount) {
    return {
        trendChange: `+${Math.min(90, evidenceCount * 9)}%`,
        newProjects: matchedCount,
        riskLevel: evidenceCount >= 5 ? '低' : '中',
        recommendation: '先用关联信号做访谈验证，确认是刚需后再投入开发',
        forecast: `当前有 ${evidenceCount} 条真实讨论支撑，建议先小成本验证`
    };
}

function matchProjects(domain, signals, projects) {
    const evidenceText = signals.map(s => pipelineText(s)).join(' ').toLowerCase();
    const terms = new Set([...(domain.enKeywords || [])]);
    for (const s of signals) {
        const content = String(s.content || '');
        if (/AI|人工智能|智能|agent|LLM|模型/i.test(content)) {
            ['ai', 'llm', 'agent', 'chat', 'model', 'rag'].forEach(t => terms.add(t));
        }
        if (/tool|工具|效率/i.test(content)) {
            ['tool', 'automation', 'productivity'].forEach(t => terms.add(t));
        }
    }
    if (evidenceText.includes('视频') || evidenceText.includes('content')) {
        ['video', 'content', 'media', 'stream'].forEach(t => terms.add(t));
    }
    const termList = [...terms].filter(Boolean);
    const matches = [];
    for (const project of (projects || [])) {
        const hay = `${project.name} ${project.description} ${(project.topics || []).join(' ')} ${project.language}`.toLowerCase();
        let hits = 0;
        for (const term of termList) {
            if (hay.includes(term)) hits += 1;
        }
        if (hits > 0) {
            project.relatedOpportunityCount = (project.relatedOpportunityCount || 0) + 1;
            matches.push({
                name: project.fullName || project.name,
                stars: project.stars || '0',
                lang: project.language || 'Other',
                activity: project.activity || '一般',
                match: Math.min(95, 50 + hits * 12),
                diff: hits >= 2 ? '低' : '中',
                url: project.url || '',
                projectId: project.id
            });
        }
    }
    matches.sort((a, b) => b.match - a.match);
    return matches;
}

function buildOpportunityFromGroup(domain, group, projects, opportunityId) {
    const signals = group.slice().sort((a, b) => estimateSignalWeight(b) - estimateSignalWeight(a));
    const top = signals[0];
    const directCount = signals.filter(s => s.needType === '直接需求').length;
    const evidenceCount = signals.length;
    const matchedProjects = matchProjects(domain, signals, projects);
    matchedProjects.forEach(m => {
        const sourceProject = (projects || []).find(p => String(p.id) === String(m.projectId));
        if (sourceProject) {
            if (!sourceProject.relatedOpportunityIds) sourceProject.relatedOpportunityIds = [];
            if (!sourceProject.relatedOpportunityIds.includes(opportunityId)) {
                sourceProject.relatedOpportunityIds.push(opportunityId);
            }
        }
    });
    const demandBase = Math.min(95, 42 + evidenceCount * 5 + directCount * 12);
    const feas = Math.min(90, 45 + matchedProjects.length * 8);
    const cost = 70;
    const score = Math.min(96, Math.round(demandBase * 0.55 + feas * 0.3 + cost * 0.15));

    let status = 'from-scratch';
    let statusText = '从0到1';
    if (directCount >= 2 || evidenceCount >= 8) {
        status = 'trending';
        statusText = '爆发中';
    } else if (directCount >= 1) {
        status = 'gap';
        statusText = '供给缺口';
    }

    const typeLabel = top.needType === '直接需求' ? '寻找方案' : top.needType === '潜在需求' ? '决策与比较' : '趋势解读';
    const title = `${domain.name} · ${typeLabel}`;
    const desc = `由 ${evidenceCount} 条真实信号聚类：${top.needText}`;
    const sources = buildSources(signals);
    const categoryName = top.categoryName || domain.name;

    const opportunity = {
        id: opportunityId,
        source: 'auto',
        score,
        title,
        status,
        statusText,
        category: top.category || 'all',
        categoryName,
        desc,
        evidenceCount,
        directCount,
        comment: {
            platform: top.platform || 'zhihu',
            author: top.author || '匿名',
            likes: top.likes || '0',
            time: top.time || '刚刚',
            text: top.needText
        },
        projects: matchedProjects.length,
        totalProjects: matchedProjects.length || 1,
        cost: matchedProjects.length ? '低成本二创优先' : '成本待验证',
        trend: `+${Math.min(99, evidenceCount * 9)}%`,
        trendData: [1, 2, 3, 4].map((_, i) => evidenceCount * (i + 1)),
        updated: top.time || '刚刚',
        dims: {
            demand: Math.max(30, demandBase),
            comp: 48,
            feas,
            cost
        },
        signalIds: signals.map(s => s.id),
        detail: {
            sources,
            matchedProjects: matchedProjects.slice(0, 3),
            remixAdvice: {
                direction: `先围绕「${top.needText}」做最小 MVP 验证`,
                tech: matchedProjects.length ? `优先基于已匹配开源项目二创：${matchedProjects.slice(0, 3).map(p => p.name).join('、')}` : '暂无可直接复用项目，先做调研',
                diff: '每个信号都保留原文链接，从真实表达反向验证，而不是先有产品再找需求'
            },
            actionPlan: defaultActionPlan(),
            tracking: defaultTracking(evidenceCount, matchedProjects.length)
        }
    };

    signals.forEach(s => {
        s.opportunityId = opportunity.id;
    });
    return opportunity;
}

function buildOpportunitiesFromSignals(signals, projects) {
    const enriched = signals
        .map((s, idx) => {
            const enrichedSignal = enrichSignal(s);
            if (enrichedSignal && (enrichedSignal.content || enrichedSignal.title) && !enrichedSignal.id) {
                enrichedSignal.id = `sig-${idx + 1}`;
            }
            return enrichedSignal;
        })
        .filter(s => s && (s.content || s.title));
    const groups = new Map();

    for (const signal of enriched) {
        const domainId = signal.domain || 'general';
        if (!groups.has(domainId)) groups.set(domainId, []);
        groups.get(domainId).push(signal);
    }

    const opportunities = [];
    let counter = 1000;
    for (const [domainId, group] of groups) {
        if (group.length === 0) continue;
        // 未归类的纯热点只进入观察流，不硬凑成机会，避免“什么都想做”
        if (domainId === 'general' && group.every(s => s.needType !== '直接需求')) continue;
        const domain = DEMAND_DOMAINS.find(d => d.id === domainId) || GENERAL_DOMAIN;
        opportunities.push(buildOpportunityFromGroup(domain, group, projects, counter++));
    }
    opportunities.sort((a, b) => b.score - a.score);
    return opportunities;
}

function refreshOpportunityPipeline() {
    // 只有存在真实信号时才自动重建机会雷达；否则保留原有人工示例
    if (liveNonTwitterSignals.length === 0 && realTwitterSignals.length === 0) {
        // 实时文件已加载但确实没有信号时，清空人工示例，避免把演示数据展示成真机会
        if (typeof liveDataLoaded === 'boolean' && liveDataLoaded) {
            OPPORTUNITIES.splice(0, OPPORTUNITIES.length);
        }
        return false;
    }

    const signals = getMergedSignals();
    const built = buildOpportunitiesFromSignals(signals, PROJECTS);
    if (built.length > 0) {
        OPPORTUNITIES.splice(0, OPPORTUNITIES.length, ...built);
    }
    return built.length > 0;
}
