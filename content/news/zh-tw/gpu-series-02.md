---
slug: "gpu-series-02"
title: "GPU維修系列講座｜第2講：GPU的記憶系統：DRAM、DDR、GDDR、HBM與ECC"
date: "2026-06-16"
category: "tech"
source: "https://mp.weixin.qq.com/s/3oIgIZoc1dlIMvjZo9Wbiw"
---

從這一講開始，我們進入視訊記憶體和ECC主題。在講解具體故障之前，需要先理清一組容易混淆的概念。DRAM、DDR、GDDR、HBM、ECC，這些詞頻繁出現在GPU伺服器的故障日誌和維修報告裡，但很多工程師並不清楚它們之間的關係。搞清楚這些概念，是正確診斷視訊記憶體和記憶體故障的前提。這一講是後續ECC和視訊記憶體專題的知識底座。

##  一個真實的誤判

一臺H200伺服器出現ECC報錯，運維團隊認為ECC來自GPU視訊記憶體方向，在GPU方向排查了兩天沒有結果。裝置送到我們這裡，維修工程師第一步是查詢BMC（Baseboard Management Controller，基板管理控制器）的系統事件日誌，輸入如下命令：

```bash
ipmitool sel list | grep -i "memory\|ecc"
```

返回結果中出現：

```text
Memory ECC Alert: Uncorrectable ECC error detected
Location: P1-DIMMC1
```

P1-DIMMC1指向的是伺服器主機板上的一條DDR記憶體模組，和GPU視訊記憶體沒有關係，更換這條DDR記憶體模組，ECC報錯消失。

同樣叫“ECC錯誤”，出現在GPU視訊記憶體上和出現在伺服器記憶體模組上，診斷工具不同，處理方式不同，嚴重程度也不同。遇到ECC報錯，第一步是判斷它來自哪裡。

##  一、底層技術：DRAM

### 什麼是DRAM

本文討論的三種儲存，伺服器主機板上的DDR記憶體、GPU上的GDDR視訊記憶體、以及資料中心GPU裡的HBM視訊記憶體，底層儲存單元都屬於**DRAM**（Dynamic Random Access Memory，動態隨機存取儲存器）體系。

一個DRAM儲存單元的結構極其簡單，它由一個微型電容加一個電晶體組成。電容充電代表1，電容放電代表0。動態（Dynamic）的含義是：即使沒有任何故障，電容也會慢慢漏電，電荷會自然消散。所以，DRAM需要按規範週期重新整理（重新充電），典型重新整理視窗為**數十毫秒**，高溫時可能縮短。

### 什麼是bit翻轉

理解了DRAM的儲存原理，就能理解什麼是**bit翻轉**（bit flip）：一個本來應該是1的bit變成了0，或者一個本來應該是0的bit變成了1。bit翻轉發生的常見原因包括：

**硬體老化。**隨著器件老化或缺陷發展，部分儲存單元的保持時間可能縮短，在重新整理前發生資料丟失。這是持續性ECC錯誤增長的常見硬體根因之一。

**高能粒子。**高能粒子在半導體內部沉積電荷，可能擾動儲存單元狀態。這類bit翻轉通常具有隨機性，GPU reset後同一位置未必再次報錯；如果相同位置持續復現，則更應懷疑硬體退化。高能粒子主要來自大氣中子和晶片封裝材料產生的α粒子等，是ECC軟錯誤的已知物理機制之一，但生產環境中的單次錯誤通常難以僅憑日誌歸因於具體粒子來源。

**溫度過高。**高溫會加速電容漏電，在正常溫度下能穩定保持的電荷，在高溫下可能提前丟失，這稱為散熱退化，是導致ECC錯誤增長的物理原因之一。我們修復過一批GPU顯示卡，這批顯示卡的ECC報錯持續上升，拆開檢查後，發現散熱器貼合不良，重新塗抹矽脂並以正確力矩擰緊散熱器後，溫度回落，ECC不再新增。

**供電波動。**電壓不穩定，會導致電容充放電異常，某些儲存單元的狀態可能被意外改變。

**儲存單元bit翻轉是DRAM ECC錯誤的重要來源之一。此外，ECC事件也可能由資料通路、控制器、封裝互連、供電瞬態和訊號完整性異常觸發。**

