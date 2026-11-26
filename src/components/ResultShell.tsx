import type { ReactNode } from 'react';

/** Encadré centré des pages de retour (paiement, confirmation). */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-cream pb-20 pt-32 md:pt-40">
      <div className="mx-auto max-w-[640px] px-5">
        <div className="rounded-[24px] border border-sand/70 bg-white-warm px-6 py-10 text-center shadow-[0_24px_50px_-36px_rgba(107,74,56,0.45)] md:px-10 md:py-12">
          {children}
        </div>
      </div>
    </div>
  );
}
