import { NFeData } from '../types';

export interface Gap {
  start: number;
  end: number;
}

export const findSequenceGaps = (invoices: NFeData[]): Map<number, Gap[]> => {
  const gapsBySeries = new Map<number, Gap[]>();
  const invoicesBySeries = new Map<number, number[]>();
  for (const invoice of invoices) {
    if (!invoicesBySeries.has(invoice.serie)) {
      invoicesBySeries.set(invoice.serie, []);
    }
    invoicesBySeries.get(invoice.serie)!.push(invoice.numero);
  }
  for (const [series, numbers] of invoicesBySeries.entries()) {
    if (numbers.length < 2) continue;
    const sortedUniqueNumbers = [...new Set(numbers)].sort((a, b) => a - b);
    const seriesGaps: Gap[] = [];
    for (let i = 0; i < sortedUniqueNumbers.length - 1; i++) {
      const current = sortedUniqueNumbers[i];
      const next = sortedUniqueNumbers[i + 1];
      if (next > current + 1) {
        seriesGaps.push({ start: current + 1, end: next - 1 });
      }
    }
    if (seriesGaps.length > 0) {
      gapsBySeries.set(series, seriesGaps);
    }
  }
  return gapsBySeries;
};
