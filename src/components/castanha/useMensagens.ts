import { useMemo } from 'react';
import { MENSAGEM_PADRAO, MENSAGEM_PADRAO_CLIENTES } from '@/lib/castanha/util';
import { useConfig } from './useDados';

export type Mensagens = { prospeccao: string; clientes: string };

/** Modelos de mensagem do WhatsApp (da aba Config, ou os padrões). */
export function useMensagens(enabled = true): Mensagens {
  const config = useConfig(enabled);
  return useMemo(
    () => ({
      prospeccao: config.data?.mensagem_whatsapp?.trim() || MENSAGEM_PADRAO,
      clientes: config.data?.mensagem_whatsapp_clientes?.trim() || MENSAGEM_PADRAO_CLIENTES,
    }),
    [config.data],
  );
}
