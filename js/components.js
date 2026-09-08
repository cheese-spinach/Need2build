/* ===== Need2Build 组件渲染层 ===== */

// 平台图标 SVG
const PLATFORM_ICONS = {
    xiaohongshu: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#FF2442"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 5v8h2v-3.5l2 3.5h2l-2.2-3.8L14 8h-2l-1.8 3V8H8zm6 0h2v8h-2V8z"/></svg>`,
    douyin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#1a1a1a"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>`,
    zhihu: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#0066ff"><path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0H5.72zm2.593 5.519h7.484c.34 0 .619.272.619.615v1.227c0 .343-.28.617-.62.617h-.836v9.858c0 .34-.28.615-.619.615h-1.755a.623.623 0 0 1-.618-.615v-9.858H8.932a.622.622 0 0 1-.618-.617V6.134c0-.343.278-.615.619-.615zM5.875 8.828h1.656c.343 0 .621.275.621.617v1.23c0 .34-.278.615-.621.615h-.621v6.764c0 .34-.278.617-.621.617H6.496a.617.617 0 0 1-.62-.617v-6.764h-.621a.616.616 0 0 1-.62-.615v-1.23c0-.342.278-.617.62-.617z"/></svg>`,
    twitter: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/></svg>`,
    reddit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4500"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.74c.69 0 1.25.56 1.25 1.25 0 .69-.56 1.25-1.25 1.25-.68 0-1.24-.56-1.24-1.25 0-.69.56-1.25 1.24-1.25zM8.08 6.24c-.23-.31-.67-.41-1.04-.24-.37.17-.56.56-.44.92.12.36.5.61.88.55.38-.06.69-.35.74-.73.03-.2-.02-.38-.14-.5zm13.34 6.04c-.02-2.09-1.72-3.76-3.82-3.72h-.03c-.77 0-1.52.22-2.15.62l-.14-.87c-.07-.44-.45-.77-.89-.77h-4.96c-.44 0-.82.33-.9.77l-.19 1.17c-.71-.53-1.64-.84-2.63-.84-2.11-.03-3.84 1.6-3.86 3.69-.02 1.32.63 2.5 1.64 3.24-.02.16-.03.32-.03.49 0 3.18 3.73 5.76 8.34 5.76 4.6 0 8.33-2.58 8.33-5.76 0-.17-.01-.34-.03-.5 1.03-.74 1.69-1.92 1.69-3.24zM9.55 14.4c.75 0 1.36.82 1.36 1.83 0 1-.61 1.82-1.36 1.82-.75 0-1.37-.82-1.37-1.82 0-1 .62-1.83 1.37-1.83zm5.81 3.65c-1.21 1.04-3.1 1.12-4.22.16-.13-.11-.1-.32.05-.4.15-.08.35-.02.46.09.7.62 1.9.71 2.71.15.12-.08.28-.06.38.04.1.1.08.27-.03.36.26.26.52.45.88.56.26.09.54.13.82.1.28-.02.56-.09.82-.2v.01zM14.5 16.23c0 1-.61 1.82-1.37 1.82-.75 0-1.36-.82-1.36-1.82 0-1 .61-1.83 1.36-1.83.76 0 1.37.83 1.37 1.83z"/></svg>`,
    github: `<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>`
};

