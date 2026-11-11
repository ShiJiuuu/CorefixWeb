---
slug: "gpu-series-01"
title: "GPU repair series #1: hardware anatomy and a troubleshooting framework"
date: "2026-06-11"
category: "tech"
source: "https://mp.weixin.qq.com/s/A9DRHLHespqV-0YxXeVzkQ"
excerpt: "Part one of the series: the subsystems inside an 8-GPU server, how each of them fails, how a fault travels between them, and how to think before touching hardware."
translated: true
---
The preface set out the logic of compute asset management. Part 1 answers four questions: what subsystems a GPU server is made of, how each one fails, how faults travel between them, and how to think when any alarm arrives.

This part is the map. Every later part zooms into one region of it. Concepts such as ECC, row remapping, power sequencing and NVLink topology get their own parts; here they are only sketched, to build the frame.

## Start with three alarms

You run a batch of GPU servers. This morning three alarms arrive: an ECC error, Xid 79, and a GPU above 83°C.

Which is most urgent? Which can wait? Which may not be the GPU at all?

The ECC error could be a one-off soft error — a cosmic ray flipping a bit, gone after a reset — or an early sign of memory degradation. Xid 79 usually means the GPU is unreachable on the bus; the cause could be a poor contact, a power transient, a PCIe link fault or a damaged GPU. 83°C is normal in some workloads, but with throttling it suggests the cooling system has degraded.

Three alarms, three very different severities, at least five subsystems involved. Without a model, you lose days in the wrong place.

This part builds that model.

## 1 · Nine hardware subsystems

A GPU server divides into nine subsystems. Each has its own principle, failure modes and diagnostic method. Clear categories make precise diagnosis possible.

### ① GPU core and package

**Function and structure.** The die is the compute engine. On data-centre cards (H100/H200/B200/B300), the die and HBM are packaged together on a silicon interposer using CoWoS and connected to the GPU PCB through thousands of BGA balls.

**Typical failures.** Micro-cracks in BGA joints from thermal cycling — the card looks fine but produces no compute; SRAM degradation inside the die; package-level stress causing interposer warpage or connection loss.

**Log signals.** `nvidia-smi` looks normal but stress tests fail; Xid errors (Xid 79 for a dropped card, Xid 140 for firmware handling failures); DCGM diagnostics failing. Many die and package faults look perfectly healthy at idle and only appear under full load.

**Tools.** `nvidia-smi`, DCGM (`dcgmi diag -r 3`), GPU Burn, DGX Field Diagnostic. At board level: X-ray for solder voids, a multimeter for rail resistance.

### ② Memory (HBM and GDDR)

**Function and structure.** High-speed storage for weights, intermediate results and KV cache. Data-centre cards use HBM (DRAM stacked vertically and connected through TSVs); consumer and some professional cards (4090/A6000/L40) use GDDR — discrete packages soldered flat on the board.

**Typical failures.** Capacitor ageing in DRAM cells causing bit flips — the physical origin of ECC; TSV micro-cracks breaking data lanes (HBM-specific); cold solder joints that work cold and fail hot (GDDR-specific). Stacked HBM struggles to dissipate heat from inner layers, and heat accelerates degradation. Modern GPUs (Ampere, Hopper, Blackwell) add hardware row remapping to isolate bad regions, but spare rows are finite — the trend matters more than a single number.

**Log signals.** Rising corrected (CE) counts, any uncorrected (UE) error, remapped rows increasing, bandwidth far below spec. Consumer cards do not expose system-level ECC telemetry by default; they fail as artefacts or crashes with no warning.

**Tools.** `nvidia-smi` (ECC, remapped rows), DCGM memory bandwidth tests, CUDA BandwidthTest.

### ③ Power delivery

**Function and structure.** Power runs through several stages: PSU → board distribution → module-level conversion → on-package rails. The SXM5 module in H100/H200 takes multiple inputs: main rails for the die and HBM, auxiliary rails for the power-management IC, PWM controller and reference clocks.

**Typical failures.** Three basic shapes: a short (component punch-through, cleared by eFuse), an open circuit (no output or a broken path), and an enable-chain fault (the part is fine but the logic that turns power on fails — a driver transistor gone, a Power Good signal never asserted). The failed part may cost pennies; the effect can be a missing card, a machine that will not boot, or a cluster that loses its fabric.

