'use client';

import { ArrowRightIcon } from '@/shared/components/icons';

export function InvoicePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-shine inline-flex items-center justify-center gap-2 rounded-full bg-ink-950 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-ivory-50 shadow-soft transition-colors duration-300 hover:bg-brand-900 print:hidden"
    >
      Imprimer la facture
      <ArrowRightIcon className="h-3.5 w-3.5" />
    </button>
  );
}
