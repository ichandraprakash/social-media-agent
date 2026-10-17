"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clock,
  ListTodo,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pause,
  Play,
  SendHorizontal,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "cn";
import { AgentChatError, streamAgentReply, toChatTurns } from "@/components/agents/agent-chat-client";
import { useAgentSelection } from "@/components/office/agent-selection";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CHAT_LIMITS } from "@/lib/ai/chat";
import { AGENT_ROLES, ROLE_STYLES, type AgentRole, type AgentRoleKey } from "@/lib/agent-roles";

type ChatMessage = {
  id: number;
  from: "agent" | "user";
  text: string;
  at: Date;
  /** User tasks: whether the agent has answered. */
  status?: "pending" | "done" | "failed";
  /** Agent messages that report a failure; not sent back to the agent as context. */
  error?: boolean;
};
type AgentSettings = { autoRun: boolean; askFirst: boolean; instructions: string };
type ChatUser = { initials: string; avatarUrl?: string };
type PerAgent<T> = Record<AgentRoleKey, T>;

const DEFAULT_SETTINGS: AgentSettings = { autoRun: true, askFirst: true, instructions: "" };

function perAgent<T>(make: (role: AgentRole) => T): PerAgent<T> {
  return Object.fromEntries(AGENT_ROLES.map((role) => [role.key, make(role)])) as PerAgent<T>;
}

/**
 * Agents next to the office scene. Must render inside an AgentSelectionProvider, which keeps
 * the selection in sync with clicks on characters in the office.
 *
 * - AI Agents page: a row of agents above the selected agent's Chat / History / Settings.
 * - Overview (`overview` passed): shows the overview until an agent is clicked in the office,
 *   then that agent's panel in its place, with a close button to go back.
 */
