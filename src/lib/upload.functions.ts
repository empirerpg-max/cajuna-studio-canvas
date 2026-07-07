/**
 * upload.functions.ts
 *
 * Com a migração para Apps Script, o upload de arquivos passou a ser feito
 * diretamente pelo Apps Script (doPost), junto com o envio do formulário.
 *
 * O briefing.tsx converte os arquivos em base64 no cliente e os inclui no
 * payload enviado para submitForm → Apps Script → Drive.
 *
 * Esta função é mantida para compatibilidade de importação, mas não é mais
 * chamada diretamente.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const uploadSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  base64: z.string().min(1),
});

/**
 * @deprecated O upload agora é feito pelo Apps Script junto com o submitForm.
 * Esta função não é mais utilizada pelo briefing.tsx.
 */
export const uploadFileToDrive = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof uploadSchema>) =>
    uploadSchema.parse(data)
  )
  .handler(async () => {
    throw new Error(
      "uploadFileToDrive foi descontinuado. O upload agora é feito pelo Apps Script."
    );
  });
