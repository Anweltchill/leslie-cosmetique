import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { track } from '@/lib/track';

interface Item {
  q: string;
  a: string;
}

export function FaqAccordion({ items, idPrefix = 'faq' }: { items: Item[]; idPrefix?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      el.style.maxHeight = open === i ? `${el.scrollHeight}px` : '0px';
    });
  }, [open]);

  return (
    <div className="divide-y divide-sand/70 border-y border-sand/70">
      {items.map((item, i) => {
        const openId = open === i;
        return (
          <div key={i}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-6 py-4 text-left"
              aria-expanded={openId}
              aria-controls={`${idPrefix}-panel-${i}`}
              id={`${idPrefix}-btn-${i}`}
              onClick={() => {
                const next = openId ? null : i;
                setOpen(next);
                if (next !== null) track('faq_open', { question: item.q });
              }}
            >
              <span className="font-serif-lc text-[17px] leading-snug text-espresso md:text-[18px]">{item.q}</span>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sand text-brown transition-all duration-300 ${
                  openId ? 'rotate-45 border-espresso bg-espresso text-cream' : ''
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
              <p className="max-w-[620px] pb-5 text-[14px] leading-relaxed text-brown">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
