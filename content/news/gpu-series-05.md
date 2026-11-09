---
slug: "gpu-series-05"
title: "GPU维修系列讲座｜第5讲：ECC错误（上）——从读懂日志到做对决策"
date: "2026-07-03"
category: "tech"
source: "https://mp.weixin.qq.com/s/vwAG9YjnGb_gDSpoTeAHkw"
---
编者按

第2讲我们梳理了ECC的基础概念：CE是预警，UE是紧急，ECC出现在GPU显存和服务器内存两个地方，查询方法不同。第3讲用三个HBM案例，展示了“清零观察”“复发换卡”“压测通过继续用”三条不同的处理路径。

这一讲我们要做的事是：**把常见关键的ECC场景，整理成一套完整的决策框架。**

遇到ECC报错，对照这个框架走，不需要靠经验猜，也不需要靠运气等。

扫码加入GPU维修维保交流群

![图1](/news/gpu-series-05/img-01.png)

### 遇到ECC报错，第一步做什么

不是清零。不是重启。不是查驱动。

**第一步是判断：这个ECC来自哪里。**

GPU服务器里有两种完全不同的ECC：

**GPU的ECC：**主要来自HBM/GDDR显存单元（DRAM）或GPU片上SRAM（如L1/L2 Cache）的bit翻转，用nvidia-smi查。**nvidia-smi会分开报告SRAM和DRAM的ECC计数，DRAM错误指向显存退化，SRAM错误指向GPU核心Die本身的物理损伤，两者的修复路径完全不同。**本讲的决策框架主要围绕DRAM ECC展开。

**服务器内存（DDR）的ECC：**来自主板上内存条的bit翻转，用ipmitool查。

两者都叫“ECC错误”，但查的工具不同、处理的方式不同、严重程度也不同。如果你查了nvidia-smi发现ECC为零，就以为“没有ECC问题”，方向就完全错了。实际上，可能是服务器内存的UECC触发了CATERR导致整机宕机。

我们接诊过一台H200，运维工程师查了两天GPU显存的问题。最后发现是DDR内存条P1-DIMMC1的UECC触发了CATERR，和GPU显存没有任何关系。换了一条内存条，问题消失。两天的排查，输在了第一步。

#### 判断来源的方法：

```bash
# 查GPU显存ECC
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv

# 查服务器内存ECC
ipmitool sel list | grep -i "memory\|ecc\|dimm\|uecc"
```

两条命令都跑一遍，并结合时间戳、设备编号、GPU index、BMC SEL时间判断是否与本次故障相关。来源确认之后，走对应的处理流程。

注意：历史SEL记录或历史aggregate计数不能直接当作本次故障来源，要看时间是否吻合。如果GPU显存和服务器内存都有与本次故障时间关联的记录，说明两边各自都有问题，需要分开处理。

### 一、GPU显存ECC：四个场景，四条路径

我们梳理了覆盖GPU显存ECC的所有常见情况的四个场景。每个场景，我们都给出现象、判断逻辑、处理动作和对应的真实案例。

#### 场景一：CE首次出现，数量不大

**现象**：nvidia-smi报告GPU某张卡有CE（corrected error），数值不大（几十到一两百），没有UE，服务器没有宕机，训练任务在正常运行。

**判断**：可能是偶发的软错误（宇宙射线、电噪声等都可以触发少量CE），也可能是显存退化的最早期信号。此时无法确定是哪种，需要观察后续趋势。

**处理**：

第一步，记录当前ECC状态（同时记录volatile + aggregate）：

```bash
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.volatile.total,ecc.errors.uncorrected.aggregate.total --format=csv

# 同步检查行重映射状态（第2讲已详细讲解行重映射机制和RMA标准）
nvidia-smi -q -d REMAPPED_ROWS
# 关注：Remapping Failure Occurred如果为Yes，触发RMA标准，不再观察直接处理
```

第二步，在维护窗口内、确认无业务占用后，执行GPU reset或节点重启，使volatile计数重新开始观察：

```bash
nvidia-smi -r -i [GPU_INDEX]
```

