import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { track } from '@/lib/track';

interface Module {
  title: string;
  text: string;
}

/** Programme en modules numérotés : un seul module ouvert à la fois. */
export function ModulesAccordion({ modules, idPrefix = 'module', offerSlug }: { modules: Module[]; idPrefix?: string; offerSlug?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      el.style.maxHeight = open === i ? `${el.scrollHeight}px` : '0px';
    });
  }, [open]);

  return (
    <ol className="divide-y divide-sand/70 border-y border-sand/70">
      {modules.map((m, i) => {
        const isOpen = open === i;
        const num = String(i + 1).padStart(2, '0');
        return (
          <li key={m.title}>
            <button
              type="button"
              className="group flex w-full items-center gap-4 py-4 text-left"
              aria-expanded={isOpen}
              aria-controls={`${idPrefix}-panel-${i}`}
              id={`${idPrefix}-btn-${i}`}
              data-track={`module_${i + 1}`}
              onClick={() => {
                const next = isOpen ? null : i;
                setOpen(next);
                if (next !== null) track('module_open', { module: i + 1, title: m.title, offer: offerSlug });
              }}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif-lc text-[16px] transition-colors duration-300 ${
                  isOpen ? 'bg-espresso text-white-warm' : 'bg-nude text-espresso group-hover:bg-sand'
                }`}
                aria-hidden
              >
                {num}
              </span>
              <span className="flex-1 font-serif-lc text-[17px] leading-snug text-espresso md:text-[18px]">
                <span className="sr-only">Module {i + 1} : </span>
                {m.title}
              </span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand text-brown transition-all duration-300 ${
                  isOpen ? 'rotate-45 border-espresso bg-espresso text-cream' : ''
                }`}
                aria-hidden
              >
                <Plus size={16} strokeWidth={1.8} />
              </span>
            </button>
            <div
              ref={(el) => { refs.current[i] = el; }}
              id={`${idPrefix}-panel-${i}`}
              role="region"
              aria-labelledby={`${idPrefix}-btn-${i}`}
              className="overflow-hidden transition-[max-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ maxHeight: 0 }}
            >
              <p className="max-w-[620px] pb-5 pl-14 text-[14px] leading-relaxed text-brown">{m.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
