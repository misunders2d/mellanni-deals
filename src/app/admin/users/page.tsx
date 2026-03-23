"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, Users, UserPlus, X } from 'lucide-react';
import { createUserAction } from './user-actions';

export default function UserManagementDashboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
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

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const result = await createUserAction(formData);
    
    if (result.error) {
      alert(result.error);
    } else {
      setShowCreateForm(false);
      fetchProfiles();
    }
    setCreateLoading(false);
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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-all"
            >
              <UserPlus size={18} /> Manually Create User
            </button>
            <span className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold shadow-sm border border-emerald-200">
              Total Accessing: {profiles.length}
            </span>
          </div>
        </div>

        {showCreateForm && (
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-2 border-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                <UserPlus size={20} /> Identity Provisioning
              </h3>
              <button onClick={() => setShowCreateForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Email Address</label>
                <input required name="email" type="email" placeholder="influencer@example.com" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Set Password</label>
                <input required name="password" type="password" placeholder="••••••••" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">First Name</label>
                <input name="firstName" type="text" placeholder="Jane" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Last Name</label>
                <input name="lastName" type="text" placeholder="Doe" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Assign Role</label>
                <select name="role" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none bg-white">
                  <option value="influencer">Influencer</option>
                  <option value="superuser">Superuser</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="lg:col-span-1 flex items-end">
                <button 
                  disabled={createLoading}
                  type="submit" 
                  className="w-full bg-primary text-white font-bold py-2 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {createLoading ? 'Provisioning...' : 'Authorize User'}
                </button>
              </div>
            </form>
          </div>
        )}

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
