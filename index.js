require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

/* ================= Middleware ================= */
app.use(cors());
app.use(express.json());

/* ================= Health Check ================= */
app.get("/", (req, res) => {
  res.status(200).send("Backend is running");
});

/* ================= Env Vars ================= */
const { SMTP_USER, SMTP_PASS, EMAIL_TO } = process.env;

if (!SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
  console.warn("⚠️ Missing SMTP_USER / SMTP_PASS / EMAIL_TO env vars");
}

/* ================= Mail Transport (RENDER FIX) ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS, // Gmail App Password
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/* ================= Contact Route ================= */
app.post("/send", async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!email || !message) {
    return res.status(400).json({
      ok: false,
      error: "Missing required fields",
    });
  }

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${SMTP_USER}>`,
      to: EMAIL_TO,
      replyTo: email,
      subject: `New Contact Message from ${name || email}`,
      text: `From: ${name || "Anonymous"} <${email}>\n\n${message}`,
      html: `
        <p><strong>From:</strong> ${name || "Anonymous"} &lt;${email}&gt;</p>
        <hr/>
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ sendMail error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to send email",
    });
  }
});

/* ================= Server ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Contact backend running on port ${PORT}`);
});
