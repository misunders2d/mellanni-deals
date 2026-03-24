"use client";

import { useState } from 'react';
import { Promotion, PromoType } from '@/types';
import { format, parseISO, isBefore, addHours } from 'date-fns';
import { Copy, Check, X, Clock, Heart } from 'lucide-react';
import { formatPT, hasTimePT } from '@/utils/date-utils';
import Image from 'next/image';

interface PromotionListProps {
  promotions: Promotion[];
  selectedDate?: Date | null;
  onClearDate?: () => void;
  favoriteIds?: Set<string>;
  onToggleFavorite?: (id: string) => void;
}

export default function PromotionList({ 
  promotions, 
  selectedDate, 
  onClearDate, 
  favoriteIds = new Set(), 
  onToggleFavorite 
}: PromotionListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = async (promo: Promotion) => {
    if (!promo.promoCode) return;
    try {
      await navigator.clipboard.writeText(promo.promoCode);
      setCopiedCodeId(promo.id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch (err) {
      console.error('Failed to copy promo code', err);
    }
  };

  const handleCopy = async (promo: Promotion) => {
    try {
      let copyText = `Check out this deal: ${promo.productName}\n${promo.discountPercent}% OFF!\n`;
      if (promo.promoCode) {
        copyText += `Use Code: ${promo.promoCode}\n`;
      }
      
      if (hasTimePT(promo.startDate)) {
        copyText += `Starts: ${formatPT(promo.startDate, 'MMM d, h:mm a')} PT\n`;
      }
      
      copyText += `Link: ${promo.amazonLink}`;

      await navigator.clipboard.writeText(copyText);
      setCopiedId(promo.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
      // Fallback for non-https local environments if clipboard API is blocked
      alert('Localhost clipboard access may be restricted. On production this copies perfectly.');
    }
  };

  const filteredPromos = promotions;

  const isExpiringSoon = (endDate: string) => {
    const end = parseISO(endDate);
    const now = new Date();
    return isBefore(now, end) && isBefore(end, addHours(now, 24));
  };

  const getDiscountColor = (percent: number) => {
    if (percent <= 15) return 'bg-discount-15 text-primary border border-discount-30';
    if (percent <= 30) return 'bg-discount-30 text-white';
    if (percent <= 50) return 'bg-discount-50 text-white';
    return 'bg-discount-50-plus text-white';
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-serif text-primary">
          {selectedDate ? `Promos for ${format(selectedDate, 'MMM d, yyyy')}` : 'Active & Upcoming Promos'}
        </h2>
        {selectedDate && (
          <button 
            onClick={onClearDate}
            className="flex items-center gap-1 text-sm bg-slate-100 px-3 py-1 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X size={14} /> Clear date
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromos.map(promo => (
          <div key={promo.id} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
            <div className="aspect-[4/3] w-full bg-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
              {promo.imageUrl ? (
                <div className="relative w-full h-full mix-blend-multiply opacity-80 group-hover:scale-105 transition-transform duration-500">
                  <Image 
                    src={promo.imageUrl} 
                    alt={promo.productName} 
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-serif italic">
                  Mellanni
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className={`font-bold px-3 py-1 rounded-full shadow-sm text-sm w-fit ${getDiscountColor(promo.discountPercent)}`}>
                  {promo.discountPercent}% OFF
                </div>
                {isExpiringSoon(promo.endDate) && (
                  <div className="bg-red-600 text-white font-bold px-3 py-1 rounded-full shadow-sm text-xs flex items-center gap-1 animate-pulse">
                    <Clock size={12} /> ENDS SOON
                  </div>
                )}
              </div>
              
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(promo.id)}
                  className={`absolute top-4 right-4 p-2 rounded-full shadow-md transition-all ${
                    favoriteIds.has(promo.id)
                      ? 'bg-red-50 text-red-500'
                      : 'bg-white/80 text-slate-400 hover:text-red-400 backdrop-blur-sm'
                  }`}
                >
                  <Heart size={20} fill={favoriteIds.has(promo.id) ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>

            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded border border-border">
                  {promo.promoType}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {formatPT(promo.startDate, 'MMM d')}
                  {hasTimePT(promo.startDate) && ` ${formatPT(promo.startDate, 'h:mm a')}`}
                  {' - '}
                  {formatPT(promo.endDate, 'MMM d, yyyy')}
                  {hasTimePT(promo.endDate) && ` ${formatPT(promo.endDate, 'h:mm a')}`}
                  {(hasTimePT(promo.startDate) || hasTimePT(promo.endDate)) && ' PT'}
                </span>
              </div>
              
              <h3 className="font-semibold text-lg text-primary mb-2 line-clamp-2 leading-tight">
                {promo.productName}
              </h3>
              
              {promo.promoCode && (
                <div 
                  onClick={() => handleCopyCode(promo)}
                  title="Click to copy code"
                  className="mb-4 inline-flex items-center gap-2 bg-slate-50 border border-dashed border-slate-300 rounded px-3 py-1.5 w-max cursor-pointer hover:bg-slate-100 hover:border-slate-400 transition-all group/code relative"
                >
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">CODE:</span>
                  <span className="text-sm font-bold text-primary">{promo.promoCode}</span>
                  {copiedCodeId === promo.id && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-in fade-in zoom-in duration-200">
                      Copied!
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-auto pt-4 flex gap-3">
                <a 
                  href={promo.amazonLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 bg-white border border-border text-foreground hover:bg-slate-50 hover:text-primary transition-colors py-2.5 rounded-lg text-sm font-semibold text-center shadow-sm"
                >
                  View Product
                </a>
                <button 
                  onClick={() => handleCopy(promo)}
                  className="flex-[2] flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground transition-all py-2.5 rounded-lg text-sm font-semibold shadow-sm"
                >
                  {copiedId === promo.id ? (
                    <><Check size={16} /> Copied!</>
                  ) : (
                    <><Copy size={16} /> Copy Details</>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredPromos.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
          <p className="text-muted-foreground font-medium mb-4">
            {selectedDate 
              ? `No promotions running on ${format(selectedDate, 'MMMM d, yyyy')} for the selected criteria.`
              : `No promotions found for the selected criteria.`}
          </p>
          {selectedDate && (
            <button 
              onClick={onClearDate}
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-sm hover:bg-primary/90"
            >
              View All Dates
            </button>
          )}
        </div>
      )}
    </div>
  );
}
