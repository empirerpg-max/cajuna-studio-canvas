import { createFileRoute } from '@tanstack/react-router';
import { SiteShell } from '@/components/SiteShell';

export const Route = createFileRoute('/politica-de-privacidade')({
  head: () => ({
    meta: [
      { title: 'Política de Privacidade — Cajuna Studio' },
      {
        name: 'description',
        content:
          'Saiba como a Cajuna Studio coleta, usa e protege os seus dados pessoais, de acordo com a LGPD (Lei nº 13.709/2018).',
      },
      { property: 'og:title', content: 'Política de Privacidade — Cajuna Studio' },
      { property: 'og:description', content: 'Como tratamos os seus dados pessoais.' },
    ],
  }),
  component: PoliticaPrivacidade,
});

const WHATSAPP_URL = 'https://wa.me/5584987692648';
const WHATSAPP_LABEL = '(84) 98769-2648';
const INSTAGRAM_URL = 'https://www.instagram.com/cajunastudio';
const ATUALIZADA_EM = '17 de novembro de 2026';

type Secao = { titulo: string; conteudo: React.ReactNode };

const secoes: Secao[] = [
  {
    titulo: '1. Quem somos',
    conteudo: (
      <>
        <p>
          A <strong>Cajuna Studio</strong> é um estúdio de criação de identidade visual e de
          gerenciamento de redes sociais, com origem em Natal, Rio Grande do Norte. Esta política
          vale para o site <strong>cajunastudio.com.br</strong>, para os formulários de anúncios
          que veiculamos no Facebook e no Instagram e para o atendimento que fazemos por WhatsApp
          e Instagram.
        </p>
        <p>
          Para a LGPD (Lei nº 13.709/2018), a Cajuna Studio é a <strong>controladora</strong> dos
          dados pessoais descritos aqui, ou seja, quem decide como eles são usados.
        </p>
      </>
    ),
  },
  {
    titulo: '2. Quais dados coletamos',
    conteudo: (
      <>
        <p>Só pedimos o que é necessário para falar com você e para fazer o seu projeto:</p>
        <ul>
          <li>
            <strong>Formulário de orçamento:</strong> nome, e-mail, WhatsApp, serviço de interesse
            e a mensagem que você escrever.
          </li>
          <li>
            <strong>Briefing (identidade visual ou redes sociais):</strong> suas respostas sobre a
            marca, como nome, descrição do negócio, público, concorrentes, referências visuais,
            redes e site, além dos arquivos que você enviar, como logos e imagens.
          </li>
          <li>
            <strong>Formulários de anúncios (Facebook e Instagram):</strong> nome, WhatsApp, nome
            ou tipo do seu negócio, o que você precisa e em que fase está. Esses dados chegam até
            nós pela plataforma da Meta, quando você escolhe preencher o formulário.
          </li>
          <li>
            <strong>Área do Cliente:</strong> o código do contrato e o código de acesso, usados
            para você acompanhar o andamento do seu projeto.
          </li>
          <li>
            <strong>Conversas:</strong> mensagens trocadas por WhatsApp e Instagram com a nossa
            equipe.
          </li>
        </ul>
        <p>
          Não pedimos dados bancários, documentos pessoais (como CPF ou RG) nem dados pessoais
          sensíveis nos formulários. Por favor, não envie esse tipo de informação nos campos de
          texto livre.
        </p>
      </>
    ),
  },
  {
    titulo: '3. Para que usamos e em que base legal',
    conteudo: (
      <>
        <ul>
          <li>
            <strong>Responder seu contato e montar o orçamento:</strong> com base no seu{' '}
            <em>consentimento</em> (art. 7º, I) e nos procedimentos preliminares a um contrato
            (art. 7º, V).
          </li>
          <li>
            <strong>Executar o projeto contratado</strong> (identidade visual, redes sociais e
            demais serviços), incluindo o uso do briefing e o acompanhamento na Área do Cliente:
            com base na <em>execução de contrato</em> (art. 7º, V).
          </li>
          <li>
            <strong>Retornar o seu interesse em anúncios e novos contatos comerciais:</strong> com
            base no seu <em>consentimento</em> e no nosso <em>legítimo interesse</em> em atender
            quem nos procurou (art. 7º, IX), respeitando as suas expectativas.
          </li>
          <li>
            <strong>Cumprir obrigações legais e regulatórias,</strong> como emissão de notas e
            guarda de registros (art. 7º, II).
          </li>
        </ul>
        <p>Não usamos os seus dados para decisões automatizadas e não os vendemos.</p>
      </>
    ),
  },
  {
    titulo: '4. Com quem compartilhamos',
    conteudo: (
      <>
        <p>
          Só compartilhamos dados com empresas que fazem parte do funcionamento dos nossos
          serviços, e apenas no que for necessário:
        </p>
        <ul>
          <li>
            <strong>Google:</strong> usamos ferramentas como Planilhas, Drive e Apps Script para
            receber e organizar formulários e arquivos, e o Google Fonts para exibir as fontes do
            site.
          </li>
          <li>
            <strong>Meta (Facebook, Instagram e WhatsApp):</strong> para veicular anúncios,
            receber os formulários instantâneos e conversar com você. O tratamento feito pela Meta
            segue as políticas dela.
          </li>
          <li>
            <strong>Serviços de hospedagem e infraestrutura do site.</strong>
          </li>
          <li>
            <strong>Autoridades públicas,</strong> quando houver obrigação legal ou ordem judicial.
          </li>
        </ul>
        <p>
          Algumas dessas empresas armazenam dados em servidores fora do Brasil. Nesses casos, a
          transferência acontece conforme o art. 33 da LGPD, com fornecedores que adotam medidas
          de proteção adequadas.
        </p>
      </>
    ),
  },
  {
    titulo: '5. Cookies e rastreamento',
    conteudo: (
      <p>
        Este site não usa cookies de publicidade nem ferramentas próprias de análise de acesso. Ao
        abrir uma página, o seu navegador se conecta ao Google Fonts para carregar a tipografia,
        e o Google pode receber o seu endereço IP nessa conexão. Se passarmos a usar cookies de
        medição ou de anúncios no site, vamos atualizar esta política e pedir o seu consentimento
        quando necessário.
      </p>
    ),
  },
  {
    titulo: '6. Por quanto tempo guardamos',
    conteudo: (
      <>
        <p>
          Guardamos os dados pelo tempo necessário para cumprir as finalidades acima e as
          obrigações legais:
        </p>
        <ul>
          <li>
            <strong>Clientes:</strong> durante o contrato e pelo prazo exigido por lei depois dele.
          </li>
          <li>
            <strong>Contatos que não viraram contratação:</strong> por até 12 meses, quando os
            dados são excluídos ou anonimizados, salvo se você pedir a exclusão antes.
          </li>
        </ul>
      </>
    ),
  },
  {
    titulo: '7. Seus direitos',
    conteudo: (
      <>
        <p>Pela LGPD (art. 18), você pode pedir a qualquer momento:</p>
        <ul>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
          <li>portabilidade dos dados, quando aplicável;</li>
          <li>eliminação dos dados tratados com base no seu consentimento;</li>
          <li>informação sobre com quem compartilhamos os seus dados;</li>
          <li>revogação do consentimento, sem prejuízo do tratamento feito antes dela.</li>
        </ul>
        <p>
          Responderemos ao seu pedido em até 15 dias. Se achar que o seu direito não foi
          respeitado, você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </>
    ),
  },
  {
    titulo: '8. Como falar com a gente sobre seus dados',
    conteudo: (
      <p>
        Para exercer seus direitos ou tirar dúvidas, chame a gente no WhatsApp{' '}
        <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="font-bold underline">
          {WHATSAPP_LABEL}
        </a>{' '}
        ou no Instagram{' '}
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="font-bold underline">
          @cajunastudio
        </a>
        , informando que o assunto é &ldquo;privacidade&rdquo;. Para a sua segurança, podemos
        pedir uma confirmação de identidade antes de atender o pedido.
      </p>
    ),
  },
  {
    titulo: '9. Segurança',
    conteudo: (
      <p>
        Usamos medidas técnicas e organizacionais para proteger os dados, como conexão segura
        (HTTPS), acesso restrito às planilhas e pastas onde as informações ficam e uso de códigos
        individuais na Área do Cliente. Nenhum sistema é totalmente imune a falhas; se houver um
        incidente que possa gerar risco relevante, avisaremos você e a ANPD, como manda a lei.
      </p>
    ),
  },
  {
    titulo: '10. Crianças e adolescentes',
    conteudo: (
      <p>
        Os nossos serviços são voltados a empresas e empreendedores adultos. Não coletamos
        intencionalmente dados de menores de 18 anos. Se identificarmos algum, vamos excluí-lo.
      </p>
    ),
  },
  {
    titulo: '11. Mudanças nesta política',
    conteudo: (
      <p>
        Podemos atualizar esta política para refletir mudanças no site, nos serviços ou na
        legislação. A versão em vigor é sempre a desta página, com a data da última atualização
        no topo.
      </p>
    ),
  },
];

