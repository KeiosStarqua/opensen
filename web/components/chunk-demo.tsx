const slots = [
  "your research",
  "the program",
  "the application process",
  "the project",
];

export function ChunkDemo() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
        Sentence frame + slot
      </p>
      <p className="mt-4 font-mono text-lg text-slate-900 sm:text-xl">
        Could you tell me more about{" "}
        <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-900">
          _____
        </span>
        ?
      </p>
      <ul className="mt-6 space-y-2">
        {slots.map((slot) => (
          <li
            key={slot}
            className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-slate-700"
          >
            <span className="text-emerald-600" aria-hidden="true">
              →
            </span>
            <span className="font-mono text-sm sm:text-base">
              Could you tell me more about {slot}?
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm leading-6 text-slate-600">
        One frame. Many real conversations. Swap the slot, keep the reflex.
      </p>
    </div>
  );
}
