import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listarDados, lerConfig } from '@/lib/castanha/dados.functions';
import { contratoAtivo, contratosDoCard, type DadosCastanha } from '@/lib/castanha/negocio';
import { mesISO } from '@/lib/castanha/util';

export const DADOS_KEY = ['castanha-dados'] as const;
export const CONFIG_KEY = ['castanha-config'] as const;

export function useDados(enabled = true) {
  return useQuery({ queryKey: DADOS_KEY, queryFn: () => listarDados(), staleTime: 60_000, retry: 1, enabled });
}

export function useConfig(enabled = true) {
  return useQuery({ queryKey: CONFIG_KEY, queryFn: () => lerConfig(), staleTime: 5 * 60_000, retry: 1, enabled });
}

export function useRecarregarDados() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: DADOS_KEY });
}

/** Contrato ativo (hoje) ligado a um card, se houver. */
export function contratoAtivoDoCard(dados: DadosCastanha | undefined, cardId: string) {
  if (!dados) return undefined;
  const hoje = mesISO(Date.now());
  return contratosDoCard(dados, cardId).find((c) => contratoAtivo(c, hoje));
}

export function clienteDoCard(dados: DadosCastanha | undefined, cardId: string) {
  return dados?.clientes.find((c) => c.cardId === cardId);
}
