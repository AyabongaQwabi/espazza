"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import ProducersList from "./producers-list"
import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Producer {
  id: string
  name: string
  genres: string[]
  created_at: string
  image_url: string | null
}

interface ProducersPageClientProps {
  initialData: Producer[]
  initialSearchParams: { search?: string; genre?: string }
  allGenres: string[]
}

function ProducersLoading() {
  return (
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
  )
}

export default function ProducersPageClient({ initialData, initialSearchParams, allGenres }: ProducersPageClientProps) {
  const [searchParams, setSearchParams] = useState(initialSearchParams)

  useEffect(() => {
    setSearchParams(initialSearchParams)
  }, [initialSearchParams])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="space-y-4 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Music Producers</h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">Book talented music producers for your next project</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
            <form>
              <Input
                name="search"
                placeholder="Search producers..."
                className="pl-10 bg-zinc-900 border-zinc-800 h-12"
                defaultValue={searchParams.search || ""}
              />
              {searchParams.genre && <input type="hidden" name="genre" value={searchParams.genre} />}
            </form>
          </div>

          <div className="w-full md:w-48">
            <form>
              {searchParams.search && <input type="hidden" name="search" value={searchParams.search} />}
              <select
                name="genre"
                className="w-full h-12 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white"
                defaultValue={searchParams.genre || ""}
                onChange={(e) => {
                  if (e.target.form) e.target.form.submit()
                }}
              >
                <option value="">All Genres</option>
                {Array.from(allGenres)
                  .sort()
                  .map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
              </select>
            </form>
          </div>
        </div>

        <Suspense fallback={<ProducersLoading />}>
          <ProducersList initialData={initialData || []} />
        </Suspense>
      </div>
    </div>
  )
}

