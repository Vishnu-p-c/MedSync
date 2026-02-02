import { useState, useEffect, useCallback } from "react";
import SideNav from "../components/SideNav";
import TopNavbar from "../components/TopNavbar";
import GlassSurface from "../components/GlassSurface/GlassSurface";
import { getDriversNearHospital, getDriversSummary } from "../api/ambulanceApi";

export default function AmbulanceDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    on_assignment: 0,
    available: 0
  });
  const [hospitalName, setHospitalName] = useState('');
  
  const userId = localStorage.getItem('userId'); // This is the admin_id

  // Fetch drivers data
  const fetchDrivers = useCallback(async () => {
    if (!userId) {
      setError('No admin ID found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getDriversNearHospital(userId);
      
      if (result.success) {
        setDrivers(result.data);
        setHospitalName(result.hospitalName || '');
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch drivers');
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('An error occurred while fetching drivers');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await getDriversSummary(userId);
      
      if (result.success) {
        setSummary(result.data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, [userId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchDrivers();
    fetchSummary();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDrivers();
      fetchSummary();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDrivers, fetchSummary]);

  // Get status badge styling
  const getStatusBadge = (isActive) => {
    if (isActive) {
      return {
        className: "bg-green-500/20 text-green-400",
        text: "Active"
      };
    }
    return {
      className: "bg-red-500/20 text-red-400",
      text: "Inactive"
    };
  };

  return (
    <div className="min-h-screen w-full bg-[#030B12] overflow-x-hidden">
      <SideNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="min-h-screen w-full lg:pl-64 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[#0a1628] text-white border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Ambulances</h1>
          <div className="w-10"></div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <TopNavbar title="Ambulances" subtitle="Ambulance Management Dashboard" />
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Title */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-4 sm:mb-6">
            Ambulance Management
          </h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4"
            >
              <p className="text-white/60 text-xs sm:text-sm">Total Drivers</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{summary.total}</p>
            </GlassSurface>
            
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4"
            >
              <p className="text-white/60 text-xs sm:text-sm">Active</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">{summary.active}</p>
            </GlassSurface>
            
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4"
            >
              <p className="text-white/60 text-xs sm:text-sm">On Assignment</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">{summary.on_assignment}</p>
            </GlassSurface>
            
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4"
            >
              <p className="text-white/60 text-xs sm:text-sm">Inactive</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-400">{summary.inactive}</p>
            </GlassSurface>
          </div>

          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Active Ambulance Drivers Card */}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4 sm:p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Ambulance Drivers
                </h2>
                {hospitalName && (
                  <span className="text-sm text-white/60 hidden sm:inline">
                    {hospitalName}
                  </span>
                )}
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-white/60">Loading drivers...</span>
                  </div>
                </div>
              )}

              {/* Error State */}
              {!loading && error && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-400">{error}</span>
                    <button 
                      onClick={fetchDrivers}
                      className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && drivers.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                    <span className="text-white/60">No ambulance drivers found</span>
                  </div>
                </div>
              )}

              {/* Drivers Table */}
              {!loading && !error && drivers.length > 0 && (
                <div 
                  className="-mx-4 sm:mx-0"
                  style={{ 
                    overflowX: 'auto', 
                    WebkitOverflowScrolling: 'touch',
                    overflowY: 'visible'
                  }}
                >
                  <div className="min-w-[550px] px-4 sm:px-0">
                    {/* Table Header */}
                    <div className="grid grid-cols-[2fr_1.2fr_1fr_1.5fr] text-white/60 font-medium border-b border-white/10 pb-3 text-sm sm:text-base">
                      <span>Name</span>
                      <span>Vehicle #</span>
                      <span>Status</span>
                      <span>Last Login</span>
                    </div>

                    {/* Rows */}
                    {drivers.map((driver) => {
                      const status = getStatusBadge(driver.is_active);
                      
                      return (
                        <div
                          key={driver.driver_id}
                          className="grid grid-cols-[2fr_1.2fr_1fr_1.5fr] items-center py-3 sm:py-4 border-b border-white/5 hover:bg-white/5 transition-colors text-sm sm:text-base"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 shrink-0 flex items-center justify-center">
                              <span className="text-white/60 text-sm font-medium">
                                {driver.first_name?.charAt(0)?.toUpperCase() || 'D'}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="truncate text-white">{driver.full_name}</span>
                              {driver.distance_km !== null && (
                                <span className="text-xs text-white/40">{driver.distance_km} km away</span>
                              )}
                            </div>
                          </div>

                          <span className="text-white/60">
                            {driver.vehicle_number || 'N/A'}
                          </span>

                          <span
                            className={`px-2 sm:px-4 py-1 rounded-full text-xs sm:text-sm w-fit ${status.className}`}
                          >
                            {status.text}
                          </span>

                          <span className="text-white/60 truncate">
                            {driver.last_login ? new Date(driver.last_login).toLocaleString() : 'Never'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </GlassSurface>
          </div>
        </main>
      </div>
    </div>
  );
}


