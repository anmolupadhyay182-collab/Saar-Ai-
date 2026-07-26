import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
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

// Memory Storage File Path
const MEMORY_FILE = path.join(__dirname, 'memory.json');

// Helper to read memory
function getSavedMemory() {
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify([]));
  }
  try {
    const data = fs.readFileSync(MEMORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Helper to save memory
function saveMemory(newMemories) {
  const currentMemory = getSavedMemory();
  const updated = Array.from(new Set([...currentMemory, ...newMemories]));
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(updated, null, 2));
}

// Memory Clear Endpoint
app.delete('/api/memory', (req, res) => {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify([]));
  res.json({ message: "Memory cleared successfully" });
});

// Chat API Route
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const memoryList = getSavedMemory();
    
    // System Instruction with Memory Context
    let systemInstruction = "You are SAAR AI, a helpful, intelligent, and friendly AI assistant created by Anmol Upadhyay. Respond concisely and cleanly in Markdown.";
    
    if (memoryList.length > 0) {
      systemInstruction += `\n\n[USER MEMORIES TO REMEMBER AND USE]:\n${memoryList.map(m => "- " + m).join("\n")}`;
    }

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: message }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    const replyText = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't process that.";

    // Detect if user asked to remember something
    const memoryKeywords = ["yaad rakh", "yaad rakho", "memory me save", "remember this", "my name is", "mera naam"];
    const lowerMsg = message.toLowerCase();
    
    if (memoryKeywords.some(keyword => lowerMsg.includes(keyword))) {
      try {
        const extractionResponse = await groq.chat.completions.create({
          messages: [
            { role: 'user', content: `Extract the personal information or detail the user wants you to remember from this message as a short fact: "${message}". Reply ONLY with the fact. If nothing to remember, reply NONE.` }
          ],
          model: 'llama-3.3-70b-versatile',
        });

        const fact = extractionResponse.choices[0]?.message?.content ? extractionResponse.choices[0].message.content.trim() : "NONE";
        if (fact && fact !== "NONE" && fact.length < 150) {
          saveMemory([fact]);
        }
      } catch (err) {
        console.error("Memory Extraction Error:", err);
      }
    }

    res.json({ reply: replyText });

  } catch (error) {
    console.error("Groq API Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`SAAR AI Server running on http://localhost:${PORT}`);
});
