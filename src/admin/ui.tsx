import { useEffect, useRef, useState, type ReactNode } from 'react';
import { num } from './format';

export function Card({ title, action, children, className = '' }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[18px] border border-sand/70 bg-white-warm p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-serif-lc text-[20px] leading-tight text-espresso">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint, tone = 'light' }: { label: string; value: string; hint?: string; tone?: 'light' | 'dark' }) {
  const dark = tone === 'dark';
  return (
    <div className={`rounded-[16px] p-4 ${dark ? 'bg-espresso text-white-warm' : 'border border-sand/70 bg-white-warm text-espresso'}`}>
      <p className={`text-[11px] font-medium uppercase tracking-[0.14em] ${dark ? 'text-sand' : 'text-brown'}`}>{label}</p>
      <p className="mt-2 font-serif-lc text-[30px] font-medium leading-none tabular-nums">{value}</p>
      {hint && <p className={`mt-1.5 text-[12px] ${dark ? 'text-sand' : 'text-brown'}`}>{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-[14px] border border-dashed border-sand bg-cream px-4 py-6 text-center text-[13.5px] text-brown">{children}</p>;
}

export function Badge({ tone, children }: { tone: 'grey' | 'gold' | 'green' | 'red' | 'dark'; children: ReactNode }) {
  const cls = {
    grey: 'bg-nude text-espresso',
    gold: 'bg-[#f3e3c4] text-[#7a4f12]',
    green: 'bg-[#e3ecdf] text-[#3f6b3a]',
    red: 'bg-[#f4dcd6] text-[#9b3b2a]',
    dark: 'bg-espresso text-white-warm',
  }[tone];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-medium ${cls}`}>{children}</span>;
}

/** Largeur réelle d'un élément (pour dessiner les graphiques au pixel près). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Courbe ou histogramme simple (SVG), pour les séries quotidiennes/mensuelles. */
export function Chart({
  points,
  type = 'area',
  height = 190,
  format = num,
}: {
  points: { label: string; value: number }[];
  type?: 'area' | 'bars';
  height?: number;
  format?: (n: number) => string;
}) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const H = height;
  const pad = { l: 6, r: 6, t: 12, b: 26 };
  const max = Math.max(1, ...points.map((p) => p.value));
  const n = points.length;
  const innerW = Math.max(1, W - pad.l - pad.r);
  const x = (i: number) => (type === 'bars' ? pad.l + ((i + 0.5) * innerW) / n : pad.l + (n <= 1 ? innerW / 2 : (i * innerW) / (n - 1)));
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const maxLabels = Math.max(2, Math.floor(W / 70));
  const step = Math.max(1, Math.ceil(n / maxLabels));
  const total = points.reduce((s, p) => s + p.value, 0);

  if (!n) return <Empty>Pas encore de données.</Empty>;

  return (
    <div ref={ref}>
      {W > 0 && (
        <svg width={W} height={H} className="block" role="img" aria-label={`Total : ${format(total)}`}>
          {[0.25, 0.5, 0.75, 1].map((g) => (
            <line key={g} x1={pad.l} x2={W - pad.r} y1={y(max * g)} y2={y(max * g)} stroke="#EADBC8" strokeWidth="1" />
          ))}
          {type === 'bars'
            ? points.map((p, i) => {
                const bw = Math.max(4, Math.min(36, (innerW / n) * 0.6));
                return (
                  <rect key={i} x={x(i) - bw / 2} y={y(p.value)} width={bw} height={Math.max(0, H - pad.b - y(p.value))} rx="3" fill="#96633F">
                    <title>{`${p.label} : ${format(p.value)}`}</title>
                  </rect>
                );
              })
            : (
              <>
                <path d={`M ${x(0)} ${H - pad.b} ${points.map((p, i) => `L ${x(i)} ${y(p.value)}`).join(' ')} L ${x(n - 1)} ${H - pad.b} Z`} fill="#96633F" opacity="0.12" />
                <path d={points.map((p, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(p.value)}`).join(' ')} fill="none" stroke="#96633F" strokeWidth="2" strokeLinejoin="round" />
                {points.map((p, i) => (
                  <circle key={i} cx={x(i)} cy={y(p.value)} r={n > 45 ? 0 : 2.5} fill="#96633F">
                    <title>{`${p.label} : ${format(p.value)}`}</title>
                  </circle>
                ))}
              </>
            )}
          {points.map((p, i) => {
            if (i % step !== 0 && i !== n - 1) return null;
            if (i === n - 1 && i % step !== 0 && n - 1 - Math.floor((n - 1) / step) * step < step / 2) return null;
            const anchor = type === 'bars' ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
            return (
              <text key={`l${i}`} x={x(i)} y={H - 8} textAnchor={anchor} fontSize="11" fill="#6B4A38">
                {p.label}
              </text>
            );
          })}
        </svg>
      )}
      <p className="mt-1 text-right text-[11.5px] text-brown">Max : {format(max)}</p>
    </div>
  );
}

/** Barres horizontales de répartition (sources, offres…). */
export function Split({ rows, format = num }: { rows: { label: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <Empty>Pas encore de données.</Empty>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-[13px] text-espresso">
            <span className="min-w-0 truncate">{r.label}</span>
            <span className="shrink-0 font-medium tabular-nums">{format(r.value)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-nude">
            <div className="h-1.5 rounded-full bg-caramel" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

