# Gmail — real send, bypassing Pine Labs (replaces setup-gmail-oauth.md)

Pine Labs' Gmail connector has a broken credential vault (documented in project memory,
2026-10-03/04 sessions) — the same class of platform bug as the Delhivery
`authorized_tools` issue that forced the unified in-app agent. Rather than wait on Pine
Labs, Ken's `send_email` tool talks to the real Gmail API directly from this app, using
its own Google Cloud OAuth app and a one-time consent link.

`docs/setup-gmail-oauth.md` (the Pine Labs connector path) is now superseded — kept only
as a record of the bug repro steps.

## 1. Create a Google Cloud OAuth client (you do this — takes ~5 minutes)

1. Go to **console.cloud.google.com**, create a project (e.g. "ken-insurance-agent") if
   you don't already have one from the abandoned Pine Labs attempt — you can reuse that
   same project.
2. **APIs & Services → Library** → search **Gmail API** → **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - App name: "Ken", your email as support/contact.
   - Scopes: add `https://www.googleapis.com/auth/gmail.send` only (the app only sends,
     never reads).
   - **Test users**: add the Gmail address you want Ken to send from. Keeps the app in
     Testing mode — instant, no Google review needed.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Name: "Ken — in-app Gmail bypass".
   - **Authorized redirect URIs**: add `http://localhost:3018/api/auth/gmail/callback`
     for local dev. Add the production URL's equivalent
     (`https://<your-vercel-domain>/api/auth/gmail/callback`) once deployed.
5. Save. Copy the **Client ID** and **Client Secret**.

## 2. Add credentials to `.env.local`

Add these two lines (I never read this file — paste them in yourself):

```
GOOGLE_CLIENT_ID=<client id from step 1>
GOOGLE_CLIENT_SECRET=<client secret from step 1>
```

Restart the dev server after saving so it picks them up.

## 3. Connect a mailbox (one-time, per environment)

1. With the dev server running, open `http://localhost:3018/api/auth/gmail` (or click
   "Connect Gmail mailbox" on `/ken-agent`).
2. Sign in with the Gmail account you added as a test user, approve the consent screen.
3. The callback page shows a `GMAIL_REFRESH_TOKEN=...` value once — copy it into
   `.env.local` as a third line:

```
GMAIL_REFRESH_TOKEN=<token from the callback page>
```

4. Restart the dev server again. Ken's `send_email` tool is now live — it will refuse to
   run (with a clear error, not a fabricated result) until all three env vars are
   present.

If you ever see "No refresh token returned," Google only issues one on first consent —
revoke the app's access at
[myaccount.google.com/permissions](https://myaccount.google.com/permissions) and repeat
step 3.

## Redeploying to Vercel later

Repeat step 3 against the production URL (its own redirect URI must be added in Google
Cloud Console first, per step 1), and set all three env vars in the Vercel project
settings. The refresh token is long-lived and doesn't expire on its own, so this is a
one-time action per environment, not per session.
