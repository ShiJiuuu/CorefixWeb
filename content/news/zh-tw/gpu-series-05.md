---
slug: "gpu-series-05"
title: "GPU維修系列講座｜第5講：ECC錯誤（上）——從讀懂日誌到做對決策"
date: "2026-07-03"
category: "tech"
source: "https://mp.weixin.qq.com/s/vwAG9YjnGb_gDSpoTeAHkw"
---

第2講我們梳理了ECC的基礎概念：CE是預警，UE是緊急，ECC出現在GPU視訊記憶體和伺服器記憶體兩個地方，查詢方法不同。第3講用三個HBM案例，展示了“清零觀察”“復發換卡”“壓測通過繼續用”三條不同的處理路徑。

這一講我們要做的事是：**把常見關鍵的ECC場景，整理成一套完整的決策框架。**

遇到ECC報錯，對照這個框架走，不需要靠經驗猜，也不需要靠運氣等。

##  遇到ECC報錯，第一步做什麼

不是清零。不是重啟。不是查驅動。

**第一步是判斷：這個ECC來自哪裡。**

GPU伺服器裡有兩種完全不同的ECC：

**GPU的ECC：**主要來自HBM/GDDR視訊記憶體單元（DRAM）或GPU片上SRAM（如L1/L2 Cache）的bit翻轉，用nvidia-smi查。**nvidia-smi會分開報告SRAM和DRAM的ECC計數，DRAM錯誤指向視訊記憶體退化，SRAM錯誤指向GPU核心Die本身的物理損傷，兩者的修復路徑完全不同。**本講的決策框架主要圍繞DRAM ECC展開。

**伺服器記憶體（DDR）的ECC：**來自主機板上記憶體模組的bit翻轉，用ipmitool查。

兩者都叫“ECC錯誤”，但查的工具不同、處理的方式不同、嚴重程度也不同。如果你查了nvidia-smi發現ECC為零，就以為“沒有ECC問題”，方向就完全錯了。實際上，可能是伺服器記憶體的UECC觸發了CATERR導致整機宕機。

我們接診過一臺H200，運維工程師查了兩天GPU視訊記憶體的問題。最後發現是DDR記憶體模組P1-DIMMC1的UECC觸發了CATERR，和GPU視訊記憶體沒有任何關係。換了一條記憶體模組，問題消失。兩天的排查，輸在了第一步。

### 判斷來源的方法：

```bash
# 查GPU視訊記憶體ECC
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv

# 查伺服器記憶體ECC
ipmitool sel list | grep -i "memory\|ecc\|dimm\|uecc"
```

兩條命令都跑一遍，並結合時間戳、裝置編號、GPU index、BMC SEL時間判斷是否與本次故障相關。來源確認之後，走對應的處理流程。

注意：歷史SEL記錄或歷史aggregate計數不能直接當作本次故障來源，要看時間是否吻合。如果GPU視訊記憶體和伺服器記憶體都有與本次故障時間關聯的記錄，說明兩邊各自都有問題，需要分開處理。

##  一、GPU視訊記憶體ECC：四個場景，四條路徑

我們梳理了覆蓋GPU視訊記憶體ECC的所有常見情況的四個場景。每個場景，我們都給出現象、判斷邏輯、處理動作和對應的真實案例。

### 場景一：CE首次出現，數量不大

**現象**：nvidia-smi報告GPU某張卡有CE（corrected error），數值不大（幾十到一兩百），沒有UE，伺服器沒有宕機，訓練任務在正常執行。

**判斷**：可能是偶發的軟錯誤（宇宙射線、電噪聲等都可以觸發少量CE），也可能是視訊記憶體退化的最早期訊號。此時無法確定是哪種，需要觀察後續趨勢。

第一步，記錄當前ECC狀態（同時記錄volatile + aggregate）：

```bash
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.volatile.total,ecc.errors.uncorrected.aggregate.total --format=csv

# 同步檢查行重對映狀態（第2講已詳細講解行重對映機制和RMA標準）
nvidia-smi -q -d REMAPPED_ROWS
# 關注：Remapping Failure Occurred如果為Yes，觸發RMA標準，不再觀察直接處理
```

