interface ICSOptions {
  summary: string;
  start: Date;
  durationMinutes: number;
  description?: string;
  location?: string;
}

const formatDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const generateICSFile = (options: ICSOptions): string => {
  const { summary, start, durationMinutes, description = '', location = '' } = options;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClubHub//ClubHub//EN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@clubhub.app`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
};