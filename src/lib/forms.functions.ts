import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * URL da Web App do Google Apps Script.
 * Publique o script em: script.google.com → Implantar → Nova implantação → Web App
 * Executar como: Eu mesmo | Acesso: Qualquer pessoa
 * Cole a URL gerada na variável de ambiente APPS_SCRIPT_URL.
 */

const FormKind = z.enum(["orcamento", "briefing", "contratacao"]);

const schema = z.object({
  kind: FormKind,
  fields: z.record(z.string(), z.string().max(5000)),
  // arquivos já convertidos em base64 para envio ao Apps Script
  files: z
    .record(
      z.string(),
      z.array(
        z.object({
          name: z.string(),
          mimeType: z.string(),
          base64: z.string(),
        })
      )
    )
    .optional(),
});

type FormPayload = z.infer<typeof schema>;

export const submitForm = createServerFn({ method: "POST" })
  .inputValidator((data: FormPayload) => schema.parse(data))
  .handler(async ({ data }) => {
    const scriptUrl =
      process.env.APPS_SCRIPT_URL ||
      "https://script.google.com/macros/s/AKfycbzLIGSK2zZRBeYFZMoV6-4M4tC70UaruWDWCxeWH6wd2y8LbaMbqDi6fe_ruJ4-hL5A/exec";

    const res = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Redireciona automaticamente (Apps Script retorna 302 → 200)
      redirect: "follow",
      body: JSON.stringify({
        kind: data.kind,
        fields: data.fields,
        files: data.files ?? {},
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[apps-script] falha", res.status, body);
      throw new Error(
        `Falha ao enviar (${res.status}). Tente novamente em instantes.`
      );
    }

    const json = (await res.json()) as { ok: boolean; error?: string };
    if (!json.ok) {
      throw new Error(json.error ?? "Erro desconhecido no servidor.");
    }

    return { ok: true as const };
  });
