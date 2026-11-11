---
slug: "gpu-series-03"
title: "GPU repair series #3: HBM failures and how they are repaired"
date: "2026-06-24"
category: "tech"
source: "https://mp.weixin.qq.com/s/087rx4h5konel_LiPOT-iQ"
excerpt: "HBM lives in the same package as the GPU die, which makes it both expensive and hard to replace. Three field cases and the reasoning behind each outcome."
translated: true
---
In the last part we separated DRAM, DDR, GDDR, HBM and ECC. Now we go into a specific failure. The first subject is the most valuable and hardest part in a GPU server — the HBM stack behind H100, H200, A100 and B200.

## The same H200, the same ECC error, back 23 days later in another rack

A Supermicro H200 reported GPU ECC errors in `nvidia-smi`. The corrected count was small, there were no uncorrected errors, and the server ran normally. Following the standard path, we reset in a maintenance window, watched the volatile counters return to zero, saw no recurrence within 24 hours, and moved to observation.

Twenty-three days later, the same card in the same server raised ECC again. One detail mattered: between the two events the server had been migrated from one rack to another — different power, different cooling, different network position.

If both events had happened in the same rack, rack power or cooling would still be a candidate. After a migration, that explanation drops sharply down the list, and the fault points at the device itself.

So this time we did not clear and observe. The server came off the floor, and the GPU was replaced.

Both decisions were correct. The difference is an understanding of how HBM degrades — which is what this part is about.

## 1 · Why HBM is harder to repair than DDR or GDDR

HBM stacks DRAM dies vertically. From the bottom up:

**Logic die** — controls reads and writes for every DRAM layer above it; the manager of the stack.

**DRAM dies** — H100's HBM3 stacks eight dies, H200's HBM3e also eight, and newer parts such as B300 have moved to twelve. More layers mean more capacity, but a longer heat path from the inner layers.

**TSVs** — thousands of micron-scale vias through each die, connecting layer to layer. Data moves between layers through them.

**The interposer** — a silicon substrate carrying the GPU die and several HBM stacks in one package, wired together with fine traces. Stack count, capacity and usable memory depend on the GPU model and product form.

Three consequences follow for repair.

### Consequence 1 · Localisation is far coarser than DDR or GDDR

A bad DDR DIMM tells you `P1-DIMMC1`; you pull that stick and fit another.

A bad GDDR package can be localised to an address range with MemtestG80, mapped to a physical package on the PCB, and replaced on a BGA rework station.

A bad HBM stack tells you "this GPU has ECC errors". Diagnostics may narrow it to a logical region, but the stack is co-soldered with the die under CoWoS — it is not a field-replaceable part. Even when the logs point at a region, the decision usually lands on replacing the whole card.

**In most cases, an HBM problem means a new GPU.**

### Consequence 2 · The thermal path is complex, and hot spots hide

Stacked dies are wrapped by outer layers. Heat must travel from the innermost die outward to the cooler — a much longer path than a flat package, and worse with each added layer.

Under load, the inner layers can be significantly hotter than the outside. The stack can develop local hot spots that a single core temperature does not reflect. Poor cooler contact or aged thermal paste raises the ECC risk, and the symptom is simply that ECC starts climbing.

This explains a question operations teams ask constantly: "Why is ECC rising when `nvidia-smi` says the GPU temperature is fine?"

Because `temperature.gpu` is the die temperature, not necessarily the hottest point inside the stack. `nvidia-smi` also exposes `temperature.memory` where the platform supports it (otherwise N/A), and both should be collected. If HBM temperature sits consistently above the die temperature, or clearly above a healthy card of the same model, check contact, power, airflow and workload first.

Part 7 (coming soon) covers how to separate a thermal cause from a memory cause.

### Consequence 3 · Degradation has many paths, and none of them heal

HBM-related ECC can come from cell degradation, TSV micro-cracks, package interconnect, interposer data paths, or electrical and thermal conditions. In 24/7 operation the repeated thermal cycling accumulates stress at micron scale, and that kind of damage does not repair itself.

Modern GPUs (Ampere, Hopper, Blackwell) add hardware row remapping: rows judged degraded are marked pending, and on reset or reboot the firmware remaps the data path onto spare rows. The GPU then avoids those regions.

But spare rows are finite — the limit and the health criteria follow NVIDIA documentation and RMA policy. When the spares run out, the degradation becomes visible. So "volatile is zero after reset" is not enough; you have to look at remapped rows, pending/failure flags and availability. Part 5 covers the commands.

With those three consequences in mind, the logic is clear: **DDR is locate → swap → verify; GDDR is locate → replace package → verify; HBM is watch the trend → judge the stage → choose the moment → replace the card.**

## 2 · Four states of HBM health risk

Degradation is usually gradual, and can be described in four states. In practice the signals do not always arrive in order — sometimes the first event is a UE, sometimes a card drops for a PCIe or power reason without ever showing CE.

### Stage 1 · CE creeping up — the warning period

