# /en/news/ 英文版内容检查报告（第二轮复核）

复核时间：2026-11-11 15:45
上一轮报告结论已按当前文件重新核对；本轮只列**当前仍未解决**的问题，并在开头记录已修复项。

---

## 一、已修复（上一轮 P0/P1，全部确认有效）

| 上轮问题 | 当前状态 |
| --- | --- |
| `gpu-series-02` 整篇中文 | 已全文翻译，`translated: true`，译文质量良好（见第五节） |
| 页面副标题说"只有简体中文" | `en.ts` 改为 `…from our repair centre and field engineers.`，页面与 meta 均已生效 |
| 英文页 `<title>` 为中文公司名 | 改为按 locale 取 `SITE_TITLES`，实测 `/en/news/` = `COREFIX PRO`，文章页 = `… — COREFIX PRO` |
| 文章页 `lang="zh-CN"` 写死 | 改为 `hreflang[locale]`，实测英文页 `lang="en"`、中文页 `lang="zh-CN"` |
| 日期重复显示 | 右上角那处已删除，只保留 Published |
| 分类 `tech → Lectures` | 改为 `Technical` |
| Xid 64 / 79 / 94 与系列文章冲突 | 整表重写，新增 48 / 63 / 95 / 140，64=重映射失败、79=结果非原因、94/95=contained/uncontained，与 #2/#3/#5 一致 |
| H200 标题写 coolant leak | 改为 `machine-room water leak`（标题 + 摘要 + 正文统一） |
| H200"硬盘换新"与"数据零丢失"断裂 | 已补 "Data first, then hardware" 一步：先整盘扇区级镜像，再换盘，数据写回并逐文件校验 |
| H200"8 小时到场所以一分钟没耽误" | 改为 `keeping the outage inside a single working day` |
| `grade-A hospital for servers` ×5 | 全部改为 `the teaching hospital of server repair` |
| `ship / shipping` 指维修件交付 | 全部改为 `handed back`（含摘要、正文、"No unit is handed back without…"） |
| `panel` → `dashboard` | ecc-repairable 全文统一为 dashboard，与 #1 的 `green dashboard` 一致 |
| ecc-repairable 设问句断裂 | 改为 "There is a shortcut that looks like repair…" |
| ecc-repairable "counts accumulated elsewhere" | 改为 `left over from earlier runs` |
| `A internet company` | 改为 `An internet company` |
| AI-factory / release capacity | 改为 `AI infrastructure operations platform` / `put to work` |
| `is losing you three weeks of business risk` | 改为 `carries another three weeks of business risk for every three weeks it stays in service` |
| 临港口号直译 | 改为拼音 + 释义 `set out with collective intelligence, cultivate excellence for the long run` |
| 前言 `A common "GPU dropped off the bus" can come from` | 补上中心词 `error`；重复的 "RMB 2 million" 已去掉一处 |
| 品牌 CoreFix Pro / COREFIX PRO 混用 | 统一为 `COREFIX PRO`（页脚、about、文章署名） |
| Part 6 / 7 / 11 死链 | 已统一加 `(coming soon)` |

---

## 二、仍然存在：P0

### 1. 配图依旧是中文图（本轮最严重的一项）

已经过目视确认，且 `public/news/` 下 37 个图片文件自 14:50 起**没有任何新增或修改**。英文正文仍在用 "The thresholds below…"、"This table maps each signal…" 引出中文表格：

| 文章 | 中文图 |
| --- | --- |
| `gpu-series-02`（新译文） | img-02 显存配置表、img-03 三种显存对比、img-05 严重程度初筛、img-06 职责边界 |
| `gpu-series-03` | img-03 三个判断维度、img-04 告警阈值、img-05 运维与维修边界 |
| `gpu-series-05` | img-02 47 天故障链、img-04 阈值建议、img-05 风险分级、img-06 职责边界 |
| `ecc-repairable` | img-02 根因与处置、img-03 问对问题 |
| `four-level-response` | img-02 四级响应、img-03 体系对比 |
| `ai-training-efficiency` | img-02 80→300 卡对比、img-03 五层系统、img-04 单指标监测、img-05 三能力 |
| `single-point-failure` | img-02 双故障拆解、img-03 一站式流程、img-04 成果海报 |
| `gpu-troubleshooting` | img-03 机房踩坑清单 |

其中 `gpu-series-05` 的"阈值建议"和"风险分级"两节，英文正文只剩一句引导语，信息完全依赖中文图 —— 英文读者等于读不到内容。新翻译的 #2 也带进 4 张中文图，问题范围扩大了。

---

## 三、仍然存在：P1（事实 / 逻辑）

### 2. `onsite-ops-case.md` 的"四个问题"第 4 条仍不是问题

`:17` `Four problems kept recurring:`，1 无运维能力、2 无预防管理、3 故障频繁；`:31` 第 4 条却是 `### 4 · A specialist crew, on site`，内容是"客户请我们接管运维"。
建议：`Three problems, one ask:`。

### 3. `four-level-response.md` 两处内部矛盾未改

- `:29` P0 `first response ≤10 minutes`，`:77` 却写 `locate the root cause in 5 minutes` —— 定位根因比首次响应还快。
- `:43` P2 定义 `loses more than 20% of its compute`，`:47` 典型案例是 `one GPU throttling`；8 卡机单卡约 12.5%，够不到 20%。

