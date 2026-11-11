---
slug: "ai-training-efficiency"
title: "More GPUs, no faster training? What really caps AI cluster efficiency"
date: "2026-08-18"
category: "industry"
source: "https://mp.weixin.qq.com/s/CWE-LR7Jtd-uoeP0Wj7PtA"
excerpt: "A customer scaled a training cluster from 80 to 300+ GPUs and throughput went down instead of up. The cards were healthy \u2014 the bottleneck sat in storage, scheduling and the fabric between them."
translated: true
---
![](/news/ai-training-efficiency/img-01.png)

A recent engagement says a lot. An internet company scaled its training cluster from 80 GPUs to more than 300, expecting throughput to rise with it. Instead, performance became erratic: jobs that had run smoothly started stalling, monitoring showed GPU utilisation in the low 40s — and yet the GPUs were healthy, with normal temperatures and power draw.

Two weeks of investigation found the problem was not the number of GPUs: roughly 30% of training time went to waiting on storage for data, 20% to gradient synchronisation between cards, and another 15% of capacity sat idle because of poor scheduling. What limited training was waiting, created by parts of the system that did not work together.

![](/news/ai-training-efficiency/img-02.png)

This is now a common experience: once a cluster grows from tens of GPUs to hundreds or thousands, adding cards stops solving the efficiency problem.

## 01 · Why the GPUs are not busy

The first instinct — low utilisation means not enough compute — is usually wrong.

Think of GPUs as skilled workers on a line. Low utilisation does not mean they are slacking; more often the materials upstream are late, the conveyor is jammed, or the work is badly allocated, so they stand there waiting.

It is the same in training. However fast the GPU is, it only performs when the rest of the system keeps up. If data arrives too slowly, if the link between cards is too narrow, or if jobs are scheduled badly, the GPU waits. Low utilisation is a symptom of the whole stack, not of the GPU.

## 02 · Why training is so complex

AI training is a system problem across five layers:

![](/news/ai-training-efficiency/img-03.png)

**Compute** — is the GPU itself fully used, is the model shaped for the hardware, are execution units idling?

**Communication** — can data move fast enough between cards and nodes? If the gradient-sync path is narrow, GPUs stop and wait for alignment.

**Storage** — can data be read as fast as the GPU can consume it? If I/O lags, the GPU spends most of its time waiting.

**Scheduling** — are resources allocated sensibly, or are some GPUs idle while others are oversubscribed?

**Energy** — do thermals and power cause throttling? In a dense deployment, poor cooling quietly costs performance.

Any one of these can hold utilisation down.

## 03 · Why single-metric monitoring stops working

![](/news/ai-training-efficiency/img-04.png)

Traditional cluster monitoring watches a handful of point metrics — utilisation, temperature, power, memory. That was adequate when clusters were small and jobs simple.

Now, with hundreds or thousands of cards running dozens of jobs, problems cross layers. Slow storage shows up as low GPU utilisation; bad scheduling looks like a capacity shortage that more cards will not fix.

A point metric can tell you something is wrong. It cannot tell you why, or what to do about it.

## 04 · What modern AI infrastructure operations needs

Teams that keep improving efficiency tend to share three capabilities:

![](/news/ai-training-efficiency/img-05.png)

**Cross-layer analysis** — joining compute, communication, storage, scheduling and energy data instead of staring at isolated metrics.

**Root-cause localisation** — finding the constraint that actually matters, rather than treating each symptom.

**Prediction** — seeing the next problem before it lands: cooling that will not survive the coming training peak, storage I/O approaching its ceiling.

This is exactly what an AI infrastructure operations platform has to solve. COREFIX PRO's tuning practice is built around it: joining operational data across layers, locating the real constraint quickly, and using history to anticipate risk — so the GPUs you already own are actually used.

## 05 · The competition has moved

For a few years the race was about how many GPUs you had. It is shifting: the gap between companies will come less from how many cards they own and more from how much of that capacity they can actually put to work.

The same several hundred cards can run at 90% effective utilisation in one company and 40% in another. The difference is not closed by buying more. The winners will be the ones that operate what they already have — and operate it well.

Compute competition is becoming operations competition. More GPUs is not automatically faster — the system around them decides.

Shanghai COREFIX PRO Information Technology Co., Ltd.

Third-party GPU server repair, maintenance and O&M
