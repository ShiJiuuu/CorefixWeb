---
slug: "gpu-series-02"
title: "GPU维修系列讲座｜第2讲：GPU的记忆系统：DRAM、DDR、GDDR、HBM与ECC"
date: "2026-06-16"
category: "tech"
source: "https://mp.weixin.qq.com/s/3oIgIZoc1dlIMvjZo9Wbiw"
---
编者按

从这一讲开始，我们进入显存和ECC主题。在讲解具体故障之前，需要先理清一组容易混淆的概念。DRAM、DDR、GDDR、HBM、ECC，这些词频繁出现在GPU服务器的故障日志和维修报告里，但很多工程师并不清楚它们之间的关系。搞清楚这些概念，是正确诊断显存和内存故障的前提。这一讲是后续ECC和显存专题的知识底座。

扫码加入GPU维修维保交流群

![图1](/news/gpu-series-02/img-01.png)

### 一个真实的误判

一台H200服务器出现ECC报错，运维团队认为ECC来自GPU显存方向，在GPU方向排查了两天没有结果。设备送到我们这里，维修工程师第一步是查询BMC（Baseboard Management Controller，基板管理控制器）的系统事件日志，输入如下命令：

```bash
ipmitool sel list | grep -i "memory\|ecc"
```

返回结果中出现：

```text
Memory ECC Alert: Uncorrectable ECC error detected
Location: P1-DIMMC1
```

P1-DIMMC1指向的是服务器主板上的一条DDR内存条，和GPU显存没有关系，更换这条DDR内存条，ECC报错消失。

同样叫“ECC错误”，出现在GPU显存上和出现在服务器内存条上，诊断工具不同，处理方式不同，严重程度也不同。遇到ECC报错，第一步是判断它来自哪里。

### 一、底层技术：DRAM

#### 什么是DRAM

本文讨论的三种存储，服务器主板上的DDR内存、GPU上的GDDR显存、以及数据中心GPU里的HBM显存，底层存储单元都属于**DRAM**（Dynamic Random Access Memory，动态随机存取存储器）体系。

一个DRAM存储单元的结构极其简单，它由一个微型电容加一个晶体管组成。电容充电代表1，电容放电代表0。动态（Dynamic）的含义是：即使没有任何故障，电容也会慢慢漏电，电荷会自然消散。所以，DRAM需要按规范周期刷新（重新充电），典型刷新窗口为**数十毫秒**，高温时可能缩短。

#### 什么是bit翻转

理解了DRAM的存储原理，就能理解什么是**bit翻转**（bit flip）：一个本来应该是1的bit变成了0，或者一个本来应该是0的bit变成了1。bit翻转发生的常见原因包括：

**硬件老化。**随着器件老化或缺陷发展，部分存储单元的保持时间可能缩短，在刷新前发生数据丢失。这是持续性ECC错误增长的常见硬件根因之一。

**高能粒子。**高能粒子在半导体内部沉积电荷，可能扰动存储单元状态。这类bit翻转通常具有随机性，GPU reset后同一位置未必再次报错；如果相同位置持续复现，则更应怀疑硬件退化。高能粒子主要来自大气中子和芯片封装材料产生的α粒子等，是ECC软错误的已知物理机制之一，但生产环境中的单次错误通常难以仅凭日志归因于具体粒子来源。

**温度过高。**高温会加速电容漏电，在正常温度下能稳定保持的电荷，在高温下可能提前丢失，这称为散热退化，是导致ECC错误增长的物理原因之一。我们修复过一批GPU显卡，这批显卡的ECC报错持续上升，拆开检查后，发现散热器贴合不良，重新涂抹硅脂并以正确力矩拧紧散热器后，温度回落，ECC不再新增。

**供电波动。**电压不稳定，会导致电容充放电异常，某些存储单元的状态可能被意外改变。

**存储单元bit翻转是DRAM ECC错误的重要来源之一。此外，ECC事件也可能由数据通路、控制器、封装互连、供电瞬态和信号完整性异常触发。**

### 二、三种产品形态：DDR、GDDR、HBM

