import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="container px-4 md:px-6 relative z-10 flex flex-col items-center text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm shadow-sm backdrop-blur-md mb-4">
            <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2"></span>
            New collections just arrived
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
            Discover the future of <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
              premium commerce
            </span>
          </h1>
          <p className="mx-auto max-w-[700px] text-lg md:text-xl text-blue-100">
            Elevate your lifestyle with our curated collection of electronics, exquisite jewelry, and modern apparel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/products">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100 rounded-full font-bold px-8 shadow-lg shadow-white/20 transition-transform hover:scale-105">
                Shop Now
              </Button>
            </Link>
            <Link href="/products?category=electronics">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full font-bold px-8 backdrop-blur-sm transition-colors">
                Explore Electronics
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Abstract shapes */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-3xl"></div>
      </section>

      {/* Featured Categories (Static) */}
      <section className="w-full py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Featured Categories</h2>
            <p className="text-gray-500 max-w-[600px] md:text-xl">Find exactly what you are looking for.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {['Electronics', 'Jewelery', "Men's Clothing"].map((cat, i) => (
              <div key={i} className="group relative overflow-hidden rounded-2xl aspect-[4/3] bg-gray-100 shadow-md">
                <div className={`absolute inset-0 bg-gradient-to-tr ${i===0 ? 'from-blue-600 to-blue-300' : i===1 ? 'from-purple-600 to-pink-300' : 'from-emerald-600 to-teal-300'} opacity-80 mix-blend-multiply group-hover:opacity-90 transition-opacity`}></div>
                <div className="absolute inset-0 flex items-center justify-center p-6 flex-col">
                  <h3 className="text-2xl font-bold text-white mb-2">{cat}</h3>
                  <Link href={`/products?category=${cat.toLowerCase()}`}>
                    <span className="inline-flex items-center text-white/90 font-medium hover:text-white group-hover:underline underline-offset-4">
                      Browse category &rarr;
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
