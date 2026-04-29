export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      {/* Kırmızı radyal arka plan glow — referans görseldeki gibi */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-40"
          style={{ background: 'radial-gradient(ellipse at center, rgba(196,30,58,0.55) 0%, rgba(120,10,30,0.3) 35%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, rgba(196,30,58,0.4) 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      {/* Form */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center px-4 py-10">
        {children}

        {/* Alt Fashion AI yazısı */}
        <p className="mt-10 text-xl font-light tracking-widest"
          style={{
            fontFamily: 'var(--font-cormorant), Georgia, serif',
            color: 'rgba(255,255,255,0.75)',
            textShadow: '0 0 20px rgba(196,30,58,0.9), 0 0 40px rgba(196,30,58,0.5)',
            letterSpacing: '0.2em',
          }}>
          Fashion <span style={{ color: '#ff3355' }}>AI</span>
        </p>
      </div>
    </div>
  );
}