第二步，在維護視窗內、確認無業務佔用後，執行GPU reset或節點重啟，使volatile計數重新開始觀察：

```bash
nvidia-smi -r -i [GPU_INDEX]
```

說明：`nvidia-smi -r`是GPU reset命令，不是專門的“清ECC工具”。reset的動作，會使得volatile計數歸零，reset後要看的是volatile是否重新增長，這是我們第三部判斷的關鍵。需要注意的是，reset不會改變aggregate計數，aggregate是歷史總累計，不應被當作可隨意清除的普通計數。

**注意：在SXM多卡NVLink互聯環境下（如H100/H200 SXM5），不建議在業務執行期間單獨reset單顆GPU，單卡reset可能導致其他GPU的NVLink鏈路斷開，引發連帶掉卡。建議在確認整機無任務後，通過重啟節點執行。**

第三步，監控24小時，每小時記錄一次volatile CE增量。

**結果判斷**：

- 24小時內volatile CE始終為零 → 高機率是偶發軟錯誤，繼續每日監控即可。
- 24小時內volatile CE重新出現並持續增長 → 視訊記憶體退化訊號，進入場景二的處理邏輯。

**對應案例**：J-0629（超微H200）。GPU ECC首次出現，reset後無復現，進入觀察期。

### 場景二：同裝置ECC，reset後再次出現

**現象**：同一臺裝置、同一張GPU卡，ECC在reset後再次出現。可能是幾天後，也可能是幾週後。

**判斷**：偶發軟錯誤不會在同一張卡上反覆出現。**同裝置復發，高度提示視訊記憶體顆粒存在實質性退化。**

如果復發時裝置還在同一個機櫃，環境因素（供電波動、散熱條件、電磁干擾）仍不能完全排除——下一講（第6講）會講完整的歸因路徑。但是，如果復發時裝置已經遷移到了不同的機櫃（不同的供電環境和散熱環境），環境因素的可能性就大幅下降，根因更明確地指向裝置本身。

**處理**：根據復發的嚴重程度分級應對：

- 同裝置少量CE復發（比如30天后又出現少量CE但增長緩慢）→ 升級為高頻監控，安排GPU Burn壓測驗證
- 同GPU的CE持續增長，或壓測中復現 → 計劃維護視窗，準備換卡
- 跨機櫃復發 / UE復發 / 伴隨Xid → 優先安排換卡，不再觀察

**為什麼CE復發也要考慮換卡？**CE被稱為“可糾正錯誤”，容易讓人以為“既然糾正了就沒事”。但“可糾正”只說明這一次資料錯誤被ECC機制修正了，不代表硬體健康。

**CE持續增長意味著底層物理退化在進行中**，每次CE背後可能是DRAM儲存單元退化、封裝互連劣化或熱/電氣條件惡化。GPU通過行重對映隔離退化區域，但重對映資源是有限的；資源耗盡後，下一個bit翻轉就會變成UE（不可糾正錯誤），導致任務中斷或GPU掉卡。

所以場景二的決策不是在問“CE有沒有影響業務”，而是在問“這張卡的退化趨勢是否表明它正在走向UE”。**對生產訓練叢集來說，處理目標不是等UE出現，而是在CE反覆增長、風險已經收斂到GPU本體時，提前退出關鍵業務，避免後續UE、掉卡或任務中斷。**

**對應案例**：J-0813（超微H200——和J-0629同一臺裝置）。第一次ECC出現後reset無復現。23天后ECC復發，此時裝置已遷移至另一個機櫃（網路、位置全部變了）。跨機櫃復發，環境因素基本排除。直接換GPU單卡，換卡後壓測通過。

### 這兩個場景合在一起，是ECC處理中最重要的決策分水嶺：

第一次reset → 觀察。同裝置reset後再次出現 → 不再等待，安排處理。

我們的叢集資料顯示，視訊記憶體退化的典型復發週期約為18-23天。這意味著reset後的安全觀察期應設為不少於30天——30天內volatile CE始終為零，才能將風險等級降為“正常監控”。

