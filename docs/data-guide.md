# Need2Build 实时数据接入说明

## 整体原理

GitHub Pages 是纯静态托管，前端不能保存密钥，也不能直接调用 X/抖音/小红书/知乎的接口。因此本项目采用：

1. **GitHub Actions 定时任务**（默认每 2 小时）运行 `scripts/collect.py`
2. 采集脚本把 Twitter 结果写入 `data/twitter_signals.json`，把 GitHub 新仓库、
   RSS、第三方导入等写入 `js/live-data.json`
3. 前端并行加载两份数据：`js/live.js` 负责 `live-data.json`，
   `loadRealTwitterSignals()` 负责 Twitter，加载成功后自动覆盖示例数据

仓库根目录的 `index.html` / `js/app.js` 无需再改，数据刷新后自动生效。

## 第一步：接入 X（最容易，推荐先做）

1. 打开 [developer.x.com](https://developer.x.com)，登录你申请的开发者账号
2. 进入 **Dashboard** → **Projects & Apps**，确认有 Project 和 App
3. 进入 App 的 **Keys and tokens**，复制 **Bearer Token**（不是 API Key，也不是 Secret）
4. 到本仓库 GitHub 页面：**Settings → Secrets and variables → Actions → New repository secret**
5. Secret 名称填 `TWITTER_BEARER_TOKEN`，Value 粘贴 Bearer Token
6. 到仓库 **Actions** 页，左侧选择 **Refresh live data**，点 **Run workflow** 手动跑一次
7. 等 1–3 分钟 Pages 重新部署后，刷新网站即可看到 Twitter 真实需求信号和更新时间

注意：
- 免费 X 开发者账号目前主要支持发帖，`search/recent` 需要带读取额度的付费套餐（Basic 及以上）
- 如果调用失败，Actions 运行日志里会显示原因；工作流仍会成功刷新 GitHub 项目数据
- 搜索关键词在 `config/x-queries.json` 中修改，`maxResults` 建议保持 5–10 以免超出额度
- 旧的 `X_BEARER_TOKEN` Secret 也可兼容，但统一建议使用 `TWITTER_BEARER_TOKEN`

## 第二步：知乎

在 `config/rss-feeds.json` 中填入你自建 RSSHub 的知乎路由，例如：

```json
[
  { "url": "https://你的域名/zhihu/hotlist", "platform": "zhihu", "label": "知乎热榜" }
]
```

公共 RSSHub 实例容易限流，建议自建。没有 RSSHub 时跳过即可，不影响其他源。

## 第三步：抖音 / 小红书全网内容（重要限制）

这两家**没有对外开放的全网关键词搜索 API**，GitHub Actions 这个简单方案无法直接“抓全网”。
正规可行路径只有三种：

1. **只接自己有权限的内容**：抖音开放平台（企业认证）、小红书专业号后台
2. **购买第三方数据服务**（新红、千瓜、蝉妈妈等），用它们提供的导出/API 拿数据
3. **把第三方导出的内容放入 `data/manual-signals.json`**，下次定时任务会自动合并进页面

`data/manual-signals.json` 格式与 `data/manual-signals.example.json` 一致，`platform` 字段必须是
`douyin` / `xiaohongshu` / `zhihu` 之一，每条必须带可点击的原链接。

如果第三方服务提供 REST API 且返回 `{"signals": [...]}`，也可以把接口地址填进
`config/http-signals.json`，定时任务会自动调用并合并。

`live-data.json` 里的信号会被标记为真实数据；Twitter 信号在 `twitter_signals.json`
中单独维护，标记为“真实抓取”。

## 常见问题

- **页面还是旧数据？** 手动运行一次 **Refresh live data**，等待 Pages 重新部署（通常 1–3 分钟）
- **某平台列表为空？** 表示该源还没配置成功，打开 Actions 日志查看 `sourceNotes`
- **想改成每 30 分钟？** 修改 `.github/workflows/refresh-data.yml` 的 cron，并注意 X 的 API 额度
- **live-data.json / twitter_signals.json 不存在或为空？** 页面自动回退到 `js/data.js`
  中的示例数据（Twitter 示例除外，避免把假数据标成真实抓取）
