import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useServerFn } from '@tanstack/react-start';
import { cn } from '@/lib/utils';
import { submitForm } from '@/lib/forms.functions';
import type { ClienteUser } from '@/components/BriefingWizard';
import {
  ArrowRight,
  ArrowLeft,
  CornerDownLeft,
  Send,
  Upload,
  X,
  CheckCircle2,
} from 'lucide-react';

// Apps Script da Área do Cliente — usado só para registrar o número
// sequencial do briefing (Briefing 1, Briefing 2...) no painel do cliente.
const CLIENT_API_URL =
  'https://script.google.com/macros/s/AKfycbxWj5evgdS-hU7GDfwdGLHDxpvcxL47_H32V-Z7km2eSb3PWuxJVX6HPoNjPi-6GTfU/exec';

type QuestionType = 'text' | 'textarea' | 'multicheck' | 'upload';

type Question = {
  id: string;
  section: string;
  title: string;
  hint?: string;
  type: QuestionType;
  placeholder?: string;
  required?: boolean;
  skippable?: boolean;
  options?: string[];
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_QUALITY = 0.82;
const SKIP_COMPRESS_UNDER_BYTES = 1_500_000;

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }
  if (file.size < SKIP_COMPRESS_UNDER_BYTES) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Falha ao carregar imagem'));
      el.src = objectUrl;
    });
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const QUESTIONS: Question[] = [
  { id: 'nome_solicitante', section: 'Sobre você', title: 'Nome do solicitante', type: 'text', placeholder: 'Seu nome...', required: true },
  { id: 'marca_cliente', section: 'Sobre você', title: 'Marca / cliente', type: 'text', placeholder: 'Nome da marca...', required: true },
  { id: 'conteudo_solicitado', section: 'O pedido', title: 'Qual conteúdo você gostaria de solicitar?', hint: 'Descreva brevemente a demanda.', type: 'textarea', placeholder: 'Ex: post de lançamento, carrossel educativo...', required: true },
  { id: 'objetivo', section: 'O pedido', title: 'Qual é o objetivo principal desse conteúdo?', type: 'multicheck', options: ['Vendas', 'Engajamento', 'Alcance', 'Reconhecimento de marca', 'Divulgação de produto/serviço', 'Lançamento', 'Educação', 'Geração de leads', 'Tráfego', 'Outro'], required: true },
  { id: 'mensagem_principal', section: 'O pedido', title: 'Qual é a mensagem principal que precisamos transmitir?', hint: 'Se o público lembrar de apenas uma coisa depois de consumir esse conteúdo, o que deve ser?', type: 'textarea', required: true },
  { id: 'publico', section: 'O pedido', title: 'Para quem esse conteúdo será direcionado?', hint: 'Descreva o público específico, se houver.', type: 'textarea', skippable: true },
  { id: 'produto_servico', section: 'O pedido', title: 'Existe algum produto, serviço ou campanha envolvido?', hint: 'Se sim, qual?', type: 'textarea', skippable: true },
  { id: 'info_obrigatoria', section: 'O pedido', title: 'Quais informações obrigatoriamente precisam aparecer no conteúdo?', hint: 'Liste informações, dados, nomes, benefícios, características ou mensagens indispensáveis.', type: 'textarea', skippable: true },
  { id: 'info_evitar', section: 'O pedido', title: 'Existe alguma informação, palavra ou abordagem que devemos evitar?', hint: 'Informe restrições, termos proibidos ou cuidados específicos.', type: 'textarea', skippable: true },
  { id: 'formato', section: 'Formato e materiais', title: 'Qual formato você imagina para esse conteúdo?', type: 'multicheck', options: ['Post estático', 'Carrossel', 'Reels', 'Stories', 'TikTok', 'LinkedIn', 'Artigo', 'E-mail', 'Outro', 'Não sei, preciso de orientação'], required: true },
  { id: 'ideia_criativa', section: 'Formato e materiais', title: 'Existe alguma ideia ou direcionamento criativo que você já tenha em mente?', hint: 'Descreva sua ideia, mesmo que ainda esteja em estágio inicial.', type: 'textarea', skippable: true },
  { id: 'referencias', section: 'Formato e materiais', title: 'Existem referências de conteúdo, marcas ou campanhas que devemos considerar?', hint: 'Inclua links, perfis ou explique o que você gosta nessas referências.', type: 'textarea', skippable: true },
  { id: 'materiais_disponiveis', section: 'Formato e materiais', title: 'Quais materiais estão disponíveis para produção?', type: 'multicheck', options: ['Fotos', 'Vídeos', 'Banco de imagens', 'Identidade visual', 'Produto', 'Logo', 'Textos', 'Dados/pesquisas', 'Outros', 'Nenhum'], skippable: true },
  { id: 'upload_materiais', section: 'Formato e materiais', title: 'Envie os materiais necessários para a produção.', hint: 'Upload de arquivos e/ou links (cole os links no campo de observações, se preferir).', type: 'upload', skippable: true },
  { id: 'oferta_promocional', section: 'Detalhes finais', title: 'Existe alguma oferta, preço, desconto, condição comercial ou informação promocional?', hint: 'Se sim, informe todos os detalhes, regras e período de validade.', type: 'textarea', skippable: true },
  { id: 'pessoa_mencionar', section: 'Detalhes finais', title: 'Existe alguma pessoa, profissional, influenciador ou parceiro que precisa aparecer ou ser mencionado?', hint: 'Informe nome, perfil e demais informações relevantes.', type: 'textarea', skippable: true },
  { id: 'data_importante', section: 'Detalhes finais', title: 'Existe alguma data importante para publicação?', hint: 'Informe a data e explique por que ela é importante.', type: 'text', skippable: true },
  { id: 'info_adicional', section: 'Detalhes finais', title: 'Existe alguma informação adicional que possa ajudar na criação?', hint: 'Contexto, histórico, dados, acontecimentos recentes ou qualquer informação relevante.', type: 'textarea', skippable: true },
  { id: 'responsavel_aprovacao', section: 'Detalhes finais', title: 'Quem será responsável pela aprovação do conteúdo?', hint: 'Nome + contato.', type: 'text', required: true },
  { id: 'prazo_entrega', section: 'Detalhes finais', title: 'Qual é o prazo desejado para entrega/publicação?', hint: 'Informe data e horário, se houver.', type: 'text', required: true },
];

