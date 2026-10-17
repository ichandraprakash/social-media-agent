"use client";

import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { cn } from "cn";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { THEME_COLORS, applyThemeColor, readThemeColor, type ThemeColor } from "@/lib/theme-colors";

export function ThemeColorPicker() {
  const [current, setCurrent] = useState<ThemeColor | null>(null);

  // The head script already applied the saved color; read it after mount.
  useEffect(() => setCurrent(readThemeColor()), []);

  function choose(color: ThemeColor) {
    setCurrent(color);
    applyThemeColor(color);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Theme color"
        className="group flex size-10 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 data-[popup-open]:bg-muted"
      >
        <Palette className="size-[18px] transition-transform duration-300 group-hover:rotate-12" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-72 rounded-2xl p-0 shadow-xl">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-bold">Theme color</p>
          <p className="text-xs text-muted-foreground">Personalize your workspace accent.</p>
        </div>

        <div role="radiogroup" aria-label="Theme color" className="grid grid-cols-3 gap-2 p-3">
          {THEME_COLORS.map((color) => {
            const selected = current === color.key;
            return (
              <button
                key={color.key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(color.key)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-semibold transition-all outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40",
                  selected ? "border-foreground/20 bg-muted/70" : "border-transparent hover:bg-muted/50"
                )}
              >
                <span
                  className={cn(
                    "relative flex size-9 items-center justify-center rounded-full text-white shadow-md transition-transform duration-300",
                    selected && "scale-110"
                  )}
                  style={{ backgroundImage: `linear-gradient(135deg, ${color.swatch}, ${color.companion})` }}
                >
                  <span
                    className={cn("absolute -inset-1 rounded-full border-2 transition-opacity", selected ? "opacity-100" : "opacity-0")}
                    style={{ borderColor: color.swatch }}
                  />
                  <Check className={cn("size-4 transition-all duration-200", selected ? "scale-100 opacity-100" : "scale-50 opacity-0")} strokeWidth={3} />
                </span>
                <span className={cn(selected ? "text-foreground" : "text-muted-foreground")}>{color.label}</span>
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
