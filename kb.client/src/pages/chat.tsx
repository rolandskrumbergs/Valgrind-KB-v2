import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Plus, ThumbsUp, ThumbsDown, Loader2, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  conversationApi,
  conversationStarterApi,
  type Conversation,
  type ConversationMessage,
  type ConversationStarter,
} from "@/lib/api";

interface DisplayMessage {
  id: string;
  role: string;
  content: string;
  isStreaming?: boolean;
}

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [starters, setStarters] = useState<ConversationStarter[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  // Load conversations and starters
  useEffect(() => {
    async function load() {
      const [convRes, starterRes] = await Promise.all([
        conversationApi.getAll(),
        conversationStarterApi.getAll(),
      ]);
      if (convRes.data) setConversations(convRes.data);
      if (starterRes.data)
        setStarters(starterRes.data.filter((s) => s.isActive));
      setIsLoading(false);
    }
    load();
  }, []);

  // When active conversation changes, load its messages
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    const conv = conversations.find((c) => c.id === activeId);
    if (conv) {
      setMessages(
        conv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content ?? "",
        }))
      );
      scrollToBottom();
    }
  }, [activeId, conversations, scrollToBottom]);

  async function createConversation() {
    const { data, error } = await conversationApi.create();
    if (error) {
      toast.error(error);
      return null;
    }
    if (data) {
      setConversations((prev) => [data, ...prev]);
      setActiveId(data.id);
      return data.id;
    }
    return null;
  }

  async function selectConversation(id: string) {
    setActiveId(id);
    // Reload conversation to get full messages
    const { data } = await conversationApi.getById(id);
    if (data) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? data : c))
      );
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isSending) return;

    let convId = activeId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) return;
    }

    setInput("");
    setIsSending(true);

    // Add user message immediately
    const userMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    scrollToBottom();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let finalMessageId: string | undefined;

      for await (const event of conversationApi.sendMessage(
        convId,
        text,
        controller.signal
      )) {
        if (event.type === "token" && event.content) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.isStreaming) {
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + event.content },
              ];
            }
            return prev;
          });
          scrollToBottom();
        } else if (event.type === "done") {
          finalMessageId = event.messageId;
        } else if (event.type === "error") {
          toast.error(event.error ?? "An error occurred");
        }
      }

      // Finalize streaming message
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { ...last, isStreaming: false, id: finalMessageId ?? last.id },
          ];
        }
        return prev;
      });

      // Update conversation title in sidebar
      const { data: updated } = await conversationApi.getById(convId);
      if (updated) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? updated : c))
        );
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Failed to send message");
      }
    } finally {
      setIsSending(false);
      abortRef.current = null;
    }
  }

  async function handleFeedback(messageId: string, isPositive: boolean) {
    if (!activeId) return;
    const { error } = await conversationApi.addFeedback(
      activeId,
      messageId,
      isPositive
    );
    if (error) toast.error(error);
    else toast.success(isPositive ? "Thanks for the feedback!" : "Feedback recorded");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversation sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col">
        <Button className="mb-3 w-full" onClick={createConversation}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <ScrollArea className="flex-1">
          <div className="space-y-1 pr-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left rounded-md px-3 py-2 text-sm truncate transition-colors ${
                  conv.id === activeId
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <MessageSquare className="inline mr-2 h-3.5 w-3.5" />
                {conv.title || "Untitled conversation"}
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-sm text-muted-foreground px-3 py-2">
                No conversations yet
              </p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-hidden p-0">
          <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !activeId && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-xl font-semibold mb-2">Lena Chat</h2>
                <p className="text-muted-foreground mb-6">
                  Hej! Ställ en fråga eller välj en startfråga nedan.
                </p>
                {starters.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {starters.map((s) => (
                      <Button
                        key={s.id}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => sendMessage(s.text)}
                      >
                        {s.text}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%] group">
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">
                      {msg.content}
                      {msg.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/60 animate-pulse" />
                      )}
                    </p>
                  </div>
                  {msg.role === "assistant" && !msg.isStreaming && msg.content && (
                    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleFeedback(msg.id, true)}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleFeedback(msg.id, false)}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>

        <div className="border-t p-4">
          {messages.length > 0 && starters.length > 0 && !activeId && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {starters.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => sendMessage(s.text)}
                  disabled={isSending}
                >
                  {s.text}
                </Button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              placeholder="Skriv ett meddelande..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              rows={1}
              disabled={isSending}
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