**Log signals.** Usually none directly. What you see is the consequence — a dropped GPU, a no-boot, a crash under load, or HW Slowdown / Power Brake that is not thermal.

**Tools.** Operations: `ipmitool` (voltage sensors, power events), `nvidia-smi` (power trend, throttle reasons). Board level: multimeter across each rail, oscilloscope on transients under load.

### ④ Cooling

**Function and structure.** Thermal load is far beyond a normal server: one H200 is 700 W TDP, so eight GPUs alone are 5.6 kW. The system includes heatsinks or cold plates, thermal interface material, fan modules, coolant lines and manifolds. Contact quality between cooler and die decides how well heat leaves.

**Typical failures.** Thermal paste dries and cracks; uneven mounting torque leaves poor contact; fan bearings wear and speed drops; coolant lines clog or leak; too much paste dries into an insulator. Cooling degradation is upstream of many other faults — sustained heat accelerates memory degradation (ECC), solder fatigue and power-component ageing.

**Log signals.** Rising temperatures; a widening gap between `temperature.gpu` and `temperature.memory` (inner HBM layers starved of cooling); `sw_thermal_slowdown`; ECC counts that rise with temperature.

**Tools.** `nvidia-smi` (temperature, throttle reasons), DCGM thermal violations, `ipmitool` (fan speed, inlet temperature). Board level: thermal camera, teardown to inspect contact and interface material.

### ⑤ NVLink and multi-GPU interconnect

**Function and structure.** Large-model training depends on fast card-to-card exchange. On HGX, eight GPUs connect through NVLink to NVSwitch chips in a full fabric, so any pair can talk at hundreds of GB/s. Physically the links run through high-density traces and connectors on the baseboard.

**Typical failures.** Signal integrity degrading (connector oxidation, trace micro-cracks); NVSwitch power faults; one bad GPU taking down the whole fabric — Fabric Manager may lock the node when it sees an incomplete topology.

**Log signals.** NVLink error counters (`nvidia-smi nvlink -s/-e`), NCCL timeouts or AllReduce throughput collapse, SXid errors, topology errors in Fabric Manager logs.

**Tools.** `nvidia-smi nvlink`, nccl-tests, nvbandwidth, Fabric Manager logs.

### ⑥ PCIe bus and connectors

**Function and structure.** GPUs attach to the CPU or a PCIe switch. Add-in cards use gold fingers in a slot; SXM modules use high-density mezzanine connectors on the baseboard. In SXM systems the GPU sits far from the CPU, so Retimers maintain Gen5 signal integrity.

**Typical failures.** Oxidised or contaminated gold fingers; SXM connector contact damage; a Retimer overheating or running bad firmware, dropping the link to x8/x4 or losing the card; a failed PCIe switch; configuration space reads returning `revision id ff`.

**Log signals.** The device vanishing from `lspci` or showing `revision id ff`; `nvidia-smi` reporting no devices; PCIe AER errors; link width below capability. If `lspci` sees the card but `nvidia-smi` does not, the physical link trained but the GPU failed to initialise — look at firmware, driver or internal power.

**Tools.** `lspci` (presence, width, speed), `dmesg` (AER), `nvidia-smi`. Follow-the-part testing: move the card and see whether the fault moves with it or with the slot.

### ⑦ SXM baseboard

**Function and structure.** The skeleton of an HGX system: eight module sockets, the NVSwitch complex, Retimer array, power distribution and high-speed traces. It is an expensive asset in its own right — tens of thousands of dollars. A 54 V rail feeds the GPU modules; 12 V feeds NVSwitch and management logic.

**Typical failures.** Power components on the board failing (capacitors, power-management ICs) so NVSwitch loses its rail; bent SXM connector pins; micro-cracks in high-speed traces; a board-level short shutting the system down protectively.

**Log signals.** Several GPUs disappearing at once; NVSwitch SXid errors; abnormal readings around the board's power area; Fabric Manager reporting an incomplete topology.

**Tools.** Operations: `lspci` (pattern of simultaneous loss), Fabric Manager logs, `ipmitool`. Board level: rail-by-rail measurement, connector inspection, component replacement.

### ⑧ High-speed network

