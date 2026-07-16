import { GenerateForm } from '@/components/GenerateForm';

export default function NewPiecePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1
        className="mb-1 text-2xl font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        New draft
      </h1>
      <p className="mb-6 text-sm text-slate-500">
        Topic in, GenHealth-voiced first draft out. The model writes inside a
        hand-built voice spec and channel template — it can only use real,
        published GenHealth numbers. You edit, then it joins the library.
      </p>
      <GenerateForm />
    </div>
  );
}
