import { createFileRoute, Link } from "@tanstack/react-router";
import { BrainCircuit, CheckCircle2, Copy, ImagePlus, Loader2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageShell, Panel, PriorityBadge, selectClass } from "@/components/civic/ui";
import { addComplaint, CATEGORIES, type Category, type Complaint } from "@/lib/complaints";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report an Issue — CivicPulse AI" },
      { name: "description", content: "Submit a civic complaint with photo and location and get a tracking ID instantly." },
      { property: "og:title", content: "Report an Issue — CivicPulse AI" },
      { property: "og:description", content: "Submit a civic complaint and get a tracking ID." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const empty = { name: "", title: "", description: "", category: "" as Category | "", location: "" };

function ReportPage() {
  const [form, setForm] = useState(empty);
  const [image, setImage] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Complaint | null>(null);

  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function onImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file");
    if (file.size > 8 * 1024 * 1024) return toast.error("Image must be under 8 MB");
    try { setImage(await resizeImage(file)); } catch { toast.error("Could not read that image"); }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (form.title.trim().length < 5) err.title = "Title must be at least 5 characters";
    if (form.description.trim().length < 10) err.description = "Please describe the issue (min 10 characters)";
    if (!form.category) err.category = "Select a category";
    if (form.location.trim().length < 3) err.location = "Location is required";
    setErrors(err);
    if (Object.keys(err).length) return;
    setBusy(true);
    setTimeout(() => {
      const c = addComplaint({
        name: form.name.trim(), title: form.title.trim(), description: form.description.trim(),
        category: form.category as Category, location: form.location.trim(), image,
      });
      setBusy(false);
      setDone(c);
      setForm(empty);
      setImage(undefined);
      toast.success("Complaint submitted");
    }, 700);
  }

  if (done) {
    return (
      <PageShell className="max-w-xl">
        <Panel className="text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h1 className="mt-4 text-2xl font-bold text-navy">Complaint submitted!</h1>
          <p className="mt-2 text-sm text-muted-foreground">Save your complaint ID to track progress.</p>
          <div className="mx-auto mt-5 flex max-w-xs items-center justify-between rounded-lg border border-dashed border-teal bg-teal-soft px-4 py-3">
            <span className="font-display text-lg font-bold text-navy">{done.id}</span>
            <button aria-label="Copy ID" onClick={() => { navigator.clipboard?.writeText(done.id); toast.success("ID copied"); }}>
              <Copy className="h-4 w-4 text-teal" />
            </button>
          </div>
          <div className="mt-5 rounded-lg bg-muted p-4 text-left text-sm">
            <div className="flex items-center gap-2 font-semibold text-navy"><BrainCircuit className="h-4 w-4 text-teal" /> AI Triage <PriorityBadge priority={done.priority} /></div>
            <p className="mt-1 text-muted-foreground">{done.aiReason}</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/my-complaints">Track my complaints</Link></Button>
            <Button variant="outline" onClick={() => setDone(null)}>Report another</Button>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell className="max-w-2xl">
      <h1 className="text-3xl font-bold text-navy">Report a civic issue</h1>
      <p className="mt-1 text-muted-foreground">Tell us what's wrong. It takes less than a minute.</p>
      <Panel className="mt-6">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Field label="Your name (optional)">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Priya Nair" maxLength={60} />
          </Field>
          <Field label="Complaint title *" error={errors.title}>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Large pothole near bus stop" maxLength={100} />
          </Field>
          <Field label="Category *" error={errors.category}>
            <select className={selectClass} value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Description *" error={errors.description}>
            <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What is the problem? Since when? Is anyone at risk?" maxLength={1000} />
          </Field>
          <Field label="Location / address *" error={errors.location}>
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Street, Area, City" maxLength={150} />
          </Field>
          <Field label="Photo (optional)">
            {image ? (
              <div className="relative w-fit">
                <img src={image} alt="Preview" className="h-40 rounded-lg border border-border object-cover" />
                <button type="button" aria-label="Remove image" onClick={() => setImage(undefined)} className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-6 text-sm text-muted-foreground hover:border-teal hover:bg-teal-soft">
                <ImagePlus className="h-6 w-6 text-teal" />
                Click to upload an image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
              </label>
            )}
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <><Loader2 className="animate-spin" /> Analyzing & submitting…</> : "Submit Complaint"}
          </Button>
        </form>
      </Panel>
    </PageShell>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
