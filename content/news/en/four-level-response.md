---
slug: "four-level-response"
title: "Four-level fault response: an early-warning system for compute clusters"
date: "2026-05-15"
category: "service"
source: "https://mp.weixin.qq.com/s/MT_7SuI86WpuSBn5QRbxAw"
excerpt: "Not every fault deserves the same reaction. A four-tier severity model that maps each alarm to an action, so on-call engineers know what to do at three in the morning."
translated: true
---

![](/news/four-level-response/img-01.jpg)

With large-model training and always-on compute clusters, no company can avoid hardware failure entirely.

What decides the cost of compute is never whether something breaks — it is how long it stays broken.

The usual problem in a machine room is not a lack of engineers but a lack of triage: every alarm is treated the same, nothing has a priority, response is ad hoc, and repairs drag. A small fault grows into an outage, and a minor warning turns into a large bill.

COREFIX PRO — the teaching hospital of server repair — runs a standardised **four-level incident response system for GPU clusters**: every fault has a level, a response target and a defined procedure.

## 01 · Four levels, four different reactions

Faults are classified as **P0 disaster, P1 critical, P2 major and P3 advisory**, each with its own handling path — no one-size-fits-all repairs.

### P0 · Disaster (highest priority)

**Definition:** the whole cluster is down, every node unreachable, job data lost, or a framework defect has taken the service offline.

**Targets:** first response ≤10 minutes, resolution ≤2 hours.

**Typical cases:** mass node loss, machine-room power failure, core link damage, business fully stopped.

### P1 · Critical

**Definition:** more than 50% of GPU nodes abnormal, memory leaks, severe driver incompatibility, jobs failing en masse.

**Targets:** first response ≤20 minutes, resolution ≤4 hours.

**Typical cases:** batch errors across a multi-GPU cluster, training jobs crashing repeatedly, core compute unavailable.

### P2 · Major

**Definition:** a single node loses more than 20% of its compute, CUDA kernel errors, queues delayed significantly.

**Targets:** first response ≤1 hour, resolution ≤12 hours.

**Typical cases:** one GPU throttling, compute fluctuation, programs stalling, queue build-up.

![](/news/four-level-response/img-02.png)

### P3 · Advisory

**Definition:** hardware warnings, temperature anomalies, NVLink latency, minor errors in the development environment.

**Targets:** first response ≤2 hours, resolution ≤48 hours.

**Typical cases:** non-urgent risks, background log errors, early signs of hardware degradation.

## 02 · A standard process behind every step

Levels are the foundation; the process is what actually protects you. Every incident runs a closed loop, from report to review, with a record at each stage.

### Reporting

Three channels are open around the clock: a 7×24 hotline, the customer console and a dedicated API. Each report automatically opens a unique ticket, confirmed by SMS and email — **every fault is logged, nothing is dropped**.

### Response

For P0/P1: an incident team forms immediately, led by the technical director, with a dedicated account manager and several senior engineers.

For P2/P3: a second-line engineer takes the ticket and works it in order.

### Repair

We hold to the industry's golden rules:

locate the root cause in 5 minutes · a temporary workaround in 15 · permanent repair started in 30.

Keep the business running first, then fix the hardware — minimising lost compute.

### Review

Within 12 hours of resolution, a written analysis is issued: root cause, handling path and recommendations, so the same fault does not come back. **Fix one machine, improve a batch, stabilise a fleet.**

## 03 · Why a cluster needs graded response

Many teams over-handle small warnings and under-handle serious faults: effort is wasted and the business pays for it.

![](/news/four-level-response/img-03.png)

The four-level system addresses each of those failures:

- **Clear priority** — critical faults go first; nothing is left to drift into an outage.
- **Hard time targets** — every level has a deadline, so nobody waits indefinitely.
- **Right engineer for the job** — skills are matched to the fault instead of being spread evenly.
- **Full traceability** — ticket flow, progress and review reports are all on file.

## 04 · Two layers of insurance for your compute

COREFIX PRO — **the teaching hospital of server repair**.

We do more than repair: we provide standardised, systematic, ongoing compute assurance.

Maintenance · O&M · Tuning · Repair · Training

From emergency response and scheduled inspection to hardware upgrades and engineer training, we cover the whole lifecycle of your compute assets.

When compute becomes a problem, call COREFIX PRO.