##  二、三種產品形態：DDR、GDDR、HBM

DRAM是底層的儲存單元技術，DDR、GDDR、HBM是用DRAM這一相同的底層技術構建的三種不同產品形態。

### DDR：伺服器系統記憶體

**DDR（Double Data Rate，雙倍資料速率）**，就是伺服器主機板上的記憶體模組。長條形PCB板，插在主機板的DIMM（Dual In-line Memory Module，雙列直插記憶體模組）插槽裡。多顆DRAM器件，按rank和通道組織焊在PCB上，共同提供資料位寬和ECC校驗位。DDR記憶體供CPU使用，伺服器執行作業系統、載入資料、執行程式都需要它。當前主流是DDR5。

故障定位和維修方式：通過ipmitool和EDAC/MCE日誌定位到具體DIMM插槽，拔出更換即可。DDR記憶體故障的詳細診斷方法，包括如何區分記憶體模組本身故障和CPU記憶體控制器故障，我們將在伺服器主機專題中具體展開。

### GDDR：GPU平鋪視訊記憶體

**GDDR（Graphics DDR，圖形專用雙倍資料速率）**，從DDR技術演化而來，針對GPU的高頻寬需求做了專門最佳化。一顆顆獨立的DRAM晶片顆粒通過BGA焊接平鋪在顯示卡的PCB板上。RTX 4090、RTX 5090、A6000、A40、L40，使用的都是GDDR。當前主流是的型號為GDDR6、GDDR6X、GDDR7。

故障定位和維修方式：可以通過視訊記憶體測試工具和地址對映分析定位故障區域，然後用BGA返修臺把故障顆粒拆下來焊上新的，這比更換整張卡成本低得多。具體工具和方法在我們將消費級GPU維修專題中展開。

### HBM：GPU堆疊視訊記憶體

**HBM（High Bandwidth Memory，高頻寬記憶體）**，同樣以DRAM儲存單元為基礎，但採用了不同於DDR DIMM和GDDR板級平鋪的寬介面、堆疊與先進封裝路線。多層DRAM晶片垂直堆疊在一起，例如H100和H200的HBM3/HBM3e是8層堆疊。層與層之間用大量微米級矽通孔（TSV，Through-Silicon Via）連線，整個堆疊體通過一塊矽中介層（interposer）和GPU核心封裝在同一個基板上。

HBM具有三個關鍵優勢，是資料中心GPU選擇它的核心原因：

**頻寬遠高於GDDR。**HBM3e的頻寬可達4.8TB/s（H200），而GDDR6X的RTX 4090大約1TB/s，差了近5倍。對於大模型訓練推理及其他對記憶體頻寬敏感的工作負載，視訊記憶體頻寬是影響GPU核心利用率的重要瓶頸之一。

**與GPU核心物理距離極近。**HBM和GPU核心封裝在同一塊矽中介層上，兩者之間的訊號傳輸距離只有毫米級。相比之下，GDDR需要通過釐米級的PCB走線連線GPU，因此，HBM的訊號延遲和傳輸損耗遠更低。物理距離，以及TSV的高密度連線，是實現了TB/s級頻寬的關鍵。

**每bit傳輸能耗更低。**HBM通過超寬介面、較低的單引腳傳輸速率和短距離互連，在提供高聚合頻寬的同時，可以顯著降低單位資料傳輸能耗。

故障定位和維修方式：HBM堆疊內部的DRAM die、TSV或微凸點故障，通常無法單獨拆開更換某一層。在高價值維修場景中，若GPU+HBM封裝元件本身完好而PCB損壞，也可能評估封裝元件整體移植，但風險和成本很高，具體內容我們將在GPU核心與封裝專題中介紹。

### 主要GPU的視訊記憶體配置

![](/news/gpu-series-02/img-02.png)

（表中為各型號SXM版本的官方標稱值。）

### DDR、GDDR、HBM對比

![](/news/gpu-series-02/img-03.png)

（表中頻寬資料為具體產品或介面配置的聚合頻寬，不代表所有DDR、GDDR和HBM產品。）

##  三、GPU視訊記憶體故障相關的可觀察訊號與診斷方向

運維工程師在日常工作中看到的是故障訊號，因此，以下我們按故障訊號型別，列出視訊記憶體方向的常見表現。每個訊號按四項展開：訊號表現、可能來源、排查入口、訊號邊界。

