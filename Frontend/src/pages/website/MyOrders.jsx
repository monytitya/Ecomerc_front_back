import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronDown, ChevronUp, ShoppingBag, Clock, Loader2, RotateCcw, XCircle, Eye } from 'lucide-react';
import { orderApi, fileUrl } from '../../services/api';

const img = fileUrl;

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',     color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-400' },
  CONFIRMED:  { label: 'Confirmed',   color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500'  },
  PROCESSING: { label: 'Processing',  color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500'},
  SHIPPED:    { label: 'Shipped',     color: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500'},
  DELIVERED:  { label: 'Delivered',   color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-500'},
  CANCELLED:  { label: 'Cancelled',   color: 'bg-red-100 text-red-700',       dot: 'bg-red-500'  },
  RETURNED:   { label: 'Returned',    color: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
};

const OrderRow = ({ order }) => {
  const [open, setOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [returning, setReturning] = useState(false);
  const navigate = useNavigate();

  const st = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
  const canReturn = order.status === 'DELIVERED';

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      await orderApi.cancelOrder(order.orderId);
      window.location.reload();
    } catch { alert('Could not cancel order.'); }
    finally { setCancelling(false); }
  };

  const handleReturn = async () => {
    const reason = window.prompt('Please give a reason for returning this order:');
    if (!reason) return;
    setReturning(true);
    try {
      await orderApi.returnOrder(order.orderId, reason);
      window.location.reload();
    } catch { alert('Could not submit return request.'); }
    finally { setReturning(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header row */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm">#{order.invoiceNo || order.orderId}</p>
            <p className="text-xs text-slate-400">{new Date(order.orderDate || order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${st.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} /> {st.label}
          </span>
          <p className="font-black text-slate-900">${(order.dueAmount || order.totalAmount || 0).toFixed(2)}</p>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-slate-50 p-5 space-y-4 animate-in fade-in duration-200">
          {/* Product info */}
          {order.productId && (
            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-3">
              <div className="w-14 h-14 rounded-lg bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                {order.productImg
                  ? <img src={img(order.productImg)} alt="" className="w-full h-full object-cover" />
                  : <ShoppingBag className="w-6 h-6 text-slate-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm line-clamp-1">{order.productTitle || 'Product #' + order.productId}</p>
                <p className="text-xs text-slate-500">Qty: {order.qty || 1} {order.size && `· Size: ${order.size}`}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => navigate(`/order/${order.invoiceNo || order.orderId}`)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Track Order
            </button>

            {canCancel && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" /> {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            )}

            {canReturn && (
              <button
                onClick={handleReturn}
                disabled={returning}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> {returning ? 'Submitting…' : 'Return / Refund'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isLoggedIn = !!(localStorage.getItem('admin_token') || localStorage.getItem('customer_token'));
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!isLoggedIn || !user?.id) { setLoading(false); return; }
    orderApi.getCustomerOrders(user.id)
      .then(r => setOrders(r.data?.data || r.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
      <div className="text-center">
        <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-black text-slate-700 mb-2">Sign in to view orders</h2>
        <Link to="/login" className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">Sign In</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-white">My Orders</h1>
          <p className="text-white/60 mt-1 text-sm">Track, manage and return your purchases</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-32">
            <Package className="w-20 h-20 text-slate-200 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-slate-700 mb-3">No orders yet</h2>
            <p className="text-slate-400 mb-8">Once you place an order it will appear here.</p>
            <Link to="/shop" className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-500 font-medium">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
            {orders.map(order => (
              <OrderRow key={order.orderId || order.invoiceNo} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
