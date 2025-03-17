import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import ProducersPageClient from "./producers-page-client"

export const metadata = {
  title: "Music Producers | eSpazza",
  description: "Book talented music producers for your next project",
}

export default async function ProducersPage({
  searchParams,
}: {
  searchParams: { search?: string; genre?: string }
}) {
  // Pre-fetch data for initial server render
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  let query = supabase.from("music_producers").select("*").order("created_at", { ascending: false })

  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`)
  }

  if (searchParams.genre) {
    query = query.contains("genres", [searchParams.genre])
  }

  // This data will be passed to the client component via props
  const { data: initialProducers } = await query

  // For each producer, get the image
  const producersWithImages = await Promise.all(
    (initialProducers || []).map(async (producer) => {
      const { data: imageData } = await supabase.storage.from("producer-images").list(producer.id.toString())

      let imageUrl = null
      if (imageData && imageData.length > 0) {
        imageUrl = supabase.storage.from("producer-images").getPublicUrl(`${producer.id}/${imageData[0].name}`)
          .data.publicUrl
      }

      return {
        ...producer,
        image_url: imageUrl,
      }
    }),
  )

  // Get all unique genres for filter
  const allGenres = new Set<string>()
  producersWithImages.forEach((producer) => {
    if (producer.genres && Array.isArray(producer.genres)) {
      producer.genres.forEach((genre: string) => allGenres.add(genre))
    }
  })

  return (
    <ProducersPageClient
      initialData={producersWithImages || []}
      initialSearchParams={searchParams}
      allGenres={Array.from(allGenres)}
    />
  )
}

