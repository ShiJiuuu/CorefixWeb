---
slug: "single-point-failure"
title: "Case study: one visit, two faults \u2014 reboots and a performance ceiling"
date: "2026-05-13"
category: "case"
source: "https://mp.weixin.qq.com/s/mjf5XfeAxSbOtFYfIV3z5Q"
excerpt: "One server, two unrelated problems: an ageing power supply causing reboots, and a configuration that could not keep up with the workload. Both closed in a single visit."
translated: true
---
![](/news/single-point-failure/img-01.png)

Right when AI compute was scaling, this customer's server kept dropping out — frequent reboots traced to ageing power supplies, and a configuration that could no longer carry the new workload. Hardware faults slowed delivery, and a full replacement was too expensive. What do you do?

This is a one-visit engagement for a Supermicro server in Ningxia: **repair plus upgrade, in a single service window.**

## Two problems at once

The customer was expanding, and the server had two independent issues:

![](/news/single-point-failure/img-02.png)

### 1 · Hardware: frequent reboots

Initial diagnosis pointed at **an ageing PSU**: unstable power was causing repeated restarts, putting business continuity at risk and threatening data loss and secondary hardware damage on each unexpected power cut.

### 2 · Performance: the configuration could not keep up

As the business grew, CPU, memory and storage were no longer sufficient — slower processing and limited concurrency were directly holding back expansion.

The ask was clear: **fix the fault and upgrade the hardware in one go** — restore stability and give the server headroom for the next stage.

## The one-stop plan: repair, reconfigure, stress-test

We ran a single chain: fast response → fault repair → hardware upgrade → stress validation, transparent from start to handover.

![](/news/single-point-failure/img-03.png)

### 1 · Response: on site within 8 hours

- **Within 30 minutes** — a four-engineer team was assigned and a plan drafted.
- **Within 8 hours** — the team reached the site in Ningxia with test and repair equipment and started diagnosis.

### 2 · Root cause: replace the PSUs

- **Instrumented diagnosis** — a PSU tester checked the power modules and pinned down the ageing units.
- **Matched replacement** — new, fully compatible PSUs restored stable power and ended the reboot cycle.

### 3 · Upgrade: match the new workload

Working from the customer's roadmap, we upgraded the parts that were actually limiting throughput:

- **Find the bottleneck** — stress testing and workload analysis identified the weak points across CPU, memory and storage.
- **Upgrade the core** — a faster CPU, larger memory and high-speed storage lifted processing and concurrency.
- **Tune the system** — parameters were adjusted for the new configuration so hardware and software matched.

### 4 · Validation: tested before handover

The unit was not handed back as soon as the parts arrived:

- A high-load environment was simulated, running the server hard for an extended period.
- Stability, power reliability and performance were monitored throughout, confirming the reboots were gone and the upgrade met its targets.

## Results

![](/news/single-point-failure/img-04.png)

- **Stable operation** — with the PSUs replaced, power is reliable and the reboots that had plagued the customer are gone.
- **Performance restored** — the upgraded configuration meets its targets and handles the larger workload.
- **Room to grow** — stable hardware and spare capacity give the business a technical floor for expansion.

## Why one-stop service

This is what "the teaching hospital of server repair" means: not just repairing a box, but a **diagnose → treat → upgrade → recover** chain for a compute asset.

- Fast response, so the business is not waiting.
- Root-cause repair, so the same fault does not return.
- Repair and upgrade in one visit, so the customer is not coordinating multiple vendors.
- Stress testing before handover, so what arrives on site is known to work.
