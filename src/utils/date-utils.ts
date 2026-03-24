import { format, parseISO } from 'date-fns';

/**
 * Converts a date to a string in Pacific Time for display.
 */
export function formatPT(date: Date | string, formatStr: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  
  // Create a formatter for PT
  const ptFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = ptFormatter.formatToParts(d);
  const partMap: Record<string, string> = {};
  parts.forEach(p => partMap[p.type] = p.value);

  // Construct a date that looks like the PT time in the local zone
  // This allows us to use date-fns format strings reliably
  const ptDate = new Date(
    parseInt(partMap.year),
    parseInt(partMap.month) - 1,
    parseInt(partMap.day),
    parseInt(partMap.hour) === 24 ? 0 : parseInt(partMap.hour),
    parseInt(partMap.minute),
    parseInt(partMap.second)
  );

  return format(ptDate, formatStr);
}

/**
 * Checks if a date has a specific time (not midnight PT).
 */
export function hasTimePT(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const ptHour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hour12: false }).format(d));
  const ptMinute = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', minute: 'numeric' }).format(d));
  
  return (ptHour !== 0 && ptHour !== 24) || ptMinute !== 0;
}

/**
 * Prepares a datetime string to be saved as a Pacific Time timestamp.
 * Handles both datetime-local (YYYY-MM-DDTHH:mm) and ISO strings.
 */
export function toPTISO(val: string): string {
  if (!val) return val;
  
  // If it's already an ISO string with Z or an offset, just return it
  if (val.includes('Z') || (val.includes('+') && val.lastIndexOf('+') > 10) || (val.includes('-') && val.lastIndexOf('-') > 10)) {
    return val;
  }

  const [date, time] = val.split('T');
  if (!date || !time) return val;

  // Clean time (remove seconds if they existed and we are adding them)
  const cleanTime = time.split(':')[0] + ':' + time.split(':')[1];
  
  const d = new Date(val);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'shortOffset'
  }).formatToParts(d);
  
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value;
  let offset = '-08:00';
  
  const match = offsetPart?.match(/[+-]\d{1,2}(?::\d{2})?/);
  if (match) {
    let raw = match[0];
    if (!raw.includes(':')) raw += ':00';
    if (raw.length === 5) raw = raw[0] + '0' + raw.slice(1);
    offset = raw;
  }

  return `${date}T${cleanTime}:00${offset}`;
}