说明：`nvidia-smi -r`是GPU reset命令，不是专门的“清ECC工具”。reset的动作，会使得volatile计数归零，reset后要看的是volatile是否重新增长，这是我们第三部判断的关键。需要注意的是，reset不会改变aggregate计数，aggregate是历史总累计，不应被当作可随意清除的普通计数。

**注意：在SXM多卡NVLink互联环境下（如H100/H200 SXM5），不建议在业务运行期间单独reset单颗GPU，单卡reset可能导致其他GPU的NVLink链路断开，引发连带掉卡。建议在确认整机无任务后，通过重启节点执行。**

第三步，监控24小时，每小时记录一次volatile CE增量。

**结果判断**：

- 24小时内volatile CE始终为零 → 高概率是偶发软错误，继续每日监控即可。
- 24小时内volatile CE重新出现并持续增长 → 显存退化信号，进入场景二的处理逻辑。

**对应案例**：J-0629（超微H200）。GPU ECC首次出现，reset后无复现，进入观察期。

#### 场景二：同设备ECC，reset后再次出现

**现象**：同一台设备、同一张GPU卡，ECC在reset后再次出现。可能是几天后，也可能是几周后。

**判断**：偶发软错误不会在同一张卡上反复出现。**同设备复发，高度提示显存颗粒存在实质性退化。**

如果复发时设备还在同一个机柜，环境因素（供电波动、散热条件、电磁干扰）仍不能完全排除——下一讲（第6讲）会讲完整的归因路径。但是，如果复发时设备已经迁移到了不同的机柜（不同的供电环境和散热环境），环境因素的可能性就大幅下降，根因更明确地指向设备本身。

**处理**：根据复发的严重程度分级应对：

- 同设备少量CE复发（比如30天后又出现少量CE但增长缓慢）→ 升级为高频监控，安排GPU Burn压测验证
- 同GPU的CE持续增长，或压测中复现 → 计划维护窗口，准备换卡
- 跨机柜复发 / UE复发 / 伴随Xid → 优先安排换卡，不再观察

**为什么CE复发也要考虑换卡？**CE被称为“可纠正错误”，容易让人以为“既然纠正了就没事”。但“可纠正”只说明这一次数据错误被ECC机制修正了，不代表硬件健康。

**CE持续增长意味着底层物理退化在进行中**，每次CE背后可能是DRAM存储单元退化、封装互连劣化或热/电气条件恶化。GPU通过行重映射隔离退化区域，但重映射资源是有限的；资源耗尽后，下一个bit翻转就会变成UE（不可纠正错误），导致任务中断或GPU掉卡。

所以场景二的决策不是在问“CE有没有影响业务”，而是在问“这张卡的退化趋势是否表明它正在走向UE”。**对生产训练集群来说，处理目标不是等UE出现，而是在CE反复增长、风险已经收敛到GPU本体时，提前退出关键业务，避免后续UE、掉卡或任务中断。**

**对应案例**：J-0813（超微H200——和J-0629同一台设备）。第一次ECC出现后reset无复现。23天后ECC复发，此时设备已迁移至另一个机柜（网络、位置全部变了）。跨机柜复发，环境因素基本排除。直接换GPU单卡，换卡后压测通过。

#### 这两个场景合在一起，是ECC处理中最重要的决策分水岭：

第一次reset → 观察。同设备reset后再次出现 → 不再等待，安排处理。

我们的集群数据显示，显存退化的典型复发周期约为18-23天。这意味着reset后的安全观察期应设为不少于30天——30天内volatile CE始终为零，才能将风险等级降为“正常监控”。

要注意，这个案例中，真正让处理策略升级的，不是“出现了CE”，而是下面几个条件叠加：

- **同一张GPU reset后再次出现CE。**reset只是清掉当前观察窗口，不会修复物理根因。如果同一张卡过一段时间又出现CE，说明它不是一次性的随机软错误。
- **复发发生在跨机柜之后。**供电、散热、机柜环境都变了，环境因素优先级下降。这时问题更像是设备自身的显存/封装健康风险。
- **CE是趋势信号，不是只看“可纠正”三个字。**今天CE能被纠正，不代表以后一直能被纠正。如果某个区域持续产生bit错误，CE可能逐步演变成UE、row remapping增加、任务中断或掉卡。
- **H200卡的业务价值和风险很高。**对训练集群来说，等到UE出现再换，可能已经造成任务失败、节点下线、训练中断。所以高价值生产环境里，反复CE + 跨环境复发，可能就足够触发“退出关键业务/换卡或送修评估”。

