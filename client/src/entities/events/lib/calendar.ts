export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getDays(year: number, month: number): { date: Date; current: boolean }[] {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday = 0
  const days: { date: Date; current: boolean }[] = [];

  for (let i = -startDay; days.length < 42; i++) {
    const d = new Date(year, month, 1 + i);
    days.push({ date: d, current: d.getMonth() === month });
  }
  return days;
}
