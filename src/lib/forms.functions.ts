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
    const row = [timestamp, ...Object.values(data.fields)];

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
      throw new Error(`Falha ao enviar (${res.status}). Tente novamente em instantes.`);
    }

    return { ok: true as const };
  });
