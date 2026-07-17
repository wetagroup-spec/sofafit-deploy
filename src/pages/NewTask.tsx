import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { ArrowLeft, Pen, Trash2, UploadCloud, Loader2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { trpc } from "@/providers/trpc";
import { uploadOrderFiles } from "@/lib/upload";

type PendingPhoto = {
  file: File;
  preview: string;
  caption: string;
};

export default function NewTask() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [customerName, setCustomerName] = useState("");
  const [contact, setContact] = useState("");
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = trpc.orders.create.useMutation();
  const setCaption = trpc.orders.setFileCaption.useMutation();

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: "",
    }));
    setPhotos((p) => [...p, ...next]);
  }

  function removePhoto(idx: number) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[idx].preview);
      return p.filter((_, i) => i !== idx);
    });
  }

  function openCaption(idx: number) {
    setEditing(idx);
    setCaptionDraft(photos[idx].caption);
  }

  function saveCaption() {
    if (editing === null) return;
    setPhotos((p) => p.map((ph, i) => (i === editing ? { ...ph, caption: captionDraft } : ph)));
    setEditing(null);
  }

  async function submit() {
    setError(null);
    if (!customerName.trim()) {
      setError("Please enter your name or company.");
      return;
    }
    if (photos.length === 0) {
      setError("Please add at least one photo (room and/or sofa).");
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder.mutateAsync({
        customerName: customerName.trim(),
        contact: contact.trim() || undefined,
        comment: comment.trim() || undefined,
      });
      const uploaded = await uploadOrderFiles(
        order.id,
        photos.map((p) => p.file),
        { kind: "input" },
      );
      await Promise.all(
        uploaded.map((f, i) =>
          photos[i].caption.trim()
            ? setCaption.mutateAsync({ id: f.id, caption: photos[i].caption.trim() })
            : Promise.resolve(),
        ),
      );
      navigate(`/orders/${order.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create the task");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New fitting task</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a photo of the room and a photo of the sofa (a screenshot from
          your website or store is fine). Add a note to each photo — e.g. room
          width, desired color, sofa size, or where to place it. A human manager
          will handle the fitting and reply in the order chat within 15–30
          minutes.
        </p>

        <Card className="mt-6">
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name / company *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Anna from CozyHome"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact">Contact (email / messenger)</Label>
                <Input
                  id="contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="anna@cozyhome.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comment">Order comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Room width 710 cm. Desired color: olive green. Sofa 450×270 cm, place it against the left wall…"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardContent className="p-6">
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors hover:border-primary/60 hover:bg-accent/50"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
            >
              <UploadCloud className="h-10 w-10 text-muted-foreground" />
              <p className="mt-2 font-medium">Click or drop photos here</p>
              <p className="text-sm text-muted-foreground">
                Room photo, sofa photo, color references — as many as you need
              </p>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {photos.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {photos.map((p, i) => (
                  <div key={p.preview} className="overflow-hidden rounded-xl border">
                    <div className="relative">
                      <img src={p.preview} alt="" className="aspect-[4/3] w-full object-cover" />
                      <div className="absolute right-2 top-2 flex gap-1">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          title="Add description"
                          onClick={() => openCaption(i)}
                        >
                          <Pen className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          title="Remove"
                          onClick={() => removePhoto(i)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="min-h-8 px-3 py-2 text-sm text-muted-foreground">
                      {p.caption || <span className="italic">No description — tap the pen to add one</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex justify-end">
          <Button size="lg" onClick={submit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create task
          </Button>
        </div>
      </main>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Photo description</DialogTitle>
          </DialogHeader>
          <Textarea
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            placeholder="e.g. Room photo. Width 710 cm."
            rows={3}
            autoFocus
          />
          <DialogFooter>
            <Button onClick={saveCaption}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
