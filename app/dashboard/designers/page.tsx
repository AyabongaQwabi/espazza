"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { PlusIcon, Loader2, ImageIcon, Trash2Icon, FacebookIcon, InstagramIcon, LinkIcon } from "lucide-react"
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

export default function DesignersPage() {
  const [designers, setDesigners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDesigner, setSelectedDesigner] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    facebook_link: "",
    instagram_link: "",
    portfolio_link: "",
    contact_number: "",
    email: "",
    booking_rate: "",
    specialties: "",
    software_skills: "",
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
          description: "You must be logged in to manage graphic designers",
          variant: "destructive",
        })
      }
    }

    checkAuth()
    loadDesigners()
  }, [])

  async function loadDesigners() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("graphic_designers")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // For each designer, get the image
      const designersWithImages = await Promise.all(
        (data || []).map(async (designer) => {
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

      setDesigners(designersWithImages)
    } catch (error) {
      console.error("Error loading designers:", error)
      toast({
        title: "Error",
        description: "Failed to load graphic designers",
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
          description: "You must be logged in to add a graphic designer",
          variant: "destructive",
        })
        return
      }

      // Parse specialties and software skills from comma-separated string to array
      const specialtiesArray = formData.specialties
        .split(",")
        .map((specialty) => specialty.trim())
        .filter((specialty) => specialty !== "")

      const softwareSkillsArray = formData.software_skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "")

      // Insert designer data
      const { data: designerData, error } = await supabase
        .from("graphic_designers")
        .insert({
          name: formData.name,
          bio: formData.bio,
          facebook_link: formData.facebook_link,
          instagram_link: formData.instagram_link,
          portfolio_link: formData.portfolio_link,
          contact_number: formData.contact_number,
          email: formData.email,
          booking_rate: formData.booking_rate,
          specialties: specialtiesArray,
          software_skills: softwareSkillsArray,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      // Upload image if there is one
      if (image && designerData) {
        const designerId = designerData[0].id
        const fileExt = image.name.split(".").pop()
        const fileName = `profile.${fileExt}`
        const filePath = `${designerId}/${fileName}`

        // Update progress
        setUploadProgress(50)

        const { error: uploadError } = await supabase.storage.from("designer-images").upload(filePath, image)

        if (uploadError) throw uploadError

        setUploadProgress(100)
      }

      // Reset form
      setFormData({
        name: "",
        bio: "",
        facebook_link: "",
        instagram_link: "",
        portfolio_link: "",
        contact_number: "",
        email: "",
        booking_rate: "",
        specialties: "",
        software_skills: "",
      })
      setImage(null)
      setImageUrl("")
      setUploadProgress(0)
      setDialogOpen(false)

      // Reload designers
      loadDesigners()

      toast({
        title: "Success",
        description: "Graphic designer added successfully",
      })
    } catch (error) {
      console.error("Error adding graphic designer:", error)
      toast({
        title: "Error",
        description: "Failed to add graphic designer",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const viewDesigner = (designer: any) => {
    setSelectedDesigner(designer)
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
        <h1 className="text-3xl font-bold text-white mb-2">Graphic Designers</h1>
        <p className="text-zinc-400">Manage graphic designers for eSpazza</p>
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
              Add New Designer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Graphic Designer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="overflow-y-auto flex-1 pr-1">
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Designer Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter designer name"
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
                        placeholder="e.g. R500/design or Negotiable"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <Label htmlFor="instagram_link">Instagram Link</Label>
                      <Input
                        id="instagram_link"
                        name="instagram_link"
                        value={formData.instagram_link}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/username"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="portfolio_link">Portfolio Link</Label>
                      <Input
                        id="portfolio_link"
                        name="portfolio_link"
                        value={formData.portfolio_link}
                        onChange={handleInputChange}
                        placeholder="https://behance.net/username"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="specialties">Specialties</Label>
                    <Input
                      id="specialties"
                      name="specialties"
                      value={formData.specialties}
                      onChange={handleInputChange}
                      placeholder="Logo Design, Album Covers, Posters (comma separated)"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="software_skills">Software Skills</Label>
                    <Input
                      id="software_skills"
                      name="software_skills"
                      value={formData.software_skills}
                      onChange={handleInputChange}
                      placeholder="Photoshop, Illustrator, After Effects (comma separated)"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Enter designer bio and experience"
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
                              alt="Designer preview"
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
                    "Add Designer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Designers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Graphic Designers</CardTitle>
            <CardDescription>All registered graphic designers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : designers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-4">No designers added yet</p>
                <Button onClick={() => setDialogOpen(true)}>Add Your First Designer</Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Designer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Specialties</TableHead>
                      <TableHead>Links</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {designers.map((designer) => (
                      <TableRow key={designer.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-800 relative">
                              {designer.image_url ? (
                                <Image
                                  src={designer.image_url || "/placeholder.svg"}
                                  alt={designer.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full w-full text-zinc-500">
                                  <ImageIcon className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="font-medium text-white">{designer.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{designer.contact_number}</p>
                            {designer.email && <p className="text-zinc-400">{designer.email}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {designer.specialties &&
                              designer.specialties.map((specialty: string, index: number) => (
                                <Badge key={index} variant="outline" className="bg-zinc-800 text-zinc-300">
                                  {specialty}
                                </Badge>
                              ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {designer.facebook_link && (
                              <a
                                href={designer.facebook_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <FacebookIcon className="h-4 w-4" />
                              </a>
                            )}
                            {designer.instagram_link && (
                              <a
                                href={designer.instagram_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-400 hover:text-pink-300"
                              >
                                <InstagramIcon className="h-4 w-4" />
                              </a>
                            )}
                            {designer.portfolio_link && (
                              <a
                                href={designer.portfolio_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-400 hover:text-green-300"
                              >
                                <LinkIcon className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => viewDesigner(designer)}>
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px]">
                              <DialogHeader>
                                <DialogTitle>{designer.name}</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="col-span-1">
                                    <div className="aspect-square rounded-md overflow-hidden bg-zinc-800 relative">
                                      {designer.image_url ? (
                                        <Image
                                          src={designer.image_url || "/placeholder.svg"}
                                          alt={designer.name}
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
                                        <span className="text-zinc-400">Phone:</span> {designer.contact_number}
                                      </p>
                                      {designer.email && (
                                        <p className="text-sm mb-1">
                                          <span className="text-zinc-400">Email:</span> {designer.email}
                                        </p>
                                      )}
                                      {designer.booking_rate && (
                                        <p className="text-sm">
                                          <span className="text-zinc-400">Rate:</span> {designer.booking_rate}
                                        </p>
                                      )}
                                    </div>

                                    <div className="mt-4">
                                      <h3 className="font-medium mb-2">Links</h3>
                                      <div className="space-y-2">
                                        {designer.facebook_link && (
                                          <a
                                            href={designer.facebook_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-blue-400 hover:text-blue-300"
                                          >
                                            <FacebookIcon className="h-4 w-4 mr-2" />
                                            Facebook
                                          </a>
                                        )}
                                        {designer.instagram_link && (
                                          <a
                                            href={designer.instagram_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-pink-400 hover:text-pink-300"
                                          >
                                            <InstagramIcon className="h-4 w-4 mr-2" />
                                            Instagram
                                          </a>
                                        )}
                                        {designer.portfolio_link && (
                                          <a
                                            href={designer.portfolio_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-green-400 hover:text-green-300"
                                          >
                                            <LinkIcon className="h-4 w-4 mr-2" />
                                            Portfolio
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="col-span-2">
                                    <div>
                                      <h3 className="font-medium mb-2">Bio</h3>
                                      <p className="text-sm whitespace-pre-line">{designer.bio}</p>
                                    </div>

                                    <div className="mt-4">
                                      <h3 className="font-medium mb-2">Specialties</h3>
                                      <div className="flex flex-wrap gap-1">
                                        {designer.specialties &&
                                          designer.specialties.map((specialty: string, index: number) => (
                                            <Badge key={index} className="bg-zinc-800 text-zinc-300">
                                              {specialty}
                                            </Badge>
                                          ))}
                                      </div>
                                    </div>

                                    {designer.software_skills && designer.software_skills.length > 0 && (
                                      <div className="mt-4">
                                        <h3 className="font-medium mb-2">Software Skills</h3>
                                        <div className="flex flex-wrap gap-1">
                                          {designer.software_skills.map((skill: string, index: number) => (
                                            <Badge key={index} variant="outline" className="bg-zinc-800 text-zinc-300">
                                              {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
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

