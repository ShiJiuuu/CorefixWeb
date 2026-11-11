---
slug: "gpu-series-02"
title: "GPU repair series #2: DRAM, DDR, GDDR, HBM and ECC"
date: "2026-06-16"
category: "tech"
source: "https://mp.weixin.qq.com/s/3oIgIZoc1dlIMvjZo9Wbiw"
excerpt: "These five terms turn up in every fault log and are routinely mixed up. What each one actually means, and how to tell which layer a given error comes from."
translated: true
---
From this part on we enter memory and ECC. Before looking at specific faults, we need to separate a set of terms that get mixed up constantly: DRAM, DDR, GDDR, HBM and ECC. They turn up in every fault log and repair report, and many engineers are not clear how they relate. Getting them straight is the prerequisite for diagnosing memory faults — this part is the knowledge base for the ECC and memory topics that follow.

## A real misdiagnosis

An H200 raised ECC errors. The operations team assumed it was GPU memory and spent two days on the GPU side with no result. When the machine reached us, the first thing the engineer did was read the BMC (Baseboard Management Controller) system event log:

```bash
ipmitool sel list | grep -i "memory\|ecc"
```

The output contained:

```text
Memory ECC Alert: Uncorrectable ECC error detected
Location: P1-DIMMC1
```

`P1-DIMMC1` is a DDR DIMM on the mainboard, nothing to do with GPU memory. Replacing that DIMM cleared the error.

The same words — "ECC error" — on GPU memory and on a server DIMM mean different tools, different handling and different severity. The first step with any ECC alarm is to establish where it comes from.

## 1 · Underlying technology: DRAM

### What DRAM is

All three kinds of memory discussed here — DDR on the mainboard, GDDR on a GPU card, and HBM in a data-centre GPU — are built on **DRAM** (Dynamic Random Access Memory).

A DRAM cell is simple: one tiny capacitor and one transistor. Charged means 1, discharged means 0. "Dynamic" means the capacitor leaks even when nothing is wrong, so the charge has to be refreshed on a cycle — typically every few tens of milliseconds, shorter at high temperature.

### What a bit flip is

Once you understand how DRAM stores data, a **bit flip** is easy: a bit that should be 1 reads 0, or the reverse. Common causes:

**Hardware ageing.** As cells age or defects develop, retention time can shorten and data is lost before the refresh. This is a common hardware cause of steadily rising ECC counts.

**High-energy particles.** Particles depositing charge inside the semiconductor can disturb a cell. These flips tend to be random — the same location will not necessarily fail again after a reset. If the *same* location keeps failing, suspect degradation rather than a particle. Atmospheric neutrons and alpha particles from packaging materials are known mechanisms for soft errors, though a single event in production is rarely attributable to a specific particle from logs alone.

**High temperature.** Heat accelerates leakage, so charge that would hold at normal temperature is lost early. This is thermal degradation, and it is a physical cause of rising ECC. We once handled a batch of cards with steadily rising ECC: the coolers were making poor contact. Repasting and re-torquing to spec brought the temperature down and the ECC stopped.

**Power fluctuation.** Unstable voltage disturbs charging and discharging, and some cells can change state unexpectedly.

**Bit flips in the storage cell are one important source of DRAM ECC errors. ECC events can also be triggered by data paths, controllers, package interconnect, power transients and signal integrity.**

## 2 · Three product forms: DDR, GDDR, HBM

DRAM is the cell technology. DDR, GDDR and HBM are three different products built from it.

### DDR: server system memory

**DDR (Double Data Rate)** is the memory stick on the mainboard — a long PCB in a DIMM slot. Multiple DRAM devices are organised by rank and channel to provide data width and ECC bits. DDR serves the CPU: the OS, data loading and programs all live there. DDR5 is current.

**Diagnosis and repair:** locate the slot through `ipmitool` and EDAC/MCE logs, then replace the DIMM. Distinguishing a bad DIMM from a bad CPU memory controller is covered in the server-host topic.

