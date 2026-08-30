const pad2 = (value: number) => String(value).padStart(2, '0');

/**
 * Datas operacionais dos widgets seguem o calendário local do navegador.
 * toISOString() usa UTC e pode antecipar o dia em fusos negativos durante a noite.
 */
export const localDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const addLocalDays = (value: string, days: number) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
};

export const tomorrowLocalDateKey = () => addLocalDays(localDateKey(), 1);
