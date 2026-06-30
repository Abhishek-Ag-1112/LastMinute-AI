import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to get Gemini client
function getAiClient(req: express.Request) {
  const customKey = req.headers["x-custom-api-key"] as string;
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No API key available. Please set your Gemini API key in the App settings or in the onboarding popup.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. AI Prioritization Endpoint
app.post("/api/gemini/prioritize", async (req, res) => {
  try {
    const { tasks, currentTime, userEnergy } = req.body;
    const ai = getAiClient(req);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a productivity expert. Given these tasks: ${JSON.stringify(tasks)}, current time: ${currentTime}, user energy level: ${userEnergy}, return a JSON array sorted by priority with fields: id (matching the task id), rank, urgency_score (0-100), and reason (1 sentence explaining why this priority was assigned). Return ONLY valid JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              rank: { type: Type.INTEGER },
              urgency_score: { type: Type.INTEGER },
              reason: { type: Type.STRING },
            },
            required: ["id", "rank", "urgency_score", "reason"],
          },
        },
      },
    });

    res.json({ result: JSON.parse(response.text || "[]") });
  } catch (error: any) {
    console.error("Prioritization error:", error);
    res.status(500).json({ error: error.message || "Failed to prioritize tasks." });
  }
});

// 2. Smart Scheduler Endpoint
app.post("/api/gemini/schedule", async (req, res) => {
  try {
    const { tasks, startHour, endHour, breakPreference } = req.body;
    const ai = getAiClient(req);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Create a time-blocked schedule for today. Available hours: ${startHour} to ${endHour}. Tasks: ${JSON.stringify(tasks)}. Break preference: ${breakPreference}. Include 10-min breaks every 90 mins if possible, but keep work slots focused on tasks. Return a JSON array representing the timeline in chronological order.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING, description: "Time block e.g., '09:00 - 10:30'" },
              task_id: { type: Type.STRING, description: "ID of the task, or 'break' if it is a break slot" },
              task_title: { type: Type.STRING, description: "Title of the task or 'Suggested Break'" },
              duration_mins: { type: Type.INTEGER },
              type: { type: Type.STRING, description: "Must be 'work' or 'break'" },
            },
            required: ["time", "task_id", "task_title", "duration_mins", "type"],
          },
        },
      },
    });

    res.json({ result: JSON.parse(response.text || "[]") });
  } catch (error: any) {
    console.error("Scheduler error:", error);
    res.status(500).json({ error: error.message || "Failed to build schedule." });
  }
});

// 3. Voice Input Parsing Endpoint
app.post("/api/gemini/voice-parse", async (req, res) => {
  try {
    const { transcript, currentDate } = req.body;
    const ai = getAiClient(req);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Extract task details from this voice input transcript: "${transcript}". Today is ${currentDate}. If the deadline is relative (e.g. tomorrow, next week), resolve it to an absolute ISO date. Return a structured JSON task object.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            deadline_iso: { type: Type.STRING, description: "ISO 8601 date-time string" },
            priority: { type: Type.STRING, description: "Must be 'high', 'medium', or 'low'" },
            category: { type: Type.STRING, description: "Must be 'Work', 'Personal', 'Finance', 'Health', or 'Study'" },
            estimated_minutes: { type: Type.INTEGER },
          },
          required: ["title", "priority", "category", "estimated_minutes"],
        },
      },
    });

    res.json({ result: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    console.error("Voice parsing error:", error);
    res.status(500).json({ error: error.message || "Failed to parse voice input." });
  }
});

// 4. Context-Aware Reminder Message Endpoint
app.post("/api/gemini/reminder", async (req, res) => {
  try {
    const { task, timeLeft, completionRate, timeOfDay } = req.body;
    const ai = getAiClient(req);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a highly personalized, direct, and motivating reminder for this task: ${JSON.stringify(task)}. Time left before deadline: ${timeLeft}. User completion rate this week: ${completionRate}%. Current time of day context: ${timeOfDay}. Write 1-2 sentences. Be direct, actionable, specific, and motivating. Avoid cliché phrases.`,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Reminder generator error:", error);
    res.status(500).json({ error: error.message || "Failed to generate reminder nudge." });
  }
});

// 5. Habit Nudge Endpoint
app.post("/api/gemini/habit-nudge", async (req, res) => {
  try {
    const { habitName, streak } = req.body;
    const ai = getAiClient(req);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `User's habit: "${habitName}", current streak: ${streak} days. Generate a 1-sentence personalized motivational nudge for today. Be specific to this habit type. Maximum 20 words.`,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Habit nudge error:", error);
    res.status(500).json({ error: error.message || "Failed to generate habit nudge." });
  }
});

// 6. Deadline Predictor Endpoint
app.post("/api/gemini/deadline-predict", async (req, res) => {
  try {
    const { title, category } = req.body;
    const ai = getAiClient(req);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Estimate a realistic duration, complexity level, and suggested lead time in days to complete this task. Task Title: "${title}", Task Category: "${category}". Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimated_duration_hours: { type: Type.NUMBER },
            complexity: { type: Type.STRING, description: "e.g., '~2 hours, moderate complexity'" },
            suggested_lead_days: { type: Type.INTEGER },
            rationale: { type: Type.STRING, description: "1-sentence reason for this prediction" },
          },
          required: ["estimated_duration_hours", "complexity", "suggested_lead_days", "rationale"],
        },
      },
    });

    res.json({ result: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    console.error("Deadline predictor error:", error);
    res.status(500).json({ error: error.message || "Failed to predict deadline details." });
  }
});

// 7. Weekly Review & Insights Endpoint
app.post("/api/gemini/weekly-review", async (req, res) => {
  try {
    const { completedCount, missedCount, avgCompletionTimeMins, streakData, goals } = req.body;
    const ai = getAiClient(req);

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze these productivity statistics for the week: Completed tasks: ${completedCount}, Missed tasks: ${missedCount}, Average task completion time: ${avgCompletionTimeMins} mins, Streaks: ${JSON.stringify(streakData)}, Goals: ${JSON.stringify(goals)}. Return a personalized, actionable review with 3 bullet point suggestions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            report_title: { type: Type.STRING },
            summary: { type: Type.STRING, description: "A high-level scannable summary paragraph of their performance" },
            score: { type: Type.INTEGER, description: "Productivity performance score (0-100)" },
            actionable_improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 3 clear, highly practical and specific improvements for next week."
            },
          },
          required: ["report_title", "summary", "score", "actionable_improvements"],
        },
      },
    });

    res.json({ result: JSON.parse(response.text || "{}") });
  } catch (error: any) {
    console.error("Weekly review error:", error);
    res.status(500).json({ error: error.message || "Failed to generate weekly report." });
  }
});

// 8. AI Productivity Coach Chat Endpoint
app.post("/api/gemini/coach", async (req, res) => {
  try {
    const { messages, tasks } = req.body;
    const ai = getAiClient(req);

    // Convert messages history to content parts
    const contents = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: `You are a tough-love productivity coach. Be direct, specific, and highly actionable. The user's active tasks are: ${JSON.stringify(tasks)}. Help them beat procrastination and take action NOW. Keep responses brief (max 3 sentences), highly direct, and motivate them to get to work immediately.`,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Coach error:", error);
    res.status(500).json({ error: error.message || "Failed to communicate with AI Coach." });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
