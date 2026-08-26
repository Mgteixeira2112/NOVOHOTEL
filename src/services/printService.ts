export type PrintJob = { type: 'RECEIPT' | 'KITCHEN_TICKET' | 'ORDER' | 'CASH_CLOSING'; title: string; lines: string[] };

export interface PrintService { print(job: PrintJob): Promise<void>; }

/** Browser-safe default. Hardware adapters can be added later without changing domain/services. */
export const printService: PrintService = {
  async print(job) {
    const text = [job.title, ...job.lines].join('\n');
    if (typeof window === 'undefined') return;
    const popup = window.open('', '_blank', 'width=420,height=640');
    if (!popup) throw new Error('Não foi possível abrir a janela de impressão.');
    popup.document.write(`<pre style="font:14px monospace;white-space:pre-wrap;padding:16px">${text.replace(/[&<>]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c] ?? c))}</pre>`);
    popup.document.close(); popup.focus(); popup.print(); popup.close();
  },
};
