export type Metric = { v: string; l: string }

export type Cap = {
  no: string
  title: string
  en: string
  desc: string
  metric: string
  metricLabel: string
  points: string[]
}

export type CaseItem = { k: string; h: string; p: string; b: string; c: string }

/** `id` is the stable lookup key (map coordinates, links); `name` is display text and is localized. */
export type Site = {
  id: string
  name: string
  tag: string
  coverage: string
  arrival: string
  plan?: boolean
}

export type PageHero = { eyebrow: string; title: string; desc: string }

/** Service-flow diagram content: five circular nodes, the labels along the arrows, and the footnote. */
export type ProcessFlow = {
  nodes: {
    intake: string[]
    approve: string[]
    repair: string[]
    test: string[]
    ship: string[]
  }
  steps: {
    unbox: string
    assign: string
    inspect: string
    quote: string[]
    yes: string
    no: string
    fieldiags: string
    outbound: string
    burn: string
    dcgm: string
    fail: string
    pass: string
    report: string
  }
  note: string[]
}

export type SocialId = 'wechat' | 'mp' | 'douyin' | 'xhs'

/** Footer platform button: clicking it opens `image` (a QR code / contact card) in a modal. */
export type SocialLink = { id: SocialId; label: string; image: string }

export type CtaButton = {
  label: string
  /** Internal paths are prefixed with the active locale at render time; `tel:` / `https:` are used verbatim. */
  href: string
}

export type Dict = {
  meta: { description: string }
  nav: { links: { href: string; label: string }[]; cta: string }
  hero: {
    eyebrow: string
    title: string[]
    sub: string
    ctas: { label: string; href: string }[]
    netBar: { label: string; cta: string }
    meta: Metric[]
  }
  wo: {
    label: string
    no: string
    rows: { k: string; v: string }[]
    trackLabel: string
    track: string[]
    /** Index of the step currently in progress; steps before it are done, the rest are pending. */
    trackCurrent: number
    kpis: Metric[]
  }
  stats: Metric[]
  cap: {
    eyebrow: string
    title: string[]
    more: string
    moreHref: string
    items: Cap[]
  }
  net: {
    eyebrow: string
    title: string
    sub: string
    sites: Site[]
    note: string
    slaTitle: string
    slaHead: string[]
    sla: { k: string; v: string[] }[]
    slaNote: string
    cta: string
  }
  cases: { eyebrow: string; title: string; items: CaseItem[]; all: string }
  process: { eyebrow: string; title: string; flow: ProcessFlow }
  cta: { eyebrow: string; title: string[]; sub: string; buttons: CtaButton[] }
  footer: {
    company: string
    address: string
    phone: string
    /** Inline prefixes rendered before the address and the phone number. */
    labels: { address: string; phone: string }
    /** Brand slogan: Chinese line on top, English line underneath. */
    slogan: { zh: string; en: string }
    social: SocialLink[]
    cols: { t: string; items: string[] }[]
    copyright: string
    icp: string
  }
  common: { phone: string }
  page: {
    capability: PageHero & { intro: string; detail: string; cta: string }
    network: PageHero & {
      mapTitle: string
      mapHint: string
      legend: string[]
      sitesTitle: string
      slaTitle: string
    }
    cases: PageHero & { metrics: Metric[]; cta: string }
    about: PageHero & {
      paras: string[]
      facts: Metric[]
      qualsTitle: string
      quals: string[]
      contactTitle: string
      contact: { k: string; v: string }[]
    }
  }
}
