const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'An error occurred while fetching data');
  }

  return response.json();
}

// Ingredients
export const getIngredients = () => fetchAPI('/ingredients');
export const createIngredient = (data: { name: string; unit: string; stock: number; minStock: number }) => 
  fetchAPI('/ingredients', { method: 'POST', body: JSON.stringify(data) });

// Products
export const getProducts = () => fetchAPI('/products');
export const createProduct = (data: { name: string; price: number; category: string; recipeItems?: { ingredientId: number, quantity: number }[] }) => 
  fetchAPI('/products', { method: 'POST', body: JSON.stringify(data) });

// Orders
export const createOrder = (data: { userId: number; items: { productId: number; quantity: number }[] }) => 
  fetchAPI('/orders', { method: 'POST', body: JSON.stringify(data) });
export const getOrders = () => fetchAPI('/orders');
