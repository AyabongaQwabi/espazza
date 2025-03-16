import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h2 className="text-3xl font-bold text-white mb-4">Merchandiser Not Found</h2>
      <p className="text-zinc-400 mb-8 max-w-md mx-auto">
        We couldn't find the merchandiser you're looking for. They may have been removed or the URL might be incorrect.
      </p>
      <Button asChild>
        <Link href="/merchandisers">Browse All Merchandisers</Link>
      </Button>
    </div>
  )
}

