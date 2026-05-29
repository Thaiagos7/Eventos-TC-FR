import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import escolaBg from '@/assets/escola-bg.jpg';
import logo from '@/assets/logo.png';

const transition = { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const };

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-8 md:py-12 lg:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="glass-panel rounded-[2.4rem] px-6 py-8 md:px-8 md:py-10 lg:px-10 lg:py-12"
        >
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
            <div className="max-w-3xl">
              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: 0.05 }}
                className="editorial-title max-w-3xl text-[clamp(3.05rem,8vw,6.3rem)] text-foreground"
              >
                Conecte-se aos <span className="gradient-text">eventos</span> da nossa escola!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: 0.05 }}
                className="mt-5 max-w-xl text-base leading-7 text-muted-foreground md:text-lg"
              >
                Descubra palestras, espetáculos, feiras e atividades académicas. Inscreva-se facilmente e acompanhe tudo num só lugar.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: 0.054 }}
                className="mt-7 flex flex-wrap items-center gap-4"
              >
                <Link to="/eventos">
                  <Button size="xl" className="group px-8">
                    Ver Eventos
                    <ArrowRight className="h-5 w-5 transition-transform duration-150 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <div className="paper-note max-w-[14rem] rotate-[-2deg] px-4 py-3 text-left shadow-sm">
                  <p className="font-display text-sm font-black uppercase tracking-[-0.03em] text-slate-900">
                    Garante o teu lugar.
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-800">
                    Participa sem complicações.
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="relative min-h-[15rem] lg:min-h-[23rem]">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: 0.08 }}
                className="paper-frame absolute left-0 top-4 w-[13rem] -rotate-6 md:w-[15rem] lg:left-4 lg:top-10"
              >
                <img src={escolaBg} alt="Alunos a participar numa atividade escolar" className="h-36 md:h-40 lg:h-44 object-[30%_50%]" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...transition, delay: 0.052 }}
                className="paper-frame absolute bottom-2 right-0 w-[12rem] rotate-[5deg] md:w-[15.5rem] lg:bottom-6 lg:right-4"
              >
                <img src={escolaBg} alt="Vista da escola" className="h-32 md:h-40 lg:h-44 object-[65%_50%]" />
              </motion.div>

              <div className="poster-sticker absolute left-[52%] top-[38%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 p-4 md:h-24 md:w-24 lg:left-[54%] lg:top-[44%]">
                <img src={logo} alt="" aria-hidden="true" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
