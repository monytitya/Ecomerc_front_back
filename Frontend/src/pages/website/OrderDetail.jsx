import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Package, Truck, Home, CheckCircle2, Clock, XCircle, RotateCcw, ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react';
import { orderApi, fileUrl } from '../../services/api';

const img = fileUrl;

const STEPS = [
  { key: 'PENDING',    icon: Clock,         label: 'Order Placed',  sub: 'Your order is received' },
  { key: 'CONFIRMED',  icon: CheckCircle2,  label: 'Confirmed',     sub: 'Order has been confirmed' },
  { key: 'PROCESSING', icon: Package,       label: 'Processing',    sub: 'Preparing your items' },
  { key: 'SHIPPED',    icon: Truck,         label: 'Shipped',       sub: 'On the way to you' },
  { key: 'DELIVERED',  icon: Home,          label: 'Delivered',     sub: 'Enjoy your purchase!' },
];

const STEP_ORDER = ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED'];

const OrderDetail = () => {
  const { invoiceNo } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [returning, setReturning] = useState(false);
  const [returnDone, setReturnDone] = useState(false);

  useEffect(() => {
    if (!invoiceNo) return;
    orderApi.getByInvoice(invoiceNo)
      .then(r => setOrder(r.data?.data || null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [invoiceNo]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await orderApi.cancelOrder(order.orderId);
      setOrder(o => ({ ...o, status: 'CANCELLED' }));
    } catch { alert('Could not cancel order. Please try again.'); }
    finally { setCancelling(false); }
  };

  const handleReturn = async () => {
    const reason = window.prompt('Why are you returning this order? (e.g. Wrong size, Damaged item)');
    if (!reason) return;
    setReturning(true);
    try {
      await orderApi.returnOrder(order.orderId, reason);
      setOrder(o => ({ ...o, status: 'RETURNED' }));
      setReturnDone(true);
    } catch { alert('Could not submit return request.'); }
    finally { setReturning(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen pt-20 flex flex-col items-center justify-center">
      <Package className="w-16 h-16 text-slate-200 mb-4" />
      <h2 className="text-xl font-black text-slate-700 mb-2">Order not found</h2>
      <Link to="/my-orders" className="text-blue-600 font-bold">← Back to My Orders</Link>
    </div>
  );

  const isCancelled = order.status === 'CANCELLED';
  const isReturned  = order.status === 'RETURNED';
  const canCancel   = ['PENDING', 'CONFIRMED'].includes(order.status);
  const canReturn   = order.status === 'DELIVERED';

  const currentStepIdx = STEP_ORDER.indexOf(order.status);

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/my-orders')} className="flex items-center gap-2 text-white/60 hover:text-white text-sm font-semibold mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </button>
          <h1 className="text-3xl font-black text-white">Order #{order.invoiceNo || order.orderId}</h1>
          <p className="text-white/60 mt-1 text-sm">
            Placed on {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* Status alerts for cancelled/returned */}
        {isCancelled && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Order Cancelled</p>
              <p className="text-sm opacity-80">This order has been cancelled. Refund will be processed within 3–5 business days.</p>
            </div>
          </div>
        )}
        {(isReturned || returnDone) && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl p-4">
            <RotateCcw className="w-5 h-5 flex-shrink-0 text-blue-500" />
            <div>
              <p className="font-bold">Return Requested</p>
              <p className="text-sm opacity-80">Your return request has been submitted. Refund will be processed after item inspection.</p>
            </div>
          </div>
        )}

        {/* Tracking Stepper */}
        {!isCancelled && !isReturned && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-black text-slate-800 mb-6">Order Tracking</h2>
            <div className="space-y-0">
              {STEPS.map((step, idx) => {
                const done    = idx <= currentStepIdx;
                const current = idx === currentStepIdx;
                const Icon    = step.icon;
                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        done
                          ? current
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-100'
                            : 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={`w-0.5 h-10 transition-colors ${done && idx < currentStepIdx ? 'bg-emerald-300' : 'bg-slate-100'}`} />
                      )}
                    </div>
                    <div className="pb-10 pt-1">
                      <p className={`font-bold text-sm ${done ? (current ? 'text-blue-700' : 'text-emerald-700') : 'text-slate-400'}`}>
                        {step.label} {current && <span className="text-[10px] bg-blue-100 text-blue-700 font-black px-2 py-0.5 rounded-full ml-1">Current</span>}
                      </p>
                      <p className="text-xs text-slate-400">{step.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order summary */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-black text-slate-800 mb-4">Order Summary</h2>
          <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4 mb-4">
            <div className="w-16 h-16 rounded-xl bg-white border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {order.productImg
                ? <img src={img(order.productImg)} alt="" className="w-full h-full object-cover" />
                : <ShoppingBag className="w-7 h-7 text-slate-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm line-clamp-2">{order.productTitle || 'Product #' + order.productId}</p>
              <p className="text-xs text-slate-500 mt-1">Qty: {order.qty || 1} {order.size ? `· Size: ${order.size}` : ''}</p>
            </div>
            <p className="font-black text-blue-600">${(order.dueAmount || 0).toFixed(2)}</p>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-50 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span><span className="font-bold">${(order.dueAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-600">
              <span>Shipping</span><span className="font-bold">FREE</span>
            </div>
            <div className="flex justify-between font-black text-slate-900 text-base border-t border-slate-100 pt-2">
              <span>Total</span><span>${(order.dueAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 px-6 py-3.5 bg-red-50 border border-red-100 text-red-600 font-black text-sm rounded-2xl hover:bg-red-100 transition-all disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
          {canReturn && (
            <button
              onClick={handleReturn}
              disabled={returning}
              className="flex items-center gap-2 px-6 py-3.5 bg-slate-100 border border-slate-200 text-slate-700 font-black text-sm rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              {returning ? 'Submitting…' : 'Return / Refund'}
            </button>
          )}
          <Link
            to="/shop"
            className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-black text-sm rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
