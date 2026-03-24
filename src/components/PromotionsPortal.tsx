"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { Promotion } from '@/types';
import CalendarHeatmap from './CalendarHeatmap';
import PromotionList from './PromotionList';
import { formatPT } from '@/utils/date-utils';
import { format } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { Heart } from 'lucide-react';

export default function PromotionsPortal({ initialPromotions }: { initialPromotions: Promotion[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isArchiveView, setIsArchiveView] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('favorites')
      .select('promotion_id')
      .eq('user_id', user.id);

    if (data && !error) {
      setFavoriteIds(new Set(data.map(f => f.promotion_id)));
    }
  };

  const handleToggleFavorite = async (promoId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Please log in to save favorites.');
      return;
    }

    if (favoriteIds.has(promoId)) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('promotion_id', promoId);
      
      if (!error) {
        const next = new Set(favoriteIds);
        next.delete(promoId);
        setFavoriteIds(next);
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, promotion_id: promoId }]);
      
      if (!error) {
        setFavoriteIds(new Set([...Array.from(favoriteIds), promoId]));
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    // If clicking same date, toggle off
    if (selectedDate && selectedDate.getTime() === date.getTime()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);

      // Check if we should switch to Archive view for this date
      const dateStr = format(date, 'yyyy-MM-dd');
      const hasLiveDeals = initialPromotions.some(p => {
        const pStart = formatPT(p.startDate, 'yyyy-MM-dd');
        const pEnd = formatPT(p.endDate, 'yyyy-MM-dd');
        return !p.isArchived && dateStr >= pStart && dateStr <= pEnd;
      });

      if (!hasLiveDeals) {
        const hasArchivedDeals = initialPromotions.some(p => {
          const pStart = formatPT(p.startDate, 'yyyy-MM-dd');
          const pEnd = formatPT(p.endDate, 'yyyy-MM-dd');
          return p.isArchived && dateStr >= pStart && dateStr <= pEnd;
        });
        if (hasArchivedDeals) setIsArchiveView(true);
      } else {
        setIsArchiveView(false);
      }

      // Give UI a tiny tick to adjust the filter, then scroll down to the product list
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };

  // Filter promotions by the selected calendar date and favorites toggle
  const filteredPromotions = useMemo(() => {
    let result = initialPromotions;

    // Filter by Archive status first (unless we are just looking at the calendar)
    result = result.filter(p => !!p.isArchived === isArchiveView);

    if (selectedDate) {
      result = result.filter(p => {
        const pStartStr = formatPT(p.startDate, 'yyyy-MM-dd');
        const pEndStr = formatPT(p.endDate, 'yyyy-MM-dd');
        const selectedStr = format(selectedDate, 'yyyy-MM-dd');
        return selectedStr >= pStartStr && selectedStr <= pEndStr;
      });
    }

    if (showFavoritesOnly) {
      result = result.filter(p => favoriteIds.has(p.id));
    }

    return result;
  }, [initialPromotions, selectedDate, showFavoritesOnly, favoriteIds, isArchiveView]);

  return (
    <div className="space-y-12">
      <section>
        <CalendarHeatmap 
          promotions={initialPromotions} 
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect} 
        />
      </section>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-xl border border-border sticky top-4 z-30 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button 
            onClick={() => setIsArchiveView(false)}
            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-semibold rounded-md transition-all ${!isArchiveView ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Live Campaigns
          </button>
          <button 
            onClick={() => setIsArchiveView(true)}
            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-semibold rounded-md transition-all ${isArchiveView ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Archive
          </button>
        </div>
        
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 rounded-lg border transition-all text-sm font-semibold ${
            showFavoritesOnly 
              ? 'bg-red-50 border-red-100 text-red-600 shadow-sm' 
              : 'bg-white border-border text-slate-600 hover:border-slate-300'
          }`}
        >
          <Heart size={16} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
          {showFavoritesOnly ? 'Favorites Only' : 'Shortlist'}
        </button>
      </div>

      <section ref={listRef} className="scroll-mt-32 min-h-[50vh]">
        <PromotionList 
          promotions={filteredPromotions} 
          selectedDate={selectedDate} 
          onClearDate={() => setSelectedDate(null)}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
        />
      </section>
    </div>
  );
}
