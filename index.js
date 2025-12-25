require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_TO } =
  process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
  console.warn(
    "Warning: Missing SMTP or EMAIL_TO env vars. See server/.env.example"
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

app.post("/send", async (req, res) => {
  const { name, email, subject, message } = req.body || {};
  if (!message || !email)
    return res
      .status(400)
      .json({ ok: false, error: "Missing required fields" });

  const mailOptions = {
    from: SMTP_USER,
    to: EMAIL_TO,
    subject: subject || `Contact form message from ${name || email}`,
    text: `From: ${name || "Anonymous"} <${email}>\n\n${message}`,
    html: `<p><strong>From:</strong> ${
      name || "Anonymous"
    } &lt;${email}&gt;</p><hr/><p>${(message || "").replace(
      /\n/g,
      "<br/>"
    )}</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return res.json({ ok: true, info });
  } catch (err) {
    console.error("sendMail error", err);
    return res
      .status(500)
      .json({ ok: false, error: err.message || String(err) });
  }
});

const listenPort = Number(process.env.PORT) || 4000;
app.listen(listenPort, () => {
  console.log(`Contact backend listening on http://localhost:${listenPort}`);
});
