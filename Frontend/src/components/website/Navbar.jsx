import React, { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, Search, LogOut, LayoutDashboard, Trash2, ArrowRight, Loader2, ShoppingBag, ChevronDown, Flame, Truck, Plus, Minus } from 'lucide-react';
import { wishlistApi, catalogApi } from '../../services/api';
import { useCart } from '../../context/CartContext';

const BASE = 'http://localhost:9090/api/files/';
const img = (f) => (f ? `${BASE}${f}` : null);

const CartItem = ({ item, onDelete, onQtyChange }) => {
  const [qty, setQty] = useState(item.qty || 1);
  const [updating, setUpdating] = useState(false);
  const itemId = item.pId ?? item.pid ?? item.productId ?? item.id;
  const price = item.productPrice ?? 0;
  const image = img(item.productImg || item.imageName || item.imageFile);
  const subtotal = price * qty;

  const handleDecrease = async () => {
    if (updating) return;
    if (qty <= 1) {
      onDelete(itemId, qty);
      return;
    }
    const newQty = qty - 1;
    setQty(newQty); // immediate UI update
    setUpdating(true);
    try {
      await onQtyChange(itemId, newQty, price);
    } catch {
      setQty(qty); // rollback
    } finally {
      setUpdating(false);
    }
  };

  const handleIncrease = async () => {
    if (updating) return;
    const newQty = qty + 1;
    setQty(newQty); // immediate UI update
    setUpdating(true);
    try {
      await onQtyChange(itemId, newQty, price);
    } catch {
      setQty(qty); // rollback
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100">
        {image
          ? <img src={image} alt={item.productTitle} className="w-full h-full object-cover" />
          : <ShoppingBag className="w-8 h-8 text-slate-300 m-auto mt-6" />}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-slate-800 text-sm line-clamp-2 leading-snug">
            {item.productTitle || item.title}
          </h4>
          <button
            onClick={() => onDelete(itemId, qty)}
            className="flex-shrink-0 p-1 text-slate-300 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between">
          {/* ─── Qty Controls ─── */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
            <button
              onClick={handleDecrease}
              disabled={updating}
              className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-7 text-center text-xs font-extrabold text-slate-800">{qty}</span>
            <button
              onClick={handleIncrease}
              disabled={updating}
              className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-blue-600 hover:text-white transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="font-black text-blue-600 text-sm">${subtotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};



const Navbar = () => {
  const { cartCount, cartItems, setCartItems, removeFromCart, updateQty, refreshCart } = useCart();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  // Cart Sidebar State
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = localStorage.getItem('role');
  const isLoggedIn = !!(localStorage.getItem('admin_token') || localStorage.getItem('customer_token'));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    catalogApi.getCategories().then(r => {
      const catList = Array.isArray(r.data?.data) ? r.data.data : (Array.isArray(r.data) ? r.data : []);
      setCategories(catList);
    }).catch(() => { });

    if (isLoggedIn && user?.id) {
      wishlistApi.get(user.id).then(r => setWishlistCount(r.data?.data?.length || 0)).catch(() => { });
    }
  }, [isLoggedIn]);

  const loadCart = () => {
    if (!isLoggedIn) return;
    setCartLoading(true);
    refreshCart().finally(() => setCartLoading(false));
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setCartSidebarOpen(true);
    loadCart();
  };

  // Cart sidebar handlers — delegate to CartContext
  const handleQtyChange = useCallback((itemId, newQty, price) => {
    updateQty(itemId, newQty, price);
  }, [updateQty]);

  const handleRemoveItem = useCallback(async (targetId) => {
    await removeFromCart(targetId);
  }, [removeFromCart]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/home');
    setMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        {/* Top announcement removed */}

        {/* Main Navbar */}
        <div className={`bg-white transition-shadow duration-300 border-b border-slate-100 ${scrolled ? 'shadow-md shadow-slate-200/50' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
              {/* Brand Logo */}
              <Link to="/home" className="flex items-center gap-2.5 flex-shrink-0 group">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
                  <span className="text-white font-black text-xl tracking-tighter">A</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                    E-comershop
                  </span>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
                <NavLink to="/home" className={({ isActive }) => `px-3.5 py-2 text-sm font-bold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'}`}>
                  Home
                </NavLink>
                <NavLink to="/shop" className={({ isActive }) => `px-3.5 py-2 text-sm font-bold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'}`}>
                  Shop
                </NavLink>

                {/* Categories Dropdown */}
                <div className="relative group" onMouseEnter={() => setCatDropdownOpen(true)} onMouseLeave={() => setCatDropdownOpen(false)}>
                  <button className="flex items-center gap-1 px-3.5 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">
                    Categories <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  </button>
                  {catDropdownOpen && (
                    <div className="absolute top-full left-0 w-56 pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 space-y-1">
                        <Link to="/shop" className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl">
                          All Categories
                        </Link>
                        {categories.slice(0, 8).map(cat => {
                          const id = cat.catId || cat.categoryId;
                          const name = cat.catTitle || cat.name;
                          return (
                            <Link key={id} to={`/shop?category=${id}`} className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl">
                              {name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <NavLink to="/shop?label=deals" className={({ isActive }) => `px-3.5 py-2 text-sm font-bold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'}`}>
                  Deals
                </NavLink>
                <NavLink to="/shop?label=new" className={({ isActive }) => `px-3.5 py-2 text-sm font-bold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'}`}>
                  New Arrivals
                </NavLink>
                <NavLink to="/about" className={({ isActive }) => `px-3.5 py-2 text-sm font-bold transition-colors ${isActive ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'}`}>
                  About Us
                </NavLink>
              </nav>

              {/* Search Bar Input */}
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs lg:max-w-md mx-2 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-100/80 border border-slate-200/80 rounded-full text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600">
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Right Action Icons */}
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Mobile Search Button */}
                <button onClick={() => setSearchOpen(true)} className="md:hidden p-2.5 rounded-full hover:bg-slate-100 text-slate-700">
                  <Search className="w-5 h-5" />
                </button>

                {/* Wishlist Icon */}
                <Link to="/wishlist" className="relative p-2.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors">
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart Icon */}
                <button onClick={handleCartClick} className="relative p-2.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* User Profile / Admin Link */}
                {isLoggedIn ? (
                  <div className="relative group">
                    <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-600/20">
                        {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                      </div>
                    </button>
                    <div className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 py-2">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-400">Signed in as</p>
                          <p className="text-sm font-black text-slate-900 truncate">{user?.firstName || user?.username}</p>
                        </div>
                        <Link to="/my-orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <User className="w-4 h-4 text-slate-400" /> My Orders
                        </Link>
                        {(role === 'ADMIN' || role === 'admin') && (
                          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                          </Link>
                        )}
                        <div className="border-t border-slate-100 my-1" />
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut className="w-4 h-4 opacity-70" /> Logout
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link to="/login" className="p-2.5 rounded-full hover:bg-slate-100 text-slate-700 transition-colors">
                    <User className="w-5 h-5" />
                  </Link>
                )}

                {/* Mobile Menu Toggle */}
                <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100">
                  {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-100 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-4 space-y-2">
              <NavLink to="/home" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-slate-50">
                Home
              </NavLink>
              <NavLink to="/shop" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-slate-50">
                Shop All
              </NavLink>
              <NavLink to="/shop?label=deals" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-slate-50">
                Deals
              </NavLink>
              <NavLink to="/shop?label=new" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-slate-50">
                New Arrivals
              </NavLink>
              <NavLink to="/about" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 rounded-xl font-bold text-slate-800 hover:bg-slate-50">
                About Us
              </NavLink>
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer Overlay */}
      {cartSidebarOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setCartSidebarOpen(false)} />
          <div className="relative w-full sm:w-[400px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-blue-600" /> Shopping Cart
              </h2>
              <button onClick={() => setCartSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center bg-slate-50 rounded-full text-slate-500 hover:bg-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cartLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
              ) : cartItems.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="font-bold text-slate-800 text-lg mb-2">Cart is empty</p>
                  <p className="text-slate-500 text-sm">Discover products and add them to your cart.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <CartItem
                      key={item.pId ?? item.productId ?? item.id}
                      item={item}
                      onDelete={handleRemoveItem}
                      onQtyChange={handleQtyChange}
                    />
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <div className="flex justify-between mb-4">
                  <span className="font-bold text-slate-600">Subtotal</span>
                  <span className="font-black text-slate-900 text-xl">
                    ${cartItems.reduce((acc, i) => acc + (i.subtotal ?? ((i.productPrice ?? 0) * (i.qty ?? 1))), 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setCartSidebarOpen(false); navigate('/cart'); }} className="w-full py-3.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
                    Checkout Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
