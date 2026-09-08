/* ===== Need2Build 应用逻辑层 ===== */

// 全局状态
let currentTab = 'radar';
let currentCategory = 'all';
let currentSubcategory = null;
let currentTypeFilter = 'all';
let currentPlatformFilter = 'all';
let currentLanguageFilter = 'all';
let currentSort = 'stars';
let showFailures = false;
let searchQuery = '';
let favorites = [];

// 从本地存储加载收藏
function loadFavorites() {
    try {
        const saved = localStorage.getItem('need2build_favorites');
        if (saved) {
            favorites = JSON.parse(saved);
        }
    } catch (e) {
        favorites = [];
    }
    updateFavoritesCount();
}

// 保存收藏到本地存储
function saveFavorites() {
    try {
        localStorage.setItem('need2build_favorites', JSON.stringify(favorites));
    } catch (e) {
        console.error('Failed to save favorites:', e);
    }
}

// 更新收藏数量
function updateFavoritesCount() {
    const countEl = document.getElementById('favoritesCount');
    if (countEl) {
        countEl.textContent = favorites.length;
        countEl.style.display = favorites.length > 0 ? 'flex' : 'none';
    }
}

// 初始化应用
let appInitialized = false;

async function initApp() {
    if (appInitialized) return;
    appInitialized = true;

    loadFavorites();
    renderCategories();
    renderDashboard();
    renderTrends();
    renderPlatformFilters();
    renderOpportunities(getFilteredOpportunities());
    renderSignals(getFilteredSignals());
    renderProjects(getFilteredProjects());
    renderFavorites();

    // 并行加载：通用实时数据（GitHub/非 Twitter）+ 真实 Twitter 数据
    Promise.all([
        typeof loadLiveData === 'function' ? loadLiveData() : Promise.resolve(false),
        loadRealTwitterSignals()
    ]).then(([liveLoaded, twitterLoaded]) => {
        // 真实数据就绪后重建机会雷达：信号 → 机会 → 开源项目 自动关联
        if (typeof refreshOpportunityPipeline === 'function') {
            refreshOpportunityPipeline();
        }
        updatePipelineDashboard();
        if (typeof updateLiveSourceLabel === 'function') {
            updateLiveSourceLabel();
        }
        renderCategories();
        renderDashboard();
        renderTrends();
        renderSignals(getFilteredSignals());
        renderOpportunities(getFilteredOpportunities());
        renderProjects(getFilteredProjects());
        renderFavorites();
        if (twitterLoaded) {
            showToast('已加载最新 Twitter 真实需求数据');
        }
    });
}

// 让数据看板反映“信号 → 机会 → 供给”三段链路，而不是三张孤立数字
function updatePipelineDashboard() {
    const signalCount = getMergedSignals().length;
    const opportunityCount = OPPORTUNITIES.length;
    const projectCount = PROJECTS.length;
    DASHBOARD.splice(
        0,
        DASHBOARD.length,
        { value: String(signalCount), change: '', changeType: '', label: '需求信号', desc: '原文 + 需求解读，可点开原文核验' },
        { value: String(opportunityCount), change: '', changeType: '', label: '机会雷达', desc: '由需求信号自动聚类，带证据链' },
        { value: String(projectCount), change: '', changeType: '', label: '开源供给', desc: '可二创/复用的真实项目' },
        { value: '', change: '', changeType: '', label: '三段链路', desc: '信号 → 机会 → 项目，三者可互相跳转', platforms: true }
    );

    const sidebarMap = {
        sidebarSignalCount: signalCount,
        sidebarOpportunityCount: opportunityCount,
        sidebarProjectCount: projectCount
    };
    Object.entries(sidebarMap).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
}

// 从一条需求信号跳转到它聚合出的机会
function openSignalOpportunity(signalId) {
    const signal = getMergedSignals().find(s => String(s.id) === String(signalId));
    if (!signal || !signal.opportunityId) {
        switchTab('radar');
        showToast('这条信号仍处于观察中，尚未聚类为机会');
        return;
    }
    switchTab('radar');
    openDrawer(signal.opportunityId);
}

// 从开源项目跳转到它可支撑的机会
function openProjectOpportunities(projectId) {
    const project = PROJECTS.find(p => String(p.id) === String(projectId));
    if (!project || !project.relatedOpportunityIds || project.relatedOpportunityIds.length === 0) {
        showToast('该项目暂未匹配到机会，仍在供给池观察中');
        return;
    }
    switchTab('radar');
    openDrawer(project.relatedOpportunityIds[0]);
}

