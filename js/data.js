/* ===== Need2Build 数据层 ===== */

// 平台配置
const PLATFORMS = {
    xiaohongshu: { name: '小红书', color: '#FF2442', region: 'domestic', icon: 'xiaohongshu' },
    douyin: { name: '抖音', color: '#1a1a1a', region: 'domestic', icon: 'douyin' },
    zhihu: { name: '知乎', color: '#0066ff', region: 'domestic', icon: 'zhihu' },
    twitter: { name: 'Twitter', color: '#1DA1F2', region: 'overseas', icon: 'twitter' },
    reddit: { name: 'Reddit', color: '#ff4500', region: 'overseas', icon: 'reddit' },
    github: { name: 'GitHub', color: '#1a1a1a', region: 'overseas', icon: 'github' }
};

// 赛道分类（两级菜单）
const CATEGORIES = [
    {
        id: 'crowd',
        name: '人群圈层',
        icon: '👥',
        subcategories: [
            { id: 'silver', name: '银发经济', keywords: ['老人', '养老', '健康监测', '独居'] },
            { id: 'pet', name: '宠物经济', keywords: ['宠物', '猫', '狗', '养宠'] },
            { id: 'genz', name: 'Z世代', keywords: ['年轻人', '潮玩', '社交', '二次元'] },
            { id: 'she', name: '她经济', keywords: ['女性', '美妆', '护肤', '母婴'] }
        ]
    },
    {
        id: 'space',
        name: '空间场景',
        icon: '🏠',
        subcategories: [
            { id: 'local', name: '本地生活', keywords: ['外卖', '到店', '本地服务', '同城'] },
            { id: 'community', name: '社区团购', keywords: ['社区', '团购', '小区', '邻里'] },
            { id: 'shared', name: '共享空间', keywords: ['共享', '办公空间', '自习室', '储物'] },
            { id: 'city', name: '城市服务', keywords: ['政务', '交通', '停车', '便民'] }
        ]
    },
    {
        id: 'ai-content',
        name: 'AI与内容',
        icon: '🤖',
        subcategories: [
            { id: 'ai-tool', name: 'AI工具', keywords: ['AI工具', '效率', '自动化', '助手'] },
            { id: 'ai-app', name: 'AI应用', keywords: ['AI应用', '聊天机器人', 'AI写作', 'AI绘画'] },
            { id: 'content', name: '内容创业', keywords: ['自媒体', '短视频', '直播', '播客'] },
            { id: 'knowledge', name: '知识付费', keywords: ['课程', '知识付费', '在线教育', '学习'] }
        ]
    },
    {
        id: 'global',
        name: '全球本土化',
        icon: '🌍',
        subcategories: [
            { id: 'brand', name: '品牌出海', keywords: ['出海', '跨境电商', '独立站', 'DTC'] },
            { id: 'saas', name: '跨境SaaS', keywords: ['SaaS', '海外工具', '订阅制', 'B端'] },
            { id: 'overseas-content', name: '海外内容', keywords: ['YouTube', 'TikTok', '海外自媒体', '短剧出海'] },
            { id: 'supply', name: '供应链外迁', keywords: ['供应链', '东南亚', '墨西哥', '制造'] }
        ]
    }
];

