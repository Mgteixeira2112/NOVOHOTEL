/**
 * Utilitário central de datas operacionais e formatação para o Hotel OS.
 * Garante que todos os módulos utilizem o fuso horário oficial (America/Sao_Paulo)
 * e regras consistentes de período sem hardcoding.
 */

export function getOperationalTodayStr(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function isDateToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return dateStr.slice(0, 10) === getOperationalTodayStr();
}

export function getOperationalDateRange(preset: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'previous_month' | 'year'): { start: string; end: string } {
  const today = getOperationalTodayStr();
  const d = new Date(`${today}T12:00:00`);

  const shift = (days: number) => {
    const target = new Date(d);
    target.setDate(target.getDate() + days);
    return target.toISOString().slice(0, 10);
  };

  switch (preset) {
    case 'yesterday':
      return { start: shift(-1), end: today };
    case '7d':
      return { start: shift(-6), end: shift(1) };
    case '30d':
      return { start: shift(-29), end: shift(1) };
    case 'month':
      return { start: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`, end: shift(1) };
    case 'previous_month': {
      const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const last = new Date(d.getFullYear(), d.getMonth(), 1);
      return { start: first.toISOString().slice(0, 10), end: last.toISOString().slice(0, 10) };
    }
    case 'year':
      return { start: `${today.slice(0, 4)}-01-01`, end: shift(1) };
    case 'today':
    default:
      return { start: today, end: shift(1) };
  }
}
