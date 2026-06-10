import { Link } from '@tanstack/react-router';
import { type ReactNode, useState } from 'react';
import { Menu, X, Instagram } from 'lucide-react';

const nav = [
  { to: '/', label: 'Home' },
  { to: '/portfolio', label: 'Portfólio' },
  { to: '/briefing', label: 'Briefing' },
  { to: '/orcamento', label: 'Orçamento' },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFF8F2', color: '#1A1A1A' }}>
      {/* ── NAV ── */}
      <header className="sticky top-0 z-40 border-b-2 border-[#1A1A1A]" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/logocajuna111.svg"
              alt="Cajuna Studio"
              className="h-9 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-4 py-2 rounded-full text-sm font-bold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                activeProps={{
                  className: 'px-4 py-2 rounded-full text-sm font-bold bg-[#E97933] text-[#1A1A1A] border-2 border-[#E97933]',
                }}
                activeOptions={{ exact: n.to === '/' }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* CTA desktop */}
          <Link
            to="/orcamento"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E97933] text-[#1A1A1A] font-bold border-2 border-[#E97933] hover:bg-[#d4692a] transition-colors text-sm"
          >
            Pedir orçamento →
          </Link>

          {/* Hamburger */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-md text-white hover:bg-white/10"
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="md:hidden border-t-2 border-white/10" style={{ backgroundColor: '#1A1A1A' }}>
            <div className="px-5 py-3 flex flex-col gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-colors"
                  activeProps={{ className: 'px-4 py-3 rounded-xl text-sm font-bold bg-[#E97933] text-[#1A1A1A]' }}
                  activeOptions={{ exact: n.to === '/' }}
                >
                  {n.label}
                </Link>
              ))}
              <Link
                to="/orcamento"
                onClick={() => setOpen(false)}
                className="mt-2 px-4 py-3 rounded-full bg-[#E97933] text-[#1A1A1A] font-bold text-sm text-center border-2 border-[#E97933]"
              >
                Pedir orçamento →
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="border-t-2 border-[#1A1A1A]" style={{ backgroundColor: '#1A1A1A' }}>
        <div className="mx-auto max-w-6xl px-5 py-10 grid gap-6 md:grid-cols-3 items-center">
          <div className="flex items-center gap-3">
            <img src="/logocajuna111.svg" alt="Cajuna Studio" className="h-12 w-auto brightness-0 invert" />
          </div>
          <div className="md:text-center text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} Cajuna Studio. Feito com afeto.
          </div>
          <div className="md:justify-self-end flex items-center gap-3">
            <a
              href="https://www.instagram.com/cajunastudio"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border-2 border-[#E97933] text-[#E97933] hover:bg-[#E97933] hover:text-[#1A1A1A] transition-colors"
            >
              <Instagram size={16} /> @cajunastudio
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