// 切换Tab
function switchTab(tab) {
    currentTab = tab;

    // 更新导航栏状态
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // 显示对应页面
    document.querySelectorAll('.tab-page').forEach(page => {
        page.style.display = 'none';
    });
    document.getElementById(`page-${tab}`).style.display = 'flex';

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 展开/收起分类
function toggleCategory(categoryId) {
    const item = document.getElementById(`cat-${categoryId}`);
    if (item) {
        item.classList.toggle('expanded');
    }
}

// 选择分类（全部）
function selectCategory(categoryId, element) {
    currentCategory = categoryId;
    currentSubcategory = null;

    // 更新选中状态
    document.querySelectorAll('.category-header').forEach(h => h.classList.remove('active'));
    element.classList.add('active');

    // 重新渲染列表
    refreshCurrentList();
}

// 选择子分类
function selectSubcategory(subId, subName, element) {
    currentCategory = 'subcategory';
    currentSubcategory = subId;

    // 更新选中状态
    document.querySelectorAll('.category-header').forEach(h => h.classList.remove('active'));
    document.querySelectorAll('.subcategory-item').forEach(s => s.classList.remove('active'));
    element.classList.add('active');

    // 重新渲染列表
    refreshCurrentList();

    showToast(`已筛选：${subName}`);
}

// 按类型筛选
function filterByType(type) {
    currentTypeFilter = type;
    document.querySelectorAll('#typeFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    renderOpportunities(getFilteredOpportunities());
}

// 按平台筛选
function filterByPlatform(platform) {
    currentPlatformFilter = platform;
    document.querySelectorAll('#platformFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.platform === platform);
    });
    renderSignals(getFilteredSignals());
}

// 按语言筛选
function filterByLanguage(lang) {
    currentLanguageFilter = lang;
    document.querySelectorAll('#languageFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    renderProjects(getFilteredProjects());
}

// 排序项目
function sortProjects(sort) {
    currentSort = sort;
    renderProjects(getFilteredProjects());
}

// 搜索
function handleSearch(query) {
    searchQuery = query.trim().toLowerCase();
    refreshCurrentList();
}

// 刷新当前列表
function refreshCurrentList() {
    if (currentTab === 'radar') {
        renderOpportunities(getFilteredOpportunities());
    } else if (currentTab === 'signals') {
        renderSignals(getFilteredSignals());
    } else if (currentTab === 'supply') {
        renderProjects(getFilteredProjects());
    }
}

// 获取筛选后的机会列表
function getFilteredOpportunities() {
    let items = OPPORTUNITIES.filter(item => {
        // 失败案例筛选
        if (item.status === 'failure') {
            return showFailures;
        }
        if (!showFailures && item.status === 'failure') {
            return false;
        }

        // 类型筛选
        if (currentTypeFilter !== 'all' && item.status !== currentTypeFilter) {
            return false;
        }

        // 分类筛选
        if (currentSubcategory) {
            if (item.category !== currentSubcategory) {
                return false;
            }
        } else if (currentCategory !== 'all') {
            const cat = CATEGORIES.find(c => c.id === currentCategory);
            if (cat && !cat.subcategories.some(s => s.id === item.category)) {
                return false;
            }
        }

        // 搜索
        if (searchQuery) {
            const searchText = `${item.title} ${item.desc} ${item.categoryName} ${item.comment.text}`.toLowerCase();
            if (!searchText.includes(searchQuery)) {
                return false;
            }
        }

        return true;
    });

    // 按评分排序
    items.sort((a, b) => b.score - a.score);

    return items;
}

// 获取筛选后的信号列表
function getFilteredSignals() {
    return getMergedSignals().filter(item => {
        // 平台筛选
        if (currentPlatformFilter !== 'all' && item.platform !== currentPlatformFilter) {
            return false;
        }

        // 搜索
        if (searchQuery) {
            const searchText = `${item.author} ${item.content} ${(item.keywords || []).join(' ')}`.toLowerCase();
            if (!searchText.includes(searchQuery)) {
                return false;
            }
        }

        return true;
    });
}

// 获取筛选后的项目列表
function getFilteredProjects() {
    let items = PROJECTS.filter(item => {
        // 语言筛选
        if (currentLanguageFilter !== 'all' && item.language !== currentLanguageFilter) {
            return false;
        }

        // 搜索
        if (searchQuery) {
            const searchText = `${item.name} ${item.description} ${item.topics.join(' ')}`.toLowerCase();
            if (!searchText.includes(searchQuery)) {
                return false;
            }
        }

        return true;
    });

    // 排序
    if (currentSort === 'stars') {
        items.sort((a, b) => parseFloat(b.stars) - parseFloat(a.stars));
    } else if (currentSort === 'activity') {
        const activityOrder = { '高度活跃': 3, '活跃': 2, '一般': 1 };
        items.sort((a, b) => (activityOrder[b.activity] || 0) - (activityOrder[a.activity] || 0));
    } else if (currentSort === 'remix') {
        items.sort((a, b) => b.remixScore - a.remixScore);
    }

    return items;
}

// 切换失败案例显示
function toggleFailures(checked) {
    showFailures = checked;
    renderOpportunities(getFilteredOpportunities());
    showToast(checked ? '已显示失败案例' : '已隐藏失败案例');
}

// 打开详情抽屉
function openDrawer(id) {
    const item = OPPORTUNITIES.find(o => o.id === id);
    if (!item) return;

    renderDrawer(item);
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

// 打开失败案例抽屉
function openFailureDrawer(id) {
    const item = OPPORTUNITIES.find(o => o.id === id);
    if (!item) return;

    renderDrawer(item);
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

// 关闭抽屉
function closeDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

// 切换收藏
function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index > -1) {
        favorites.splice(index, 1);
        showToast('已取消收藏');
    } else {
        favorites.push(id);
        showToast('已收藏');
    }
    saveFavorites();
    updateFavoritesCount();
    renderFavorites();

    // 如果当前在机会雷达页面，重新渲染以更新收藏状态
    if (currentTab === 'radar') {
        renderOpportunities(getFilteredOpportunities());
    }

    // 如果抽屉打开着，重新渲染抽屉
    const drawer = document.getElementById('drawer');
    if (drawer.classList.contains('open')) {
        const item = OPPORTUNITIES.find(o => o.id === id);
        if (item) {
            renderDrawer(item);
        }
    }
}

// 切换收藏面板
function toggleFavorites() {
    const panel = document.getElementById('favoritesPanel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
        renderFavorites();
    }
}

// 分享机会
function shareOpportunity(id) {
    const item = OPPORTUNITIES.find(o => o.id === id);
    if (!item) return;

    const shareText = `【Need2Build 机会推荐】${item.title}\n评分：${item.score}分\n${item.desc}\n\n需求在左，产品在右，机会在中间。`;

    if (navigator.share) {
        navigator.share({
            title: item.title,
            text: shareText,
            url: window.location.href
        }).catch(() => {});
    } else {
        // 复制到剪贴板
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('已复制到剪贴板，快去分享吧！');
        }).catch(() => {
            showToast('分享内容：' + item.title);
        });
    }
}

