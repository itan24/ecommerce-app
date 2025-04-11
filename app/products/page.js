'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        setProducts(res.data);
      } catch (err) {
        setError(err.response?.data || 'Failed to fetch products.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (productId) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      await axios.delete(`/api/products/${productId}`, {
        headers: { Authorization: token }
      });
      setProducts(products.filter(p => p._id !== productId));
    } catch (err) {
      alert(err.response?.data || 'Failed to delete product.');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md text-center">
      <p className="text-red-600 dark:text-red-400">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Our Products</h2>
        <Link href="/add-product" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors">
          Add New Product
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No products available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product._id} className="border rounded-lg shadow-lg overflow-hidden bg-white dark:bg-gray-800 hover:shadow-xl transition-shadow">
              <Link href={`/products/${product._id}`} className="block">
                <div className="relative h-64 w-full"> {/* Increased from h-48 to h-64 */}
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images.find(img => img.isProminent)?.url || product.images[0].url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-white">{product.name}</h3> {/* Reduced from text-xl to text-lg */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"> {/* Reduced to text-sm */}
                    <span className="font-medium">Price:</span> ${product.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2"> {/* Reduced to text-sm */}
                    <span className="font-medium">Stock:</span> {product.stock}
                  </p>
                </div>
              </Link>
              <div className="p-4 flex space-x-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToCart(product._id);
                  }}
                  disabled={product.stock === 0}
                  className={`flex-1 py-2 rounded-lg transition-colors text-sm ${
                    product.stock === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteProduct(product._id);
                  }}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
              {cart[product._id] > 0 && (
                <p className="text-center mt-2 text-xs text-green-600 dark:text-green-400">
                  {cart[product._id]} in cart
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}