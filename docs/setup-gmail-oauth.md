# Setting up Gmail OAuth for the Pine Labs Gmail connector

The platform's Gmail connector needs a real Google Cloud OAuth **Client ID + Client
Secret** (Web application type), then does a genuine Google consent screen. There's no
sandbox shortcut — do this once, takes about 10-15 minutes.

## Steps

1. Go to **console.cloud.google.com** and create a new project (e.g. "ken-insurance-agent").
2. In **APIs & Services → Library**, search for **Gmail API** and click **Enable**.
3. In **APIs & Services → OAuth consent screen**:
   - User type: **External** (unless you have a Workspace org to use Internal).
   - Fill app name ("Ken"), your email as support/contact.
   - Scopes: add `https://www.googleapis.com/auth/gmail.readonly` and
     `https://www.googleapis.com/auth/gmail.send` (read-only + send, matching what the
     connector's tools actually do: `get_thread`, `read_inbox`, `search_emails`, `send_email`).
   - Under **Test users**, add the Gmail address you intend to use as "Ken's mailbox"
     (this keeps the app in Testing mode, which is fine and instant — no Google review needed).
4. In **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Name: "Ken — Pine Labs connector".
   - **Authorized redirect URIs**: leave this blank for now — see the trick below.
5. Save. Copy the **Client ID** and **Client Secret**.
6. On the Pine Labs platform: Connectors → Register Connector → click **Gmail**'s
   Register button (prefills the form) → give it a unique name (e.g. `gmail_ken`) →
   paste Client ID + Secret → click **Continue with Google**.
7. **The redirect URI trick:** since step 4 left the redirect URI blank, Google will
   reject the OAuth attempt with a `redirect_uri_mismatch` error page. That error page
   **shows you the exact `redirect_uri` the Pine Labs platform tried to use**. Copy it.
8. Go back to Google Cloud Console → your OAuth client → add that exact URI under
   **Authorized redirect URIs** → Save.
9. Go back to Pine Labs and click **Continue with Google** again — it should now
   complete the consent screen (click Allow) and register successfully.

## Which Gmail account to use

Use a dedicated Gmail account for "Ken" rather than your personal one, since the agent
will be sending/reading real emails from it during the recording (e.g. the insurer
negotiation thread, and the "forward a bank SMS" style external input the brief
mentions). A fresh free Gmail account works fine as a test user in step 3.
