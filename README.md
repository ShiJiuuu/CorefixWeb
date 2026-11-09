# CoreFix Pro 官网 · 上海集培优

GPU 维修维保与算力硬件服务的品牌官网。纯前端、可静态托管、三语（简 / 繁 / EN）、深浅双主题。

设计稿见 `design/index.html`（v2.1 黑白版）。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Next.js 15（App Router，`output: 'export'` 静态导出）+ React 19 |
| 样式 | Tailwind CSS v4（`@theme inline` + CSS 变量，深浅色一套令牌） |
| 动效 | GSAP 3 + ScrollTrigger（原生免费） |
| 平滑滚动 | Lenis（与 ScrollTrigger 的 ticker 同步） |
| 内容 | `src/content/*` 单源字典，按语言分文件 |
| 质量 | TypeScript strict + ESLint（`eslint-config-next`） |

## 本地运行

```bash
npm install
npm run dev          # http://localhost:3000 → 自动跳 /zh-cn/
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run build        # 产出 out/（纯静态）
npx serve out        # 预览构建产物
npm run clean        # 删掉 .next / out
```

> `.next` 是构建缓存，**不要同时跑 `next dev` 和 `next build`**，也不要对正在运行的 dev 服务删 `.next`。
> 否则会报 `Cannot find module './vendor-chunks/next.js'` 之类的 chunk 错误：先停掉进程，`npm run clean`，再重启。

`out/` 可直接丢到任意 OSS / CDN / Nginx。根路径 `/` 由 `src/app/(redirect)/page.tsx` 生成：`meta refresh` + 内联脚本跳 `/zh-cn/`，并保留 `?theme=dark` 这类查询参数；无 JS 时仍显示三语入口。

## 路由

严格按设计稿 S0 的信息架构，一个首页 + 四个路由页 + 三语前缀：

```
/                   → 跳 /zh-cn/（静态导出无法服务端 redirect）
/zh-cn/            首页（Hero / 数据 / 能力 / 网络+SLA / 案例 / 流程 / 联系）
/zh-cn/capability  核心业务（五项能力明细）
/zh-cn/network     服务网络（覆盖地图 + SLA + 服务点清单）
/zh-cn/cases       客户案例（指标条 + 2×2 案例卡）
/zh-cn/cases/[slug] 案例详情（四个案例共用一套模板，slug 三语一致）
/zh-cn/about       关于我们（公司 / 资质 / 联系）
/zh-tw/...  /en/...  同构
```

共 27 个静态页（5 个列表路由 + 4 个案例详情，× 3 语言）+ 品牌化 404。

源码目录用 route group 承载两套根布局：`(site)/[locale]/` 负责三语站点，`(redirect)/` 只负责 `/`。两套根布局没有共同父级，因此 404 只能放在 `src/app/global-not-found.tsx`（Next 15 的 `experimental.globalNotFound`）。

## 多语言

- 语言列表：`src/lib/i18n.ts`（`locales = ['zh-cn','zh-tw','en']`）。
- 文案：`src/content/zh-cn.ts` 为类型基准（`types.ts` 定义 `Dict`），`zh-tw.ts` / `en.ts` 实现同一结构，缺字段会直接 TS 报错。
- 新增语言：在 `locales` 增加代码 → 复制一份字典 → 补 `localeLabel`。路由、`hreflang`、语言切换器、sitemap 会自动跟随。
- 浏览器标签标题固定为「上海集培优信息科技有限公司」（`src/lib/seo.ts` 的 `SITE_TITLE`），三语、五个路由一致；页面只在 `description` 和正文上区分。
- 每页 metadata 统一走 `src/lib/seo.ts` 的 `pageMetadata()`，输出 `canonical` + 三条 `hreflang` + Open Graph；子页不要再手写 `alternates`，否则会覆盖掉语言注解。
- `src/app/sitemap.ts` 与 `src/app/robots.ts` 按路由表生成，不再手写 XML。
- **域名**：配置 `NEXT_PUBLIC_SITE_URL`（见 `.env.example`）后，canonical / hreflang / og:url / sitemap 全部输出绝对地址；未配置时保持根相对路径。
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

