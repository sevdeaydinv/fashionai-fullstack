import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — Form */}
      <div className="flex flex-col justify-center px-8 py-12 sm:px-16">
        {/* Logo */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L8 8H4L6 14H4L8 20H16L20 14H18L20 8H16L12 2Z" fill="white" fillOpacity="0.9" />
              </svg>
            </span>
            <span className="text-lg font-semibold text-ink-900">FashionAI</span>
          </Link>
        </div>
        {children}
      </div>

      {/* Right — Visual panel */}
      <div className="hidden lg:flex gradient-hero bg-grid relative overflow-hidden items-end p-16">
        {/* Blob */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-[400px] w-[400px] rounded-full bg-brand-600/15 blur-3xl" />
        {/* Quote card */}
        <div className="glass rounded-3xl p-8 max-w-sm z-10">
          <p className="text-white/90 text-lg font-medium leading-relaxed mb-6">
            &ldquo;FashionAI turned my messy wardrobe into a curated capsule collection. I get dressed in 2 minutes now.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-semibold">
              S
            </span>
            <div>
              <p className="text-sm font-medium text-white">Sofia M.</p>
              <p className="text-xs text-white/50">Fashion Blogger</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
