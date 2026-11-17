import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { salvarConfig } from '@/lib/castanha/dados.functions';
import { MENSAGEM_PADRAO, MENSAGEM_PADRAO_CLIENTES, montarMensagem } from '@/lib/castanha/util';
import { CONFIG_KEY } from './useDados';
import type { Mensagens } from './useMensagens';
import { Botao, Erro, Modal, inputCls } from './ui';

const ABAS = [
  { id: 'prospeccao', chave: 'mensagem_whatsapp', titulo: 'Prospecção', uso: 'Facebook Lead Ads e Leads', padrao: MENSAGEM_PADRAO },
  { id: 'clientes', chave: 'mensagem_whatsapp_clientes', titulo: 'Clientes', uso: 'Funis de projeto e aba Clientes', padrao: MENSAGEM_PADRAO_CLIENTES },
] as const;

const VARIAVEIS = [
  { v: '{nome}', d: 'primeiro nome do lead' },
  { v: '{admin}', d: 'seu nome' },
  { v: '{precisa}', d: 'o que pediu / serviço' },
  { v: '{negocio}', d: 'negócio do lead' },
];

const EXEMPLO = { nome: 'Mirtes Melo', precisa: 'Identidade visual', negocio: 'Confeitaria' };

export function MensagemWhatsappModal({
  mensagens,
  adminNome,
  onClose,
}: {
  mensagens: Mensagens;
  adminNome: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [aba, setAba] = useState<'prospeccao' | 'clientes'>('prospeccao');
  const [textos, setTextos] = useState<Mensagens>(mensagens);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);
  const atual = ABAS.find((a) => a.id === aba)!;
  const texto = textos[aba];
  const setTexto = (t: string) => setTextos((x) => ({ ...x, [aba]: t }));

  function inserir(v: string) {
    const el = area.current;
    if (!el) return setTexto(texto + v);
    const ini = el.selectionStart ?? texto.length;
    const fim = el.selectionEnd ?? texto.length;
    const novo = texto.slice(0, ini) + v + texto.slice(fim);
    setTexto(novo);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(ini + v.length, ini + v.length);
    });
  }

  async function salvar() {
    setSalvando(true);
    setErro('');
    try {
      for (const a of ABAS) {
        if (textos[a.id] !== mensagens[a.id]) {
          await salvarConfig({ data: { chave: a.chave, valor: textos[a.id].trim() === a.padrao ? '' : textos[a.id].trim() } });
        }
      }
      await qc.invalidateQueries({ queryKey: CONFIG_KEY });
      toast.success('Mensagens salvas.');
      onClose();
    } catch (err) {
      setErro(`Não foi possível salvar: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo="Mensagem do WhatsApp"
      subtitulo="O texto que já vem escrito quando vocês tocam no botão do WhatsApp. Vale para toda a equipe."
      onClose={onClose}
      rodape={
        <>
          <Botao tipo="fantasma" onClick={() => setTexto(atual.padrao)}>
            Voltar ao padrão
          </Botao>
          <Botao onClick={salvar} carregando={salvando}>
            Salvar mensagens
          </Botao>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-2" role="tablist">
          {ABAS.map((a) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={cn(
                'rounded-2xl border-2 px-3 py-2 text-left transition',
                aba === a.id ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-[#1A1A1A]/15 hover:border-[#1A1A1A]/40',
              )}
            >
              <span className="block font-black">{a.titulo}</span>
              <span className={cn('block text-xs', aba === a.id ? 'text-white/60' : 'text-[#1A1A1A]/50')}>{a.uso}</span>
            </button>
          ))}
        </div>

        <textarea
          ref={area}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          maxLength={1000}
          aria-label={`Mensagem de ${atual.titulo}`}
          className={cn(inputCls, 'resize-y leading-relaxed')}
        />

        <div>
          <p className="mb-1.5 text-xs font-black text-[#1A1A1A]/55">Toque para inserir no texto</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIAVEIS.map((x) => (
              <button
                key={x.v}
                type="button"
                onClick={() => inserir(x.v)}
                className="rounded-full border-2 border-[#1A1A1A]/15 bg-white px-3 py-1 text-xs font-bold hover:border-[#E97933]"
              >
                <span className="font-black text-[#E97933]">{x.v}</span> {x.d}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[#1A1A1A]/50">
            Trecho entre colchetes só aparece quando a informação existe. Ex.: <b>[ de {'{precisa}'}]</b> some se o lead não respondeu o que precisa.
          </p>
        </div>

        <div className="rounded-2xl bg-[#E7F8EE] p-4">
          <p className="mb-1 text-xs font-black text-[#1E8E3E]">Prévia com um lead de exemplo</p>
          <p className="whitespace-pre-wrap text-[15px] text-[#1A1A1A]">{montarMensagem(texto, { ...EXEMPLO, admin: adminNome })}</p>
        </div>
        <Erro>{erro}</Erro>
      </div>
    </Modal>
  );
}