#### 场景三：GPU ECC UE出现 / Xid 79（GPU掉线）

**现象**：nvidia-smi报告UE（uncorrectable error），或者系统日志出现Xid 79：

```text
NVRM: Xid (PCI:0000:5D:00): 79, pid='<unknown>', name=<unknown>,
GPU has fallen off the bus.
```

GPU从PCIe总线上掉落，nvidia-smi看不到这张卡了。

**判断**：UE意味着ECC纠错能力被突破。Xid 79是GPU从总线掉落的结果信号，它可能由显存UE触发，也可能由PCIe链路异常、供电波动、驱动问题、固件错误、温度异常或板卡连接问题触发。两者经常同时出现，但不能简单画等号。

不管触发原因是什么，这都是严重信号——但不代表一定要换卡。

为什么？因为触发UE或Xid 79的原因不止硬件实质损伤一种。驱动Bug、瞬间电压波动、高温触发的临时性错误，都可能导致一次性的UE或掉卡。如果是这些偶发因素，GPU本身的硬件可能是健康的，换卡就浪费了。

区分的关键验证手段之一是：**压测。**同时要结合Xid类型、PCIe/AER日志、BMC电源和温度记录、DCGM诊断、Remapped Rows以及是否跨环境复发等条件综合判断。

**处理**：

第一步，记录完整的ECC状态和Xid日志。

```bash
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.aggregate.total --format=csv
dmesg | grep -i "xid\|nvrm\|nvidia" | tail -50
```

第二步，GPU reset。

第三步，GPU Burn压力测试24小时。GPU Burn主要压测算力单元和供电稳定性，对显存带宽通道的覆盖不如DCGM r3全面。建议在GPU Burn通过后，补做一次`dcgmi diag -r 3`（含全量显存带宽和位宽通道扫描），两者互补才能更完整地验证硬件健康。同时每分钟监控ECC是否重新累积：

```bash
# 压测
./gpu_burn 86400

# 另一个终端监控ECC
watch -n 60 "nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv,noheader"
```

**结果判断**：

- 24小时压测通过，ECC始终为零 → 该GPU在当前高负载条件下暂未复现硬件不稳定，可降低风险等级。但仍应进入30天观察期，不要直接判定为永久健康。
- 压测中途报错、中断、或ECC快速重新累积 → 确认硬件问题，安排换卡。

**对应案例**：

J-0493（超微H200）。压测中GPU3掉卡，日志出现Xid 79（GPU has fallen off the bus）。reset后GPU Burn 24小时通过，ECC始终为零。判断为偶发事件，继续监控。

J-0494（超微H200）。GPU无法识别，lspci显示revision id为ff，看起来比Xid 79还严重，GPU完全从总线消失了。下架清除ECC后重新上架测试，未复现。

两个案例信号不同（一个是掉卡，一个是完全不识别），但决策逻辑相同：清ECC + 压测 → 看是否复现。信号的严重程度和是否需要换卡之间，隔着一个压测验证。

**关键提醒**：轻负载下不复现，不能作为“没问题”的依据。有些显存损伤只在满负荷下才暴露，GPU Burn 24小时满载，才是有效的验证手段。如果只是重启后“看看正不正常”就关单，那是在赌运气。

#### 场景四：服务器内存UECC触发CATERR

**现象**：服务器突然自动关机或宕机。重启后查看BMC日志，发现CATERR（Catastrophic Error）：

```text
[CPLD-0020] CATERR - Assertion
```

CATERR， Catastrophic Error——灾难性错误。很多工程师看到这个词的第一反应是：CPU坏了。

这个判断在相当一部分情况下是有偏差的。

