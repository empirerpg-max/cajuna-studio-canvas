import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DRIVE_FOLDER_ID = "11ZQz_fGvsK9zlq6uHwfsFSLSVFD92voz";

// JWT mínimo para autenticar com Service Account sem dependências externas
async function getServiceAccountToken(sa: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const unsigned = `${encode(header)}.${encode(payload)}`;

  // Importa a chave privada PEM
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "");
  const keyBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsigned}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[drive-auth] ${res.status} ${body}`);
  }

  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

const uploadSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  // base64 do arquivo
  base64: z.string().min(1),
});

export const uploadFileToDrive = createServerFn({ method: "POST" })
  .inputValidator((data: z.infer<typeof uploadSchema>) => uploadSchema.parse(data))
  .handler(async ({ data }) => {
    const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!saJson) throw new Error("Envio de arquivos indisponível no momento.");

    const sa = JSON.parse(saJson) as { client_email: string; private_key: string };
    const token = await getServiceAccountToken(sa);

    // Metadata do arquivo
    const metadata = JSON.stringify({
      name: data.name,
      parents: [DRIVE_FOLDER_ID],
    });

    // Monta multipart/related
    const boundary = "cajuna_boundary";
    const fileBytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));

    const bodyParts = [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      `--${boundary}\r\nContent-Type: ${data.mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${data.base64}\r\n`,
      `--${boundary}--`,
    ];
    const bodyStr = bodyParts.join("");

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body: bodyStr,
      }
    );

    if (!uploadRes.ok) {
      const body = await uploadRes.text();
      throw new Error(`[drive-upload] ${uploadRes.status} ${body}`);
    }

    const { id, webViewLink } = (await uploadRes.json()) as {
      id: string;
      webViewLink: string;
    };

    // Torna o arquivo público (leitura)
    await fetch(`https://www.googleapis.com/drive/v3/files/${id}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    });

    return { link: webViewLink };
  });
