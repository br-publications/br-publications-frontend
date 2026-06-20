import { Metadata } from 'next';
import ProductList from '@/components/features/products/ProductList';

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse our full catalogue of premium products.',
  openGraph: {
    title: 'All Products | Nova Store',
    description: 'Browse our full catalogue of premium products.',
  },
};

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Our Collection</h1>
        <p className="text-gray-500 max-w-[600px] text-lg">
          Discover premium products crafted for excellence. Use the filters below to find exactly what you need.
        </p>
      </div>
      
      {/* We render the Client Component here so it handles the fetching and filtering */}
      <ProductList initialCategory="all" />
    </div>
  );
}