### 訊號一：ECC CE/UE

**訊號表現：**nvidia-smi報告DRAM Correctable或Uncorrectable錯誤計數增長。

**可能來源：**儲存單元退化、視訊記憶體供電異常、資料通路或封裝互連異常。CE可能是瞬態軟錯誤，也可能是重複性硬錯誤。

### 排查入口：

```bash
# 查ECC詳細資訊，區分DRAM和SRAM分類
nvidia-smi -q -d ECC

# Ampere架構及以後代際的架構中，需同時檢查行重對映狀態
nvidia-smi -q -d ROW_REMAPPER
```

檢視時注意：欄位支援情況隨GPU架構和驅動變化；顯示N/A表示不支援或不可獲取，不是零錯誤；volatile計數可能因驅動過載清零，應記錄取樣時間和驅動載入時間來建立增量基線；應優先區分DRAM與SRAM錯誤，兩者的含義和處置方向不同。

**訊號邊界：**ECC報告的是資料完整性異常，不直接等於某顆DRAM已經物理老化。UE表示錯誤無法由當前ECC機制糾正，也不等於一定已經發生永久性DRAM損壞。CE/UE的完整決策框架（什麼時候觀察、什麼時候行動、什麼時候換卡），我們將在ECC專題中展開。

### 訊號二：效能測試結果明顯偏低

**訊號表現：**GPU能正常識別和使用，但效能測試的吞吐量明顯低於同型號同配置的健康卡。

效能異常可能涉及三個不同層面：PCIe主機與GPU之間的傳輸異常、GPU之間的互聯傳輸異常、GPU本地視訊記憶體訪問吞吐異常。三者的根因方向完全不同。

**可能來源：**PCIe鏈路降速或降寬、NUMA跨節點影響、GPU/視訊記憶體降頻（溫度或功耗限制）、視訊記憶體通道或資料路徑異常、驅動/CUDA版本差異、測試條件不一致。

### 排查入口：

```bash
# PCIe鏈路狀態（先列出每張NVIDIA裝置的PCI地址，再按地址逐張檢查）
# LnkCap為裝置能力上限，LnkSta為當前協商狀態，重點比較Speed和Width
# 空閒時可能因節能降速，建議在負載期間複查
lspci -Dnn -d 10de:
# 按PCI地址檢查具體裝置，例如：
lspci -s 0000:65:00.0 -vvv | grep -E "LnkCap|LnkSta"

# GPU時鐘、溫度、功耗和Throttle狀態
nvidia-smi --query-gpu=index,clocks.current.graphics,clocks.current.memory,temperature.gpu,power.draw,clocks_throttle_reasons.active --format=csv
```

判斷效能異常時，必須與同型號、同驅動、同功耗模式、同溫度條件下的健康卡對比，不能直接和產品標稱理論峰值比較。三個層面（PCIe傳輸、GPU間互聯、GPU本地視訊記憶體訪問）需要使用不同測試工具和測試方向，本節不提供統一頻寬命令，測試結果必須註明測試路徑、資料方向、資料規模和環境條件。

**訊號邊界：**效能低於預期時，應優先排除PCIe、時鐘、溫度、功耗和軟體因素，再考慮視訊記憶體通道或資料路徑的硬體異常。

### 訊號三：消費級GPU的破圖、渲染錯誤

**訊號表現：**螢幕出現橫條紋、色塊、紋理錯誤或隨機畫素異常。消費級GPU（RTX 4090/5090）通常缺少可供運維讀取的系統級視訊記憶體ECC遙測，視訊記憶體資料錯誤可能直接表現為幀緩衝區資料被汙染。

**可能來源：**視訊記憶體bit翻轉（無ECC保護下直接汙染幀緩衝區）、GPU核心故障、顯示鏈路異常、驅動問題、供電不穩。

**排查入口：**一個關鍵分流方法：對比螢幕截圖檔案和物理螢幕顯示。如果截圖檔案中也存在異常，更偏向GPU/視訊記憶體/驅動方向；如果截圖正常但物理螢幕異常，更偏向顯示介面、線纜或顯示器方向。該方法用於縮小範圍，不能單獨確定故障層級。排除驅動和軟體後，壓測復現，考慮硬體方向。

