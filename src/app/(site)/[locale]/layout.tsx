import type { Metadata, Viewport } from 'next'
import '../../globals.css'
import { notFound } from 'next/navigation'
import { locales, isLocale, defaultLocale, type Locale } from '@/lib/i18n'
import { getDict } from '@/content'
import { pageMetadata, siteUrl } from '@/lib/seo'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ScrollEffects from '@/components/ScrollEffects'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const d = getDict(locale)
  return {
    ...pageMetadata({
      locale: isLocale(locale) ? locale : defaultLocale,
      path: '/',
      title: d.meta.title,
      description: d.meta.description,
    }),
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    applicationName: 'COREFIX PRO',
    icons: { icon: '/icon.svg' },
  }
}

const themeScript = `(function(){try{var q=location.search;var t=localStorage.getItem('cf-theme');if(q.indexOf('theme=dark')>-1){t='dark'}else if(q.indexOf('theme=light')>-1){t='light'}if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDict(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Nav locale={locale as Locale} dict={dict} />
        <main>{children}</main>
        <Footer locale={locale as Locale} dict={dict} />
        <ScrollEffects />
      </body>
    </html>
  )
}
