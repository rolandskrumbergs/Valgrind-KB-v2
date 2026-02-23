import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const summaryCards = [
  { title: "Total Conversations", value: "1,234" },
  { title: "Success Rate", value: "94.2%" },
  { title: "Avg Confidence", value: "0.82" },
  { title: "Total Tokens Used", value: "2.4M" },
];

const mockInvocations = [
  { id: "1", user: "Anna Svensson", query: "Vad är skillnaden mellan god man och förvaltare?", outcome: "Success", confidence: 0.92, tokens: 1240, date: "2026-02-23" },
  { id: "2", user: "Erik Johansson", query: "Hur ansöker man om godmanskap?", outcome: "Success", confidence: 0.88, tokens: 980, date: "2026-02-23" },
  { id: "3", user: "Maria Lindberg", query: "Vilka avgifter tar överförmyndaren?", outcome: "InsufficientData", confidence: 0.45, tokens: 650, date: "2026-02-22" },
  { id: "4", user: "Johan Andersson", query: "Kan en god man avsättas?", outcome: "Success", confidence: 0.85, tokens: 1100, date: "2026-02-22" },
  { id: "5", user: "Lisa Eriksson", query: "Regler för redovisning av huvudmannens ekonomi", outcome: "Success", confidence: 0.91, tokens: 1450, date: "2026-02-21" },
];

const outcomeColors: Record<string, "default" | "secondary" | "destructive"> = {
  Success: "default",
  InsufficientData: "secondary",
  Error: "destructive",
};

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent AI Invocations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Query</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvocations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.date}</TableCell>
                  <TableCell>{inv.user}</TableCell>
                  <TableCell className="max-w-[300px] truncate">{inv.query}</TableCell>
                  <TableCell>
                    <Badge variant={outcomeColors[inv.outcome] ?? "secondary"}>
                      {inv.outcome}
                    </Badge>
                  </TableCell>
                  <TableCell>{inv.confidence.toFixed(2)}</TableCell>
                  <TableCell>{inv.tokens.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
