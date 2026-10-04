// Real Gmail send, bypassing the Pine Labs platform's broken Gmail connector vault
// entirely — same approach as the in-app unified agent bypassing the Delhivery
// authorized_tools bug. Uses the refresh token obtained once via
// app/api/auth/gmail/{route,callback}.ts, never a Pine Labs credential.
import { z } from "zod/v4";

export const sendEmailSchema = z.object({
  to: z.string(),
  subject: z.string(),
  body: z.string(),
});

async function getAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token as string;
}

function toBase64Url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmail(args: z.infer<typeof sendEmailSchema>) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return { error: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured on this deployment." };
  }
  if (!process.env.GMAIL_REFRESH_TOKEN) {
    return { error: "Gmail is not connected yet. Visit /api/auth/gmail to connect a mailbox." };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { error: "Failed to refresh the Gmail access token. The connection may need to be redone via /api/auth/gmail." };
  }

  const mime = [`To: ${args.to}`, `Subject: ${args.subject}`, "Content-Type: text/plain; charset=utf-8", "", args.body].join(
    "\n"
  );

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: toBase64Url(mime) }),
  });

  const data = await res.json();
  if (!res.ok) {
    return { error: `Gmail API error: ${data.error?.message ?? res.statusText}` };
  }

  return { message_id: data.id, thread_id: data.threadId, to: args.to, subject: args.subject };
}
