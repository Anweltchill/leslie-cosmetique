import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { isBookableDay, sameDay, slotsForDay, startOfDay } from '@/lib/booking';
import { site } from '@/data/site';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
export const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

interface Props {
  month: Date;
  onMonthChange: (m: Date) => void;
  day: Date | null;
  onDayChange: (d: Date) => void;
  slot: Date | null;
  onSlotChange: (s: Date) => void;
  taken: Set<number>;
  loading: boolean;
  loadError: boolean;
}

export function BookingCalendar({ month, onMonthChange, day, onDayChange, slot, onSlotChange, taken, loading, loadError }: Props) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  const thisMonth = startOfDay(new Date());
  thisMonth.setDate(1);
  const canPrev = first > thisMonth;
  const lastBookable = new Date();
  lastBookable.setDate(lastBookable.getDate() + site.booking.maxDaysAhead);
  const canNext = new Date(month.getFullYear(), month.getMonth() + 1, 1) <= lastBookable;

  const freeCount = (d: Date) => slotsForDay(d).filter((s) => !taken.has(s.getTime())).length;
  const daySlots = day ? slotsForDay(day) : [];
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_220px]">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-serif-lc text-[22px] capitalize text-espresso">{monthFmt.format(month)}</h3>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              aria-label="Mois précédent"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-sand text-espresso transition-colors hover:bg-nude disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              aria-label="Mois suivant"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-sand text-espresso transition-colors hover:bg-nude disabled:cursor-not-allowed disabled:opacity-35"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
          {WEEKDAYS.map((w) => (
            <span key={w} className="pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-brown">{w}</span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const bookable = isBookableDay(d) && (loading || freeCount(d) > 0);
            const selected = day && sameDay(d, day);
            return (
              <button
                key={d.toISOString()}
                type="button"
                disabled={!bookable}
                onClick={() => onDayChange(d)}
                aria-pressed={!!selected}
                aria-label={dayFmt.format(d)}
                className={`relative flex aspect-square items-center justify-center rounded-[12px] text-[14px] font-medium transition-all duration-200 ${
                  selected
                    ? 'bg-espresso text-white-warm shadow-md'
                    : bookable
                      ? 'bg-nude/60 text-espresso hover:-translate-y-0.5 hover:bg-sand'
                      : 'cursor-not-allowed text-brown/40'
                }`}
              >
                {d.getDate()}
                {bookable && !selected && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-caramel" aria-hidden />}
              </button>
            );
          })}
        </div>
        {loadError && (
          <p className="mt-3 text-[13px] text-[#9b3b2a]">Impossible de charger les disponibilités. Rechargez la page pour réessayer.</p>
        )}
      </div>

      <div className="rounded-[16px] border border-sand/70 bg-cream p-4">
        <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-brown">
          {day ? dayFmt.format(day) : 'Choisissez un jour'}
        </p>
        <p className="mt-1 text-[11.5px] text-brown">Heure locale ({tz})</p>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-1">
          {loading && (
            <span className="col-span-2 flex items-center gap-2 text-[13px] text-brown md:col-span-1">
              <Loader2 size={14} className="animate-spin" aria-hidden /> Chargement
            </span>
          )}
          {!loading && !day && <span className="col-span-2 text-[13px] leading-snug text-brown md:col-span-1">Les jours disponibles sont marqués d’un point.</span>}
          {!loading && daySlots.map((s) => {
            const isTaken = taken.has(s.getTime());
            const isSel = slot?.getTime() === s.getTime();
            return (
              <button
                key={s.toISOString()}
                type="button"
                disabled={isTaken}
                onClick={() => onSlotChange(s)}
                aria-pressed={isSel}
                className={`rounded-full border px-3 py-2 text-[13.5px] font-medium transition-all duration-200 ${
                  isSel
                    ? 'border-espresso bg-espresso text-white-warm'
                    : isTaken
                      ? 'cursor-not-allowed border-sand/50 text-brown/40 line-through'
                      : 'border-sand bg-white-warm text-espresso hover:border-caramel hover:bg-nude/50'
                }`}
              >
                {timeFmt.format(s)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