**Function and structure.** Cross-node communication runs over NICs and switches — today mainly ConnectX-6/7, with newer platforms moving to integrated CX-8. NICs attach via PCIe and connect out through optics and fibre or copper. NCCL spreads gradient traffic across these links; any jitter can time out a whole cluster.

**Typical failures.** NIC hardware faults (not detected, down-shifted, `revision id ff`); ageing or stressed optics losing power; bent or contaminated fibre; firmware incompatibility; PCIe issues behind the NIC; thermal down-shifting.

**Log signals.** NIC missing in `lspci`; `ibstat`/`ethtool` showing a lower speed; NCCL timeouts; checksum errors; rising switch port counters.

**Tools.** `lspci`, `ibstat`/`ethtool`, `iperf3`/`perftest`, switch counters. Follow-the-part testing across NIC, port and optic.

### ⑨ Server host

**Function and structure.** The chassis underneath: CPU, DDR, mainboard, BMC, BIOS/firmware. The CPU loads data and coordinates communication, DDR holds the OS and schedulers, the BMC provides out-of-band management, BIOS controls power-on sequencing. Any of them can take the GPUs away.

**Typical failures.** DDR UECC raising a CATERR and dropping the machine; a degrading CPU memory controller causing repeated channel errors; a BMC or its firmware failing and losing remote management; corrupted BIOS preventing boot; CPU performance degradation leaving GPUs waiting (all green in `nvidia-smi`, throughput far down).

**Log signals.** Memory ECC/CATERR/BMC events in `ipmitool sel list`; EDAC errors in `dmesg`; IPMI or web console unreachable; repeated reboots or no-boot. On HGX/SXM, a PCIe error on the GPU baseboard can also raise a fatal interrupt to the CPU and trigger CATERR.

**Tools.** `ipmitool` (sel/sdr), `dmesg` (EDAC/MCE/AER), memtest86, Linpack.

We organise the common faults into **9 categories and 38 sub-categories**, covering GPU core, memory, power, interconnect, cooling, firmware, cluster network, server host, and ECC/CUDA errors.

## 2 · Faults travel between subsystems

The nine subsystems are conceptually separate and physically coupled. Understanding these paths is what stops you looking in the wrong place.

**Power → almost everything.** A single bad rail can drop a GPU, disconnect NVSwitch, hide a NIC and take down the BMC — four subsystem alarms in the log, one root cause.

**Cooling → memory → ECC.** Poor cooling raises HBM temperature, accelerates DRAM leakage and shows up as rising ECC. Blame the memory and you may be wrong: cool it down, and the ECC stops.

**One GPU → NVLink fabric → whole node.** A single failed GPU can make Fabric Manager see an incomplete topology and lock the node — eight cards look broken, one is.

**CPU/memory → GPU availability.** A UECC CATERR takes the whole machine down, GPUs included. A degrading CPU leaves GPUs waiting: green dashboard, falling throughput.

**PCIe → GPU and NIC.** When a GPU and a NIC behind the same switch fail together, check the shared PCIe path or the Retimer before either device.

When a signal appears, ask which subsystems could produce it rather than reading it literally.

## 3 · Operations, maintenance, repair: boundaries and collaboration

Three capabilities cover the lifecycle.

**Operations** is daily management: monitoring, alarm response, standard actions (reboot, configuration, scheduling), signal capture and first-pass attribution. The core skill is recognising what a signal means and when to escalate. No soldering required, but hardware literacy is.

**Maintenance** is prevention: scheduled inspection, preventive replacement (paste, fans, power components), health assessment, performance baselines. Its value is intervening in the window between healthy and failed, before the business pays.

**Repair** is restoration: board-level localisation (multimeter, scope, X-ray), component replacement (BGA rework, power ICs), verification after repair.

The boundaries differ; the understanding must be shared. Operations without repair logic cannot capture the right signals or judge escalation. Repair without operations data starts from zero. Maintenance without failure patterns cannot design a prevention plan.

**Each part of this series includes a responsibility table: what operations does, when to escalate, and what to hand over.**

## 4 · A universal diagnostic framework

Whatever the subsystem, the same five steps apply.

### Step 1 · Capture the scene

Save everything at the moment of failure. Data reconstructed later is worth less.

