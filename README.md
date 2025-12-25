# Contact backend

This small Express backend accepts a POST to `/send` and forwards the message to the email configured in `EMAIL_TO` via SMTP.

1. Copy `.env.example` to `.env` and fill values (see Gmail notes below).

2. Install and run (from the project root):

```bash
cd server
npm install
npm start
```

3. Endpoint: `POST /send` with JSON body `{ name, email, subject, message }`.

Test with curl:

```bash
curl -X POST http://localhost:4000/send \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"me@example.com","subject":"hello","message":"hi there"}'
```

Gmail notes: enable 2FA and create an App Password to use as `SMTP_PASS`.