案例卡片由 `CaseCards.tsx`（`CaseCard` / `CaseGrid`）统一渲染，首页、`/cases` 和详情页底部的「其他案例」共用同一套卡片，避免三处样式漂移；不再有横向轮播。
网格为 1 列（手机）→ 2 列（≥md）发丝线布局；案例数为奇数时最后一张自动通栏（`md:col-span-2`），所以加第 5 个案例不用改版式。
`prefers-reduced-motion` 下全部动画关闭、内容直接可见。

## 客户案例

案例是数据驱动的：列表、详情页、详情页底部的「其他案例」、sitemap 全部从 `dict.cases.items` 生成，模板里没有硬编码文案。

- 字段见 `src/content/types.ts` 的 `CaseStudy`：`slug`（URL 键）、`client`、`device`、`tag`、`service`、`date`、`title`、`summary`、`metrics`、`challenge`、`solution`、`outcome`、`record`，可选 `quote`。
- 列表卡只取 `metrics` 的前两项，详情页展示全部；`quote` 没有就整块不渲染。
- **新增一个案例**：在三个字典的 `cases.items` 各加一个对象，`slug` 必须完全一致。`src/content/index.ts` 会在构建期比对三语 slug 集合，缺一个或拼错直接报错；`generateStaticParams` 负责生成三种语言的静态页。
- 详情页路由 `[locale]/cases/[slug]/` 用 `dynamicParams = false`，只导出已声明的 slug，其余走 404。
- 标签页标题：详情页用「案例标题 — 公司名」（`pageMetadata` 的 `title` 参数）；五个主路由仍固定为公司名。

## 地图（合规）

- 只用**高德地图 JS API 2.0**（合规白名单：腾讯 / 高德 / 百度 / 天地图）。国界线由官方数据渲染，**不手绘版图**。
- 配置 `NEXT_PUBLIC_AMAP_KEY` 后自动切换到真实地图，并绘制 800km 覆盖圈（`AMap.Circle`）与已建/在建点位（`AMap.Marker`）。
- 地图是**静态展示**：`dragEnable / zoomEnable / scrollWheel / doubleClickZoom / rotateEnable / pitchEnable` 全部关闭，不能拖拽、缩放、旋转；滚轮和手势穿透给页面正常滚动。只有悬停/点击点位会联动右侧信息卡。
- 2021-12 之后申请的 Key 还需要配套的**安全密钥**，配到 `NEXT_PUBLIC_AMAP_SECURITY_CODE`；缺了会报 `INVALID_USER_SCODE`，此时页面停在示意图，不会白屏。
- 未配置 key 时渲染「坐标网格 + 覆盖圈」示意图，悬停/点击交互完全一致，不影响演示与首屏性能。
- 底图随深浅色切换：浅色 `amap://styles/whitesmoke`、深色 `amap://styles/dark`，由 `MutationObserver` 监听 `<html class="dark">` 自动同步。
- 坐标按 `Site.id`（`shenzhen` / `ulanqab` …）查表，**不要用 `name`**——`name` 是本地化展示文案，简繁中文站会拿不到坐标。新增服务点时三个字典的 `id` 必须一致。
- 坐标表是 `[lat, lng]`（和腾讯一致），代码里 `lngLat()` 负责转成高德要求的 `[lng, lat]`，别在表里直接写反。
- Key 申请：高德开放平台控制台，类型选「Web 端（JS API）」，配域名白名单（开发用 `localhost`）；前端明文 key 请配白名单，商用建议走后端代理。

## 首屏视频

- 首页 Hero 背景是一段无声循环视频：`public/media/hero.mp4`（960×540，25fps，H.264，约 7MB）+ 首帧 `hero-poster.jpg`。
- 原始素材在 `assets/source/410.mp4`（1920×1080，124MB），**不进 public、不进构建**；换片时重新压一版：
  `ffmpeg -i assets/source/410.mp4 -an -vf "scale=960:-2,fps=25" -c:v libx264 -preset slow -crf 32 -pix_fmt yuv420p -movflags +faststart public/media/hero.mp4`
