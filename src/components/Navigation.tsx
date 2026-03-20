"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && router.push('/')}>
          <span className="font-serif text-2xl font-bold tracking-tight text-primary">Mellanni</span>
          <span className="text-sm font-medium text-muted-foreground ml-2 hidden sm:inline-block border-l border-border pl-4">Influencer Portal</span>
        </div>
        
        <nav className="flex items-center gap-4" aria-label="Main User Navigation">
          <button 
            onClick={() => router.push('/settings')}
            className="text-sm text-slate-500 font-medium hidden sm:flex items-center gap-1.5 hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none rounded-md px-2 py-1"
            aria-label="Account Settings & GDPR"
          >
            <Settings size={16} /> Data Settings
          </button>
          
          <button 
            onClick={handleSignOut}
            className="text-sm bg-slate-50 border border-border text-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            aria-label="Sign out of the platform"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </nav>
      </div>
    </header>
  );
}
