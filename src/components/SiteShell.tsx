import { Link } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { CajuLogo } from "./CajuLogo";
import { Menu, X, Instagram } from "lucide-react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/portfolio", label: "Portfólio" },
  { to: "/briefing", label: "Briefing" },
  { to: "/orcamento", label: "Orçamento" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <CajuLogo size={40} />
            <span className="font-display font-bold text-lg tracking-tight">
              cajuna<span className="text-primary">.</span>studio
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-4 py-2 rounded-full text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
                activeProps={{ className: "px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground" }}
                activeOptions={{ exact: n.to === "/" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 rounded-md hover:bg-accent"
            aria-label="Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {open && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-5 py-3 flex flex-col gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent"
                  activeProps={{ className: "px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground" }}
                  activeOptions={{ exact: n.to === "/" }}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border mt-20">
        <div className="mx-auto max-w-6xl px-5 py-10 grid gap-6 md:grid-cols-3 items-center">
          <div className="flex items-center gap-3">
            <CajuLogo size={48} />
            <div>
              <div className="font-display font-bold">cajuna.studio</div>
              <div className="text-sm text-muted-foreground">identidade visual & posts</div>
            </div>
          </div>
          <div className="md:text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cajuna Studio. Feito com afeto.
          </div>
          <div className="md:justify-self-end flex items-center gap-3">
            <a
              href="https://www.instagram.com/cajunastudio"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-secondary text-secondary-foreground hover:opacity-90 transition"
            >
              <Instagram size={16} /> @cajunastudio
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