### 4. `lingang-center-opening.md` 摘要仍承诺正文没有的事实

`:7` 写 `2,500㎡, a Class 10,000 cleanroom and chip-level rework lines`，`:19` 正文只有 `a cleanroom that meets industry standards`（中文原文同样没有这组参数）。

### 5. 复发周期两个数字仍对不上

- `gpu-series-05.md:103`：`18–23 days`
- `gpu-series-03.md:159`：`about three to four weeks`（21–28 天）
- #5 自己列的案例间隔是 18 天和 29 天，区间应是 18–29。

### 6. `gpu-series-05.md:54` 命令仍是 `-d REMAPPED_ROWS`

同篇 `:218` 与 `gpu-series-02`（`:112/:323/:444`）都用 `ROW_REMAPPER`。`-d` 的枚举值是 `ROW_REMAPPER`，建议在有卡环境跑一次确认后统一。

### 7. Xid 140 仍有两种说法

- `gpu-series-01.md:36`：`Xid 140 for firmware handling failures`
- `gpu-series-02.md:274`：`GPU memory UEs may be accompanied by Xid 48 or Xid 140`

一边说是固件问题，一边说是显存 UE 的伴随信号，读者会困惑。

### 8. 同一案例两种叙述

`gpu-series-05.md:155` 写 J-0493 `GPU3 dropped during stress`；`gpu-series-03.md` 写的是生产环境掉卡、随后上机压测通过。压测过程中掉卡和压测通过是两个相反的结果。

### 9. Xid 16 / 31 与 NVIDIA 官方定义可能不符（把握中等，建议核对）

重写后 64 / 79 / 94 / 95 / 140 已正确，但剩两条按中文行业习惯写的：

- `Xid 16 — memory errors`：NVIDIA 文档中 16 属图形/显示引擎异常类。
- `Xid 31 — PCIe link errors`：更常见的解释是 GPU 显存页错误（MMU fault）。

这两条我没有 GPU 环境实测，只是与官方 Xid 表对不上，建议查一遍再定。

### 10. `ai-training-efficiency.md:14` 百分比加不到利用率

30% + 20% + 15% = 65% 损失 → 利用率约 35%，而 `:12` 说 `in the low 40s`，配图上写的是 40%。三个占比需要压到 60% 以内才自洽。

---

## 四、仍然存在：P2（语言细节）

11. `h200-water-damage.md:11`：`each step can cost a company irrecoverably` —— 缺宾语，`can cost a company dearly` 或 `can be an irrecoverable loss`。
12. 系列缺口：站内只有 preface、#1、#2、#3、#5，没有 #4，列表页会明显看到编号跳号。另外 `gpu-series-02.md:412` 与 `gpu-series-03.md:194` 仍写 `parts 5–7`，其中 6、7 未发布，建议也补 `(coming soon)`。
13. `/en/news/` 的 tab title 现在是 `COREFIX PRO`，没有页面名；如需更好，可用 `News — COREFIX PRO`（`pageMetadata` 默认取站名，属设计选择，不算错误）。
14. 顺手发现的**既有问题**（与本次改动无关）：中文/繁中列表页有 5 张卡片摘要为空 —— `ai-training-efficiency`、`ecc-repairable`、`four-level-response`、`single-point-failure`、`waic-2026`。原因是 `excerptOf` 用 `split(/\n{2,}/)` 切段，而这些 md 是 CRLF，切不开，整段以 `![](` 开头就被整块跳过。改成 `split(/\r?\n\s*\r?\n/)` 即可。英文侧不受影响（16 篇都写了显式 `excerpt:`）。

---

## 五、新译的 #2 质量简报

译文整体质量在本站系列里属于上乘，压缩得当、语气统一，几处值得肯定的处理：

- `:117` `A UE means the error exceeded correction, not that permanent damage has occurred.` —— 保留了原文"信号边界"的谨慎。
- `:266` SEC-DED 的解释用 `protected word` 而非直译"校验单元"，是懂技术的人写的。
- `:334` CE 重映射不消耗 spare 的因果（UE 可替换 CE、优先级更高）交代得比中文原文更清楚。

小问题：
- `:10` `From this part on we enter memory and ECC.` 开场略生硬，可改 `This part marks the move into memory and ECC.`
- `:59` `the OS, data loading and programs all live there` —— "OS 装在内存里"在英文里偏口语，可改 `the OS, working sets and applications all sit in it`。
- `:455` `(Internal operating policy; the Recovery Action and platform policy take precedence.)` 在公开页面写 "internal" 略显奇怪，建议 `(Our working guidance; the platform's Recovery Action takes precedence.)`

---

## 六、建议优先级

1. **做英文图**（唯一还挡在"能读"和"读不懂"之间的一项）
2. `onsite-ops-case` 的四条"问题"、`four-level-response` 的两处时间/阈值口径
3. `lingang` 摘要、#5 的复发周期与 `REMAPPED_ROWS`、Xid 140 统一
4. 顺手修中文侧 `excerptOf` 的 CRLF 切段 bug
5. 逐条清理 P2 语言项