function PoliticaPrivacidade() {
  return (
    <SiteShell>
      <section style={{ backgroundColor: '#FFF8F2' }}>
        <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
          <span
            className="inline-block rounded-full border-2 border-[#1A1A1A] px-4 py-1 text-xs font-black uppercase tracking-wide"
            style={{ backgroundColor: '#E97933', color: '#1A1A1A' }}
          >
            Privacidade
          </span>
          <h1 className="mt-5 text-4xl md:text-5xl font-black leading-tight" style={{ color: '#1A1A1A' }}>
            Política de Privacidade
          </h1>
          <p className="mt-3 text-sm font-medium" style={{ color: '#1A1A1A99' }}>
            Última atualização: {ATUALIZADA_EM}
          </p>
          <p className="mt-6 text-lg font-medium leading-relaxed" style={{ color: '#1A1A1A' }}>
            Aqui explicamos, de forma direta, quais dados pessoais a Cajuna Studio coleta, por que
            coleta, com quem compartilha e como você controla tudo isso.
          </p>

          <div className="mt-10 space-y-8">
            {secoes.map((s) => (
              <section
                key={s.titulo}
                className="rounded-3xl border-2 border-[#1A1A1A] bg-white p-6 md:p-8"
              >
                <h2 className="text-xl md:text-2xl font-black" style={{ color: '#2D5F8A' }}>
                  {s.titulo}
                </h2>
                <div
                  className="mt-3 space-y-3 text-[15px] leading-relaxed font-medium [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5"
                  style={{ color: '#1A1A1A' }}
                >
                  {s.conteudo}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
