import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Stores
import useAuthStore from './store/authStore';
import useSettingsStore from './store/settingsStore';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages - Public
import Landing from './pages/Landing';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import SocialCallback from './pages/auth/SocialCallback';

// Pages - User Dashboard
import UserDashboard from './pages/dashboard/UserDashboard';
import Servers from './pages/dashboard/Servers';
import ServerDetail from './pages/dashboard/ServerDetail';
import Orders from './pages/dashboard/Orders';
import OrderDetail from './pages/dashboard/OrderDetail';
import Products from './pages/dashboard/Products';
import ProductDetail from './pages/dashboard/ProductDetail';
import Billing from './pages/dashboard/Billing';
import Profile from './pages/dashboard/Profile';

// Pages - Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminUserDetail from './pages/admin/UserDetail';
import AdminProducts from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/Orders';
import AdminServers from './pages/admin/Servers';
import AdminSettings from './pages/admin/Settings';
import AdminPterodactyl from './pages/admin/Pterodactyl';
import AdminCoins from './pages/admin/Coins';
import AdminCoupons from './pages/admin/Coupons';

// Components
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const initAuth = useAuthStore((state) => state.init);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const branding = useSettingsStore((state) => state.branding);

  useEffect(() => {
    initAuth();
    loadSettings();
  }, [initAuth, loadSettings]);

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          } />
          <Route path="/register" element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          } />
          <Route path="/forgot-password" element={
            <AuthLayout>
              <ForgotPassword />
            </AuthLayout>
          } />
          <Route path="/reset-password" element={
            <AuthLayout>
              <ResetPassword />
            </AuthLayout>
          } />
          <Route path="/auth/social" element={<SocialCallback />} />

          {/* User Dashboard Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/servers" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Servers />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/servers/:id" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ServerDetail />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Orders />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/orders/:id" element={
            <ProtectedRoute>
              <DashboardLayout>
                <OrderDetail />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Products />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/products/:id" element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProductDetail />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/billing" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Billing />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users/:id" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminUserDetail />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminProducts />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products/new" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminProductForm />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products/:id" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminProductForm />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/servers" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminServers />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminSettings />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/pterodactyl" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminPterodactyl />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/coins" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminCoins />
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/coupons" element={
            <ProtectedRoute requireAdmin>
              <AdminLayout>
                <AdminCoupons />
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;