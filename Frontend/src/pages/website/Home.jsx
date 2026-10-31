import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Star, Truck, ShieldCheck, RefreshCw, Headphones, ChevronRight, Heart, Sparkles, Clock, Zap, Headphones as HeadphonesIcon, Watch, Wallet, Gamepad2, Glasses, Luggage, Grid, Plus, Check, ChevronLeft } from 'lucide-react';
import { productApi, catalogApi, wishlistApi, fileUrl } from '../../services/api';
import { useCart } from '../../context/CartContext';

const img = fileUrl;

// Category icons map
const categoryIcons = {
  Backpacks: Luggage,
  Headphones: HeadphonesIcon,
  Watches: Watch,
  Wallets: Wallet,
  Gaming: Gamepad2,
  Sunglasses: Glasses,
  Travel: Luggage,
  Accessories: Grid,
};

/* --- HERO SLIDER / SWIPER COMPONENT --- */
const HERO_SLIDES = [
  {
    id: 1,
    image: '/assets/banners/media__1786293334428.png',
    link: '/shop?label=new'
  }
];

const HeroSwiper = ({ navigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 0) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative w-full overflow-hidden rounded-3xl shadow-xl border border-slate-100 group cursor-pointer bg-slate-50" 
      onClick={() => navigate(HERO_SLIDES[currentSlide].link)}
    >
      {/* Banner Images */}
      <div className="relative w-full flex items-center justify-center">
        {HERO_SLIDES.map((slide, idx) => (
          <img 
            key={slide.id}
            src={slide.image} 
            alt="Premium Promo Banner"
            className={`w-full h-auto object-contain transition-opacity duration-1000 ${currentSlide === idx ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 z-0'}`}
          />
        ))}
        {/* Subtle overlay to ensure navigation controls remain visible */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/30 to-transparent z-20 pointer-events-none" />
      </div>

      {/* Swiper Navigation & Pagination Controls */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1)); }}
          className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-900 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 mx-2">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
              className={`h-2.5 rounded-full transition-all ${
                currentSlide === idx ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length); }}
          className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-900 transition-colors shadow-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/* --- Product Card matching reference design --- */
const ProductCard = ({ product, wishlist, onToggleWishlist, onAddToCart }) => {
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const image = img(product.productImg || product.imageName || product.imageFile);
  const currentPrice = product.productPrice ?? product.price ?? 0;
  const oldPriceVal = product.productPspPrice ?? product.salePrice ?? 0;
  const oldPrice = oldPriceVal > currentPrice ? oldPriceVal : null;
  const discount = oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
  const isWishlisted = wishlist?.includes(product.productId);

  const handleAdd = (e) => {
    e.stopPropagation();
    onAddToCart?.(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.productId}`)}
      className="group bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col relative"
    >
      {/* Product Image Box */}
      <div className="relative aspect-square rounded-xl bg-slate-50 overflow-hidden mb-3 flex items-center justify-center">
        {image ? (
          <img src={image} alt={product.productTitle || product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e=>{e.target.style.display='none';}} />
        ) : (
          <ShoppingBag className="w-12 h-12 text-slate-200" />
        )}
        
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm">
              -{discount}%
            </span>
          )}
          {(product.productLabel || product.label) && (
            <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md shadow-sm">
              {product.productLabel || product.label}
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(product.productId);
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
            isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 text-slate-400 hover:bg-white hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
        </button>
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
          {product.brandName || product.catTitle || 'Accessories'}
        </span>
        <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1.5 group-hover:text-blue-600 transition-colors">
          {product.productTitle || product.title}
        </h3>
        
        {/* Ratings */}
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-xs text-slate-400 ml-1 font-medium">(1,248)</span>
        </div>

        {/* Price & Action */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div>
            <span className="text-base sm:text-lg font-black text-slate-900">${currentPrice.toFixed(2)}</span>
            {discount > 0 && <span className="text-xs text-slate-400 line-through ml-1.5">${oldPrice.toFixed(2)}</span>}
          </div>

          <button
            onClick={handleAdd}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              added 
                ? 'bg-emerald-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            }`}
          >
            {added ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            <span>{added ? 'Added' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Flash sale countdown timer state (Hours: 02, Mins: 14, Secs: 36)
  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 14, mins: 36, secs: 22 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: 59, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      productApi.getFeatured().catch(()=>({data:{data:[]}})),
      catalogApi.getTopCategories().catch(()=>({data:{data:[]}})),
      productApi.getProducts(0, 10, 'productId').catch(()=>({data:{data:{content:[]}}}))
    ]).then(([f, c, n]) => {
      const featList = f.data?.data || f.data || [];
      setFeatured(featList);
      setCategories(c.data?.data || c.data || []);

      const newArr = n.data?.data?.content || n.data?.data || [];
      setNewArrivals(newArr);
    });

    if (user?.id) {
      wishlistApi.get(user.id)
        .then(r => setWishlist((r.data?.data || []).map(w => w.productId)))
        .catch(() => {});
    }
  }, []);

  const handleToggleWishlist = async (productId) => {
    if (!user?.id) { navigate('/login'); return; }
    try {
      await wishlistApi.toggle(user.id, productId);
      setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    } catch (e) {}
  };

  const handleAddToCart = async (product) => {
    const ok = await addToCart(product, 1);
    if (!ok) navigate('/login');
  };

  const defaultCategories = [
    { name: 'Backpacks', count: '120+ Items', icon: Luggage },
    { name: 'Headphones', count: '150+ Items', icon: HeadphonesIcon },
    { name: 'Watches', count: '80+ Items', icon: Watch },
    { name: 'Wallets', count: '90+ Items', icon: Wallet },
    { name: 'Gaming', count: '110+ Items', icon: Gamepad2 },
    { name: 'Sunglasses', count: '70+ Items', icon: Glasses },
    { name: 'Travel', count: '60+ Items', icon: Luggage },
    { name: 'Accessories', count: 'Explore more', icon: Grid },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 sm:pt-28">
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-12">
        <HeroSwiper navigate={navigate} />
      </section>

      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Free Shipping</h4>
              <p className="text-xs text-slate-500">On orders over $99</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Easy Returns</h4>
              <p className="text-xs text-slate-500">30-day return policy</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Secure Checkout</h4>
              <p className="text-xs text-slate-500">100% secure payment</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">24/7 Support</h4>
              <p className="text-xs text-slate-500">We're here to help</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. SHOP BY CATEGORY ─── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Shop by Category</h2>
          </div>
          <Link to="/shop" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
            View All Categories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {(categories.length > 0 ? categories.slice(0, 8) : defaultCategories).map((cat, idx) => {
            const name = cat.catTitle || cat.name;
            const id = cat.catId || cat.categoryId || name;
            const IconComponent = categoryIcons[name] || Grid;

            return (
              <div
                key={id || idx}
                onClick={() => navigate(`/shop?category=${id}`)}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer text-center flex flex-col items-center justify-center group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-600 flex items-center justify-center mb-3 transition-colors">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-xs mb-0.5 line-clamp-1">{name}</h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  {cat.itemCount || '100+ Items'}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 4. FEATURED PRODUCTS ─── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Featured Products</h2>
          </div>
          <Link to="/shop" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
            View All Products <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.slice(0, 4).map(product => (
            <ProductCard 
              key={product.productId} 
              product={product} 
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </section>

      {/* ─── 5. FLASH SALE COUNTDOWN BANNER ─── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
        <div className="bg-[#050B14] rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 border border-slate-800 shadow-2xl">
          <div className="max-w-xl z-10 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-black tracking-widest text-amber-400 uppercase mb-3">
              <Zap className="w-4 h-4 fill-amber-400" /> FLASH SALE
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 tracking-tight leading-tight">
              Up to 70% OFF
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium mb-8">
              Limited time offer on selected accessories. Don't miss out on premium tech & gear.
            </p>

            {/* Countdown Blocks */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
              <div className="bg-slate-900 border border-slate-800 rounded-xl w-16 h-16 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{String(timeLeft.days).padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Days</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl w-16 h-16 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Hours</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl w-16 h-16 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{String(timeLeft.mins).padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Mins</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl w-16 h-16 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{String(timeLeft.secs).padStart(2, '0')}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Secs</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/shop?label=flash')} 
              className="px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl text-sm transition-all flex items-center gap-2 mx-auto lg:mx-0 shadow-lg shadow-white/10"
            >
              Shop Now <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Flash Sale Featured Image & Badge */}
          <div className="relative w-full max-w-sm aspect-video sm:aspect-square flex items-center justify-center">
            <div className="absolute right-2 top-2 bg-blue-600 text-white w-20 h-20 rounded-full flex flex-col items-center justify-center font-black shadow-xl z-20">
              <span className="text-[9px] uppercase">UP TO</span>
              <span className="text-xl leading-none">70%</span>
              <span className="text-[9px] uppercase">OFF</span>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80" 
              alt="Flash Sale Headphones"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ─── 6. FEATURED COLLECTIONS (DUAL PROMO BANNERS) ─── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Featured Collections</h2>
          </div>
          <Link to="/shop" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
            View All Collections <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Banner 1 */}
          <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-3xl p-8 relative overflow-hidden flex items-center justify-between border border-slate-200/60 min-h-[220px]">
            <div className="max-w-xs z-10">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Tech Essentials</h3>
              <p className="text-slate-600 text-xs font-semibold mb-6">Smart tech for modern life</p>
              <button 
                onClick={() => navigate('/shop?category=tech')} 
                className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl text-xs shadow-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                Shop Collection <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80" 
              alt="Tech Essentials"
              className="w-40 h-40 object-contain drop-shadow-lg"
            />
          </div>

          {/* Banner 2 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-100 rounded-3xl p-8 relative overflow-hidden flex items-center justify-between border border-amber-200/60 min-h-[220px]">
            <div className="max-w-xs z-10">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Travel Collection</h3>
              <p className="text-slate-600 text-xs font-semibold mb-6">Built for every adventure</p>
              <button 
                onClick={() => navigate('/shop?category=travel')} 
                className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl text-xs shadow-md hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                Shop Collection <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80" 
              alt="Travel Collection"
              className="w-40 h-40 object-contain drop-shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* ─── 7. NEW ARRIVALS ─── */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">New Arrivals</h2>
          </div>
          <Link to="/shop?sort=productId,desc" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(newArrivals.length > 0 ? newArrivals.slice(0, 4) : featured.slice(0, 4)).map(product => (
            <ProductCard 
              key={product.productId} 
              product={product} 
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
