"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AIDescriptionEditor } from "@/components/shared/AIDescriptionEditor";
import {
  ChevronRight, ChevronLeft, Plus, Trash2, Upload,
  Loader2, CheckCircle2, Zap, Globe, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "MUSIC", label: "🎵 Music" }, { value: "COLLEGE_FEST", label: "🎓 College Fest" },
  { value: "TECH", label: "💻 Tech" }, { value: "COMEDY", label: "🎭 Comedy" },
  { value: "FITNESS", label: "🏋️ Fitness" }, { value: "FOOD", label: "🍽️ Food" },
  { value: "WORKSHOP", label: "📚 Workshop" }, { value: "SPORTS", label: "⚽ Sports" },
  { value: "OTHER", label: "✨ Other" },
];
const TIER_TYPES = ["FREE", "GENERAL", "VIP", "EARLY_BIRD", "PREMIUM"];

const EventSchema = z.object({
  title: z.string().min(5, "At least 5 characters"),
  description: z.string().min(20, "At least 20 characters"),
  category: z.string().min(1, "Select a category"),
  startAt: z.string().min(1, "Required"),
  endAt: z.string().min(1, "Required"),
  venue: z.string().min(3, "Required"),
  city: z.string().min(2, "Required"),
  address: z.string().optional(),
  isOnline: z.boolean().default(false),
  onlineUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  tiers: z.array(z.object({
    name: z.string().min(1, "Required"),
    type: z.string(),
    price: z.coerce.number().min(0),
    capacity: z.coerce.number().min(1),
    description: z.string().optional(),
    earlyBirdPrice: z.coerce.number().optional(),
    earlyBirdEndsAt: z.string().optional(),
  })).min(1, "At least one tier required"),
});

type FormData = z.infer<typeof EventSchema>;

const STEPS = ["Details", "Description", "Tickets", "Review"];

