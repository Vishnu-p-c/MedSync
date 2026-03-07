// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Discover from "./pages/Discover";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AmbulanceDashboard from "./pages/AmbulanceDashboard";
import Doctors from "./pages/Doctors";
import Equipment from "./pages/Equipment";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import SosEmergencies from "./pages/SosEmergencies";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ambulance-dashboard" 
          element={
            <ProtectedRoute>
              <AmbulanceDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctors" 
          element={
            <ProtectedRoute>
              <Doctors />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/equipment" 
          element={
            <ProtectedRoute>
              <Equipment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/alerts" 
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/sos-emergencies" 
          element={
            <ProtectedRoute>
              <SosEmergencies />
            </ProtectedRoute>
          } 
        />
        {/* Catch all unmatched routes */}
        <Route 
          path="*" 
          element={
            isAuthenticated ? (
              <Navigate to="/admin-dashboard" replace />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

