import type { any } from 'next/navigation';
import { toBookNameSlug } from './stringUtils';

/**
 * Get the local path for a product detail page
 * @param id - The product ID or UID
 * @param type - Product type ('book' or 'chapter')
 * @param title - Optional product title to generate SEO slug
 */
export const getProductDetailPath = (id: number | string, type: 'book' | 'chapter', title?: string): string => {
  if (type === 'book') {
    const cleanId = typeof id === 'string' ? id.toLowerCase() : id;
    const slug = title ? `/${toBookNameSlug(title)}` : '';
    return `/book/${cleanId}${slug}`;
  }
  return `/bookchapter/${id}`;
};

/**
 * Navigate to a product detail page
 * @param id - The product ID
 * @param type - Product type ('book' or 'chapter')
 * @param navigate - React Router navigate function
 * @param productData - Optional product data to pass in state
 */
export const navigateToProduct = (
  id: number | string,
  type: 'book' | 'chapter',
  navigate: any,
  productData?: any
) => {
  const title = type === 'book' ? productData?.title : undefined;
  const path = getProductDetailPath(id, type, title);
  navigate(path, { state: { product: productData } });
};