- 播放层是 `absolute inset-0` + `object-cover`，**彩色原样播放**；文字压在一条从左到右由黑渐透明的底板上，所以首屏文案始终可读。
- 深色底上的文字统一用 `.on-dark`（`globals.css`）局部重映射：`--ink/--muted/--line` 等换成白色系，`.u-btn-solid` 自动变成白底黑字；数据条在视频块之外，仍是常规配色。
- 组件 `HeroVideo.tsx`，`prefers-reduced-motion` 下自动降级为静态首帧。
- 首页案例区用 `public/media/cases-background.webp`（2000×1120）作背景，盖 60% 黑色蒙版，标题走 `.on-dark` 变白，卡片保持白底黑字。换图直接替换同名文件即可。

## 品牌资产

- 导航与页脚统一使用官方 PNG：`public/logo-corefix.png`（231×231，透明底，菱形 G/P/U）。
- 导航内尺寸 40×40，页脚 36×36，`object-contain` 保持比例；旁边保留中文名 + 拉丁字标，便于识别。
- 已知限制：Logo 的深绿菱形在深色模式（`#0A0A0A`）下对比偏弱。若追求最佳效果，建议补一版反白 Logo，按主题切换 `src`。
- 站点图标由 Logo 生成（白底圆角 + 居中 Logo，浅色/深色标签栏都能看清）：`public/favicon.ico`（16/32/48 多尺寸）、`icon-16/32/48/192/512.png`、`apple-touch-icon.png`。
- 重新生成：改完 `public/logo-corefix.png` 后按同样比例重跑生成脚本即可，注意 `favicon.ico` 里塞的是这三个尺寸的 PNG 数据。

## 目录

```
src/
  app/
    (redirect)/          根路径跳转页（独立根布局）
    (site)/[locale]/
      layout.tsx         站点根布局（html lang / 导航 / 页脚 / 动效挂载）
      page.tsx           首页
      capability|network|cases|about/page.tsx
      cases/[slug]/page.tsx  案例详情（固定模板 + generateStaticParams）
    global-not-found.tsx 品牌化 404
    sitemap.ts robots.ts 构建期生成的 SEO 文件
    globals.css          设计令牌 + 基础样式
  components/
    Nav / Footer / Sections(SectionHead·PageHeader·CtaBand)
    WorkOrder / CaseCards / MapPanel / SlaTable / SocialLinks / SocialIcons
    ScrollEffects / ThemeToggle / LocaleSwitch
  content/              zh-cn / zh-tw / en + types
  lib/                  i18n.ts + seo.ts（canonical / hreflang / siteUrl）
public/                 logo-corefix.png / favicon.ico / icon-*.png / apple-touch-icon.png
design/                 Figma 稿（HTML 画板）
eslint.config.mjs       flat config（next/core-web-vitals + next/typescript）
```

## 已知问题

- `next dev` 下访问不存在的**单段路径**（如 `/nope/`）会返回 500，页面上仍是 404 内容。这是 Next 15「静态导出 + 动态 `[locale]` + 多套根布局」在 dev 下的行为：为了导出会把 `nope` 当成 locale 去生成静态路径而报错。构建产物不受影响，线上是正常的 404。

## 待办

- [ ] **备案号**：`dict.footer.icp` 中的 `沪ICP备XXXXXXXX号` 占位。
- [ ] **联系表单**：纯前端无后端，CTA 目前走 `tel:`；如需收集线索，接第三方表单或 Serverless 函数。
- [ ] **案例授权**：客户名称现为脱敏写法（深圳 / 河南 / 上海），公开前需确认可披露范围。
- [ ] 站点域名确定后配置 `NEXT_PUBLIC_SITE_URL`，让 canonical / sitemap 变成绝对地址。
