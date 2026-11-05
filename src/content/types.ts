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
  process: { eyebrow: string; title: string; steps: { no: string; t: string; d: string }[] }
  cta: { eyebrow: string; title: string[]; sub: string; buttons: CtaButton[] }
  footer: {
    address: string[]
    phone: string
    cols: { t: string; items: string[] }[]
    copyright: string
    icp: string
  }
  common: { back: string; phone: string }
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
