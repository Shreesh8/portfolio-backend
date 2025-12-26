require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

/* ================= Middleware ================= */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ================= Health Check ================= */
app.get("/", (req, res) => {
  res.status(200).send("Backend is running");
});

/* ================= Env Vars ================= */
const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_TO } =
  process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
  console.warn("⚠️ Missing SMTP / EMAIL_TO env vars");
}

/* ================= Mail Transport ================= */
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT), // ✅ EXACT port from Render
  secure: SMTP_SECURE === "true", // ✅ true for 465
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
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
      subject: `New contact message from ${name || email}`,
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
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
