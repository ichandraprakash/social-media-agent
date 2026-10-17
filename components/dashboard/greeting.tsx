"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";

// Computed in the browser so it matches the user's local time, not the server's.
function greetingFor(hour: number) {
  if (hour < 5) return { text: "Working late", Icon: Moon, tint: "text-indigo-400" };
  if (hour < 12) return { text: "Good morning", Icon: Sunrise, tint: "text-amber-500" };
  if (hour < 17) return { text: "Good afternoon", Icon: Sun, tint: "text-amber-500" };
  if (hour < 21) return { text: "Good evening", Icon: Sunset, tint: "text-orange-500" };
  return { text: "Good evening", Icon: Moon, tint: "text-indigo-400" };
}

export function Greeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState<ReturnType<typeof greetingFor> | null>(null);
  useEffect(() => setGreeting(greetingFor(new Date().getHours())), []);

  const Icon = greeting?.Icon ?? Sun;

  return (
    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Icon className={`size-4 transition-colors ${greeting?.tint ?? "text-amber-500"}`} />
      <span>
        {greeting?.text ?? "Welcome back"}, <span className="font-bold text-foreground">{firstName}</span>
      </span>
      <span aria-hidden="true">👋</span>
    </p>
  );
}
