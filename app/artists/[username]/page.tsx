"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { FaSpotify, FaYoutube, FaInstagram, FaTwitter, FaFacebook, FaTiktok, FaWhatsapp } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"
import { Mail, Phone, Calendar, MapPin, Music, Award, ShoppingBag, Users } from "lucide-react"

const DEFAULT_IMAGE = "/placeholder.svg"

async function fetchArtist(username: string) {
  const supabase = createClientComponentClient<Database>()
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("username", username).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No results found
        return null
      }
      throw error
    }

    return data
  } catch (error) {
    console.error("Error fetching artist:", error)
    return null
  }
}

export default function ArtistPage({ params }: { params: { username: string } }) {
  const [artist, setArtist] = useState<Database["public"]["Tables"]["profiles"]["Row"] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadArtist() {
      const artistData = await fetchArtist(params.username)
      if (artistData) {
        setArtist(artistData)
      } else {
        console.log("Artist not found")
      }
      setLoading(false)
    }

    loadArtist()
  }, [params.username])

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
  }

  if (!artist) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Artist Not Found</h1>
        <p className="text-xl mb-8">We couldn't find an artist with that username.</p>
        <Link href="/artists" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Back to Artists
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-[50vh] flex items-center justify-center mt-20"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${artist.gallery_images[0]|| artist.profile_image_url || DEFAULT_IMAGE})`,
            filter: "blur(5px)",
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 text-center mt-20">
          <Image
            src={artist.profile_image_url || DEFAULT_IMAGE}
            alt={artist.artist_name}
            width={150}
            height={150}
            className="rounded-full mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold mb-2">{artist.artist_name}</h1>
          <p className="text-xl text-gray-300">{artist.tagline}</p>
          <p className="text-lg text-gray-400 mt-2">
            <Music className="inline-block mr-2" />
            {artist.genre} • <MapPin className="inline-block mr-2" />
            {artist.location}
          </p>
        </div>
      </motion.div>

      {/* About the Artist */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Award className="mr-2" />
          About the Artist
        </h2>
        <p className="text-gray-300 mb-6">{artist.artist_bio}</p>
        {artist.achievements && (
          <div>
            <h3 className="text-xl font-semibold mb-2">Achievements</h3>
            <ul className="list-disc list-inside text-gray-300">
              {artist.achievements.map((achievement, index) => (
                <li key={index}>{achievement}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Gallery */}
      {artist.gallery_images && artist.gallery_images.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {artist.gallery_images.map((image, index) => (
              <Image
                key={index}
                src={image || DEFAULT_IMAGE}
                alt={`${artist.artist_name} gallery image ${index + 1}`}
                width={300}
                height={300}
                className="rounded-lg object-cover w-full h-64"
              />
            ))}
          </div>
        </section>
      )}

      {/* Music & Media Showcase */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Music className="mr-2" />
          Music & Media
        </h2>
        {/* Featured Songs */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Featured Songs</h3>
          {/* Add your music player component here */}
        </div>
        {/* Music Videos & Performances */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Videos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artist.youtube_links?.map((link, index) => (
              <div key={index} className="aspect-w-16 aspect-h-9">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(link)}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social & Streaming Links */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-4">Follow & Listen</h2>
        <div className="flex flex-wrap gap-4">
          <SocialLink href={artist.youtube_url} icon={<FaYoutube />} label="YouTube" />
          <SocialLink href={artist.spotify_url} icon={<FaSpotify />} label="Spotify" />
          <SocialLink href={artist.instagram_url} icon={<FaInstagram />} label="Instagram" />
          <SocialLink href={artist.twitter_url} icon={<FaTwitter />} label="Twitter" />
          <SocialLink href={artist.facebook_url} icon={<FaFacebook />} label="Facebook" />
          <SocialLink href={artist.tiktok_url} icon={<FaTiktok />} label="TikTok" />
        </div>
        {artist.website && (
          <Link
            href={artist.website}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4 text-red-500 hover:text-red-400"
          >
            Visit Website
          </Link>
        )}
      </section>

      {/* Contact & Booking */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Phone className="mr-2" />
          Contact & Booking
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-2">Book This Artist</h3>
            <p className="text-gray-300 mb-4">
              Interested in booking {artist.artist_name} for an event or collaboration?
            </p>
            <div className="flex space-x-4">
              {artist.cellphone && (
                <Button
                  onClick={() => window.open(`https://wa.me/${artist.cellphone}`, "_blank")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <FaWhatsapp className="mr-2" />
                  WhatsApp
                </Button>
              )}
              {artist.email && (
                <Button
                  onClick={() => (window.location.href = `mailto:${artist.email}`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="mr-2" />
                  Email
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Fan Interaction & Engagement */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          {/* Added Lucide-react icon here */}
          <Users className="mr-2" />
          Fan Zone
        </h2>
        <Button className="mb-4">Follow Artist</Button>
        {/* Add comments/fan wall component here */}
        {artist.upcoming_events && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="mr-2" />
              Upcoming Events
            </h3>
            <ul className="space-y-2">
              {artist.upcoming_events.map((event, index) => (
                <li key={index} className="bg-zinc-900 p-4 rounded-lg">
                  <p className="font-semibold">{event.name}</p>
                  <p className="text-sm text-gray-400">
                    <Calendar className="inline-block mr-2" />
                    {event.date} • <MapPin className="inline-block mr-2" />
                    {event.location}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Merch & Store (Optional) */}
      {artist.merch && (
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <ShoppingBag className="mr-2" />
            Merch
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {artist.merch.map((item, index) => (
              <div key={index} className="bg-zinc-900 p-4 rounded-lg">
                <Image
                  src={item.image || DEFAULT_IMAGE}
                  alt={item.name}
                  width={200}
                  height={200}
                  className="w-full h-auto mb-2"
                />
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-400">{item.price}</p>
                <Button className="mt-2 w-full">Buy</Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="bg-red-600 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Support {artist.artist_name}</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-white text-red-600 hover:bg-gray-100">
              <Calendar className="mr-2" />
              Book This Artist
            </Button>
            <Button size="lg" className="bg-[#1DB954] hover:bg-[#1ed760]">
              <FaSpotify className="mr-2" />
              Listen on Spotify
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
              {/* Added Lucide-react icon here */}
              <Users className="mr-2" />
              Follow on Socials
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

function SocialLink({ href, icon, label }) {
  if (!href) return null
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function getYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

