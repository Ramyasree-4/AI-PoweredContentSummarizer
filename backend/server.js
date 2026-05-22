import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Mistral } from "@mistralai/mistralai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;
const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY
});

const summaryInstructions = {
  short: "Write a very concise summary in 2-3 sentences.",
  medium: "Write a balanced summary with the most important points.",
  detailed: "Write a structured summary with brief headings and bullet points."
};

function getMistralErrorResponse(error) {
  const status = error?.statusCode || error?.status || error?.response?.status;
  const message = error?.message || "";

  if (status === 401 || status === 403) {
    return {
      status: 401,
      error: "Mistral API key is invalid or not authorized. Check MISTRAL_API_KEY in Render."
    };
  }

  if (status === 404 || message.toLowerCase().includes("model")) {
    return {
      status: 400,
      error: "Mistral model is not available. Check MISTRAL_MODEL in Render."
    };
  }

  if (status === 429) {
    return {
      status: 429,
      error: "Mistral rate limit or quota reached. Please try again later."
    };
  }

  return {
    status: 500,
    error: "Mistral could not generate a summary. Check the backend logs on Render."
  };
}

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/summarize", async (req, res) => {
  try {
    const { content, summaryType = "medium" } = req.body;

    if (!process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY === "your_mistral_api_key_here") {
      return res.status(500).json({
        error: "Server is missing the Mistral API key. Add MISTRAL_API_KEY in Render."
      });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({
        error: "Content is required."
      });
    }

    if (!summaryInstructions[summaryType]) {
      return res.status(400).json({
        error: "Summary type must be short, medium, or detailed."
      });
    }

    const response = await client.chat.complete({
      model: process.env.MISTRAL_MODEL || "mistral-small-latest",
      messages: [
        {
          role: "system",
          content:
            "You summarize user-provided content clearly and accurately. Do not invent facts that are not present in the content."
        },
        {
          role: "user",
          content: `Summarize the following content in a ${summaryType} format. ${summaryInstructions[summaryType]}\n\nContent:\n${content.trim()}`
        }
      ]
    });

    res.json({
      summary: response.choices?.[0]?.message?.content || "No summary was returned."
    });
  } catch (error) {
    const response = getMistralErrorResponse(error);
    console.error("Summarization error details:", {
      status: error?.statusCode || error?.status || error?.response?.status,
      message: error?.message
    });
    res.status(response.status).json({
      error: response.error
    });
  }
});

const frontendDist = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({
      name: "AI Content Summarizer API",
      status: "running",
      endpoints: ["/api/health", "/api/summarize"],
      note: "This is the backend API. Open your Vercel frontend URL to use the app."
    });
  });
}

app.listen(port, () => {
  console.log(`Summarizer backend running on http://localhost:${port}`);
});
