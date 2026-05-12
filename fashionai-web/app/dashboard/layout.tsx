import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(145deg, #FAF7F5 0%, #F0E8E4 100%)' }}>
      <Navbar />
      <div className="flex pt-16">
        <DashboardNav />
        <main className="flex-1 min-w-0 px-4 lg:px-8 pt-6 lg:pt-8 pb-24 lg:pb-10 overflow-hidden">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