**判断**：CATERR是CPU发出的信号，意思是“CPU检测到了一个系统级的严重错误”。但发出信号的是CPU，触发错误的不一定是CPU本身。**常见的触发源之一是内存UECC，也就是内存出现了不可纠正错误，CPU读到了不可信的数据，触发保护性关机。**

排查顺序：**先查内存，再查CPU。**

**处理**：

```bash
# 第一步：查内存ECC记录
ipmitool sel list | grep -i "memory\|ecc\|dimm\|uecc"
```

如果找到了内存UECC记录（比如“P1-DIMMC1 Uncorrectable ECC”），大概率CATERR的根因就在这里。

```bash
# 第二步：查dmesg中的EDAC日志
dmesg | grep -i edac
```

EDAC（Error Detection And Correction）是Linux内核的内存错误检测子系统。如果内存出现硬件错误，EDAC日志会记录具体的内存控制器通道和位置。例如：

```text
DMESG_ERRS=[Wed Jan 21 15:30:52 2026] EDAC MC4: Giving out device to module i10nm_edac controller Intel_10nm Socket#1 IMC#0: DEV 0000:fe:0c.0 (INTERRUPT)
[Wed Jan 21 15:30:52 2026] EDAC MC5: Giving out device to module i10nm_edac controller Intel_10nm Socket#1 IMC#1: DEV 0000:fe:0d.0 (INTERRUPT)
[Wed Jan 21 15:30:52 2026] EDAC MC6: Giving out device to module i10nm_edac controller Intel_10nm Socket#1 IMC#2: DEV 0000:fe:0e.0 (INTERRUPT)
[Wed Jan 21 15:30:52 2026] EDAC MC7: Giving out device to module i10nm_edac controller Intel_10nm Socket#1 IMC#3: DEV 0000:fe:0f.0 (INTERRUPT)
[Wed Jan 21 15:30:52 2026] EDAC i10nm: v0.0.5 WARNING: Found Hardware Errors in dmesg:
```

这段EDAC日志告诉我们：Socket#1上的四个内存控制器（IMC#0-3）都被EDAC检测到了，并且发现了硬件错误（Found Hardware Errors）。Intel_10nm说明这是Intel 10nm工艺的CPU平台。这些信息可以帮助定位故障在哪颗CPU的哪个内存通道上。

```bash
# 第三步：更换对应位置的内存条

# 第四步：换完后必须验证——这一步不能省
# Memtest验证新内存条本身
memtest86

# Linpack验证CPU+内存子系统在高负载下的稳定性
./xhpl
```

#### 为什么换完内存条还要做Linpack？

内存UECC的风险不止于“一条内存条坏了”。UECC发生时，CPU的内存控制器（IMC）必须处理异常的错误信号。如果UECC持续出现，IMC可能已经承受了累积性的工作压力。换了内存条，内存本身的错误消失了，但IMC是否已经受影响，轻负载下看不出来，只有Linpack这种高强度计算压力测试，才能在高负载下验证CPU和内存子系统是否真正恢复了正常的协同工作能力。

Linpack通过后的输出示例如下：

```text
Current date/time: Thu Mar 5 20:53:38 2026

CPU frequency: 3.962 GHz
Number of CPUs: 2
Number of cores: 96
Number of threads: 192

Parameters are set to:
Number of tests: 1
Number of equations to solve (problem size) : 45000
Leading dimension of array : 45000
Number of trials to run : 1
Data alignment value (in Kbytes) : 1

Maximum memory requested that can be used=16200901024, at the size=45000

================ Timing linear equation system solver ================

Size LDA Align. Time(s) GFlops Residual Residual(norm) Check
45000 45000 1 21.286 2854.1400 1.303594e-09 2.293537e-02 pass

Performance Summary (GFlops)

Size LDA Align. Average Maximal
45000 45000 1 2854.1400 2854.1400

Residual checks PASSED
```

关键看两个指标：Residual checks是否PASSED（数据一致性校验通过），以及GFlops是否在同型号CPU的正常范围内。如果Residual checks FAILED或GFlops明显偏低，说明CPU+内存子系统在高负载下工作异常，需要进一步排查CPU。