DRAM是底层的存储单元技术，DDR、GDDR、HBM是用DRAM这一相同的底层技术构建的三种不同产品形态。

#### DDR：服务器系统内存

**DDR（Double Data Rate，双倍数据速率）**，就是服务器主板上的内存条。长条形PCB板，插在主板的DIMM（Dual In-line Memory Module，双列直插内存模组）插槽里。多颗DRAM器件，按rank和通道组织焊在PCB上，共同提供数据位宽和ECC校验位。DDR内存供CPU使用，服务器运行操作系统、加载数据、执行程序都需要它。当前主流是DDR5。

故障定位和维修方式：通过ipmitool和EDAC/MCE日志定位到具体DIMM插槽，拔出更换即可。DDR内存故障的详细诊断方法，包括如何区分内存条本身故障和CPU内存控制器故障，我们将在服务器主机专题中具体展开。

#### GDDR：GPU平铺显存

**GDDR（Graphics DDR，图形专用双倍数据速率）**，从DDR技术演化而来，针对GPU的高带宽需求做了专门优化。一颗颗独立的DRAM芯片颗粒通过BGA焊接平铺在显卡的PCB板上。RTX 4090、RTX 5090、A6000、A40、L40，使用的都是GDDR。当前主流是的型号为GDDR6、GDDR6X、GDDR7。

故障定位和维修方式：可以通过显存测试工具和地址映射分析定位故障区域，然后用BGA返修台把故障颗粒拆下来焊上新的，这比更换整张卡成本低得多。具体工具和方法在我们将消费级GPU维修专题中展开。

#### HBM：GPU堆叠显存

**HBM（High Bandwidth Memory，高带宽内存）**，同样以DRAM存储单元为基础，但采用了不同于DDR DIMM和GDDR板级平铺的宽接口、堆叠与先进封装路线。多层DRAM芯片垂直堆叠在一起，例如H100和H200的HBM3/HBM3e是8层堆叠。层与层之间用大量微米级硅通孔（TSV，Through-Silicon Via）连接，整个堆叠体通过一块硅中介层（interposer）和GPU核心封装在同一个基板上。

HBM具有三个关键优势，是数据中心GPU选择它的核心原因：

**带宽远高于GDDR。**HBM3e的带宽可达4.8TB/s（H200），而GDDR6X的RTX 4090大约1TB/s，差了近5倍。对于大模型训练推理及其他对内存带宽敏感的工作负载，显存带宽是影响GPU核心利用率的重要瓶颈之一。

**与GPU核心物理距离极近。**HBM和GPU核心封装在同一块硅中介层上，两者之间的信号传输距离只有毫米级。相比之下，GDDR需要通过厘米级的PCB走线连接GPU，因此，HBM的信号延迟和传输损耗远更低。物理距离，以及TSV的高密度连接，是实现了TB/s级带宽的关键。

**每bit传输能耗更低。**HBM通过超宽接口、较低的单引脚传输速率和短距离互连，在提供高聚合带宽的同时，可以显著降低单位数据传输能耗。

故障定位和维修方式：HBM堆叠内部的DRAM die、TSV或微凸点故障，通常无法单独拆开更换某一层。在高价值维修场景中，若GPU+HBM封装组件本身完好而PCB损坏，也可能评估封装组件整体移植，但风险和成本很高，具体内容我们将在GPU核心与封装专题中介绍。

#### 主要GPU的显存配置

![图2](/news/gpu-series-02/img-02.png)

（表中为各型号SXM版本的官方标称值。）

#### DDR、GDDR、HBM对比

![图3](/news/gpu-series-02/img-03.png)

（表中带宽数据为具体产品或接口配置的聚合带宽，不代表所有DDR、GDDR和HBM产品。）

### 三、GPU显存故障相关的可观察信号与诊断方向

运维工程师在日常工作中看到的是故障信号，因此，以下我们按故障信号类型，列出显存方向的常见表现。每个信号按四项展开：信号表现、可能来源、排查入口、信号边界。

#### 信号一：ECC CE/UE

**信号表现：**nvidia-smi报告DRAM Correctable或Uncorrectable错误计数增长。

