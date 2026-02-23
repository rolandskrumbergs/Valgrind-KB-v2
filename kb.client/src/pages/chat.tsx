import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";

const mockMessages = [
  { id: 1, role: "assistant" as const, content: "Hej! Jag är Lena, din juridiska AI-assistent. Hur kan jag hjälpa dig idag?" },
  { id: 2, role: "user" as const, content: "Vad är skillnaden mellan god man och förvaltare?" },
  { id: 3, role: "assistant" as const, content: "En god man är ett stöd för personer som behöver hjälp med att bevaka sin rätt, förvalta sin egendom eller sörja för sin person. Personen behåller sin rättshandlingsförmåga.\n\nEn förvaltare utses istället när godmanskap inte är tillräckligt. Vid förvaltarskap förlorar personen sin rättshandlingsförmåga inom de områden förvaltarskapet omfattar." },
];

const starters = [
  "Vad innebär godmanskap?",
  "Hur ansöker man om förvaltare?",
  "Vilka rättigheter har en ställföreträdare?",
];

export function ChatPage() {
  const [input, setInput] = useState("");

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Lena Chat</h1>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {mockMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
        </CardContent>

        <div className="border-t p-4">
          <div className="flex gap-2 mb-3">
            {starters.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setInput(s)}
              >
                {s}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Skriv ett meddelande..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
