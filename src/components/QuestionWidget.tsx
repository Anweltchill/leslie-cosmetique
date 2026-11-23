import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Loader2, MessageCircleQuestion, Send, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from '@/lib/router';
import { track } from '@/lib/track';

const inputCls =
  'mt-1 w-full rounded-[12px] border border-sand bg-white-warm px-3.5 py-2.5 text-[14px] text-espresso placeholder:text-brown/50 transition-colors focus:border-caramel focus:outline-none';

/** Bulle « Une question ? » : formulaire enregistré dans le support du tableau de bord admin. */
export function QuestionWidget() {
  const { path } = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !done) firstField.current?.focus();
  }, [open, done]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Au-dessus de la barre d'achat fixe des pages d'offre (mobile et tablette).
  const lift = path.startsWith('/offres/') ? 'max-lg:bottom-[88px]' : '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    const { error: err } = await supabase.from('lc_questions').insert({
      full_name: form.fullName.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
      page: path.slice(0, 300),
    });
    setSending(false);
    if (err) {
      setError('L’envoi n’a pas abouti. Vérifiez vos informations puis réessayez.');
      return;
    }
    setDone(true);
    track('question_submit', { path });
  };

  const toggle = () => {
    setOpen((o) => {
      if (!o) track('question_widget_open', { path });
      return !o;
    });
  };

  return (
    <div className={`fixed bottom-5 right-5 z-[45] flex flex-col items-end gap-3 ${lift}`}>
      {open && (
        <div
          className="w-[min(360px,calc(100vw-40px))] overflow-hidden rounded-[22px] border border-sand bg-cream shadow-[0_30px_60px_-25px_rgba(58,42,34,0.55)]"
          role="dialog"
          aria-label="Poser une question"
        >
          <div className="flex items-start justify-between gap-3 bg-espresso px-5 py-4 text-white-warm">
            <div>
              <p className="font-serif-lc text-[21px] leading-tight">Une question ?</p>
              <p className="mt-0.5 text-[12.5px] text-sand">Écrivez-moi, je vous réponds personnellement par e-mail.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sand transition-colors hover:bg-white-warm/10 hover:text-white-warm"
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>

          {done ? (
            <div className="px-5 py-7 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#e3ecdf] text-[#3f6b3a]">
                <Check size={20} strokeWidth={2} aria-hidden />
              </span>
              <p className="mt-3 font-serif-lc text-[20px] text-espresso">Merci, c’est bien reçu !</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-brown">Je vous réponds par e-mail à {form.email}.</p>
              <button
                type="button"
                onClick={() => {
                  setDone(false);
                  setForm({ fullName: form.fullName, email: form.email, message: '' });
                }}
                className="link-line mt-4 text-[13px] font-medium text-espresso"
              >
                Poser une autre question
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3 px-5 py-4">
              <label className="block text-[12.5px] font-medium text-espresso">
                Nom
                <input
                  ref={firstField}
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={inputCls}
                  autoComplete="name"
                />
              </label>
              <label className="block text-[12.5px] font-medium text-espresso">
                E-mail
                <input
                  required
                  type="email"
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                  autoComplete="email"
                />
              </label>
              <label className="block text-[12.5px] font-medium text-espresso">
                Votre question
                <textarea
                  required
                  minLength={5}
                  maxLength={3000}
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${inputCls} resize-none`}
                />
              </label>
              {error && <p className="text-[12.5px] text-[#9b3b2a]">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-espresso px-5 py-3 text-[14px] font-medium text-white-warm transition-colors hover:bg-brown disabled:opacity-60"
              >
                {sending ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Send size={15} aria-hidden />}
                Envoyer ma question
              </button>
              <p className="text-center text-[11px] leading-snug text-brown">
                Vos coordonnées servent uniquement à vous répondre.
              </p>
            </form>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? 'Fermer le formulaire de question' : 'Poser une question'}
        data-track="question_widget"
        className="flex items-center gap-2 rounded-full bg-espresso py-3 pl-3.5 pr-4 text-[13.5px] font-medium text-white-warm shadow-[0_18px_40px_-15px_rgba(58,42,34,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brown"
      >
        {open ? <X size={18} strokeWidth={1.8} aria-hidden /> : <MessageCircleQuestion size={18} strokeWidth={1.8} aria-hidden />}
        <span className={open ? 'sr-only' : 'max-sm:sr-only'}>Une question ?</span>
      </button>
    </div>
  );
}
