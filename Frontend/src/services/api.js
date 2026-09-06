import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.url?.includes('/auth/')) {
      delete config.headers.Authorization;
      return config;
    }
    const token = localStorage.getItem('admin_token') || localStorage.getItem('customer_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('customer_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/admin/login', credentials),
  customerLogin: (credentials) => api.post('/auth/customer/login', credentials),
  register: (data) => api.post('/auth/customer/register', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  loginOAuth2Code: (data) => api.post('/auth/oauth2/code', data),
};

export const dashboardApi = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getCustomerStats: (id) => api.get(`/admin/dashboard/customer/${id}`),
};

export const orderApi = {
  getAll: () => api.get('/orders/admin/all'),
  updateStatus: (id, status) => api.put(`/orders/admin/${id}/status`, { status }),
  getCustomerOrders: (customerId) => api.get(`/orders/my/${customerId}`),
  placeOrder: (orderData) => api.post('/orders', orderData),
  getByInvoice: (invoiceNo) => api.get(`/orders/invoice/${invoiceNo}`),
  cancelOrder: (id) => api.put(`/orders/admin/${id}/status`, { status: 'CANCELLED' }),
  returnOrder: (id, reason) => api.put(`/orders/admin/${id}/status`, { status: 'RETURNED', reason }),
};



export const productApi = {
  getProducts: (page = 0, size = 12, sortBy = 'productId') =>
    api.get('/products', { params: { page, size, sortBy } }),
  getFeatured: () => api.get('/products/featured'),
  getById: (id) => api.get(`/products/${id}`),
  search: (keyword) => api.get('/products/search', { params: { keyword } }),
  getByCategory: (catId) => api.get(`/products/category/${catId}`),
  getBySubCategory: (pCatId) => api.get(`/products/subcategory/${pCatId}`),
  getByManufacturer: (manufacturerId) => api.get(`/products/manufacturer/${manufacturerId}`),
  getByLabel: (label) => api.get(`/products/label/${label}`),
  admin: {

    create: (formData) =>
      api.post('/admin/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),

    createJson: (data) => api.post('/admin/products/json', data),
    update: (id, formData) =>
      api.put(`/admin/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    delete: (id) => api.delete(`/admin/products/${id}`),
  },
};

export const customerApi = {
  getAll: () => api.get('/customers/admin/all'),
  getById: (id) => api.get(`/customers/${id}`),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  create: (data) => api.post('/customers/admin/create', data),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/customers/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadImageBase64: (id, base64) =>
    api.post(`/customers/${id}/image-base64`, { file: base64 }),
  getPaymentsByInvoice: (invoiceNo) => api.get(`/customers/payments/${invoiceNo}`),
  addPayment: (payment) => api.post('/customers/payments', payment),
};

export const catalogApi = {
  getCategories: () => api.get('/categories'),
  getTopCategories: () => api.get('/categories/top'),
  getCategoryById: (id) => api.get(`/categories/${id}`),
  getManufacturers: () => api.get('/manufacturers'),
  getTopManufacturers: () => api.get('/manufacturers/top'),
  admin: {
    createCategory: (formData) => api.post('/admin/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    updateCategory: (id, formData) => api.put(`/admin/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
    createManufacturer: (formData) => api.post('/admin/manufacturers', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    updateManufacturer: (id, formData) => api.put(`/admin/manufacturers/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deleteManufacturer: (id) => api.delete(`/admin/manufacturers/${id}`),
  }
};


export const couponApi = {
  getAll: () => api.get('/coupons/admin/all'),
  create: (coupon) => api.post('/coupons/admin', coupon),
  update: (id, coupon) => api.put(`/coupons/admin/${id}`, coupon),
  delete: (id) => api.delete(`/coupons/admin/${id}`),
  validate: (code) => api.get(`/coupons/validate/${code}`),
  apply: (code) => api.post(`/coupons/apply/${code}`),
};


export const cartApi = {
  get: () => api.get('/cart'),
  add: (cartItem) => api.post('/cart', cartItem),
  updateQty: (pId, qty) => api.put(`/cart/${pId}`, null, { params: { qty } }),
  remove: (pId) => api.delete(`/cart/${pId}`),
  clear: () => api.delete('/cart/clear'),
};

export const wishlistApi = {
  get: (customerId) => api.get(`/wishlist/${customerId}`),
  toggle: (customerId, productId) => api.post('/wishlist', { customerId, productId }),
  remove: (customerId, productId) => api.delete(`/wishlist/${customerId}/${productId}`),
};


export const cmsApi = {
  getAbout: () => api.get('/cms/about'),
  updateAbout: (id, data) => api.put(`/cms/about/${id}`, data),
  getContact: () => api.get('/cms/contact'),
  updateContact: (id, data) => api.put(`/cms/contact/${id}`, data),
  getTerms: () => api.get('/cms/terms'),
  getTermByLink: (link) => api.get(`/cms/terms/${link}`),
  getStores: () => api.get('/cms/stores'),
  getEnquiryTypes: () => api.get('/cms/enquiry-types'),
};

export const paymentApi = {
  create: (data) => api.post('/payment/create', data),
  getStatus: (transactionId) => api.get(`/payment/status/${transactionId}`),
  webhook: (data) => api.post('/payment/webhook', data),
  getAll: () => api.get('/admin/payments/all'),
};

export const adminApi = {
  getProfile: (id) => api.get(`/admin/profile/${id}`),
  uploadProfileImage: (id, formData) =>
    api.post(`/admin/profile/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  resetData: () => api.delete('/admin/reset-data'),
};

export const contactApi = {
  send: (data) => api.post('/contact/send', data),
};

export const fileUrl = (filename) => `${import.meta.env.VITE_API_URL || '/api'}/files/${filename}`;

export default api;

