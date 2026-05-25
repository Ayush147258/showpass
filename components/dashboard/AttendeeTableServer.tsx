"use client";
import { useState } from "react";
import { AttendeeTable } from "./AttendeeTable";
import { ChevronDown } from "lucide-react";

export function AttendeeTableServer({ events }: { events: { id: string; title: string }[] }) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-white/40 uppercase tracking-widest whitespace-nowrap">
          Event
        </label>
        <div className="relative max-w-sm w-full">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full appearance-none px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-accent/50 cursor-pointer pr-9"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
      </div>
      {selectedEventId && <AttendeeTable eventId={selectedEventId} />}
    </div>
  );
}
