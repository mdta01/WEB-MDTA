import { db } from '@/lib/db'

/**
 * JSON-LD Structured Data generator for SEO.
 *
 * Generates schema.org JSON-LD objects for:
 * 1. EducationalOrganization — for the madrasah itself (rich snippet in Google)
 * 2. Article — for each news article (enables "Top stories" carousel)
 * 3. Event — for upcoming events (enables Google Events rich result)
 * 4. FAQPage — for frequently asked questions (enables FAQ rich result)
 *
 * These schemas help search engines understand the content structure and
 * display rich snippets in search results (e.g. logo, breadcrumbs,
 * event dates, FAQ accordions directly in Google).
 *
 * Usage in layout.tsx:
 *   const orgSchema = await getOrganizationSchema()
 *   <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(orgSchema)}} />
 *
 * For dynamic content (news, events, FAQs), fetch in page server component
 * and render the schema inline.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mdta-tawangsari.vercel.app'

type SettingRecord = { key: string; value: string }

async function getSettingsMap(): Promise<Map<string, string>> {
  try {
    const settings = await db.siteSetting.findMany()
    return new Map(settings.map((s: SettingRecord) => [s.key, s.value]))
  } catch {
    return new Map()
  }
}

/**
 * EducationalOrganization schema — for the madrasah as an institution.
 * Enables Google to show logo, address, contact in Knowledge Panel.
 */
export async function getOrganizationSchema() {
  const settings = await getSettingsMap()
  const get = (key: string) => settings.get(key) || ''

  const name = get('madrasah_name') || 'MDTA Miftahul Ulum 01'
  const subtitle = get('madrasah_subtitle') || 'Madrasah Diniyah Takmiliyah Awaliyah'
  const address = get('madrasah_address') || 'Tawangsari, Pujon, Malang, Jawa Timur'
  const phone = get('madrasah_phone') || ''
  const email = get('madrasah_email') || ''
  const logo = get('madrasah_logo') || `${BASE_URL}/images/logo-madin-warna.webp`
  const website = BASE_URL
  const facebook = get('madrasah_facebook') || ''
  const instagram = get('madrasah_instagram') || ''
  const youtube = get('madrasah_youtube') || ''
  const tiktok = get('madrasah_tiktok') || ''
  const gpsLat = get('madrasah_gps_lat')
  const gpsLng = get('madrasah_gps_lng')
  const nsdt = get('madrasah_nsdt')
  const yayasan = get('madrasah_yayasan') || 'Yayasan Miftahul Ulum'

  const sameAs = [facebook, instagram, youtube, tiktok].filter(Boolean)

  const geo = gpsLat && gpsLng ? {
    '@type': 'GeoCoordinates',
    latitude: parseFloat(gpsLat),
    longitude: parseFloat(gpsLng),
  } : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${website}/#organization`,
    name,
    alternateName: subtitle,
    description: get('madrasah_description') || 'Madrasah Diniyah Takmiliyah Awaliyah yang mencetak generasi Muslim berilmu dan berakhlak mulia.',
    url: website,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
    image: logo,
    foundingDate: get('madrasah_history_year') || '1948',
    founder: {
      '@type': 'Organization',
      name: yayasan,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: address,
      addressLocality: 'Pujon',
      addressRegion: 'Jawa Timur',
      addressCountry: 'ID',
    },
    geo,
    telephone: phone,
    email,
    sameAs,
    identifier: nsdt ? { '@type': 'PropertyValue', name: 'NSDT', value: nsdt } : undefined,
  }
}

/**
 * WebSite schema — for the website itself (enables Sitelinks Search Box).
 */
export async function getWebsiteSchema() {
  const settings = await getSettingsMap()
  const name = settings.get('madrasah_name') || 'MDTA Miftahul Ulum 01'

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url: BASE_URL,
    name,
    description: 'Website resmi MDTA Miftahul Ulum 01 — Madrasah Diniyah Takmiliyah Awaliyah',
    publisher: { '@id': `${BASE_URL}/#organization` },
    inLanguage: 'id-ID',
  }
}

/**
 * Article schema — for a single news article.
 * Enables Google "Top stories" carousel and article rich snippets.
 */
export async function getArticleSchema(articleId: string) {
  try {
    const article = await db.news.findUnique({
      where: { id: articleId },
    })
    if (!article) return null

    const settings = await getSettingsMap()
    const orgName = settings.get('madrasah_name') || 'MDTA Miftahul Ulum 01'

    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.excerpt || article.content?.substring(0, 200),
      image: article.image ? [article.image] : undefined,
      datePublished: article.createdAt.toISOString(),
      dateModified: article.updatedAt.toISOString(),
      author: {
        '@type': 'Organization',
        name: orgName,
      },
      publisher: {
        '@type': 'Organization',
        name: orgName,
        logo: {
          '@type': 'ImageObject',
          url: settings.get('madrasah_logo') || `${BASE_URL}/images/logo-madin-warna.webp`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/#berita?id=${article.id}`,
      },
      articleSection: article.category,
    }
  } catch {
    return null
  }
}

/**
 * Event schema — for upcoming events.
 * Enables Google Events rich result (date, location in search).
 */
export async function getEventSchemas() {
  try {
    const events = await db.event.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 10,
    })

    return events.map(event => ({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.title,
      description: event.description || undefined,
      startDate: event.date.toISOString(),
      endDate: undefined,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: event.location || 'MDTA Miftahul Ulum 01',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Tawangsari, Pujon, Malang',
          addressRegion: 'Jawa Timur',
          addressCountry: 'ID',
        },
      },
      organizer: {
        '@type': 'EducationalOrganization',
        name: 'MDTA Miftahul Ulum 01',
        url: BASE_URL,
      },
    }))
  } catch {
    return []
  }
}

/**
 * FAQPage schema — for the FAQ section.
 * Enables Google to show FAQ accordions directly in search results.
 */
export async function getFAQSchema() {
  try {
    const faqs = await db.faq.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    })

    if (faqs.length === 0) return null

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }
  } catch {
    return null
  }
}

/**
 * BreadcrumbList schema — for breadcrumb navigation.
 * Enables Google to show breadcrumbs in search results.
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`,
    })),
  }
}
