export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-3 py-3 shadow-sm sm:px-6 sm:py-5">
        <div className="h-6 w-32 animate-pulse rounded-md bg-neutral-200 sm:h-8 sm:w-48" />
        <div className="flex gap-2 sm:gap-3">
          <div className="h-10 w-24 animate-pulse rounded-xl bg-neutral-200 sm:h-14 sm:w-40 sm:rounded-2xl" />
          <div className="h-10 w-20 animate-pulse rounded-xl bg-neutral-200 sm:h-14 sm:w-44 sm:rounded-2xl" />
        </div>
      </div>
      <main className="flex-1 p-3 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100 sm:h-80"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