**訊號邊界：**破圖的來源很多，不能看到畫面異常就認定視訊記憶體顆粒損壞。消費級GPU的視訊記憶體診斷工具和方法在消費級GPU維修專題中展開。

### 訊號四：視訊記憶體容量識別異常

**訊號表現：**nvidia-smi顯示的視訊記憶體總量與同型號健康卡不一致。

**可能來源：**ECC狀態差異、驅動保留記憶體差異、查詢物件不同（物理GPU、MIG例項或vGPU的口徑不同）、韌體狀態異常、視訊記憶體控制器或相關互連的硬體初始化異常。

### 排查入口：

```bash
# 檢視各GPU視訊記憶體總量，與同型號健康卡對比
nvidia-smi --query-gpu=index,name,memory.total --format=csv

# 檢查ECC狀態（完整輸出保留GPU對應關係，多卡環境下不要只grep單行）
nvidia-smi -q -d ECC
```

必須先排除ECC開關狀態、查詢物件（物理GPU vs MIG例項）和驅動版本等配置差異，再進入硬體方向排查。

**訊號邊界：**容量差異可能來自配置或查詢口徑不同，不能看到數字不一樣就懷疑顆粒或控制器損壞。

### 訊號五：間歇性崩潰（冷機正常、熱機出錯、重啟暫時恢復）

**訊號表現：**GPU冷啟動後功能正常，執行一段時間後出現Xid報錯、任務崩潰或掉卡，重啟後暫時恢復，再次執行又出問題。

**可能來源：**封裝或焊點的溫度相關接觸異常、供電在高負載下波動、散熱不足、VRM溫漂、PCIe鏈路不穩定。根據受影響的訊號網路不同，可能同時伴隨ECC、鏈路錯誤或容量異常。

### 排查入口：

```bash
# 溫度、功耗、時鐘和Throttle連續取樣（部分欄位在某些GPU上可能返回N/A）
nvidia-smi --query-gpu=timestamp,index,temperature.gpu,power.draw,clocks.current.graphics,clocks_throttle_reasons.active --format=csv -l 5

# Xid日誌（NVIDIA官方建議搜尋 NVRM: Xid）
journalctl -k | grep -F 'NVRM: Xid'
```

記錄故障與溫度/負載/執行時長的關聯性，在故障復現前後的取樣資料中對齊故障時間，觀察溫度、功耗、時鐘、負載切換和累計執行時間的變化趨勢。不以“核心溫度正常”排除溫度相關硬體問題。

**訊號邊界：**“冷機正常、執行後出錯”提示故障可能與溫度、負載或累計執行時間相關，但具體是BGA、供電、散熱還是其他方向，需要進一步的對照測試和物理檢查。Xid是調查起點，不能單獨證明硬體損壞。

**ECC是資料中心GPU上重要且直接的視訊記憶體資料完整性訊號，但效能異常、破圖、容量變化、間歇性崩潰同樣可能指向視訊記憶體方向。看不到ECC不等於視訊記憶體沒有問題。本節建立的是訊號到排查方向的初步對映，不能憑單一訊號判定故障器件。**

##  四、伺服器記憶體故障相關的可觀察訊號與診斷方向

### 訊號一：記憶體ECC CE/UE（由BMC、韌體或作業系統報告）

**訊號表現：**BMC系統事件日誌（SEL）、作業系統EDAC/MCE日誌或廠商管理工具報告記憶體可糾正或不可糾正錯誤。

**可能來源：**記憶體模組儲存單元退化、CPU記憶體控制器（IMC）異常（根因在CPU但表現為記憶體ECC）、主機板記憶體通道走線損壞或接觸不良。

### 排查入口：

```bash
# BMC系統事件日誌
ipmitool sel list | grep -Ei "memory|ecc|dimm|caterr"

# 作業系統側EDAC/MCE（具體工具取決於發行版和CPU平臺）
journalctl -k | grep -Ei "edac|mce|memory error|corrected|uncorrected"
```

BMC SEL沒有記錄不等於伺服器記憶體沒有ECC事件，還應結合作業系統側日誌交叉確認。判斷根因方向時，可以在維護視窗內遵循伺服器廠商的DIMM配置規則，通過已知良品替換或通道對照判斷故障是否跟隨DIMM。