**对应案例**：J-0117 / J-0261 / J-0496（超微H200，同一台设备），构成了一条47天的故障链：

J-0117：第一次，2026/1/21，内存UECC（P1-DIMMC1），EDAC报Hardware Errors，处理方式为更换内存条。

J-0261：第二次，2026/2/8，在第一次故障18天后，CATERR（CPLD-0020），服务器关机，处理方式为再次更换内存条。

J-0496：第三次，2026/3/9，在第二次故障29天后， 服务器自动关机，系统和IPMI均不通，更换CPU系统恢复。

47天内三次故障，最终指向CPU内存控制器。如果在J-0117或J-0261阶段就做了Linpack验证，有可能在更早阶段发现CPU在高负载下的异常。这条故障链的完整分析见第7讲。

![图2](/news/gpu-series-05/img-02.png)

**补充**：若更换DIMM后，同一槽位或同一通道继续报错，应升级排查CPU内存控制器、主板通道和供电——根因可能不在内存条上。

在8卡NVLink全互联的HGX服务器（如H100/H200 SXM5平台）中，CATERR的触发源不只有内存UECC。GPU基板的供电瞬态异常、NVSwitch链路致命错误、PCIe Switch的高级错误报告（AER），都可能通过PCIe总线向CPU发送致命中断，触发CATERR。如果ipmitool中没有找到内存UECC记录，应检查`dmesg | grep -i aer`和BMC中的PCIe相关报错日志。

### 二、ECC处理决策树——一张图收束全部逻辑

我们把上面四个场景串成一个决策树，把所有决策逻辑收束为可对照执行的步骤。

我们将ECC处理决策树整理为可打印的A4图片，可关注公众号，回复“**决策树**”获取。建议打印出来贴在工位上，遇到ECC报错，对照执行，30秒内知道该做什么。

![图3](/news/gpu-series-05/img-03.png)

```text
发现ECC相关告警
│
├─► 第一步：定位来源
│ ├─ nvidia-smi有ECC → GPU显存的问题 → 走GPU流程
│ ├─ ipmitool有Memory ECC → 服务器内存的问题 → 走内存流程
│ └─ 两边都有 → 分开处理，不要混在一起
│
├─► GPU显存ECC流程
│ │
│ ├─ CE，首次，数量不大
│ │ └─ 记录 → Reset → 监控24小时
│ │ ├─ volatile不再增长 → 每日监控，30天观察期
│ │ └─ volatile持续增长 → 升级处理
│ │
│ ├─ CE/UE，同设备reset后再次出现
│ │ ├─ 少量CE复发，增长缓慢 → 升级为高频监控+压测验证
│ │ ├─ CE持续增长 / 压测复现 → 计划维护窗口，准备换卡
│ │ └─ 跨机柜复发 / UE复发 / 伴随Xid → 优先换卡
│ │
│ └─ UE / Xid 79（GPU掉线）
│ └─ 记录日志 → Reset → GPU Burn 24小时
│ ├─ 压测通过，ECC为零 → 降低风险等级，进入观察期
│ └─ 压测失败或ECC累积 → 确认硬件问题，换卡
│
└─► 服务器内存ECC流程
│
├─ Memory UECC
│ └─ 立即更换对应DIMM → Memtest + Linpack验证
│
└─ CATERR（服务器宕机）
└─ 先查ipmitool内存ECC记录
├─ 有UECC → 换内存条 → Memtest + Linpack验证
└─ 无UECC → 排查CPU/主板/供电
```

### 三、从维修视角看运维——ECC监控与风险分级实操

GPU服务器的ECC管理，需要维修认知前置化后的硬件风险管理思维。以下监控方法和分级标准来自我们在维修过程中的经验积累。

#### 每天跑一次：GPU显存ECC查询

```bash
nvidia-smi --query-gpu=index,name,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.aggregate.total --format=csv
```

建议配置为定时任务，每天固定时间自动执行并记录输出。关键看两个维度：