### GDDR: planar GPU memory

**GDDR (Graphics DDR)** evolved from DDR for GPU bandwidth. Discrete DRAM packages are soldered flat on the card's PCB. RTX 4090, RTX 5090, A6000, A40 and L40 all use GDDR — currently GDDR6, GDDR6X and GDDR7.

**Diagnosis and repair:** memory test tools and address mapping can localise the failing region, then a BGA rework station replaces the package — far cheaper than a new card. Tools and methods are covered in the consumer GPU topic.

### HBM: stacked GPU memory

**HBM (High Bandwidth Memory)** also uses DRAM cells, but takes a wide-interface, stacked, advanced-packaging route instead of DIMMs or planar packages. DRAM dies are stacked vertically — eight layers in H100/H200 HBM3/HBM3e — connected through thousands of micron-scale TSVs, and the stack sits with the GPU die on a silicon interposer in one package.

Three advantages explain why data-centre GPUs use it:

**Far more bandwidth than GDDR.** HBM3e reaches about 4.8 TB/s on H200, against roughly 1 TB/s for GDDR6X on a 4090 — nearly five times. For large-model training and inference, memory bandwidth is one of the main limits on GPU utilisation.

**Physically very close to the die.** HBM and the GPU share an interposer, so the signal path is millimetres long instead of centimetres of PCB. Lower latency, lower loss, and with the TSV density, that is what makes terabyte-per-second bandwidth possible.

**Less energy per bit.** A very wide interface at a lower per-pin rate over a short distance delivers high aggregate bandwidth at lower energy per bit.

**Diagnosis and repair:** a failing DRAM die, TSV or microbump inside the stack cannot be replaced layer by layer. In high-value cases, if the GPU+HBM package is intact and only the PCB is damaged, transplanting the whole package may be evaluated — high risk, high cost. Covered in the GPU core and package topic.

### Memory configuration of current GPUs

![](/news/gpu-series-02/img-02.png)

(Official SXM figures for each model.)

### DDR, GDDR, HBM compared

![](/news/gpu-series-02/img-03.png)

(Bandwidth figures are aggregate values for specific products or interface configurations, not for all DDR, GDDR or HBM parts.)

## 3 · Observable signals and diagnostic directions for GPU memory

Operations engineers see signals, so the list below is organised by signal. Each has four parts: what you see, possible sources, where to look, and the limit of the signal.

### Signal 1 · ECC CE/UE

**What you see:** `nvidia-smi` reports rising DRAM correctable or uncorrectable counts.

**Possible sources:** cell degradation, memory power faults, data path or package interconnect faults. A CE may be a transient soft error or a repeatable hard error.

**Where to look:**

```bash
# Detailed ECC, separating DRAM and SRAM
nvidia-smi -q -d ECC

# Ampere and later: check row remapping as well
nvidia-smi -q -d ROW_REMAPPER
```

Notes: field support varies by architecture and driver; N/A means unsupported or unavailable, not zero errors; volatile counters can clear when the driver reloads, so record sample time and driver load time to build a delta baseline; always separate DRAM from SRAM errors, because they mean different things.

**Limit of the signal:** ECC reports a data-integrity event, not proof that a DRAM cell has aged. A UE means the error exceeded correction, not that permanent damage has occurred. The full decision framework — when to observe, act or replace — is covered in the ECC topic.

### Signal 2 · Benchmarks clearly low

**What you see:** the GPU enumerates and works, but throughput is clearly below a healthy card of the same model and configuration.

Performance can be limited at three different levels: host-to-GPU PCIe transfer, GPU-to-GPU interconnect, and local memory access. Their root causes are different.

**Possible sources:** PCIe link down-shifted in speed or width, NUMA effects, GPU/memory throttling (thermal or power), memory channel or data path faults, driver/CUDA version differences, inconsistent test conditions.

**Where to look:**

