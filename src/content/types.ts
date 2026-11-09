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

/** One step of "what we did" on a case detail page. */
export type CaseStep = { t: string; d: string }

/**
 * A customer service case. `slug` is the URL key and must be identical in every
 * dictionary — `content/index.ts` fails the build when the three locales drift.
 */
export type CaseStudy = {
  slug: string
  client: string
  device: string
  /** Short technical tag shown at the top-right of the card, e.g. 网络链路. */
  tag: string
  service: string
  /** Service window, already formatted for display. */
  date: string
  title: string
  summary: string
  /** The card shows the first two; the detail page shows all of them. */
  metrics: Metric[]
  challenge: string[]
  solution: CaseStep[]
  outcome: string[]
  quote?: { text: string; by: string }
}

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
  cases: {
    eyebrow: string
    title: string
    items: CaseStudy[]
    all: string
    /** Label on the card's detail link. */
    read: string
    detail: {
      back: string
      client: string
      device: string
      service: string
      date: string
      challenge: string
      solution: string
      outcome: string
      quote: string
      related: string
      allCases: string
    }
  }
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
    }
  }
}
