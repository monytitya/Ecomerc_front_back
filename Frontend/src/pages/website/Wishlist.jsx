import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, Loader2, ShoppingCart, ArrowRight } from 'lucide-react';
import { wishlistApi, cartApi, fileUrl } from '../../services/api';

const img = fileUrl;

const Wishlist = () => {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user       = JSON.parse(localStorage.getItem('user') || 'null');
  const isLoggedIn = !!(localStorage.getItem('admin_token') || localStorage.getItem('customer_token'));

  useEffect(() => {
    if (!isLoggedIn || !user?.id) { setLoading(false); return; }
    wishlistApi.get(user.id)
      .then(r => setItems(r.data?.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (productId) => {
    await wishlistApi.remove(user.id, productId).catch(() => {});
    setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleAddToCart = async (productId) => {
    try {
      await cartApi.add({ productId, qty: 1, size: 'M' });
      handleRemove(productId);
    } catch { navigate('/login'); }
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-20">
      <div className="text-center max-w-md px-4">
        <Heart className="w-20 h-20 text-slate-200 mx-auto mb-6" />
        <h1 className="text-3xl font-black text-slate-800 mb-3">Your Wishlist</h1>
        <p className="text-slate-500 mb-8">Please sign in to save and view your wishlist.</p>
        <Link to="/login" className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/25 inline-block">
          Sign In
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Heart className="w-8 h-8 fill-red-400 text-red-400" />
            My Wishlist
          </h1>
          <p className="text-white/60 mt-1 text-sm">{items.length} saved item{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Heart className="w-20 h-20 text-slate-200 mb-6" />
            <h2 className="text-2xl font-black text-slate-700 mb-3">Your wishlist is empty</h2>
            <p className="text-slate-400 text-sm mb-8">Browse our shop and click the heart icon to save products you love.</p>
            <Link to="/shop" className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/25">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map(item => {
              const image = img(item.productImg || item.imageName || item.imageFile);
              const price = item.productPrice ?? item.salePrice ?? item.price ?? 0;
              return (
                <div key={item.productId} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {/* Image */}
                  <div
                    className="relative aspect-square bg-slate-50 overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/product/${item.productId}`)}
                  >
                    {image
                      ? <img src={image} alt={item.productTitle || item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e=>{e.target.style.display='none';}} />
                      : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-14 h-14 text-slate-200" /></div>
                    }
                    {/* Remove */}
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(item.productId); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3
                      className="font-bold text-slate-800 text-sm line-clamp-2 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => navigate(`/product/${item.productId}`)}
                    >
                      {item.productTitle || item.title}
                    </h3>
                    <p className="text-base font-black text-slate-900 mb-4">${price}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(item.productId)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-blue-500/20"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="w-10 flex items-center justify-center border border-slate-200 rounded-xl hover:border-red-400 hover:text-red-400 text-slate-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link to="/shop" className="flex items-center gap-2 px-8 py-3.5 border-2 border-blue-600 text-blue-600 font-bold rounded-2xl hover:bg-blue-50 transition-colors">
              Continue Shopping
            </Link>
            <button
              onClick={async () => {
                for (const item of items) {
                  await cartApi.add({ productId: item.productId, qty: 1, size: 'M' }).catch(()=>{});
                }
                setItems([]);
                navigate('/cart');
              }}
              className="flex items-center gap-2 px-8 py-3.5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5"
            >
              Move All to Cart <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
