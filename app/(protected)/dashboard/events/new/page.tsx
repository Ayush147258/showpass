import { CreateEventForm } from "@/components/dashboard/CreateEventForm";

export default function NewEventPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-clash text-3xl font-bold text-white">Create Event</h1>
        <p className="text-white/40 text-sm mt-1">Fill in the details and let AI help with the description.</p>
      </div>
      <CreateEventForm />
    </div>
  );
}
