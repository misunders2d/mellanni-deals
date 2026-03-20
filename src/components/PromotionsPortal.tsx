"use client";

import { useState, useRef } from 'react';
import { Promotion } from '@/types';
import CalendarHeatmap from './CalendarHeatmap';
import PromotionList from './PromotionList';
import { isWithinInterval, parseISO } from 'date-fns';

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
        const pStart = parseISO(p.startDate);
        const pEnd = parseISO(p.endDate);
        
        const dateCopy = new Date(selectedDate);
        dateCopy.setHours(0, 0, 0, 0);
        
        const startCopy = new Date(pStart);
        startCopy.setHours(0, 0, 0, 0);
        
        const endCopy = new Date(pEnd);
        endCopy.setHours(23, 59, 59, 999);
        
        return isWithinInterval(dateCopy, { start: startCopy, end: endCopy });
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