```bash
# PCIe link state (list each NVIDIA device's PCI address first, then check each)
# LnkCap is the capability, LnkSta the negotiated state — compare Speed and Width
# Idle links may down-shift for power; re-check under load
lspci -Dnn -d 10de:
lspci -s 0000:65:00.0 -vvv | grep -E "LnkCap|LnkSta"

# Clocks, temperature, power and throttle reasons
nvidia-smi --query-gpu=index,clocks.current.graphics,clocks.current.memory,temperature.gpu,power.draw,clocks_throttle_reasons.active --format=csv
```

Always compare against a healthy card of the same model, driver, power mode and temperature — never against the marketing peak. The three levels need different tools and directions; report the path, direction, size and conditions with any result.

**Limit of the signal:** rule out PCIe, clocks, temperature, power and software before suspecting memory channels or data paths.

### Signal 3 · Artifacts and rendering errors on consumer GPUs

**What you see:** horizontal bands, colour blocks, texture errors or random pixels. Consumer cards (RTX 4090/5090) usually expose no system-level ECC telemetry, so memory errors corrupt the framebuffer directly.

**Possible sources:** bit flips with no ECC protection, GPU core faults, display link problems, drivers, unstable power.

**Where to look:** a useful split — compare a screenshot file with what the physical screen shows. If the file is also corrupted, look at GPU/memory/driver; if the file is clean but the screen is not, look at the display link, cable or monitor. This narrows the field but does not prove the layer. After excluding software, reproduce under stress.

**Limit of the signal:** artifacts have many causes; do not jump to "bad memory package".

### Signal 4 · Wrong memory capacity

**What you see:** `nvidia-smi` reports a different total than a healthy card of the same model.

**Possible sources:** ECC state differences, driver-reserved memory, different query targets (physical GPU vs MIG instance vs vGPU), firmware state, memory controller or interconnect initialisation faults.

**Where to look:**

```bash
# Total memory per GPU, compared with a healthy card
nvidia-smi --query-gpu=index,name,memory.total --format=csv

# ECC state (keep the full output; do not grep a single line on a multi-GPU box)
nvidia-smi -q -d ECC
```

Exclude ECC mode, query target and driver differences before going to hardware.

**Limit of the signal:** a capacity difference may be configuration or reporting, not a failed package.

### Signal 5 · Intermittent crashes (works cold, fails hot, recovers on reboot)

**What you see:** the GPU works after a cold start, then raises Xid, crashes jobs or drops off the bus after a while; a reboot helps temporarily.

**Possible sources:** temperature-related contact faults in the package or solder joints, power instability under load, insufficient cooling, VRM drift, PCIe instability. Depending on the affected signal nets, ECC, link errors or capacity anomalies may accompany it.

**Where to look:**

```bash
# Continuous sampling of temperature, power, clocks, throttle
nvidia-smi --query-gpu=timestamp,index,temperature.gpu,power.draw,clocks.current.graphics,clocks_throttle_reasons.active --format=csv -l 5

# Xid log (NVIDIA recommends searching for NVRM: Xid)
journalctl -k | grep -F 'NVRM: Xid'
```

Correlate the failure with temperature, load and run time, aligning samples around the event. Do not rule out a thermal cause just because the core temperature looks normal.

**Limit of the signal:** "works cold, fails hot" points at temperature, load or accumulated run time, but whether it is BGA, power, cooling or something else needs controlled tests and physical inspection. Xid is a starting point, not proof of hardware damage.

**ECC is an important and direct data-integrity signal on data-centre GPUs, but performance loss, artifacts, capacity changes and intermittent crashes can also point at memory. No ECC does not mean no memory problem. This section maps signals to directions; a single signal cannot identify the failed component.**

## 4 · Signals and directions for system memory

### Signal 1 · Memory ECC CE/UE (reported by BMC, firmware or OS)

**What you see:** BMC SEL, OS EDAC/MCE or vendor tools report corrected or uncorrected memory errors.

**Possible sources:** DIMM cell degradation, CPU memory controller (IMC) faults — the cause is in the CPU but the symptom is memory ECC — or mainboard channel trace damage and poor contact.