```bash
# GPU state snapshot
nvidia-smi -q > gpu_snapshot_$(date +%Y%m%d_%H%M%S).txt

# Full PCIe topology (do not truncate with grep; you will lose the switch or Retimer downstream)
lspci -d 10de: -vvv > nvidia_pcie_snapshot.txt

# Kernel log, filtered (do not tail blindly; the root cause may be scrolled away)
dmesg -T | grep -E -i "nvrm|nvidia|xid|aer|edac|mce" > kernel_fault.txt

# BMC out-of-band logs
ipmitool sel list > bmc_sel.txt
ipmitool sdr list > bmc_sdr.txt
```

### Step 2 · Classify the signal

Which of the nine subsystems produced it?

ECC → GPU memory (`nvidia-smi`) or system memory (`ipmitool`)? Card missing → not visible on PCIe (`lspci` empty) or failing to load (`lspci` sees it, `nvidia-smi` does not)? Job timeout → compute, NVLink or network?

Misclassify, and every later step wastes time.

### Step 3 · Eliminate, cheapest first

Software and configuration (minutes, free) → contact and seating (cheap, reseat) → follow-the-part testing (move it, see if the fault moves) → stress testing (needs a window) → board-level measurement (repair team).

Each step narrows the field. Do not suspect the GPU die because a card disappeared.

### Step 4 · Decide the boundary

When software and environment are excluded and the fault still reproduces, the cause is physical. Escalate with the full data package from step 1 so repair can skip straight to hardware.

### Step 5 · Verify the fix

Every action, on either side, ends with measurement: replaced GPU → 24 h GPU Burn + DCGM r3 + zero new ECC; replaced DIMM → Memtest and Linpack baseline; power repair → rail re-measurement + 24 h under load; cooling repair → full-load temperature back in range and ECC no longer tracking temperature.

## 5 · Ten symptoms, ten directions

The most common presentations, with where to look first.

**1 · GPU not detected at all (`lspci` empty).** Power/eFuse → PCIe switch or Retimer → SXM connector or gold fingers → GPU die.

**2 · `lspci` sees it, `nvidia-smi` does not.** GPU initialisation failure (firmware/VBIOS) → driver load → internal rail not sequenced.

**3 · Compute down more than 30%, no crash.** Thermal throttling (check throttle reason) → unstable power → ECC stealing cycles → HBM bandwidth degraded (BandwidthTest).

**4 · Training jobs crash randomly.** Intermittent memory UE → die solder fatigue (works cold, fails hot) → power transients.

**5 · Multi-GPU slow, single GPU fine.** NVLink errors → network (NIC, optic, switch) → PCIe bandwidth.

**6 · Temperatures persistently high.** Fan failure → dried paste or poor contact → coolant leak or blockage → excess paste.

**7 · ECC rising every day.** Memory degradation → insufficient cooling → power fluctuation → PCIe link → rack environment.

**8 · CATERR takes the machine down.** DIMM UECC → PCIe AER on HGX → CPU fault → power.

**9 · Several GPUs vanish together.** SXM baseboard power → Fabric Manager locking the topology → PSU.

**10 · Multiple machines alarm the same day.** Room power → temperature → load switching → batch firmware updates. Correlate across machines; one box will not explain it.

**Tool quick reference:**

GPU state `nvidia-smi -q` · PCIe `lspci -d 10de: -vvv` · kernel `dmesg -T | grep -E -i "nvrm|xid|aer|edac"` · BMC `ipmitool sel list` · NVLink `nvidia-smi nvlink -s` · network `ibstat` / `ethtool`

## Summary

A GPU server is nine subsystems: core and package, memory, power, cooling, NVLink, PCIe, SXM baseboard, high-speed network, server host. Each fails differently, and they are physically coupled — faults propagate and signals are ambiguous.

Operations, maintenance and repair have different boundaries but must share one understanding: operations captures and screens, maintenance intervenes early, repair localises and restores.

The framework is always the same: capture → classify → eliminate → decide the boundary → verify. Start with the cheapest test, narrow the field, and end with a measured confirmation.

Keep the map. When an alarm arrives, first decide which subsystem you are in — then go to that part for the specific path.

Shanghai COREFIX PRO Information Technology Co., Ltd.

Third-party GPU server repair, maintenance and O&M
