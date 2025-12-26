require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();

/* ================= Middleware ================= */
app.use(cors());
app.use(express.json());

/* ================= Health Check ================= */
app.get("/", (req, res) => {
  res.status(200).send("Backend is running");
});

/* ================= Env Vars ================= */
const { RESEND_API_KEY, EMAIL_TO } = process.env;

if (!RESEND_API_KEY || !EMAIL_TO) {
  console.warn(
    "⚠️ Missing RESEND_API_KEY or EMAIL_TO in environment variables"
  );
}

/* ================= Resend Client ================= */
const resend = new Resend(RESEND_API_KEY);

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
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: EMAIL_TO,
      reply_to: email,
      subject: `New Contact Message from ${name || email}`,
      html: `
        <h3>New Portfolio Message</h3>
        <p><strong>Name:</strong> ${name || "Anonymous"}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br/>")}</p>
      `,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("Resend error:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to send email",
    });
  }
});

/* ================= Server ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
