import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Minus, Plus, X, Tag, ArrowRight, Loader2, ShoppingCart, AlertCircle, User, Phone, MapPin } from 'lucide-react';
import { couponApi, orderApi } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { PAYMENT_CONSTANTS, validateOrderAmount } from '../../config/constants';

const BASE = 'http://localhost:9090/api/files/';
const img  = (f) => (f ? `${BASE}${f}` : null);
const getInitialContact = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return {
      name: user?.customerName || user?.name || '',
      phone: user?.customerContact || user?.phone || '',
      address: user?.customerAddress || user?.address || '',
    };
  } catch {
    return { name: '', phone: '', address: '' };
  }
};

const Cart = () => {
  const { cartItems: items, updateQty, removeFromCart, refreshCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [coupon,  setCoupon]  = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [amountError, setAmountError] = useState('');
  const [contact, setContact] = useState(getInitialContact);
  const [contactError, setContactError] = useState('');
  const navigate = useNavigate();
  const isLoggedIn = !!(localStorage.getItem('admin_token') || localStorage.getItem('customer_token'));

  const handleQty = async (productId, qty) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setUpdating(productId);
    const item = items.find(i => (i.pId || i.pid || i.productId || i.id) === productId);
    await updateQty(productId, qty, item?.productPrice);
    setUpdating(null);
  };

  const handleRemove = async (productId) => {
    await removeFromCart(productId);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (items.length > 1) {
      setAmountError('Please checkout one product at a time. Multi-product orders are not supported yet.');
      return;
    }
    const name = contact.name.trim();
    const phone = contact.phone.trim();
    const address = contact.address.trim();
    if (!name || !phone || !address) {
      setContactError('Name, phone number, and delivery address are required before payment.');
      return;
    }
    setContactError('');
    
    // Validate minimum amount
    const amountValidation = validateOrderAmount(total);
    if (!amountValidation.valid) {
      setAmountError(amountValidation.error);
      return;
    }
    
    setAmountError('');
    setPlacingOrder(true);
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const firstItem = items[0];
      const payload = {
        customerId: user?.id || null,
        dueAmount: Number(total.toFixed(2)),
        qty: firstItem.qty || 1,
        size: firstItem.size || 'M',
        productId: firstItem.pId || firstItem.pid || firstItem.productId || firstItem.id,
        customerName: name,
        customerPhone: phone,
        customerAddress: address,
      };
      const res = await orderApi.placeOrder(payload);
      if (res.data?.success) {
        const invoiceNo = res.data.data.invoiceNo;
        navigate(`/checkout/${invoiceNo}`);
      } else {
        alert('Failed to place order: ' + (res.data?.message || 'Unknown error'));
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.message || err?.message;
      alert('Error placing order: ' + serverMsg);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleCoupon = async () => {
    setCouponError('');
    try {
      const res = await couponApi.validate(coupon);
      const data = res.data?.data || res.data;
      if (data?.discountAmount) {
        setDiscount(data.discountAmount);
        setCouponApplied(true);
      } else if (data?.discountPercent) {
        setDiscount(Math.round(subtotal * data.discountPercent / 100));
        setCouponApplied(true);
      } else {
        setCouponError('Invalid coupon code');
      }
    } catch {
      setCouponError('Invalid or expired coupon');
    }
  };

  const subtotal  = items.reduce((s, i) => s + (i.productPrice ?? i.salePrice ?? i.price ?? 0) * i.qty, 0);
  // Shipping and tax will be calculated when those rules are ready.
  const total = +(subtotal - discount).toFixed(2);

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-20">
      <div className="text-center max-w-md px-4">
        <ShoppingCart className="w-20 h-20 text-slate-200 mx-auto mb-6" />
        <h1 className="text-3xl font-black text-slate-800 mb-3">Your Cart</h1>
        <p className="text-slate-500 mb-8">Please sign in to view your cart and checkout.</p>
        <Link to="/login" className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/25 inline-block">
          Sign In to Continue
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white">Shopping Cart</h1>
          <p className="text-white/60 mt-1 text-sm">{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex justify-center py-32"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <ShoppingBag className="w-20 h-20 text-slate-200 mb-6" />
            <h2 className="text-2xl font-black text-slate-700 mb-3">Your cart is empty</h2>
            <p className="text-slate-400 text-sm mb-8">Add some products and come back here to checkout.</p>
            <Link to="/shop" className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/25">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Items */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {items.map((item, i) => {
                  const image  = img(item.productImg || item.imageName || item.imageFile);
                  const price  = item.productPrice ?? item.salePrice ?? item.price ?? 0;
                  const id = item.pId || item.pid || item.productId || item.id;
                  return (
                    <div key={id} className={`flex gap-5 p-5 ${i > 0 ? 'border-t border-slate-50' : ''} hover:bg-slate-50/50 transition-colors`}>
                      {/* Image */}
                      <div
                        className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 cursor-pointer"
                        onClick={() => navigate(`/product/${id}`)}
                      >
                        {image
                          ? <img src={image} alt={item.productTitle || item.title} className="w-full h-full object-cover" onError={e=>{e.target.style.display='none';}} />
                          : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-slate-300" /></div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-bold text-slate-800 text-sm line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => navigate(`/product/${id}`)}
                        >
                          {item.productTitle || item.title}
                        </h3>
                        {item.size && <p className="text-xs text-slate-400 mt-1">Size: {item.size}</p>}
                        <p className="font-black text-blue-600 mt-2">${price}</p>
                      </div>

                      {/* Qty + Remove */}
                      <div className="flex flex-col items-end justify-between">
                        <button onClick={() => handleRemove(id)} className="text-slate-300 hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center bg-slate-100 rounded-xl overflow-hidden">
                          <button
                            onClick={() => handleQty(id, item.qty - 1)}
                            disabled={updating === id}
                            className="px-2.5 py-2 hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                          <span className="px-3 font-bold text-sm text-slate-800 min-w-[2rem] text-center">
                            {updating === id ? '…' : item.qty}
                          </span>
                          <button
                            onClick={() => handleQty(id, item.qty + 1)}
                            disabled={updating === id}
                            className="px-2.5 py-2 hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-600" />
                          </button>
                        </div>
                        <p className="font-black text-slate-900 text-sm">${(price * item.qty).toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Continue Shopping */}
              <Link to="/shop" className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm hover:gap-3 transition-all">
                ← Continue Shopping
              </Link>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
                <h2 className="font-black text-slate-900 text-lg mb-6">Order Summary</h2>

                {/* Coupon */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Coupon Code</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={coupon}
                        onChange={e => { setCoupon(e.target.value); setCouponError(''); setCouponApplied(false); setDiscount(0); }}
                        placeholder="Enter code"
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                    </div>
                    <button
                      onClick={handleCoupon}
                      className="px-4 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                  {couponApplied && <p className="text-green-600 text-xs mt-1 font-semibold">✓ Coupon applied! You save ${discount}</p>}
                </div>

                {/* Totals */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h2 className="font-black text-slate-900 mb-1">Delivery Details</h2>
                  <p className="text-xs text-slate-500 mb-4">Enter your contact details before continuing to payment.</p>
                  <div className="space-y-3">
                    {[
                      { key: 'name', label: 'Full name', placeholder: 'Your full name', icon: User },
                      { key: 'phone', label: 'Phone number', placeholder: '+855 12 345 678', icon: Phone },
                    ].map(({ key, label, placeholder, icon: Icon }) => (
                      <div key={key} className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          value={contact[key]}
                          onChange={e => setContact(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                          aria-label={label}
                          className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                      </div>
                    ))}
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <textarea
                        value={contact.address}
                        onChange={e => setContact(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Delivery address"
                        aria-label="Delivery address"
                        rows={3}
                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                      />
                    </div>
                  </div>
                  {contactError && <p className="mt-3 text-xs font-semibold text-red-600">{contactError}</p>}
                </div>

                {/* Totals */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal ({items.length} items)</span>
                    <span className="font-bold text-slate-800">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount</span>
                      <span className="font-bold">-${discount}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-3 flex justify-between">
                    <span className="font-black text-slate-900 text-base">Total</span>
                    <span className="font-black text-slate-900 text-base">${total}</span>
                  </div>
                </div>

                {/* Amount Error Alert */}
                {amountError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-red-700">
                      <p className="font-bold">Minimum Order Required</p>
                      <p className="mt-1">{amountError}</p>
                    </div>
                  </div>
                )}

                {/* Checkout */}
                <button
                  onClick={handleCheckout}
                  disabled={placingOrder || total < PAYMENT_CONSTANTS.MIN_AMOUNT_USD}
                  title={total < PAYMENT_CONSTANTS.MIN_AMOUNT_USD ? `Minimum order is $${PAYMENT_CONSTANTS.MIN_AMOUNT_USD}` : ''}
                  className="mt-6 w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {placingOrder ? 'Processing...' : 'Proceed to Checkout'} <ArrowRight className="w-5 h-5" />
                </button>

                {/* Payment icons */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-slate-400 mb-2">Secure payment powered by</p>
                  <div className="flex justify-center gap-2">
                    {['VISA', 'MC', 'AMEX', 'PayPal'].map(p => (
                      <span key={p} className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-md text-slate-500">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
