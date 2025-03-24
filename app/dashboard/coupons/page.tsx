"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { format, isAfter } from "date-fns"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreVertical,
  CalendarIcon,
  Tag,
  Percent,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Eye,
  Copy,
  BarChart4,
} from "lucide-react"

interface Coupon {
  id: string
  code: string
  discount_amount: number
  discount_type: "percentage" | "fixed"
  description: string | null
  expiry_date: string | null
  usage_limit: number | null
  usage_count: number
  one_time_per_user: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  coupon_usage?: CouponUsage[]
}

interface CouponUsage {
  id: string
  user_id: string
  release_id: string
  used_at: string
  profiles?: {
    username: string
    email: string
  }
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [detailedCoupon, setDetailedCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState({
    code: "",
    discount_amount: 0,
    discount_type: "fixed" as "percentage" | "fixed",
    description: "",
    expiry_date: null as Date | null,
    usage_limit: null as number | null,
    one_time_per_user: false,
    is_active: true,
  })

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkAdminStatus()
    fetchCoupons()
  }, [])

  async function checkAdminStatus() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "Authentication required",
          description: "You need to be logged in to access this page",
          variant: "destructive",
        })
        router.push("/login")
        return
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      if (profileError) throw profileError

      if (!profile?.is_admin) {
        toast({
          title: "Access denied",
          description: "You need admin privileges to access this page",
          variant: "destructive",
        })
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)
    } catch (error: any) {
      console.error("Error checking admin status:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  async function fetchCoupons() {
    try {
      setLoading(true)
      const response = await axios.get("/api/coupons")
      setCoupons(response.data.coupons)
    } catch (error: any) {
      console.error("Error fetching coupons:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch coupons",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchCouponDetails(id: string) {
    try {
      const response = await axios.get(`/api/coupons/${id}`)
      setDetailedCoupon(response.data.coupon)
    } catch (error: any) {
      console.error("Error fetching coupon details:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch coupon details",
        variant: "destructive",
      })
    }
  }

  function handleCreateCoupon() {
    setFormData({
      code: "",
      discount_amount: 0,
      discount_type: "fixed",
      description: "",
      expiry_date: null,
      usage_limit: null,
      one_time_per_user: false,
      is_active: true,
    })
    setCreateDialogOpen(true)
  }

  function handleEditCoupon(coupon: Coupon) {
    setSelectedCoupon(coupon)
    setFormData({
      code: coupon.code,
      discount_amount: coupon.discount_amount,
      discount_type: coupon.discount_type,
      description: coupon.description || "",
      expiry_date: coupon.expiry_date ? new Date(coupon.expiry_date) : null,
      usage_limit: coupon.usage_limit,
      one_time_per_user: coupon.one_time_per_user,
      is_active: coupon.is_active,
    })
    setEditDialogOpen(true)
  }

  function handleViewCoupon(coupon: Coupon) {
    setSelectedCoupon(coupon)
    fetchCouponDetails(coupon.id)
    setViewDialogOpen(true)
  }

  function handleDeleteCoupon(coupon: Coupon) {
    setSelectedCoupon(coupon)
    setDeleteDialogOpen(true)
  }

  async function createCoupon() {
    try {
      const response = await axios.post("/api/coupons", formData)
      setCoupons([response.data.coupon, ...coupons])
      setCreateDialogOpen(false)
      toast({
        title: "Success",
        description: "Coupon created successfully",
      })
    } catch (error: any) {
      console.error("Error creating coupon:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create coupon",
        variant: "destructive",
      })
    }
  }

  async function updateCoupon() {
    if (!selectedCoupon) return

    try {
      const response = await axios.put(`/api/coupons/${selectedCoupon.id}`, formData)
      setCoupons(coupons.map((coupon) => (coupon.id === selectedCoupon.id ? response.data.coupon : coupon)))
      setEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Coupon updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating coupon:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update coupon",
        variant: "destructive",
      })
    }
  }

  async function deleteCoupon() {
    if (!selectedCoupon) return

    try {
      const response = await axios.delete(`/api/coupons/${selectedCoupon.id}`)

      if (response.data.deleted) {
        setCoupons(coupons.filter((coupon) => coupon.id !== selectedCoupon.id))
        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        })
      } else if (response.data.deactivated) {
        setCoupons(
          coupons.map((coupon) => (coupon.id === selectedCoupon.id ? { ...coupon, is_active: false } : coupon)),
        )
        toast({
          title: "Coupon Deactivated",
          description: response.data.message,
        })
      }

      setDeleteDialogOpen(false)
    } catch (error: any) {
      console.error("Error deleting coupon:", error)
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete coupon",
        variant: "destructive",
      })
    }
  }

  function copyCouponCode(code: string) {
    navigator.clipboard.writeText(code)
    toast({
      title: "Copied",
      description: "Coupon code copied to clipboard",
    })
  }

  const filteredCoupons = coupons.filter((coupon) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      coupon.code.toLowerCase().includes(query) ||
      (coupon.description && coupon.description.toLowerCase().includes(query))
    )
  })

  function isCouponExpired(coupon: Coupon): boolean {
    if (!coupon.expiry_date) return false
    return isAfter(new Date(), new Date(coupon.expiry_date))
  }

  function isCouponLimitReached(coupon: Coupon): boolean {
    if (!coupon.usage_limit) return false
    return coupon.usage_count >= coupon.usage_limit
  }

  function getCouponStatus(coupon: Coupon): { status: string; color: string } {
    if (!coupon.is_active) {
      return { status: "Inactive", color: "bg-gray-500" }
    }

    if (isCouponExpired(coupon)) {
      return { status: "Expired", color: "bg-red-500" }
    }

    if (isCouponLimitReached(coupon)) {
      return { status: "Limit Reached", color: "bg-orange-500" }
    }

    return { status: "Active", color: "bg-green-500" }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
            <CardDescription className="text-center">You need admin privileges to access this page</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Coupon Management</h1>
          <p className="text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <Button onClick={handleCreateCoupon}>
          <Plus className="mr-2 h-4 w-4" /> Create Coupon
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Coupons</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search coupons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-3">Loading coupons...</span>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No coupons found</h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery ? "Try a different search term" : "Create your first coupon to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateCoupon} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" /> Create Coupon
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.map((coupon) => {
                    const { status, color } = getCouponStatus(coupon)
                    return (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{coupon.code}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyCouponCode(coupon.code)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          {coupon.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{coupon.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {coupon.discount_type === "percentage" ? (
                              <>
                                <Percent className="h-4 w-4 mr-1 text-blue-500" />
                                <span>{coupon.discount_amount}%</span>
                              </>
                            ) : (
                              <>
                                <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                                <span>R{coupon.discount_amount.toFixed(2)}</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-purple-500" />
                            <span>
                              {coupon.usage_count}
                              {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ""}
                            </span>
                          </div>
                          {coupon.one_time_per_user && (
                            <Badge variant="outline" className="mt-1">
                              One-time per user
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {coupon.expiry_date ? (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-orange-500" />
                              <span>{format(new Date(coupon.expiry_date), "MMM d, yyyy")}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No expiry</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={color}>{status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewCoupon(coupon)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCoupon(coupon)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Coupon Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>Create a new discount coupon for your customers.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                Code
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER20"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discount_type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value) => setFormData({ ...formData, discount_type: value as "percentage" | "fixed" })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount (R)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discount_amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 flex items-center">
                {formData.discount_type === "percentage" ? (
                  <div className="relative flex-1">
                    <Input
                      id="discount_amount"
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_amount: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="pr-8"
                      min={0}
                      max={100}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-muted-foreground">R</span>
                    </div>
                    <Input
                      id="discount_amount"
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_amount: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="pl-8"
                      min={0}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiry_date" className="text-right">
                Expiry Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiry_date ? format(formData.expiry_date, "PPP") : <span>No expiry date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expiry_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, expiry_date: date })}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setFormData({ ...formData, expiry_date: null })}
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="usage_limit" className="text-right">
                Usage Limit
              </Label>
              <Input
                id="usage_limit"
                type="number"
                value={formData.usage_limit === null ? "" : formData.usage_limit}
                onChange={(e) => {
                  const value = e.target.value === "" ? null : Number.parseInt(e.target.value)
                  setFormData({ ...formData, usage_limit: value })
                }}
                placeholder="No limit"
                className="col-span-3"
                min={1}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="one_time_per_user" className="text-right">
                One-time per user
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="one_time_per_user"
                  checked={formData.one_time_per_user}
                  onCheckedChange={(checked) => setFormData({ ...formData, one_time_per_user: checked })}
                />
                <Label htmlFor="one_time_per_user">{formData.one_time_per_user ? "Yes" : "No"}</Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">{formData.is_active ? "Yes" : "No"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createCoupon}>Create Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update the details of your coupon.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-code" className="text-right">
                Code
              </Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-discount_type" className="text-right">
                Type
              </Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value) => setFormData({ ...formData, discount_type: value as "percentage" | "fixed" })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount (R)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-discount_amount" className="text-right">
                Amount
              </Label>
              <div className="col-span-3 flex items-center">
                {formData.discount_type === "percentage" ? (
                  <div className="relative flex-1">
                    <Input
                      id="edit-discount_amount"
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_amount: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="pr-8"
                      min={0}
                      max={100}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-muted-foreground">R</span>
                    </div>
                    <Input
                      id="edit-discount_amount"
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_amount: Number.parseFloat(e.target.value) || 0 })
                      }
                      className="pl-8"
                      min={0}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expiry_date" className="text-right">
                Expiry Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiry_date ? format(formData.expiry_date, "PPP") : <span>No expiry date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expiry_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, expiry_date: date })}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={() => setFormData({ ...formData, expiry_date: null })}
                      >
                        Clear
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-usage_limit" className="text-right">
                Usage Limit
              </Label>
              <Input
                id="edit-usage_limit"
                type="number"
                value={formData.usage_limit === null ? "" : formData.usage_limit}
                onChange={(e) => {
                  const value = e.target.value === "" ? null : Number.parseInt(e.target.value)
                  setFormData({ ...formData, usage_limit: value })
                }}
                placeholder="No limit"
                className="col-span-3"
                min={1}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-one_time_per_user" className="text-right">
                One-time per user
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="edit-one_time_per_user"
                  checked={formData.one_time_per_user}
                  onCheckedChange={(checked) => setFormData({ ...formData, one_time_per_user: checked })}
                />
                <Label htmlFor="edit-one_time_per_user">{formData.one_time_per_user ? "Yes" : "No"}</Label>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-is_active" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="edit-is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="edit-is_active">{formData.is_active ? "Yes" : "No"}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateCoupon}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Coupon Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedCoupon && (
              <div className="bg-muted p-3 rounded-md">
                <p className="font-medium">{selectedCoupon.code}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCoupon.discount_type === "percentage"
                    ? `${selectedCoupon.discount_amount}% off`
                    : `R${selectedCoupon.discount_amount.toFixed(2)} off`}
                </p>
                {selectedCoupon.usage_count > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 mr-2" />
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        This coupon has been used {selectedCoupon.usage_count} times. It will be deactivated instead of
                        deleted.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteCoupon}>
              {selectedCoupon?.usage_count ? "Deactivate" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Coupon Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Coupon Details</DialogTitle>
            <DialogDescription>Detailed information about this coupon and its usage.</DialogDescription>
          </DialogHeader>
          {detailedCoupon ? (
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="usage">Usage History</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      {detailedCoupon.code}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1"
                        onClick={() => copyCouponCode(detailedCoupon.code)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </h3>
                    <p className="text-muted-foreground text-sm">{detailedCoupon.description || "No description"}</p>
                  </div>
                  <Badge className={getCouponStatus(detailedCoupon).color}>
                    {getCouponStatus(detailedCoupon).status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Discount</h4>
                    <p className="flex items-center">
                      {detailedCoupon.discount_type === "percentage" ? (
                        <>
                          <Percent className="h-4 w-4 mr-1 text-blue-500" />
                          <span>{detailedCoupon.discount_amount}% off</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                          <span>R{detailedCoupon.discount_amount.toFixed(2)} off</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Usage</h4>
                    <p className="flex items-center">
                      <Users className="h-4 w-4 mr-1 text-purple-500" />
                      <span>
                        {detailedCoupon.usage_count}
                        {detailedCoupon.usage_limit ? ` / ${detailedCoupon.usage_limit}` : " (unlimited)"}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Created</h4>
                    <p className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                      <span>{format(new Date(detailedCoupon.created_at), "PPP")}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Expires</h4>
                    <p className="flex items-center">
                      {detailedCoupon.expiry_date ? (
                        <>
                          <Clock className="h-4 w-4 mr-1 text-orange-500" />
                          <span>{format(new Date(detailedCoupon.expiry_date), "PPP")}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">No expiry date</span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">One-time per user</h4>
                    <p className="flex items-center">
                      {detailedCoupon.one_time_per_user ? (
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1 text-red-500" />
                      )}
                      <span>{detailedCoupon.one_time_per_user ? "Yes" : "No"}</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Active</h4>
                    <p className="flex items-center">
                      {detailedCoupon.is_active ? (
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1 text-red-500" />
                      )}
                      <span>{detailedCoupon.is_active ? "Yes" : "No"}</span>
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="usage" className="py-4">
                {detailedCoupon.coupon_usage && detailedCoupon.coupon_usage.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Release ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailedCoupon.coupon_usage.map((usage) => (
                          <TableRow key={usage.id}>
                            <TableCell>{usage.profiles?.username || usage.profiles?.email || usage.user_id}</TableCell>
                            <TableCell>{format(new Date(usage.used_at), "PPP p")}</TableCell>
                            <TableCell>
                              <span className="font-mono text-xs">{usage.release_id}</span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart4 className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="mt-4 text-lg font-medium">No usage data</h3>
                    <p className="text-muted-foreground mt-2">This coupon hasn't been used yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-3">Loading coupon details...</span>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {detailedCoupon && (
              <Button
                onClick={() => {
                  setViewDialogOpen(false)
                  handleEditCoupon(detailedCoupon)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Coupon
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