**訊號邊界：**換槽後錯誤跟隨DIMM是指向記憶體模組的強證據，但不是絕對判定。插拔本身改變了接觸狀態，某些鎖步或映象配置中也無法精確定位單條DIMM。IMC和主機板通道的詳細診斷方法，我們將在伺服器主機專題中展開。

### 訊號二：整機宕機及不可恢復硬體錯誤記錄

**訊號表現：**伺服器突然宕機重啟。BMC日誌中可能出現CATERR（Intel平臺的災難性錯誤訊號）、Machine Check或其他平臺特定的致命事件。

**可能來源：**無法被系統隔離的記憶體UE、CPU硬體故障、互連或PCIe不可恢復錯誤。CATERR不是記憶體專屬訊號，只有當日志進一步指向記憶體控制器、通道或DIMM時，才能進入記憶體根因分支。

### 排查入口：

```bash
# 宕機後優先檢查BMC SEL；BMC通常獨立於主機作業系統執行
ipmitool sel list | grep -Ei "caterr|memory|machine check|fatal"

# 檢查上一次啟動週期的核心日誌（需要系統啟用持久化journal，否則可能查不到）
journalctl -k -b -1 | grep -Ei "mce|hardware error|fatal|edac"
```

**訊號邊界：**宕機可能來自多個方向（記憶體、CPU、互連、電源），需要BMC和作業系統日誌交叉確認後才能判斷是否屬於記憶體方向。不同CPU平臺的錯誤訊號名稱和恢復機制不同。

### 訊號三：DIMM不識別或容量異常

**訊號表現：**系統啟動後識別的記憶體總量低於預期，或某個DIMM插槽顯示為空。

**可能來源：**物理接觸不良（記憶體模組金手指氧化、插槽彈片鬆弛）、SPD（Serial Presence Detect，序列存在檢測）晶片損壞、DIMM安裝順序不符合平臺規則、DIMM型別或容量混插不受支援、BIOS/韌體問題、記憶體訓練失敗、CPU插座觸點問題、主機板通道故障。間歇性接觸不良也可能產生ECC或訓練失敗。

### 排查入口：

```bash
# 檢視韌體通過SMBIOS提供的DIMM資訊
dmidecode --type 17

# 作業系統可用記憶體
free -h
```

需要將BIOS/韌體識別容量與作業系統可用容量分開比較。如果異常發生在POST階段（系統尚未進入作業系統），應優先檢視BIOS/UEFI、BMC啟動日誌和廠商管理工具中的Memory Training或DIMM Disabled記錄。在重新插拔或換槽前，應斷電並確認待機電源釋放、執行ESD防護、記錄原始槽位、遵守廠商DIMM安裝規則。保修期內裝置優先走廠商流程。

**訊號邊界：**DIMM不識別的常見原因包括安裝順序、混插、接觸和配置，不能直接認定記憶體模組損壞。

**伺服器記憶體異常既可能來自DIMM本身，也可能來自IMC、CPU插座、主機板通道或平臺配置。ECC、宕機和容量異常都是診斷入口，不能僅憑單一日誌或一次換槽結果認定故障器件。**

##  五、ECC：貫穿視訊記憶體和記憶體的糾錯機制

### ECC的本質

ECC（Error Correcting Code，錯誤糾正碼）是一套內建在硬體裡的資料自檢和糾錯機制。每次寫入資料時，硬體自動計算並附加一組校驗碼。每次讀取時，硬體用校驗碼檢查資料是否完整。如果有少量錯誤，ECC能自動糾正；如果錯誤超出糾正能力，ECC報告無法糾正。

前者叫**CE**（Correctable Error，可糾正錯誤），後者叫**UE**（Uncorrectable Error，不可糾正錯誤）。

糾錯能力取決於具體的編碼方案、保護粒度和平臺實現。以最基礎的SEC-DED（單bit糾錯、雙bit檢錯）為例，在同一個校驗保護單元內發生1個bit的錯誤可以被自動糾正（CE），發生2個bit的錯誤可以被檢測到但無法糾正（UE）。不同校驗單元內各自發生1個bit錯誤時，每個都可以被獨立糾正，仍然是CE。實際GPU和伺服器使用的ECC方案可能比SEC-DED更強，能糾正更多bit的錯誤。

