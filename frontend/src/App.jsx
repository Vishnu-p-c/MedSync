// App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AmbulanceDashboard from "./pages/AmbulanceDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/ambulance-dashboard" element={<AmbulanceDashboard />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