**可能来源：**存储单元退化、显存供电异常、数据通路或封装互连异常。CE可能是瞬态软错误，也可能是重复性硬错误。

#### 排查入口：

```bash
# 查ECC详细信息，区分DRAM和SRAM分类
nvidia-smi -q -d ECC

# Ampere架构及以后代际的架构中，需同时检查行重映射状态
nvidia-smi -q -d ROW_REMAPPER
```

查看时注意：字段支持情况随GPU架构和驱动变化；显示N/A表示不支持或不可获取，不是零错误；volatile计数可能因驱动重载清零，应记录采样时间和驱动加载时间来建立增量基线；应优先区分DRAM与SRAM错误，两者的含义和处置方向不同。

**信号边界：**ECC报告的是数据完整性异常，不直接等于某颗DRAM已经物理老化。UE表示错误无法由当前ECC机制纠正，也不等于一定已经发生永久性DRAM损坏。CE/UE的完整决策框架（什么时候观察、什么时候行动、什么时候换卡），我们将在ECC专题中展开。

#### 信号二：性能测试结果明显偏低

**信号表现：**GPU能正常识别和使用，但性能测试的吞吐量明显低于同型号同配置的健康卡。

性能异常可能涉及三个不同层面：PCIe主机与GPU之间的传输异常、GPU之间的互联传输异常、GPU本地显存访问吞吐异常。三者的根因方向完全不同。

**可能来源：**PCIe链路降速或降宽、NUMA跨节点影响、GPU/显存降频（温度或功耗限制）、显存通道或数据路径异常、驱动/CUDA版本差异、测试条件不一致。

#### 排查入口：

```bash
# PCIe链路状态（先列出每张NVIDIA设备的PCI地址，再按地址逐张检查）
# LnkCap为设备能力上限，LnkSta为当前协商状态，重点比较Speed和Width
# 空闲时可能因节能降速，建议在负载期间复查
lspci -Dnn -d 10de:
# 按PCI地址检查具体设备，例如：
lspci -s 0000:65:00.0 -vvv | grep -E "LnkCap|LnkSta"

# GPU时钟、温度、功耗和Throttle状态
nvidia-smi --query-gpu=index,clocks.current.graphics,clocks.current.memory,temperature.gpu,power.draw,clocks_throttle_reasons.active --format=csv
```

判断性能异常时，必须与同型号、同驱动、同功耗模式、同温度条件下的健康卡对比，不能直接和产品标称理论峰值比较。三个层面（PCIe传输、GPU间互联、GPU本地显存访问）需要使用不同测试工具和测试方向，本节不提供统一带宽命令，测试结果必须注明测试路径、数据方向、数据规模和环境条件。

**信号边界：**性能低于预期时，应优先排除PCIe、时钟、温度、功耗和软件因素，再考虑显存通道或数据路径的硬件异常。

#### 信号三：消费级GPU的花屏、渲染错误

**信号表现：**屏幕出现横条纹、色块、纹理错误或随机像素异常。消费级GPU（RTX 4090/5090）通常缺少可供运维读取的系统级显存ECC遥测，显存数据错误可能直接表现为帧缓冲区数据被污染。

**可能来源：**显存bit翻转（无ECC保护下直接污染帧缓冲区）、GPU核心故障、显示链路异常、驱动问题、供电不稳。

**排查入口：**一个关键分流方法：对比屏幕截图文件和物理屏幕显示。如果截图文件中也存在异常，更偏向GPU/显存/驱动方向；如果截图正常但物理屏幕异常，更偏向显示接口、线缆或显示器方向。该方法用于缩小范围，不能单独确定故障层级。排除驱动和软件后，压测复现，考虑硬件方向。

**信号边界：**花屏的来源很多，不能看到画面异常就认定显存颗粒损坏。消费级GPU的显存诊断工具和方法在消费级GPU维修专题中展开。

#### 信号四：显存容量识别异常

**信号表现：**nvidia-smi显示的显存总量与同型号健康卡不一致。

**可能来源：**ECC状态差异、驱动保留内存差异、查询对象不同（物理GPU、MIG实例或vGPU的口径不同）、固件状态异常、显存控制器或相关互连的硬件初始化异常。

