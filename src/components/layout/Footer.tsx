import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';
import footerLogo from '@/assets/footer-logo.png';

export function Footer() {
  return (
    <footer className="relative mt-14 overflow-hidden border-t border-foreground/10 bg-[#2863eb] text-white dark:bg-[#2863eb] dark:text-white">
      <div className="absolute inset-0 poster-grid-bg opacity-[0.12] dark:opacity-[0.05]" />
      <div className="container relative py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md md:flex md:items-center md:py-2">
            <Link
              to="/"
              className="inline-block"
              aria-label="Ir para a página inicial"
            >
              <img
                src={footerLogo}
                alt="Eventos TC"
                className="h-[5.25rem] w-auto object-contain md:h-[6.25rem]"
              />
            </Link>
          </div>

          <div className="flex flex-col gap-3 text-sm text-white/90 md:items-end">
            <a href="tel:+351289889570" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 transition-colors hover:bg-white/12 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]">
              <Phone className="h-4 w-4" />
              289-889-570
            </a>
            <a href="mailto:secretaria@agr-tc.pt" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 transition-colors hover:bg-white/12 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]">
              <Mail className="h-4 w-4" />
              secretaria@agr-tc.pt
            </a>
            <a href="mailto:direcao.agrupamento@agr-tc.pt" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2 transition-colors hover:bg-white/12 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]">
              <Mail className="h-4 w-4" />
              direcao.agrupamento@agr-tc.pt
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-4 text-xs uppercase tracking-[0.12em] text-white/56 dark:text-white/60">
          Copyright © {new Date().getFullYear()}. Agrupamento de Escolas Tomás Cabreira, em Faro.
        </div>
      </div>
    </footer>
  );
}
