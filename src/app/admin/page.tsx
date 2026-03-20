"use client";

import { useState, useEffect } from 'react';
import { Promotion, PromoType } from '@/types';
import { Plus, Edit2, Trash2, X, Save, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { createClient } from '@/utils/supabase/client';

export default function AdminDashboard() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<Partial<Promotion>>({});
  
  const supabase = createClient();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const mappedPromos: Promotion[] = (data || []).map((p: any) => ({
        id: p.id,
        productName: p.product_name,
        amazonLink: p.amazon_link,
        promoCode: p.promo_code,
        discountPercent: p.discount_percent,
        startDate: p.start_date,
        endDate: p.end_date,
        promoType: p.promo_type,
        imageUrl: p.image_url,
        isActive: p.is_active,
      }));
      
      setPromotions(mappedPromos);
    } catch (error) {
      console.error("Failed to fetch promotions", error);
    } finally {
      setIsLoading(false);
    }
  };

  const mapToDB = (p: Partial<Promotion>): any => ({
    product_name: p.productName,
    amazon_link: p.amazonLink,
    promo_code: p.promoCode,
    discount_percent: p.discountPercent,
    start_date: p.startDate,
    end_date: p.endDate,
    promo_type: p.promoType,
    image_url: p.imageUrl,
    is_active: p.isActive,
  });

  const handleOpenModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
      setFormData(promo);
    } else {
      setEditingPromo(null);
      setFormData({
        promoType: 'Promo Code' as PromoType,
        discountPercent: 10,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(Date.now() + 86400000 * 7), 'yyyy-MM-dd'),
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const dbPayload = mapToDB(formData);
      
      if (editingPromo && editingPromo.id) {
        await supabase.from('promotions').update(dbPayload).eq('id', editingPromo.id);
      } else {
        await supabase.from('promotions').insert([dbPayload]);
      }
      
      await fetchPromotions();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save", error);
      alert("Error saving promotion!");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await supabase.from('promotions').delete().eq('id', id);
        await fetchPromotions();
      } catch (error) {
        console.error("Failed to delete", error);
      }
    }
  };

  return (
    <div className="bg-slate-50 flex-1">
      <header className="bg-primary text-primary-foreground py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-serif font-semibold">Mellanni Admin Dashboard</h1>
          <div className="flex gap-4 items-center">
            <a href="/" target="_blank" className="text-sm flex items-center gap-1 hover:text-accent transition-colors">
              View Portal <ExternalLink size={14} />
            </a>
            <div className="text-sm opacity-50 px-3 border-l border-white/20">Secure Area</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Manage Promotions</h2>
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm font-medium"
          >
            <Plus size={18} /> Add Promotion
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-border text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Product / Campaign</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground animate-pulse">
                      Loading promotions...
                    </td>
                  </tr>
                ) : promotions.map(promo => (
                  <tr key={promo.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-primary">{promo.productName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{promo.amazonLink}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-medium">
                        {promo.promoType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {promo.discountPercent}%
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {format(parseISO(promo.startDate), 'MMM d, yyyy')} - <br/>
                      {format(parseISO(promo.endDate), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        promo.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${promo.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                        {promo.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(promo)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(promo.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors ml-1">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && promotions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No promotions found in the production database. Add some to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold">{editingPromo ? 'Edit Promotion' : 'New Promotion'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Product Name</label>
                  <input 
                    type="text" 
                    value={formData.productName || ''} 
                    onChange={e => setFormData({...formData, productName: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Mellanni Bed Sheet Set..."
                  />
                </div>
                
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Amazon Link</label>
                  <input 
                    type="url" 
                    value={formData.amazonLink || ''} 
                    onChange={e => setFormData({...formData, amazonLink: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    placeholder="https://amazon.com/dp/..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Promo Type</label>
                  <select 
                    value={formData.promoType || ''}
                    onChange={e => setFormData({...formData, promoType: e.target.value as PromoType})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white"
                  >
                    <option value="Promo Code">Promo Code</option>
                    <option value="Lightning Deal">Lightning Deal</option>
                    <option value="Best Deal">Best Deal</option>
                    <option value="Prime Exclusive">Prime Exclusive</option>
                    <option value="Sale">Sale</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Discount Percent (%)</label>
                  <input 
                    type="number" 
                    value={formData.discountPercent || ''}
                    onChange={e => setFormData({...formData, discountPercent: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Promo Code (Optional)</label>
                  <input 
                    type="text" 
                    value={formData.promoCode || ''}
                    onChange={e => setFormData({...formData, promoCode: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. SAVE20NOW"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Start Date</label>
                  <input 
                    type="date" 
                    value={formData.startDate || ''}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">End Date</label>
                  <input 
                    type="date" 
                    value={formData.endDate || ''}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Image URL (Optional)</label>
                  <input 
                    type="url" 
                    value={formData.imageUrl || ''}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>

                <div className="md:col-span-2 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isActive || false}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-5 h-5 rounded text-primary focus:ring-primary border-border"
                    />
                    <span className="font-semibold text-foreground">Visible to Influencers (Active)</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-border rounded-lg font-medium hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Save size={18} /> Save Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
