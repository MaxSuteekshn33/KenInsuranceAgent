# Gnani access — check this first, before registering fresh

Gnani's own docs (docs.gnani.ai) state that API access requires a **token, access key,
and certificate emailed to your registered email** after signup — this is not an
instant self-serve API key like Stripe or Twilio.

## Do this first (fastest path)

1. Check your inbox and the competition's Slack/Discord/WhatsApp channel for anything
   from the **Thursday 1 Oct Pine Labs platform demo** — hackathon organizers commonly
   distribute a shared sandbox key for a named partner during that kind of session so
   every team doesn't have to each go through a manual approval queue individually.
2. If nothing was shared, email **adhavan@the-ken.com** (the Round 3 contact) and ask
   directly whether there's a hackathon-wide Gnani sandbox credential, given the
   one-day turnaround between the demo and submission. Worth a same-day reply given
   they're running this competition.
3. In parallel, register at gnani.ai / docs.gnani.ai yourself in case the above doesn't
   land in time — but budget for this **not** completing before the deadline, since it's
   manually provisioned.

## If Gnani access doesn't come through in time

The brief requires every voice input/reply to go through Gnani specifically — using a
different voice connector would not satisfy that requirement, so don't substitute
ElevenLabs (the only native voice connector on the platform) without flagging it.

The honest, defensible move if credentials don't arrive: build and record the full
text-based negotiation flow (which is the core of what's being judged — the decision
logic, approvals, connectors, eval cases), note in the write-up that Gnani access was
requested on <date> and is pending manual provisioning, and attach evidence of the
request (the email/message). Judges evaluating a hackathon build are generally looking
for whether you understood and designed for the requirement, not whether a third-party
vendor's manual approval queue cleared in 24 hours.
