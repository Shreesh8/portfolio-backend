require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

/* ================= Middleware ================= */
app.use(cors());
app.use(express.json());

/* ================= Health Check ================= */
/* Prevents Render cold start timeouts */
app.get("/", (req, res) => {
  res.status(200).send("Backend is running");
});

/* ================= Env Vars ================= */
const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_TO } =
  process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_TO) {
  console.warn(
    "⚠️ Missing SMTP or EMAIL_TO env vars. Check Render environment variables."
  );
}

/* ================= Mail Transport (RENDER SAFE) ================= */
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT), // MUST be 587 on Render
  secure: false, // MUST be false for 587 (STARTTLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  requireTLS: true,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/* ================= Verify SMTP ================= */
transporter.verify((err) => {
  if (err) {
    console.error("❌ SMTP VERIFY FAILED:", err);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
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
    from: `"Portfolio Contact" <${SMTP_USER}>`,
    to: EMAIL_TO,
    replyTo: email,
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
  console.log(`✅ Contact backend running on port ${PORT}`);
});
