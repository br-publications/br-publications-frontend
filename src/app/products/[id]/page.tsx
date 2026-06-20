import { api } from '@/lib/api';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ShoppingCart, Star, Truck, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  try {
    const product = await api.products.byId(p.id);
    if (!product) return { title: 'Not Found' };

    return {
      title: `${product.title}`,
      description: product.description,
      openGraph: {
        title: product.title,
        description: product.description,
        images: [{ url: product.image }],
      },
    };
  } catch (e) {
    return { title: 'Not Found' };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const p = await params;
  let product;
  try {
    product = await api.products.byId(p.id);
  } catch (e) {
    // API failed or product not found
  }

  if (!product) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link href="/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 mb-8 transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Back to products
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Product Image */}
        <div className="bg-white rounded-3xl p-8 lg:p-12 flex items-center justify-center shadow-sm border">
          <img 
            src={product.image} 
            alt={product.title}
            className="max-h-[500px] object-contain mix-blend-multiply"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-3">
            {product.category}
          </p>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            {product.title}
          </h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
              <Star className="text-yellow-400 fill-current" size={16} />
              <span className="ml-1 text-sm font-bold text-yellow-700">{product.rating.rate}</span>
            </div>
            <span className="text-sm text-gray-500 underline decoration-dotted underline-offset-4 cursor-pointer">
              {product.rating.count} reviews
            </span>
          </div>

          <p className="text-4xl font-black text-gray-900 mb-8">
            ${product.price.toFixed(2)}
          </p>

          <p className="text-gray-600 text-lg leading-relaxed mb-10 border-l-4 border-gray-200 pl-4">
            {product.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            {/* The Add to Cart functionality here would typically use a Client Component wrapper 
                for the button since we need to access Zustand state. We'll use a simple button here 
                for visual representation, but in a real app, we'd extract this to an AddToCartButton component */}
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-bold shadow-lg shadow-blue-200 transition-transform hover:scale-105">
              <ShoppingCart className="mr-2" /> Add to Cart
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-full text-gray-700">
                <Truck size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm">Free Delivery</p>
                <p className="text-xs text-gray-500">2-3 business days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-full text-gray-700">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm">2 Year Warranty</p>
                <p className="text-xs text-gray-500">Full coverage</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
