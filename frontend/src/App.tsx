import React, { useState, useEffect } from "react";
import { Task, Habit, Goal, FocusSession, ChatMessage, UserPrefs, ScheduleItem, WeeklyReport } from "./types";
import {
  INITIAL_TASKS,
  INITIAL_HABITS,
  INITIAL_GOALS,
  INITIAL_FOCUS_SESSIONS,
  INITIAL_PREFS,
  INITIAL_CHAT,
} from "./sampleData";
import { 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc, 
  getDocs 
} from "firebase/firestore";
import { db, auth } from "./firebase";

import Dashboard from "./components/Dashboard";
import FocusTimer from "./components/FocusTimer";
import ScheduleView from "./components/ScheduleView";
import HabitsTracker from "./components/HabitsTracker";
import CoachPanel from "./components/CoachPanel";
import WeeklyReview from "./components/WeeklyReview";
import OnboardingModal from "./components/OnboardingModal";

import {
  Layers,
  Clock,
  Calendar,
  Flame,
  MessageSquare,
  TrendingUp,
  Settings,
  Bell,
  Sparkles,
  Zap,
  Volume2,
  Plus
} from "lucide-react";

export const THEMES = {
  cosmic: {
    bg: "#0F0F13",
    card: "#1A1A24",
    primary: "#6C63FF",
    secondary: "#00D4AA",
    danger: "#FF4757",
  },
  amberwood: {
    bg: "#110F0D",
    card: "#1A1613",
    primary: "#D4AF37",
    secondary: "#52D171",
    danger: "#E05D5D",
  },
  nordic: {
    bg: "#090D0C",
    card: "#111816",
    primary: "#40B5A6",
    secondary: "#8BE99E",
    danger: "#FF6B81",
  },
  retro: {
    bg: "#040404",
    card: "#0C0C0C",
    primary: "#FF9F0A",
    secondary: "#00D4AA",
    danger: "#FF453A",
  },
  solar: {
    bg: "#0A0A0E",
    card: "#14141A",
    primary: "#FF3366",
    secondary: "#00D4AA",
    danger: "#FF4757",
  },
  stitch: {
    bg: "#08090D",
    card: "#111422",
    primary: "#E28743",
    secondary: "#FFC266",
    danger: "#E05D5D",
  },
  aurora: {
    bg: "#f3f7f5",
    card: "#ffffff",
    primary: "#FF7A00", // Bright sunset orange glow
    secondary: "#00E676", // Vibrant forest emerald neon
    danger: "#FF453A",
  },
};

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "focus" | "schedule" | "habits" | "coach" | "review"
  >("dashboard");

  // Auth User ID
  const [userId, setUserId] = useState<string | null>(null);

  // Core App states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [prefs, setPrefs] = useState<UserPrefs>(INITIAL_PREFS);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);

  // App notification state
  const [toast, setToast] = useState<{ message: string; title: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(false);
  const [isCoachThinking, setIsCoachThinking] = useState(false);

  // Canvas Celebration Particles State
  const [celebrate, setCelebrate] = useState(false);

  // 1. Authenticate with Firebase on mount
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
      } else {
        try {
          const credential = await signInAnonymously(auth);
          setUserId(credential.user.uid);
        } catch (error: any) {
          console.error("Firebase Anonymous Auth failed, falling back to local guest ID:", error);
          // Fallback to local guest ID stored in localStorage
          let guestId = localStorage.getItem("lastminute_guest_uid");
          if (!guestId) {
            guestId = "guest_" + Math.random().toString(36).substring(2, 11);
            localStorage.setItem("lastminute_guest_uid", guestId);
          }
          setUserId(guestId);
        }
      }
    });

    if (Notification && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => unsubscribeAuth();
  }, []);

  // 2. Setup Firebase listeners
  useEffect(() => {
    if (!userId) return;

    // Listen to tasks
    const tasksQuery = query(collection(db, "tasks"), where("userId", "==", userId));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const list: Task[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Task);
      });
      setTasks(list);
    }, (err) => {
      console.error("Firestore error loading tasks:", err);
      triggerNotification("Firestore Tasks Error", err.message);
    });

    // Listen to habits
    const habitsQuery = query(collection(db, "habits"), where("userId", "==", userId));
    const unsubscribeHabits = onSnapshot(habitsQuery, (snapshot) => {
      const list: Habit[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Habit);
      });
      setHabits(list);
    }, (err) => {
      console.error("Firestore error loading habits:", err);
      triggerNotification("Firestore Habits Error", err.message);
    });

    // Listen to goals
    const goalsQuery = query(collection(db, "goals"), where("userId", "==", userId));
    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      const list: Goal[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Goal);
      });
      setGoals(list);
    }, (err) => {
      console.error("Firestore error loading goals:", err);
      triggerNotification("Firestore Goals Error", err.message);
    });

    // Listen to focusSessions
    const focusQuery = query(collection(db, "focusSessions"), where("userId", "==", userId));
    const unsubscribeFocus = onSnapshot(focusQuery, (snapshot) => {
      const list: FocusSession[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as FocusSession);
      });
      setFocusSessions(list);
    }, (err) => {
      console.error("Firestore error loading sessions:", err);
      triggerNotification("Firestore Sessions Error", err.message);
    });

    // Listen to chatHistory
    const chatQuery = query(collection(db, "chatHistory"), where("userId", "==", userId));
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setChatHistory(list.length > 0 ? list : INITIAL_CHAT);
    }, (err) => {
      console.error("Firestore error loading chat:", err);
      triggerNotification("Firestore Chat Error", err.message);
    });

    // Listen to prefs
    const prefsRef = doc(db, "prefs", userId);
    const unsubscribePrefs = onSnapshot(prefsRef, (docSnap) => {
      if (docSnap.exists()) {
        setPrefs(docSnap.data() as UserPrefs);
      } else {
        setDoc(prefsRef, INITIAL_PREFS).catch((err) => {
          console.error("Firestore error creating prefs:", err);
          triggerNotification("Firestore Prefs Error", err.message);
        });
        setIsFirstLoad(true);
        setShowSettings(true);
      }
    }, (err) => {
      console.error("Firestore error loading prefs:", err);
      triggerNotification("Firestore Prefs Error", err.message);
    });

    // Listen to schedule
    const scheduleRef = doc(db, "schedule", userId);
    const unsubscribeSchedule = onSnapshot(scheduleRef, (docSnap) => {
      if (docSnap.exists()) {
        setSchedule(docSnap.data().items || []);
      }
    }, (err) => {
      console.error("Firestore error loading schedule:", err);
      triggerNotification("Firestore Schedule Error", err.message);
    });

    // Listen to weeklyReport
    const reportRef = doc(db, "weeklyReport", userId);
    const unsubscribeReport = onSnapshot(reportRef, (docSnap) => {
      if (docSnap.exists()) {
        setWeeklyReport(docSnap.data() as WeeklyReport);
      }
    }, (err) => {
      console.error("Firestore error loading report:", err);
      triggerNotification("Firestore Report Error", err.message);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeHabits();
      unsubscribeGoals();
      unsubscribeFocus();
      unsubscribeChat();
      unsubscribePrefs();
      unsubscribeSchedule();
      unsubscribeReport();
    };
  }, [userId]);

  // Apply dynamic color themes based on preferences
  useEffect(() => {
    const activeThemeKey = prefs.theme || "cosmic";
    const selectedTheme = THEMES[activeThemeKey as keyof typeof THEMES] || THEMES.cosmic;

    const root = document.documentElement;
    root.style.setProperty("--theme-bg-dark", selectedTheme.bg);
    root.style.setProperty("--theme-card-dark", selectedTheme.card);
    root.style.setProperty("--theme-accent-indigo", selectedTheme.primary);
    root.style.setProperty("--theme-accent-mint", selectedTheme.secondary);
    root.style.setProperty("--theme-accent-red", selectedTheme.danger);
  }, [prefs.theme]);

  // 3. Setup context-aware reminder interval checking every 60 seconds
  useEffect(() => {
    const checkReminderInterval = setInterval(async () => {
      const now = new Date("2026-06-23T22:26:14-07:00");
      const activeTasks = tasks.filter((t) => !t.completed);

      for (const task of activeTasks) {
        const deadlineDate = new Date(task.deadline);
        const timeDiffMs = deadlineDate.getTime() - now.getTime();
        const timeDiffMins = Math.floor(timeDiffMs / (1000 * 60));

        // Trigger a customized motivating reminder nudge if 30 minutes or 15 minutes left
        if (timeDiffMins === 30 || timeDiffMins === 15) {
          const timeLeftStr = `${timeDiffMins} minutes`;
          const currentHour = now.getHours();
          const timeOfDay = currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening";

          // Calculate weekly completion rate
          const completedCount = tasks.filter((t) => t.completed).length;
          const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 75;

          try {
            const res = await fetch("/api/gemini/reminder", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-custom-api-key": prefs.geminiApiKey || "",
              },
              body: JSON.stringify({
                task,
                timeLeft: timeLeftStr,
                completionRate,
                timeOfDay,
              }),
            });

            if (!res.ok) throw new Error();
            const data = await res.json();
            if (data.text) {
              triggerNotification(task.title, data.text);
            }
          } catch {
            // Fallback generic but descriptive notification
            triggerNotification(
              task.title,
              `The deadline is looming! Only ${timeLeftStr} remaining to submit this task.`
            );
          }
        }
      }
    }, 60000); // 60s check

    return () => clearInterval(checkReminderInterval);
  }, [tasks, prefs]);

  const triggerNotification = (title: string, message: string) => {
    // 1. Show standard Web Notification if permitted
    if (Notification && Notification.permission === "granted") {
      new Notification(`LastMinute AI: ${title}`, {
        body: message,
        icon: "/favicon.ico",
      });
    }

    // 2. Play subtle focus audio chime
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.55);
    } catch (e) {
      console.log("Audio synthesis blocked or not supported.");
    }

    // 3. Set visual toast
    setToast({ title, message });
    setTimeout(() => {
      setToast(null);
    }, 8500);
  };

  // Keyboard shortcut listener (Ctrl+N = switch to dashboard + focus form, Ctrl+/ = open coach tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        setActiveTab("dashboard");
      } else if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setActiveTab("coach");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 4. State updates handlers
  const handleAddTask = async (newTask: Omit<Task, "id" | "completed">) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, "tasks"), {
        ...newTask,
        completed: false,
        userId,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to add task to Firestore", e);
    }
  };

  const handleToggleComplete = async (id: string) => {
    if (!userId) return;
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newState = !task.completed;
    if (newState) {
      // Trigger celebration animation particles
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2000);

      // Subtle completion bell synth sound
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.1); // G5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);
      } catch (e) {}
    }

    try {
      await updateDoc(doc(db, "tasks", id), {
        completed: newState,
        completedAt: newState ? new Date().toISOString().slice(0, 16) : null
      });
    } catch (e) {
      console.error("Failed to toggle task completion in Firestore", e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!userId) return;
    const confirmed = window.confirm("Are you sure you want to delete this task? This cannot be undone.");
    if (confirmed) {
      try {
        await deleteDoc(doc(db, "tasks", id));
      } catch (e) {
        console.error("Failed to delete task from Firestore", e);
      }
    }
  };

  const handlePrioritizeTasks = async (rankedUpdates: Partial<Task>[]) => {
    if (!userId) return;
    try {
      for (const update of rankedUpdates) {
        if (update.id) {
          await updateDoc(doc(db, "tasks", update.id), {
            aiPriorityRank: update.aiPriorityRank,
            aiUrgencyScore: update.aiUrgencyScore,
            aiReason: update.aiReason
          });
        }
      }
      triggerNotification("Tasks Ranked!", "Gemini has finished analyzing all deadlines and optimized your priority indices.");
    } catch (e) {
      console.error("Failed to prioritize tasks in Firestore", e);
    }
  };

  const handleAddFocusSession = async (mins: number, taskTitle: string) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, "focusSessions"), {
        date: new Date().toISOString().split("T")[0],
        durationMins: mins,
        taskLinked: taskTitle,
        userId
      });
    } catch (e) {
      console.error("Failed to add focus session to Firestore", e);
    }
  };

  const handleSaveSchedule = async (newSchedule: ScheduleItem[]) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, "schedule", userId), { items: newSchedule });
    } catch (e) {
      console.error("Failed to save schedule to Firestore", e);
    }
  };

  const handleSaveReport = async (newReport: WeeklyReport) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, "weeklyReport", userId), newReport);
    } catch (e) {
      console.error("Failed to save weekly report to Firestore", e);
    }
  };

  // Habits updates
  const handleToggleHabit = async (habitId: string) => {
    if (!userId) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const todayStr = "2026-06-23";
    const hasCompletedToday = habit.history.includes(todayStr);
    let updatedHistory = [...habit.history];
    let updatedStreak = habit.streak;

    if (hasCompletedToday) {
      updatedHistory = updatedHistory.filter((d) => d !== todayStr);
      updatedStreak = Math.max(0, updatedStreak - 1);
    } else {
      updatedHistory.push(todayStr);
      updatedStreak += 1;
    }

    try {
      await updateDoc(doc(db, "habits", habitId), {
        streak: updatedStreak,
        history: updatedHistory
      });
    } catch (e) {
      console.error("Failed to toggle habit in Firestore", e);
    }
  };

  const handleAddHabit = async (name: string) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, "habits"), {
        name,
        streak: 0,
        history: [],
        userId
      });
    } catch (e) {
      console.error("Failed to add habit to Firestore", e);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "habits", id));
    } catch (e) {
      console.error("Failed to delete habit from Firestore", e);
    }
  };

  const handleUpdateHabitNudge = async (id: string, nudge: string) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, "habits", id), {
        nudge,
        nudgeDate: "2026-06-23"
      });
    } catch (e) {
      console.error("Failed to update habit nudge in Firestore", e);
    }
  };

  // Goals
  const handleAddGoal = async (text: string, targetDate: string) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, "goals"), {
        text,
        targetDate,
        completed: false,
        userId
      });
    } catch (e) {
      console.error("Failed to add goal to Firestore", e);
    }
  };

  const handleToggleGoal = async (id: string) => {
    if (!userId) return;
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    try {
      await updateDoc(doc(db, "goals", id), {
        completed: !goal.completed
      });
    } catch (e) {
      console.error("Failed to toggle goal in Firestore", e);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "goals", id));
    } catch (e) {
      console.error("Failed to delete goal from Firestore", e);
    }
  };

  // Chat with AI Coach
  const handleSendMessage = async (msg: string) => {
    if (!userId) return;
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };

    try {
      await addDoc(collection(db, "chatHistory"), {
        ...userMessage,
        userId
      });

      setIsCoachThinking(true);

      const activeTasks = tasks.filter((t) => !t.completed);
      const res = await fetch("/api/gemini/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-custom-api-key": prefs.geminiApiKey || "",
        },
        body: JSON.stringify({
          messages: [...chatHistory, userMessage],
          tasks: activeTasks.map((t) => ({ title: t.title, priority: t.priority })),
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.text) {
        const coachMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "model",
          content: data.text,
          timestamp: new Date().toISOString(),
        };
        await addDoc(collection(db, "chatHistory"), {
          ...coachMsg,
          userId
        });
      }
    } catch {
      const errMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "model",
        content: "I'm temporarily blocked by networking static. But you shouldn't be reading this anyway — GET BACK TO WORK on your high-priority tasks!",
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, "chatHistory"), {
        ...errMsg,
        userId
      });
    } finally {
      setIsCoachThinking(false);
    }
  };

  const handleClearChat = async () => {
    if (!userId) return;
    try {
      const q = query(collection(db, "chatHistory"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const batchPromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(batchPromises);
    } catch (e) {
      console.error("Failed to clear chat history in Firestore", e);
    }
  };

  const handleSaveOnboarding = async (newPrefs: UserPrefs) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, "prefs", userId), newPrefs);
      setShowSettings(false);
      setIsFirstLoad(false);
    } catch (e) {
      console.error("Failed to save onboarding preferences to Firestore", e);
    }
  };

  return (
    <div 
      className={`min-h-screen bg-bg-dark font-sans text-gray-300 flex flex-col md:flex-row relative overflow-x-hidden ${
        prefs?.theme === "stitch" ? "theme-stitch" : prefs?.theme === "aurora" ? "theme-aurora" : ""
      }`}
      data-theme={prefs?.theme || "cosmic"}
    >
      {/* Background Aurora Radial Glow for Aurora Emerald Theme */}
      {prefs?.theme === "aurora" && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[130px] opacity-75" />
          <div className="absolute bottom-[5%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] opacity-60" />
          <div className="absolute top-[35%] right-[15%] w-[40%] h-[40%] rounded-full bg-amber-500/5 blur-[100px] opacity-40" />
        </div>
      )}

      {/* Dynamic Confetti celebration canvas wrapper */}
      {celebrate && <ConfettiCelebration />}

      {/* TOAST NOTIFICATION POPUP */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl glass-card border-accent-indigo/40 shadow-2xl shadow-black max-w-sm animate-in fade-in slide-in-from-bottom-5 flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-indigo/15 text-accent-indigo flex items-center justify-center shrink-0">
            <Bell size={16} className="animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wide">Reminder Nudge: {toast.title}</h4>
            <p className="text-[11px] text-gray-300 leading-relaxed mt-1">{toast.message}</p>
          </div>
        </div>
      )}

      {/* NAVIGATION SIDEBAR */}
      <aside className="hidden md:flex w-full md:w-64 bg-card-dark border-b md:border-b-0 md:border-r border-gray-850 p-5 flex-col justify-between shrink-0 z-10">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-indigo/25 flex items-center justify-center text-accent-indigo">
              <Zap size={20} className="fill-current text-accent-indigo" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-wider block">LastMinute AI</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Procrastination Shield</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <SidebarButton
              label="Dashboard"
              icon={<Layers size={16} />}
              active={activeTab === "dashboard"}
              onClick={() => setActiveTab("dashboard")}
            />
            <SidebarButton
              label="Focus Chamber"
              icon={<Clock size={16} />}
              active={activeTab === "focus"}
              onClick={() => setActiveTab("focus")}
            />
            <SidebarButton
              label="Smart Schedule"
              icon={<Calendar size={16} />}
              active={activeTab === "schedule"}
              onClick={() => setActiveTab("schedule")}
            />
            <SidebarButton
              label="Habit Forge"
              icon={<Flame size={16} />}
              active={activeTab === "habits"}
              onClick={() => setActiveTab("habits")}
            />
            <SidebarButton
              label="AI Coach Chat"
              icon={<MessageSquare size={16} />}
              active={activeTab === "coach"}
              onClick={() => setActiveTab("coach")}
            />
            <SidebarButton
              label="Insights & Week"
              icon={<TrendingUp size={16} />}
              active={activeTab === "review"}
              onClick={() => setActiveTab("review")}
            />
          </nav>
        </div>

        {/* Footer/Settings button */}
        <div className="pt-4 border-t border-gray-900 mt-4 md:mt-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-xs text-white font-bold">
              {prefs.name ? prefs.name[0].toUpperCase() : "U"}
            </div>
            <span className="text-xs font-semibold text-gray-300">{prefs.name || "Alex"}</span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition cursor-pointer"
            title="App preferences"
          >
            <Settings size={16} />
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR HEADER */}
      <header className="md:hidden flex justify-between items-center bg-card-dark/80 backdrop-blur-md px-5 py-4 border-b border-white/5 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/15 flex items-center justify-center text-[#FF7A00]">
            <Zap size={16} className="fill-current text-[#FF7A00]" />
          </div>
          <div>
            <span className="text-xs font-black text-white tracking-wider block">LastMinute AI</span>
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">Procrastination Shield</span>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-xl bg-gray-950/40 border border-white/5 text-gray-400 hover:text-white transition cursor-pointer"
        >
          <Settings size={15} />
        </button>
      </header>

      {/* MAIN MAIN VIEW CONTENT AREA */}
      <main className="flex-1 p-5 md:p-8 overflow-y-auto h-screen pb-28 md:pb-8 z-10">
        {activeTab === "dashboard" && (
          <Dashboard
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleComplete={handleToggleComplete}
            onDeleteTask={handleDeleteTask}
            onPrioritizeTasks={handlePrioritizeTasks}
            apiKey={prefs.geminiApiKey}
          />
        )}

        {activeTab === "focus" && (
          <FocusTimer
            tasks={tasks}
            onAddFocusSession={handleAddFocusSession}
            apiKey={prefs.geminiApiKey}
          />
        )}

        {activeTab === "schedule" && (
          <ScheduleView
            tasks={tasks}
            prefs={prefs}
            schedule={schedule}
            onSaveSchedule={handleSaveSchedule}
            apiKey={prefs.geminiApiKey}
          />
        )}

        {activeTab === "habits" && (
          <HabitsTracker
            habits={habits}
            goals={goals}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onUpdateHabitNudge={handleUpdateHabitNudge}
            onAddGoal={handleAddGoal}
            onToggleGoal={handleToggleGoal}
            onDeleteGoal={handleDeleteGoal}
            apiKey={prefs.geminiApiKey}
          />
        )}

        {activeTab === "coach" && (
          <CoachPanel
            tasks={tasks}
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            onClearChat={handleClearChat}
            isThinking={isCoachThinking}
            apiKey={prefs.geminiApiKey}
          />
        )}

        {activeTab === "review" && (
          <WeeklyReview
            tasks={tasks}
            habits={habits}
            goals={goals}
            focusSessions={focusSessions}
            weeklyReport={weeklyReport}
            onSaveReport={handleSaveReport}
            apiKey={prefs.geminiApiKey}
          />
        )}
      </main>

      {/* CURVED MOBILE FLOATING BOTTOM GLASS TAB BAR (SCREEN NAVIGATION) */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-40 bg-[#0C1311]/80 border border-white/10 p-2 rounded-2xl backdrop-blur-2xl flex justify-between items-center px-6 shadow-[0_15px_35px_rgba(0,0,0,0.8)] floating-mobile-nav">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition ${
            activeTab === "dashboard" ? "text-accent-mint" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Layers size={18} />
          <span className="text-[8px] font-bold">Home</span>
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition ${
            activeTab === "schedule" ? "text-accent-mint" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Calendar size={18} />
          <span className="text-[8px] font-bold">Schedule</span>
        </button>

        {/* Centered Neon Orange Plus action button to quickly focus/create a task */}
        <button
          onClick={() => {
            setActiveTab("dashboard");
            setTimeout(() => {
              const creatorEl = document.querySelector('input[placeholder*="Design app screen"]') as HTMLInputElement;
              if (creatorEl) {
                creatorEl.focus();
                creatorEl.scrollIntoView({ behavior: "smooth" });
              } else {
                setToast({
                  title: "Action Chamber",
                  message: "Welcome back! Create a fresh focus target card on the dashboard below.",
                });
                setTimeout(() => setToast(null), 3000);
              }
            }, 100);
          }}
          className="w-12 h-12 -mt-7 rounded-full bg-[#FF7A00] text-[#040806] flex items-center justify-center shadow-lg shadow-orange-500/20 hover:bg-orange-500 active:scale-95 transition-all duration-200 cursor-pointer border border-white/15"
          title="Create New Target Card"
        >
          <Plus size={24} className="stroke-[3]" />
        </button>

        <button
          onClick={() => setActiveTab("focus")}
          className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition ${
            activeTab === "focus" ? "text-accent-mint" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Clock size={18} />
          <span className="text-[8px] font-bold">Timer</span>
        </button>

        <button
          onClick={() => setActiveTab("review")}
          className={`p-2 rounded-xl flex flex-col items-center gap-0.5 transition ${
            activeTab === "review" ? "text-accent-mint" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <TrendingUp size={18} />
          <span className="text-[8px] font-bold">Status</span>
        </button>
      </div>

      {/* PREFERENCES SETTINGS MODAL */}
      {showSettings && (
        <OnboardingModal
          prefs={prefs}
          onSave={handleSaveOnboarding}
          onClose={!isFirstLoad ? () => setShowSettings(false) : undefined}
          isFirstLoad={isFirstLoad}
        />
      )}
    </div>
  );
}

// SUBCONPONENT SIDEBAR NAVIGATION BUTTON
interface SidebarButtonProps {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function SidebarButton({ label, icon, active, onClick }: SidebarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
        active
          ? "bg-accent-indigo text-black shadow-lg shadow-accent-indigo/15 font-bold"
          : "text-gray-400 hover:text-white hover:bg-gray-900"
      }`}
    >
      <span className={active ? "text-black" : "text-gray-500 group-hover:text-white"}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// CANVAS CONFETTI CELEBRATION CHIPS
function ConfettiCelebration() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#6C63FF", "#00D4AA", "#FF4757", "#FFD200", "#FF6B81"];
    const particles = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 5 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 3 + 3,
      angle: Math.random() * 2 * Math.PI,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.y += p.speed;
        p.x += Math.sin(p.angle) * 1.5;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-40 pointer-events-none" />;
}
