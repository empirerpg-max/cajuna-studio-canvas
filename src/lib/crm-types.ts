export interface Deal {
  id: string;
  funil: string;
  cliente: string;
  servico: string;
  valor: string;
  responsavel: string;
  prioridade: string;
  coluna: string;
  ultimoContato: string;
  contato: string;
  tags: string[];
  obs: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface AdminOption {
  codigo: string;
  nome: string;
}

export interface FunilConfig {
  key: string;
  columns: readonly string[];
}

export const FUNIS: FunilConfig[] = [
  {
    key: 'Leads',
    columns: ['Novo Lead', 'Contato Feito', 'Proposta Enviada', 'Negociando', 'Fechado', 'Perdido'],
  },
  {
    key: 'Identidade Visual',
    columns: [
      'Briefing (Cliente)',
      'Briefing (Cajuna)',
      'Direcionamento de Marca (Cajuna)',
      'Direcionamento de Marca (Cliente)',
      'Manual de Marca (Cajuna)',
      'Manual de Marca (Cliente)',
      'Envio dos Arquivos',
    ],
  },
  {
    key: 'Gerenciamento de Redes Sociais',
    columns: ['Briefing (Cliente)', 'Briefing (Cajuna)', 'Produção', 'Entregue (Aguardando)', 'Análise e Insights'],
  },
  {
    key: 'Gerenciamento de Campanhas',
    columns: ['Briefing (Cliente)', 'Briefing (Cajuna)', 'Produção', 'Entregue (Aguardando)', 'Análise e Insights'],
  },
  {
    key: 'Avulsos',
    columns: ['Briefing', 'Produção'],
  },
];