### CE和UE的含義

**CE是預警訊號。**ECC在資料被使用前完成糾正時，出現CE，通常不會造成計算結果錯誤。CE的出現可能只是偶發的軟錯誤（一次性的環境因素），但如果CE持續增長則說明硬體可能在退化。因此**CE的增長趨勢比絕對數值更重要**。

**UE是緊急訊號。**ECC發現了錯誤但超出了糾正能力，讀取到的資料不可信，出現UE，UE需要立即評估。UE的實際影響取決於錯誤能否被系統成功隔離：如果錯誤被隔離（NVIDIA稱為contained），系統可能只終止受影響的任務並下線故障頁面，其他任務仍可繼續執行；如果錯誤無法隔離（uncontained），則可能要求GPU reset、節點重啟或導致系統宕機。

GPU視訊記憶體不可糾正錯誤，可能伴隨Xid 48或Xid 140；Xid 63表示視訊記憶體重對映事件，Xid 64表示重對映失敗。實際處置中，還應結合Recovery Action和錯誤是否被成功隔離（contained）來判斷。在部分Intel伺服器平臺上，無法被系統隔離的伺服器記憶體UE可能觸發CATERR（Catastrophic Error，災難性錯誤）導致整臺伺服器的所有GPU宕機。（其他CPU平臺的錯誤名稱和恢復機制可能不同。）

### Volatile和Aggregate

nvidia-smi中的ECC計數分兩種：

**Volatile**：自最近一次GPU驅動（nvidia.ko）載入以來的錯誤計數。注意它不一定等同於本次開機週期。在Linux未啟用Persistence Mode時，GPU驅動可能在應用結束後解除安裝，Volatile會更頻繁地歸零。

**Aggregate**：由GPU持久化儲存的長期累計計數。Aggregate計數在Ampere及以後架構上不支援清除，這是Nvidia官方的設計行為。

**Volatile反映當前執行週期的健康狀態，Aggregate反映歷史累計的退化程度。**兩者結合看，Volatile持續新增說明當前仍在產生錯誤（不是歷史遺留），Aggregate很高則說明這張卡歷史上經歷了大量錯誤。

### ECC查詢：GPU視訊記憶體和伺服器記憶體使用不同的查詢工具

**GPU視訊記憶體ECC**：資料中心GPU（H100/H200/A100/B200/B300等）通常支援並啟用ECC，部分專業卡（A6000、L40等）也支援ECC，消費級GPU（RTX 4090/5090）預設不開啟系統級ECC遙測。實際是否啟用應通過nvidia-smi檢視ECC Mode Current確認，不要假定預設狀態。在支援ECC遙測的資料中心GPU上，ECC是重要且直接的視訊記憶體資料完整性訊號之一。

補充說明：部分現代GDDR器件具有顆粒內部糾錯能力（On-die ECC），但它與GPU控制器提供的端到端ECC及nvidia-smi遙測不是同一層機制。On-die ECC主要用於提高DRAM die自身良率和可靠性，不保證系統能獲得完整的錯誤遙測。

```bash
# GPU視訊記憶體ECC查詢
nvidia-smi -q -d ECC

# 多卡環境下加index欄位，方便區分和批次處理
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv
```

**伺服器記憶體（DDR）ECC**：伺服器級平臺通常支援並啟用ECC，具體取決於CPU、主機板、DIMM型別和BIOS配置。

```bash
ipmitool sel list | grep -i "memory\|ecc\|dimm"
```

遇到ECC報錯，第一步是判斷它來自GPU視訊記憶體（nvidia-smi）還是伺服器DDR記憶體（BMC SEL、EDAC/MCE及廠商管理工具）。定位錯了物件，後續所有排查動作都在錯誤方向上。

##  六、（拓展閱讀）行重對映：GPU視訊記憶體的自我修復機制

### 什麼是行和bank

要理解行重對映，先需要了解DRAM的組織結構。DRAM內部的儲存單元按**行（row）**和**列（column）**排列成二維陣列，類似一張巨大的電子表格。多個這樣的二維陣列組成一個**bank**（儲存體），一顆DRAM晶片內部通常包含多個bank。讀寫資料時，先選中某個bank中的某一行，再從該行中讀取需要的列。

