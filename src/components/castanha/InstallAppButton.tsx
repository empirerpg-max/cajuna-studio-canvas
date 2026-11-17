import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const CHAVE_DICA_IOS = 'castanha-dica-ios-dispensada';

function lerDispensada() {
  try {
    return localStorage.getItem(CHAVE_DICA_IOS) === '1';
  } catch {
    return false;
  }
}

function ehIosSafariForaDoApp() {
  const nav = navigator as Navigator & { standalone?: boolean };
  const ios = /iphone|ipad|ipod/i.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  return ios && nav.standalone !== true;
}

/** Botão "Instalar app" (Android/desktop) ou dica de "Adicionar à Tela de Início" (iPhone). */
export function InstallAppButton({ tema = 'escuro' }: { tema?: 'escuro' | 'claro' }) {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [mostrarDicaIos, setMostrarDicaIos] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    };
    const onInstalado = () => setEvento(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalado);
    setMostrarDicaIos(ehIosSafariForaDoApp() && !lerDispensada());
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalado);
    };
  }, []);

  if (evento) {
    return (
      <button
        onClick={async () => {
          await evento.prompt();
          await evento.userChoice;
          setEvento(null);
        }}
        className={cn(
          'inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-bold transition',
          tema === 'escuro'
            ? 'border-[#E97933] text-[#E97933] hover:bg-[#E97933] hover:text-[#1A1A1A]'
            : 'border-[#1A1A1A] bg-[#E97933] text-[#1A1A1A] hover:bg-[#d4692a]',
        )}
      >
        <Download size={15} /> Instalar app
      </button>
    );
  }

  if (mostrarDicaIos) {
    return (
      <div className="flex items-start gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-medium text-white/80">
        <Share size={14} className="mt-0.5 shrink-0 text-[#E97933]" />
        <span>
          Para instalar: toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.
        </span>
        <button
          aria-label="Dispensar dica"
          onClick={() => {
            try {
              localStorage.setItem(CHAVE_DICA_IOS, '1');
            } catch {
              /* sem armazenamento: só esconde nesta visita */
            }
            setMostrarDicaIos(false);
          }}
          className="shrink-0 text-white/50 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return null;
}