// 机会数据（6个机会 + 4个失败案例）
const OPPORTUNITIES = [
    {
        id: 1,
        score: 92,
        title: 'AI职场英语陪练',
        status: 'trending',
        statusText: '爆发中',
        category: 'genz',
        categoryName: 'Z世代',
        desc: '职场人英语提升需求强烈，但传统课程贵且难坚持。AI陪练可24小时在线、模拟真实职场场景、即时纠错反馈，边际成本极低。',
        comment: {
            platform: 'xiaohongshu',
            author: '打工人小A',
            likes: '2.1万',
            time: '2小时前',
            text: '外企上班英语太烂了…报了好几万的课根本没时间上。有没有那种可以随时跟AI练口语的工具啊？要能模拟开会、写邮件场景的，真的很需要！'
        },
        projects: 2,
        totalProjects: 5,
        cost: '启动成本 <1千元',
        trend: '+128%',
        trendData: [200, 280, 350, 480, 620, 850, 1100],
        updated: '3分钟前',
        dims: { demand: 95, comp: 70, feas: 88, cost: 85 },
        detail: {
            sources: [
                { platform: 'xiaohongshu', author: '打工人小A', text: '外企上班英语太烂了…有没有随时跟AI练口语的工具？', percent: 42 },
                { platform: 'douyin', author: '职场老司机', text: '英语不好错失晋升机会，AI陪练能不能救？', percent: 28 },
                { platform: 'twitter', author: '@techbro', text: 'AI English tutor is the next big thing', percent: 20 },
                { platform: 'zhihu', author: '英语学习者', text: '如何评价AI口语陪练产品？', percent: 10 }
            ],
            matchedProjects: [
                { name: 'openai/whisper', stars: '39.2k', lang: 'Python/ASR', activity: '高度活跃', match: 88, diff: '中' },
                { name: 'langgenius/dify', stars: '40.2k', lang: 'Python/LLM', activity: '高度活跃', match: 75, diff: '低' }
            ],
            remixAdvice: {
                direction: '职场场景AI口语陪练、英语邮件/报告AI批改助手、外企面试模拟教练',
                tech: 'Whisper做语音识别和发音评估、Dify搭建场景化对话系统、加入跟读评分和进步曲线',
                diff: '现有英语App大多是"背单词+看视频"模式，AI陪练是"真对话+即时反馈"，体验完全不同。'
            },
            actionPlan: [
                { step: 1, title: '立项调研', time: 'Day 1-3', desc: '深度调研10个竞品，找到差异化切入点' },
                { step: 2, title: '技术选型', time: 'Day 4-7', desc: '选定LLM和语音技术栈，跑通核心链路' },
                { step: 3, title: 'MVP开发', time: 'Week 2-3', desc: '两周出第一版，核心功能：场景对话+即时纠错' },
                { step: 4, title: '种子验证', time: 'Week 4', desc: '招募100名种子用户，验证付费意愿' },
                { step: 5, title: '正式上线', time: 'Week 5-6', desc: '完善体验，上线付费会员体系' }
            ],
            tracking: {
                trendChange: '+47%',
                newProjects: 8,
                riskLevel: '中',
                recommendation: '建议从"外企职场场景"切入，做垂直细分，先验证付费意愿',
                forecast: '3-6个月内赛道持续升温，现在入场是窗口期'
            }
        }
    },
    {
        id: 2,
        score: 88,
        title: '独居老人安全监测',
        status: 'gap',
        statusText: '供给缺口',
        category: 'silver',
        categoryName: '银发经济',
        desc: '独居老人数量持续增长，子女远程无法实时关注老人安全。现有产品多为可穿戴设备，老人不愿戴。基于摄像头+AI的非接触式跌倒检测、异常行为监测，是刚需且供给不足的方向。',
        comment: {
            platform: 'zhihu',
            author: '北漂的小王',
            likes: '8,742',
            time: '2天前',
            text: '爸妈在老家独居，最担心的就是他们摔倒了没人知道。买了智能手环他们嫌麻烦不戴。有没有不用戴在身上、装在家里就能监测的设备啊？'
        },
        projects: 4,
        totalProjects: 12,
        cost: '启动成本 1千-1万',
        trend: '+95%',
        trendData: [150, 200, 280, 380, 520, 700, 950],
        updated: '20分钟前',
        dims: { demand: 98, comp: 45, feas: 75, cost: 70 },
        detail: {
            sources: [
                { platform: 'zhihu', author: '北漂的小王', text: '爸妈独居，担心摔倒没人知道，有没有非接触式监测？', percent: 35 },
                { platform: 'xiaohongshu', author: '孝顺女儿', text: '给爸妈装了摄像头，但不会自动报警', percent: 28 },
                { platform: 'douyin', author: '养老观察', text: '独居老人安全监测是万亿市场', percent: 22 },
                { platform: 'reddit', author: 'u/caregiver', text: 'Elderly fall detection is a huge market', percent: 15 }
            ],
            matchedProjects: [
                { name: 'ultralytics/yolov5', stars: '45.1k', lang: 'Python/CV', activity: '高度活跃', match: 82, diff: '低' },
                { name: 'mmpose', stars: '8.2k', lang: 'Python/Pose', activity: '活跃', match: 78, diff: '中' }
            ],
            remixAdvice: {
                direction: '非接触式跌倒检测、老人异常行为监测、子女远程关怀系统',
                tech: 'YOLOv5做人体检测、MMPose做姿态估计、异常行为识别算法、微信小程序推送',
                diff: '现有产品多为可穿戴设备（老人不愿戴），非接触式摄像头方案是差异化切入点。'
            },
            actionPlan: [
                { step: 1, title: '技术验证', time: 'Day 1-7', desc: '跑通跌倒检测算法，准确率达到90%以上' },
                { step: 2, title: '硬件选型', time: 'Day 8-14', desc: '选定摄像头硬件方案，控制BOM成本在200元内' },
                { step: 3, title: 'MVP开发', time: 'Week 3-5', desc: '开发监测系统+子女端小程序，实现跌倒报警推送' },
                { step: 4, title: '家庭测试', time: 'Week 6-8', desc: '找20个家庭测试，收集反馈优化误报率' },
                { step: 5, title: '商业化', time: 'Month 3', desc: '硬件销售+月度订阅（云存储+AI分析）' }
            ],
            tracking: {
                trendChange: '+32%',
                newProjects: 5,
                riskLevel: '低',
                recommendation: '刚需+供给不足，建议优先做跌倒检测单点功能，快速验证',
                forecast: '老龄化加速，5年内市场规模超千亿'
            }
        }
    },
    {
        id: 3,
        score: 85,
        title: '社区闲置物品交换小程序',
        status: 'from-scratch',
        statusText: '从0到1',
        category: 'community',
        categoryName: '社区团购',
        desc: '断舍离趋势下，家庭闲置物品越来越多，但二手交易平台交易成本高、信任度低。基于小区/社区的闲置物品交换，天然有信任基础，交易成本极低，是一个被低估的方向。',
        comment: {
            platform: 'xiaohongshu',
            author: '极简主义者',
            likes: '1.8万',
            time: '5小时前',
            text: '家里闲置东西太多了，闲鱼上卖又麻烦又怕遇到奇葩。要是小区里有个闲置交换群就好了，大家都是邻居，换着用或者低价出，多方便！'
        },
        projects: 3,
        totalProjects: 8,
        cost: '启动成本 <1千元',
        trend: '+215%',
        trendData: [100, 150, 220, 350, 520, 780, 1150],
        updated: '1小时前',
        dims: { demand: 88, comp: 55, feas: 92, cost: 90 },
        detail: {
            sources: [
                { platform: 'xiaohongshu', author: '极简主义者', text: '小区里有个闲置交换群就好了', percent: 40 },
                { platform: 'douyin', author: '断舍离达人', text: '闲置物品处理是痛点，社区交换是趋势', percent: 25 },
                { platform: 'zhihu', author: '产品经理', text: '社区闲置交换的商业模式探讨', percent: 20 },
                { platform: 'reddit', author: 'u/zero-waste', text: 'Neighborhood swap apps are trending', percent: 15 }
            ],
            matchedProjects: [
                { name: 'wechat-miniprogram', stars: '5.2k', lang: 'JavaScript/小程序', activity: '活跃', match: 70, diff: '低' },
                { name: 'tcb-js-sdk', stars: '2.1k', lang: 'JavaScript/云开发', activity: '一般', match: 65, diff: '低' }
            ],
            remixAdvice: {
                direction: '社区闲置交换小程序、邻里互助平台、小区跳蚤市场线上化',
                tech: '微信小程序+云开发（免服务器）、LBS定位匹配小区、微信支付担保交易',
                diff: '闲鱼是全平台陌生人交易（信任成本高），社区交换是熟人邻里交易（信任成本低）。'
            },
            actionPlan: [
                { step: 1, title: '小区试点', time: 'Day 1-3', desc: '找1-2个小区做种子用户，建微信群收集需求' },
                { step: 2, title: '小程序开发', time: 'Day 4-14', desc: '用微信云开发快速搭建，核心功能：发布+浏览+私聊' },
                { step: 3, title: '冷启动', time: 'Week 3', desc: '在小区地推，送小礼品鼓励发布闲置' },
                { step: 4, title: '复制扩张', time: 'Month 2', desc: '验证成功后复制到周边小区，形成区域网络' },
                { step: 5, title: '商业化', time: 'Month 3', desc: '社区团购导流、本地商家广告、增值服务' }
            ],
            tracking: {
                trendChange: '+68%',
                newProjects: 3,
                riskLevel: '低',
                recommendation: '启动成本极低，建议先做单个小区验证，跑通后再复制',
                forecast: '社区经济是下一个万亿市场，闲置交换是切入点'
            }
        }
    },
    {
        id: 4,
        score: 93,
        title: '中文短剧出海自动化剪辑工具',
        status: 'trending',
        statusText: '爆发中',
        category: 'overseas-content',
        categoryName: '海外内容',
        desc: '中文短剧出海爆发式增长，但剪辑效率极低：需要人工翻译、配音、字幕、适配不同平台。AI自动化剪辑工具可以将中文短剧一键转化为多语言版本，效率提升10倍以上，是明确的B端付费场景。',
        comment: {
            platform: 'twitter',
            author: '@DramaHustler',
            likes: '4,231',
            time: '15分钟前',
            text: 'Chinese short dramas are exploding on Reels/TikTok! But translating and dubbing each episode takes forever. Someone please build an AI tool that auto-translates Chinese drama to English/Spanish with voiceover!'
        },
        projects: 6,
        totalProjects: 15,
        cost: '启动成本 1千-1万',
        trend: '+185%',
        trendData: [120, 180, 280, 450, 700, 1050, 1500],
        updated: '15分钟前',
        dims: { demand: 96, comp: 60, feas: 85, cost: 75 },
        detail: {
            sources: [
                { platform: 'twitter', author: '@DramaHustler', text: 'Need AI tool to auto-translate Chinese drama to English', percent: 35 },
                { platform: 'reddit', author: 'u/shortdrama', text: 'Chinese drama localization is a huge pain point', percent: 25 },
                { platform: 'xiaohongshu', author: '出海从业者', text: '短剧出海剪辑效率太低，急需自动化工具', percent: 22 },
                { platform: 'douyin', author: '短剧制作人', text: '一部剧翻译配音要花几万块，有没有更便宜的方案？', percent: 18 }
            ],
            matchedProjects: [
                { name: 'openai/whisper', stars: '39.2k', lang: 'Python/ASR', activity: '高度活跃', match: 85, diff: '中' },
                { name: 'coqui-ai/TTS', stars: '18.5k', lang: 'Python/TTS', activity: '活跃', match: 80, diff: '中' },
                { name: 'microsoft/DeepSpeed', stars: '32.1k', lang: 'Python/翻译', activity: '高度活跃', match: 72, diff: '高' }
            ],
            remixAdvice: {
                direction: '短剧多语言自动翻译配音、短视频跨平台一键分发、AI字幕生成与校对',
                tech: 'Whisper做语音识别、大模型做翻译、Coqui TTS做语音合成、FFmpeg做视频合成',
                diff: '现有工具只能做单一环节（翻译或字幕），缺少端到端的短剧出海自动化解决方案。'
            },
            actionPlan: [
                { step: 1, title: '技术验证', time: 'Day 1-10', desc: '跑通"中文语音→文字→翻译→外语配音→视频合成"全链路' },
                { step: 2, title: 'MVP开发', time: 'Day 11-30', desc: '开发Web端工具，支持上传视频→一键生成多语言版本' },
                { step: 3, title: '客户验证', time: 'Month 2', desc: '找10家短剧出海公司测试，按分钟收费验证付费意愿' },
                { step: 4, title: '优化迭代', time: 'Month 3', desc: '优化翻译质量和配音自然度，支持更多语言和平台' },
                { step: 5, title: '规模化', time: 'Month 4+', desc: '推出SaaS订阅制，拓展到其他视频内容类型' }
            ],
            tracking: {
                trendChange: '+89%',
                newProjects: 12,
                riskLevel: '中',
                recommendation: 'B端付费意愿强，建议直接做SaaS工具，按分钟/订阅收费',
                forecast: '短剧出海市场2026年预计超500亿，工具需求爆发'
            }
        }
    },
    {
        id: 5,
        score: 90,
        title: 'AI读书笔记+思维导图生成器',
        status: 'trending',
        statusText: '爆发中',
        category: 'knowledge',
        categoryName: '知识付费',
        desc: '阅读量增长但知识留存率低，读完就忘是普遍痛点。AI可以自动提取书籍核心观点、生成结构化笔记、可视化思维导图，甚至生成知识卡片便于复习。知识付费人群付费意愿强，是明确的C端付费场景。',
        comment: {
            platform: 'xiaohongshu',
            author: '爱读书的猫',
            likes: '3.2万',
            time: '30分钟前',
            text: '每年读50本书但记住的不到5本…有没有那种上传电子书就能自动生成读书笔记和思维导图的工具啊？要能提炼核心观点、生成知识卡片的那种，真的很需要！'
        },
        projects: 5,
        totalProjects: 10,
        cost: '启动成本 <1千元',
        trend: '+156%',
        trendData: [180, 250, 350, 500, 720, 1000, 1350],
        updated: '30分钟前',
        dims: { demand: 92, comp: 65, feas: 90, cost: 88 },
        detail: {
            sources: [
                { platform: 'xiaohongshu', author: '爱读书的猫', text: '有没有自动生成读书笔记和思维导图的工具？', percent: 38 },
                { platform: 'zhihu', author: '终身学习者', text: '如何高效做读书笔记？AI能帮忙吗？', percent: 25 },
                { platform: 'douyin', author: '读书博主', text: 'AI读书笔记工具测评，哪款最好用？', percent: 22 },
                { platform: 'twitter', author: '@bookworm', text: 'AI book notes generator is a game changer', percent: 15 }
            ],
            matchedProjects: [
                { name: 'langgenius/dify', stars: '40.2k', lang: 'Python/LLM', activity: '高度活跃', match: 82, diff: '低' },
                { name: 'mermaid-js/mermaid', stars: '62.3k', lang: 'JavaScript/图表', activity: '高度活跃', match: 78, diff: '低' },
                { name: 'apache/calcite', stars: '4.1k', lang: 'Java/解析', activity: '一般', match: 60, diff: '中' }
            ],
            remixAdvice: {
                direction: 'AI读书笔记生成器、书籍思维导图可视化、知识卡片复习系统、阅读进度追踪',
                tech: 'Dify搭建LLM应用、Mermaid生成思维导图、Anki算法做间隔重复复习、微信小程序端',
                diff: '现有读书笔记App多是手动记录，AI自动提取+结构化输出+可视化是差异化体验。'
            },
            actionPlan: [
                { step: 1, title: '核心功能', time: 'Day 1-7', desc: '跑通"上传电子书→AI提取核心观点→生成结构化笔记"流程' },
                { step: 2, title: '可视化', time: 'Day 8-14', desc: '集成Mermaid生成思维导图，支持导出图片/PDF' },
                { step: 3, title: '复习系统', time: 'Day 15-21', desc: '加入知识卡片+间隔重复算法，提升知识留存率' },
                { step: 4, title: '用户验证', time: 'Week 4', desc: '找100个读书爱好者测试，验证付费意愿（会员制）' },
                { step: 5, title: '上线推广', time: 'Month 2', desc: '在小红书/知乎推广，与读书博主合作' }
            ],
            tracking: {
                trendChange: '+52%',
                newProjects: 7,
                riskLevel: '低',
                recommendation: 'C端付费意愿强，建议做会员制（免费3本/月，付费无限）',
                forecast: '知识付费市场持续增长，AI工具是提升效率的关键'
            }
        }
    },
    {
        id: 6,
        score: 83,
        title: '一人食预制菜社区团购',
        status: 'gap',
        statusText: '供给缺口',
        category: 'community',
        categoryName: '社区团购',
        desc: '独居/一人食人群增长，但预制菜分量大、不适合一人食，外卖贵且不健康。基于社区的一人食预制菜团购，集中采购降低成本、小分量适配一人食、社区自提解决最后一公里，是一个被低估的细分市场。',
        comment: {
            platform: 'xiaohongshu',
            author: '独居女孩',
            likes: '2.5万',
            time: '1小时前',
            text: '一个人住做饭太麻烦，外卖又贵又不健康。预制菜都是大份的，一个人吃不完。要是小区里能团那种一人食的小份预制菜就好了，便宜又方便！'
        },
        projects: 3,
        totalProjects: 6,
        cost: '启动成本 1万-5万',
        trend: '+78%',
        trendData: [200, 260, 340, 440, 560, 700, 880],
        updated: '45分钟前',
        dims: { demand: 85, comp: 40, feas: 70, cost: 65 },
        detail: {
            sources: [
                { platform: 'xiaohongshu', author: '独居女孩', text: '小区里能团一人食小份预制菜就好了', percent: 42 },
                { platform: 'douyin', author: '一人食日记', text: '一人食预制菜是蓝海市场', percent: 28 },
                { platform: 'zhihu', author: '食品行业观察', text: '预制菜细分赛道分析：一人食', percent: 18 },
                { platform: 'reddit', author: 'u/solo-diner', text: 'Single-serve meal kits are underserved', percent: 12 }
            ],
            matchedProjects: [
                { name: 'wechat-miniprogram', stars: '5.2k', lang: 'JavaScript/小程序', activity: '活跃', match: 65, diff: '低' },
                { name: 'tcb-js-sdk', stars: '2.1k', lang: 'JavaScript/云开发', activity: '一般', match: 60, diff: '低' }
            ],
            remixAdvice: {
                direction: '一人食预制菜社区团购、小份健康餐订阅制、社区厨房共享',
                tech: '微信小程序+云开发、社区团购系统（团长+自提点）、供应链管理系统',
                diff: '现有预制菜都是大份家庭装，一人食小分量+社区团购+集中采购是差异化模式。'
            },
            actionPlan: [
                { step: 1, title: '供应链对接', time: 'Day 1-10', desc: '找3-5家预制菜供应商，谈小分量定制和批发价' },
                { step: 2, title: '小程序开发', time: 'Day 11-20', desc: '开发团购小程序，核心功能：选品+下单+自提码' },
                { step: 3, title: '小区试点', time: 'Week 4', desc: '选1个小区试点，找团长，每周开团2次' },
                { step: 4, title: '验证复购', time: 'Month 2', desc: '跟踪复购率和客单价，验证商业模式' },
                { step: 5, title: '复制扩张', time: 'Month 3+', desc: '复制到周边小区，建立区域供应链' }
            ],
            tracking: {
                trendChange: '+28%',
                newProjects: 2,
                riskLevel: '中',
                recommendation: '重供应链模式，建议先轻资产做团购平台验证，再考虑自营',
                forecast: '一人食市场持续增长，预制菜小分量化是趋势'
            }
        }
    },
    // 失败案例
    {
        id: 101,
        score: 0,
        title: 'AI朋友圈文案生成器',
        status: 'failure',
        statusText: '已失败',
        category: 'ai-tool',
        categoryName: 'AI工具',
        desc: '2023年大量AI文案工具涌现，但同质化严重、用户付费意愿低、获客成本高，90%以上已停止运营。',
        failureReason: '同质化严重+付费意愿低+获客成本高',
        failureLesson: 'AI工具要有明确的垂直场景和差异化价值，通用文案工具门槛太低',
        updated: '已归档'
    },
    {
        id: 102,
        score: 0,
        title: '社区团购小程序',
        status: 'failure',
        statusText: '已失败',
        category: 'community',
        categoryName: '社区团购',
        desc: '2020-2021年社区团购风口，大量创业者涌入，但供应链重、毛利低、巨头碾压，绝大多数中小玩家已退出。',
        failureReason: '供应链重+毛利低+巨头碾压',
        failureLesson: '社区团购要做差异化细分（如一人食、有机食品），不要跟巨头拼价格',
        updated: '已归档'
    },
    {
        id: 103,
        score: 0,
        title: '宠物社交APP',
        status: 'failure',
        statusText: '已失败',
        category: 'pet',
        categoryName: '宠物经济',
        desc: '宠物社交APP层出不穷，但用户粘性低、变现困难、内容被小红书/抖音分流，几乎没有成功案例。',
        failureReason: '用户粘性低+变现困难+内容被分流',
        failureLesson: '宠物赛道要做工具/电商/服务，纯社交很难成立',
        updated: '已归档'
    },
    {
        id: 104,
        score: 0,
        title: 'AI算命小程序',
        status: 'failure',
        statusText: '已失败',
        category: 'ai-app',
        categoryName: 'AI应用',
        desc: 'AI算命/星座小程序曾火爆一时，但涉及封建迷信被微信平台大量封禁，且用户留存极低。',
        failureReason: '平台封禁+政策风险+用户留存低',
        failureLesson: '避免触碰政策红线，选择合规且有长期价值的方向',
        updated: '已归档'
    }
];

