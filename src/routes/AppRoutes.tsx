
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Organization from '@/pages/Organization';
import Transactions from '@/pages/Transactions';
import Courses from '@/pages/Courses';
import AdminDashboard from '@/pages/AdminDashboard';
import TestEmail from '@/pages/TestEmail';
import ResetPassword from '@/pages/ResetPassword';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<NotFound />} />
      
      {/* Protected routes - any authenticated user */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/organization" element={<Organization />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/courses" element={<Courses />} />
      </Route>
      
      {/* Staff only routes */}
      <Route element={<ProtectedRoute requireStaff />}>
        <Route path="/test-email" element={<TestEmail />} />
      </Route>
      
      {/* Admin only routes */}
      <Route element={<ProtectedRoute requireAdmin />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
