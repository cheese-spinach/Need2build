/* ===== Need2Build 通用实时数据加载层 =====
 * js/live-data.json 由 GitHub Actions 定时运行 scripts/collect.py 生成，
 * 包含 GitHub 新仓库、非 Twitter 平台的实时信号与抓取状态。
 * Twitter 数据仍由 data/twitter_signals.json + loadRealTwitterSignals() 负责，
 * 二者并行加载，互不覆盖。
 */
const LIVE_DATA_URL = 'js/live-data.json';

async function loadLiveData() {
    try {
        const response = await fetch(`${LIVE_DATA_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) return false;

        const live = await response.json();
        if (!live || typeof live !== 'object') return false;

        if (typeof setLiveDataState === 'function') {
            setLiveDataState(live.signals, true);
        }

        if (Array.isArray(live.projects)) {
            PROJECTS.splice(0, PROJECTS.length, ...live.projects);
        }
        if (Array.isArray(live.trends)) {
            TRENDS.splice(0, TRENDS.length, ...live.trends);
        }
        if (Array.isArray(live.dashboard)) {
            DASHBOARD.splice(0, DASHBOARD.length, ...live.dashboard);
        }
        if (live.updatedAt) {
            renderLiveUpdateTime(live.updatedAt);
        }
        return true;
    } catch (err) {
        console.warn('[Need2Build] 通用实时数据加载失败，保留示例数据:', err);
        return false;
    }
}

function renderLiveUpdateTime(isoString) {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return;

    const pad = n => String(n).padStart(2, '0');
    const localText =
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}`;

    const footerEl = document.getElementById('liveFooterTime');
    if (footerEl) footerEl.textContent = `最后更新：${localText}`;

    const refreshEl = document.getElementById('liveRefreshText');
    if (refreshEl) refreshEl.textContent = `更新于 ${relativeLiveTime(date)}`;
}

function relativeLiveTime(date) {
    const diffSeconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
    if (diffSeconds < 60) return '刚刚';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} 分钟前`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} 小时前`;
    return `${Math.floor(diffSeconds / 86400)} 天前`;
}