要注意，這個案例中，真正讓處理策略升級的，不是“出現了CE”，而是下面幾個條件疊加：

- **同一張GPU reset後再次出現CE。**reset只是清掉當前觀察視窗，不會修復物理根因。如果同一張卡過一段時間又出現CE，說明它不是一次性的隨機軟錯誤。
- **復發發生在跨機櫃之後。**供電、散熱、機櫃環境都變了，環境因素優先順序下降。這時問題更像是裝置自身的視訊記憶體/封裝健康風險。
- **CE是趨勢訊號，不是隻看“可糾正”三個字。**今天CE能被糾正，不代表以後一直能被糾正。如果某個區域持續產生bit錯誤，CE可能逐步演變成UE、row remapping增加、任務中斷或掉卡。
- **H200卡的業務價值和風險很高。**對訓練叢集來說，等到UE出現再換，可能已經造成任務失敗、節點下線、訓練中斷。所以高價值生產環境裡，反覆CE + 跨環境復發，可能就足夠觸發“退出關鍵業務/換卡或送修評估”。

### 場景三：GPU ECC UE出現 / Xid 79（GPU掉線）

**現象**：nvidia-smi報告UE（uncorrectable error），或者系統日誌出現Xid 79：

```text
NVRM: Xid (PCI:0000:5D:00): 79, pid='<unknown>', name=<unknown>,
GPU has fallen off the bus.
```

GPU從PCIe總線上掉落，nvidia-smi看不到這張卡了。

**判斷**：UE意味著ECC糾錯能力被突破。Xid 79是GPU從匯流排掉落的結果訊號，它可能由視訊記憶體UE觸發，也可能由PCIe鏈路異常、供電波動、驅動問題、韌體錯誤、溫度異常或板卡連線問題觸發。兩者經常同時出現，但不能簡單畫等號。

不管觸發原因是什麼，這都是嚴重訊號——但不代表一定要換卡。

為什麼？因為觸發UE或Xid 79的原因不止硬體實質損傷一種。驅動Bug、瞬間電壓波動、高溫觸發的臨時性錯誤，都可能導致一次性的UE或掉卡。如果是這些偶發因素，GPU本身的硬體可能是健康的，換卡就浪費了。

區分的關鍵驗證手段之一是：**壓測。**同時要結合Xid型別、PCIe/AER日誌、BMC電源和溫度記錄、DCGM診斷、Remapped Rows以及是否跨環境復發等條件綜合判斷。

第一步，記錄完整的ECC狀態和Xid日誌。

```bash
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.aggregate.total --format=csv
dmesg | grep -i "xid\|nvrm\|nvidia" | tail -50
```

第二步，GPU reset。

第三步，GPU Burn壓力測試24小時。GPU Burn主要壓測算力單元和供電穩定性，對視訊記憶體頻寬通道的覆蓋不如DCGM r3全面。建議在GPU Burn通過後，補做一次`dcgmi diag -r 3`（含全量視訊記憶體頻寬和位寬通道掃描），兩者互補才能更完整地驗證硬體健康。同時每分鐘監控ECC是否重新累積：

```bash
# 壓測
./gpu_burn 86400

# 另一個終端監控ECC
watch -n 60 "nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv,noheader"
```

**結果判斷**：

- 24小時壓測通過，ECC始終為零 → 該GPU在當前高負載條件下暫未復現硬體不穩定，可降低風險等級。但仍應進入30天觀察期，不要直接判定為永久健康。
- 壓測中途報錯、中斷、或ECC快速重新累積 → 確認硬體問題，安排換卡。

**對應案例**：

J-0493（超微H200）。壓測中GPU3掉卡，日誌出現Xid 79（GPU has fallen off the bus）。reset後GPU Burn 24小時通過，ECC始終為零。判斷為偶發事件，繼續監控。

J-0494（超微H200）。GPU無法識別，lspci顯示revision id為ff，看起來比Xid 79還嚴重，GPU完全從匯流排消失了。下架清除ECC後重新上架測試，未復現。

兩個案例訊號不同（一個是掉卡，一個是完全不識別），但決策邏輯相同：清ECC + 壓測 → 看是否復現。訊號的嚴重程度和是否需要換卡之間，隔著一個壓測驗證。

