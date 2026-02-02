import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAlertsSummary } from "../api/alertsApi";

function SideNav({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [alertCount, setAlertCount] = useState(0);

  // Fetch alert count for badge
  useEffect(() => {
    const fetchAlertCount = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      
      try {
        const response = await getAlertsSummary(userId);
        if (response.status === 'success') {
          setAlertCount(response.data?.critical || 0);
        }
      } catch (error) {
        console.error('Error fetching alert count:', error);
      }
    };
    
    fetchAlertCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    // Redirect to login
    navigate('/login');
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        w-64 bg-[#2c3e50] text-white flex flex-col h-screen fixed left-0 top-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Close button for mobile */}
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-2 text-white/70 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z"/>
            </svg>
          </div>
          <span className="text-xl font-bold">MedSync</span>
        </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <a 
          href="/admin-dashboard"
          onClick={handleNavClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
            currentPath === '/admin-dashboard' || currentPath === '/' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
          </svg>
          <span>Dashboard</span>
        </a>

        <a 
          href="/doctors"
          onClick={handleNavClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
            currentPath === '/doctors' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
          </svg>
          <span>Doctors</span>
        </a>

        <a 
          href="#"
          onClick={handleNavClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors mb-1"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <span>SOS &amp; Emergencies</span>
        </a>

        <a 
          href="/ambulance-dashboard"
          onClick={handleNavClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
            currentPath === '/ambulance-dashboard' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"/>
          </svg>
          <span>Ambulances</span>
        </a>

        <a 
          href="/equipment"
          onClick={handleNavClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
            currentPath === '/equipment' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/>
          </svg>
          <span>Equipment</span>
        </a>

       
        <a 
          href="/alerts"
          onClick={handleNavClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
            currentPath === '/alerts' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <span>Alerts</span>
          {alertCount > 0 && (
            <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full text-xs font-medium flex items-center justify-center">
              {alertCount > 99 ? '99+' : alertCount}
            </span>
          )}
        </a>

        <a 
          href="/settings"
          onClick={handleNavClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            currentPath === '/settings' 
              ? 'bg-blue-600 text-white' 
              : 'text-slate-300 hover:bg-slate-700'
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
          </svg>
          <span>Settings</span>
        </a>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 transition-colors w-full mt-4"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
          </svg>
          <span>Logout</span>
        </button>
      </nav>
    </aside>
    </>
  );
}

export default SideNav;