#### 排查入口：

```bash
# 查看各GPU显存总量，与同型号健康卡对比
nvidia-smi --query-gpu=index,name,memory.total --format=csv

# 检查ECC状态（完整输出保留GPU对应关系，多卡环境下不要只grep单行）
nvidia-smi -q -d ECC
```

必须先排除ECC开关状态、查询对象（物理GPU vs MIG实例）和驱动版本等配置差异，再进入硬件方向排查。

**信号边界：**容量差异可能来自配置或查询口径不同，不能看到数字不一样就怀疑颗粒或控制器损坏。

#### 信号五：间歇性崩溃（冷机正常、热机出错、重启暂时恢复）

**信号表现：**GPU冷启动后功能正常，运行一段时间后出现Xid报错、任务崩溃或掉卡，重启后暂时恢复，再次运行又出问题。

**可能来源：**封装或焊点的温度相关接触异常、供电在高负载下波动、散热不足、VRM温漂、PCIe链路不稳定。根据受影响的信号网络不同，可能同时伴随ECC、链路错误或容量异常。

#### 排查入口：

```bash
# 温度、功耗、时钟和Throttle连续采样（部分字段在某些GPU上可能返回N/A）
nvidia-smi --query-gpu=timestamp,index,temperature.gpu,power.draw,clocks.current.graphics,clocks_throttle_reasons.active --format=csv -l 5

# Xid日志（NVIDIA官方建议搜索 NVRM: Xid）
journalctl -k | grep -F 'NVRM: Xid'
```

记录故障与温度/负载/运行时长的关联性，在故障复现前后的采样数据中对齐故障时间，观察温度、功耗、时钟、负载切换和累计运行时间的变化趋势。不以“核心温度正常”排除温度相关硬件问题。

**信号边界：**“冷机正常、运行后出错”提示故障可能与温度、负载或累计运行时间相关，但具体是BGA、供电、散热还是其他方向，需要进一步的对照测试和物理检查。Xid是调查起点，不能单独证明硬件损坏。

**ECC是数据中心GPU上重要且直接的显存数据完整性信号，但性能异常、花屏、容量变化、间歇性崩溃同样可能指向显存方向。看不到ECC不等于显存没有问题。本节建立的是信号到排查方向的初步映射，不能凭单一信号判定故障器件。**

### 四、服务器内存故障相关的可观察信号与诊断方向

#### 信号一：内存ECC CE/UE（由BMC、固件或操作系统报告）

**信号表现：**BMC系统事件日志（SEL）、操作系统EDAC/MCE日志或厂商管理工具报告内存可纠正或不可纠正错误。

**可能来源：**内存条存储单元退化、CPU内存控制器（IMC）异常（根因在CPU但表现为内存ECC）、主板内存通道走线损坏或接触不良。

#### 排查入口：

```bash
# BMC系统事件日志
ipmitool sel list | grep -Ei "memory|ecc|dimm|caterr"

# 操作系统侧EDAC/MCE（具体工具取决于发行版和CPU平台）
journalctl -k | grep -Ei "edac|mce|memory error|corrected|uncorrected"
```

BMC SEL没有记录不等于服务器内存没有ECC事件，还应结合操作系统侧日志交叉确认。判断根因方向时，可以在维护窗口内遵循服务器厂商的DIMM配置规则，通过已知良品替换或通道对照判断故障是否跟随DIMM。

**信号边界：**换槽后错误跟随DIMM是指向内存条的强证据，但不是绝对判定。插拔本身改变了接触状态，某些锁步或镜像配置中也无法精确定位单条DIMM。IMC和主板通道的详细诊断方法，我们将在服务器主机专题中展开。

#### 信号二：整机宕机及不可恢复硬件错误记录

**信号表现：**服务器突然宕机重启。BMC日志中可能出现CATERR（Intel平台的灾难性错误信号）、Machine Check或其他平台特定的致命事件。

**可能来源：**无法被系统隔离的内存UE、CPU硬件故障、互连或PCIe不可恢复错误。CATERR不是内存专属信号，只有当日志进一步指向内存控制器、通道或DIMM时，才能进入内存根因分支。

