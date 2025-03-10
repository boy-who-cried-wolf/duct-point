
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

// Pages
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import Organization from "../pages/Organization";
import AdminDashboard from "../pages/AdminDashboard";
import Transactions from "../pages/Transactions";
import Courses from "../pages/Courses";
import NotFound from "../pages/NotFound";

// ProtectedRoute is now a pass-through component
import ProtectedRoute from "../components/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* Login page is accessible but not needed */}
      <Route path="/login" element={<Login />} />
      
      {/* All routes are now accessible without auth */}
      <Route path="/dashboard" element={
        <MainLayout>
          <Dashboard />
        </MainLayout>
      } />
      
      <Route path="/profile" element={
        <MainLayout>
          <Profile />
        </MainLayout>
      } />
      
      <Route path="/organization" element={
        <MainLayout>
          <Organization />
        </MainLayout>
      } />
      
      <Route path="/admin" element={
        <MainLayout>
          <AdminDashboard />
        </MainLayout>
      } />
      
      <Route path="/transactions" element={
        <MainLayout>
          <Transactions />
        </MainLayout>
      } />
      
      <Route path="/courses" element={
        <MainLayout>
          <Courses />
        </MainLayout>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