export function CreateEventForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(EventSchema),
    defaultValues: {
      title: "", description: "", category: "", startAt: "", endAt: "",
      venue: "", city: "", address: "", isOnline: false, onlineUrl: "", bannerUrl: "",
      tiers: [{ name: "General Admission", type: "GENERAL", price: 0, capacity: 100, description: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "tiers" });
  const { watch, setValue, formState: { errors } } = form;
  const isOnline = watch("isOnline");
  const bannerUrl = watch("bannerUrl");

  const uploadBanner = async (file: File) => {
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "banner");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) { setValue("bannerUrl", data.url); toast.success("Banner uploaded!"); }
      else toast.error("Upload failed");
    } finally { setUploadingBanner(false); }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, tags: [] }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Event created! Now publish it from your dashboard.");
        router.push(`/dashboard/events/${result.data.id}`);
      } else {
        toast.error(result.error ?? "Failed to create event");
      }
    } catch { toast.error("Something went wrong"); }
    finally { setSubmitting(false); }
  };

  const nextStep = async () => {
    const fields0 = ["title", "category", "startAt", "endAt", "venue", "city"] as const;
    const fields1 = ["description"] as const;
    if (step === 0) {
      const ok = await form.trigger(fields0);
      if (!ok) return;
    }
    if (step === 1) {
      const ok = await form.trigger(fields1);
      if (!ok) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const data = watch();

  return (
    <div className="max-w-3xl">
      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-2 text-sm font-semibold transition-all",
                i === step ? "text-white" : i < step ? "text-teal-400 cursor-pointer" : "text-white/25"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                i === step ? "bg-accent text-white" :
                i < step ? "bg-teal-500 text-white" : "bg-white/10 text-white/30"
              )}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className="hidden sm:block">{s}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={cn("w-8 h-px", i < step ? "bg-teal-500/50" : "bg-white/10")} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* ── Step 0: Details ── */}
            {step === 0 && (
              <>
                <FormField label="Event Title" error={errors.title?.message} required>
                  <input {...form.register("title")} placeholder="e.g. NH7 Weekender 2025"
                    className="sp-input" />
                </FormField>

                <FormField label="Category" error={errors.category?.message} required>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map((c) => (
                      <label key={c.value} className={cn(
                        "flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all text-sm",
                        watch("category") === c.value
                          ? "bg-accent/15 border-accent/35 text-white"
                          : "bg-white/4 border-white/8 text-white/60 hover:border-white/20"
                      )}>
                        <input type="radio" {...form.register("category")} value={c.value} className="hidden" />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Start Date & Time" error={errors.startAt?.message} required>
                    <input type="datetime-local" {...form.register("startAt")} className="sp-input" />
                  </FormField>
                  <FormField label="End Date & Time" error={errors.endAt?.message} required>
                    <input type="datetime-local" {...form.register("endAt")} className="sp-input" />
                  </FormField>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white/4 border border-white/8 rounded-xl">
                  <input type="checkbox" {...form.register("isOnline")} id="isOnline"
                    className="w-4 h-4 accent-orange-500 rounded" />
                  <label htmlFor="isOnline" className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                    <Globe className="w-4 h-4 text-teal-400" /> This is an online event
                  </label>
                </div>

                {isOnline ? (
                  <FormField label="Online Event URL" error={errors.onlineUrl?.message}>
                    <input {...form.register("onlineUrl")} placeholder="https://zoom.us/j/..." className="sp-input" />
                  </FormField>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Venue Name" error={errors.venue?.message} required>
                        <input {...form.register("venue")} placeholder="NSCI Dome" className="sp-input" />
                      </FormField>
                      <FormField label="City" error={errors.city?.message} required>
                        <input {...form.register("city")} placeholder="Mumbai" className="sp-input" />
                      </FormField>
                    </div>
                    <FormField label="Full Address (optional)">
                      <input {...form.register("address")} placeholder="Worli, Mumbai, Maharashtra 400018" className="sp-input" />
                    </FormField>
                  </>
                )}

                <FormField label="Event Banner">
                  <div className="relative">
                    {bannerUrl ? (
                      <div className="relative rounded-xl overflow-hidden h-40 group">
                        <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setValue("bannerUrl", "")}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-semibold transition-all">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed border-white/15 hover:border-accent/40 cursor-pointer transition-all bg-white/3 group">
                        {uploadingBanner ? (
                          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-white/30 mb-2 group-hover:text-accent transition-colors" />
                            <span className="text-sm text-white/40 group-hover:text-white/60">
                              Click to upload banner (max 10MB)
                            </span>
                            <span className="text-xs text-white/25 mt-1">JPG, PNG, WebP · 1400×600 recommended</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => { if (e.target.files?.[0]) uploadBanner(e.target.files[0]); }} />
                      </label>
                    )}
                  </div>
                </FormField>
              </>
            )}

            {/* ── Step 1: Description ── */}
            {step === 1 && (
              <FormField label="Event Description" error={errors.description?.message} required>
                <AIDescriptionEditor
                  value={watch("description")}
                  onChange={(v) => setValue("description", v, { shouldValidate: true })}
                />
              </FormField>
            )}

            {/* ── Step 2: Ticket Tiers ── */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white/70">Ticket Tiers</p>
                  <button type="button" onClick={() => append({ name: "", type: "GENERAL", price: 0, capacity: 50, description: "" })}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-accent/15 border border-accent/25 text-accent hover:bg-accent/25 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Tier
                  </button>
                </div>
                {fields.map((field, i) => (
                  <div key={field.id} className="bg-white/3 border border-white/8 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Tier {i + 1}</p>
                      {fields.length > 1 && (
                        <button type="button" onClick={() => remove(i)}
                          className="text-red-400/60 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Tier Name">
                        <input {...form.register(`tiers.${i}.name`)} placeholder="VIP" className="sp-input text-sm" />
                      </FormField>
                      <FormField label="Type">
                        <select {...form.register(`tiers.${i}.type`)} className="sp-input text-sm">
                          {TIER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Price (₹)">
                        <input type="number" {...form.register(`tiers.${i}.price`)} placeholder="0"
                          className="sp-input text-sm" min="0" />
                      </FormField>
                      <FormField label="Capacity">
                        <input type="number" {...form.register(`tiers.${i}.capacity`)} placeholder="100"
                          className="sp-input text-sm" min="1" />
                      </FormField>
                    </div>
                    <FormField label="Description (optional)">
                      <input {...form.register(`tiers.${i}.description`)} placeholder="What's included…"
                        className="sp-input text-sm" />
                    </FormField>
                    {watch(`tiers.${i}.type`) === "EARLY_BIRD" && (
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Early Bird Price (₹)">
                          <input type="number" {...form.register(`tiers.${i}.earlyBirdPrice`)} className="sp-input text-sm" />
                        </FormField>
                        <FormField label="Offer Ends">
                          <input type="datetime-local" {...form.register(`tiers.${i}.earlyBirdEndsAt`)} className="sp-input text-sm" />
                        </FormField>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4">
                  <h3 className="font-clash font-bold text-white">Review your event</h3>
                  {bannerUrl && <img src={bannerUrl} alt="" className="w-full h-36 object-cover rounded-xl" />}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <ReviewItem label="Title" value={data.title} />
                    <ReviewItem label="Category" value={data.category} />
                    <ReviewItem label="Start" value={data.startAt?.replace("T", " ")} />
                    <ReviewItem label="End" value={data.endAt?.replace("T", " ")} />
                    <ReviewItem label={data.isOnline ? "Format" : "Venue"} value={data.isOnline ? "Online" : data.venue} />
                    <ReviewItem label="City" value={data.isOnline ? "—" : data.city} />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Description preview</p>
                    <p className="text-sm text-white/60 line-clamp-3">{data.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-2">Ticket Tiers ({data.tiers?.length})</p>
                    <div className="space-y-1.5">
                      {data.tiers?.map((t, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-white/70">{t.name} ({t.type})</span>
                          <span className="font-semibold text-white">
                            {t.price === 0 ? "FREE" : `₹${t.price}`} · {t.capacity} seats
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-white/30 text-center">
                  Event will be saved as draft. Publish it from your dashboard after review.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/8">
          <button type="button" onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 text-sm font-semibold">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-600 transition-all shadow-glow-accent/30">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent-600 transition-all shadow-glow-accent disabled:opacity-50">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Zap className="w-4 h-4" /> Create Event</>}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function FormField({ label, children, error, required }: {
  label: string; children: React.ReactNode; error?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-widest">
        {label}{required && <span className="text-accent ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-white mt-0.5 truncate">{value || "—"}</p>
    </div>
  );
}
