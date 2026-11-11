---
slug: "h200-water-damage"
title: "Case study: bringing an H200 back after a machine-room water leak"
date: "2026-05-18"
category: "case"
source: "https://mp.weixin.qq.com/s/SAN7HA-EYFZooBnrZ2OWuQ"
excerpt: "A machine-room water leak flooded an H200 and left it unable to boot. What we did first, what we deliberately did not do, and how the data survived the repair."
translated: true
---

Water in a machine room is a lethal event for a server: shorted boards, damaged drives, lost data — each step can cost a company irrecoverably. This is the case of an H200 in Zhangjiakou that took water and would not start, and how we saved the hardware, the data and the business.

## The situation: no boot, and data at risk

A water leak in the machine room flooded the chassis. The server would not power on, with several failures at once:

### 1 · Hardware damage across the board

On-site inspection found irreversible damage to three critical areas:

- **Mainboard** — moisture shorted the board, components burned, the system could not start.
- **Power supplies** — shorted, unable to deliver stable voltage; the whole unit lost power.
- **Drives** — moisture and corrosion affected platters and heads; reads and writes were failing, with data at risk.

### 2 · Business interruption plus data exposure

The server held the customer's core production data. Losing it, or scrapping the machine, meant a full stop of the business plus the cost of compute replacement and data recovery. The ask was clear: **respond fast, repair precisely, keep the data, restore service**.

## The recovery: respond, repair, test, close

We ran the full emergency process end to end, from the first call to handover.

### 1 · Response: on site within 8 hours

- **Within 30 minutes** — the emergency process started, a dedicated team was formed and spare parts were prepared in parallel.
- **Within 8 hours** — two engineers reached Zhangjiakou with test equipment and matched parts, and began diagnosis immediately.

### 2 · Diagnosis and replacement: find the short, remove it

- **Full inspection** — short-circuit testers and drive diagnostics were used on the board, PSUs and drives, one by one, to pin down every damaged point.
- **Data first, then hardware** — before anything was unbolted, the original drives were imaged sector by sector, so a complete copy of the data sat on healthy media while the repair was carried out.
- **Like-for-like replacement** — the burned board, PSUs and drives were then replaced with new units of the same model, clearing the shorts and restoring hardware health.

### 3 · System work and repeated testing: verified before handover

We did not hand the machine back as soon as it powered on:

- **Firmware** — everything updated to the latest stable release for compatibility and stability.
- **Stress testing** — hardware self-test, boot, and full read/write passes, to confirm the unit ran cleanly and the data was intact.

### 4 · Asset handling: closing the loop

The failed parts were packed and returned to the vendor under a documented chain of custody, protecting the customer's asset records and closing the process.

## Results

The H200 came back, with three outcomes that mattered:

- **The machine runs again.** It boots, all hardware functions are normal, and it went straight back into production — avoiding the cost of scrapping it.
- **The data is intact.** The images were written back onto the new drives and verified file by file, so there was no recovery bill and no outage from missing data.
- **Asset and business continuity.** The customer kept both the hardware and the service window, and could get back to the business instead of the machine room.

## Why water damage needs a specialist

This case is what "the teaching hospital of server repair" means in practice — not just a repair, but an emergency chain from response to handover:

- **Speed** — on site within 8 hours, keeping the outage inside a single working day.
- **Precision** — instrumented diagnosis that removes the cause, not just the symptom, so the fault does not come back.
- **Data first** — the whole process is designed around protecting the data from further damage.
- **Closed loop** — repair, testing and asset disposal all documented, so the customer is never guessing.
