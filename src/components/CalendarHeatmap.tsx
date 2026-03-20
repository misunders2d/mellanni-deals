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
      const pStart = parseISO(p.startDate);
      const pEnd = parseISO(p.endDate);
      
      const dateCopy = new Date(date);
      dateCopy.setHours(0, 0, 0, 0);
      const startCopy = new Date(pStart);
      startCopy.setHours(0, 0, 0, 0);
      const endCopy = new Date(pEnd);
      endCopy.setHours(23, 59, 59, 999);
      
      return isWithinInterval(dateCopy, { start: startCopy, end: endCopy });
    });
  };

  const getHeatmapColor = (promos: Promotion[]) => {
    if (promos.length === 0) return 'bg-transparent';
    const totalDiscount = promos.reduce((sum, p) => sum + p.discountPercent, 0);
    if (totalDiscount <= 15) return 'bg-emerald-100 border-emerald-200 text-emerald-900';
    if (totalDiscount <= 30) return 'bg-emerald-300 border-emerald-400 text-emerald-900';
    if (totalDiscount <= 50) return 'bg-emerald-500 border-emerald-600 text-white shadow-sm';
    return 'bg-emerald-700 border-emerald-800 text-white shadow-md font-semibold';
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
                  border transition-all group outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
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

                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900 text-white text-xs rounded-md shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <div className="font-semibold mb-1">{format(day, 'MMM d, yyyy')}</div>
                  {dayPromos.length > 0 ? dayPromos.map(p => (
                    <div key={p.id} className="flex justify-between items-start mb-1 leading-tight">
                      <span className="truncate pr-2">{p.productName}</span>
                      <span className="text-emerald-300 shrink-0 font-medium">{p.discountPercent}% OFF</span>
                    </div>
                  )) : (
                    <div className="text-gray-400">No promotions</div>
                  )}
                  <div className="text-[10px] text-gray-300 mt-2 border-t border-gray-700 pt-1 text-center">
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
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200"></div>~15% OFF</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-300 border border-emerald-400"></div>~30% OFF</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-600"></div>~50% OFF</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-700 border border-emerald-800"></div>50%+ OFF</span>
      </div>
    </div>
  );
}