// 需求信号数据
const SIGNALS = [
    {
        id: 1,
        platform: 'xiaohongshu',
        author: '打工人小A',
        time: '2小时前',
        likes: '2.1万',
        content: '外企上班英语太烂了…报了好几万的课根本没时间上。有没有那种可以随时跟AI练口语的工具啊？要能模拟开会、写邮件场景的，真的很需要！',
        keywords: ['AI口语', '职场英语', '英语陪练'],
        url: 'https://www.xiaohongshu.com/explore/example1'
    },
    {
        id: 2,
        platform: 'zhihu',
        author: '北漂的小王',
        time: '2天前',
        likes: '8,742',
        content: '爸妈在老家独居，最担心的就是他们摔倒了没人知道。买了智能手环他们嫌麻烦不戴。有没有不用戴在身上、装在家里就能监测的设备啊？',
        keywords: ['老人安全', '跌倒检测', '独居老人'],
        url: 'https://www.zhihu.com/question/example2'
    },
    {
        id: 3,
        platform: 'xiaohongshu',
        author: '极简主义者',
        time: '5小时前',
        likes: '1.8万',
        content: '家里闲置东西太多了，闲鱼上卖又麻烦又怕遇到奇葩。要是小区里有个闲置交换群就好了，大家都是邻居，换着用或者低价出，多方便！',
        keywords: ['闲置交换', '社区', '断舍离'],
        url: 'https://www.xiaohongshu.com/explore/example3'
    },
    {
        id: 4,
        platform: 'twitter',
        author: '@DramaHustler',
        time: '15分钟前',
        likes: '4,231',
        content: 'Chinese short dramas are exploding on Reels/TikTok! But translating and dubbing each episode takes forever. Someone please build an AI tool that auto-translates Chinese drama to English/Spanish with voiceover!',
        keywords: ['短剧出海', 'AI翻译', '自动配音'],
        url: 'https://twitter.com/DramaHustler/status/example4'
    },
    {
        id: 5,
        platform: 'xiaohongshu',
        author: '爱读书的猫',
        time: '30分钟前',
        likes: '3.2万',
        content: '每年读50本书但记住的不到5本…有没有那种上传电子书就能自动生成读书笔记和思维导图的工具啊？要能提炼核心观点、生成知识卡片的那种，真的很需要！',
        keywords: ['AI读书笔记', '思维导图', '知识管理'],
        url: 'https://www.xiaohongshu.com/explore/example5'
    },
    {
        id: 6,
        platform: 'xiaohongshu',
        author: '独居女孩',
        time: '1小时前',
        likes: '2.5万',
        content: '一个人住做饭太麻烦，外卖又贵又不健康。预制菜都是大份的，一个人吃不完。要是小区里能团那种一人食的小份预制菜就好了，便宜又方便！',
        keywords: ['一人食', '预制菜', '社区团购'],
        url: 'https://www.xiaohongshu.com/explore/example6'
    },
    {
        id: 7,
        platform: 'reddit',
        author: 'u/throwaway_saas',
        time: '8分钟前',
        likes: '1,247',
        content: 'I built a SaaS tool for freelance designers to manage invoices and contracts. It took 3 months to build but I only have 12 paying users. What am I doing wrong? Should I pivot to a different niche?',
        keywords: ['SaaS', '自由职业', '发票管理'],
        url: 'https://reddit.com/r/SaaS/comments/example7'
    },
    {
        id: 8,
        platform: 'douyin',
        author: '宠物医生小李',
        time: '3小时前',
        likes: '5.6万',
        content: '养猫的人越来越多，但宠物医疗太贵了！一次体检就要上千。有没有那种可以在线咨询宠物医生、或者AI初步判断宠物健康状况的工具啊？铲屎官们真的很需要！',
        keywords: ['宠物医疗', 'AI问诊', '在线咨询'],
        url: 'https://www.douyin.com/video/example8'
    }
];