function UploadField({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  return (
    <div className="space-y-4">
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition hover:bg-[#E97933]/5"
        style={{ borderColor: '#e3e7f7', background: '#f9fafb' }}
      >
        <input
          type="file"
          multiple
          accept="image/*,application/pdf,video/*"
          className="hidden"
          onChange={(e) => {
            if (!e.target.files) return;
            onChange([...files, ...Array.from(e.target.files)]);
          }}
        />
        <Upload size={28} style={{ color: '#E97933' }} />
        <div className="text-sm">
          <span className="font-black" style={{ color: '#E97933' }}>Clique para enviar</span>{' '}
          <span className="text-[#1A1A1A]/40 font-medium">ou arraste os arquivos aqui</span>
        </div>
        <p className="text-xs text-[#1A1A1A]/30 font-medium">Fotos, vídeos ou PDF</p>
      </label>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm border-2"
              style={{ borderColor: '#e3e7f7', background: '#f5f8ff' }}
            >
              <span className="max-w-[200px] truncate font-medium text-[#1A1A1A]/70">📎 {file.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                className="text-[#1A1A1A]/30 hover:text-[#e77f89] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BriefingRedesSociaisWizard({
  clienteUser,
  onEnviado,
}: {
  clienteUser: ClienteUser;
  onEnviado: (numero: number) => void;
}) {
  const submit = useServerFn(submitForm);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [checks, setChecks] = useState<Record<string, string[]>>({});

  const q = QUESTIONS[step];
  const progress = Math.round(((step + 1) / QUESTIONS.length) * 100);

  useEffect(() => {
    if (!started || !q) return;
    if (q.type === 'text' || q.type === 'textarea') {
      setValue(answers[q.id] ?? '');
    } else {
      setValue('');
    }
  }, [step, started]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentValue = useMemo(() => {
    if (!q) return '';
    if (q.type === 'multicheck') return (checks[q.id] ?? []).join(', ');
    if (q.type === 'upload') return (files[q.id] ?? []).map((f) => f.name).join(', ');
    return value.trim();
  }, [q, value, checks, files]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  }

  function persistCurrent() {
    if (!q) return;
    if (q.type === 'text' || q.type === 'textarea') {
      setAnswers((prev) => ({ ...prev, [q.id]: value.trim() }));
    }
  }

  async function goNext() {
    if (!q) return;
    if (q.required && !currentValue) { showToast('Preencha essa etapa antes de continuar.'); return; }
    persistCurrent();
    if (step === QUESTIONS.length - 1) { await handleSubmit(); return; }
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step === 0) { setStarted(false); return; }
    persistCurrent();
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function toggleOption(option: string) {
    if (!q) return;
    setChecks((prev) => {
      const cur = prev[q.id] ?? [];
      return { ...prev, [q.id]: cur.includes(option) ? cur.filter((x) => x !== option) : [...cur, option] };
    });
  }

  async function prepareFilesPayload() {
    const result: Record<string, Array<{ name: string; mimeType: string; base64: string }>> = {};
    for (const [key, fileList] of Object.entries(files)) {
      if (!fileList.length) continue;
      result[key] = await Promise.all(
        fileList.map(async (file) => {
          const compressed = await compressImage(file);
          return {
            name: compressed.name,
            mimeType: compressed.type || 'application/octet-stream',
            base64: await fileToBase64(compressed),
          };
        })
      );
    }
    return result;
  }

  async function handleSubmit() {
    const payload: Record<string, string> = { ...answers };
    if (q && (q.type === 'text' || q.type === 'textarea')) payload[q.id] = value.trim();
    Object.entries(checks).forEach(([key, vals]) => { payload[key] = vals.join(', '); });
    payload['codigo_contrato'] = clienteUser.codigo_contrato;

    setLoading(true);
    try {
      const filesPayload = await prepareFilesPayload();

      // Envia as respostas para o Apps Script de formulários → aba "Briefing_RedesSociais"
      await submit({ data: { kind: 'briefing_redes_sociais', fields: payload, files: filesPayload } });

      // Registra o número sequencial deste briefing no painel do cliente
      let numero = 1;
      try {
        const res = await fetch(CLIENT_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveBriefingRS',
            codigo_contrato: clienteUser.codigo_contrato,
            conteudo: payload.conteudo_solicitado,
            prazo_entrega: payload.prazo_entrega,
          }),
        });
        const json = await res.json();
        if (json.ok && json.numero) numero = json.numero;
      } catch {
        // não bloqueia o sucesso do envio se o registro do número falhar
      }

      setDone(true);
      onEnviado(numero);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: '#e3e7f7' }}>
        <CheckCircle2 size={40} className="mx-auto mb-4" style={{ color: '#E97933' }} />
        <h2 className="text-xl font-black text-[#1A1A1A]">Solicitação enviada com sucesso! 🎉</h2>
        <p className="mt-2 text-[#1A1A1A]/60">
          Recebemos seu pedido de conteúdo. Acompanhe o andamento na aba Início.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-6 text-5xl">📋</div>
        <h2 className="text-2xl font-black text-[#1A1A1A]">Solicitação de Conteúdo</h2>
        <p className="mt-3 text-[#1A1A1A]/60 leading-relaxed">
          Preencha as informações abaixo com o máximo de detalhes possível. Caso não
          tenha alguma definição, sinalize que nossa equipe orienta a construção.
        </p>
        <div className="my-6 flex flex-wrap justify-center gap-3 text-sm">
          {['~10 minutos', `${QUESTIONS.length} etapas`].map((tag) => (
            <span key={tag} className="rounded-full px-4 py-1.5 font-bold" style={{ background: '#FFF3EB', color: '#E97933' }}>{tag}</span>
          ))}
        </div>
        <button
          onClick={() => setStarted(true)}
          className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-black text-white shadow-lg transition hover:opacity-90"
          style={{ background: '#E97933' }}
        >
          Começar agora <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-xl px-4 pb-32 pt-6">
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg"
            style={{ background: '#e77f89' }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#1A1A1A]/40">
          <span>{q?.section}</span>
          <span>{step + 1} / {QUESTIONS.length}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
          <motion.div
            className="h-full rounded-full"
            style={{ background: '#E97933' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.25 }}
        >
          {q && (
            <div>
              <h2 className="text-xl font-black text-[#1A1A1A]">{q.title}</h2>
              {q.hint && (
                <p className="mt-2 whitespace-pre-line text-sm text-[#1A1A1A]/50 leading-relaxed">{q.hint}</p>
              )}
              <div className="mt-6">
                {q.type === 'text' && (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); goNext(); } }}
                    placeholder={q.placeholder}
                    className="w-full rounded-2xl border-2 bg-white px-5 py-4 text-base font-medium text-[#1A1A1A] outline-none transition focus:border-[#E97933]"
                    style={{ borderColor: '#e3e7f7' }}
                    autoFocus
                  />
                )}
                {q.type === 'textarea' && (
                  <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={q.placeholder}
                    rows={4}
                    className="w-full rounded-2xl border-2 bg-white px-5 py-4 text-base font-medium text-[#1A1A1A] outline-none transition focus:border-[#E97933] resize-none"
                    style={{ borderColor: '#e3e7f7' }}
                    autoFocus
                  />
                )}
                {q.type === 'multicheck' && q.options && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((opt) => {
                      const selected = (checks[q.id] ?? []).includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleOption(opt)}
                          className={cn(
                            'rounded-full border-2 px-4 py-2 text-sm font-bold transition',
                            selected
                              ? 'border-[#E97933] bg-[#FFF3EB] text-[#E97933]'
                              : 'border-[#e3e7f7] bg-white text-[#1A1A1A]/60 hover:border-[#E97933]/40'
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
                {q.type === 'upload' && (
                  <UploadField
                    files={files[q.id] ?? []}
                    onChange={(newFiles) => setFiles((prev) => ({ ...prev, [q.id]: newFiles }))}
                  />
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between border-t bg-white px-5 py-4" style={{ borderColor: '#e3e7f7' }}>
        <button
          onClick={goBack}
          className="inline-flex items-center gap-2 rounded-full border-2 px-5 py-2.5 text-sm font-bold text-[#1A1A1A]/60 transition hover:border-[#E97933]/40"
          style={{ borderColor: '#e3e7f7' }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-3">
          {q?.skippable && (
            <button
              onClick={() => { persistCurrent(); setDirection(1); setStep((s) => s + 1); }}
              className="text-sm font-bold text-[#1A1A1A]/40 transition hover:text-[#1A1A1A]/60"
            >
              Pular
            </button>
          )}
          <button
            onClick={goNext}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-black text-white shadow transition hover:opacity-90 disabled:opacity-60"
            style={{ background: '#E97933' }}
          >
            {loading ? 'Enviando...' : step === QUESTIONS.length - 1 ? (
              <><Send size={16} /> Enviar</>
            ) : (
              <><CornerDownLeft size={16} /> Continuar</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
