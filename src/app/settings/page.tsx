"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase.auth]);

  const handleDataExport = async () => {
    if (!user) return;
    setExporting(true);
    
    // Simulate compilation of user data across tables for GDPR
    const userData = {
      profile: user,
      activity: "Exported under GDPR Right to Access clause."
    };
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mellanni-data-export-${user.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExporting(false);
  };

  const handleAccountDeletion = async () => {
    const confirmed = window.confirm(
      "GDPR 'Right to be Forgotten' execution.\nThis will immediately delete your account and all associated personal data permanently from our servers. Are you absolutely sure?"
    );
    if (!confirmed) return;

    setDeleting(true);
    // Note: Deleting auth.users directly from client is blocked by RLS.
    // In production securely, this calls a Supabase Edge Function with SERVICE_ROLE key.
    // For this prototype, we'll fire an RPC call or sign them out as a placeholder.
    
    // Mocking deletion workflow:
    alert("In a full production environment, this securely triggers an Edge Function to immediately wipe the auth record and profile data.");
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary">Account & Privacy Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your personal data in accordance with GDPR and CCPA regulations.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-border p-6 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">Your Profile</h2>
            <div className="space-y-4 text-sm bg-slate-50 p-4 rounded-lg border border-border">
              <div className="flex justify-between">
                <span className="text-slate-500">Email Reference</span>
                <span className="font-medium tracking-wide">{user?.email || 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unique Identifier</span>
                <span className="text-xs tracking-wider">{user?.id || 'Loading...'}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2 mb-4">Data Export (Right to Access)</h2>
            <p className="text-sm text-slate-600 mb-4">
              Under GDPR Article 15, you have the right to request a copy of the personal data we hold about you. Click below to download an immediate JSON machine-readable export of your data.
            </p>
            <button 
              onClick={handleDataExport}
              disabled={exporting || !user}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-50"
            >
              {exporting ? 'Compiling Data...' : 'Download Personal Data'}
            </button>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-red-600 border-b border-red-200 pb-2 mb-4">Danger Zone (Right to be Forgotten)</h2>
            <p className="text-sm text-slate-600 mb-4">
              Under GDPR Article 17, you may request the immediate deletion of your account and all associated personal data. This action is irreversible.
            </p>
            <button 
              onClick={handleAccountDeletion}
              disabled={deleting || !user}
              className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none disabled:opacity-50"
            >
              {deleting ? 'Deleting Account...' : 'Permanently Delete Account'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
