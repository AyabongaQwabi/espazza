import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Facebook, Youtube, ArrowLeft, Music } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SITE_NAME, SITE_URL, PUBLISHER_LD } from "@/lib/seo"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: producer } = await supabase
    .from("music_producers")
    .select("name, bio, genres, email")
    .eq("id", params.id)
    .single()

  if (!producer) return { title: `Producer Not Found | ${SITE_NAME}` }

  const description =
    producer.bio?.substring(0, 160) ||
    `${producer.name} is a South African music producer available for beats and collaborations on ${SITE_NAME}.`
  const url = `${SITE_URL}/producers/${params.id}`

  return {
    title: `${producer.name} | South African Music Producer | ${SITE_NAME}`,
    description,
    keywords: [
      producer.name,
      `${producer.name} beats`,
      `${producer.name} producer`,
      "South African music producer",
      "SA hip hop producer",
      "Xhosa hip hop producer",
      "SA beat maker",
      ...(producer.genres || []),
    ],
    openGraph: {
      title: `${producer.name} | ${SITE_NAME}`,
      description,
      type: "profile",
      url,
      siteName: SITE_NAME,
      locale: "en_ZA",
    },
    twitter: {
      card: "summary",
      title: `${producer.name} | ${SITE_NAME}`,
      description,
      site: "@espazza",
    },
    alternates: { canonical: url },
    robots: { index: true, follow: true, "max-snippet": -1 },
  }
}

export default async function ProducerPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  const { data: producer } = await supabase.from("music_producers").select("*").eq("id", params.id).single()

  if (!producer) {
    notFound()
  }

  // Get producer image
  const { data: imageData } = await supabase.storage.from("producer-images").list(producer.id.toString())

  let imageUrl = null
  if (imageData && imageData.length > 0) {
    imageUrl = supabase.storage.from("producer-images").getPublicUrl(`${producer.id}/${imageData[0].name}`)
      .data.publicUrl
  }

  // Extract YouTube video ID if available
  const getYoutubeVideoId = (url: string) => {
    if (!url) return null

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    return match && match[2].length === 11 ? match[2] : null
  }

  const youtubeVideoId = producer.youtube_link ? getYoutubeVideoId(producer.youtube_link) : null
  const url = `${SITE_URL}/producers/${params.id}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: producer.name,
    url,
    image: imageUrl || `${SITE_URL}/logo.png`,
    description:
      producer.bio ||
      `${producer.name} is a South African music producer available for beats and collaborations on ${SITE_NAME}.`,
    jobTitle: "Music Producer",
    knowsAbout: ["Music Production", "South African Hip Hop", "Xhosa Hip Hop", ...(producer.genres || [])],
    email: producer.email || undefined,
    sameAs: [
      producer.facebook_link,
      producer.youtube_link,
    ].filter(Boolean),
    worksFor: PUBLISHER_LD,
    address: {
      "@type": "PostalAddress",
      addressCountry: "ZA",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/producers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all producers
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar with producer info */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4 border-2 border-red-600">
                <AvatarImage src={imageUrl || "/placeholder.svg"} alt={producer.name} />
                <AvatarFallback className="bg-zinc-800">
                  <Music className="h-12 w-12 text-zinc-400" />
                </AvatarFallback>
              </Avatar>

              <h1 className="text-2xl font-bold text-white mb-2">{producer.name}</h1>

              <div className="flex flex-wrap justify-center gap-1 mb-4">
                {producer.genres &&
                  producer.genres.map((genre: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-zinc-800 text-zinc-300">
                      {genre}
                    </Badge>
                  ))}
              </div>

              <div className="space-y-3 text-left mt-6">
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-zinc-400 text-sm">Phone</p>
                    <a href={`tel:${producer.contact_number}`} className="text-white hover:text-red-400">
                      {producer.contact_number}
                    </a>
                  </div>
                </div>

                {producer.email && (
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-zinc-400 text-sm">Email</p>
                      <a href={`mailto:${producer.email}`} className="text-white hover:text-red-400">
                        {producer.email}
                      </a>
                    </div>
                  </div>
                )}

                {producer.booking_rate && (
                  <div className="flex items-start">
                    <div className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex items-center justify-center">
                      <span className="text-lg font-bold">R</span>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm">Booking Rate</p>
                      <p className="text-white">{producer.booking_rate}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center space-x-3 mt-6">
                {producer.facebook_link && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={producer.facebook_link} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {producer.youtube_link && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={producer.youtube_link} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                      <Youtube className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              <Button className="w-full mt-6 bg-red-600 hover:bg-red-700">Book This Producer</Button>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">About</h2>
              <div className="text-zinc-400 whitespace-pre-line">{producer.bio}</div>
            </div>

            {youtubeVideoId && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Featured Work</h2>
                <div className="aspect-video rounded-md overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                    title={`${producer.name} - Featured Work`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Booking Information</h2>
              <p className="text-zinc-400 mb-4">
                To book {producer.name} for your project, you can contact them directly using the information provided
                or use the booking button.
              </p>
              <div className="bg-zinc-800 rounded-lg p-4 text-zinc-300">
                <p className="mb-2">
                  <span className="font-semibold">Availability:</span> Contact for details
                </p>
                {producer.booking_rate && (
                  <p className="mb-2">
                    <span className="font-semibold">Rate:</span> {producer.booking_rate}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Genres:</span> {producer.genres?.join(", ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