當某一行中的儲存單元反覆出錯時，這一行就成為了故障熱點。

### 行重對映機制

從Ampere架構（A100）開始，NVIDIA引入了硬體級行重對映（Row Remapping）機制。當視訊記憶體某一行反覆出現錯誤時，GPU硬體會將故障行對映到備用行，重對映生效後，後續對該邏輯行的訪問會轉向備用行。該機制用於隔離故障位置，不代表已經發生的不可糾正資料錯誤可以被恢復。這個過程對軟體透明，應用不需要做任何的改動。

每個bank有獨立的備用行資源。輸入以下命令查詢行重對映狀態：

```bash
nvidia-smi -q -d ROW_REMAPPER
```

輸出中關注以下欄位：

- **Correctable Error**因CE觸發的重對映次數。CE重對映是一種預防性措施，把反覆出錯的行提前遷走。
- **Uncorrectable Error**因UE觸發的重對映次數。UE重對映說明已有無法糾正的錯誤發生。
- **Pending**是否有等待GPU reset後才生效的重對映。顯示Yes時需要安排reset視窗。
- **Remapping Failure**是否發生過重對映失敗。顯示Yes說明至少發生過一次重對映失敗，是嚴重訊號，需結合Bank Remap Availability判斷是否因備用資源不足。
- **Bank Remap Availability**各bank的備用行資源剩餘狀態。按剩餘可用量分為Max（充足）、High、Partial、Low、None（耗盡）五檔，統計每檔有多少個bank。如果出現Low或None，說明對應bank的備用資源已接近或完全耗盡。這是評估備用資源是否充足的關鍵欄位。

根據NVIDIA官方說明，CE觸發的重對映不計入Bank Remap Availability的消耗，因為必要時CE重對映可以被UE重對映替換（UE的優先順序更高）。因此，即使CE重對映的次數很多，也不能直接據此判斷備用資源接近耗盡。真正需要關注的是UE重對映次數、Remapping Failure標誌和Bank Remap Availability的實際狀態。

### 新平臺的Channel Repair

在受支援的新平臺和較新驅動中，NVIDIA管理介面還可能顯示Channel Repair Pending狀態，用於反映通道級維修動作是否待處理。行重對映解決的是單行級別的故障隔離，Channel Repair面向的是更大範圍的通道級故障。具體支援範圍、觸發條件和處置方式以平臺文件為準。

##  七、案例：從ECC資料讀懂視訊記憶體健康狀態

我們檢測過一臺A100 SXM4（案例號 J-1285），上電後各路供電電壓正常，GPU驅動正常載入。通過以下命令檢視ECC引數：

```text
nvidia-smi -q -d ECC
```

輸出如下：

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

我們把關鍵部分抽取出來：

```text
Aggregate:
DRAM Correctable: 134670
DRAM Uncorrectable: 4

Remapped Rows:
Correctable Error: 124
Uncorrectable Error: 1
```

這組資料裡有三層訊號，

**第一層：Aggregate DRAM Correctable 134670。**歷史累計的可糾正錯誤有13萬多個，說明這張卡的視訊記憶體經歷了大量錯誤積累。結合現場記錄，當時GPU剛完成驅動載入，因此Volatile的DRAM Correctable為0。一般情況下，Volatile為0只能說明自最近一次驅動載入以來尚未記錄新錯誤，需要讓GPU執行一段時間後再次取樣Volatile觀察是否有新增。

**第二層：Aggregate DRAM Uncorrectable 4。**出現了4個不可糾正錯誤。UE意味著ECC糾錯能力曾被突破，視訊記憶體的某些區域錯誤嚴重到無法糾正。

**第三層：Remapped Rows 124/1。**124行因CE被重對映，1行因UE被重對映。前面講過，CE觸發的重對映不計入Bank Remap Availability的消耗，所以僅憑124條CE重對映不能直接判斷備用資源接近耗盡。但1次UE重對映和4次歷史UE的存在，說明視訊記憶體退化已經突破了ECC的糾正能力。

**判斷當前是否仍在產生新錯誤：**我們讓GPU在正常工況下執行數小時後再次取樣，Volatile DRAM Correctable從0快速上升到數百，確認視訊記憶體顆粒當前仍在即時產生新的錯誤，硬體損傷是持續的。