// 开源项目数据
const PROJECTS = [
    {
        id: 1,
        name: 'openai/whisper',
        fullName: 'openai/whisper',
        description: 'Robust Speech Recognition via Large-Scale Weak Supervision. 支持99种语言的语音识别模型，可用于语音转文字、字幕生成等场景。',
        language: 'Python',
        langColor: '#3572A5',
        stars: '39.2k',
        forks: '5.1k',
        activity: '高度活跃',
        lastUpdate: '2小时前',
        topics: ['ASR', '语音识别', '深度学习', 'Python'],
        remixScore: 88,
        remixLevel: '高',
        license: 'MIT',
        url: 'https://github.com/openai/whisper'
    },
    {
        id: 2,
        name: 'langgenius/dify',
        fullName: 'langgenius/dify',
        description: 'An open-source LLM app development platform. 可视化搭建AI应用，支持工作流、RAG、模型管理，可快速二创为垂直场景应用。',
        language: 'Python',
        langColor: '#3572A5',
        stars: '40.2k',
        forks: '6.8k',
        activity: '高度活跃',
        lastUpdate: '30分钟前',
        topics: ['LLM', 'AI应用', '工作流', 'RAG'],
        remixScore: 92,
        remixLevel: '极高',
        license: 'Apache-2.0',
        url: 'https://github.com/langgenius/dify'
    },
    {
        id: 3,
        name: 'ultralytics/yolov5',
        fullName: 'ultralytics/yolov5',
        description: 'YOLOv5 🚀 in PyTorch > ONNX > CoreML > TFLite. 最流行的目标检测框架，可用于人体检测、跌倒检测、物体识别等计算机视觉场景。',
        language: 'Python',
        langColor: '#3572A5',
        stars: '45.1k',
        forks: '9.8k',
        activity: '高度活跃',
        lastUpdate: '1小时前',
        topics: ['计算机视觉', '目标检测', 'PyTorch', '深度学习'],
        remixScore: 85,
        remixLevel: '高',
        license: 'AGPL-3.0',
        url: 'https://github.com/ultralytics/yolov5'
    },
    {
        id: 4,
        name: 'mermaid-js/mermaid',
        fullName: 'mermaid-js/mermaid',
        description: 'Generation of diagrams like flowcharts or sequence diagrams from text in a similar manner as markdown. 文本生成图表，可用于思维导图、流程图、架构图等可视化场景。',
        language: 'JavaScript',
        langColor: '#f1e05a',
        stars: '62.3k',
        forks: '5.8k',
        activity: '高度活跃',
        lastUpdate: '45分钟前',
        topics: ['图表', '可视化', '思维导图', 'JavaScript'],
        remixScore: 78,
        remixLevel: '中高',
        license: 'MIT',
        url: 'https://github.com/mermaid-js/mermaid'
    },
    {
        id: 5,
        name: 'coqui-ai/TTS',
        fullName: 'coqui-ai/TTS',
        description: '🐸💬 - a deep learning toolkit for Text-to-Speech. 开源语音合成框架，支持多语言、多声音，可用于AI配音、有声书、语音助手等场景。',
        language: 'Python',
        langColor: '#3572A5',
        stars: '18.5k',
        forks: '2.3k',
        activity: '活跃',
        lastUpdate: '3小时前',
        topics: ['TTS', '语音合成', '深度学习', 'Python'],
        remixScore: 82,
        remixLevel: '高',
        license: 'MPL-2.0',
        url: 'https://github.com/coqui-ai/TTS'
    },
    {
        id: 6,
        name: 'microsoft/playwright',
        fullName: 'microsoft/playwright',
        description: 'Playwright is a framework for Web Testing and Automation. 跨浏览器自动化测试框架，可用于爬虫、数据抓取、自动化操作等场景。',
        language: 'TypeScript',
        langColor: '#3178c6',
        stars: '58.7k',
        forks: '3.4k',
        activity: '高度活跃',
        lastUpdate: '15分钟前',
        topics: ['自动化', '爬虫', '测试', 'TypeScript'],
        remixScore: 75,
        remixLevel: '中高',
        license: 'Apache-2.0',
        url: 'https://github.com/microsoft/playwright'
    }
];

