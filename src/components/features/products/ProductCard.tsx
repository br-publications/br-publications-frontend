'use client';

import { Product } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAppStore((state) => state.addToCart);

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
      <Link href={`/products/${product.id}`} className="flex-grow">
        <div className="relative aspect-square overflow-hidden bg-white p-6">
          <img
            src={product.image}
            alt={product.title}
            className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
        </div>
        <CardHeader className="p-4 flex-grow">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{product.category}</p>
          <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
        </CardHeader>
      </Link>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
        <Button 
          size="icon" 
          variant="outline" 
          className="rounded-full hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            addToCart(product);
          }}
          aria-label="Add to cart"
        >
          <ShoppingCart size={18} />
        </Button>
      </CardFooter>
    </Card>
  );
}
