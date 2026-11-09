import type { Dict } from './types'

export const en: Dict = {
  meta: {
    description:
      'Shanghai CoreFix Pro Information Technology — component-level GPU repair, driver and firmware tuning, nationwide spare-parts network and on-site maintenance. 99.2% repair success rate, compute restored to 98%+ of factory baseline.',
  },
  nav: {
    links: [
      { href: '/capability', label: 'Capability' },
      { href: '/network', label: 'Network' },
      { href: '/cases', label: 'Cases' },
      { href: '/about', label: 'About' },
      { href: '/news', label: 'News' },
    ],
    cta: 'Book a repair',
  },
  hero: {
    eyebrow: 'GPU REPAIR & MAINTENANCE',
    title: ['Every GPU,', 'back to full compute'],
    sub: 'Component-level repair, driver and firmware tuning, nationwide spare-parts network. Verified by a 12-hour stress test, with compute restored to 98%+ of factory baseline.',
    ctas: [
      { label: 'Book a repair', href: '#contact' },
      { label: 'View capability', href: '/capability' },
    ],
    netBar: { label: 'SERVICE NETWORK / 28 CITIES · 7×24', cta: 'Open network map' },
  },
  stats: [
    { v: '99.2%', l: 'Repair success rate' },
    { v: '85%+', l: 'Component-level fix rate' },
    { v: '48h', l: 'Standard turnaround' },
    { v: '60d', l: 'Post-repair warranty' },
  ],
  cap: {
    eyebrow: 'CAPABILITY',
    title: ['From silicon to cluster,', 'one complete repair chain'],
    more: 'View all capability',
    moreHref: '/capability',
    items: [
      {
        no: '01',
        title: 'Hardware repair',
        en: 'HARDWARE REPAIR',
        desc: 'Component-level repair of memory modules, VRM circuits and PCIe link faults; module-level replacement of cooling assemblies, PSUs and NVMe arrays; 128-point full-system diagnostics with 3D imaging for hidden faults.',
        metric: '85%+',
        metricLabel: 'Component-level fix rate',
        points: ['Memory module replacement', 'VRM circuit repair', 'PCIe link fault isolation', 'BGA rework and reballing'],
      },
      {
        no: '02',
        title: 'Software & tuning',
        en: 'SOFTWARE & TUNING',
        desc: 'Driver compatibility testing and rollout, firmware and VBIOS flashing, BIOS/UEFI and MIG optimisation, DCGM monitoring deployment, CUDA benchmarks and long-duration stress tests.',
        metric: '98%+',
        metricLabel: 'Compute restored',
        points: ['Driver compatibility and rollout', 'Firmware / VBIOS flashing', 'BIOS and MIG optimisation', 'DCGM monitoring + 12h stress'],
      },
      {
        no: '03',
        title: 'Value-added service',
        en: 'VALUE-ADDED',
        desc: '1–3 year extended warranty, same-model spare-unit rental, quarterly equipment health reports and performance-degradation alerts.',
        metric: '180d',
        metricLabel: 'Maximum warranty',
        points: ['1–3 year extended warranty', 'Spare-unit rental', 'Quarterly health report', 'Degradation early warning'],
      },
      {
        no: '04',
        title: 'Spare-parts supply',
        en: 'SPARE PARTS',
        desc: 'Three-tier warehousing — central, regional and on-site — with ATE screening on every part, 1:1 spare ratio for large data centres and 2-hour intra-city dispatch.',
        metric: '1:1',
        metricLabel: 'Spare ratio',
        points: ['Three-tier warehousing', 'ATE screening on all parts', '1:1 critical spare ratio', '2-hour intra-city dispatch'],
      },
      {
        no: '05',
        title: 'On-site & resident',
        en: 'ON-SITE',
        desc: '24/7 response teams in 28 cities, 4-hour arrival inside urban areas; 4 resident engineers per 300 servers, tracked live by our remote diagnostics centre.',
        metric: '4h',
        metricLabel: 'Urban arrival',
        points: ['28 cities, 24/7 response', '4-hour urban arrival', '4 residents per 300 servers', 'Remote diagnostics tracking'],
      },
    ],
  },
  net: {
    eyebrow: 'NETWORK & SLA',
    title: 'Two hubs, national coverage',
    sub: 'Shenzhen HQ and the Shanghai repair base work as one network: 5 operating sites plus 4 under construction, with arrival inside 24 hours within the service radius.',
    sites: [
      { id: 'shenzhen', name: 'Shenzhen', tag: 'HQ', coverage: '5 provinces · 61 cities', arrival: '≤24H' },
      { id: 'shanghai', name: 'Shanghai', tag: 'Repair base 2,000㎡', coverage: '4 provinces · 34 cities', arrival: '≤24H' },
      { id: 'beijing', name: 'Beijing', tag: 'Service site', coverage: '7 provinces · 47 cities', arrival: '≤24H' },
      { id: 'ningxia', name: 'Ningxia', tag: 'Service site', coverage: '3 provinces · 30 cities', arrival: '≤48H' },
      { id: 'ulanqab', name: 'Ulanqab', tag: 'Service site', coverage: '3 provinces · 25 cities', arrival: '≤48H' },
      { id: 'hami', name: 'Hami', tag: 'Opening 2026', coverage: 'Under construction', arrival: '—', plan: true },
      { id: 'xining', name: 'Xining', tag: 'Opening 2026', coverage: 'Under construction', arrival: '—', plan: true },
      { id: 'wuhu', name: 'Wuhu', tag: 'Opening 2026', coverage: 'Under construction', arrival: '—', plan: true },
      { id: 'guizhou', name: 'Guizhou', tag: 'Opening 2026', coverage: 'Under construction', arrival: '—', plan: true },
    ],
    note: 'Within 800 km of an operating site: ≤24h arrival. 800–1,500 km: ≤48h. Beyond 1,500 km: ≤72h. P1–P4 tiered SLAs available on request.',
    slaTitle: 'Service levels',
    slaHead: ['Service level', 'Basic', 'PRO', 'MAX'],
    sla: [
      { k: 'Response', v: ['≤4h', '≤2h', '≤30min'] },
      { k: 'On-site arrival', v: ['≤24h', '≤10h', '≤4h'] },
      { k: 'Turnaround', v: ['≤14d', '≤7d', '≤5d'] },
      { k: 'Parts guarantee', v: ['100%', '100%', '100%'] },
      { k: 'Warranty', v: ['30d', '60d', '180d'] },
      { k: 'Resident staff', v: ['—', '≥2', 'Dedicated'] },
    ],
    slaNote: 'Supported: A100 / A800 / H100 / H200 / H20 / H800 / B200 / B300, plus 8-GPU 4090, 5090 and A6000 clusters.',
    cta: 'Open the network map',
  },
  cases: {
    eyebrow: 'CASES',
    title: 'Machines that came back',
    all: 'View all cases',
    read: 'Read case',
    items: [
      {
        slug: 'supermicro-h200-nic-no-carrier',
        client: 'A Shanghai company',
        device: 'Supermicro H200 server',
        tag: 'Link fault',
        service: 'On-site diagnosis + transceiver replacement',
        date: '3 October 2026',
        title: 'Supermicro H200 NIC No-Carrier: link isolation and transceiver replacement',
        summary:
          'The brainpf/data NIC kept reporting No-Carrier. Working segment by segment through the fibre patch leads and the transceiver isolated the fault, and the link came back up after an on-site replacement.',
        metrics: [
          { v: '1 point', l: 'Fault isolated' },
          { v: 'On site', l: 'Link restored' },
        ],
        challenge: [
          'On a Supermicro H200 server, the brainpf/data NIC reported No-Carrier continuously: no carrier signal on the link, so the port would not come up.',
          'That NIC carries data-plane traffic. With the link down, inter-node transfers and training-job communication were directly affected — not something that could wait for the next maintenance window.',
          'A system-level restart had already been ruled out remotely, so an engineer had to work the path on site and establish whether the fault sat in the fibre lead, the transceiver, or the NIC port itself.',
        ],
        solution: [
          {
            t: 'Dispatch and spares',
            d: 'Confirmed the alarm, server model and failed NIC, and lined up an engineer plus a matching transceiver.',
          },
          {
            t: 'On-site check',
            d: 'Verified the server state in the machine room and confirmed the No-Carrier alarm was persistent, not intermittent.',
          },
          {
            t: 'Segment-by-segment isolation',
            d: 'Checked the fibre patch leads and transceiver status, working along the path until the fault was narrowed to the transceiver.',
          },
          {
            t: 'Replacement and end-face cleaning',
            d: 'Replaced the transceiver, following proper insertion practice and cleaning the fibre end-face to avoid dust-induced attenuation.',
          },
          {
            t: 'Link validation',
            d: 'Retested the port: the No-Carrier alarm cleared, the port came up and data-plane traffic resumed.',
          },
          {
            t: 'Handover',
            d: 'Confirmed recovery with the customer, closed the work order and logged the full sequence.',
          },
        ],
        outcome: [
          'With the transceiver replaced, the No-Carrier alarm on brainpf/data cleared, the port came up, and inter-node transfer and training communication recovered.',
          'The whole job was completed on site; neither the server nor any part was shipped back, keeping the outage to the shortest possible window.',
        ],
      },
      {
        slug: 'hgx-h100-sxm-socket',
        client: 'A Suzhou company',
        device: 'HGX H100 GPU baseboard',
        tag: 'Socket damage',
        service: 'Board-level BGA rework',
        date: '10 October 2026',
        title: 'HGX H100 baseboard SXM socket: board-level BGA rework and validation',
        summary:
          'A damaged SXM socket left the GPU undetectable. After a 48-hour bake-out, BGA removal and resocketing, and pin-by-pin continuity checks, the GPU enumerated again — board-level rework instead of a full board replacement.',
        metrics: [
          { v: '48h', l: 'Bake-out' },
          { v: '0', l: 'Board replacement' },
        ],
        challenge: [
          'An HGX H100 GPU baseboard arrived with a damaged SXM socket; the GPU could not be enumerated and the system was unusable.',
          'The fault sat in the socket itself — board-level soldering work. The standard remedy is a full baseboard replacement, with cost and lead time both dictated by spares availability.',
          'The customer wanted the board repaired rather than replaced: shorter downtime, and no full-board purchase.',
        ],
        solution: [
          {
            t: 'Intake',
            d: 'Received the faulty baseboard on 10 October 2026, logged the equipment details and confirmed the symptom.',
          },
          {
            t: 'Fault confirmation',
            d: 'Retested and confirmed the damaged SXM socket was preventing GPU enumeration, localising the fault to the socket body.',
          },
          {
            t: 'Bake-out',
            d: 'Ran a 48-hour bake-out to drive moisture out of the board before large-area BGA work, avoiding popcorning and delamination under reflow heat.',
          },
          {
            t: 'BGA removal',
            d: 'Removed the damaged socket on a BGA rework station to a defined temperature profile, holding the surrounding components and pads intact.',
          },
          {
            t: 'Pad preparation and resocketing',
            d: 'Cleaned and levelled the pads, then soldered the new socket to process spec with even joints and full fillets.',
          },
          {
            t: 'Pin-by-pin test and power-on validation',
            d: 'Checked continuity pin by pin on the new socket, then powered up: the GPU enumerated and full function returned.',
          },
        ],
        outcome: [
          'The HGX H100 baseboard SXM socket was repaired at board level: the GPU enumerates normally, board function is restored, and the customer confirmed the result.',
          'Board-level rework replaced a full board swap, cutting spares cost and downtime — and keeping a repairable board out of scrap.',
        ],
      },
      {
        slug: 'h100-single-gpu-failure',
        client: 'A Guangzhou company',
        device: 'NVIDIA H100 server',
        tag: 'Single card',
        service: 'On-site inspection + failed card removal',
        date: '9 July 2026',
        title: 'NVIDIA H100 single-GPU fault: on-site isolation and card removal',
        summary:
          'A single GPU fault cut into the chassis compute output. The engineer attended site, powered down, pulled the card under ESD control and logged its serial, then validated the server over multiple reboot cycles.',
        metrics: [
          { v: '1 card', l: 'Fault isolated' },
          { v: 'Multi-round', l: 'Reboot validation' },
        ],
        challenge: [
          'A single-GPU failure alarm appeared while the server was running. The card was in a bad state, and both chassis compute output and workload balancing were affected.',
          'The card could not be recovered remotely: it required a power-down, teardown and extraction in the machine room — an on-site hardware job.',
          'The customer runs a strict change window and ESD regime, so the removal had to be procedural and traceable, with no loose ends.',
        ],
        solution: [
          {
            t: 'Rapid response',
            d: 'Confirmed the symptom, model and site conditions, and arranged the engineer, spares and a work window.',
          },
          {
            t: 'Arrival on site',
            d: 'Verified equipment details, agreed the work window and safety rules, and set up ESD protection.',
          },
          {
            t: 'Fault detection',
            d: 'Powered up on site, checked GPU status and logs card by card, and isolated the faulty unit (6444—6566).',
          },
          {
            t: 'Card extraction',
            d: 'Powered down, removed the card under ESD control and logged its serial, without damaging the slot or neighbouring cards.',
          },
          {
            t: 'Post-service validation',
            d: 'After the server came back up, validated GPU status, compute output and stability over multiple rounds with no alarms.',
          },
          {
            t: 'Handover',
            d: 'Confirmed recovery with the customer on site and closed the service loop.',
          },
        ],
        outcome: [
          'With the faulty card out, the server returned to service: the single-card alarm cleared and compute output and stability returned to normal.',
          'The removal followed the site procedure end to end with the serial logged, so the failed part stays traceable for replacement or RMA.',
        ],
      },
      {
        slug: 'a100-no-boot-u9-module',
        client: 'A Shanghai company',
        device: 'NVIDIA A100',
        tag: 'Power path',
        service: 'Power-on inspection + module replacement + verdict',
        date: '8 — 17 June 2026',
        title: 'NVIDIA A100 no-boot: U9 module replacement and core damage verdict',
        summary:
          'No-boot reproduced on the bench. Step-by-step measurement along the power path pointed to the U9 power module; after replacement the retest confirmed the GPU core was damaged beyond repair, with a clear verdict in nine days.',
        metrics: [
          { v: '9 days', l: 'Report to verdict' },
          { v: 'U9', l: 'Module isolated' },
        ],
        challenge: [
          'An A100 card would not boot on power-up. The device could not start and the workload stopped with it.',
          'The initial read pointed at the power path, but that path has several conversion stages: the fault could sit in a power module, or it could already have reached the GPU core.',
          'The customer needed more than a repair — they needed a verdict they could act on: whether the card was still worth investing in.',
        ],
        solution: [
          {
            t: 'Intake',
            d: 'Accepted the report on 8 June 2026, logged the symptom and serial, and set out the test plan.',
          },
          {
            t: 'Power-on test',
            d: 'Ran a bench power-on test on the A100, reproduced the no-boot condition and ruled out the host environment.',
          },
          {
            t: 'Power path isolation',
            d: 'Measured stage by stage along the supply path and located the fault at the U9 power module.',
          },
          {
            t: 'U9 replacement',
            d: 'Replaced the U9 power module, cleared the supply-side fault and restored the power path.',
          },
          {
            t: 'Retest and core assessment',
            d: 'Powered up again after replacement; testing confirmed the GPU core was damaged and beyond repair.',
          },
          {
            t: 'Verdict',
            d: 'Completed testing on 17 June 2026 and issued a clear conclusion with disposal recommendations.',
          },
        ],
        outcome: [
          'Replacing the U9 module cleared the supply-side fault, and further testing confirmed the GPU core was damaged beyond repair.',
          'The verdict was unambiguous and traceable, so the customer stopped sinking money into an unrepairable card and moved to spares and replacement.',
        ],
      },
    ],
    detail: {
      back: 'Cases',
      client: 'Client',
      device: 'Equipment',
      service: 'Scope',
      date: 'Service date',
      challenge: 'The problem',
      solution: 'What we did',
      outcome: 'Results and verification',
      quote: 'Client feedback',
      related: 'More cases',
      allCases: 'View all cases',
    },
  },
  process: {
    eyebrow: 'PROCESS',
    title: 'Six steps, fully logged',
    flow: {
      nodes: {
        intake: ['Intake'],
        approve: ['Customer', 'approval'],
        repair: ['GPU repair'],
        test: ['Test', 'passed?'],
        ship: ['Dispatch'],
      },
      steps: {
        unbox: 'Unboxing video',
        assign: 'Engineer assigned',
        inspect: 'Inspection',
        quote: ['Report, quote and', 'repair contract issued'],
        yes: 'Yes',
        no: 'No',
        fieldiags: 'Fieldiags test',
        outbound: 'Outbound tests',
        burn: 'GPU Burn test',
        dcgm: 'DCGM test',
        fail: 'Test failed',
        pass: 'Test passed',
        report: 'Repair report issued',
      },
      note: [
        'Once you contact us, our service desk starts the process immediately and gives an initial assessment within one hour.',
        'Standard faults are repaired and shipped back within 48 hours; complex cases are delivered within 10–15 working days, keeping downtime to a minimum.',
      ],
    },
  },
  cta: {
    eyebrow: 'CONTACT',
    title: ['One day down', 'is one day lost.'],
    sub: 'Send us the symptom, the model and your city. We reply with an initial assessment within one hour.',
    buttons: [
      { label: 'Book a repair', href: 'tel:021-5176-8787' },
      { label: 'View capabilities', href: '/capability/' },
      { label: '021-5176-8787', href: 'tel:021-5176-8787' },
    ],
  },
  footer: {
    company: 'Shanghai CoreFix Pro Information Technology Co., Ltd.',
    address: 'Floor 5, Building 3, 299 Youle Road, Changning District, Shanghai',
    labels: { address: 'Address: ', phone: 'Tel: ' },
    phone: '021-5176-8787',
    slogan: { zh: '集智起航，培优致远', en: 'Wisdom Sets Sail, Excellence Goes Far' },
    social: [
      { id: 'wechat', label: 'WeChat', image: '/social/wechat.jpg' },
      { id: 'mp', label: 'Official account', image: '/social/wxgzh.jpg' },
      { id: 'douyin', label: 'Douyin', image: '/social/douyin.jpg' },
      { id: 'xhs', label: 'Xiaohongshu', image: '/social/rednote.jpg' },
    ],
    cols: [
      { t: 'Service', items: ['Hardware repair', 'Software tuning', 'Spare parts', 'Resident maintenance'] },
      { t: 'Company', items: ['About', 'Service network', 'Certifications', 'Careers'] },
    ],
    copyright: '© 2026 SHANGHAI COREFIX PRO INFORMATION TECHNOLOGY CO., LTD.',
    icp: '沪ICP备XXXXXXXX号 · Privacy Policy',
  },
  common: {
    phone: '021-5176-8787',
  },
  page: {
    capability: {
      eyebrow: 'CAPABILITY',
      title: 'From silicon to cluster, one repair chain',
      desc: 'Five capabilities chain together: strip, repair, test, stock, stay. One engineering standard runs through all of them — so a repaired card does not just power on, it returns to the training queue.',
      intro: 'Every repair happens inside our 2,000㎡ cleanroom in Shanghai, equipped with X-ray inspection and BGA rework stations.',
      detail: 'Details',
      cta: 'Talk to an engineer',
    },
    network: {
      eyebrow: 'NETWORK',
      title: 'Two hubs, national coverage',
      desc: 'Shenzhen HQ and the Shanghai repair base operate as one network, with 5 operating sites and 4 under construction. Hover a site to see its role, coverage and arrival time.',
      mapTitle: 'Coverage',
      mapHint: 'Hover a site for details',
      legend: ['Operating site', 'Under construction', '800 km radius'],
      sitesTitle: 'Site list',
      slaTitle: 'Service level comparison',
    },
    cases: {
      eyebrow: 'CASES',
      title: 'Machines that came back',
      desc: 'From a single-card emergency to annual maintenance on ten-thousand-GPU fleets — every number traces back to a work order, a diagnostic report and a stress log.',
      metrics: [
        { v: '99.2%', l: 'Repair success' },
        { v: '85%+', l: 'Component fix' },
        { v: '98%+', l: 'Compute restored' },
        { v: '<0.8%', l: 'Recurrence' },
      ],
      cta: 'Tell us your fleet size',
    },
    about: {
      eyebrow: 'ABOUT',
      title: 'We treat GPUs as precision instruments',
      desc: 'Founded in September 2025 with RMB 50 million in registered capital, Shanghai CoreFix Pro is based in Changning District and focuses on professional GPU repair, maintenance and tuning.',
      paras: [
        'We built the lab before we sold the service. The 2,000㎡ four-floor repair base in Lingang, Shanghai houses X-ray inspection and BGA rework equipment, giving component-level GPU repair and fault diagnosis a solid technical floor.',
        'The team is 60+ strong: 4 principal engineers with 20 years of GPU development support each, 22 repair engineers handling card faults and reballing, and 35 operations engineers building and running intelligent computing centres.',
        'For clients this means a predictable delivery: faults are graded, turnaround is bounded, results come with a report, and warranty is a commitment.',
      ],
      facts: [
        { v: '2025.9', l: 'Founded' },
        { v: 'RMB 50M', l: 'Registered capital' },
        { v: '60+', l: 'Engineers' },
      ],
      qualsTitle: 'Certifications',
    },
    news: {
      eyebrow: 'NEWS',
      title: 'Company news',
      desc: 'Announcements, delivery notes and technical write-ups, imported from our WeChat account and listed newest first. Articles are published in Simplified Chinese.',
      listLabel: 'All articles',
      back: 'Back to news',
      sourceLabel: 'Read the original',
      updatedLabel: 'Published',
      prev: 'Previous',
      next: 'Next',
      categories: {
        company: 'Company',
        tech: 'Lectures',
        guide: 'Playbook',
        industry: 'Industry',
        service: 'Service',
        case: 'Case study',
      },
    },
  },
}
