---
slug: "gpu-troubleshooting"
title: "GPU server troubleshooting: from error codes to acceptance testing"
date: "2026-05-06"
category: "guide"
source: "https://mp.weixin.qq.com/s/W_me_jgEVl7V-2FiCc6NEQ"
excerpt: "A working playbook for GPU server faults: classification, log reading, layered diagnosis, repair and the acceptance test that decides whether a unit is handed back."
translated: true
---
![](/news/gpu-troubleshooting/img-01.jpg)

GPU servers are core assets in AI clusters and data centres. Compared with ordinary servers, high-end H- and B-series machines are denser, hotter and far more tightly integrated.

Most in-house teams are comfortable with reboots, driver reinstalls and reading utilisation. What stops them is the hard category: **random shutdowns, quiet loss of compute, cards that disappear intermittently, NCCL errors, ECC reports**. Without a method, the machine stays half-healthy, the business keeps stalling and compute quietly leaks away.

This guide condenses **2,000+ server repairs and maintenance engagements** into one reference: fault classification, error decoding, a standard diagnosis sequence, the hard parts of H/B-series repair, acceptance criteria and day-to-day pitfalls. It is written for O&M engineers, machine-room managers and compute project owners.

## 01 · Five fault families

Almost every GPU hardware problem falls into one of five groups.

### 1 · Power-on faults

The visible layer, and the easiest to check:

- No response at power-on, no card LED, the unit will not start.
- Repeated restarts, intermittent power loss, more frequent crashes under load.
- Red hardware LEDs, beep codes, board logs reporting a hardware fault.

### 2 · Detection faults

The machine boots but the GPU cannot be used — a common hidden failure:

- `lspci` does not list the GPU; `nvidia-smi` sees no device.
- A single card works, but in a multi-card system one card drops out.
- Fans spin and the card is warm, yet the system cannot enumerate it.
- GPU passthrough fails in VMs or containers; PCIe link training is abnormal.

### 3 · Performance faults

**The most overlooked and the most expensive**, because nothing reports an error:

- Benchmark scores below spec for FP32/FP64.
- Training or inference stutters; throughput steadily declines.
- Clocks drop under sustained load; power draw fluctuates.
- NCCL errors across cards, inter-card bandwidth below expectation.

### 4 · Runtime faults

The biggest pain point in a production cluster:

- Processes exit immediately with CUDA errors.
- The server hangs, the screen goes black, the kernel panics and reboots.
- Frequent ECC reports; memory reads and writes fail.
- Driver crashes and kernel errors make the service unreliable.

![](/news/gpu-troubleshooting/img-02.png)

### 5 · Physical damage

Caused by age, environment or sustained overload:

- Fan noise, stalled fans, abnormal speeds leading to overheating.
- Deformed cooling modules, dried thermal paste, degraded heat transfer.
- Oxidised, scorched or scratched gold fingers causing link faults.
- Burned PCB, destroyed MOSFETs, capacitors and inductors, cracked solder joints under the GPU or memory.

## 02 · The five-layer diagnosis sequence

Every unit we take in follows the same order, so nothing is missed and nothing is guessed.

### Layer 1 · Visual inspection

Look first, disassemble later. Check gold fingers for oxidation and burns, the PCB for discolouration or cracks, power components for bulging or splitting; check the cooling module, fans and screws; look for liquid damage, dust build-up and impact marks.

### Layer 2 · Cross-checks on the platform

Separate **board, cabling, environment and card**. Move the card to another PCIe slot, use an independent power cable, test it in a second machine; reset BIOS, clear CMOS, disable power-saving modes — remove the platform as a variable before blaming the card.

### Layer 3 · Software and log analysis

Use the software to localise the fault: read `dmesg`, decode Xid codes, check `nvidia-smi` fault history, move to a known-stable driver, and rule out kernel module conflicts, topology misconfiguration and multi-card compatibility issues.

### Layer 4 · Board-level electrical checks

Measure the rails — 12V, 3.3V, core and memory supplies; check the oscillator for a clean clock; verify PCIe link width and speed for downgrades; then use targeted stress tests to separate GPU core failures from memory failures.

### Layer 5 · Repair and acceptance

Repair the specific point: clean and refinish gold fingers, replace damaged power components, repair or replace memory modules, reball the GPU core; renew thermal paste and correct cooler contact. Then run a **2–4 hour full-load burn-in** before the unit is considered fixed.

## 03 · Decoding the common Xid codes

Xid is the primary evidence in GPU repair, and each code points at a range of faults. One caveat: **the same Xid can still have several root causes** — the code is an entry point, not a verdict.

- **Xid 16** — memory errors: failed or cold-soldered modules, bad blocks.
- **Xid 31** — PCIe link errors: gold fingers, slot, board traces.
- **Xid 43** — GPU stopped processing: driver crash, unstable power or a card in poor health; read it together with the logs.
- **Xid 48** — uncorrectable ECC (UE): correction was overwhelmed.
- **Xid 63** — row remapping event: a failing row has been isolated; a preventive action, not proof that the spares are exhausted.
- **Xid 64** — remapping failure: spare rows may be exhausted; assess against the RMA criteria.
- **Xid 68** — multi-card communication: NCCL, NVLink topology or link faults.
- **Xid 79** — GPU has fallen off the bus. This is a *result*, not a cause: a memory UE, PCIe, power, a connector or the driver can all produce it, so **do not read it as a damaged die**.
- **Xid 94** — contained ECC: the uncorrectable error was isolated; usually only the affected job is killed.
- **Xid 95** — uncontained ECC: the error could not be isolated; expect a reset, a reboot or a machine down.
- **Xid 140** — firmware handling failure; check firmware and driver versions.

## 04 · The test stack behind every handover

No unit is handed back without passing all of these:

- `nvidia-smi` — status, temperature, power, memory, live errors.
- `nvidia-smi -q -d FAULTS` — full fault history.
- CUDA samples — basic compute and driver compatibility.
- `memtest86+` — dedicated memory testing for bad blocks.
- `gpu-burn` — sustained full load, stability and thermal headroom.
- `stress-ng` — system-level load that mimics a busy machine room.

## 05 · Why H- and B-series are harder

The high-end machines that dominate AI clusters are denser and less forgiving:

- High-density PCBs under constant heat are prone to BGA and memory solder fatigue.
- Multi-card NVLink topologies make communication faults hard to isolate.
- Very high power draw ages MOSFETs quickly; failures are common.
- Encrypted firmware and authentication chips mean repairs need proper recalibration.
- Machines that run flat out all year dry out thermal paste in 3–6 months, quietly costing clock speed.

## 06 · Pitfalls that cause most avoidable failures

Many failures are operational, not natural:

![](/news/gpu-troubleshooting/img-03.jpg)

- Never hot-plug a GPU — it can destroy the PCIe bus.
- Deep-clean the machine room every six months; dust is the leading cause of throttling and shutdowns.
- Do not mix cheap power cables; voltage droop causes random crashes.
- Do not chase every driver release; stay on the vendor's long-term stable version.
- Burn in every new unit for 24 hours before it takes production traffic.
- Keep card-to-slot mapping fixed in a multi-GPU cluster; swapping cards is a common source of NCCL errors.

## Closing

For a compute business, the stability of the hardware sets the cost and the capacity ceiling. Most hidden faults cannot be fixed by a reboot or a driver reinstall; they need layered hardware diagnosis, proper rework and a real acceptance test.

**Shanghai COREFIX PRO** works from eight national compute hubs with 2,000+ server repairs behind it, covering maintenance, O&M, fault repair, performance tuning and training for H- and B-series fleets.