The earliest signal: corrected errors appear and rise day by day while the system runs normally. A single CE is corrected by the ECC mechanism and does not interrupt a job. But a rising count means hardware health is falling, and the trend must be tracked.

This is where operations teams misjudge: "a dozen CEs, the business is fine."

On a DDR DIMM, a handful of one-off CEs may indeed be harmless. **On HBM, the trend matters more than the absolute number.** Going from 0 to 10 a day, even at a small total, means some cells are degrading. If the trend continues, weeks later it is 100 a day, and then a UE.

**What to do:** record the daily delta, not just the total, and keep a trend curve. A delta that settles at zero is likely a soft error; keep watching. A delta that keeps rising means prepare for the next stage.

### Stage 2 · Serious ECC events — the alarm period

A UE means the error exceeded what ECC can correct. The system found the problem and could not fix it.

Protective actions follow: Xid 48 (uncorrectable ECC), Xid 94/95 (contained/uncontained ECC), and the running job may be terminated. In bad cases the GPU drops off the bus (Xid 79) or the server goes down.

### Does a UE always mean replacing the card?

No. A UE can be caused by physical damage (replace), or by a driver bug or a voltage transient (recoverable). The way to tell is a stress test: keep the logs and counters, reset in a window so the volatile counters restart, then run GPU Burn at full load for 24 hours. If it passes and volatile ECC does not accumulate, it was probably a one-off from software or environment. If it fails or ECC climbs again quickly, it is hardware.

**What to do:** move to the high-risk path — take critical jobs off the GPU, record the current ECC state and logs, reset in a window, run 24 h GPU Burn, then decide between observation and repair. Part 5 gives the exact steps and thresholds.

### Stage 3 · Benchmarks clearly low — functional degradation

This stage is hard for routine monitoring to see, and usually does not show up while jobs are running. It surfaces in like-for-like comparisons, DCGM diagnostics or unexplained throughput loss.

`nvidia-smi` looks normal, but against a healthy card of the same model, driver and configuration, throughput is clearly lower. The cause could be PCIe, inter-card links, local memory access, clocks, power or temperature — one test cannot prove an HBM channel is bad, so eliminate each in turn. Part 6 (coming soon) covers the attribution.

At this point the GPU still enumerates and can run light work, but its compute is discounted. Keep using it and the next heavy load may push it into stage 4.

**What to do:** after controlled comparison and basic elimination still point at the GPU, take it out of critical service and plan a replacement. Add a performance comparison to the monthly DCGM full diagnostic so this is found deliberately rather than by accident.

Some Blackwell and later platforms add GPU Memory RAS Repair. Its scope, triggers and recovery depend on GPU, firmware, driver and platform. When it engages, treat it as a rise in hardware risk, not as ordinary performance noise.

### Stage 4 · The GPU falls off the bus — the outage

`nvidia-smi` cannot see the card; `lspci` shows `revision id ff`, or the PCIe device is gone entirely.

`revision id ff` means the bus cannot read valid data from the device — the GPU is not communicating, whether because it dropped, a contact failed, or the hardware is damaged.

At this point the GPU cannot be accessed reliably. It may follow a serious ECC event, or come from PCIe, power, connector or board problems. From a reliability and cost standpoint, replacement, RMA or retirement is usually the answer.

But not every `ff` is stage 4: it can also be a connector problem or a transient drop after ECC accumulation. The test is whether it recovers after a reseat or reset, and whether it then passes a stress test. Part 11 (coming soon) covers that in detail.

## 3 · Three real cases, same alarm, three decisions

All three are from the same batch of H200 servers, in the same operating environment. Together they show the observe → escalate → reverse logic.

### Case 1 · J-0629 — first ECC, clear and observe

**Machine:** H200, SXM5, 8-GPU · **Date:** 26 March 2026

`nvidia-smi` reported ECC errors: small CE count, no UE, server running, jobs unaffected.

```bash
# Confirm the error type and count
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total --format=csv,noheader
```

CE only. The unit came off, was reset in a maintenance window to clear the counters, went back in service, and was monitored for 24 hours with no accumulation.

**Decision:** small CE count, no accumulation after clearing — most likely a soft error. Observation period, tracking the daily delta.

**Point:** clearing and observing is a reasonable first step. The key is to keep watching the volatile delta afterwards.

### Case 2 · J-0813 — same machine, 23 days later, different rack, replace

**Machine:** the same H200 as J-0629 · **Date:** 18 April 2026, 23 days later

**Detail:** the server had moved racks between the two events — power, cooling and network position all changed.

ECC returned.

**Action:** off the floor, back to the repair centre, GPU replaced. Stress test passed afterwards, ECC at zero.

### Why replace the second time? Two pieces of evidence.

**One: recurrence on the same device.** A single clear may be a one-off; a second event lowers the probability of "soft error" and raises the probability of a hardware problem. Clearing only resets the observation window; it does not remove the cause.

