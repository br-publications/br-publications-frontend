import type { NavigateFunction } from 'react-router-dom';

/**
 * Get the local path for a product detail page
 * @param id - The product ID
 * @param type - Product type ('book' or 'chapter')
 */
export const getProductDetailPath = (id: number | string, type: 'book' | 'chapter'): string => {
  if (type === 'book') {
    return `/book/${id}`;
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
  navigate: NavigateFunction,
  productData?: any
) => {
  const path = getProductDetailPath(id, type);
  navigate(path, { state: { product: productData } });
};
