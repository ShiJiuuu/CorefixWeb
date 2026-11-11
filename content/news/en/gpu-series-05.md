---
slug: "gpu-series-05"
title: "GPU repair series #5: reading ECC logs and making the right call"
date: "2026-07-03"
category: "tech"
source: "https://mp.weixin.qq.com/s/vwAG9YjnGb_gDSpoTeAHkw"
excerpt: "Corrected errors are a warning, uncorrected errors are an emergency. How to read volatile and aggregate counters, and when to watch, stress or replace."
translated: true
---
Part 2 set out the basics — CE is a warning, UE is an emergency, and ECC appears in two different places with two different tools. Part 3 walked three HBM cases: clear and observe, replace on recurrence, keep using after a passed stress test.

This part turns those into a decision framework: when an ECC alarm arrives, you follow a path instead of guessing.

## First step: where does this ECC come from?

Not clearing. Not rebooting. Not checking drivers.

**First, determine the source.** A GPU server has two different kinds of ECC:

**GPU ECC** — mostly bit flips in HBM/GDDR cells or in on-die SRAM (L1/L2). Query it with `nvidia-smi`. **It reports SRAM and DRAM separately: DRAM errors point at memory degradation, SRAM errors point at physical damage in the die itself.** The two have completely different repair paths, and this framework focuses on DRAM ECC.

**System memory (DDR) ECC** — bit flips in the DIMMs on the mainboard, queried with `ipmitool`.

Both are called "ECC errors". Different tools, different handling, different severity. If you check `nvidia-smi`, see zero, and conclude there is no ECC problem, you have gone the wrong way — meanwhile a DIMM UECC may have raised CATERR and dropped the machine.

We once took in an H200 where the team spent two days on GPU memory. The cause was a UECC on DIMM `P1-DIMMC1` raising CATERR. One DIMM replaced, problem gone. Two days lost at step one.

### How to establish the source

```bash
# GPU memory ECC
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv

# System memory ECC
ipmitool sel list | grep -i "memory\|ecc\|dimm\|uecc"
```

Run both, and check the timestamps, device ID, GPU index and BMC SEL time against this incident. Old SEL entries or historical aggregate counts are not evidence for today's fault unless the times line up. If both sides show records matching the window, both need handling — separately.

## 1 · GPU memory ECC: four scenarios, four paths

### Scenario 1 · First CE, small count

**What you see:** a corrected error on one GPU, a modest count (tens to a couple of hundred), no UE, the server up, training running.

**How to read it:** possibly a soft error (cosmic rays, electrical noise), possibly the earliest sign of degradation. You cannot tell yet — watch the trend.

Step one, record the state (volatile and aggregate):

```bash
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.volatile.total,ecc.errors.uncorrected.aggregate.total --format=csv

# Also check row remapping (part 2 covers the mechanism and RMA criteria)
nvidia-smi -q -d REMAPPED_ROWS
# If "Remapping Failure Occurred" is Yes, go straight to RMA — stop observing
```

Step two, in a maintenance window with no jobs, reset to restart the volatile window:

```bash
nvidia-smi -r -i [GPU_INDEX]
```

`nvidia-smi -r` is a GPU reset, not an "ECC cleaner". It zeroes volatile counters so you can see whether they climb again — that is the whole point. It does not touch aggregate, which is history and must not be treated as a counter to wipe.

**Caution:** on SXM NVLink systems (H100/H200 SXM5), do not reset a single GPU while others are running — it can break the NVLink fabric and drop the neighbours. Reset the node once the machine is idle.

Step three, monitor for 24 hours, recording the volatile CE delta hourly.

**Reading the result:**

- Volatile stays at zero for 24 h → very likely a soft error; keep the daily check.
- Volatile reappears and keeps rising → degradation signal; move to scenario 2.

**Case:** J-0629 (Supermicro H200). First ECC, no recurrence after reset, observation period.

### Scenario 2 · Same device, ECC returns after reset

**What you see:** the same card raises ECC again after a reset — days or weeks later.

**How to read it:** a soft error does not keep returning on the same card. **Recurrence on the same device strongly suggests physical degradation.**

