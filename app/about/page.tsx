import { MusicIcon, HeartIcon, UsersIcon, BanknoteIcon } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80")',
          }}
        >
          <div className="absolute inset-0 bg-black/70" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Malunga Nathi
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Siyinxalenye yeXhosa Hip Hop - We are part of Xhosa Hip Hop
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        {/* Mission Statement */}
        <div className="text-center mb-20">
          <div className="flex justify-center mb-6">
            <MusicIcon className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-6">
            Injongo Yethu (Our Mission)
          </h2>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            XHAP yiplatform eyilwe yiXhosa Hip Hop Organisation ukuvula amathuba kubarhapi abasebenzisa isiXhosa. 
            Injongo yethu kukusasaza umculo weXhosa Hip Hop kwihlabathi lonke, sinika abaculi bethu ithuba 
            lokwabelana ngemisebenzi yabo simahla okanye bayithengise.
          </p>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto mt-4">
            XHAP is a platform created by the Xhosa Hip Hop Organisation to create opportunities for Xhosa-language rappers. 
            Our mission is to spread Xhosa Hip Hop music globally, giving our artists a platform to share their work 
            freely or monetize their talent.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-12 mb-20">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <UsersIcon className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Yiba yiNxalenye
            </h3>
            <p className="text-gray-400">
              Create your artist profile and join our growing community of Xhosa Hip Hop artists.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <MusicIcon className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Layisha Umculo
            </h3>
            <p className="text-gray-400">
              Upload and share your music with our community and reach new audiences.
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <BanknoteIcon className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              Yenza Imali
            </h3>
            <p className="text-gray-400">
              Choose to monetize your music while maintaining full control of your work.
            </p>
          </div>
        </div>

        {/* Community Impact */}
        <div className="bg-zinc-900 rounded-2xl p-8 md:p-12">
          <div className="flex justify-center mb-8">
            <HeartIcon className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-6">
            Impembelelo Kuluntu (Community Impact)
          </h2>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-gray-300 mb-4">
              Siyakholelwa ukuba iXhosa Hip Hop inakho ukuba yindlela yokuxhobisa ulutsha, 
              ukugcina inkcubeko yethu iphila, kwaye sidale amathuba emisebenzi kubaculi bethu.
            </p>
            <p className="text-gray-400">
              We believe Xhosa Hip Hop can be a tool for youth empowerment, cultural preservation, 
              and creating economic opportunities for our artists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}