// 统一替换为「靶心」图标，保留各平台品牌色
function targetMarkIcon(size, color) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="${color}" stroke-opacity="0.32" stroke-width="1.4"/>
        <circle cx="12" cy="12" r="5.8" stroke="${color}" stroke-opacity="0.7" stroke-width="1.5"/>
        <circle cx="12" cy="12" r="1.8" fill="${color}"/>
        <path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3" stroke="${color}" stroke-opacity="0.4" stroke-width="1.2" stroke-linecap="round"/>
    </svg>`;
}

const PLATFORM_TARGET_COLORS = {
    xiaohongshu: '#FF2442',
    douyin: '#1a1a1a',
    zhihu: '#0066ff',
    twitter: '#1DA1F2',
    reddit: '#ff4500',
    github: '#FFFFFF'
};
Object.keys(PLATFORM_TARGET_COLORS).forEach(key => {
    PLATFORM_ICONS[key] = targetMarkIcon(key === 'github' ? 18 : 14, PLATFORM_TARGET_COLORS[key]);
});

// 渲染赛道分类菜单
function renderCategories() {
    const container = document.getElementById('categoryList');
    let html = '';

    // 全部赛道
    html += `
        <div class="category-item">
            <div class="category-header active" onclick="selectCategory('all', this)">
                <span class="category-name">全部赛道</span>
                <span class="category-count">${OPPORTUNITIES.filter(o => o.status !== 'failure').length}</span>
            </div>
        </div>
    `;

    CATEGORIES.forEach(cat => {
        const count = OPPORTUNITIES.filter(o => o.category === cat.id || cat.subcategories.some(s => s.id === o.category)).length;
        html += `
            <div class="category-item" id="cat-${cat.id}">
                <div class="category-header" onclick="toggleCategory('${cat.id}')">
                    <span class="category-name">${cat.icon} ${cat.name}</span>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span class="category-count">${count}</span>
                        <svg class="category-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </div>
                </div>
                <div class="subcategory-list">
                    ${cat.subcategories.map(sub => `
                        <div class="subcategory-item" onclick="selectSubcategory('${sub.id}', '${sub.name}', this)">
                            <span class="subcategory-dot" style="background:${getCategoryColor(sub.id)}"></span>
                            ${sub.name}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// 获取分类颜色
function getCategoryColor(categoryId) {
    const colorMap = {
        silver: '#FF9500', pet: '#34C759', genz: '#FF2D55', she: '#AF52DE',
        local: '#007AFF', community: '#5AC8FA', shared: '#5856D6', city: '#8E8E93',
        'ai-tool': '#007AFF', 'ai-app': '#5856D6', content: '#FF9500', knowledge: '#AF52DE',
        brand: '#FF2D55', saas: '#34C759', 'overseas-content': '#FF9500', supply: '#8E8E93'
    };
    return colorMap[categoryId] || '#8E8E93';
}

// 渲染数据看板
function renderDashboard() {
    const container = document.getElementById('dashboardGrid');
    container.innerHTML = DASHBOARD.map(item => `
        <div class="dashboard-card">
            <div class="dashboard-value-row">
                <span class="dashboard-value">${item.value}</span>
                ${item.change ? `<span class="dashboard-change ${item.changeType}">${item.change}</span>` : ''}
            </div>
            <span class="dashboard-label">${item.label}</span>
            ${item.platforms ? `<span class="dashboard-platforms">${item.desc}</span>` : `<span class="dashboard-desc">${item.desc}</span>`}
        </div>
    `).join('');
}

// 渲染机会卡片
function renderOpportunities(opportunities) {
    const container = document.getElementById('opportunitiesList');

    if (opportunities.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text-tertiary);">暂无匹配的机会</div>`;
        return;
    }

    container.innerHTML = opportunities.map(item => {
        if (item.status === 'failure') {
            return renderFailureCard(item);
        }
        return renderOpportunityCard(item);
    }).join('');
}

