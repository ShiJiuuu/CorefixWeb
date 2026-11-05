# CoreFix Pro 官网 · 上海集培优信息科技

GPU 维修维保与算力硬件服务的品牌官网。纯前端、可静态托管、三语（简 / 繁 / EN）、深浅双主题。

设计稿见 `design/`（`design/index.html` 为最新 v2.1 黑白版，`design/v1-dark.html` 为早期深色存档）。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 15（App Router，`output: 'export'` 静态导出）+ React 19 |
| 样式 | Tailwind CSS v4（`@theme inline` + CSS 变量，深浅色一套令牌） |
| 动效 | GSAP 3 + ScrollTrigger（原生免费） |
| 平滑滚动 | Lenis（与 ScrollTrigger 的 ticker 同步） |
| 内容 | `src/content/*` 单源字典，按语言分文件 |

## 本地运行

```bash
npm install
npm run dev          # http://localhost:3000 → 自动跳 /zh-cn/
npm run build        # 产出 out/（纯静态）
npx serve out        # 预览构建产物
```

`out/` 可直接丢到任意 OSS / CDN / Nginx；根目录的 `public/index.html` 负责 `/` → `/zh-cn/` 跳转（静态导出不支持服务端 redirect）。

## 路由

严格按设计稿 S0 的信息架构，一个首页 + 四个路由页 + 三语前缀：

```
/zh-cn/            首页（Hero / 数据 / 能力 / 网络+SLA / 案例横滚 / 流程 / 联系）
/zh-cn/capability  核心业务（五项能力明细）
/zh-cn/network     服务网络（覆盖地图 + SLA + 服务点清单）
/zh-cn/cases       客户案例（指标条 + 六宫格）
/zh-cn/about       关于我们（公司 / 资质 / 联系）
/zh-tw/...  /en/...  同构
```

共 15 个静态页（5 路由 × 3 语言）+ 404。

## 多语言

- 语言列表：`src/lib/i18n.ts`（`locales = ['zh-cn','zh-tw','en']`）。
- 文案：`src/content/zh-cn.ts` 为类型基准（`types.ts` 定义 `Dict`），`zh-tw.ts` / `en.ts` 实现同一结构，缺字段会直接 TS 报错。
- 新增语言：在 `locales` 增加代码 → 复制一份字典 → 补 `localeLabel`。路由、`hreflang`、语言切换器会自动跟随。
- 每页 `generateMetadata` 输出 `canonical` 与 `hreflang`；`public/sitemap.xml` 为手写版，域名确定后替换相对路径。
- 英文标题单独调过字号（`html[lang='en'] .u-hero-title`），避免长单词换行到三行。

## 主题

- 令牌在 `src/app/globals.css`：`:root` 为浅色，`.dark` 覆盖同名变量。
- 切换按钮在**导航栏右上角 dock**（品牌绿 `#A9CB39` 是整站唯一彩色，其余全黑白）。
- 默认浅色；用户手动切换后写入 `localStorage['cf-theme']`，`<body>` 前的内联脚本先上色再渲染，避免闪白。
- 调试：`?theme=dark` / `?theme=light` 可直接进入指定主题。

## 动效约定

统一由 `src/components/ScrollEffects.tsx` 驱动，页面通过 `data-*` 声明：

| 标记 | 效果 |
| --- | --- |
| `data-hero-line` | 首屏标题逐行遮罩上移 |
| `data-hero-fade` | 首屏元素淡入上浮 |
| `data-reveal` | 进入视口淡入（值可为延迟秒数） |
| `data-count` | 数字滚动（自动解析前后缀与小数位） |
| `data-line` | 进度线随滚动绘制（scrub） |

案例区横滚是独立组件（`CasesRail.tsx`）：≥1024px 用 ScrollTrigger `pin + scrub` 横向位移，小屏降级为原生横向滑动 + 吸附。
`prefers-reduced-motion` 下全部动画关闭、内容直接可见。

## 地图（合规）

- 只用**腾讯地图 GL JS**（合规白名单：腾讯 / 高德 / 百度 / 天地图）。国界线由官方数据渲染，**不手绘版图**。
- 配置 `NEXT_PUBLIC_TMAP_KEY` 后自动切换到真实地图，并绘制 800km 覆盖圈（`MultiCircle`）与已建/在建点位（`MultiMarker`），支持缩放拖拽与悬停联动。
- 未配置 key 时渲染「坐标网格 + 覆盖圈」示意图，悬停/点击交互完全一致，不影响演示与首屏性能。
- Key 申请：腾讯位置服务控制台；前端明文 key 请配 Referer 白名单，商用建议走后端代理。

## 目录

```
src/
  app/
    [locale]/
      layout.tsx        根布局（html lang / 导航 / 页脚 / 动效挂载）
      page.tsx          首页
      capability|network|cases|about/page.tsx
    globals.css         设计令牌 + 基础样式
  components/
    Nav / Footer / Sections(SectionHead·PageHeader·CtaBand)
    WorkOrder / CasesRail / MapPanel / SlaTable
    ScrollEffects / ThemeToggle / LocaleSwitch / Brandmark
  content/              zh-cn / zh-tw / en + types
  lib/i18n.ts
public/                 index.html(根跳转) / icon.svg / robots.txt / sitemap.xml
design/                 Figma 稿（HTML 画板）
```

## 待办

- [ ] **Logo**：目前导航用占位几何标记（`Brandmark.tsx`），需替换为官方单色 SVG（黑白两版）。
- [ ] **备案号**：`dict.footer.icp` 中的 `沪ICP备XXXXXXXX号` 占位。
- [ ] **联系表单**：纯前端无后端，CTA 目前走 `tel:`；如需收集线索，接第三方表单或 Serverless 函数。
- [ ] **案例授权**：客户名称现为脱敏写法（深圳 / 河南 / 上海），公开前需确认可披露范围。
- [ ] 站点域名确定后，替换 `canonical` / `sitemap.xml` 中的相对路径为绝对地址。
