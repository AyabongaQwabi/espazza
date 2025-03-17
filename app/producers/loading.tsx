export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="space-y-4 text-center mb-12">
          <div className="h-10 bg-zinc-800 rounded w-1/3 mx-auto animate-pulse" />
          <div className="h-6 bg-zinc-800 rounded w-2/3 mx-auto animate-pulse" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="h-12 bg-zinc-800 rounded w-full animate-pulse" />
          <div className="h-12 bg-zinc-800 rounded w-full md:w-48 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-pulse">
              <div className="p-6 flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-zinc-800" />
                <div className="space-y-3 flex-1">
                  <div className="h-6 bg-zinc-800 rounded w-3/4" />
                  <div className="h-4 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
              <div className="px-6 pb-6 space-y-3">
                <div className="h-4 bg-zinc-800 rounded w-5/6" />
                <div className="h-4 bg-zinc-800 rounded w-4/6" />
                <div className="h-10 bg-zinc-800 rounded w-full mt-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

