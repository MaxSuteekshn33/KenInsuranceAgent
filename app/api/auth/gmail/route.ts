// One-time OAuth link to connect a real Gmail mailbox for Ken's send_email tool —
// bypasses the Pine Labs platform entirely (its Gmail connector vault is broken; see
// docs/setup-gmail-oauth.md for that abandoned path). This route builds the Google
// consent URL; app/api/auth/gmail/callback/route.ts exchanges the resulting code for a
// refresh token.

const SCOPES = ["https://www.googleapis.com/auth/gmail.send"];

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return Response.json(
      { error: "GOOGLE_CLIENT_ID is not configured. See docs/setup-gmail-bypass.md." },
      { status: 500 }
    );
  }

  const redirectUri = new URL("/api/auth/gmail/callback", req.url).toString();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
