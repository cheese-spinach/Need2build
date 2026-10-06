/**
 * 需求形状：判断一个搜索关联词是否表达了「未被满足的意图」。
 * 这套规则由 2026-10-05 的实测数据校准而来（15 个赛道词 + 24 个平台词池），
 * topic-radar.mjs 与 need-radar.mjs 共用，避免两处漂移。
 *
 * patterns = 子串命中；suffixes = 词尾命中（用于识别「品类名词」）。
 * 一个词只归到第一个命中的形状，顺序即优先级。
 */
export const DEMAND_SHAPES = [
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

/**
 * 已知误判白名单：这些词里的后缀不该被当成品类名词。
 * 例：「火锅」不该因为以「锅」结尾就算厨具，但「火锅店」仍应命中服务诉求。
 */
export const DEMAND_FALSE_POSITIVES = ['火锅', '砂锅'];

export function classifyWord(word) {
    const text = String(word || '').toLowerCase().trim();
    if (!text) return null;
    for (const shape of DEMAND_SHAPES) {
        for (const pattern of shape.patterns || []) {
            if (text.includes(pattern.toLowerCase())) {
                return { id: shape.id, label: shape.label, matched: pattern };
            }
        }
        for (const suffix of shape.suffixes || []) {
            if (text.length <= suffix.length || !text.endsWith(suffix.toLowerCase())) continue;
            const whitelisted = DEMAND_FALSE_POSITIVES.some(
                fp => fp.endsWith(suffix.toLowerCase()) && text.includes(fp)
            );
            if (whitelisted) continue;
            return { id: shape.id, label: shape.label, matched: `*${suffix}` };
        }
    }
    return null;
}

/** 归一化 [词, 值] 或 {word, correlation|searchIndex} 两种写法。 */
export function normalizePairs(raw) {
    if (raw == null || raw === '') return [];
    if (typeof raw === 'string') {
        return raw.split(/[,，、\n]/).map(s => s.trim()).filter(Boolean).map(word => ({ word, value: null }));
    }
    if (!Array.isArray(raw)) return [];
    return raw.map(item => {
        if (typeof item === 'string') return { word: item.trim(), value: null };
        if (Array.isArray(item)) return { word: String(item[0] ?? '').trim(), value: item[1] ?? null };
        if (item && typeof item === 'object') {
            const word = String(item.word ?? item.text ?? '').trim();
            const value = item.searchIndex ?? item.correlation ?? item.index ?? item.value ?? null;
            return word ? { word, value } : null;
        }
        return null;
    }).filter(Boolean);
}