**Where to look:**

```bash
# BMC system event log
ipmitool sel list | grep -Ei "memory|ecc|dimm|caterr"

# OS side EDAC/MCE (tool depends on distro and CPU platform)
journalctl -k | grep -Ei "edac|mce|memory error|corrected|uncorrected"
```

No BMC SEL entry does not mean no memory events — cross-check the OS side. To attribute the cause, follow the vendor's DIMM population rules in a maintenance window and swap with a known-good part or across channels to see whether the fault follows the DIMM.

**Limit of the signal:** the fault following the DIMM is strong evidence but not absolute — reseating changes contact, and lockstep or mirrored configurations may not localise a single DIMM.

### Signal 2 · Machine down and unrecoverable hardware error records

**What you see:** the server powers off or reboots. The BMC log may show CATERR (on Intel platforms), Machine Check or another platform-specific fatal event.

**Possible sources:** a memory UE the system could not isolate, a CPU fault, or an unrecoverable interconnect or PCIe error. CATERR is not memory-specific; only when the logs point at a memory controller, channel or DIMM does it enter the memory branch.

**Where to look:**

```bash
# After a crash, check BMC SEL first — the BMC runs independently of the host OS
ipmitool sel list | grep -Ei "caterr|memory|machine check|fatal"

# Kernel log from the previous boot (requires a persistent journal)
journalctl -k -b -1 | grep -Ei "mce|hardware error|fatal|edac"
```

**Limit of the signal:** a crash can come from memory, CPU, interconnect or power; BMC and OS logs must agree before attributing it to memory.

### Signal 3 · DIMM not detected or capacity wrong

**What you see:** the system reports less memory than expected, or a slot appears empty.

**Possible sources:** poor contact (oxidised fingers, relaxed slot springs), a damaged SPD chip, DIMMs installed out of the platform's required order, unsupported mixing of types or capacities, BIOS/firmware issues, memory training failure, CPU socket contact problems, mainboard channel faults. Intermittent contact can also produce ECC or training failures.

**Where to look:**

```bash
# DIMM information the firmware exposes through SMBIOS
dmidecode --type 17

# Memory available to the OS
free -h
```

Compare what firmware sees against what the OS can use. If the problem occurs during POST, check BIOS/UEFI, BMC boot logs and vendor tools for Memory Training or DIMM Disabled records. Before reseating, power off, discharge standby, apply ESD protection, record the original slot and follow the vendor's population rules. In-warranty machines go through the vendor first.

**Limit of the signal:** installation order, mixing, contact and configuration are common causes; a missing DIMM does not prove a bad DIMM.

**System memory faults can come from the DIMM, the IMC, the CPU socket, the board channel or platform configuration. ECC, crashes and capacity anomalies are entry points, not verdicts.**

## 5 · ECC: the correction mechanism across both memory types

### What ECC is

ECC (Error Correcting Code) is a data self-check built into hardware. On every write, the hardware computes and stores check bits; on every read, it verifies them. Small errors are corrected automatically; errors beyond its capability are reported as uncorrectable.

The former is a **CE** (Correctable Error), the latter a **UE** (Uncorrectable Error).

Capability depends on the code, the protection granule and the implementation. In the simplest SEC-DED scheme, one bad bit in a protected word is corrected (CE), two are detected but not corrected (UE). Single-bit errors in different words are each corrected — still CEs. Real GPU and server schemes are stronger than SEC-DED and can correct more bits.

### What CE and UE mean

**A CE is a warning.** When ECC corrects the data before use, the result is still correct. A single CE may be a soft error; a rising trend means the hardware is degrading. **The trend matters more than the number.**

**A UE is an emergency.** ECC found an error it could not correct, and the data is not trustworthy. Impact depends on isolation: if the error is contained, the system may kill only the affected job and retire the page while other work continues; if uncontained, it may require a GPU reset, a node reboot or a system crash.

