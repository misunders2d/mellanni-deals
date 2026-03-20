import { createClient } from '@/utils/supabase/server';
import PromotionsPortal from '@/components/PromotionsPortal';
import { Promotion } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('promotions')
    .select('*')
    .eq('is_active', true);

  const promotions: Promotion[] = (data || []).map((p: any) => ({
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

  return (
    <div className="bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-serif text-primary tracking-tight">
            Upcoming Campaigns
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Welcome to the Mellanni influencer resource hub. Browse our upcoming calendar of events below and grab the links and promo codes you need to share with your audience.
          </p>
        </section>

        <PromotionsPortal initialPromotions={promotions} />
      </main>

      <footer className="bg-white border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Mellanni Fine Linens. All rights reserved.</p>
          <div className="mt-4 sm:mt-0 flex gap-6 font-medium">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