#### 排查入口：

```bash
# 宕机后优先检查BMC SEL；BMC通常独立于主机操作系统运行
ipmitool sel list | grep -Ei "caterr|memory|machine check|fatal"

# 检查上一次启动周期的内核日志（需要系统启用持久化journal，否则可能查不到）
journalctl -k -b -1 | grep -Ei "mce|hardware error|fatal|edac"
```

**信号边界：**宕机可能来自多个方向（内存、CPU、互连、电源），需要BMC和操作系统日志交叉确认后才能判断是否属于内存方向。不同CPU平台的错误信号名称和恢复机制不同。

#### 信号三：DIMM不识别或容量异常

**信号表现：**系统启动后识别的内存总量低于预期，或某个DIMM插槽显示为空。

**可能来源：**物理接触不良（内存条金手指氧化、插槽弹片松弛）、SPD（Serial Presence Detect，串行存在检测）芯片损坏、DIMM安装顺序不符合平台规则、DIMM类型或容量混插不受支持、BIOS/固件问题、内存训练失败、CPU插座触点问题、主板通道故障。间歇性接触不良也可能产生ECC或训练失败。

#### 排查入口：

```bash
# 查看固件通过SMBIOS提供的DIMM信息
dmidecode --type 17

# 操作系统可用内存
free -h
```

需要将BIOS/固件识别容量与操作系统可用容量分开比较。如果异常发生在POST阶段（系统尚未进入操作系统），应优先查看BIOS/UEFI、BMC启动日志和厂商管理工具中的Memory Training或DIMM Disabled记录。在重新插拔或换槽前，应断电并确认待机电源释放、执行ESD防护、记录原始槽位、遵守厂商DIMM安装规则。保修期内设备优先走厂商流程。

**信号边界：**DIMM不识别的常见原因包括安装顺序、混插、接触和配置，不能直接认定内存条损坏。

**服务器内存异常既可能来自DIMM本身，也可能来自IMC、CPU插座、主板通道或平台配置。ECC、宕机和容量异常都是诊断入口，不能仅凭单一日志或一次换槽结果认定故障器件。**

我们整理了GPU服务器故障的快速诊断指引。完整的分类表可通过关注公众号，回复“**诊断指引**”获取。

![图4](/news/gpu-series-02/img-04.png)

### 五、ECC：贯穿显存和内存的纠错机制

#### ECC的本质

ECC（Error Correcting Code，错误纠正码）是一套内置在硬件里的数据自检和纠错机制。每次写入数据时，硬件自动计算并附加一组校验码。每次读取时，硬件用校验码检查数据是否完整。如果有少量错误，ECC能自动纠正；如果错误超出纠正能力，ECC报告无法纠正。

前者叫**CE**（Correctable Error，可纠正错误），后者叫**UE**（Uncorrectable Error，不可纠正错误）。

纠错能力取决于具体的编码方案、保护粒度和平台实现。以最基础的SEC-DED（单bit纠错、双bit检错）为例，在同一个校验保护单元内发生1个bit的错误可以被自动纠正（CE），发生2个bit的错误可以被检测到但无法纠正（UE）。不同校验单元内各自发生1个bit错误时，每个都可以被独立纠正，仍然是CE。实际GPU和服务器使用的ECC方案可能比SEC-DED更强，能纠正更多bit的错误。

#### CE和UE的含义

**CE是预警信号。**ECC在数据被使用前完成纠正时，出现CE，通常不会造成计算结果错误。CE的出现可能只是偶发的软错误（一次性的环境因素），但如果CE持续增长则说明硬件可能在退化。因此**CE的增长趋势比绝对数值更重要**。

**UE是紧急信号。**ECC发现了错误但超出了纠正能力，读取到的数据不可信，出现UE，UE需要立即评估。UE的实际影响取决于错误能否被系统成功隔离：如果错误被隔离（NVIDIA称为contained），系统可能只终止受影响的任务并下线故障页面，其他任务仍可继续运行；如果错误无法隔离（uncontained），则可能要求GPU reset、节点重启或导致系统宕机。

