import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  aiProfileApi,
  knowledgeBaseApi,
  type AiProfile,
  type KnowledgeBase,
} from "@/lib/api";

const defaultForm = {
  name: "",
  knowledgeBaseId: "",
  model: "gpt-4o",
  topK: 10,
  minRelevanceThreshold: 0.7,
  minRelevanceChunksRequired: 3,
  highConfidenceThreshold: 0.85,
  highConfidenceChunksRequired: 2,
};

export function AiProfilesPage() {
  const [profiles, setProfiles] = useState<AiProfile[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);

  async function loadData() {
    const [profileRes, kbRes] = await Promise.all([
      aiProfileApi.getAll(),
      knowledgeBaseApi.getAll(),
    ]);
    if (profileRes.data) setProfiles(profileRes.data);
    if (kbRes.data) setKnowledgeBases(kbRes.data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(profile: AiProfile) {
    setEditingId(profile.id);
    setForm({
      name: profile.name,
      knowledgeBaseId: profile.knowledgeBaseId,
      model: profile.model,
      topK: profile.topK,
      minRelevanceThreshold: profile.minRelevanceThreshold,
      minRelevanceChunksRequired: profile.minRelevanceChunksRequired,
      highConfidenceThreshold: profile.highConfidenceThreshold,
      highConfidenceChunksRequired: profile.highConfidenceChunksRequired,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.knowledgeBaseId) {
      toast.error("Name and Knowledge Base are required");
      return;
    }
    setIsSaving(true);
    const payload = {
      ...form,
      topK: Number(form.topK),
      minRelevanceThreshold: Number(form.minRelevanceThreshold),
      minRelevanceChunksRequired: Number(form.minRelevanceChunksRequired),
      highConfidenceThreshold: Number(form.highConfidenceThreshold),
      highConfidenceChunksRequired: Number(form.highConfidenceChunksRequired),
    };

    const result = editingId
      ? await aiProfileApi.update(editingId, payload)
      : await aiProfileApi.create(payload);

    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(editingId ? "Profile updated" : "Profile created");
    setDialogOpen(false);
    loadData();
  }

  async function handleActivate(id: string, isActive: boolean) {
    const { error } = await aiProfileApi.activate(id, isActive);
    if (error) toast.error(error);
    else {
      toast.success(isActive ? "Profile activated" : "Profile deactivated");
      loadData();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this AI profile?")) return;
    const { error } = await aiProfileApi.delete(id);
    if (error) toast.error(error);
    else {
      toast.success("Profile deleted");
      loadData();
    }
  }

  function getKbName(id: string) {
    return knowledgeBases.find((kb) => kb.id === id)?.name ?? "Unknown";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Profiles</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Profile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All AI Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : profiles.length === 0 ? (
            <p className="text-muted-foreground">No AI profiles yet. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Knowledge Base</TableHead>
                  <TableHead>Top K</TableHead>
                  <TableHead>Min Relevance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell className="font-mono text-sm">{profile.model}</TableCell>
                    <TableCell>{getKbName(profile.knowledgeBaseId)}</TableCell>
                    <TableCell>{profile.topK}</TableCell>
                    <TableCell>{profile.minRelevanceThreshold}</TableCell>
                    <TableCell>
                      <Badge variant={profile.isActive ? "default" : "secondary"}>
                        {profile.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleActivate(profile.id, !profile.isActive)
                        }
                      >
                        {profile.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(profile)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(profile.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit AI Profile" : "Create AI Profile"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Knowledge Base</Label>
              <Select
                value={form.knowledgeBaseId}
                onValueChange={(v) => setForm({ ...form, knowledgeBaseId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select knowledge base" />
                </SelectTrigger>
                <SelectContent>
                  {knowledgeBases.map((kb) => (
                    <SelectItem key={kb.id} value={kb.id}>
                      {kb.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Model</Label>
              <Select
                value={form.model}
                onValueChange={(v) => setForm({ ...form, model: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                  <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="topK">Top K</Label>
                <Input
                  id="topK"
                  type="number"
                  value={form.topK}
                  onChange={(e) =>
                    setForm({ ...form, topK: Number(e.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="minRelevance">Min Relevance</Label>
                <Input
                  id="minRelevance"
                  type="number"
                  step="0.05"
                  value={form.minRelevanceThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minRelevanceThreshold: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minChunks">Min Relevance Chunks</Label>
                <Input
                  id="minChunks"
                  type="number"
                  value={form.minRelevanceChunksRequired}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minRelevanceChunksRequired: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="highConf">High Confidence Threshold</Label>
                <Input
                  id="highConf"
                  type="number"
                  step="0.05"
                  value={form.highConfidenceThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      highConfidenceThreshold: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="highChunks">High Confidence Chunks Required</Label>
              <Input
                id="highChunks"
                type="number"
                value={form.highConfidenceChunksRequired}
                onChange={(e) =>
                  setForm({
                    ...form,
                    highConfidenceChunksRequired: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
