import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { whatsappLink } from '@/lib/castanha/fb-leads';

/** O mesmo botão verde em todo o Castanha. Some se o número não for válido. */
export function BotaoWhatsapp({
  numero,
  mensagem,
  tamanho = 'card',
  rotulo,
  className,
}: {
  numero: string;
  mensagem?: string;
  tamanho?: 'card' | 'grande';
  rotulo?: string;
  className?: string;
}) {
  const link = whatsappLink(numero, mensagem);
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={mensagem ? `Abre o WhatsApp com: "${mensagem}"` : 'Abre a conversa no WhatsApp'}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] font-black text-white transition hover:bg-[#1ebe5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A1A1A]',
        tamanho === 'card' ? 'px-3 py-1.5 text-xs' : 'w-full rounded-2xl py-3 text-[15px]',
        className,
      )}
    >
      <MessageCircle size={tamanho === 'card' ? 13 : 18} />
      {rotulo ?? 'WhatsApp'}
    </a>
  );
}