GPU memory UEs may be accompanied by Xid 48 or Xid 140; Xid 63 indicates a remap event, Xid 64 a remap failure. In practice, read the Recovery Action and whether the error was contained. On some Intel platforms, an uncontained DIMM UE raises CATERR and takes every GPU in the machine down.

### Volatile and aggregate

`nvidia-smi` reports two kinds of counter:

**Volatile** — errors since the last load of the GPU driver (`nvidia.ko`). It is not always the same as the current boot: without Persistence Mode, the driver can unload when applications finish, so volatile clears more often.

**Aggregate** — a persistent lifetime count. On Ampere and later it cannot be cleared; that is by design.

**Volatile shows the health of the current cycle; aggregate shows accumulated degradation.** Together: rising volatile means errors are being produced now, while a large aggregate means the card has seen a lot of history.

### Different tools for the two memory types

**GPU memory ECC:** data-centre GPUs (H100/H200/A100/B200/B300) normally support and enable ECC; some professional cards (A6000, L40) do too; consumer cards (RTX 4090/5090) usually expose no system-level ECC telemetry. Check `ECC Mode Current` in `nvidia-smi` rather than assuming.

A note: some modern GDDR devices have on-die ECC, but that is a different layer from the end-to-end ECC and telemetry the GPU controller provides. On-die ECC improves yield and reliability of the die; it does not guarantee system-level telemetry.

```bash
# GPU memory ECC
nvidia-smi -q -d ECC

# Multi-GPU: include index for per-device handling
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv
```

**System memory (DDR) ECC:** server platforms normally support and enable it, depending on CPU, board, DIMM type and BIOS.

```bash
ipmitool sel list | grep -i "memory\|ecc\|dimm"
```

The first step with any ECC alarm is to decide whether it comes from GPU memory (`nvidia-smi`) or DDR (BMC SEL, EDAC/MCE, vendor tools). Get that wrong and everything after it is in the wrong direction.

## 6 · (Further reading) Row remapping: how GPU memory repairs itself

### Rows and banks

DRAM cells are arranged in a two-dimensional array of **rows** and **columns**, like a very large spreadsheet. Several arrays form a **bank**, and a DRAM device contains several banks. A read selects a row in a bank, then reads the required columns.

When cells in one row keep failing, that row becomes a hot spot.

### The mechanism

From Ampere (A100) onward, NVIDIA added hardware row remapping. When a row keeps producing errors, the GPU maps it to a spare row, and later accesses to that logical row go to the spare. It isolates the fault; it does not recover data that was already lost. It is transparent to software.

Each bank has its own spare rows. Check the state with:

```bash
nvidia-smi -q -d ROW_REMAPPER
```

Fields to read:

- **Correctable Error** — remaps triggered by CE. A preventive measure: rows that keep failing are moved early.
- **Uncorrectable Error** — remaps triggered by UE, meaning an uncorrectable error has already occurred.
- **Pending** — a remap waiting for a GPU reset; if Yes, schedule a window.
- **Remapping Failure** — whether a remap has ever failed. Yes is a serious signal; read it together with Bank Remap Availability.
- **Bank Remap Availability** — remaining spares per bank, in five bands: Max, High, Partial, Low, None. Low or None means that bank's spares are nearly or fully exhausted. This is the key field for judging whether spares remain.

Per NVIDIA, CE-triggered remaps do not consume Bank Remap Availability, because a CE remap can be replaced by a UE remap when necessary (UE takes priority). A large CE remap count therefore does not by itself mean the spares are nearly gone. What matters is the UE remap count, the Remapping Failure flag and the actual availability state.

### Channel Repair on newer platforms

On supported newer platforms and drivers, the management interface may also show Channel Repair Pending, reflecting channel-level repair actions. Row remapping isolates a single row; Channel Repair covers a wider channel fault. Support, triggers and handling follow the platform documentation.

## 7 · Case: reading memory health from ECC data

We inspected an A100 SXM4 (case J-1285). All rails were correct at power-on and the driver loaded normally.

```text
nvidia-smi -q -d ECC
```