If it recurs in the same rack, environmental factors (power, cooling, EMI) cannot be fully excluded — part 6 covers the full attribution. If it recurs after the machine moved racks, the environmental explanation drops sharply and the device is the cause.

**What to do, by severity:**

- Small CE recurrence with slow growth (e.g. a few CEs 30 days later) → move to high-frequency monitoring plus GPU Burn.
- CE keeps growing, or reproduces under stress → plan a maintenance window and a replacement.
- Recurrence after a rack move / UE recurrence / accompanying Xid → replace first, do not keep observing.

**Why replace on CE recurrence?** "Correctable" only means this particular error was fixed by ECC. It does not mean the hardware is healthy.

**A rising CE count means degradation is in progress** — each one may come from cell ageing, package interconnect or thermal/electrical conditions. Row remapping isolates bad regions, but the spares are finite; when they run out, the next bit flip becomes a UE and takes the job or the card down.

So the question is not "is the CE hurting the business" but "is the trend heading for a UE". **In a production training cluster the goal is not to wait for the UE; it is to take the card out of critical service once the evidence points at the device.**

**Case:** J-0813 — the same H200 as J-0629. Reset, no recurrence. Twenty-three days later, ECC returned, by which time the server had moved racks. Recurrence across racks removes the environmental explanation; the GPU was replaced, and the stress test passed afterwards.

### Together, these two scenarios are the watershed

First reset → observe. Same device recurs after reset → stop waiting, act.

Our cluster data puts the typical recurrence cycle for memory degradation at 18–23 days. That means the safe observation window after a reset is at least 30 days — only then can the risk be downgraded to "normal monitoring".

Note what actually escalated the decision here. It was not "a CE appeared" but the combination:

- **The same GPU raised CE again after a reset.** Reset clears the window; it does not fix the cause. A second event means it was not a one-off random flip.
- **The recurrence happened after a rack move.** Power, cooling and rack environment all changed, so environment drops in priority and the device looks responsible.
- **CE is a trend, not a verdict.** Correctable today does not mean correctable forever; a region producing flips can escalate into UE, more remapping, job interruption or a dropped card.
- **The card carries high business value.** On a training cluster, waiting for the UE can mean a failed job and a lost node. In high-value production, repeated CE plus recurrence after an environment change can be enough to justify pulling the card.

### Scenario 3 · UE or Xid 79 (GPU off the bus)

**What you see:** a UE in `nvidia-smi`, or Xid 79 in the log:

```text
NVRM: Xid (PCI:0000:5D:00): 79, pid='<unknown>', name=<unknown>,
GPU has fallen off the bus.
```

The GPU is gone from PCIe and `nvidia-smi` cannot see it.

**How to read it:** a UE means ECC was overwhelmed. Xid 79 is the *result* of the GPU leaving the bus, and it can be triggered by a memory UE, a PCIe fault, a power transient, a driver bug, firmware, temperature or a connector. They often appear together but are not the same thing.

Either way it is serious — but it does not automatically mean a replacement. A driver bug, a voltage transient or a thermal event can produce a one-off UE or drop; in those cases the hardware may be fine and a new card would be wasted.

The way to tell is a stress test, read together with the Xid type, PCIe/AER logs, BMC power and temperature records, DCGM results, remapped rows and whether it recurs after a move.

Step one, record the full state and logs:

```bash
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.aggregate.total --format=csv
dmesg | grep -i "xid\|nvrm\|nvidia" | tail -50
```

Step two, reset.

Step three, 24 hours of GPU Burn. GPU Burn stresses compute and power delivery; it covers memory bandwidth less thoroughly than DCGM r3, so follow a pass with `dcgmi diag -r 3` (full bandwidth and lane sweep). Monitor ECC every minute:

```bash
# stress
./gpu_burn 86400

# watch ECC in another terminal
watch -n 60 "nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv,noheader"
```

**Reading the result:**

- 24 h pass, ECC at zero → no instability reproduced under load; lower the risk level, but still run a 30-day observation. Passing is not a certificate of permanent health.
- Error mid-run, interruption, or ECC climbing again → hardware confirmed; replace.

**Cases:**

