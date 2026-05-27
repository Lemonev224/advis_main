'use client';

import Link from 'next/link';
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLocale } from '@/lib/supabase/locale-context';
import { t } from '@/lib/supabase/i18n';

export function AuthNav() {
  const { locale } = useLocale();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-[#D7DEE7] bg-white/80 backdrop-blur-md z-50 px-6 flex items-center justify-between">
      <Link href="/landing" className="flex items-center gap-3">
        <div className="relative h-7 w-auto">
          <Image
            src="/logo.png"
            alt="Advisorly"
            width={105}
            height={28}
            className="h-7 w-auto object-contain"
            priority
          />
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <LanguageSwitcher variant="light" />
        <Link href="/login" className="text-sm font-semibold text-[#52637A] hover:text-[#0F172A] transition">
          {t(locale, 'auth.signIn')}
        </Link>
        <Link href="/request-access" className="inline-flex h-9 items-center justify-center rounded-sm bg-[#2C3E50] px-4 text-xs font-semibold text-white transition hover:bg-[#33495f]">
          {t(locale, 'auth.requestAccess')}
        </Link>
      </div>
    </header>
  );
}