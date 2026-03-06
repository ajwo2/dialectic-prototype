type LogCategory = "selection" | "highlight" | "thread" | "ghost" | "chat";

const COLORS: Record<LogCategory, string> = {
  selection: "color: #f59e0b; font-weight: bold",
  highlight: "color: #8b5cf6; font-weight: bold",
  thread: "color: #3b82f6; font-weight: bold",
  ghost: "color: #a855f7; font-weight: bold",
  chat: "color: #22c55e; font-weight: bold",
};

class DebugLogger {
  private enabled = false;
  private categories: Set<LogCategory> | "all" = new Set();

  init() {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const debug = params.get("debug");
    if (!debug) {
      this.enabled = false;
      return;
    }
    this.enabled = true;
    if (debug === "1" || debug === "all") {
      this.categories = "all";
    } else {
      this.categories = new Set(debug.split(",") as LogCategory[]);
    }
  }

  log(category: LogCategory, event: string, data?: unknown) {
    if (!this.enabled) return;
    if (this.categories !== "all" && !this.categories.has(category)) return;
    const style = COLORS[category] || "";
    if (data !== undefined) {
      console.log(`%c[${category}] ${event}`, style, data);
    } else {
      console.log(`%c[${category}] ${event}`, style);
    }
  }
}

export const debug = new DebugLogger();