**關鍵提醒**：輕負載下不復現，不能作為“沒問題”的依據。有些視訊記憶體損傷只在滿負荷下才暴露，GPU Burn 24小時滿載，才是有效的驗證手段。如果只是重啟後“看看正不正常”就關單，那是在賭運氣。

### 場景四：伺服器記憶體UECC觸發CATERR

**現象**：伺服器突然自動關機或宕機。重啟後檢視BMC日誌，發現CATERR（Catastrophic Error）：

```text
[CPLD-0020] CATERR - Assertion
```

CATERR， Catastrophic Error——災難性錯誤。很多工程師看到這個詞的第一反應是：CPU壞了。

這個判斷在相當一部分情況下是有偏差的。

**判斷**：CATERR是CPU發出的訊號，意思是“CPU檢測到了一個系統級的嚴重錯誤”。但發出訊號的是CPU，觸發錯誤的不一定是CPU本身。**常見的觸發源之一是記憶體UECC，也就是記憶體出現了不可糾正錯誤，CPU讀到了不可信的資料，觸發保護性關機。**

排查順序：**先查記憶體，再查CPU。**

```bash
# 第一步：查記憶體ECC記錄
ipmitool sel list | grep -i "memory\|ecc\|dimm\|uecc"
```

如果找到了記憶體UECC記錄（比如“P1-DIMMC1 Uncorrectable ECC”），大機率CATERR的根因就在這裡。

```bash
# 第二步：查dmesg中的EDAC日誌
dmesg | grep -i edac
```

EDAC（Error Detection And Correction）是Linux核心的記憶體錯誤檢測子系統。如果記憶體出現硬體錯誤，EDAC日誌會記錄具體的記憶體控制器通道和位置。例如：

```text
DMESG_ERRS=[Wed Jan 21 15:30:52 2026] EDAC MC4: Giving out device to module i10nm_edac controller Intel_10nm Socket#1 IMC#0: DEV 0000:fe:0c.0 (INTERRUPT)
[Wed Jan 21 15:30:52 2026] EDAC MC5: Giving out device to module i10nm_edac controller Intel_10nm Socket#1 IMC#1: DEV 0000:fe:0d.0 (INTERRUPT)
[Wed Jan 21 15:30:52 2026] EDAC MC6: Giving out device to module i10nm_edac controller Intel_10nm Socket#1 IMC#2: DEV 0000:fe:0e.0 (INTERRUPT)
[Wed Jan 21 15:30:52 2026] EDAC MC7: Giving out device to module i10nm_edac controller Intel_10nm Socket#1 IMC#3: DEV 0000:fe:0f.0 (INTERRUPT)
[Wed Jan 21 15:30:52 2026] EDAC i10nm: v0.0.5 WARNING: Found Hardware Errors in dmesg:
```

這段EDAC日誌告訴我們：Socket#1上的四個記憶體控制器（IMC#0-3）都被EDAC檢測到了，並且發現了硬體錯誤（Found Hardware Errors）。Intel_10nm說明這是Intel 10nm工藝的CPU平臺。這些資訊可以幫助定位故障在哪顆CPU的哪個記憶體通道上。

```bash
# 第三步：更換對應位置的記憶體模組

# 第四步：換完後必須驗證——這一步不能省
# Memtest驗證新記憶體模組本身
memtest86

# Linpack驗證CPU+記憶體子系統在高負載下的穩定性
./xhpl
```

### 為什麼換完記憶體模組還要做Linpack？

記憶體UECC的風險不止於“一條記憶體模組壞了”。UECC發生時，CPU的記憶體控制器（IMC）必須處理異常的錯誤訊號。如果UECC持續出現，IMC可能已經承受了累積性的工作壓力。換了記憶體模組，記憶體本身的錯誤消失了，但IMC是否已經受影響，輕負載下看不出來，只有Linpack這種高強度計算壓力測試，才能在高負載下驗證CPU和記憶體子系統是否真正恢復了正常的協同工作能力。

Linpack通過後的輸出示例如下：

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