// 渲染正常机会卡片
function renderOpportunityCard(item) {
    const isFavorited = favorites.includes(item.id);
    const circumference = 2 * Math.PI * 24;
    const offset = circumference - (item.score / 100) * circumference;
    const scoreColor = item.score >= 90 ? '#34C759' : item.score >= 80 ? '#0071e3' : '#FF9500';

    return `
        <div class="opportunity-card" onclick="openDrawer(${item.id})">
            <div class="score-ring">
                <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle class="score-ring-bg" cx="28" cy="28" r="24"/>
                    <circle class="score-ring-progress" cx="28" cy="28" r="24"
                        stroke="${scoreColor}"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${offset}"/>
                </svg>
                <span class="score-ring-text">${item.score}</span>
            </div>
            <div class="card-content">
                <div class="card-header">
                    <span class="card-title">${item.title}</span>
                    <div class="card-tags">
                        <span class="card-tag ${item.status}">${item.statusText}</span>
                        <span class="card-tag remix">可二创</span>
                        <span class="card-tag" style="background:rgba(0,0,0,0.05);color:var(--text-secondary);">${item.categoryName}</span>
                    </div>
                </div>
                <p class="card-desc">${item.desc}</p>
                <div class="card-meta">
                    <span class="meta-item">
                        ${PLATFORM_ICONS[item.comment.platform]}
                        <span class="meta-author">${item.comment.author}</span>
                    </span>
                    ${item.evidenceCount ? `<span class="meta-item meta-sources">来自 ${item.evidenceCount} 条信号</span>` : ''}
                    <span class="meta-item meta-likes">♥ ${item.comment.likes}</span>
                    <span class="meta-item meta-projects">${item.projects} 个匹配开源项目</span>
                    <span class="meta-item meta-cost">${item.cost}</span>
                    <span class="meta-item meta-trend">↗ ${item.trend}</span>
                    <span class="meta-update">更新于 ${item.updated}</span>
                </div>
            </div>
            <div class="card-actions" onclick="event.stopPropagation()">
                <button class="action-btn ${isFavorited ? 'favorited' : ''}" onclick="toggleFavorite(${item.id})" title="收藏">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                </button>
                <button class="action-btn" onclick="shareOpportunity(${item.id})" title="分享">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

// 渲染失败案例卡片
function renderFailureCard(item) {
    return `
        <div class="opportunity-card failure" onclick="openFailureDrawer(${item.id})">
            <div class="score-ring" style="opacity:0.5;">
                <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle class="score-ring-bg" cx="28" cy="28" r="24"/>
                    <circle class="score-ring-progress" cx="28" cy="28" r="24" stroke="#8E8E93" stroke-dasharray="150.8" stroke-dashoffset="150.8"/>
                </svg>
                <span class="score-ring-text" style="font-size:14px;color:var(--text-tertiary);">失败</span>
            </div>
            <div class="card-content">
                <div class="card-header">
                    <span class="card-title" style="color:var(--text-secondary);">${item.title}</span>
                    <div class="card-tags">
                        <span class="card-tag failure-tag">已失败</span>
                        <span class="card-tag" style="background:rgba(0,0,0,0.05);color:var(--text-secondary);">${item.categoryName}</span>
                    </div>
                </div>
                <p class="card-desc" style="color:var(--text-tertiary);">${item.desc}</p>
                <div class="card-meta">
                    <span class="meta-item" style="color:var(--color-danger);">⚠ ${item.failureReason}</span>
                    <span class="meta-update">${item.updated}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="action-btn" style="color:var(--color-danger);" title="查看死因">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

// 渲染需求信号列表
function renderSignals(signals) {
    const container = document.getElementById('signalsList');

    if (signals.length === 0) {
        const noTwitter = currentPlatformFilter === 'twitter' && realTwitterSignals.length === 0;
        const message = noTwitter
            ? 'Twitter 数据尚未接入：请在仓库 Settings → Secrets 添加 TWITTER_BEARER_TOKEN 后运行 Refresh live data'
            : '暂无匹配的信号';
        container.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text-tertiary);">${message}</div>`;
        return;
    }

    container.innerHTML = signals.map(item => {
        const platform = PLATFORMS[item.platform];
        const isReal = item.isReal === true;
        const keywords = item.keywords || [];
        const realBadgeText = item.platform === 'twitter' ? 'Twitter 真实抓取·附原链接' : '真实数据·附原链接';
        return `
            <div class="signal-card" ${isReal ? 'style="border-left:3px solid #1DA1F2;"' : ''}>
                <div class="signal-header">
                    <span class="signal-platform">${PLATFORM_ICONS[item.platform]} ${platform.name}</span>
                    ${isReal ? '<span class="signal-badge-real">真实数据</span>' : ''}
                    <span class="signal-author">${item.author}</span>
                    <span class="signal-time">${item.time}</span>
                    <span class="signal-likes">♥ ${item.likes}</span>
                    ${item.retweets !== undefined ? `<span class="signal-likes" style="color:#5856d6;">🔁 ${item.retweets}</span>` : ''}
                    ${item.replies !== undefined ? `<span class="signal-likes" style="color:#34c759;">💬 ${item.replies}</span>` : ''}
                </div>
                <div class="signal-content">${item.content}</div>
                ${item.needText ? `
                <div class="signal-need">
                    <div class="signal-need-head">
                        <span class="signal-need-label">需求解读</span>
                        <span class="signal-need-type">${item.needType || '趋势观察'}</span>
                    </div>
                    <div class="signal-need-text">${item.needText}</div>
                    ${item.domainName ? `<div class="signal-need-domain">追踪主题：${item.domainName}</div>` : ''}
                </div>` : ''}
                <div class="signal-footer">
                    <span class="signal-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        ${isReal ? realBadgeText : '原始数据·非AI生成·可点击核验'}
                    </span>
                    <a class="signal-link" href="${item.url}" target="_blank" onclick="event.stopPropagation()">
                        查看原文
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                    </a>
                    <div class="signal-keywords">
                        ${keywords.map(k => `<span class="signal-keyword">${k}</span>`).join('')}
                    </div>
                    ${item.opportunityId ? `<button class="signal-trace-btn" onclick="openSignalOpportunity('${item.id}')">
                        查看关联机会 →
                    </button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 渲染开源项目列表
function renderProjects(projects) {
    const container = document.getElementById('projectsList');

    if (projects.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text-tertiary);">暂无匹配的项目</div>`;
        return;
    }

    container.innerHTML = projects.map(item => `
        <div class="project-card" onclick="window.open('${item.url}', '_blank')">
            <div class="project-header">
                <div class="project-icon">${PLATFORM_ICONS.github}</div>
                <div class="project-info">
                    <div class="project-name">${item.name}</div>
                    <div class="project-lang">
                        <span class="lang-dot" style="background:${item.langColor}"></span>
                        ${item.language} · ${item.license}
                    </div>
                </div>
                <div class="project-stars">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF9500" stroke="#FF9500" stroke-width="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    ${item.stars}
                </div>
            </div>
            <p class="project-desc">${item.description}</p>
            <div class="project-meta">
                <span class="project-meta-item ${item.activity === '高度活跃' ? 'active' : ''}">● ${item.activity}</span>
                <span class="project-meta-item">更新于 ${item.lastUpdate}</span>
                <span class="project-meta-item">Forks ${item.forks}</span>
                ${item.relatedOpportunityCount ? `<button class="project-opportunity-btn" onclick="event.stopPropagation(); openProjectOpportunities('${item.id}')">
                    支撑 ${item.relatedOpportunityCount} 个机会
                </button>` : ''}
                <div class="remix-score">
                    <span class="remix-score-label">可二创度</span>
                    <span class="remix-score-value">${item.remixScore}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// 渲染趋势洞察
function renderTrends() {
    const container = document.getElementById('trendsCards');
    container.innerHTML = TRENDS.map(item => `
        <div class="trend-card">
            <div class="trend-card-title">${item.title}</div>
            <div class="trend-card-value">${item.value}</div>
            <div class="trend-card-desc">${item.desc}</div>
        </div>
    `).join('');
}

// 渲染平台筛选按钮
function renderPlatformFilters() {
    const container = document.getElementById('platformFilters');
    const platforms = ['all', 'xiaohongshu', 'douyin', 'zhihu', 'twitter', 'reddit'];
    container.innerHTML = platforms.map(p => {
        if (p === 'all') {
            return `<button class="filter-btn active" data-platform="all" onclick="filterByPlatform('all')">全部</button>`;
        }
        const platform = PLATFORMS[p];
        return `<button class="filter-btn platform-${platform.region}" data-platform="${p}" onclick="filterByPlatform('${p}')">${platform.name}</button>`;
    }).join('');
}

// 渲染详情抽屉
function renderDrawer(item) {
    const container = document.getElementById('drawerContent');

    if (item.status === 'failure') {
        container.innerHTML = renderFailureDrawer(item);
        return;
    }

    const dims = item.dims;
    container.innerHTML = `
        <h1 class="drawer-title">${item.title}</h1>
        <div class="drawer-evidence">证据链：${item.evidenceCount || item.detail.sources.length} 条信号 → ${item.projects || 0} 个开源项目</div>

        <!-- 评分维度 -->
        <div class="drawer-section">
            <div class="drawer-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                机会评分（${item.score}分）
            </div>
            <div class="drawer-score-row">
                <div class="drawer-score-item">
                    <span class="drawer-score-label">需求热度</span>
                    <span class="drawer-score-value">${dims.demand}</span>
                    <div class="drawer-score-bar"><div class="drawer-score-bar-fill" style="width:${dims.demand}%"></div></div>
                </div>
                <div class="drawer-score-item">
                    <span class="drawer-score-label">竞争程度</span>
                    <span class="drawer-score-value">${dims.comp}</span>
                    <div class="drawer-score-bar"><div class="drawer-score-bar-fill" style="width:${dims.comp}%;background:var(--color-warning);"></div></div>
                </div>
                <div class="drawer-score-item">
                    <span class="drawer-score-label">可行性</span>
                    <span class="drawer-score-value">${dims.feas}</span>
                    <div class="drawer-score-bar"><div class="drawer-score-bar-fill" style="width:${dims.feas}%;background:var(--color-success);"></div></div>
                </div>
                <div class="drawer-score-item">
                    <span class="drawer-score-label">成本可控</span>
                    <span class="drawer-score-value">${dims.cost}</span>
                    <div class="drawer-score-bar"><div class="drawer-score-bar-fill" style="width:${dims.cost}%;background:var(--color-accent);"></div></div>
                </div>
            </div>
        </div>

        <!-- 需求来源 -->
        <div class="drawer-section">
            <div class="drawer-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                需求来源分布
            </div>
            <div class="source-list">
                ${item.detail.sources.map(s => `
                    <div class="source-item">
                        <div class="source-platform" style="background:${PLATFORMS[s.platform].color}15;">
                            ${PLATFORM_ICONS[s.platform]}
                        </div>
                        <div class="source-info">
                            <div class="source-author">${s.author}</div>
                            <div class="source-text">${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${s.text}</a>` : s.text}</div>
                        </div>
                        <span class="source-percent">${s.percent}%</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- 匹配开源项目 -->
        <div class="drawer-section">
            <div class="drawer-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>
                匹配开源项目（${item.projects}/${item.totalProjects}）
            </div>
            <div class="project-match-list">
                ${item.detail.matchedProjects.map(p => `
                    <div class="project-match-item">
                        <div class="project-match-icon">${PLATFORM_ICONS.github}</div>
                        <div class="project-match-info">
                            <div class="project-match-name">${p.name}</div>
                            <div class="project-match-meta">
                                <span>${p.stars} stars</span>
                                <span>${p.lang}</span>
                                <span>${p.activity}</span>
                                <span>差异化难度：${p.diff}</span>
                            </div>
                        </div>
                        <span class="project-match-score">${p.match}%</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- 二创落地建议 -->
        <div class="drawer-section">
            <div class="drawer-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                二创落地建议
            </div>
            <div class="remix-suggestion">
                <div class="remix-direction"><strong>推荐方向：</strong>${item.detail.remixAdvice.direction}</div>
                <div class="remix-tech"><strong>技术路径：</strong>${item.detail.remixAdvice.tech}</div>
                <div class="remix-diff"><strong>差异化：</strong>${item.detail.remixAdvice.diff}</div>
            </div>
        </div>

        <!-- 行动计划 -->
        <div class="drawer-section">
            <div class="drawer-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                行动计划
            </div>
            <div class="action-plan">
                ${item.detail.actionPlan.map(step => `
                    <div class="action-step">
                        <div class="step-number">${step.step}</div>
                        <div class="step-content">
                            <div class="step-title">${step.title}</div>
                            <div class="step-time">${step.time}</div>
                            <div class="step-desc">${step.desc}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- 跟踪报告 -->
        <div class="drawer-section">
            <div class="drawer-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                跟踪报告
            </div>
            <div class="tracking-report">
                <div class="report-item">
                    <span class="report-label">需求趋势变化</span>
                    <span class="report-value up">${item.detail.tracking.trendChange}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">本周新增开源项目</span>
                    <span class="report-value">${item.detail.tracking.newProjects} 个</span>
                </div>
                <div class="report-item">
                    <span class="report-label">风险等级</span>
                    <span class="report-value">${item.detail.tracking.riskLevel}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">入场建议</span>
                    <span class="report-value">${item.detail.tracking.recommendation}</span>
                </div>
                <div class="report-item">
                    <span class="report-label">未来预测</span>
                    <span class="report-value">${item.detail.tracking.forecast}</span>
                </div>
            </div>
        </div>

        <!-- 底部按钮 -->
        <div class="drawer-footer">
            <button class="btn btn-secondary" onclick="toggleFavorite(${item.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                ${favorites.includes(item.id) ? '已收藏' : '收藏'}
            </button>
            <button class="btn btn-primary" onclick="shareOpportunity(${item.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                分享机会
            </button>
        </div>
    `;
}

// 渲染失败案例抽屉
function renderFailureDrawer(item) {
    return `
        <h1 class="drawer-title" style="color:var(--text-secondary);">${item.title}</h1>
        <div class="drawer-section">
            <div class="drawer-section-title" style="color:var(--color-danger);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                失败原因
            </div>
            <div style="padding:16px;background:rgba(255,59,48,0.05);border-radius:12px;border:0.5px solid rgba(255,59,48,0.15);">
                <p style="font-size:14px;color:var(--text-primary);line-height:1.6;">${item.failureReason}</p>
            </div>
        </div>
        <div class="drawer-section">
            <div class="drawer-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                经验教训
            </div>
            <div style="padding:16px;background:var(--bg-tertiary);border-radius:12px;">
                <p style="font-size:14px;color:var(--text-primary);line-height:1.6;">${item.failureLesson}</p>
            </div>
        </div>
        <div class="drawer-section">
            <div class="drawer-section-title">案例描述</div>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;">${item.desc}</p>
        </div>
    `;
}

// 渲染收藏列表
function renderFavorites() {
    const container = document.getElementById('favoritesList');
    const favoritedItems = OPPORTUNITIES.filter(o => favorites.includes(o.id) && o.status !== 'failure');

    if (favoritedItems.length === 0) {
        container.innerHTML = `
            <div class="favorites-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                <span class="favorites-empty-text">还没有收藏的机会</span>
            </div>
        `;
        return;
    }

    container.innerHTML = favoritedItems.map(item => `
        <div class="favorite-item" onclick="openDrawer(${item.id}); toggleFavorites();">
            <span class="favorite-score">${item.score}</span>
            <div class="favorite-info">
                <div class="favorite-name">${item.title}</div>
                <div class="favorite-meta">${item.statusText} · ${item.categoryName} · ${item.trend}</div>
            </div>
            <button class="favorite-remove" onclick="event.stopPropagation(); toggleFavorite(${item.id})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `).join('');
}