J-0493 (Supermicro H200): GPU3 dropped during stress, Xid 79 in the log. Reset, 24 h GPU Burn passed, ECC zero. Judged a one-off; kept under monitoring.

J-0494 (Supermicro H200): the GPU was not detected at all, `lspci` showing `revision id ff` — apparently worse than Xid 79. Cleared, reseated, tested: no recurrence.

Different signals, same logic: clear, stress, see whether it reproduces. Severity of the alarm and the need for a replacement are separated by a stress test.

**Key point:** passing at light load proves nothing. Some memory damage only shows under full load, which is why 24 h of GPU Burn is the test that counts. Rebooting and "checking it looks fine" is gambling.

### Scenario 4 · System memory UECC raising CATERR

**What you see:** the server powers off or crashes. In the BMC log after reboot:

```text
[CPLD-0020] CATERR - Assertion
```

CATERR — catastrophic error. The reflex is "the CPU is dead". That reflex is often wrong.

**How to read it:** CATERR is a signal *from* the CPU that it detected a fatal system-level error. The CPU raised it; the CPU may not be the cause. **A common trigger is a memory UECC — the CPU read data it could not trust and shut the system down protectively.**

Check memory first, CPU second.

```bash
# Step 1: memory ECC records
ipmitool sel list | grep -i "memory\|ecc\|dimm\|uecc"
```

If there is a memory UECC record (e.g. `P1-DIMMC1 Uncorrectable ECC`), that is very likely the cause.

```bash
# Step 2: EDAC in dmesg
dmesg | grep -i edac
```

EDAC is the kernel's memory error detector. It records the controller channel and location:

```text
EDAC MC4: Giving out device to module i10nm_edac controller Intel_10nm Socket#1 IMC#0: DEV 0000:fe:0c.0 (INTERRUPT)
...
EDAC i10nm: v0.0.5 WARNING: Found Hardware Errors in dmesg:
```

This tells you which socket and which memory controller saw the error.

```bash
# Step 3: replace the DIMM at that location

# Step 4: verify — do not skip this
memtest86      # the new DIMM itself

./xhpl         # CPU + memory subsystem under load
```

### Why Linpack after a DIMM swap?

A UECC is not only "one bad stick". When UECC occurs, the CPU's memory controller has to handle the fault; repeated events put cumulative stress on the IMC. Replacing the DIMM removes the errors, but whether the IMC was affected does not show at light load. Linpack is what exercises the CPU and memory subsystem hard enough to tell.

A healthy run looks like this:

```text
Size  LDA    Align.  Time(s)  GFlops      Residual     Residual(norm) Check
45000 45000  1       21.286   2854.1400   1.303594e-09 2.293537e-02   pass

Residual checks PASSED
```

Two things matter: `Residual checks PASSED` (data consistency) and GFlops within the normal range for that CPU. A failure or a low number means the CPU/memory subsystem is not healthy under load.

**Cases:** J-0117 / J-0261 / J-0496 — one H200, a 47-day chain.

- J-0117, 21 Jan 2026: memory UECC (`P1-DIMMC1`), EDAC hardware errors, DIMM replaced.
- J-0261, 8 Feb, 18 days later: CATERR (`CPLD-0020`), server down, DIMM replaced again.
- J-0496, 9 Mar, 29 days later: server powered off, no system or IPMI access, CPU replaced and the system recovered.

Three failures in 47 days, ending at the CPU memory controller. Had Linpack been run at J-0117 or J-0261, the CPU's behaviour under load might have been visible much earlier. Part 7 (coming soon) walks the full chain.

![](/news/gpu-series-05/img-02.png)

**Note:** if the same slot or channel keeps reporting errors after a DIMM swap, escalate to the CPU memory controller, the board channel and power — the DIMM may not be the cause.

On 8-GPU NVLink HGX systems (H100/H200 SXM5), memory UECC is not the only CATERR source. Power transients on the GPU baseboard, fatal NVSwitch link errors and PCIe AER can all raise a fatal interrupt to the CPU. If `ipmitool` shows no memory UECC, check `dmesg | grep -i aer` and the PCIe entries in the BMC log.

## 2 · The decision tree

