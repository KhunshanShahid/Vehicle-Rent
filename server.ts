import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import twilio from "twilio";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Twilio API Endpoint
  app.post("/api/send-sms", async (req, res) => {
    const { to, message } = req.body;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return res.status(500).json({ 
        error: "Twilio credentials are not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER in the environment." 
      });
    }

    try {
      const client = twilio(accountSid, authToken);
      const response = await client.messages.create({
        body: message,
        from: fromNumber,
        to: to,
      });

      res.json({ success: true, sid: response.sid });
    } catch (error: any) {
      console.error("Twilio SMS Error:", error);
      res.status(500).json({ error: error.message || "Failed to send SMS" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
