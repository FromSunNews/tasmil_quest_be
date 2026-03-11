import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const isYesterdayUTC = (date: Date | null | undefined): boolean => {
  if (!date) return false;
  const now = dayjs().utc().startOf('day');
  const compare = dayjs(date).utc().startOf('day');
  return compare.add(1, 'day').isSame(now);
};

