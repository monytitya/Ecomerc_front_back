import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, QrCode, AlertCircle, Loader2, ArrowLeft, Building2, DollarSign } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { paymentApi, orderApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { PAYMENT_CONSTANTS } from '../config/constants';

const Checkout = () => {
  const { invoiceNo } = useParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [qr, setQr] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [status, setStatus] = useState('PENDING'); // PENDING | PAID | FAILED
  const [loading, setLoading] = useState(true);
  const [transactionId, setTransactionId] = useState(null);
  const [amount, setAmount] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const maxPollAttempts = 120; // 10 minutes (120 * 5 seconds)
  const normalizePaymentStatus = (value) => String(value || 'PENDING').toUpperCase();

  const initPayment = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setTransactionId(null);
      setQr(null);
      setQrImage(null);
      setPollCount(0);
      setStatus('PENDING');
      // 1. Fetch real order details using invoiceNo
      const orderRes = await orderApi.getByInvoice(invoiceNo);
      if (!orderRes.data?.success) throw new Error("Order not found");

      const order = orderRes.data.data;
      
      // Validate and convert amount to Double - must be >= 0.01
      const actualAmount = Number(order.dueAmount ?? 0);

      if (!Number.isFinite(actualAmount) || actualAmount <= 0) {
        throw new Error(
          `Invalid order amount. Orders must be at least $${PAYMENT_CONSTANTS.MIN_AMOUNT_USD} USD or ${PAYMENT_CONSTANTS.MIN_AMOUNT_KHR} Riel (KHR) to proceed with payment.`
        );
      }

      if (actualAmount < PAYMENT_CONSTANTS.MIN_AMOUNT_USD) {
        throw new Error(
          `Order amount is too low. Minimum payment amount is $${PAYMENT_CONSTANTS.MIN_AMOUNT_USD} USD (or ${PAYMENT_CONSTANTS.MIN_AMOUNT_KHR} Riel).`
        );
      }
      
      setAmount(actualAmount);

      // 2. Create/fetch a payment record in the backend
      const res = await paymentApi.create({
        orderId: order.orderId, // Use real order ID
        amount: actualAmount,
        currency: "USD"
      });

      if (res.data?.success) {
        const pData = res.data.data;
        setTransactionId(pData.transactionId);
        setStatus(normalizePaymentStatus(pData.status));
        setQr(pData.qrString);
        setQrImage(pData.qrImage); // Base64 from ZXing

      } else {
        setErrorMsg(res.data?.message || "Failed to initialize payment.");

      }
    } catch (e) {
      console.error("Checkout init failed", e);
      setErrorMsg(e.response?.data?.message || e.message || "Checkout initialization failed");
    } finally {
      setLoading(false);
    }
  };

  const pollStatus = async () => {
    if (!transactionId || status !== 'PENDING') return;
    try {
      const res = await paymentApi.getStatus(transactionId);
      const paymentStatus = normalizePaymentStatus(res.data.data?.status);
      if (paymentStatus === 'PAID' || paymentStatus === 'FAILED') {
        setStatus(paymentStatus);
        setPollCount(0);
      } else {
        setPollCount(prev => {
          const newCount = prev + 1;
          if (newCount >= maxPollAttempts) {
            setErrorMsg('Payment confirmation timed out. The QR code expired before the bank confirmed your payment.');
            setStatus('EXPIRED');
            return newCount;
          }
          return newCount;
        });
      }
    } catch (e) {
      console.error("Status check failed", e);
      setPollCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (invoiceNo) {
      initPayment();
    }
  }, [invoiceNo]);

  useEffect(() => {
    let timer;
    if (transactionId && status === 'PENDING' && pollCount < maxPollAttempts) {
      pollStatus();
      timer = setInterval(pollStatus, 5000); // Polling every 5 seconds
    }
    return () => clearInterval(timer);
  }, [transactionId, status, pollCount]);

  useEffect(() => {
    if (status !== 'PAID') return;
    window.alert(`Payment successful!\nInvoice #${invoiceNo} has been paid.`);
    clearCart();
    const redirectTimer = setTimeout(() => navigate(`/order-success/${invoiceNo}`), 1200);
    return () => clearTimeout(redirectTimer);
  }, [status, clearCart, invoiceNo, navigate]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">

        <div className="bg-brand p-6 text-white text-center rounded-b-3xl">
          <Link to="/" className="absolute left-6 top-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <Building2 className="w-12 h-12 mx-auto mb-3 text-white/90" />
          <h1 className="text-xl font-black">Checkout</h1>
          <p className="text-sm text-white/70 mt-1">Invoice #{invoiceNo}</p>
        </div>

        <div className="p-8 flex flex-col items-center">
          {status === 'PAID' ? (
            <div className="text-center animate-in zoom-in duration-500">
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-slate-900">Payment Successful!</h2>
              <p className="text-slate-500 mt-2">Redirecting to your order confirmation…</p>
              <Link to={`/order-success/${invoiceNo}`} className="mt-8 w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                View Order Confirmation
              </Link>
            </div>
          ) : status === 'FAILED' || status === 'EXPIRED' ? (
            <div className="text-center animate-in zoom-in duration-500 w-full">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-black text-slate-900">
                {status === 'EXPIRED' ? 'Payment Window Expired' : 'Payment Declined'}
              </h2>
              <p className="text-red-500 text-sm mt-2 p-4 bg-red-50 rounded-xl border border-red-100">
                {errorMsg || 'Payment confirmation took too long. Please try again.'}
              </p>
              <button onClick={() => window.location.reload()} className="mt-6 w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all">Try Again</button>
            </div>
          ) : errorMsg ? (
            <div className="text-center animate-in zoom-in duration-500 w-full">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-black text-slate-900">Payment Error</h2>
              <div className="text-red-500 text-sm mt-4 p-4 bg-red-50 rounded-xl border border-red-200 space-y-3">
                <p className="font-medium">{errorMsg}</p>
                <div className="pt-3 border-t border-red-200 text-xs">
                  <p className="font-semibold text-red-700 mb-2">💡 Minimum Payment Requirement:</p>
                  <p className="text-red-600">
                    • Minimum: <span className="font-black">${PAYMENT_CONSTANTS.MIN_AMOUNT_USD}</span> USD
                  </p>
                  <p className="text-red-600">
                    • Or: <span className="font-black">{PAYMENT_CONSTANTS.MIN_AMOUNT_KHR}</span> Riel (KHR)
                  </p>
                </div>
              </div>
              <button onClick={() => window.location.reload()} className="mt-6 w-full py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-all">Try Again</button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-slate-500 font-medium">Total Amount</p>
                <h2 className="text-3xl font-black text-slate-900 mt-1">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)}
                </h2>
                <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Minimum payment: ${PAYMENT_CONSTANTS.MIN_AMOUNT_USD} / {PAYMENT_CONSTANTS.MIN_AMOUNT_KHR} Riel
                </p>
              </div>

              <div className="relative p-6 bg-slate-50 rounded-3xl border-2 border-brand/10 mb-8 w-full flex justify-center">
                {qrImage ? (
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <img src={`data:image/png;base64,${qrImage}`} alt="KHQR Code" className="w-[220px] h-[220px]" />
                  </div>
                ) : qr && (
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <QRCodeSVG value={qr} size={220} level="M" includeMargin={false} />
                  </div>
                )}
                <div className="absolute inset-0 border-4 border-brand/5 rounded-3xl pointer-events-none"></div>
              </div>

              <div className="space-y-4 w-full">
                <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <QrCode className="w-5 h-5 text-brand mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-700 font-bold mb-1">Scan with your bank app:</p>
                    <p className="text-xs text-blue-700">ACleda Bank • ABA Bank • Wing Bank • Other KHQR supported banks</p>
                  </div>
                </div>

                <div className="h-1 bg-slate-100 rounded-full w-full overflow-hidden">
                  <div 
                    className="h-full bg-brand transition-all duration-300"
                    style={{width: `${Math.min((pollCount / maxPollAttempts) * 100, 100)}%`}}
                  ></div>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                  {pollCount > 0 ? `Waiting... (${Math.ceil((maxPollAttempts - pollCount) * 5 / 60)}m remaining)` : 'Waiting for bank confirmation...'}
                </p>

              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-400 font-medium flex items-center">
        <AlertCircle className="w-3 h-3 mr-1.5" /> Secure payment powered by Blueberry CRM
      </p>
    </div>
  );
};

export default Checkout;
