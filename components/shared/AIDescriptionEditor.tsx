"use client";
import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AIDescriptionEditorProps {
  value: string;
  onChange: (val: string) => void;
}

const TONE_OPTIONS = [
  { id: "hype", label: "🔥 Hype", desc: "Electric, energetic, FOMO-inducing" },
  { id: "professional", label: "💼 Pro", desc: "Clean, credible, informative" },
  { id: "casual", label: "😊 Casual", desc: "Friendly, warm, conversational" },
];

export function AIDescriptionEditor({ value, onChange }: AIDescriptionEditorProps) {
  const [bullets, setBullets] = useState("");
  const [tone, setTone] = useState("hype");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [provider, setProvider] = useState("");
  const [showAI, setShowAI] = useState(false);

  const generate = async () => {
    if (!bullets.trim()) {
      toast.error("Add at least 2-3 bullet points first");
      return;
    }
    setLoading(true);
    setProvider("");
    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullets, tone }),
      });
      const data = await res.json();
      if (data.description) {
        onChange(data.description);
        setProvider(data.provider);
        toast.success("✨ Description generated!", { description: `Powered by ${data.provider}` });
      }
    } catch {
      toast.error("AI generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Manual textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your event description… or use AI ✨ below"
          rows={5}
          className="sp-input min-h-40 resize-none leading-relaxed"
        />
        {value && (
          <button
            onClick={copy}
            className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/6 hover:bg-white/12 flex items-center justify-center transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5 text-white/40" />}
          </button>
        )}
      </div>

      {/* AI toggle */}
      <button
        onClick={() => setShowAI(!showAI)}
        className={cn(
          "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all",
          showAI
            ? "bg-purple-500/18 border-purple-300/40 text-purple-100"
            : "bg-navy-600/70 border-white/12 text-white/70 hover:text-white hover:bg-white/8"
        )}
      >
        <Sparkles className="w-4 h-4" />
        {showAI ? "Hide AI Generator" : "Generate with AI ✨"}
      </button>

      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-purple-500/15 via-white/[0.04] to-teal-400/10 border border-purple-300/25 rounded-2xl p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AI Description Writer</p>
                  <p className="text-xs text-white/40">Gemini → Groq → OpenRouter</p>
                </div>
                {provider && (
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-400 border border-teal-500/20">
                    via {provider}
                  </span>
                )}
              </div>

              {/* Tone selector */}
              <div>
                <p className="text-xs text-white/40 mb-2">Tone</p>
                <div className="grid grid-cols-3 gap-2">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all",
                        tone === t.id
                          ? "bg-accent/18 border-accent/55 text-white"
                          : "bg-navy-600/70 border-white/12 text-white/65 hover:border-teal-300/35"
                      )}
                    >
                      <p className="text-xs font-semibold">{t.label}</p>
                      <p className="text-[10px] mt-0.5 leading-tight opacity-70">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bullets input */}
              <div>
                <p className="text-xs text-white/40 mb-2">Your event highlights (one per line)</p>
                <textarea
                  value={bullets}
                  onChange={(e) => setBullets(e.target.value)}
                  placeholder={"Headliner: DJ Aryan\n5000+ attendees expected\nVIP lounge with open bar\nLive art installations\nFood trucks from 20 vendors"}
                  rows={5}
                  className="sp-input min-h-36 resize-none font-mono"
                />
              </div>

              {/* Generate button */}
              <button
                onClick={generate}
                disabled={loading || !bullets.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-accent text-white font-bold text-sm hover:opacity-90 transition-all shadow-glow-purple/30 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Generate Description</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
