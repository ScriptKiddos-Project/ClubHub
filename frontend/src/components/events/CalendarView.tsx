import React from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
});

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  color?: string;
}

interface Props {
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
}

export const CalendarView: React.FC<Props> = ({ events, onEventClick }) => {
  const calEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: new Date(e.date),
    end: new Date(e.date),
    resource: e.color,
  }));

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm" style={{ height: 600 }}>
      <Calendar
        localizer={localizer}
        events={calEvents}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        onSelectEvent={(event: { id: string; title: string; start: Date; end: Date; resource?: string }) => onEventClick?.(event.id)}
eventPropGetter={(event: { id: string; title: string; start: Date; end: Date; resource?: string }) => ({
          style: {
            backgroundColor: event.resource ?? '#6366f1',
            borderRadius: '6px',
            border: 'none',
            color: 'white',
            fontSize: '12px',
          },
        })}
        style={{ fontFamily: 'inherit' }}
      />
    </div>
  );
};