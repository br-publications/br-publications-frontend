'use client';

import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { ShoppingCart, User, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const cartTotalItems = useAppStore((state) => 
    state.cart.reduce((total, item) => total + item.quantity, 0)
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md support-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-2xl font-black tracking-tighter text-blue-600">
            NOVA
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="/products" className="transition-colors hover:text-blue-600">
              Explore
            </Link>
            <Link href="/products?category=electronics" className="transition-colors hover:text-blue-600">
              Electronics
            </Link>
            <Link href="/products?category=jewelery" className="transition-colors hover:text-blue-600">
              Jewelry
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-blue-600 transition-colors">
            <User size={18} />
            <span>Account</span>
          </Link>
          <div className="relative cursor-pointer hover:text-blue-600 transition-colors flex items-center">
            <ShoppingCart size={24} />
            {cartTotalItems > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                {cartTotalItems}
              </span>
            )}
          </div>
          <button 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <nav className="flex flex-col p-4 gap-4 text-sm font-medium">
            <Link href="/products" onClick={() => setIsMobileMenuOpen(false)}>Explore</Link>
            <Link href="/products?category=electronics" onClick={() => setIsMobileMenuOpen(false)}>Electronics</Link>
            <Link href="/products?category=jewelery" onClick={() => setIsMobileMenuOpen(false)}>Jewelry</Link>
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 text-blue-600">
              <User size={18} /> Account
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
