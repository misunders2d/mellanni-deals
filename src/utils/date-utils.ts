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
 * Prepares a datetime-local string to be saved as a Pacific Time timestamp.
 */
export function toPTISO(datetimeLocal: string): string {
  const [date, time] = datetimeLocal.split('T');
  // We append the PT offset. This is approximate but works for most cases
  // Better: use Intl to get current PT offset
  const d = new Date(datetimeLocal);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'shortOffset'
  }).formatToParts(d);
  
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value; // e.g. "GMT-7"
  let offset = '-08:00'; // Default PST
  if (offsetPart?.includes('-7') || offsetPart?.includes('−7')) offset = '-07:00';
  if (offsetPart?.includes('-8') || offsetPart?.includes('−8')) offset = '-08:00';
  
  // Note: Intl might return "GMT-07:00" or similar
  const match = offsetPart?.match(/[+-]\d{1,2}(:\d{2})?/);
  if (match) {
    let raw = match[0];
    if (!raw.includes(':')) raw += ':00';
    if (raw.length === 5) raw = raw[0] + '0' + raw.slice(1); // +7:00 -> +07:00
    offset = raw;
  }

  return `${date}T${time}:00${offset}`;
}
