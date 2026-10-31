import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

const AdminLayout = lazy(() => import('./components/AdminLayout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const OAuth2Callback = lazy(() => import('./pages/OAuth2Callback'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const Orders = lazy(() => import('./pages/Orders'));
const Products = lazy(() => import('./pages/Products'));
const Coupons = lazy(() => import('./pages/Coupons'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Analytics = lazy(() => import('./pages/Analytics'));
const CMS = lazy(() => import('./pages/CMS'));
const Settings = lazy(() => import('./pages/Settings'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Payments = lazy(() => import('./pages/Payments'));
const Checkout = lazy(() => import('./pages/Checkout'));
const WebsiteLayout = lazy(() => import('./components/website/WebsiteLayout'));
const Home = lazy(() => import('./pages/website/Home'));
const Shop = lazy(() => import('./pages/website/Shop'));
const ProductDetail = lazy(() => import('./pages/website/ProductDetail'));
const Cart = lazy(() => import('./pages/website/Cart'));
const Wishlist = lazy(() => import('./pages/website/Wishlist'));
const About = lazy(() => import('./pages/website/About'));
const Contact = lazy(() => import('./pages/website/Contact'));
const OrderSuccess = lazy(() => import('./pages/website/OrderSuccess'));
const MyOrders = lazy(() => import('./pages/website/MyOrders'));
const OrderDetail = lazy(() => import('./pages/website/OrderDetail'));

/* Smart root redirect */
const RootRedirect = () => {
  const port = window.location.port;
  const token = localStorage.getItem('admin_token') || localStorage.getItem('customer_token');
  
  if (port === '5174') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/home" replace />;
};

function App() {
  return (
    <Router>
      <CartProvider>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center" role="status">Loading...</div>}>
          <Routes>
          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* ══════════════ Public Website ══════════════ */}
          <Route element={<WebsiteLayout />}>
            <Route path="/home"            element={<Home />} />
            <Route path="/shop"            element={<Shop />} />
            <Route path="/product/:id"     element={<ProductDetail />} />
            <Route path="/cart"            element={<Cart />} />
            <Route path="/wishlist"        element={<Wishlist />} />
            <Route path="/about"           element={<About />} />
            <Route path="/contact"         element={<Contact />} />
            <Route path="/my-orders"       element={<MyOrders />} />
            <Route path="/order-success/:invoiceNo" element={<OrderSuccess />} />
            <Route path="/order/:invoiceNo"         element={<OrderDetail />} />
          </Route>

          {/* ══════════════ Auth pages ══════════════ */}
          <Route path="/login"                   element={<Login />} />
          <Route path="/register"                element={<Register />} />
          <Route path="/oauth2/callback"         element={<OAuth2Callback />} />
          <Route path="/checkout/:invoiceNo"     element={<Checkout />} />

          {/* ══════════════ Protected Dashboard ══════════════ */}
          <Route path="/" element={<AdminLayout />}>
            <Route path="dashboard"  element={<Dashboard />} />
            <Route path="analytics"  element={<Analytics />} />
            <Route path="customers"  element={<Customers />} />
            <Route path="orders"     element={<Orders />} />
            <Route path="products"   element={<Products />} />
            <Route path="invoices"   element={<Invoices />} />
            <Route path="payments"   element={<Payments />} />
            <Route path="coupons"    element={<Coupons />} />
            <Route path="catalog"    element={<Catalog />} />
            <Route path="cms"        element={<CMS />} />
            <Route path="settings"   element={<Settings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </CartProvider>
    </Router>
  );
}

export default App;
