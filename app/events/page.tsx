import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Hero Section */}
      <div className="relative h-[40vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80")',
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Iziganeko
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Upcoming Xhosa Hip Hop Events
          </p>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="space-y-8">
          {[
            {
              title: "Xhap Festival 2025",
              date: "June 16, 2025",
              location: "eKapa (Cape Town)",
              image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80",
              description: "The biggest Xhosa Hip Hop festival featuring top artists from across the country."
            },
            {
              title: "Rap Battle Championship",
              date: "July 1, 2025",
              location: "eMonti (East London)",
              image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80",
              description: "Annual rap battle competition showcasing the best freestyle talent in Xhosa Hip Hop."
            },
            {
              title: "Hip Hop Workshop",
              date: "August 15, 2025",
              location: "eBhayi (Port Elizabeth)",
              image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80",
              description: "Learn from industry professionals about music production, writing, and performance."
            }
          ].map((event, index) => (
            <div 
              key={index}
              className="bg-zinc-900 rounded-lg overflow-hidden flex flex-col md:flex-row"
            >
              <div 
                className="h-48 md:h-auto md:w-64 flex-shrink-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${event.image})` }}
              />
              <div className="p-6 flex-grow">
                <h2 className="text-2xl font-bold text-white mb-2">{event.title}</h2>
                <div className="flex items-center text-red-500 mb-4">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <span>{event.date} • {event.location}</span>
                </div>
                <p className="text-gray-400 mb-6">{event.description}</p>
                <Button>
                  Bhalisela (Register)
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Host Event CTA */}
        <div className="mt-20 text-center">
          <div className="inline-block p-8 bg-zinc-900 rounded-2xl">
            <CalendarIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              Unesiganeko?
            </h2>
            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
              Are you hosting a Xhosa Hip Hop event? List it on our platform to reach more people.
            </p>
            <Button asChild>
              <Link href="/contact">
                Qhagamshelana Nathi
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}