關鍵看兩個指標：Residual checks是否PASSED（資料一致性校驗通過），以及GFlops是否在同型號CPU的正常範圍內。如果Residual checks FAILED或GFlops明顯偏低，說明CPU+記憶體子系統在高負載下工作異常，需要進一步排查CPU。

**對應案例**：J-0117 / J-0261 / J-0496（超微H200，同一臺裝置），構成了一條47天的故障鏈：

J-0117：第一次，2026/1/21，記憶體UECC（P1-DIMMC1），EDAC報Hardware Errors，處理方式為更換記憶體模組。

J-0261：第二次，2026/2/8，在第一次故障18天后，CATERR（CPLD-0020），伺服器關機，處理方式為再次更換記憶體模組。

J-0496：第三次，2026/3/9，在第二次故障29天后， 伺服器自動關機，系統和IPMI均不通，更換CPU系統恢復。

47天內三次故障，最終指向CPU記憶體控制器。如果在J-0117或J-0261階段就做了Linpack驗證，有可能在更早階段發現CPU在高負載下的異常。這條故障鏈的完整分析見第7講。

![](/news/gpu-series-05/img-02.png)

**補充**：若更換DIMM後，同一槽位或同一通道繼續報錯，應升級排查CPU記憶體控制器、主機板通道和供電——根因可能不在記憶體模組上。

在8卡NVLink全互聯的HGX伺服器（如H100/H200 SXM5平臺）中，CATERR的觸發源不只有記憶體UECC。GPU基板的供電瞬態異常、NVSwitch鏈路致命錯誤、PCIe Switch的高階錯誤報告（AER），都可能通過PCIe匯流排向CPU傳送致命中斷，觸發CATERR。如果ipmitool中沒有找到記憶體UECC記錄，應檢查`dmesg | grep -i aer`和BMC中的PCIe相關報錯日誌。

##  二、ECC處理決策樹——一張圖收束全部邏輯

我們把上面四個場景串成一個決策樹，把所有決策邏輯收束為可對照執行的步驟。

```text
發現ECC相關告警
│
├─► 第一步：定位來源
│ ├─ nvidia-smi有ECC → GPU視訊記憶體的問題 → 走GPU流程
│ ├─ ipmitool有Memory ECC → 伺服器記憶體的問題 → 走記憶體流程
│ └─ 兩邊都有 → 分開處理，不要混在一起
│
├─► GPU視訊記憶體ECC流程
│ │
│ ├─ CE，首次，數量不大
│ │ └─ 記錄 → Reset → 監控24小時
│ │ ├─ volatile不再增長 → 每日監控，30天觀察期
│ │ └─ volatile持續增長 → 升級處理
│ │
│ ├─ CE/UE，同裝置reset後再次出現
│ │ ├─ 少量CE復發，增長緩慢 → 升級為高頻監控+壓測驗證
│ │ ├─ CE持續增長 / 壓測復現 → 計劃維護視窗，準備換卡
│ │ └─ 跨機櫃復發 / UE復發 / 伴隨Xid → 優先換卡
│ │
│ └─ UE / Xid 79（GPU掉線）
│ └─ 記錄日誌 → Reset → GPU Burn 24小時
│ ├─ 壓測通過，ECC為零 → 降低風險等級，進入觀察期
│ └─ 壓測失敗或ECC累積 → 確認硬體問題，換卡
│
└─► 伺服器記憶體ECC流程
│
├─ Memory UECC
│ └─ 立即更換對應DIMM → Memtest + Linpack驗證
│
└─ CATERR（伺服器宕機）
└─ 先查ipmitool記憶體ECC記錄
├─ 有UECC → 換記憶體模組 → Memtest + Linpack驗證
└─ 無UECC → 排查CPU/主機板/供電
```

##  三、從維修視角看運維——ECC監控與風險分級實操

GPU伺服器的ECC管理，需要維修認知前置化後的硬體風險管理思維。以下監控方法和分級標準來自我們在維修過程中的經驗積累。

### 每天跑一次：GPU視訊記憶體ECC查詢

```bash
nvidia-smi --query-gpu=index,name,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.aggregate.total --format=csv
```