**Two: recurrence after a rack change.** Power and cooling both changed. Had it recurred in the same rack, rack conditions would remain a candidate. After the move, that explanation drops, and the engineering call is that the card carries a high memory-health risk.

**J-0629 and J-0813 together mark the key watershed in ECC handling:**

the first event can be cleared and observed; a recurrence on the same device should be dealt with, not cleared again and waited on.

**Point:** the 23-day interval is itself data — under this cluster's load, the recurrence cycle for this kind of degradation was about three to four weeks. A 24-hour observation window is therefore not enough; we now set an initial 30-day observation for this class of device, adjusted for load, history and business risk.

### Case 3 · J-0493 — Xid 79, but it passed the stress test

**Machine:** H200, SXM5, 8-GPU · **Date:** 9 March 2026

GPU3 dropped off the bus; the log showed Xid 79.

```text
GPU has fallen off the bus
Unable to determine the device handle for GPU3: 0000:5D:00.0: Unknown Error
```

The reflex is "the GPU is dead, replace it". That reflex is wrong often enough to matter.

**Xid 79 is the result of the GPU leaving the bus.** It can be triggered by a memory UE, but also by PCIe, power, driver, temperature or connector issues — and a UE itself can come from a driver bug or a voltage transient rather than physical damage. The way to tell is a stress test.

```bash
# Record the current ECC state (must be captured before reset)
nvidia-smi --query-gpu=index,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.aggregate.total --format=csv

# GPU reset (volatile counters clear; aggregate does not)
nvidia-smi -r -i 3

# Record again after reset and watch whether volatile climbs
```

The unit came off, ECC was cleared, and a 24-hour GPU Burn ran with no interruption and no errors; counters stayed at zero.

**Decision:** the GPU did not reproduce memory instability under this load. Xid 79 was most likely software or a transient environmental event. Back into service, with tighter monitoring.

**Point:** Xid 79 sounds far worse than a CE, but the decision still rests on the stress result. Passing 24 h GPU Burn lowers the risk level — it does not certify permanent health.

### What the three cases teach

Three decisions, three outcomes. **The deciding factor is not the size of the ECC count** but three dimensions, covered in parts 5–7:

![](/news/gpu-series-03/img-03.png)

## 4 · The operations SOP

### Daily ECC inspection

```bash
# Suggest a cron job, recorded daily
nvidia-smi --query-gpu=index,name,ecc.errors.corrected.volatile.total,ecc.errors.uncorrected.volatile.total,ecc.errors.corrected.aggregate.total,ecc.errors.uncorrected.aggregate.total --format=csv
```

What the four values mean:

- `volatile corrected` — CE since the driver loaded or the last reset/clear.
- `volatile uncorrected` — UE over the same window.
- `aggregate corrected` — persistent historical CE; Ampere and later cannot clear it.
- `aggregate uncorrected` — persistent historical UE.

Caveat: the quick `total` field may aggregate DRAM and SRAM errors; use `nvidia-smi -q -d ECC` for the real split. Always record the sample time and any driver reload or reboot.

```bash
# Formal re-check: DRAM/SRAM split and row remapper state
nvidia-smi -q -d ECC,ROW_REMAPPER
```

Comparing volatile and aggregate tells you the card's history. A large aggregate with zero volatile means a lot of errors historically and none in this cycle — not that the problem is gone. On A100/H100/H200, always read the row remapper state alongside it (see the J-1285 case in part 2).

### Periodic DCGM checks

```bash
# Weekly quick scan
dcgmi health -g 0 -c
dcgmi diag -r 2

# Monthly full diagnostic (run in an idle window)
dcgmi diag -r 3
```

r1 is a few minutes, r2 around ten to fifteen, r3 tens of minutes or more. Our cadence: r1 daily, r2 weekly, r3 monthly, adjusted for fleet size and business windows. Levels, items and runtimes vary by version, model and environment — keep the full report for handover.

### Alert thresholds (starting point)

The thresholds below come from our repair experience; every cluster needs its own tuning.

![](/news/gpu-series-03/img-04.png)

### Operations vs repair

![](/news/gpu-series-03/img-05.png)

**What to hand to the repair team:** model and serial, fault timeline, volatile and aggregate ECC values, whether a reset and stress test were done and their results, recurrence history and any environment change, and any recent migration or reconfiguration.

## Summary

HBM is valuable and hard to repair: faults localise only to the stack, inner layers run hot, and degradation is irreversible.

The usual path runs CE → serious ECC → performance loss → card loss, though the signals do not always appear in order. Each state has a signal and a response. Do not panic and replace on early CE; do not keep clearing after a serious event.

Three cases, one lesson: with the same "GPU ECC error", the decision depends on recurrence, recurrence after an environment change, and the stress result — not on the size of the count.

**Reset does not repair memory. Reset is where diagnosis starts — and the stress test that follows is what the decision rests on.**

Shanghai COREFIX PRO Information Technology Co., Ltd.

Third-party GPU server repair, maintenance and O&M
