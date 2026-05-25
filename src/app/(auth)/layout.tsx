import Link from 'next/link';
import { MaylaIcon } from '@/components/ui/mayla-icon';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Decorative side panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'var(--gradient-rose)' }}
      >
        {/* Floating hearts */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <MaylaIcon className="absolute top-[20%] right-[15%] h-12 w-12 text-white/10 animate-float" />
          <MaylaIcon className="absolute top-[50%] left-[10%] h-9 w-9 text-white/8 animate-float delay-200" />
          <MaylaIcon className="absolute bottom-[30%] right-[25%] h-8 w-8 text-white/6 animate-float delay-500" />
          <MaylaIcon className="absolute top-[35%] left-[30%] h-14 w-14 text-white/5 animate-float delay-300" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 text-white">
            <MaylaIcon className="h-10 w-10" />
            <span className="font-[family-name:var(--font-amaranth)] text-3xl font-bold gradient-text">mayla</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-white">
            Find someone
            <br />
            <span className="italic opacity-90">worth finding</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/75">
            Every profile on Mayla is selfie-verified. No catfishing, no pretending — 
            just real people looking for real connections.
          </p>
        </div>

        <p className="relative z-10 text-sm text-white/40">
          &copy; {new Date().getFullYear()} Mayla
        </p>
      </div>

      {/* Form side */}
      <div className="flex flex-1 flex-col mesh-bg" style={{ background: 'var(--gradient-hero)' }}>
        <div className="flex h-16 items-center px-5 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <MaylaIcon className="h-9 w-9 text-primary" />
            <span className="font-[family-name:var(--font-amaranth)] text-xl font-bold gradient-text">
              mayla
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