GPU显存不可纠正错误，可能伴随Xid 48或Xid 140；Xid 63表示显存重映射事件，Xid 64表示重映射失败。实际处置中，还应结合Recovery Action和错误是否被成功隔离（contained）来判断。在部分Intel服务器平台上，无法被系统隔离的服务器内存UE可能触发CATERR（Catastrophic Error，灾难性错误）导致整台服务器的所有GPU宕机。（其他CPU平台的错误名称和恢复机制可能不同。）

#### Volatile和Aggregate

nvidia-smi中的ECC计数分两种：

**Volatile**：自最近一次GPU驱动（nvidia.ko）加载以来的错误计数。注意它不一定等同于本次开机周期。在Linux未启用Persistence Mode时，GPU驱动可能在应用结束后卸载，Volatile会更频繁地归零。

**Aggregate**：由GPU持久化保存的长期累计计数。Aggregate计数在Ampere及以后架构上不支持清除，这是Nvidia官方的设计行为。

**Volatile反映当前运行周期的健康状态，Aggregate反映历史累计的退化程度。**两者结合看，Volatile持续新增说明当前仍在产生错误（不是历史遗留），Aggregate很高则说明这张卡历史上经历了大量错误。

#### ECC查询：GPU显存和服务器内存使用不同的查询工具

**GPU显存ECC**：数据中心GPU（H100/H200/A100/B200/B300等）通常支持并启用ECC，部分专业卡（A6000、L40等）也支持ECC，消费级GPU（RTX 4090/5090）默认不开启系统级ECC遥测。实际是否启用应通过nvidia-smi查看ECC Mode Current确认，不要假定默认状态。在支持ECC遥测的数据中心GPU上，ECC是重要且直接的显存数据完整性信号之一。

补充说明：部分现代GDDR器件具有颗粒内部纠错能力（On-die ECC），但它与GPU控制器提供的端到端ECC及nvidia-smi遥测不是同一层机制。On-die ECC主要用于提高DRAM die自身良率和可靠性，不保证系统能获得完整的错误遥测。

```bash
# GPU显存ECC查询
nvidia-smi -q -d ECC

# 多卡环境下加index字段，方便区分和批量处理
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv
```

**服务器内存（DDR）ECC**：服务器级平台通常支持并启用ECC，具体取决于CPU、主板、DIMM类型和BIOS配置。

```bash
ipmitool sel list | grep -i "memory\|ecc\|dimm"
```

遇到ECC报错，第一步是判断它来自GPU显存（nvidia-smi）还是服务器DDR内存（BMC SEL、EDAC/MCE及厂商管理工具）。定位错了对象，后续所有排查动作都在错误方向上。

### 六、（拓展阅读）行重映射：GPU显存的自我修复机制

#### 什么是行和bank

要理解行重映射，先需要了解DRAM的组织结构。DRAM内部的存储单元按**行（row）**和**列（column）**排列成二维阵列，类似一张巨大的电子表格。多个这样的二维阵列组成一个**bank**（存储体），一颗DRAM芯片内部通常包含多个bank。读写数据时，先选中某个bank中的某一行，再从该行中读取需要的列。

当某一行中的存储单元反复出错时，这一行就成为了故障热点。

#### 行重映射机制

从Ampere架构（A100）开始，NVIDIA引入了硬件级行重映射（Row Remapping）机制。当显存某一行反复出现错误时，GPU硬件会将故障行映射到备用行，重映射生效后，后续对该逻辑行的访问会转向备用行。该机制用于隔离故障位置，不代表已经发生的不可纠正数据错误可以被恢复。这个过程对软件透明，应用不需要做任何的改动。

每个bank有独立的备用行资源。输入以下命令查询行重映射状态：

```bash
nvidia-smi -q -d ROW_REMAPPER
```

输出中关注以下字段：

