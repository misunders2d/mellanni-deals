"use client";

import { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  parseISO,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameDay
} from 'date-fns';
import { Promotion } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPT, hasTimePT } from '@/utils/date-utils';

interface CalendarHeatmapProps {
  promotions: Promotion[];
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
}

export default function CalendarHeatmap({ promotions, selectedDate, onDateSelect }: CalendarHeatmapProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getPromosForDay = (date: Date) => {
    return promotions.filter(p => {
      const pStartStr = formatPT(p.startDate, 'yyyy-MM-dd');
      const pEndStr = formatPT(p.endDate, 'yyyy-MM-dd');
      const dayStr = format(date, 'yyyy-MM-dd');
      
      return dayStr >= pStartStr && dayStr <= pEndStr;
    });
  };

  const getHeatmapColor = (promos: Promotion[]) => {
    if (promos.length === 0) return 'bg-transparent';
    const totalDiscount = promos.reduce((sum, p) => sum + p.discountPercent, 0);
    if (totalDiscount <= 15) return 'bg-discount-15 border-discount-30 text-primary';
    if (totalDiscount <= 30) return 'bg-discount-30 border-discount-50 text-white';
    if (totalDiscount <= 50) return 'bg-discount-50 border-discount-50-plus text-white shadow-sm';
    return 'bg-discount-50-plus border-discount-50-plus text-white shadow-md font-semibold';
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/50">
        <h2 className="text-xl font-serif font-medium text-primary">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-muted text-foreground transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-muted text-foreground transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center mb-4">
          {dayNames.map(day => (
            <div key={day} className="text-sm font-medium text-muted-foreground">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-2 gap-x-2">
          {days.map((day) => {
            const dayPromos = getPromosForDay(day);
            const colorClass = getHeatmapColor(dayPromos);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button 
                key={day.toString()} 
                onClick={() => onDateSelect?.(day)}
                className={`
                  relative h-14 md:h-20 rounded-lg flex flex-col items-center justify-center
                  border transition-all group outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:z-50
                  ${isCurrentMonth ? '' : 'opacity-40'}
                  ${colorClass === 'bg-transparent' ? 'border-transparent text-foreground hover:bg-slate-50' : colorClass + ' hover:brightness-110'}
                  ${isToday(day) && !isSelected ? 'ring-2 ring-primary/50 ring-offset-2' : ''}
                  ${isSelected ? 'ring-4 ring-primary ring-offset-2 scale-105 z-10 shadow-lg font-bold' : ''}
                `}
              >
                <span className="text-sm md:text-base">{format(day, 'd')}</span>
                
                {dayPromos.length > 0 && (
                  <div className="hidden md:flex flex-wrap gap-1 justify-center mt-1 w-full px-1">
                    {dayPromos.length === 1 ? (
                      <span className="text-[10px] truncate w-full text-center px-1 rounded-sm bg-black/10 backdrop-blur-sm">
                        {dayPromos[0].discountPercent}% OFF
                      </span>
                    ) : (
                      <span className="text-[10px] truncate w-full text-center px-1 rounded-sm bg-black/10 backdrop-blur-sm">
                        {dayPromos.length} Promos
                      </span>
                    )}
                  </div>
                )}

                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-gray-900 text-white text-xs rounded-md shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <div className="font-semibold mb-1">{format(day, 'MMM d, yyyy')}</div>
                  {dayPromos.length > 0 ? dayPromos.map(p => {
                    const hasTime = hasTimePT(p.startDate);
                    const pStartDayStr = formatPT(p.startDate, 'yyyy-MM-dd');
                    const currentDayStr = format(day, 'yyyy-MM-dd');
                    const isSameDay = pStartDayStr === currentDayStr;
                    const startedEarlier = pStartDayStr < currentDayStr;

                    return (
                      <div key={p.id} className="flex flex-col mb-2 border-b border-gray-800 last:border-0 pb-1.5 last:pb-0">
                        <div className="flex justify-between items-start leading-tight">
                          <span className="truncate pr-2 font-medium">{p.productName}</span>
                          <span className="text-emerald-300 shrink-0 font-bold">{p.discountPercent}% OFF</span>
                        </div>
                        {hasTime && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            <span className="font-medium text-gray-300">
                              {isSameDay ? 'Starts: ' : 'Started: '}
                            </span>
                            {startedEarlier && (
                              <span className="text-gray-300">{formatPT(p.startDate, 'MMM d')}, </span>
                            )}
                            {formatPT(p.startDate, 'h:mm a')} PT
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="text-gray-400">No promotions</div>
                  )}
                  <div className="text-[10px] text-gray-300 mt-2 border-t border-gray-700 pt-2 text-center">
                    Click anywhere on this day to filter
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="px-6 py-4 bg-slate-50/50 border-t border-border flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-transparent border border-border"></div>None</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-discount-15 border border-discount-30"></div>~15% OFF</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-discount-30 border border-discount-50"></div>~30% OFF</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-discount-50 border border-discount-50-plus"></div>~50% OFF</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-discount-50-plus border border-discount-50-plus"></div>50%+ OFF</span>
      </div>
    </div>
  );
}
