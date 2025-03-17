"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { PlusIcon, Loader2, ImageIcon, Trash2Icon, YoutubeIcon, FacebookIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

export default function ProducersPage() {
  const [producers, setProducers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProducer, setSelectedProducer] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    facebook_link: "",
    youtube_link: "",
    contact_number: "",
    email: "",
    booking_rate: "",
    genres: "",
  })
  const [image, setImage] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check authentication
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to manage producers",
          variant: "destructive",
        })
      }
    }

    checkAuth()
    loadProducers()
  }, [])

  async function loadProducers() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("music_producers")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // For each producer, get the image
      const producersWithImages = await Promise.all(
        (data || []).map(async (producer) => {
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

      setProducers(producersWithImages)
    } catch (error) {
      console.error("Error loading producers:", error)
      toast({
        title: "Error",
        description: "Failed to load producers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage(file)
      setImageUrl(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImage(null)
    setImageUrl("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      // Get current user
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add a producer",
          variant: "destructive",
        })
        return
      }

      // Parse genres from comma-separated string to array
      const genresArray = formData.genres
        .split(",")
        .map((genre) => genre.trim())
        .filter((genre) => genre !== "")

      // Insert producer data
      const { data: producerData, error } = await supabase
        .from("music_producers")
        .insert({
          name: formData.name,
          bio: formData.bio,
          facebook_link: formData.facebook_link,
          youtube_link: formData.youtube_link,
          contact_number: formData.contact_number,
          email: formData.email,
          booking_rate: formData.booking_rate,
          genres: genresArray,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      // Upload image if there is one
      if (image && producerData) {
        const producerId = producerData[0].id
        const fileExt = image.name.split(".").pop()
        const fileName = `profile.${fileExt}`
        const filePath = `${producerId}/${fileName}`

        // Update progress
        setUploadProgress(50)

        const { error: uploadError } = await supabase.storage.from("producer-images").upload(filePath, image)

        if (uploadError) throw uploadError

        setUploadProgress(100)
      }

      // Reset form
      setFormData({
        name: "",
        bio: "",
        facebook_link: "",
        youtube_link: "",
        contact_number: "",
        email: "",
        booking_rate: "",
        genres: "",
      })
      setImage(null)
      setImageUrl("")
      setUploadProgress(0)
      setDialogOpen(false)

      // Reload producers
      loadProducers()

      toast({
        title: "Success",
        description: "Producer added successfully",
      })
    } catch (error) {
      console.error("Error adding producer:", error)
      toast({
        title: "Error",
        description: "Failed to add producer",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const viewProducer = (producer: any) => {
    setSelectedProducer(producer)
  }

  return (
    <div className="p-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Music Producers</h1>
        <p className="text-zinc-400">Manage music producers for eSpazza</p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add New Producer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Music Producer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="overflow-y-auto flex-1 pr-1">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Producer Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter producer name"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="contact_number">Contact Number</Label>
                      <Input
                        id="contact_number"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleInputChange}
                        placeholder="Enter contact number"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="booking_rate">Booking Rate</Label>
                      <Input
                        id="booking_rate"
                        name="booking_rate"
                        value={formData.booking_rate}
                        onChange={handleInputChange}
                        placeholder="e.g. R500/hour or Negotiable"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="facebook_link">Facebook Link</Label>
                      <Input
                        id="facebook_link"
                        name="facebook_link"
                        value={formData.facebook_link}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/profile"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="youtube_link">YouTube Link</Label>
                      <Input
                        id="youtube_link"
                        name="youtube_link"
                        value={formData.youtube_link}
                        onChange={handleInputChange}
                        placeholder="https://youtube.com/channel"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="genres">Genres</Label>
                    <Input
                      id="genres"
                      name="genres"
                      value={formData.genres}
                      onChange={handleInputChange}
                      placeholder="Hip Hop, Trap, Afrobeats (comma separated)"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Enter producer bio and experience"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="image">Profile Image</Label>
                    <div className="border border-zinc-700 rounded-md p-4">
                      <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="mb-4" />

                      {imageUrl && (
                        <div className="relative group">
                          <div className="aspect-square w-40 h-40 relative rounded-md overflow-hidden mx-auto">
                            <Image
                              src={imageUrl || "/placeholder.svg"}
                              alt="Producer preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-1 right-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2Icon className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      )}

                      {!imageUrl && (
                        <div className="flex flex-col items-center justify-center text-zinc-400 py-8">
                          <ImageIcon className="h-12 w-12 mb-2" />
                          <p>No image selected</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="sticky bottom-0 bg-background pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : "Saving..."}
                    </>
                  ) : (
                    "Add Producer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Producers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Music Producers</CardTitle>
            <CardDescription>All registered music producers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : producers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-4">No producers added yet</p>
                <Button onClick={() => setDialogOpen(true)}>Add Your First Producer</Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Genres</TableHead>
                      <TableHead>Links</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {producers.map((producer) => (
                      <TableRow key={producer.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-800 relative">
                              {producer.image_url ? (
                                <Image
                                  src={producer.image_url || "/placeholder.svg"}
                                  alt={producer.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full text-zinc-500">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="font-medium text-white">{producer.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{producer.contact_number}</p>
                            {producer.email && <p className="text-zinc-400">{producer.email}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {producer.genres &&
                              producer.genres.map((genre: string, index: number) => (
                                <Badge key={index} variant="outline" className="bg-zinc-800 text-zinc-300">
                                  {genre}
                                </Badge>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {producer.facebook_link && (
                              <a
                                href={producer.facebook_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <FacebookIcon className="h-4 w-4" />
                              </a>
                            )}
                            {producer.youtube_link && (
                              <a
                                href={producer.youtube_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-400 hover:text-red-300"
                              >
                                <YoutubeIcon className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => viewProducer(producer)}>
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px]">
                              <DialogHeader>
                                <DialogTitle>{producer.name}</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="col-span-1">
                                    <div className="aspect-square rounded-md overflow-hidden bg-zinc-800 relative">
                                      {producer.image_url ? (
                                        <Image
                                          src={producer.image_url || "/placeholder.svg"}
                                          alt={producer.name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <div className="flex items-center justify-center h-full w-full text-zinc-500">
                                          <ImageIcon className="h-10 w-10" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="mt-4 space-y-2">
                                      <h3 className="font-medium mb-2">Contact Information</h3>
                                      <p className="text-sm mb-1">
                                        <span className="text-zinc-400">Phone:</span> {producer.contact_number}
                                      </p>
                                      {producer.email && (
                                        <p className="text-sm mb-1">
                                          <span className="text-zinc-400">Email:</span> {producer.email}
                                        </p>
                                      )}
                                      {producer.booking_rate && (
                                        <p className="text-sm">
                                          <span className="text-zinc-400">Rate:</span> {producer.booking_rate}
                                        </p>
                                      )}
                                    </div>

                                    <div className="mt-4">
                                      <h3 className="font-medium mb-2">Links</h3>
                                      <div className="space-y-2">
                                        {producer.facebook_link && (
                                          <a
                                            href={producer.facebook_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-blue-400 hover:text-blue-300"
                                          >
                                            <FacebookIcon className="h-4 w-4 mr-2" />
                                            Facebook
                                          </a>
                                        )}
                                        {producer.youtube_link && (
                                          <a
                                            href={producer.youtube_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-red-400 hover:text-red-300"
                                          >
                                            <YoutubeIcon className="h-4 w-4 mr-2" />
                                            YouTube
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-span-2">
                                    <div>
                                      <h3 className="font-medium mb-2">Bio</h3>
                                      <p className="text-sm whitespace-pre-line">{producer.bio}</p>
                                    </div>

                                    <div className="mt-4">
                                      <h3 className="font-medium mb-2">Genres</h3>
                                      <div className="flex flex-wrap gap-1">
                                        {producer.genres &&
                                          producer.genres.map((genre: string, index: number) => (
                                            <Badge key={index} className="bg-zinc-800 text-zinc-300">
                                              {genre}
                                            </Badge>
                                          ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

