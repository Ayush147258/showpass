import { CreateEventForm } from "@/components/dashboard/CreateEventForm";

export default function NewEventPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,212,170,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(255,107,53,0.14),transparent_28%)] px-5 py-6 sm:px-8 lg:px-10">
      <div className="mb-8 max-w-5xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-teal-300">Organizer Studio</p>
        <h1 className="font-clash text-4xl font-bold text-white">Create Event</h1>
        <p className="text-white/55 text-sm mt-2">Build a clean listing, add ticket tiers, and launch something your campus will actually notice.</p>
      </div>
      <CreateEventForm />
    </div>
  );
}