建議配置為定時任務，每天固定時間自動執行並記錄輸出。關鍵看兩個維度：

- volatile：自上次reset以來的累積。**看的是每天的增量，不是總數。**從0變成10，比從10000變成10010更值得關注——前者說明退化剛開始，後者說明退化已經很久了。
- aggregate：歷史總累計，不會因reset歸零。一張卡如果aggregate數值很大但volatile為零，說明被多次reset，需要額外警惕，不要被“當前為零”的表象迷惑。aggregate提供歷史健康參考，但仍需結合裝置重置歷史和維修記錄綜合理解。

### 每天跑一次：伺服器記憶體ECC查詢

```bash
ipmitool sel list | grep -i "memory\|ecc\|dimm"
ipmitool sdr type "Memory"
```

GPU任務崩潰不一定是GPU的問題，記憶體UECC觸發CATERR導致整機宕機的案例，我們見過不止一次。這條命令和上面的nvidia-smi命令同等重要，每天都要跑。

### 每週做一次：DCGM健康檢查

```bash
dcgmi health -g 0 -c # 快速健康掃描
dcgmi diag -r 2 # 中等級別診斷（十幾分鍾）
```

### 每月做一次：DCGM全項診斷

```bash
dcgmi diag -r 3 # 全項診斷（可能需要幾十分鐘，在空閒時段執行）
```

r3級別會覆蓋視訊記憶體頻寬測試等深度檢查，能發現日常監控發現不了的位寬通道退化。

### 告警閾值（初始建議值）

以下為初始運維閾值。實際專案應根據GPU型號、業務負載強度、歷史基線和客戶SLA要求進行調整。

![](/news/gpu-series-05/img-04.png)

### 風險分級與業務影響對照表

這張表把ECC訊號和業務決策直接對應，告訴工程師“出現這個訊號，對業務意味著什麼，下一步做什麼”。

**這套分級的價值在哪裡？**它把“該觀察”和“該換卡”的線畫清楚了。一張幾萬元的HBM卡，可能只是宇宙射線觸發的偶發CE（L1），不需要換卡。但一張CE持續增長、壓測復現、跨機櫃還復發的卡（L3），再reset等待就是在浪費時間，每多等三週就多承受三週的業務風險。

![](/news/gpu-series-05/img-05.png)

### 我們的實踐：自動化ECC健康監控體系

在我們的日常運維服務中，上述ECC監控和分級處理機制已經以自動化工具的形式落地執行：每天定時採集全叢集GPU和伺服器記憶體的ECC資料，自動計算每日增量和趨勢變化，超過閾值自動推送告警到運維工程師，從訊號採集到風險分級到處理觸發，全流程自動化，不依賴人工巡檢的及時性和記憶力。

這套體系是從大量維修案例中提煉出來的，每一條閾值、每一個分級標準，背後都有真實的故障案例支撐。如果您的叢集需要部署類似的ECC健康監控體系，歡迎與我們溝通。

### 運維與維修職責邊界

![](/news/gpu-series-05/img-06.png)

##  本講小結

遇到ECC報錯，按三步走：

**第一步：定位來源。**nvidia-smi（GPU視訊記憶體）還是ipmitool（伺服器記憶體）。方向對了才能往下走。

**第二步：判斷場景。**GPU視訊記憶體的CE首次/復發/UE三種情況，伺服器記憶體的UECC/CATERR兩種情況，處理方式各不相同。

**第三步：做對動作。**該觀察就記錄趨勢耐心等30天，該壓測就GPU Burn跑滿24小時，達到L3維護觸發條件時不應繼續簡單reset觀察，換完了必須驗證（GPU→GPU Burn，記憶體→Memtest+Linpack）。

下一講預告：**第6講·ECC錯誤（中）——歸因路徑：同樣是ECC報錯，根因可能完全不同。**本講講的是“看到ECC該做什麼”，下一講講“為什麼會出現ECC”——六條根因路徑，從視訊記憶體顆粒損傷到散熱退化到供電波動，每條路徑的判斷依據和處理方式完全不同。

上海集培優資訊科技有限公司

GPU 伺服器第三方維修、維保、運維
