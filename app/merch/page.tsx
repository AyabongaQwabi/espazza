import { Suspense } from "react"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import MerchandisersList from "./merchandisers-list"
import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

export const metadata = {
  title: "Merchandisers | eSpazza",
  description: "Discover merchandise sellers for Xhosa hip hop culture",
}

export default async function MerchandisersPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  // Pre-fetch data for initial server render
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  let query = supabase.from("merchandisers").select("*").order("created_at", { ascending: false })

  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`)
  }

  // This data will be passed to the client component via props
  const { data: initialMerchandisers } = await query

  // For each merchandiser, get the images
  const merchandisersWithImages = await Promise.all(
    (initialMerchandisers || []).map(async (merchandiser) => {
      const { data: imageData } = await supabase.storage.from("merchandiser-images").list(merchandiser.id.toString())

      const imageUrls =
        imageData?.map(
          (img) =>
            supabase.storage.from("merchandiser-images").getPublicUrl(`${merchandiser.id}/${img.name}`).data.publicUrl,
        ) || []

      return {
        ...merchandiser,
        images: imageUrls,
      }
    }),
  )

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="space-y-4 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">Our Merchandisers</h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Discover authentic merchandise from talented creators supporting Xhosa hip hop culture
          </p>
        </div>

        <div className="relative mb-8 max-w-md mx-auto">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
          <form>
            <Input
              name="search"
              placeholder="Search merchandisers..."
              className="pl-10 bg-zinc-900 border-zinc-800 h-12"
              defaultValue={searchParams.search || ""}
            />
          </form>
        </div>

        <Suspense fallback={<MerchandisersLoading />}>
          <MerchandisersList initialData={merchandisersWithImages || []} />
        </Suspense>
      </div>
    </div>
  )
}

function MerchandisersLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-zinc-800" />
          <div className="p-6 space-y-3">
            <div className="h-6 bg-zinc-800 rounded w-3/4" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
            <div className="h-4 bg-zinc-800 rounded w-5/6" />
            <div className="h-4 bg-zinc-800 rounded w-4/6" />
            <div className="h-10 bg-zinc-800 rounded w-full mt-6" />
          </div>
        </div>
      ))}
    </div>
  )
}

