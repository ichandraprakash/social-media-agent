"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";
import { useAgentSelection } from "@/components/office/agent-selection";
import { AgentTag } from "@/components/office/agent-tag";
import { roleForSeat } from "@/lib/agent-roles";
import type { OfficeScene } from "@/lib/office-studio";

// Horizontal position of a character's head within its sprite (measured from the sprite art).
const HEAD_CENTER_X = 0.42;

/**
 * Renders an AgentWorld office scene: the background plus animated agent characters.
 *
 * Everything is positioned in percentages of the office's native size inside a
 * box with the same aspect ratio, so characters stay locked to their desks at
 * any rendered size.
 *
 * Inside an AgentSelectionProvider, clicking a character or its tag selects that agent.
 */
export function AgentOffice({
  scene,
  fps = 8,
  showAgentTags = true,
  className,
  children,
}: {
  scene: OfficeScene;
  /** Animation speed for character frames. */
  fps?: number;
  /** Show each agent's role card above its head. */
  showAgentTags?: boolean;
  className?: string;
  /** Optional overlays (e.g. status chips) rendered above the scene. */
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const playing = useShouldAnimate(ref);
  const selection = useAgentSelection();

  // One shared clock for every character; paused when not visible.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000 / fps);
    return () => window.clearInterval(id);
  }, [playing, fps]);

  const { width: W, height: H } = scene;

  return (
    <div
      ref={ref}
      role={selection ? "group" : "img"}
      aria-label={`AI agent office: ${scene.seats.map((seat) => roleForSeat(seat.index).name).join(", ")} at work`}
      className={cn("relative w-full overflow-hidden bg-muted", className)}
      // container-type lets agent tags size themselves relative to the office width (cqw).
      style={{ aspectRatio: `${W} / ${H}`, containerType: "inline-size" }}
    >
      {!backgroundLoaded && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted to-muted-foreground/10" />}

      {/* eslint-disable-next-line @next/next/no-img-element -- immutable hashed asset, already sized */}
      <img
        src={scene.background}
        alt=""
        draggable={false}
        decoding="async"
        ref={(el) => { if (el?.complete && el.naturalWidth > 0) setBackgroundLoaded(true); }}
        onLoad={() => setBackgroundLoaded(true)}
        className={cn("absolute inset-0 size-full select-none transition-opacity duration-700", backgroundLoaded ? "opacity-100" : "opacity-0")}
      />

      {scene.seats.map((seat, index) => (
        <AgentCharacter
          key={seat.id}
          seat={seat}
          officeWidth={W}
          officeHeight={H}
          // Offset each agent so they don't type in lockstep.
          frame={tick + index * 3}
          visible={backgroundLoaded}
          enterDelay={index * 120}
          highlighted={selection?.selected === roleForSeat(seat.index).key}
        />
      ))}

      {/* Click targets over each character (below the tags). */}
      {selection &&
        scene.seats.map((seat) => {
          const role = roleForSeat(seat.index);
          return (
            <button
              key={`hit-${seat.id}`}
              type="button"
              onClick={() => selection.select(role.key)}
              aria-label={`Select ${role.name}`}
              aria-pressed={selection.selected === role.key}
              className="absolute z-30 cursor-pointer rounded-[1cqw] outline-none focus-visible:ring-2 focus-visible:ring-white/90"
              style={{
                left: `${(seat.x / W) * 100}%`,
                top: `${(seat.y / H) * 100}%`,
                width: `${(seat.width / W) * 100}%`,
                aspectRatio: `${seat.character.width} / ${seat.character.height}`,
              }}
            />
          );
        })}

      {showAgentTags &&
        scene.seats.map((seat, index) => {
          const role = roleForSeat(seat.index);
          const selected = selection?.selected === role.key;
          const tag = (
            <AgentTag role={role} visible={backgroundLoaded} delay={450 + index * 150} selected={selected} dimmed={selection?.selected != null && !selected} />
          );
          const position: React.CSSProperties = {
            left: `${((seat.x + seat.width * HEAD_CENTER_X) / W) * 100}%`,
            top: `${(seat.y / H) * 100}%`,
            transform: "translate(-50%, calc(-100% - 0.7em))",
            fontSize: "clamp(6px, 1.3cqw, 13px)",
          };

          return selection ? (
            <button
              key={`tag-${seat.id}`}
              type="button"
              onClick={() => selection.select(role.key)}
              aria-label={`Select ${role.name}`}
              aria-pressed={selected}
              className={cn("absolute cursor-pointer rounded-[0.95em] text-left outline-none focus-visible:ring-2 focus-visible:ring-white/90", selected ? "z-50" : "z-40")}
              style={position}
            >
              {tag}
            </button>
          ) : (
            <div key={`tag-${seat.id}`} className="pointer-events-auto absolute z-40" style={position}>
              {tag}
            </div>
          );
        })}

      {children}
    </div>
  );
}

function AgentCharacter({
  seat,
  officeWidth,
  officeHeight,
  frame,
  visible,
  enterDelay,
  highlighted = false,
}: {
  seat: OfficeScene["seats"][number];
  officeWidth: number;
  officeHeight: number;
  frame: number;
  visible: boolean;
  enterDelay: number;
  /** Outline the character as the selected agent. */
  highlighted?: boolean;
}) {
  const { character } = seat;
  const [loaded, setLoaded] = useState<ReadonlySet<number>>(() => new Set());
  const ready = loaded.size >= character.frames.length;
  // Images can finish loading before hydration (cache), so also check `complete` on mount.
  const markLoaded = (i: number) => setLoaded((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  // Seat with missing art: its name tag still shows, but there's no character to draw.
  if (character.frames.length === 0) return null;
  // Hold the first frame until every frame has loaded, so playback never flickers.
  const current = ready ? frame % character.frames.length : 0;

  return (
    <div
      className={cn(
        "pointer-events-none absolute transition-[opacity,transform,filter] duration-500 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      )}
      style={{
        left: `${(seat.x / officeWidth) * 100}%`,
        top: `${(seat.y / officeHeight) * 100}%`,
        width: `${(seat.width / officeWidth) * 100}%`,
        aspectRatio: `${character.width} / ${character.height}`,
        zIndex: seat.zIndex,
        transitionDelay: `${enterDelay}ms`,
        // A soft white outline that follows the sprite's silhouette.
        filter: highlighted ? "drop-shadow(0 0 0.35cqw rgb(255 255 255)) drop-shadow(0 0 0.9cqw rgb(255 255 255 / 0.7))" : undefined,
      }}
      data-agent={character.id}
    >
      {character.frames.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- animation frames, toggled by opacity
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          decoding="async"
          ref={(el) => { if (el?.complete && el.naturalWidth > 0) markLoaded(i); }}
          onLoad={() => markLoaded(i)}
          className="absolute inset-0 size-full select-none"
          style={{ opacity: i === current ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

/** True while the element is on screen, the tab is visible, and motion is allowed. */
function useShouldAnimate(ref: React.RefObject<HTMLElement | null>) {
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [motionOk, setMotionOk] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  useEffect(() => {
    const onVisibility = () => setTabVisible(document.visibilityState === "visible");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionOk(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return onScreen && tabVisible && motionOk;
}
