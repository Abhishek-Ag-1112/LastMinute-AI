export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DDTHH:mm format
  priority: "high" | "medium" | "low";
  category: "Work" | "Personal" | "Finance" | "Health" | "Study";
  estimatedDuration: number; // in minutes
  completed: boolean;
  completedAt?: string; // YYYY-MM-DDTHH:mm format
  aiPriorityRank?: number;
  aiUrgencyScore?: number;
  aiReason?: string;
  isOverdue?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  history: string[]; // array of 'YYYY-MM-DD' dates
  nudge?: string;
  nudgeDate?: string; // YYYY-MM-DD when nudge was generated
}

export interface Goal {
  id: string;
  text: string;
  targetDate: string; // YYYY-MM-DD
  completed: boolean;
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMins: number;
  taskLinked?: string; // task ID or task title
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string; // ISO string
}

export interface UserPrefs {
  name: string;
  workStartHour: string; // "09:00"
  workEndHour: string; // "18:00"
  energyPattern: "morning" | "afternoon" | "evening";
  breakPreference: "frequent" | "standard" | "minimal";
  geminiApiKey?: string; // Optional user key saved in local storage
  theme?: "cosmic" | "amberwood" | "nordic" | "retro" | "solar" | "stitch" | "aurora";
}

export interface ScheduleItem {
  time: string; // "09:00 - 10:30"
  task_id: string; // Task ID or "break"
  task_title: string;
  duration_mins: number;
  type: "work" | "break";
}

export interface WeeklyReport {
  report_title: string;
  summary: string;
  score: number;
  actionable_improvements: string[];
  generatedAt?: string;
}

export interface DeadlinePrediction {
  estimated_duration_hours: number;
  complexity: string;
  suggested_lead_days: number;
  rationale: string;
}