綜合Aggregate大量積累、UE存在、行重對映已發生（含1次UE重對映）、Volatile持續新增等多個訊號，最終判斷：在當前維修技術和經濟合理性下，不建議修復。

CE、UE、行重對映三個概念如何具體應用於運維決策（什麼時候觀察、什麼時候行動、什麼時候換卡），在ECC專題中會詳細展開。

##  八、從維修角度看運維：ECC來源判斷和基礎巡檢

本講是知識底座講，完整的ECC處理決策和巡檢SOP在ECC專題（第5-7講）展開。這裡只給出最基礎的判斷框架和命令，幫助運維工程師在遇到ECC報錯時快速確定方向。

### ECC來源快速判斷

遇到“ECC報錯”，第一步是判斷它來自哪裡：

```bash
# 第一步：查GPU視訊記憶體ECC
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv

# 第二步：查伺服器記憶體ECC
ipmitool sel list | grep -i "memory\|ecc\|dimm"
```

GPU視訊記憶體有ECC異常增長，進入ECC專題的GPU ECC處理流程。

伺服器記憶體有ECC，做跟隨性驗證（在維護視窗內，遵循伺服器廠商的DIMM配置規則，通過已知良品替換或通道互換判斷故障是否跟隨DIMM，不得隨意跨通道換槽）。

兩個地方都查不到，可能不是ECC問題，檢查其他方向（Xid、PCIe、供電等）。

注意：BMC SEL沒有記錄不等於伺服器記憶體沒有ECC事件，還應結合作業系統側的EDAC、MCE或rasdaemon檢查（具體工具取決於發行版和CPU平臺）：

```bash
journalctl -k | grep -Ei "edac|mce|memory error|corrected|uncorrected"
```

### 基礎巡檢命令

```bash
# ========== ECC相關日常巡檢 ==========

# GPU視訊記憶體ECC增量檢查（多卡環境加index欄位）
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv

# GPU視訊記憶體ECC完整資訊
nvidia-smi -q -d ECC

# Ampere及之後架構（A100/H100/H200/B200/B300）查行重對映狀態
nvidia-smi -q -d ROW_REMAPPER

# GPU行重對映狀態（CSV格式，方便指令碼處理）
nvidia-smi --query-remapped-rows=gpu_name,remapped_rows.correctable,remapped_rows.uncorrectable,remapped_rows.pending,remapped_rows.failure --format=csv

# 伺服器記憶體ECC事件
ipmitool sel list | grep -i "memory\|ecc\|dimm\|caterr"
```

### ECC嚴重程度初篩建議

（內部運維策略，最終以Recovery Action及平臺策略為準）

![](/news/gpu-series-02/img-05.png)

### 運維與維修職責邊界

![](/news/gpu-series-02/img-06.png)

##  本講小結

這一講理清了GPU伺服器儲存體系的完整知識框架：

**DRAM是底層技術。**DDR、GDDR、HBM的儲存單元都屬於DRAM體系。bit翻轉是ECC錯誤的常見物理來源之一，但ECC事件也可能由資料通路、控制器、封裝互連、供電等方向觸發。

**DDR給CPU用，GDDR和HBM給GPU用。**DDR是記憶體模組，GDDR是平鋪焊接的視訊記憶體顆粒，HBM是堆疊封裝的視訊記憶體。三者故障訊號不同、維修方式不同、查詢工具不同、成本不同。

**視訊記憶體故障不只是ECC。**通道/資料路徑異常、焊點問題、破圖、供電異常等故障不一定觸發ECC。消費級GPU通常缺少可供運維讀取的系統級視訊記憶體ECC預警，故障往往通過破圖、Xid、驅動重置或應用崩潰間接暴露。

**ECC出現在兩個不同的地方。**GPU視訊記憶體（HBM/GDDR）和伺服器記憶體（DDR），查詢工具不同，處理方式不同。遇到ECC報錯，第一步是判斷它來自哪裡。

**CE是預警，UE是緊急，行重對映是自我修復。**三者共同構成判斷視訊記憶體健康狀態的訊號體系。行重對映備用資源的評估應關注Bank Remap Availability和UE相關指標，CE重對映次數不等於資源消耗。

上海集培優資訊科技有限公司

GPU 伺服器第三方維修、維保、運維
