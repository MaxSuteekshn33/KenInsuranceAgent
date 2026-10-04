// Exchanges the Google OAuth code for a refresh token and shows it once, so it can be
// copied into .env.local (or Vercel env vars) as GMAIL_REFRESH_TOKEN. We never store it
// ourselves — matches the project's existing convention of the user owning all secrets
// in .env.local, never Claude reading or writing them.

function htmlPage(body: string) {
  return new Response(
    `<!doctype html><html><body style="font-family: -apple-system, sans-serif; max-width: 640px; margin: 60px auto; color: #0a2540;">${body}</body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return htmlPage(`<h2>Gmail connection failed</h2><p>Google returned: <code>${oauthError}</code></p>`);
  }
  if (!code) {
    return htmlPage(`<h2>Gmail connection failed</h2><p>No authorization code was returned.</p>`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return htmlPage(`<h2>Gmail connection failed</h2><p>GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not configured on this deployment.</p>`);
  }

  const redirectUri = new URL("/api/auth/gmail/callback", req.url).toString();

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return htmlPage(
      `<h2>Gmail connection failed</h2><p>Google token exchange returned an error:</p><pre>${JSON.stringify(tokenData, null, 2)}</pre>`
    );
  }

  if (!tokenData.refresh_token) {
    return htmlPage(
      `<h2>No refresh token returned</h2><p>Google only returns a refresh token on the first consent for an app, or when you force re-consent. Go to <a href="https://myaccount.google.com/permissions" target="_blank">Google Account → Security → Third-party access</a>, remove this app's access, then try the connect link again.</p>`
    );
  }

  return htmlPage(`
    <h2>Gmail connected</h2>
    <p>Copy this into <code>.env.local</code> (and later into your Vercel project's env vars):</p>
    <pre style="background:#f1f1f1; padding:16px; border-radius:8px; overflow-x:auto;">GMAIL_REFRESH_TOKEN=${tokenData.refresh_token}</pre>
    <p style="color:#777; font-size:14px;">This page does not store the token anywhere — copy it now. Restart the dev server after saving it so Ken's send_email tool picks it up.</p>
    <p><a href="/ken-agent">&larr; Back to Ken</a></p>
  `);
}
