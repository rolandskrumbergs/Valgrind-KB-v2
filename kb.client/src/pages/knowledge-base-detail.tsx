import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  Trash2,
  RefreshCw,
  Loader2,
  Database,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  knowledgeBaseApi,
  documentApi,
  type KnowledgeBase,
  type Document,
} from "@/lib/api";

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  Completed: "default",
  Processing: "secondary",
  Failed: "destructive",
  Uploaded: "secondary",
  Pending: "secondary",
};

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function KnowledgeBaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [kb, setKb] = useState<KnowledgeBase | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", description: "", isActive: true });
  const [isSaving, setIsSaving] = useState(false);

  // Upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("Laws");
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadKb() {
    const { data, error: err } = await knowledgeBaseApi.getById(id!);
    if (err) setError(err);
    if (data) setKb(data);
    setIsLoading(false);
  }

  async function loadDocuments() {
    setIsLoadingDocs(true);
    const { data, error: err } = await documentApi.getAll(id!);
    if (err) toast.error(err);
    if (data) setDocuments(data);
    setIsLoadingDocs(false);
  }

  useEffect(() => {
    loadKb();
    loadDocuments();
  }, [id]);

  function openEdit() {
    if (!kb) return;
    setEditForm({
      name: kb.name,
      description: kb.description ?? "",
      isActive: kb.isActive,
    });
    setEditDialogOpen(true);
  }

  async function handleSave() {
    if (!editForm.name) {
      toast.error("Name is required");
      return;
    }
    setIsSaving(true);
    const result = await knowledgeBaseApi.update(id!, {
      name: editForm.name,
      description: editForm.description || undefined,
      isActive: editForm.isActive,
    });
    setIsSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Knowledge base updated");
    setEditDialogOpen(false);
    loadKb();
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const { error: err } = await documentApi.upload(id!, file, uploadCategory);
    setIsUploading(false);

    if (err) {
      toast.error(err);
      return;
    }

    toast.success("Document uploaded");
    setUploadDialogOpen(false);
    if (fileRef.current) fileRef.current.value = "";
    loadDocuments();
  }

  async function handleReprocess(docId: string) {
    const { error: err } = await documentApi.reprocess(id!, docId);
    if (err) toast.error(err);
    else {
      toast.success("Reprocessing started");
      loadDocuments();
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm("Delete this document?")) return;
    const { error: err } = await documentApi.delete(id!, docId);
    if (err) toast.error(err);
    else {
      toast.success("Document deleted");
      loadDocuments();
    }
  }

  if (isLoading) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !kb) {
    return (
      <div className="h-full w-full bg-muted rounded-lg p-4">
        <Link
          to="/knowledge-bases"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Knowledge Bases
        </Link>
        <div className="text-center text-destructive">
          {error ?? "Knowledge base not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-muted rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link
          to="/knowledge-bases"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Knowledge Bases
        </Link>
        <Button variant="default" className="cursor-pointer" onClick={openEdit}>
          <Pencil className="w-4 h-4" />
          Edit Knowledge Base
        </Button>
      </div>

      {/* KB Info Card */}
      <div className="bg-muted-foreground/10 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{kb.name}</h1>
          <Badge variant={kb.isActive ? "default" : "secondary"}>
            {kb.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block">Slug</span>
            <span className="font-medium">{kb.slug}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Description</span>
            <span className="font-medium">{kb.description ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Container</span>
            <span className="font-medium">{kb.blobContainerName}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">Created</span>
            <span className="font-medium">
              {new Date(kb.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documents</h2>
        <Button
          variant="default"
          className="cursor-pointer"
          onClick={() => setUploadDialogOpen(true)}
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {isLoadingDocs ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] bg-muted-foreground/20 px-3 h-12 border-b border-muted rounded-t-md items-center">
            <div className="text-muted-foreground">File Name</div>
            <div className="text-muted-foreground">Category</div>
            <div className="text-muted-foreground">Size</div>
            <div className="text-muted-foreground">Chunks</div>
            <div className="text-muted-foreground">Status</div>
            <div className="text-muted-foreground">Actions</div>
          </div>
          <ScrollArea className="max-h-[calc(100dvh-28rem)] h-full rounded-b-md">
            <div className="bg-muted-foreground/10 divide-y divide-muted last:rounded-b-md overflow-hidden">
              {documents.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No documents yet. Upload a document to get started.
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] px-3 py-3 items-center"
                  >
                    <div className="font-medium truncate">{doc.fileName}</div>
                    <div>{doc.category}</div>
                    <div>{formatBytes(doc.fileSize)}</div>
                    <div>
                      {doc.indexedChunks}/{doc.totalChunks}
                    </div>
                    <div>
                      <Badge
                        variant={statusColors[doc.processingStatus] ?? "secondary"}
                      >
                        {doc.processingStatus}
                      </Badge>
                      {doc.errorMessage && (
                        <span
                          className="ml-2 text-xs text-destructive"
                          title={doc.errorMessage}
                        >
                          (error)
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {doc.processingStatus === "Failed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer"
                          onClick={() => handleReprocess(doc.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive cursor-pointer"
                        onClick={() => handleDeleteDoc(doc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Edit KB Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Base</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="kb-name">Name</Label>
              <Input
                id="kb-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kb-desc">Description</Label>
              <Input
                id="kb-desc"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="kb-active"
                checked={editForm.isActive}
                onChange={(e) =>
                  setEditForm({ ...editForm, isActive: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="kb-active">Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="doc-file">File</Label>
              <Input id="doc-file" type="file" ref={fileRef} />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={uploadCategory}
                onValueChange={setUploadCategory}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laws">Laws</SelectItem>
                  <SelectItem value="Books">Books</SelectItem>
                  <SelectItem value="LegalCases">Legal Cases</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
