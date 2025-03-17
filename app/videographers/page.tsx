import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import VideographersPageClient from "./videographers-page-client"

export const metadata = {
  title: "Videographers | eSpazza",
  description: "Book talented videographers for your next project",
}

export default async function VideographersPage({
  searchParams,
}: {
  searchParams: { search?: string; specialty?: string }
}) {
  // Pre-fetch data for initial server render
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  let query = supabase.from("videographers").select("*").order("created_at", { ascending: false })

  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`)
  }

  if (searchParams.specialty) {
    query = query.contains("specialties", [searchParams.specialty])
  }

  // This data will be passed to the client component via props
  const { data: initialVideographers } = await query

  // For each videographer, get the image
  const videographersWithImages = await Promise.all(
    (initialVideographers || []).map(async (videographer) => {
      const { data: imageData } = await supabase.storage.from("videographer-images").list(videographer.id.toString())

      let imageUrl = null
      if (imageData && imageData.length > 0) {
        imageUrl = supabase.storage.from("videographer-images").getPublicUrl(`${videographer.id}/${imageData[0].name}`)
          .data.publicUrl
      }

      return {
        ...videographer,
        image_url: imageUrl,
      }
    }),
  )

  // Get all unique specialties for filter
  const allSpecialties = new Set<string>()
  videographersWithImages.forEach((videographer) => {
    if (videographer.specialties && Array.isArray(videographer.specialties)) {
      videographer.specialties.forEach((specialty: string) => allSpecialties.add(specialty))
    }
  })

  return (
    <VideographersPageClient
      initialData={videographersWithImages || []}
      initialSearchParams={searchParams}
      allSpecialties={Array.from(allSpecialties)}
    />
  )
}

