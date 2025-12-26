require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

/* ================= Middleware ================= */
app.use(cors());
app.use(express.json());

/* ================= Health Check (IMPORTANT) ================= */
/* This prevents Render cold-start timeout */
app.get("/", (req, res) => {
  res.status(200).send("Backend is running");
});

/* ================= Env Vars ================= */
const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_TO } =
  process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
  console.warn(
    "⚠️ Warning: Missing SMTP or EMAIL_TO env vars. Check Render environment variables."
  );
}

/* ================= Mail Transport ================= */
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/* ================= Contact Route ================= */
app.post("/send", async (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!email || !message) {
    return res.status(400).json({
      ok: false,
      error: "Missing required fields",
    });
  }

  const mailOptions = {
    from: SMTP_USER,
    to: EMAIL_TO,
    subject: subject || `Contact form message from ${name || email}`,
    text: `From: ${name || "Anonymous"} <${email}>\n\n${message}`,
    html: `
      <p><strong>From:</strong> ${name || "Anonymous"} &lt;${email}&gt;</p>
      <hr/>
      <p>${message.replace(/\n/g, "<br/>")}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ ok: true });
  } catch (err) {
    console.error("sendMail error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to send email",
    });
  }
});

/* ================= Server ================= */
const listenPort = Number(process.env.PORT) || 4000;
app.listen(listenPort, () => {
  console.log(`✅ Contact backend running on port ${listenPort}`);
});