- **Correctable Error**因CE触发的重映射次数。CE重映射是一种预防性措施，把反复出错的行提前迁走。
- **Uncorrectable Error**因UE触发的重映射次数。UE重映射说明已有无法纠正的错误发生。
- **Pending**是否有等待GPU reset后才生效的重映射。显示Yes时需要安排reset窗口。
- **Remapping Failure**是否发生过重映射失败。显示Yes说明至少发生过一次重映射失败，是严重信号，需结合Bank Remap Availability判断是否因备用资源不足。
- **Bank Remap Availability**各bank的备用行资源剩余状态。按剩余可用量分为Max（充足）、High、Partial、Low、None（耗尽）五档，统计每档有多少个bank。如果出现Low或None，说明对应bank的备用资源已接近或完全耗尽。这是评估备用资源是否充足的关键字段。

根据NVIDIA官方说明，CE触发的重映射不计入Bank Remap Availability的消耗，因为必要时CE重映射可以被UE重映射替换（UE的优先级更高）。因此，即使CE重映射的次数很多，也不能直接据此判断备用资源接近耗尽。真正需要关注的是UE重映射次数、Remapping Failure标志和Bank Remap Availability的实际状态。

#### 新平台的Channel Repair

在受支持的新平台和较新驱动中，NVIDIA管理接口还可能显示Channel Repair Pending状态，用于反映通道级维修动作是否待处理。行重映射解决的是单行级别的故障隔离，Channel Repair面向的是更大范围的通道级故障。具体支持范围、触发条件和处置方式以平台文档为准。

### 七、案例：从ECC数据读懂显存健康状态

我们检测过一台A100 SXM4（案例号 J-1285），上电后各路供电电压正常，GPU驱动正常加载。通过以下命令查看ECC参数：

```text
nvidia-smi -q -d ECC
```

输出如下：

```text
root@test:~# ./e
01:00.0 3D controller: NVIDIA Corporation GA100 [A100 SXM4 80GB] (rev a1)
ECC Errors
Volatile
SRAM Correctable : 0
SRAM Uncorrectable Parity : 0
SRAM Uncorrectable SEC-DED: 0
DRAM Correctable : 0
DRAM Uncorrectable : 0
Aggregate
SRAM Correctable : 0
SRAM Uncorrectable Parity : 0
SRAM Uncorrectable SEC-DED: 0
DRAM Correctable : 134670
DRAM Uncorrectable : 4
SRAM Threshold Exceeded : No
Aggregate Uncorrectable SRAM Sources
SRAM L2 : 0
SRAM SM : 0
SRAM Microcontroller : 0
SRAM PCIE : 0
SRAM Other : 0
Retired Pages
Single Bit ECC : N/A
Double Bit ECC : N/A
Pending Page Blacklist : N/A
Remapped Rows
Correctable Error : 124
Uncorrectable Error : 1
Pending : No
Remapping Failure Occurred: No
```

我们把关键部分抽取出来：

```text
Aggregate:
DRAM Correctable: 134670
DRAM Uncorrectable: 4

Remapped Rows:
Correctable Error: 124
Uncorrectable Error: 1
```

这组数据里有三层信号，

**第一层：Aggregate DRAM Correctable 134670。**历史累计的可纠正错误有13万多个，说明这张卡的显存经历了大量错误积累。结合现场记录，当时GPU刚完成驱动加载，因此Volatile的DRAM Correctable为0。一般情况下，Volatile为0只能说明自最近一次驱动加载以来尚未记录新错误，需要让GPU运行一段时间后再次采样Volatile观察是否有新增。

**第二层：Aggregate DRAM Uncorrectable 4。**出现了4个不可纠正错误。UE意味着ECC纠错能力曾被突破，显存的某些区域错误严重到无法纠正。

**第三层：Remapped Rows 124/1。**124行因CE被重映射，1行因UE被重映射。前面讲过，CE触发的重映射不计入Bank Remap Availability的消耗，所以仅凭124条CE重映射不能直接判断备用资源接近耗尽。但1次UE重映射和4次历史UE的存在，说明显存退化已经突破了ECC的纠正能力。

**判断当前是否仍在产生新错误：**我们让GPU在正常工况下运行数小时后再次采样，Volatile DRAM Correctable从0快速上升到数百，确认显存颗粒当前仍在实时产生新的错误，硬件损伤是持续的。

综合Aggregate大量积累、UE存在、行重映射已发生（含1次UE重映射）、Volatile持续新增等多个信号，最终判断：在当前维修技术和经济合理性下，不建议修复。

