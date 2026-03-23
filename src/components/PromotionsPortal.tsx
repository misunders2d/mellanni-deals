"use client";

import { useState, useRef } from 'react';
import { Promotion } from '@/types';
import CalendarHeatmap from './CalendarHeatmap';
import PromotionList from './PromotionList';
import { formatPT } from '@/utils/date-utils';
import { format } from 'date-fns';

export default function PromotionsPortal({ initialPromotions }: { initialPromotions: Promotion[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleDateSelect = (date: Date) => {
    // If clicking same date, toggle off
    if (selectedDate && selectedDate.getTime() === date.getTime()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
      // Give UI a tiny tick to adjust the filter, then scroll down to the product list
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  // Filter promotions by the selected calendar date
  const filteredPromotions = selectedDate 
    ? initialPromotions.filter(p => {
        const pStartStr = formatPT(p.startDate, 'yyyy-MM-dd');
        const pEndStr = formatPT(p.endDate, 'yyyy-MM-dd');
        const selectedStr = format(selectedDate, 'yyyy-MM-dd');
        
        return selectedStr >= pStartStr && selectedStr <= pEndStr;
      })
    : initialPromotions;

  return (
    <div className="space-y-12">
      <section>
        <CalendarHeatmap 
          promotions={initialPromotions} 
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect} 
        />
      </section>

      <section ref={listRef} className="scroll-mt-24 min-h-[50vh]">
        <PromotionList promotions={filteredPromotions} selectedDate={selectedDate} onClearDate={() => setSelectedDate(null)} />
      </section>
    </div>
  );
}
