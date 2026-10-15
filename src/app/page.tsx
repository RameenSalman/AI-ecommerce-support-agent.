
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
  time: string;
};

const suggestions = [
  {
    title: "Explore products",
    description: "Prices, availability and discounts",
    icon: "▦",
    question: "What products do you offer?",
  },
  {
    title: "Track an order",
    description: "Get updates on your order",
    icon: "↗",
    question: "How can I track my order?",
  },
  {
    title: "Refund policy",
    description: "Learn about returns and refunds",
    icon: "↩",
    question: "What is your refund policy?",
  },
  {
    title: "Current offers",
    description: "Find available promotions",
    icon: "%",
    question: "Are there any current discounts?",
  },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);


  async function handleSend() {
    const question = input.trim();

    if (!question || isLoading) return;

    // Save the previous conversation for context.
    const history = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: question,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
          history,
        }),
      });

      const data: { reply?: string; error?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to get a response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply || "Please try asking your question again.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (error) {
      console.error("Chat request failed:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            error instanceof Error &&
              error.message !== "Failed to fetch"
              ? error.message
              : "Sorry, I couldn't connect to the assistant. Please check your server and try again.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <main className="min-h-screen bg-[#100d18] p-3 text-slate-100 sm:p-5 lg:p-7">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1400px] overflow-hidden rounded-2xl border border-violet-300/15 bg-[#171321] shadow-[0_8px_40px_rgba(0,0,0,0.18)] sm:min-h-[calc(100vh-40px)] lg:min-h-[calc(100vh-56px)]">

        {/* Sidebar */}
        <aside className="hidden w-[245px] shrink-0 flex-col border-r border-violet-300/10 bg-[#130f1d] p-5 md:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold text-white">
              S
            </div>
            <div>
              <h1 className="font-semibold tracking-tight text-white">
                Shop<span className="text-violet-400">Assist</span>
              </h1>
              <p className="text-xs text-slate-400">
                Customer support
              </p>
            </div>
          </div>

          <button
            onClick={() => setMessages([])}
            className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-500"
          >
            <span className="text-lg">+</span>
            New conversation
          </button>

          <div className="mt-9">
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Support
            </p>

            <div className="space-y-1">
              <div className="flex items-center gap-3 rounded-lg border border-violet-400/10 bg-violet-500/10 px-3 py-3 text-sm font-medium text-violet-300">
                <span>✳</span>
                AI Assistant
              </div>

              <div className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200">
                <span>▦</span>
                Product enquiries
              </div>

              <div className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-slate-200">
                <span>↩</span>
                Orders & refunds
              </div>
            </div>
          </div>

          <div className="mt-auto rounded-xl border border-violet-300/10 bg-[#1b1627] p-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <p className="text-sm font-medium text-slate-200">
                Support assistant
              </p>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Help with products, orders, and company policies.
            </p>
          </div>
        </aside>

        {/* Main panel */}
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-violet-300/10 px-4 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-lg text-violet-300 md:hidden">
                S
              </div>
              <div>
                <h2 className="font-semibold text-white">
                  AI Support Assistant
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Product help, orders & refunds
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-300">
                Online
              </span>
            </div>
          </header>

          {/* Chat area */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            {messages.length === 0 ? (
              <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-10 sm:px-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-2xl text-violet-300">
                  ✳
                </div>

                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-violet-400">
                  YOUR SHOPPING ASSISTANT
                </p>

                <h3 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                  How can we help you
                  <span className="text-violet-400"> today?</span>
                </h3>

                <p className="mt-4 max-w-lg text-sm leading-7 text-slate-400 sm:text-base">
                  Ask us about products, order updates, discounts,
                  or refunds. We&apos;re here to make shopping easier.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {suggestions.map((item) => (
                    <button
                      key={item.title}
                      onClick={() => setInput(item.question)}
                      className="group rounded-xl border border-violet-300/10 bg-[#1b1726] p-4 text-left transition hover:border-violet-400/35 hover:bg-[#211a30]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-100 group-hover:text-violet-200">
                            {item.title}
                          </p>
                          <p className="mt-1.5 text-xs leading-5 text-slate-400">
                            {item.description}
                          </p>
                        </div>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-lg text-violet-300 transition group-hover:bg-violet-500/20">
                          {item.icon}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="mt-6 text-xs text-slate-500">
                  Select a topic or type your question below.
                </p>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-7 sm:px-10">
                {messages.map((message, index) => (
                  <div
                    key={`${message.time}-${index}`}
                    className={`flex items-start gap-3 ${message.role === "user"
                      ? "justify-end"
                      : "justify-start"
                      }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-lg text-violet-300">
                        ✳
                      </div>
                    )}

                    <div className="max-w-[85%]">
                      <div
                        className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user"
                            ? "bg-violet-600 text-white"
                            : "border border-violet-300/10 bg-[#211b2d] text-slate-200"
                          }`}
                      >
                        {message.role === "assistant" ? (
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        ) : (
                          message.content
                        )}
                      </div>

                      <p className="mt-1.5 text-[11px] text-slate-500">
                        {message.time}
                      </p>
                    </div>

                    {message.role === "user" && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-300/15 bg-[#231c30] text-[10px] font-semibold text-violet-200">
                        YOU
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-lg text-violet-300">
                      ✳
                    </div>

                    <div className="rounded-2xl border border-violet-300/10 bg-[#211b2d] px-4 py-3 text-sm text-violet-200">
                      Gemini is thinking...
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Message input */}
          <div className="border-t border-violet-300/10 bg-[#15111f] px-4 py-4 sm:px-7 sm:py-5">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
              className="mx-auto max-w-3xl"
            >
              <div className="flex items-center gap-2 rounded-xl border border-violet-300/15 bg-[#201a2c] p-2 transition focus-within:border-violet-400/50">
                <span className="pl-2 text-lg text-violet-400">
                  ✧
                </span>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about products, orders or refunds..."
                  aria-label="Type your message"
                  className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? "Thinking..." : "Send"}
                  <span aria-hidden="true">↗</span>
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-500">
                AI responses may need verification.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
