"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Facebook, Youtube, Loader2, Music } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const PRODUCERS_PER_PAGE = 9

export default function ProducersList({ initialData = [] }: { initialData?: any[] }) {
  const searchParams = useSearchParams()
  const search = searchParams.get("search") || ""
  const genre = searchParams.get("genre") || ""
  const [producers, setProducers] = useState<any[]>(initialData)
  const [loading, setLoading] = useState(initialData.length === 0)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [user, setUser] = useState<any>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  // Fetch producers with pagination
  const fetchProducers = useCallback(
    async (pageNumber: number) => {
      const start = (pageNumber - 1) * PRODUCERS_PER_PAGE
      const end = start + PRODUCERS_PER_PAGE - 1

      try {
        setLoading(true)

        let query = supabase
          .from("music_producers")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(start, end)

        if (search) {
          query = query.ilike("name", `%${search}%`)
        }

        if (genre) {
          query = query.contains("genres", [genre])
        }

        const { data: newProducers, count, error } = await query

        if (error) {
          console.error("Error fetching producers:", error)
          toast({
            title: "Error",
            description: "Failed to load producers",
            variant: "destructive",
          })
          return false
        }

        if (newProducers && newProducers.length > 0) {
          // For each producer, get the image
          const producersWithImages = await Promise.all(
            newProducers.map(async (producer) => {
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

          // If it's the first page, replace producers, otherwise append
          setProducers((prevProducers) =>
            pageNumber === 1 ? producersWithImages : [...prevProducers, ...producersWithImages],
          )

          // Check if we've reached the end
          setHasMore(start + producersWithImages.length < (count || 0))
          return true
        } else {
          if (pageNumber === 1) {
            setProducers([])
          }
          setHasMore(false)
          return false
        }
      } catch (error) {
        console.error("Error in fetchProducers:", error)
        return false
      } finally {
        setLoading(false)
      }
    },
    [supabase, search, genre],
  )

  // Check authentication
  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }

    checkAuth()
  }, [supabase])

  // Initial load
  useEffect(() => {
    // If we have initial data and no search/genre filter, don't fetch again
    if (initialData.length > 0 && !search && !genre) {
      setProducers(initialData)
      setLoading(false)
      return
    }

    fetchProducers(1)
  }, [fetchProducers, initialData, search, genre])

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1
            fetchProducers(nextPage)
            return nextPage
          })
        }
      },
      { threshold: 0.1 },
    )

    const currentLoader = loaderRef.current
    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [hasMore, loading, fetchProducers])

  if (loading && producers.length === 0) {
    return <ProducersLoading />
  }

  if (producers.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-semibold text-white mb-4">No producers found</h3>
        <p className="text-zinc-400 mb-8">
          {search
            ? `No results found for "${search}"${genre ? ` in genre "${genre}"` : ""}. Try a different search term.`
            : genre
              ? `No producers found for genre "${genre}". Try a different genre.`
              : "We don't have any producers listed yet. Check back soon!"}
        </p>
        {(search || genre) && (
          <Button asChild variant="outline">
            <Link href="/producers">View all producers</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {producers.map((producer, index) => (
          <ProducerCard key={producer.id} producer={producer} index={index} />
        ))}
      </div>

      {/* Loader element for infinite scroll */}
      <div ref={loaderRef} className="flex justify-center items-center py-8 mt-8">
        {hasMore ? (
          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
        ) : producers.length > 0 ? (
          <p className="text-zinc-400 bg-zinc-800/50 backdrop-blur-sm px-4 py-2 rounded-full">
            You've seen all producers ✨
          </p>
        ) : null}
      </div>
    </>
  )
}

function ProducerCard({ producer, index }: { producer: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className="h-full flex flex-col overflow-hidden bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4 mb-4">
            <Avatar className="h-16 w-16 rounded-full border-2 border-red-600">
              <AvatarImage src={producer.image_url || "/placeholder.svg"} alt={producer.name} />
              <AvatarFallback className="bg-zinc-800">
                <Music className="h-6 w-6 text-zinc-400" />
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-xl font-bold text-white">{producer.name}</h2>
              <div className="flex flex-wrap gap-1 mt-1">
                {producer.genres &&
                  producer.genres.slice(0, 3).map((genre: string, i: number) => (
                    <Badge key={i} variant="outline" className="bg-zinc-800 text-zinc-300 text-xs">
                      {genre}
                    </Badge>
                  ))}
                {producer.genres && producer.genres.length > 3 && (
                  <Badge variant="outline" className="bg-zinc-800 text-zinc-300 text-xs">
                    +{producer.genres.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <p className="text-zinc-400 text-sm line-clamp-3 mb-4">{producer.bio}</p>

          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <Phone className="h-4 w-4 text-zinc-500 mt-0.5 mr-2" />
              <a href={`tel:${producer.contact_number}`} className="text-zinc-300 hover:text-white">
                {producer.contact_number}
              </a>
            </div>

            {producer.email && (
              <div className="flex items-start">
                <Mail className="h-4 w-4 text-zinc-500 mt-0.5 mr-2" />
                <a href={`mailto:${producer.email}`} className="text-zinc-300 hover:text-white">
                  {producer.email}
                </a>
              </div>
            )}

            {producer.booking_rate && (
              <div className="flex items-start">
                <span className="text-zinc-300">
                  <span className="text-zinc-500">Rate:</span> {producer.booking_rate}
                </span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="px-6 pb-6 pt-0 mt-auto">
          <div className="w-full flex gap-3">
            <Button asChild className="flex-1 bg-red-600 hover:bg-red-700">
              <Link href={`/producers/${producer.id}`}>View Profile</Link>
            </Button>

            <div className="flex gap-2">
              {producer.facebook_link && (
                <Button variant="outline" size="icon" asChild className="h-9 w-9">
                  <a href={producer.facebook_link} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <Facebook className="h-4 w-4" />
                  </a>
                </Button>
              )}

              {producer.youtube_link && (
                <Button variant="outline" size="icon" asChild className="h-9 w-9">
                  <a href={producer.youtube_link} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                    <Youtube className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
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

