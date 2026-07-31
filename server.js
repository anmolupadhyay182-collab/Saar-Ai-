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

// Chat API Route (With Tab/Session Memory Support)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const systemInstruction = "You are SAAR AI, a helpful, intelligent, and friendly AI assistant created by Anmol Upadhyay. Respond concisely and cleanly in Markdown.";

    // Groq ke format me messages array taiyar karein
    const apiMessages = [
      { role: 'system', content: systemInstruction }
    ];

    // Agar frontend se history mili hai to use Groq roles me convert karein
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        apiMessages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    } else {
      // Backup fallback agar history na bheji gayi ho
      apiMessages.push({ role: 'user', content: message });
    }

    // Call Groq API with full conversation context
    const chatCompletion = await groq.chat.completions.create({
      messages: apiMessages,
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
  
