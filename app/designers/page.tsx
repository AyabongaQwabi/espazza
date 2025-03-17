import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import DesignersPageClient from "./designers-page-client"

export const metadata = {
  title: "Graphic Designers | eSpazza",
  description: "Book talented graphic designers for your next project",
}

export default async function DesignersPage({
  searchParams,
}: {
  searchParams: { search?: string; specialty?: string }
}) {
  // Pre-fetch data for initial server render
  const cookieStore = cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  let query = supabase.from("graphic_designers").select("*").order("created_at", { ascending: false })

  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`)
  }

  if (searchParams.specialty) {
    query = query.contains("specialties", [searchParams.specialty])
  }

  // This data will be passed to the client component via props
  const { data: initialDesigners } = await query

  // For each designer, get the image
  const designersWithImages = await Promise.all(
    (initialDesigners || []).map(async (designer) => {
      const { data: imageData } = await supabase.storage.from("designer-images").list(designer.id.toString())

      let imageUrl = null
      if (imageData && imageData.length > 0) {
        imageUrl = supabase.storage.from("designer-images").getPublicUrl(`${designer.id}/${imageData[0].name}`)
          .data.publicUrl
      }

      return {
        ...designer,
        image_url: imageUrl,
      }
    }),
  )

  // Get all unique specialties for filter
  const allSpecialties = new Set<string>()
  designersWithImages.forEach((designer) => {
    if (designer.specialties && Array.isArray(designer.specialties)) {
      designer.specialties.forEach((specialty: string) => allSpecialties.add(specialty))
    }
  })

  return (
    <DesignersPageClient
      initialData={designersWithImages || []}
      initialSearchParams={searchParams}
      allSpecialties={Array.from(allSpecialties)}
    />
  )
}