export function AgentWorkspace({
  avatars,
  user,
  office,
  overview,
}: {
  /** Head-and-shoulders sprite for each agent, taken from its office character. */
  avatars: Partial<PerAgent<string>>;
  user: ChatUser;
  /** Right column: the campaign's agent office. */
  office: React.ReactNode;
  /** Left column content shown while no agent is selected. */
  overview?: React.ReactNode;
}) {
  const selection = useAgentSelection();
  if (!selection) throw new Error("AgentWorkspace must be rendered inside an AgentSelectionProvider");
  const { selected, select } = selection;

  const nextId = useRef(0);
  const newMessage = (from: ChatMessage["from"], text: string): ChatMessage => ({ id: nextId.current++, from, text, at: new Date() });

  // Greetings use fixed negative ids so the first render doesn't touch the id counter.
  const [messages, setMessages] = useState<PerAgent<ChatMessage[]>>(() =>
    perAgent((role) => [{ id: -1 - AGENT_ROLES.indexOf(role), from: "agent", text: role.greeting, at: new Date() }])
  );
  // True from sending a task until the agent's reply has finished streaming.
  const [typing, setTyping] = useState<PerAgent<boolean>>(() => perAgent(() => false));
  const [paused, setPaused] = useState<PerAgent<boolean>>(() => perAgent(() => false));
  const [settings, setSettings] = useState<PerAgent<AgentSettings>>(() => perAgent(() => DEFAULT_SETTINGS));

  // Replies keep streaming when you switch agents; stop them all if the page unmounts.
  const requests = useRef(new Map<AgentRoleKey, AbortController>());
  useEffect(() => {
    const active = requests.current;
    return () => active.forEach((controller) => controller.abort());
  }, []);

  const updateMessage = (key: AgentRoleKey, id: number, patch: (m: ChatMessage) => Partial<ChatMessage>) =>
    setMessages((prev) => ({ ...prev, [key]: prev[key].map((m) => (m.id === id ? { ...m, ...patch(m) } : m)) }));

  async function sendTask(key: AgentRoleKey, text: string) {
    if (requests.current.has(key)) return;
    const task = { ...newMessage("user", text), status: "pending" as const };
    // The agent sees this conversation (minus failure notices) plus the new task.
    const history = [...messages[key].filter((m) => !m.error), task].map((m) => ({
      role: m.from === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));

    setMessages((prev) => ({ ...prev, [key]: [...prev[key], task] }));
    setTyping((prev) => ({ ...prev, [key]: true }));

    const controller = new AbortController();
    requests.current.set(key, controller);
    let replyId: number | null = null;

    try {
      await streamAgentReply(
        key,
        { messages: toChatTurns(history), preferences: settings[key].instructions.trim() || undefined },
        {
          signal: controller.signal,
          onText: (chunk) => {
            if (replyId === null) {
              const reply = newMessage("agent", chunk);
              replyId = reply.id;
              setMessages((prev) => ({ ...prev, [key]: [...prev[key], reply] }));
            } else {
              const id = replyId;
              updateMessage(key, id, (m) => ({ text: m.text + chunk }));
            }
          },
        }
      );
      if (replyId === null) throw new AgentChatError("The agent didn't send a reply. Please try rephrasing your request.");
      updateMessage(key, task.id, () => ({ status: "done" }));
    } catch (err) {
      if (controller.signal.aborted) return;
      updateMessage(key, task.id, () => ({ status: "failed" }));
      const message = err instanceof AgentChatError ? err.message : "The agent couldn't respond right now. Please try again.";
      setMessages((prev) => ({ ...prev, [key]: [...prev[key], { ...newMessage("agent", message), error: true }] }));
    } finally {
      if (requests.current.get(key) === controller) requests.current.delete(key);
      setTyping((prev) => ({ ...prev, [key]: false }));
    }
  }

  function clearChat(role: AgentRole) {
    requests.current.get(role.key)?.abort();
    requests.current.delete(role.key);
    setMessages((prev) => ({ ...prev, [role.key]: [newMessage("agent", role.greeting)] }));
  }

  const panel = (role: AgentRole, onClose?: () => void) => (
    <AgentPanel
      // Remount per agent so each selection opens on the Chat tab.
      key={role.key}
      role={role}
      avatar={avatars[role.key]}
      user={user}
      messages={messages[role.key]}
      typing={typing[role.key]}
      paused={paused[role.key]}
      settings={settings[role.key]}
      onSend={(text) => sendTask(role.key, text)}
      onTogglePause={() => setPaused((prev) => ({ ...prev, [role.key]: !prev[role.key] }))}
      onClearChat={() => clearChat(role)}
      onSettingsChange={(patch) => setSettings((prev) => ({ ...prev, [role.key]: { ...prev[role.key], ...patch } }))}
      onClose={onClose}
    />
  );

  if (overview !== undefined) {
    const role = AGENT_ROLES.find((r) => r.key === selected);
    return (
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">{role ? panel(role, () => select(null)) : overview}</div>
        <div className="min-w-0 xl:sticky xl:top-[96px] xl:self-start" style={stagger(1)}>
          {office}
        </div>
      </div>
    );
  }

  // The AI Agents page always has an agent open.
  const role = AGENT_ROLES.find((r) => r.key === selected) ?? AGENT_ROLES[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
      {/* Left: agents, then the selected agent's workspace */}
      <div className="flex min-w-0 flex-col gap-5">
        <section style={stagger(0)}>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-[2.25rem] sm:leading-[1.1]">AI Agents</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">Chat with your agents, give them tasks and see their work.</p>
        </section>

        <AgentPicker selected={role.key} onSelect={select} avatars={avatars} paused={paused} />

        {panel(role)}
      </div>

      {/* Right: the office. Clicking a character selects that agent. */}
      <div className="min-w-0 xl:sticky xl:top-[96px] xl:self-start" style={stagger(1)}>
        {office}
        <p className="mt-3 text-center text-xs text-muted-foreground">Tip: click an agent in the office to open their workspace.</p>
      </div>
    </div>
  );
}

// ---- Agent row ----

function AgentPicker({
  selected,
  onSelect,
  avatars,
  paused,
}: {
  selected: AgentRoleKey;
  onSelect: (key: AgentRoleKey) => void;
  avatars: Partial<PerAgent<string>>;
  paused: PerAgent<boolean>;
}) {
  return (
    <div role="group" aria-label="Agents" className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pt-1 pb-3" style={stagger(1)}>
      {AGENT_ROLES.map((role) => {
        const active = role.key === selected;
        const styles = ROLE_STYLES[role.key];
        return (
          <button
            key={role.key}
            type="button"
            onClick={() => onSelect(role.key)}
            aria-pressed={active}
            className={cn(
              "group relative flex min-w-[11rem] flex-1 snap-start items-center gap-3 rounded-2xl border bg-background py-2.5 pr-3 pl-2.5 text-left shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-all duration-300 outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/40",
              active && cn("-translate-y-0.5 shadow-lg hover:shadow-lg", styles.selected)
            )}
          >
            <AgentAvatar role={role} src={avatars[role.key]} className={cn("size-11 transition-transform duration-300", active && "scale-105")} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{role.name}</span>
              <StatusLabel paused={paused[role.key]} className="mt-0.5" />
            </span>
            {/* Pointer from the selected agent down to its workspace */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute -bottom-[7px] left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[3px] bg-gradient-to-br shadow-sm transition-all duration-300",
                styles.tile,
                active ? "scale-100 opacity-100" : "scale-0 opacity-0"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

// ---- Selected agent ----

function AgentPanel({
  role,
  avatar,
  user,
  messages,
  typing,
  paused,
  settings,
  onSend,
  onTogglePause,
  onClearChat,
  onSettingsChange,
  onClose,
}: {
  role: AgentRole;
  avatar?: string;
  user: ChatUser;
  messages: ChatMessage[];
  typing: boolean;
  paused: boolean;
  settings: AgentSettings;
  onSend: (text: string) => void;
  onTogglePause: () => void;
  onClearChat: () => void;
  onSettingsChange: (patch: Partial<AgentSettings>) => void;
  /** Shows a close button (used on the overview to go back). */
  onClose?: () => void;
}) {
  const [tab, setTab] = useState("chat");
  const tasks = messages.filter((m) => m.from === "user");
  const ref = useRef<HTMLElement>(null);

  // Opened from the office (on the overview): on small screens the panel sits above it, so bring it into view.
  useEffect(() => {
    const el = ref.current;
    if (!onClose || !el) return;
    if (el.getBoundingClientRect().top < 72) el.scrollIntoView({ behavior: "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the panel opens
  }, []);

  return (
    <section
      ref={ref}
      className="scroll-mt-24 rounded-3xl border bg-background p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_8px_24px_-12px_rgb(0_0_0/0.08)] animate-in fade-in slide-in-from-bottom-1 duration-300 sm:p-6"
      aria-label={role.name}
    >
      <div className="flex flex-wrap items-start gap-4">
        <AgentAvatar role={role} src={avatar} className="size-16" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold tracking-tight">{role.name}</h3>
            <StatusLabel paused={paused} pill />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 rounded-xl px-3 font-semibold" onClick={onTogglePause}>
            {paused ? <Play data-icon="inline-start" /> : <Pause data-icon="inline-start" />}
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button variant="outline" className="h-9 rounded-xl px-3 font-semibold" onClick={() => setTab("settings")}>
            <Settings data-icon="inline-start" />
            Settings
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="More actions"
              className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 data-[popup-open]:bg-muted"
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-44 rounded-2xl p-1.5 shadow-xl">
              <DropdownMenuItem variant="destructive" className="gap-2.5 rounded-xl px-2 py-2" onClick={onClearChat}>
                <Trash2 />
                Clear chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onClose && (
            <Button variant="ghost" size="icon" className="size-9 rounded-xl text-muted-foreground" onClick={onClose} aria-label={`Close ${role.name}`}>
              <X />
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(String(value))} className="mt-5 gap-0">
        <TabsList variant="line" className="w-full justify-start gap-6 border-b p-0 group-data-horizontal/tabs:h-auto">
          {[
            { value: "chat", label: "Chat", Icon: MessageSquare },
            { value: "history", label: "History", Icon: Clock },
            { value: "settings", label: "Settings", Icon: Settings },
          ].map(({ value, label, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-10 flex-none px-1 text-[15px] font-semibold after:bg-primary group-data-horizontal/tabs:after:bottom-[-1px] data-active:text-primary dark:data-active:text-primary"
            >
              <Icon />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="chat" className="pt-4">
          <ChatTab role={role} avatar={avatar} user={user} messages={messages} typing={typing} paused={paused} onSend={onSend} />
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <HistoryTab tasks={tasks} onGiveTask={() => setTab("chat")} />
        </TabsContent>
        <TabsContent value="settings" className="pt-4">
          <SettingsTab role={role} settings={settings} onChange={onSettingsChange} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function ChatTab({
  role,
  avatar,
  user,
  messages,
  typing,
  paused,
  onSend,
}: {
  role: AgentRole;
  avatar?: string;
  user: ChatUser;
  messages: ChatMessage[];
  typing: boolean;
  paused: boolean;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstName = role.name.split(" ")[0];

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, messages.at(-1)?.text.length, typing]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || paused || typing) return;
    onSend(text);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div ref={scrollRef} className="flex h-[min(26rem,55svh)] flex-col gap-5 overflow-y-auto pr-1" aria-live="polite">
        {messages.map((message) =>
          message.from === "agent" ? (
            <div key={message.id} className="flex max-w-[88%] gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <AgentAvatar role={role} src={avatar} className="mt-0.5 size-9" />
              <div className="min-w-0">
                <p
                  className={cn(
                    "rounded-2xl rounded-tl-md px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-line",
                    message.error ? "border border-destructive/20 bg-destructive/8 text-destructive" : "bg-muted"
                  )}
                  role={message.error ? "alert" : undefined}
                >
                  {message.text}
                </p>
                <MessageTime at={message.at} className="mt-1.5 ml-1" />
              </div>
            </div>
          ) : (
            <div key={message.id} className="ml-auto flex max-w-[88%] flex-row-reverse gap-3 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <ChatUserAvatar user={user} />
              <div className="flex min-w-0 flex-col items-end">
                <p className="rounded-2xl rounded-tr-md bg-primary/10 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-primary dark:text-foreground">
                  {message.text}
                </p>
                <MessageTime at={message.at} className="mt-1.5 mr-1" />
              </div>
            </div>
          )
        )}
        {typing && messages.at(-1)?.from === "user" && (
          <div className="flex gap-3 animate-in fade-in duration-300">
            <AgentAvatar role={role} src={avatar} className="size-9" />
            <span className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-muted px-4 py-3" aria-label={`${role.name} is typing`}>
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="size-1.5 animate-bounce rounded-full bg-primary/70" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="flex items-center gap-2 rounded-2xl border bg-background py-2 pr-2 pl-3 shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-shadow focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30"
      >
        <button type="button" disabled title="Attachments coming soon" aria-label="Attach a file" className="flex size-8 items-center justify-center rounded-lg text-muted-foreground disabled:opacity-60">
          <Paperclip className="size-4" />
        </button>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={paused}
          maxLength={CHAT_LIMITS.maxUserChars}
          placeholder={paused ? `${firstName} Agent is paused. Resume to give it tasks.` : `Give a task to your ${role.name}…`}
          aria-label={`Message ${role.name}`}
          className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <Button type="submit" size="icon" disabled={!draft.trim() || paused || typing} aria-label="Send" className="size-10 shrink-0 rounded-full shadow-md shadow-primary/25">
          <SendHorizontal />
        </Button>
      </form>
    </div>
  );
}

function HistoryTab({ tasks, onGiveTask }: { tasks: ChatMessage[]; onGiveTask: () => void }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ListTodo className="size-5" />
        </span>
        <p className="mt-4 text-[15px] font-bold">No tasks yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">Tasks you give this agent will show up here with their status.</p>
        <Button variant="outline" className="mt-5 h-9 rounded-xl px-4 font-semibold" onClick={onGiveTask}>
          <MessageSquare data-icon="inline-start" />
          Give a task
        </Button>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {[...tasks].reverse().map((task) => (
        <li key={task.id} className="flex items-start gap-3 rounded-2xl border bg-muted/30 px-4 py-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ListTodo className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{task.text}</p>
            <MessageTime at={task.at} className="mt-1" />
          </div>
          <TaskStatus status={task.status} />
        </li>
      ))}
    </ol>
  );
}

function SettingsTab({
  role,
  settings,
  onChange,
}: {
  role: AgentRole;
  settings: AgentSettings;
  onChange: (patch: Partial<AgentSettings>) => void;
}) {
  const options = [
    { key: "autoRun", label: "Work automatically", body: `Let the ${role.name} pick up work on its own schedule.` },
    { key: "askFirst", label: "Ask before acting", body: "Get your approval before anything is published or changed." },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => (
        <label key={option.key} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition-colors hover:bg-muted/40">
          <span>
            <span className="block text-sm font-semibold">{option.label}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{option.body}</span>
          </span>
          <Switch checked={settings[option.key]} onCheckedChange={(checked) => onChange({ [option.key]: checked })} />
        </label>
      ))}
      <div className="rounded-2xl border px-4 py-3.5">
        <label htmlFor={`instructions-${role.key}`} className="block text-sm font-semibold">Custom instructions</label>
        <p className="mt-0.5 text-xs text-muted-foreground">Anything this agent should always keep in mind.</p>
        <Textarea
          id={`instructions-${role.key}`}
          value={settings.instructions}
          onChange={(event) => onChange({ instructions: event.target.value })}
          placeholder="e.g. Focus on B2B audiences and keep a friendly, expert tone."
          className="mt-3 min-h-24 rounded-xl"
        />
      </div>
    </div>
  );
}

// ---- Small pieces ----

const TASK_STATUS = {
  pending: { label: "Working", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  done: { label: "Answered", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

function TaskStatus({ status = "pending" }: { status?: ChatMessage["status"] }) {
  const { label, className } = TASK_STATUS[status];
  return <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", className)}>{label}</span>;
}

/** The agent's office character, cropped to head and shoulders. Falls back to the role icon. */
function AgentAvatar({ role, src, className }: { role: AgentRole; src?: string; className?: string }) {
  const { Icon, tile } = ROLE_STYLES[role.key];

  if (!src) {
    return (
      <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-md", tile, className)}>
        <Icon className="size-[45%]" strokeWidth={2.2} />
      </span>
    );
  }

  return (
    <span className={cn("relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br ring-2 ring-background shadow-md", tile, className)}>
      <span className="absolute inset-0 bg-white/55 dark:bg-white/25" />
      {/* eslint-disable-next-line @next/next/no-img-element -- immutable hashed sprite, cropped with CSS */}
      <img src={src} alt="" draggable={false} decoding="async" className="absolute top-[4%] left-[-38%] w-[190%] max-w-none select-none" />
    </span>
  );
}

function ChatUserAvatar({ user }: { user: ChatUser }) {
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- OAuth provider avatar on an external host
    return <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" className="mt-0.5 size-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-pink text-xs font-bold text-white">
      {user.initials}
    </span>
  );
}

function StatusLabel({ paused, pill = false, className }: { paused: boolean; pill?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold",
        paused ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
        pill && cn("rounded-full px-2.5 py-0.5", paused ? "bg-amber-500/10" : "bg-emerald-500/10"),
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", paused ? "bg-amber-500" : "bg-emerald-500")} />
      {paused ? "Paused" : "Active"}
    </span>
  );
}

function MessageTime({ at, className }: { at: Date; className?: string }) {
  return (
    // Created on the server for the first render, so the client's clock/locale may differ.
    <time dateTime={at.toISOString()} suppressHydrationWarning className={cn("block text-[11px] text-muted-foreground", className)}>
      {at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
    </time>
  );
}

function stagger(index: number): React.CSSProperties {
  return { animation: `fade-up 600ms cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 80}ms both` };
}
