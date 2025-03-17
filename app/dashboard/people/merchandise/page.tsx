"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { PlusIcon, Loader2, ImageIcon, Trash2Icon, ExternalLinkIcon } from "lucide-react"
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

export default function MerchandisePage() {
  const [merchandisers, setMerchandisers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMerchandiser, setSelectedMerchandiser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    facebook_page: "",
    email: "",
    contact_number: "",
    description: "",
  })
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()

  // Add edit functionality to the merchandise page
  // First, add a state for the edit dialog and selected item
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Add this function to handle edit button click
  const editMerchandiser = (merchandiser: any) => {
    setSelectedMerchandiser(merchandiser)
    setFormData({
      name: merchandiser.name,
      facebook_page: merchandiser.facebook_page || "",
      email: merchandiser.email || "",
      contact_number: merchandiser.contact_number || "",
      description: merchandiser.description || "",
    })
    setImages([])
    setImageUrls(merchandiser.images || [])
    setEditDialogOpen(true)
  }

  // Add this function to handle update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      // Get current user
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update a merchandiser",
          variant: "destructive",
        })
        return
      }

      if (!selectedMerchandiser) {
        toast({
          title: "Error",
          description: "No merchandiser selected for update",
          variant: "destructive",
        })
        return
      }

      // Update merchandiser data
      const { error } = await supabase
        .from("merchandisers")
        .update({
          name: formData.name,
          facebook_page: formData.facebook_page,
          email: formData.email,
          contact_number: formData.contact_number,
          description: formData.description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedMerchandiser.id)

      if (error) throw error

      // Upload new images if there are any
      if (images.length > 0) {
        const merchandiserId = selectedMerchandiser.id

        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const fileExt = file.name.split(".").pop()
          const fileName = `${Date.now()}.${fileExt}`
          const filePath = `${merchandiserId}/${fileName}`

          // Update progress
          setUploadProgress(Math.round((i / images.length) * 100))

          const { error: uploadError } = await supabase.storage.from("merchandiser-images").upload(filePath, file)

          if (uploadError) throw uploadError
        }
      }

      // Reset form
      setFormData({
        name: "",
        facebook_page: "",
        email: "",
        contact_number: "",
        description: "",
      })
      setImages([])
      setImageUrls([])
      setUploadProgress(0)
      setEditDialogOpen(false)

      // Reload merchandisers
      loadMerchandisers()

      toast({
        title: "Success",
        description: "Merchandiser updated successfully",
      })
    } catch (error) {
      console.error("Error updating merchandiser:", error)
      toast({
        title: "Error",
        description: "Failed to update merchandiser",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

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
          description: "You must be logged in to manage merchandisers",
          variant: "destructive",
        })
      }
    }

    checkAuth()
    loadMerchandisers()
  }, [])

  async function loadMerchandisers() {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("merchandisers").select("*").order("created_at", { ascending: false })

      if (error) throw error

      // For each merchandiser, get the images
      const merchandisersWithImages = await Promise.all(
        (data || []).map(async (merchandiser) => {
          const { data: imageData } = await supabase.storage
            .from("merchandiser-images")
            .list(merchandiser.id.toString())

          const imageUrls =
            imageData?.map(
              (img) =>
                supabase.storage.from("merchandiser-images").getPublicUrl(`${merchandiser.id}/${img.name}`).data
                  .publicUrl,
            ) || []

          return {
            ...merchandiser,
            images: imageUrls,
          }
        }),
      )

      setMerchandisers(merchandisersWithImages)
    } catch (error) {
      console.error("Error loading merchandisers:", error)
      toast({
        title: "Error",
        description: "Failed to load merchandisers",
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
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)
      setImages(fileArray)

      // Create preview URLs
      const newImageUrls = fileArray.map((file) => URL.createObjectURL(file))
      setImageUrls(newImageUrls)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      // Get current user
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add a merchandiser",
          variant: "destructive",
        })
        return
      }

      // Insert merchandiser data
      const { data: merchandiserData, error } = await supabase
        .from("merchandisers")
        .insert({
          name: formData.name,
          facebook_page: formData.facebook_page,
          email: formData.email,
          contact_number: formData.contact_number,
          description: formData.description,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      // Upload images if there are any
      if (images.length > 0) {
        const merchandiserId = merchandiserData[0].id

        for (let i = 0; i < images.length; i++) {
          const file = images[i]
          const fileExt = file.name.split(".").pop()
          const fileName = `${Date.now()}.${fileExt}`
          const filePath = `${merchandiserId}/${fileName}`

          // Update progress
          setUploadProgress(Math.round((i / images.length) * 100))

          const { error: uploadError } = await supabase.storage.from("merchandiser-images").upload(filePath, file)

          if (uploadError) throw uploadError
        }
      }

      // Reset form
      setFormData({
        name: "",
        facebook_page: "",
        email: "",
        contact_number: "",
        description: "",
      })
      setImages([])
      setImageUrls([])
      setUploadProgress(0)
      setDialogOpen(false)

      // Reload merchandisers
      loadMerchandisers()

      toast({
        title: "Success",
        description: "Merchandiser added successfully",
      })
    } catch (error) {
      console.error("Error adding merchandiser:", error)
      toast({
        title: "Error",
        description: "Failed to add merchandiser",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const viewMerchandiser = (merchandiser: any) => {
    setSelectedMerchandiser(merchandiser)
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
        <h1 className="text-3xl font-bold text-white mb-2">Merchandise Sellers</h1>
        <p className="text-zinc-400">Manage merchandise sellers for eSpazza</p>
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
              Add New Merchandiser
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Add New Merchandiser</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="overflow-y-auto flex-1 pr-1">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Merchandiser Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter merchandiser name"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="facebook_page">Facebook Page</Label>
                    <Input
                      id="facebook_page"
                      name="facebook_page"
                      value={formData.facebook_page}
                      onChange={handleInputChange}
                      placeholder="https://facebook.com/page"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
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

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter description of merchandise and services"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="images">Upload Photos</Label>
                    <div className="border border-zinc-700 rounded-md p-4">
                      <Input
                        id="images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="mb-4"
                      />

                      {imageUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {imageUrls.map((url, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square relative rounded-md overflow-hidden">
                                <Image
                                  src={url || "/placeholder.svg"}
                                  alt={`Preview ${index}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2Icon className="h-4 w-4 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {images.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-zinc-400 py-8">
                          <ImageIcon className="h-12 w-12 mb-2" />
                          <p>No images selected</p>
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
                    "Add Merchandiser"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Merchandiser</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="flex flex-col h-full">
              <div className="overflow-y-auto flex-1 pr-1">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Merchandiser Name</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter merchandiser name"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-facebook_page">Facebook Page</Label>
                    <Input
                      id="edit-facebook_page"
                      name="facebook_page"
                      value={formData.facebook_page}
                      onChange={handleInputChange}
                      placeholder="https://facebook.com/page"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-email">Email Address</Label>
                    <Input
                      id="edit-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-contact_number">Contact Number</Label>
                    <Input
                      id="edit-contact_number"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      placeholder="Enter contact number"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter description of merchandise and services"
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-images">Upload Additional Photos</Label>
                    <div className="border border-zinc-700 rounded-md p-4">
                      <Input
                        id="edit-images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="mb-4"
                      />

                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {/* Show existing images */}
                        {imageUrls.map((url, index) => (
                          <div key={`existing-${index}`} className="relative group">
                            <div className="aspect-square relative rounded-md overflow-hidden">
                              <Image
                                src={url || "/placeholder.svg"}
                                alt={`Preview ${index}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs text-white px-1">Existing</span>
                            </div>
                          </div>
                        ))}

                        {/* Show new images */}
                        {images.map((_, index) => (
                          <div key={`new-${index}`} className="relative group">
                            <div className="aspect-square relative rounded-md overflow-hidden">
                              <Image
                                src={URL.createObjectURL(images[index]) || "/placeholder.svg"}
                                alt={`New Preview ${index}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2Icon className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {images.length === 0 && imageUrls.length === 0 && (
                        <div className="flex flex-col items-center justify-center text-zinc-400 py-8">
                          <ImageIcon className="h-12 w-12 mb-2" />
                          <p>No images selected</p>
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
                    "Update Merchandiser"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Merchandisers List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Merchandise Sellers</CardTitle>
            <CardDescription>All registered merchandise sellers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              </div>
            ) : merchandisers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-400 mb-4">No merchandisers added yet</p>
                <Button onClick={() => setDialogOpen(true)}>Add Your First Merchandiser</Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Facebook</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {merchandisers.map((merchandiser) => (
                      <TableRow key={merchandiser.id}>
                        <TableCell className="font-medium text-white">{merchandiser.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{merchandiser.email}</p>
                            <p className="text-zinc-400">{merchandiser.contact_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {merchandiser.facebook_page ? (
                            <a
                              href={merchandiser.facebook_page}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-400 hover:text-blue-300"
                            >
                              <ExternalLinkIcon className="h-4 w-4 mr-1" />
                              Visit Page
                            </a>
                          ) : (
                            <span className="text-zinc-500">Not provided</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(merchandiser.created_at).toLocaleDateString("en-ZA")}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => viewMerchandiser(merchandiser)}>
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>{merchandiser.name}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h3 className="font-medium mb-2">Contact Information</h3>
                                      <p className="text-sm mb-1">
                                        <span className="text-zinc-400">Email:</span> {merchandiser.email}
                                      </p>
                                      <p className="text-sm mb-1">
                                        <span className="text-zinc-400">Phone:</span> {merchandiser.contact_number}
                                      </p>
                                      {merchandiser.facebook_page && (
                                        <p className="text-sm">
                                          <span className="text-zinc-400">Facebook:</span>{" "}
                                          <a
                                            href={merchandiser.facebook_page}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300"
                                          >
                                            {merchandiser.facebook_page}
                                          </a>
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <h3 className="font-medium mb-2">Description</h3>
                                      <p className="text-sm whitespace-pre-line">{merchandiser.description}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <h3 className="font-medium mb-2">Photos</h3>
                                    {merchandiser.images && merchandiser.images.length > 0 ? (
                                      <div className="grid grid-cols-3 gap-2">
                                        {merchandiser.images.map((url: string, index: number) => (
                                          <div
                                            key={index}
                                            className="aspect-square relative rounded-md overflow-hidden"
                                          >
                                            <Image
                                              src={url || "/placeholder.svg"}
                                              alt={`${merchandiser.name} product ${index + 1}`}
                                              fill
                                              className="object-cover"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-zinc-400 text-sm">No photos available</p>
                                    )}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button variant="secondary" size="sm" onClick={() => editMerchandiser(merchandiser)}>
                              Edit
                            </Button>
                          </div>
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