// 生成跟踪报告
function generateReport() {
    if (favorites.length === 0) {
        showToast('还没有收藏的机会');
        return;
    }

    const favoritedItems = OPPORTUNITIES.filter(o => favorites.includes(o.id));
    let report = '📊 Need2Build 收藏机会跟踪报告\n\n';
    report += `共收藏 ${favoritedItems.length} 个机会\n\n`;

    favoritedItems.forEach((item, index) => {
        report += `${index + 1}. ${item.title}（${item.score}分）\n`;
        report += `   趋势：${item.trend}\n`;
        report += `   建议：${item.detail.tracking.recommendation}\n\n`;
    });

    report += '---\n需求在左，产品在右，机会在中间。';

    navigator.clipboard.writeText(report).then(() => {
        showToast('跟踪报告已复制到剪贴板！');
    }).catch(() => {
        showToast('报告生成成功（请手动复制）');
    });
}

// 切换移动端菜单
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('open');
}

// 显示Toast提示
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// 键盘事件
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDrawer();
        const favoritesPanel = document.getElementById('favoritesPanel');
        if (favoritesPanel.classList.contains('open')) {
            toggleFavorites();
        }
    }
});

// 点击遮罩关闭抽屉
document.getElementById('drawerOverlay').addEventListener('click', closeDrawer);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);

// 如果DOM已经加载完成，直接初始化
if (document.readyState !== 'loading') {
    initApp();
}
