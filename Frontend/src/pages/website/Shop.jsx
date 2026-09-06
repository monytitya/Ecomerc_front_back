import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Star, ShoppingBag, X, ChevronDown, Heart, Loader2, ShoppingCart, Check } from 'lucide-react';
import { productApi, catalogApi, wishlistApi, fileUrl } from '../../services/api';
import { useCart } from '../../context/CartContext';

const img = (filename) => {
  if (!filename) return null;
  return filename.startsWith('http') ? filename : fileUrl(filename);
};

const SORT_OPTIONS = [
  { label: 'Newest Arrivals', value: 'productId' },
  { label: 'Price: Low to High', value: 'productPrice,asc' },
  { label: 'Price: High to Low', value: 'productPrice,desc' },
  { label: 'Name: A to Z', value: 'productTitle,asc' },
];

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');
  const [activeBrand, setActiveBrand] = useState(searchParams.get('brand') || '');
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [sort, setSort] = useState('productId');
  const [showFilters, setShowFilters] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const { addToCart } = useCart();
  const [addedMap, setAddedMap] = useState({});

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    const ok = await addToCart(product, 1);
    if (!ok) { navigate('/login'); return; }
    setAddedMap(prev => ({ ...prev, [product.productId]: true }));
    setTimeout(() => setAddedMap(prev => ({ ...prev, [product.productId]: false })), 2000);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchData = (attempt = 1) => {
      setLoading(true);
      console.log(`Fetching products and categories... (attempt ${attempt})`);

      Promise.all([
        productApi.getProducts(0, 100, 'productId'),
        catalogApi.getCategories(),
      ]).then(([p, c]) => {
        if (cancelled) return;
        console.log('Products Response:', p.data);
        console.log('Categories Response:', c.data);

        // Backend wraps in ApiResponse: { data: Page<ProductModel> }
        // Page has: { content: [...], totalElements, ... }
        const prodList =
          p.data?.data?.content ??
          (Array.isArray(p.data?.data) ? p.data.data : []);
        const catList = Array.isArray(c.data?.data)
          ? c.data.data
          : Array.isArray(c.data)
          ? c.data
          : [];

        setProducts(prodList);
        setCategories(catList);

        if (prodList.length === 0) console.warn('API returned 0 products.');
      }).catch((err) => {
        if (cancelled) return;
        console.error(`Attempt ${attempt} failed:`, err?.message || err);
        if (attempt < 5) {
          // Retry with backoff when backend is starting up
          setTimeout(() => fetchData(attempt + 1), 2000 * attempt);
          return;
        }
        console.error('All retry attempts failed. No products loaded.');
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    };

    fetchData();

    if (user?.id) {
      wishlistApi.get(user.id)
        .then(r => setWishlist((r.data?.data || []).map(w => w.productId)))
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, []);

  // Filter Logic
  useEffect(() => {
    let list = [...products];

    // Search query
    const q = searchParams.get('search')?.toLowerCase() || '';
    if (q) list = list.filter(p => (p.productTitle || p.title)?.toLowerCase().includes(q) || (p.productDesc || p.description)?.toLowerCase().includes(q));

    // Category
    if (activeCategory) {
      list = list.filter(p => {
        const id1 = String(p.catId || p.categoryId);
        const id2 = String(p.pCatId);
        const t1 = (p.catTitle || p.categoryName || '').toLowerCase();
        const t2 = (p.pCatTitle || '').toLowerCase();
        const active = String(activeCategory).toLowerCase();
        
        return id1 === active || id2 === active || t1 === active || (t2 && t2 === active);
      });
    }

    // Brand
    if (activeBrand) list = list.filter(p => String(p.manufacturerId) === String(activeBrand));

    // Price
    list = list.filter(p => {
      const price = p.productPrice || p.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Special Labels
    const label = searchParams.get('label');
    if (label) list = list.filter(p => (p.productLabel || p.label)?.toLowerCase() === label.toLowerCase());

    // Sort (client-side mirrors the server-side sort options)
    list.sort((a, b) => {
      const ap = a.productPrice ?? a.price ?? 0;
      const bp = b.productPrice ?? b.price ?? 0;

      if (sort === 'productPrice,asc') return ap - bp;
      if (sort === 'productPrice,desc') return bp - ap;
      if (sort === 'productTitle,asc') return (a.productTitle || '').localeCompare(b.productTitle || '');
      return (b.productId || 0) - (a.productId || 0); // productId desc (newest)
    });

    setFiltered(list);
  }, [products, searchParams, activeCategory, activeBrand, priceRange, sort]);

  const handleWishlist = async (e, productId) => {
    e.stopPropagation();
    if (!user?.id) { navigate('/login'); return; }
    try {
      await wishlistApi.toggle(user.id, productId);
      setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    } catch (err) {}
  };

  const clearFilters = () => {
    setActiveCategory('');
    setActiveBrand('');
    setPriceRange([0, 5000]);
    navigate('/shop');
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl lg:text-4xl font-black text-white mb-4">Shop Collection</h1>
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <Link to="/home" className="hover:text-white transition-colors">Home</Link>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <span className="text-white">Shop</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* --- SIDEBAR FILTERS (Desktop) --- */}
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-8">
          {/* Categories */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 tracking-wide mb-4">Categories</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveCategory('')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${!activeCategory ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                All Products
              </button>
              {categories.reduce((acc, c) => {
                 const title = c.catTitle || c.name;
                 if (!acc.some(x => (x.catTitle || x.name) === title)) acc.push(c);
                 return acc;
              }, []).map(c => {
                const id = c.catId || c.categoryId;
                const title = c.catTitle || c.name;
                return (
                <button 
                  key={id}
                  onClick={() => setActiveCategory(title)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${[title, String(id)].includes(activeCategory) ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {title}
                </button>
              )})}
            </div>
          </div>

          {/* Price Range */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 tracking-wide mb-4">Price Range</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input 
                  type="number" 
                  id="minPrice"
                  name="minPrice"
                  value={priceRange[0]} 
                  onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <span className="text-slate-400 font-bold">-</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input 
                  type="number" 
                  id="maxPrice"
                  name="maxPrice"
                  value={priceRange[1]} 
                  onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          <button onClick={clearFilters} className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-colors">
            Clear All Filters
          </button>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Showing <span className="text-blue-600">{filtered.length}</span> results
              {searchParams.get('search') && <span> for "{searchParams.get('search')}"</span>}
            </p>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Mobile Filter Toggle */}
              <button 
                onClick={() => setShowFilters(true)}
                className="flex-1 sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl"
              >
                <SlidersHorizontal className="w-4 h-4" /> Filters
              </button>

              {/* Sort */}
              <div className="relative flex-1 sm:w-60">
                <select 
                  id="sortOptions"
                  name="sortOptions"
                  value={sort} 
                  onChange={e => setSort(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
              <Search className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h2 className="text-xl font-black text-slate-800 mb-2">No products found</h2>
              <p className="text-slate-500 font-medium mb-6">Try adjusting your filters or search criteria.</p>
              <button onClick={clearFilters} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-colors">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map(product => {
                const image = img(product.productImg || product.imageName || product.imageFile);
                const currentPrice = product.productPrice ?? product.price ?? 0;
                const oldPriceVal = product.productPspPrice ?? product.salePrice ?? 0;
                const oldPrice = oldPriceVal > currentPrice ? oldPriceVal : null;
                const discount = oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
                const inWishlist = wishlist.includes(product.productId);

                return (
                  <div
                    key={product.productId}
                    onClick={() => navigate(`/product/${product.productId}`)}
                    className="group bg-white rounded-3xl p-4 shadow-sm border border-slate-100/60 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-square rounded-2xl bg-slate-50 overflow-hidden mb-4">
                      {image ? (
                        <>
                          <img
                            src={image}
                            alt={product.productTitle || product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={e => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-full h-full flex-col items-center justify-center gap-3 text-slate-300">
                            <ShoppingBag className="w-12 h-12" />
                            <span className="px-6 text-center text-xs font-bold uppercase tracking-wide text-slate-400">
                              {product.productTitle || product.title || 'Product image unavailable'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 text-slate-200" /></div>
                      )}
                      
                      {/* Tags */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {(product.productLabel || product.label) && (
                           <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/30">
                             {product.productLabel || product.label}
                           </span>
                        )}
                        {discount > 0 && (
                           <span className="bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30">
                             -{discount}% OFF
                           </span>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button 
                        onClick={e => handleWishlist(e, product.productId)}
                        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-all ${inWishlist ? 'bg-red-50 text-red-500' : 'bg-white/80 text-slate-400 hover:text-red-500 hover:bg-white'}`}
                      >
                        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                        <span className="text-xs font-bold text-slate-400 ml-1">(4.9)</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                        {product.productTitle || product.title}
                      </h3>
                      <div className="mt-auto pt-4 flex items-end justify-between border-t border-slate-50">
                        <div>
                          <span className="text-lg font-black text-slate-900">${currentPrice}</span>
                          {discount > 0 && <span className="text-xs font-bold text-slate-400 line-through ml-2">${oldPrice}</span>}
                        </div>
                        <button
                          onClick={e => handleAddToCart(e, product)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            addedMap[product.productId]
                              ? 'bg-emerald-500 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                          }`}
                        >
                          {addedMap[product.productId]
                            ? <><Check className="w-3.5 h-3.5" /> Added</>
                            : <><ShoppingCart className="w-3.5 h-3.5" /> Add</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- MOBILE FILTERS DRAWER --- */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] lg:hidden flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="relative w-[320px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-500 hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Mobile Categories */}
              <div>
                <h3 className="font-black text-slate-800 tracking-wide mb-4">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setActiveCategory('')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!activeCategory ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}
                  >
                    All
                  </button>
                  {categories.reduce((acc, c) => {
                     const title = c.catTitle || c.name;
                     if (!acc.some(x => (x.catTitle || x.name) === title)) acc.push(c);
                     return acc;
                  }, []).map(c => {
                    const id = c.catId || c.categoryId;
                    const title = c.catTitle || c.name;
                    return (
                    <button 
                      key={id}
                      onClick={() => setActiveCategory(title)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${[title, String(id)].includes(activeCategory) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 border border-slate-200'}`}
                    >
                      {title}
                    </button>
                  )})}
                </div>
              </div>

               {/* Mobile Price */}
               <div>
                <h3 className="font-black text-slate-800 tracking-wide mb-4">Price Range</h3>
                <div className="flex items-center gap-4">
                  <input type="number" value={priceRange[0]} onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" />
                  <span className="font-bold text-slate-400">-</span>
                  <input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 grid grid-cols-2 gap-4">
              <button onClick={() => { clearFilters(); setShowFilters(false); }} className="py-3.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-colors">
                Clear
              </button>
              <button onClick={() => setShowFilters(false)} className="py-3.5 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/25">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
