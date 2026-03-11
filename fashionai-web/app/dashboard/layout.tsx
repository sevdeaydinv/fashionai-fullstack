import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Navbar } from '@/components/layout/Navbar';
import { DashboardNav } from '@/components/layout/DashboardNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />
      <div className="flex pt-16">
        <DashboardNav />
        <main className="flex-1 min-w-0 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