- volatile：自上次reset以来的累积。**看的是每天的增量，不是总数。**从0变成10，比从10000变成10010更值得关注——前者说明退化刚开始，后者说明退化已经很久了。
- aggregate：历史总累计，不会因reset归零。一张卡如果aggregate数值很大但volatile为零，说明被多次reset，需要额外警惕，不要被“当前为零”的表象迷惑。aggregate提供历史健康参考，但仍需结合设备重置历史和维修记录综合理解。

#### 每天跑一次：服务器内存ECC查询

```bash
ipmitool sel list | grep -i "memory\|ecc\|dimm"
ipmitool sdr type "Memory"
```

GPU任务崩溃不一定是GPU的问题，内存UECC触发CATERR导致整机宕机的案例，我们见过不止一次。这条命令和上面的nvidia-smi命令同等重要，每天都要跑。

#### 每周做一次：DCGM健康检查

```bash
dcgmi health -g 0 -c # 快速健康扫描
dcgmi diag -r 2 # 中等级别诊断（十几分钟）
```

#### 每月做一次：DCGM全项诊断

```bash
dcgmi diag -r 3 # 全项诊断（可能需要几十分钟，在空闲时段运行）
```

r3级别会覆盖显存带宽测试等深度检查，能发现日常监控发现不了的位宽通道退化。

#### 告警阈值（初始建议值）

以下为初始运维阈值。实际项目应根据GPU型号、业务负载强度、历史基线和客户SLA要求进行调整。

![图4](/news/gpu-series-05/img-04.png)

#### 风险分级与业务影响对照表

这张表把ECC信号和业务决策直接对应，告诉工程师“出现这个信号，对业务意味着什么，下一步做什么”。

**这套分级的价值在哪里？**它把“该观察”和“该换卡”的线画清楚了。一张几万元的HBM卡，可能只是宇宙射线触发的偶发CE（L1），不需要换卡。但一张CE持续增长、压测复现、跨机柜还复发的卡（L3），再reset等待就是在浪费时间，每多等三周就多承受三周的业务风险。

![图5](/news/gpu-series-05/img-05.png)

#### 我们的实践：自动化ECC健康监控体系

在我们的日常运维服务中，上述ECC监控和分级处理机制已经以自动化工具的形式落地运行：每天定时采集全集群GPU和服务器内存的ECC数据，自动计算每日增量和趋势变化，超过阈值自动推送告警到运维工程师，从信号采集到风险分级到处理触发，全流程自动化，不依赖人工巡检的及时性和记忆力。

这套体系是从大量维修案例中提炼出来的，每一条阈值、每一个分级标准，背后都有真实的故障案例支撑。如果您的集群需要部署类似的ECC健康监控体系，欢迎与我们沟通。

#### 运维与维修职责边界

![图6](/news/gpu-series-05/img-06.png)

### 本讲小结

遇到ECC报错，按三步走：

**第一步：定位来源。**nvidia-smi（GPU显存）还是ipmitool（服务器内存）。方向对了才能往下走。

**第二步：判断场景。**GPU显存的CE首次/复发/UE三种情况，服务器内存的UECC/CATERR两种情况，处理方式各不相同。

**第三步：做对动作。**该观察就记录趋势耐心等30天，该压测就GPU Burn跑满24小时，达到L3维护触发条件时不应继续简单reset观察，换完了必须验证（GPU→GPU Burn，内存→Memtest+Linpack）。

决策树打印出来贴在工位上。下次遇到ECC报错，对照走，30秒内知道该做什么。

下一讲预告：**第6讲·ECC错误（中）——归因路径：同样是ECC报错，根因可能完全不同。**本讲讲的是“看到ECC该做什么”，下一讲讲“为什么会出现ECC”——六条根因路径，从显存颗粒损伤到散热退化到供电波动，每条路径的判断依据和处理方式完全不同。

关注公众号，回复关键词获取配套资料

回复**“决策树”**，获取 ECC处理决策树

上海集培优信息科技有限公司

GPU 服务器第三方维修、维保、运维

扫码加入**GPU维修维保交流群**

![图7](/news/gpu-series-05/img-07.png)

扫码添加集培优工程师获取服务支持

![图8](/news/gpu-series-05/img-08.webp)
