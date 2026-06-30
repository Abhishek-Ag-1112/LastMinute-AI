import { Task, Habit, Goal, FocusSession, UserPrefs, ChatMessage } from "./types";

export const INITIAL_TASKS: Task[] = [];
export const INITIAL_HABITS: Habit[] = [];
export const INITIAL_GOALS: Goal[] = [];
export const INITIAL_FOCUS_SESSIONS: FocusSession[] = [];

export const INITIAL_PREFS: UserPrefs = {
  name: "Riley",
  workStartHour: "09:00",
  workEndHour: "18:00",
  energyPattern: "morning",
  breakPreference: "standard",
  theme: "aurora",
};

export const INITIAL_CHAT: ChatMessage[] = [
  {
    id: "chat-msg-1",
    role: "model",
    content: "Hey, I'm your tough-love productivity coach. We're running out of time, and those deadlines are staring you in the face. What are we finishing in the next hour? No excuses, let's get it done.",
    timestamp: new Date().toISOString(),
  },
];
