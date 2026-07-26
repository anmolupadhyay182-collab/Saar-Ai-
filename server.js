import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Groq API Client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Chat API Route (Without Memory)
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const systemInstruction = "You are SAAR AI, a helpful, intelligent, and friendly AI assistant created by Anmol Upadhyay. Respond concisely and cleanly in Markdown.";

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    const replyText = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't process that.";

    res.json({ reply: replyText });

  } catch (error) {
    console.error("Groq API Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`SAAR AI Server running on http://localhost:${PORT}`);
});
