/* ===== Need2Build 需求雷达（新链路）=====
 * 数据由 scripts/need-radar.mjs 生成，链路是：
 *   抖音指数平台词表 → 关联词自动扩散 → 需求形状过滤 → GitHub 开源项目匹配
 * 与老链路（热榜信号 → 聚类）并列展示，互不覆盖。
 *
 * 这里刻意不产出 0-100 的综合评分：评分需要真实权重校准，
 * 在没校准之前，卡片只展示可核对的原始证据（需求词、方向、项目）。
 */
const NEED_RADAR_URL = 'data/need-radar.json';

let needRadarData = null;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function loadNeedRadar() {
    try {
        const resp = await fetch(`${NEED_RADAR_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!resp.ok) return false;
        const data = await resp.json();
        if (!data || !Array.isArray(data.opportunities)) return false;
        needRadarData = data;
        return true;
    } catch (err) {
        console.warn('[Need2Build] 需求雷达数据加载失败:', err);
        return false;
    }
}

function renderNeedRadar() {
    const section = document.getElementById('needRadarSection');
    const list = document.getElementById('needRadarList');
    const summary = document.getElementById('needRadarSummary');
    if (!section || !list) return;

    if (!needRadarData || needRadarData.opportunities.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    const d = needRadarData;
    if (summary) {
        summary.textContent =
            `平台词池 ${d.poolDomains} 个领域 / ${d.poolWords} 个词（零人工挑词）` +
            ` → 扩散 ${d.seedCount} 个种子 → 生成 ${d.opportunityCount} 张卡，其中 ${d.projectsMatched} 张已匹配开源项目`;
    }

    list.innerHTML = d.opportunities.map(opp => {
        const platformLabel = opp.platform === 'xiaohongshu' ? '小红书' : '抖音';
        const platformCls = opp.platform === 'xiaohongshu' ? 'nr-plat-xhs' : 'nr-plat-dy';
        const originLabel = {
            'platform-pool': '平台词表',
            'xhs-filter': '搜索筛选词',
            'seed': '赛道种子',
            'hot-topic-control': '热榜对照'
        }[opp.origin] || opp.origin;

        const directions = opp.directions.map(dir => `
            <div class="nr-dir">
                <span class="nr-dir-label">${escapeHtml(dir.shape)}</span>
                <span class="nr-dir-words">${dir.words.map(w => escapeHtml(w)).join('、')}</span>
            </div>`).join('');

        const geo = opp.geoHints && opp.geoHints.length
            ? `<div class="nr-geo">地域意图：${opp.geoHints.map(w => escapeHtml(w)).join('、')}</div>`
            : '';

        const projects = opp.projects && opp.projects.length
            ? `<div class="nr-projects">${opp.projects.map(p => `
                    <a class="nr-project" href="${escapeHtml(p.url)}" target="_blank" rel="noopener">
                        <span class="nr-project-name">${escapeHtml(p.name)}</span>
                        <span class="nr-project-stars">★ ${p.stars}</span>
                        <span class="nr-project-desc">${escapeHtml(p.description)}</span>
                    </a>`).join('')}</div>`
            : `<div class="nr-projects nr-projects-empty">暂未匹配到开源项目（品类英文词典还没覆盖到这个赛道）</div>`;

        return `
        <div class="nr-card">
            <div class="nr-head">
                <span class="nr-seed">${escapeHtml(opp.seed)}</span>
                <span class="nr-plat ${platformCls}">${platformLabel}</span>
                <span class="nr-badge">需求雷达</span>
                <span class="nr-origin">${escapeHtml(originLabel)}</span>
                <span class="nr-meta">需求词 ${opp.demandWordCount}/${opp.relatedWordCount} · 方向 ${opp.directionCount} 类</span>
            </div>
            <div class="nr-directions">${directions}</div>
            ${geo}
            ${projects}
        </div>`;
    }).join('');
}