CE、UE、行重映射三个概念如何具体应用于运维决策（什么时候观察、什么时候行动、什么时候换卡），在ECC专题中会详细展开。

### 八、从维修角度看运维：ECC来源判断和基础巡检

本讲是知识底座讲，完整的ECC处理决策和巡检SOP在ECC专题（第5-7讲）展开。这里只给出最基础的判断框架和命令，帮助运维工程师在遇到ECC报错时快速确定方向。

#### ECC来源快速判断

遇到“ECC报错”，第一步是判断它来自哪里：

```bash
# 第一步：查GPU显存ECC
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv

# 第二步：查服务器内存ECC
ipmitool sel list | grep -i "memory\|ecc\|dimm"
```

GPU显存有ECC异常增长，进入ECC专题的GPU ECC处理流程。

服务器内存有ECC，做跟随性验证（在维护窗口内，遵循服务器厂商的DIMM配置规则，通过已知良品替换或通道互换判断故障是否跟随DIMM，不得随意跨通道换槽）。

两个地方都查不到，可能不是ECC问题，检查其他方向（Xid、PCIe、供电等）。

注意：BMC SEL没有记录不等于服务器内存没有ECC事件，还应结合操作系统侧的EDAC、MCE或rasdaemon检查（具体工具取决于发行版和CPU平台）：

```bash
journalctl -k | grep -Ei "edac|mce|memory error|corrected|uncorrected"
```

#### 基础巡检命令

```bash
# ========== ECC相关日常巡检 ==========

# GPU显存ECC增量检查（多卡环境加index字段）
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv

# GPU显存ECC完整信息
nvidia-smi -q -d ECC

# Ampere及之后架构（A100/H100/H200/B200/B300）查行重映射状态
nvidia-smi -q -d ROW_REMAPPER

# GPU行重映射状态（CSV格式，方便脚本处理）
nvidia-smi --query-remapped-rows=gpu_name,remapped_rows.correctable,remapped_rows.uncorrectable,remapped_rows.pending,remapped_rows.failure --format=csv

# 服务器内存ECC事件
ipmitool sel list | grep -i "memory\|ecc\|dimm\|caterr"
```

#### ECC严重程度初筛建议

（内部运维策略，最终以Recovery Action及平台策略为准）

![图5](/news/gpu-series-02/img-05.png)

#### 运维与维修职责边界

![图6](/news/gpu-series-02/img-06.png)

### 本讲小结

这一讲理清了GPU服务器存储体系的完整知识框架：

**DRAM是底层技术。**DDR、GDDR、HBM的存储单元都属于DRAM体系。bit翻转是ECC错误的常见物理来源之一，但ECC事件也可能由数据通路、控制器、封装互连、供电等方向触发。

**DDR给CPU用，GDDR和HBM给GPU用。**DDR是内存条，GDDR是平铺焊接的显存颗粒，HBM是堆叠封装的显存。三者故障信号不同、维修方式不同、查询工具不同、成本不同。

**显存故障不只是ECC。**通道/数据路径异常、焊点问题、花屏、供电异常等故障不一定触发ECC。消费级GPU通常缺少可供运维读取的系统级显存ECC预警，故障往往通过花屏、Xid、驱动重置或应用崩溃间接暴露。

**ECC出现在两个不同的地方。**GPU显存（HBM/GDDR）和服务器内存（DDR），查询工具不同，处理方式不同。遇到ECC报错，第一步是判断它来自哪里。

**CE是预警，UE是紧急，行重映射是自我修复。**三者共同构成判断显存健康状态的信号体系。行重映射备用资源的评估应关注Bank Remap Availability和UE相关指标，CE重映射次数不等于资源消耗。

关注公众号，回复关键词获取配套资料

回复**“诊断指引”**，获取 GPU服务器故障的快速诊断指引

上海集培优信息科技有限公司

GPU 服务器第三方维修、维保、运维

扫码加入GPU维修维保交流群

![图7](/news/gpu-series-02/img-07.png)

扫码添加集培优工程师获取服务支持

![图8](/news/gpu-series-02/img-08.webp)
