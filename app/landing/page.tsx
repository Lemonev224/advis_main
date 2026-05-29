'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Shield,
  CheckCircle2,
  ClipboardList,
  FolderLock,
  Users,
  AlertTriangle,
  FileText,
  ArrowRight,
  Menu,
  X,
  TrendingUp,
  ChevronRight,
  Search,
  BarChart3,
} from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLocale } from '@/lib/supabase/locale-context';
import { t } from '@/lib/supabase/i18n';

function LogoLockup({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${small ? 'h-8' : 'h-12'} w-auto`}>
        <Image
          src="/logo.png"
          alt="Advisorly"
          height={small ? 32 : 48}
          width={small ? 96 : 144}
          className="object-contain h-full w-auto"
          priority
        />
      </div>
    </div>
  );
}

function HeroScreen() {
  return (
    <div className="relative mx-auto mt-14 max-w-5xl">
      <div className="rounded-[24px] border border-gray-300 bg-[#111827] p-3 shadow-[0_30px_70px_rgba(15,23,42,0.14)]">
        <div className="overflow-hidden rounded-[16px] border border-gray-700 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
            </div>
            <div className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-500">
              Live compliance dashboard
            </div>
          </div>
          <div className="bg-[linear-gradient(to_bottom_right,#f8fafc,#eef2f7)]">
            <Image
              src="/dash.png"
              alt="Advisorly Dashboard"
              width={1200}
              height={675}
              className="h-auto w-full"
              priority
            />
          </div>
        </div>
      </div>
      <div className="mx-auto h-4 w-[72%] rounded-b-[999px] bg-gray-300" />
      <div className="mx-auto h-3 w-[18%] rounded-b-md bg-gray-400" />
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { locale } = useLocale();

  const features = [
    { icon: ClipboardList, title: t(locale, 'landing.feat1Title'), desc: t(locale, 'landing.feat1Desc') },
    { icon: FolderLock,    title: t(locale, 'landing.feat2Title'), desc: t(locale, 'landing.feat2Desc') },
    { icon: Users,         title: t(locale, 'landing.feat3Title'), desc: t(locale, 'landing.feat3Desc') },
    { icon: AlertTriangle, title: t(locale, 'landing.feat4Title'), desc: t(locale, 'landing.feat4Desc') },
    { icon: FileText,      title: t(locale, 'landing.feat5Title'), desc: t(locale, 'landing.feat5Desc') },
    { icon: Shield,        title: t(locale, 'landing.feat6Title'), desc: t(locale, 'landing.feat6Desc') },
  ];

  const positioningBlocks = [
    { title: t(locale, 'landing.pos1Title'), desc: t(locale, 'landing.pos1Desc') },
    { title: t(locale, 'landing.pos2Title'), desc: t(locale, 'landing.pos2Desc') },
    { title: t(locale, 'landing.pos3Title'), desc: t(locale, 'landing.pos3Desc') },
  ];

  const tableRows = [
    [t(locale, 'landing.tableRow1Area'), t(locale, 'landing.tableRow1Solves'), t(locale, 'landing.tableRow1Out')],
    [t(locale, 'landing.tableRow2Area'), t(locale, 'landing.tableRow2Solves'), t(locale, 'landing.tableRow2Out')],
    [t(locale, 'landing.tableRow3Area'), t(locale, 'landing.tableRow3Solves'), t(locale, 'landing.tableRow3Out')],
    [t(locale, 'landing.tableRow4Area'), t(locale, 'landing.tableRow4Solves'), t(locale, 'landing.tableRow4Out')],
    [t(locale, 'landing.tableRow5Area'), t(locale, 'landing.tableRow5Solves'), t(locale, 'landing.tableRow5Out')],
  ];

  const plans = [
    {
      name: t(locale, 'landing.plan1Name'),
      price: t(locale, 'landing.plan1Price'),
      period: t(locale, 'landing.plan1Period'),
      desc: t(locale, 'landing.plan1Desc'),
      features: [
        t(locale, 'landing.plan1f1'), t(locale, 'landing.plan1f2'), t(locale, 'landing.plan1f3'),
        t(locale, 'landing.plan1f4'), t(locale, 'landing.plan1f5'),
      ],
      cta: t(locale, 'landing.plan1Cta'),
      highlighted: false,
    },
    {
      name: t(locale, 'landing.plan2Name'),
      price: t(locale, 'landing.plan2Price'),
      period: t(locale, 'landing.plan2Period'),
      desc: t(locale, 'landing.plan2Desc'),
      features: [
        t(locale, 'landing.plan2f1'), t(locale, 'landing.plan2f2'), t(locale, 'landing.plan2f3'),
        t(locale, 'landing.plan2f4'), t(locale, 'landing.plan2f5'),
      ],
      cta: t(locale, 'landing.plan2Cta'),
      highlighted: true,
    },
    {
      name: t(locale, 'landing.plan3Name'),
      price: t(locale, 'landing.plan3Price'),
      period: t(locale, 'landing.plan3Period'),
      desc: t(locale, 'landing.plan3Desc'),
      features: [
        t(locale, 'landing.plan3f1'), t(locale, 'landing.plan3f2'), t(locale, 'landing.plan3f3'),
        t(locale, 'landing.plan3f4'), t(locale, 'landing.plan3f5'),
      ],
      cta: t(locale, 'landing.plan3Cta'),
      highlighted: false,
    },
  ];

  const faqs = [
    [t(locale, 'landing.faq1Q'), t(locale, 'landing.faq1A')],
    [t(locale, 'landing.faq2Q'), t(locale, 'landing.faq2A')],
    [t(locale, 'landing.faq3Q'), t(locale, 'landing.faq3A')],
    [t(locale, 'landing.faq4Q'), t(locale, 'landing.faq4A')],
  ];

  const trustItems = [
    { icon: Shield,   text: t(locale, 'landing.trust1') },
    { icon: Search,   text: t(locale, 'landing.trust2') },
    { icon: TrendingUp, text: t(locale, 'landing.trust3') },
    { icon: BarChart3,  text: t(locale, 'landing.trust4') },
  ];

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-gray-800">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <LogoLockup />
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="transition hover:text-gray-900">{t(locale, 'landing.navFeatures')}</a>
            <a href="#platform" className="transition hover:text-gray-900">{t(locale, 'landing.navPlatform')}</a>
            <a href="#pricing"  className="transition hover:text-gray-900">{t(locale, 'landing.navPricing')}</a>
            <a href="#faq"      className="transition hover:text-gray-900">{t(locale, 'landing.navFaq')}</a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
              {t(locale, 'landing.signIn')}
            </Link>
            <Link href="/request-access" className="rounded-sm bg-gray-800 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-gray-900">
              {t(locale, 'landing.bookDemo')}
            </Link>
            <LanguageSwitcher variant="light" />
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600 hover:text-gray-900 md:hidden">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
            <div className="space-y-3 text-sm font-medium text-gray-600">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-gray-900">{t(locale, 'landing.navFeatures')}</a>
              <a href="#platform" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-gray-900">{t(locale, 'landing.navPlatform')}</a>
              <a href="#pricing"  onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-gray-900">{t(locale, 'landing.navPricing')}</a>
              <a href="#faq"      onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-gray-900">{t(locale, 'landing.navFaq')}</a>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-200 pt-4">
              <Link href="/login" className="rounded-sm border border-gray-300 py-2 text-center text-sm font-semibold text-gray-700">
                {t(locale, 'landing.signIn')}
              </Link>
              <Link href="/request-access" className="rounded-sm bg-gray-800 py-2 text-center text-sm font-bold text-white">
                {t(locale, 'landing.bookDemo')}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-[linear-gradient(to_bottom,#ffffff,#f3f6f8)] px-4 pb-20 pt-14 md:pb-24 md:pt-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-100/45 blur-3xl" />
          <div className="absolute left-[10%] top-[120px] h-40 w-40 rounded-full border border-cyan-100/80 opacity-70" />
          <div className="absolute right-[8%] top-[180px] h-56 w-56 rounded-full border border-gray-200 opacity-80" />
          <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(to_bottom,rgba(255,255,255,0.72),rgba(243,246,248,0.92))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.06),transparent_34%)]" />
        </div>
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-800">
              {t(locale, 'landing.builtFor')}
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-[60px] lg:leading-[1.04]">
              {t(locale, 'landing.heroTitle')}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600 sm:text-xl">
              {t(locale, 'landing.heroSub')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/request-access" className="inline-flex items-center justify-center gap-2 rounded-sm bg-gray-800 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-gray-900">
                {t(locale, 'landing.bookDemo')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#platform" className="inline-flex items-center justify-center gap-2 rounded-sm border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50">
                {t(locale, 'landing.seeHowItWorks')}
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-gray-500">
              <span className="rounded-full border border-gray-300 bg-white px-3 py-1.5">{t(locale, 'landing.tag1')}</span>
              <span className="rounded-full border border-gray-300 bg-white px-3 py-1.5">{t(locale, 'landing.tag2')}</span>
              <span className="rounded-full border border-gray-300 bg-white px-3 py-1.5">{t(locale, 'landing.tag3')}</span>
            </div>
          </div>
          <HeroScreen />
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-gray-200 bg-white px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
          {trustItems.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-cyan-700" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">{t(locale, 'landing.featuresLabel')}</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{t(locale, 'landing.featuresTitle')}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">{t(locale, 'landing.featuresSub')}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-gray-800 text-white shadow-sm">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-800">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform */}
      <section id="platform" className="border-y border-gray-200 bg-white px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-sm border border-gray-200 bg-[#F8FAFB] p-8 shadow-sm min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">{t(locale, 'landing.platformLabel')}</div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 break-words">{t(locale, 'landing.platformTitle')}</h2>
              <p className="mt-4 text-base leading-7 text-gray-600">{t(locale, 'landing.platformSub')}</p>
              <div className="mt-8 space-y-4">
                {positioningBlocks.map((block) => (
                  <div key={block.title} className="rounded-sm border border-gray-200 bg-white p-5">
                    <div className="text-base font-bold text-gray-800">{block.title}</div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{block.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-sm border border-gray-200 bg-white shadow-sm min-w-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
                <div className="text-sm font-bold text-gray-800">{t(locale, 'landing.tableHeader')}</div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">{t(locale, 'landing.tableLabel')}</span>
              </div>
              <div className="w-full overflow-x-auto">
  <table className="w-full min-w-[500px] text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-200 bg-white text-[11px] uppercase tracking-wider text-gray-500">
                      <th className="px-5 py-3 font-bold">{t(locale, 'landing.tableColArea')}</th>
                      <th className="px-5 py-3 font-bold">{t(locale, 'landing.tableColSolves')}</th>
                      <th className="px-5 py-3 font-bold">{t(locale, 'landing.tableColOutcome')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tableRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-bold text-gray-800">{row[0]}</td>
                        <td className="px-5 py-4 text-gray-600">{row[1]}</td>
                        <td className="px-5 py-4 text-gray-600">{row[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
     

      {/* FAQ */}
      <section id="faq" className="border-t border-gray-200 bg-white px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">{t(locale, 'landing.faqLabel')}</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{t(locale, 'landing.faqTitle')}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <div key={question} className="rounded-sm border border-gray-200 bg-[#F8FAFB] p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-800">{question}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl rounded-sm border border-gray-200 bg-white px-8 py-10 shadow-sm md:px-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">{t(locale, 'landing.ctaLabel')}</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{t(locale, 'landing.ctaTitle')}</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">{t(locale, 'landing.ctaSub')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/request-access" className="inline-flex items-center justify-center gap-2 rounded-sm bg-gray-800 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-gray-900">
                {t(locale, 'landing.bookDemo')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-sm border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50">
                {t(locale, 'landing.signIn')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8 text-sm text-gray-500">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <LogoLockup small />
          <div className="flex flex-wrap gap-5 font-medium">
            <a href="#features" className="transition hover:text-gray-800">{t(locale, 'landing.navFeatures')}</a>
            <a href="#platform" className="transition hover:text-gray-800">{t(locale, 'landing.navPlatform')}</a>
            <a href="#pricing"  className="transition hover:text-gray-800">{t(locale, 'landing.navPricing')}</a>
            <a href="#faq"      className="transition hover:text-gray-800">{t(locale, 'landing.navFaq')}</a>
            <Link href="/login"           className="transition hover:text-gray-800">{t(locale, 'landing.signIn')}</Link>
            <Link href="/request-access"  className="transition hover:text-gray-800">{t(locale, 'landing.bookDemo')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}