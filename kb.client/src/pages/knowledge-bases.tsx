import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Search, ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  knowledgeBaseApi,
  type KnowledgeBase,
} from "@/lib/api";

type SortField = "name" | "createdAt";
type SortDirection = "asc" | "desc";

export function KnowledgeBasesPage() {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Create KB dialog
  const [kbDialogOpen, setKbDialogOpen] = useState(false);
  const [kbForm, setKbForm] = useState({ name: "", slug: "", description: "" });
  const [isSavingKb, setIsSavingKb] = useState(false);

  async function loadKbs() {
    const { data, error } = await knowledgeBaseApi.getAll();
    if (error) toast.error(error);
    if (data) setKbs(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadKbs();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredKbs = kbs.filter((kb) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      kb.name.toLowerCase().includes(query) ||
      kb.slug.toLowerCase().includes(query) ||
      (kb.description?.toLowerCase().includes(query) ?? false)
    );
  });

  const sortedKbs = [...filteredKbs].sort((a, b) => {
    if (sortField === "createdAt") {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
    }
    return sortDirection === "asc"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name);
  });

  function openCreateKb() {
    setKbForm({ name: "", slug: "", description: "" });
    setKbDialogOpen(true);
  }

  async function handleSaveKb() {
    if (!kbForm.name) {
      toast.error("Name is required");
      return;
    }
    setIsSavingKb(true);

    const result = await knowledgeBaseApi.create({
      name: kbForm.name,
      slug: kbForm.slug,
      description: kbForm.description || undefined,
    });

    setIsSavingKb(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Knowledge base created");
    setKbDialogOpen(false);
    loadKbs();
  }

  async function handleDeleteKb(id: string) {
    if (!confirm("Delete this knowledge base and all its documents?")) return;
    const { error } = await knowledgeBaseApi.delete(id);
    if (error) toast.error(error);
    else {
      toast.success("Knowledge base deleted");
      loadKbs();
    }
  }

  return (
    <div className="h-full w-full bg-muted rounded-lg p-4 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start flex-col">
          <h1 className="text-xl font-semibold">Knowledge Bases</h1>
          <p className="text-sm text-muted-foreground">
            Manage knowledge bases and their documents
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="bg-background border border-input rounded-lg py-2 h-10 pl-10 pr-4 w-full text-sm focus:ring-2 focus:ring-ring focus:border-ring"
              placeholder="Search knowledge bases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={openCreateKb} className="cursor-pointer">
            <Plus className="w-4 h-4" />
            New Knowledge Base
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-md border">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] bg-muted-foreground/20 px-3 h-12 border-b border-muted rounded-t-md items-center">
            <button
              type="button"
              onClick={() => handleSort("name")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Name
              {sortField === "name" &&
                (sortDirection === "asc" ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                ))}
            </button>
            <div className="text-muted-foreground text-center">Slug</div>
            <div className="text-muted-foreground text-center">Description</div>
            <div className="text-muted-foreground text-center">Status</div>
            <button
              type="button"
              onClick={() => handleSort("createdAt")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground justify-center"
            >
              Created At
              {sortField === "createdAt" &&
                (sortDirection === "asc" ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                ))}
            </button>
            <div className="text-muted-foreground">Actions</div>
          </div>
          <ScrollArea className="max-h-[calc(100dvh-20rem)] h-full rounded-b-md">
            <div className="bg-muted-foreground/10 divide-y divide-muted last:rounded-b-md overflow-hidden">
              {sortedKbs.length === 0 ? (
                <div className="p-4 text-center">
                  {searchQuery
                    ? "No matching knowledge bases found"
                    : "No knowledge bases yet. Create one to get started."}
                </div>
              ) : (
                sortedKbs.map((kb) => (
                  <div
                    key={kb.id}
                    className="w-full text-left grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] p-3 items-center"
                  >
                    <div className="font-medium">{kb.name}</div>
                    <div className="truncate text-center">{kb.slug}</div>
                    <div className="truncate text-center">{kb.description ?? "—"}</div>
                    <div className="text-center">
                      <Badge variant={kb.isActive ? "default" : "secondary"}>
                        {kb.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="text-center">{new Date(kb.createdAt).toLocaleDateString()}</div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 cursor-pointer"
                        onClick={() => navigate(`/knowledge-bases/${kb.id}`)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 cursor-pointer"
                        onClick={() => handleDeleteKb(kb.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Create KB Dialog */}
      <Dialog open={kbDialogOpen} onOpenChange={setKbDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Knowledge Base</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="kb-name">Name</Label>
              <Input
                id="kb-name"
                value={kbForm.name}
                onChange={(e) =>
                  setKbForm({ ...kbForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kb-slug">Slug</Label>
              <Input
                id="kb-slug"
                value={kbForm.slug}
                onChange={(e) =>
                  setKbForm({ ...kbForm, slug: e.target.value })
                }
                placeholder="e.g. swedish-legal"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kb-desc">Description</Label>
              <Input
                id="kb-desc"
                value={kbForm.description}
                onChange={(e) =>
                  setKbForm({ ...kbForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setKbDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveKb} disabled={isSavingKb}>
              {isSavingKb && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
