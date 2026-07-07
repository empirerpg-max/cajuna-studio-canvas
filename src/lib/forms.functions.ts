import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SPREADSHEET_ID = "1dh5i2ZD1dqgr6vH9UYxBHcxOVXbND3MH9rT82lnpbGE";

const FormKind = z.enum(["orcamento", "briefing", "contratacao"]);

const schema = z.object({
  kind: FormKind,
  fields: z.record(z.string(), z.string().max(5000)),
});

type FormPayload = z.infer<typeof schema>;

const SHEET_BY_KIND: Record<z.infer<typeof FormKind>, string> = {
  orcamento: "Orcamento",
  briefing: "Briefing",
  contratacao: "Contratacao",
};

/**
 * Ordem fixa das colunas por formulário.
 * IMPORTANTE: a ordem aqui define diretamente as colunas da planilha (B, C, D...).
 * Nunca remova ou reordene — apenas acrescente ao final.
 * Coluna A é sempre o timestamp gerado automaticamente.
 */
const COLUMNS_BY_KIND: Record<z.infer<typeof FormKind>, string[]> = {
  briefing: [
    // B  — Vamos nos conhecer
    "nome",
    // C
    "email",
    // D
    "parceiro",
    // E  — Sua empresa
    "nome_marca",
    // F
    "historia_nome",
    // G
    "descricao",
    // H
    "slogan",
    // I
    "concorrentes",
    // J
    "mvv",
    // K
    "publico",
    // L
    "diferencial",
    // M
    "sensacao",
    // N
    "personalidade",
    // O
    "tres_palavras",
    // P
    "redes",
    // Q  — Referências visuais
    "simbolo",
    // R
    "cores",
    // S
    "cores_nao",
    // T
    "logo_antigo",
    // U
    "logos_ref",
    // V
    "elementos",
    // W
    "aplicacoes",
    // X
    "imagem_marca",
    // Y  — Arquivos (links do Drive)
    "upload_refs",
    // Z
    "upload_fotos",
    // AA
    "upload_logo_antigo",
    // AB — Detalhes finais
    "contatos",
    // AC
    "destaques",
    // AD
    "livre",
  ],

  orcamento: [
    // B
    "nome",
    // C
    "email",
    // D
    "whatsapp",
    // E
    "servico",
    // F
    "mensagem",
  ],

  contratacao: [
    // B
    "nome",
    // C
    "email",
    // D
    "whatsapp",
    // E
    "servico",
    // F
    "mensagem",
  ],
};

export const submitForm = createServerFn({ method: "POST" })
  .inputValidator((data: FormPayload) => schema.parse(data))
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (!lovableKey || !sheetsKey) {
      throw new Error("Integração com Google Sheets indisponível.");
    }

    const sheet = SHEET_BY_KIND[data.kind];
    const timestamp = new Date().toISOString();

    // Monta a linha com ordem fixa — campos ausentes viram string vazia
    const columns = COLUMNS_BY_KIND[data.kind];
    const row = [timestamp, ...columns.map((key) => data.fields[key] ?? "")];

    const url = `https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheet}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": sheetsKey,
      },
      body: JSON.stringify({ values: [row] }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[sheets] append failed", res.status, body);
      throw new Error(
        `Falha ao enviar (${res.status}). Tente novamente em instantes.`
      );
    }

    return { ok: true as const };
  });