Output:

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

The key part:

```text
Aggregate:
DRAM Correctable: 134670
DRAM Uncorrectable: 4

Remapped Rows:
Correctable Error: 124
Uncorrectable Error: 1
```

Three layers of signal:

**One: aggregate DRAM correctable 134,670.** A very large lifetime CE count — this card has accumulated a lot. Volatile was 0 because the driver had just loaded; that only means nothing had been recorded since the load, so the card was sampled again after running for a while.

**Two: aggregate DRAM uncorrectable 4.** Four UEs. Correction was overwhelmed; some regions are bad enough to be uncorrectable.

**Three: remapped rows 124 / 1.** 124 rows remapped for CE, one for UE. CE remaps do not consume availability, so 124 alone does not mean the spares are nearly gone — but one UE remap together with four historical UEs means degradation has exceeded what ECC can correct.

**Is it still producing errors?** After a few hours of normal operation, volatile DRAM correctable climbed from 0 to several hundred, confirming ongoing, live errors.

With a large aggregate, UE present, remapping already triggered (including one UE remap) and volatile still rising, the conclusion was: not economically or technically worth repairing.

How CE, UE and remapping translate into operating decisions — observe, act or replace — is covered in the ECC topic.

## 8 · O&M view: identifying the source and basic checks

This is the knowledge-base part. The full decision framework and inspection SOP are in the ECC topic (parts 5–7). Here is the minimum needed to point the investigation in the right direction.

### Quick source check

```bash
# Step 1: GPU memory ECC
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv

# Step 2: system memory ECC
ipmitool sel list | grep -i "memory\|ecc\|dimm"
```

GPU memory rising → go to the GPU ECC path. System memory ECC → do follow-the-part testing (in a maintenance window, following vendor population rules; never move DIMMs across channels arbitrarily). Neither → it may not be ECC at all; look at Xid, PCIe, power.

No BMC SEL entry does not mean no memory events — check EDAC, MCE or rasdaemon on the OS side:

```bash
journalctl -k | grep -Ei "edac|mce|memory error|corrected|uncorrected"
```

### Basic inspection commands

```bash
# ========== routine ECC checks ==========

# GPU memory ECC delta (include index on multi-GPU machines)
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv

# Full GPU memory ECC detail
nvidia-smi -q -d ECC

# Ampere and later (A100/H100/H200/B200/B300): row remapper state
nvidia-smi -q -d ROW_REMAPPER

# Row remapper as CSV, for scripts
nvidia-smi --query-remapped-rows=gpu_name,remapped_rows.correctable,remapped_rows.uncorrectable,remapped_rows.pending,remapped_rows.failure --format=csv

# System memory ECC events
ipmitool sel list | grep -i "memory\|ecc\|dimm\|caterr"
```

### Severity triage (internal guidance)

(Internal operating policy; the Recovery Action and platform policy take precedence.)

![](/news/gpu-series-02/img-05.png)

### Operations vs repair

![](/news/gpu-series-02/img-06.png)

## Summary

**DRAM is the underlying technology.** DDR, GDDR and HBM are all DRAM. Bit flips are a common physical source of ECC errors, but ECC events can also come from data paths, controllers, package interconnect and power.

**DDR serves the CPU; GDDR and HBM serve the GPU.** Different signals, different repair methods, different tools, different cost.

**Memory faults are not only ECC.** Channel and data-path faults, solder issues, artifacts and power problems may never raise an ECC. Consumer cards usually expose no ECC telemetry, so faults surface as artifacts, Xid, driver resets or application crashes.

**ECC lives in two places.** GPU memory (HBM/GDDR) and system memory (DDR): different tools, different handling. First establish where it comes from.

**CE is a warning, UE is an emergency, row remapping is self-repair.** Together they describe memory health. Judge spares by Bank Remap Availability and UE signals — CE remap count is not resource consumption.

Shanghai COREFIX PRO Information Technology Co., Ltd.

Third-party GPU server repair, maintenance and O&M
