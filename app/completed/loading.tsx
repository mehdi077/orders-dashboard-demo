export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-950 px-3 py-3 shadow-xl sm:px-6 sm:py-5">
        <div className="h-6 w-40 animate-pulse rounded-md bg-slate-700 sm:h-8 sm:w-56" />
        <div className="h-10 w-20 animate-pulse rounded-xl bg-slate-700 sm:h-14 sm:w-44 sm:rounded-2xl" />
      </div>
      <main className="flex-1 p-3 sm:p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-slate-700 bg-slate-800 sm:h-56"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