```text
ECC alarm
│
├─► 1. Locate the source
│ ├─ nvidia-smi has ECC → GPU memory → GPU path
│ ├─ ipmitool has memory ECC → system memory → memory path
│ └─ both → handle separately, never mix
│
├─► GPU memory path
│ ├─ First CE, small count
│ │ └─ record → reset → watch 24 h
│ │ ├─ volatile flat → daily monitoring, 30-day window
│ │ └─ volatile rising → escalate
│ ├─ CE/UE returning after reset on the same device
│ │ ├─ small CE, slow growth → high-frequency monitoring + stress
│ │ ├─ CE growing / reproduces under stress → plan window, prepare replacement
│ │ └─ recurrence after rack move / UE / with Xid → replace first
│ └─ UE / Xid 79
│ └─ log → reset → 24 h GPU Burn
│ ├─ pass, ECC zero → lower risk, observe
│ └─ fail or ECC accumulates → hardware confirmed, replace
│
└─► System memory path
├─ UECC → replace that DIMM → Memtest + Linpack
└─ CATERR → check ipmitool memory ECC first
├─ UECC present → replace DIMM → Memtest + Linpack
└─ none → check CPU / board / power
```

## 3 · Monitoring and risk tiers in practice

### Daily · GPU memory ECC

```bash
nvidia-smi --query-gpu=index,name,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.aggregate.total --format=csv
```

Run it on a schedule and keep the output. Two dimensions:

- **volatile** — since the last reset. **Watch the daily delta, not the total.** Going 0 → 10 matters more than 10,000 → 10,010: the first says degradation just started, the second that it has been going on for a long time.
- **aggregate** — lifetime, never cleared by a reset. A high aggregate with zero volatile means the card has been reset many times; do not be reassured by "currently zero".

### Daily · System memory ECC

```bash
ipmitool sel list | grep -i "memory\|ecc\|dimm"
ipmitool sdr type "Memory"
```

A crashed GPU job is not always the GPU. A UECC CATERR takes the whole machine down, and we have seen it more than once.

### Weekly · DCGM

```bash
dcgmi health -g 0 -c   # quick scan
dcgmi diag -r 2        # medium depth, ~15 min
```

### Monthly · Full diagnostic

```bash
dcgmi diag -r 3        # tens of minutes; run in an idle window
```

r3 includes bandwidth sweeps that catch lane degradation routine monitoring misses.

### Alert thresholds (starting values)

Tune these to GPU model, workload, baseline and SLA:

![](/news/gpu-series-05/img-04.png)

### Risk tier vs business impact

This table maps each signal to what it means for the business and what to do next — it draws the line between "observe" and "replace". A card costing tens of thousands of yuan may only have had a cosmic-ray CE (L1); a card with rising CE, reproducing under stress, recurring across racks (L3) carries another three weeks of business risk for every three weeks it stays in service.

![](/news/gpu-series-05/img-05.png)

### Our practice: automated ECC health monitoring

In our O&M engagements this is already automated: cluster-wide GPU and memory ECC collected daily, deltas and trends computed, thresholds pushing alerts to engineers. Signal capture, risk tiering and action triggering run without relying on someone remembering to look.

Every threshold and tier came out of real repair cases. If your cluster needs a similar ECC health monitor, talk to us.

### Operations vs repair

![](/news/gpu-series-05/img-06.png)

## Summary

Three steps for any ECC alarm:

**1 · Locate the source.** `nvidia-smi` (GPU memory) or `ipmitool` (system memory). Get the direction right first.

**2 · Identify the scenario.** GPU memory: first CE, recurrence, UE. System memory: UECC, CATERR. Each is handled differently.

**3 · Do the right thing.** Observe means recording the trend and waiting 30 days; stress means 24 h of GPU Burn; an L3 trigger means stop resetting and act; after a repair, verify (GPU → GPU Burn, memory → Memtest + Linpack).

Next: **Part 6 (coming soon) · ECC attribution — the same alarm, completely different causes.** This part covered what to do when you see ECC; the next covers why it appears: six root-cause paths, from memory degradation to cooling to power, each with its own evidence and treatment.

Shanghai COREFIX PRO Information Technology Co., Ltd.

Third-party GPU server repair, maintenance and O&M
