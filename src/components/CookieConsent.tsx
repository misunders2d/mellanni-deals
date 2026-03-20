"use client";

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('mellanni-cookie-consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('mellanni-cookie-consent', 'true');
    setShowConsent(false);
  };

  const declineCookies = () => {
    // Strictly block non-essential logic in the app based on this flag
    localStorage.setItem('mellanni-cookie-consent', 'false');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 shadow-2xl z-50 animate-in slide-in-from-bottom-full duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-600">
          <strong className="text-foreground">We value your privacy.</strong> We use strict essential cookies for platform security (Supabase Auth). We ask for consent to use additional analytical cookies to improve this Influencer Portal in compliance with GDPR.
          <a href="#" className="underline ml-1 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary">Read our Privacy Policy</a>.
        </div>
        <div className="flex gap-3 w-full sm:w-auto shrink-0">
          <button 
            onClick={declineCookies}
            className="flex-1 px-4 py-2 border border-border text-foreground hover:bg-slate-50 transition-colors rounded-lg text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Decline non-essential cookies"
          >
            Decline All
          </button>
          <button 
            onClick={acceptCookies}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Accept all cookies"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
}
