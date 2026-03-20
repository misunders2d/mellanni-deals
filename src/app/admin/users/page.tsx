"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, Users } from 'lucide-react';

export default function UserManagementDashboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data: userRecord } = await supabase.auth.getUser();
    if (!userRecord?.user) {
      setError("Unauthorized access.");
      setLoading(false);
      return;
    }

    // Verify requesting user is superuser
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userRecord.user.id)
      .single();

    if (myProfile?.role !== 'admin') {
      setError("Forbidden. Access restricted strictly to Admins.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setError("Failed to query profiles.");
    } else {
      setProfiles(data);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      alert("Failed to update user role!");
    } else {
      fetchProfiles();
    }
  };

  if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Scanning Authorization Tiers...</div>;

  if (error) return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center">
      <ShieldAlert size={64} className="text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
      <p className="text-muted-foreground mt-2">{error}</p>
      <a href="/admin" className="text-primary mt-6 hover:underline">Return to Admin Panel</a>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-primary text-primary-foreground py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-serif font-semibold flex items-center gap-2"><Users size={20}/> Admin Hive</h1>
          <div className="text-sm border-l border-white/20 pl-4">Platform Identity Management</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Registered Users matrix</h2>
          <span className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold shadow-sm border border-emerald-200">
            Total Accessing: {profiles.length}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-border text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Associated Email</th>
                  <th className="px-6 py-4">Name Configuration</th>
                  <th className="px-6 py-4">System Identifier (UUID)</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-primary">{profile.email}</td>
                    <td className="px-6 py-4">{(profile.first_name || profile.last_name) ? `${profile.first_name || ''} ${profile.last_name || ''}` : 'No Name Set'}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground break-all max-w-[150px] truncate">{profile.id}</td>
                    <td className="px-6 py-4">
                      <select 
                        className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary"
                        value={profile.role}
                        onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                      >
                        <option value="influencer">Influencer</option>
                        <option value="superuser">Superuser (Promos Only)</option>
                        <option value="admin">Admin (God Tier)</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs text-slate-400">Autosaves</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