// 趋势洞察数据
const TRENDS = [
    {
        id: 1,
        title: 'AI应用需求爆发',
        value: '+156%',
        desc: 'AI工具类需求同比增长156%，职场效率、内容创作、学习辅助是三大热门场景'
    },
    {
        id: 2,
        title: '银发经济崛起',
        value: '+95%',
        desc: '独居老人安全监测、健康管理、远程关怀类需求快速增长，供给严重不足'
    },
    {
        id: 3,
        title: '短剧出海风口',
        value: '+185%',
        desc: '中文短剧出海爆发式增长，翻译、配音、分发等工具需求激增，B端付费意愿强'
    }
];

// 数据看板数据
const DASHBOARD = [
    { value: '1,247,832', change: '+12.5%', changeType: 'up', label: '今日抓取评论', desc: '全网需求信号原始数据量' },
    { value: '286', change: '+8.2%', changeType: 'up', label: '今日新增机会', desc: 'AI筛选后的高潜力方向' },
    { value: '47', change: '+5.1%', changeType: 'up', label: '可二创项目', desc: '匹配开源项目的成熟方向' },
    { value: '6', change: '', changeType: '', label: '覆盖平台', desc: 'Twitter · 抖音 · 小红书 · Reddit · 知乎 · GitHub', platforms: true }
];
