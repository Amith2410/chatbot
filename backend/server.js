import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const upload = multer({ dest: "uploads/" });

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test route
app.get("/", (req, res) => {
  res.send("✅ Backend running with OpenAI + Groq support!");
});

// Chat route
app.post("/chat", upload.single("photo"), async (req, res) => {
  try {
    const { message, provider } = req.body;

    if (!message || !provider) {
      return res.status(400).json({ error: "Message and provider are required" });
    }

    let reply;

    if (provider === "openai") {
      // OpenAI response
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
      });
      reply = response.choices[0].message.content;
    } else if (provider === "groq") {
      // Groq API call
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: message }],
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message || "Groq API error");
      }
      reply = data.choices[0].message.content;
    } else {
      reply = "❌ Unsupported provider.";
    }

    res.json({ reply });
  } catch (error) {
    console.error("🔥 Error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
