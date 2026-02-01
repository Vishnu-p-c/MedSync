import { useState, useEffect, useCallback } from "react";
import SideNav from "../components/SideNav";
import GlassSurface from "../components/GlassSurface/GlassSurface";
import axiosInstance from "../utils/axiosInstance";
import { getSosSummary } from "../api/sosApi";

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeAmbulances, setActiveAmbulances] = useState(0);
  const [ambulanceLoading, setAmbulanceLoading] = useState(true);
  const [doctorsData, setDoctorsData] = useState({ totalDoctors: 0, doctorsOnDuty: 0 });
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [rushLevel, setRushLevel] = useState('LOW');
  const [rushLoading, setRushLoading] = useState(true);
  const [sosData, setSosData] = useState({ total: 0, pending: 0, inProgress: 0, assigned: 0 });
  const [sosLoading, setSosLoading] = useState(true);
  const userName = localStorage.getItem('userName') || 'Admin';
  const userId = localStorage.getItem('userId'); // This is the admin_id

  // Fetch active ambulance count
  useEffect(() => {
    const fetchActiveAmbulances = async () => {
      try {
        const response = await axiosInstance.get('/driver/active-count');
        if (response.data.status === 'success') {
          setActiveAmbulances(response.data.activeDrivers);
        }
      } catch (error) {
        console.error('Error fetching active ambulances:', error);
      } finally {
        setAmbulanceLoading(false);
      }
    };

    fetchActiveAmbulances();
  }, []);

  // Fetch doctors count for this admin's hospital
  useEffect(() => {
    const fetchDoctorsCount = async () => {
      if (!userId) {
        console.error('No admin ID found in localStorage');
        setDoctorsLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/admin/dashboard/doctors-count?admin_id=${userId}`);
        if (response.data.status === 'success') {
          setDoctorsData({
            totalDoctors: response.data.totalDoctors,
            doctorsOnDuty: response.data.doctorsOnDuty
          });
        }
      } catch (error) {
        console.error('Error fetching doctors count:', error);
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctorsCount();
  }, [userId]);

  // Fetch rush level with real-time polling
  const fetchRushLevel = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await axiosInstance.get(`/admin/rush/level?admin_id=${userId}`);
      if (response.data.status === 'success') {
        setRushLevel(response.data.rushLevel);
      }
    } catch (error) {
      console.error('Error fetching rush level:', error);
    } finally {
      setRushLoading(false);
    }
  }, [userId]);

  // Fetch SOS summary with real-time polling
  const fetchSosSummary = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await getSosSummary(userId);
      if (result.success) {
        setSosData({
          total: result.data.total,
          pending: result.data.pending,
          inProgress: result.data.inProgress,
          assigned: result.data.assigned
        });
      }
    } catch (error) {
      console.error('Error fetching SOS summary:', error);
    } finally {
      setSosLoading(false);
    }
  }, [userId]);

  // Initial fetch and polling for real-time updates (every 30 seconds)
  useEffect(() => {
    fetchRushLevel();
    fetchSosSummary();

    // Set up polling interval for real-time updates
    const pollInterval = setInterval(() => {
      fetchRushLevel();
      fetchSosSummary();
    }, 30000); // Poll every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, [fetchRushLevel, fetchSosSummary]);

  // Sample data - replace with API calls
  const dashboardData = {
    rushLevel: rushLevel,
    doctorsOnDuty: { current: 120, total: 150 },
    sosRequests: sosData,
    activeAmbulances: 8,
    criticalAlerts: [
      { id: 1, type: 'Low Stock', item: 'Epinephrine (Critical)', message: 'Critical message' },
      { id: 2, type: 'Equipment Fault', item: 'Ventilator A4 (ICU)', message: 'Critical message' }
    ],
    patientInflow: [25, 30, 45, 55, 40, 50, 60, 55, 65, 70, 75, 80, 85],
    sosTrend: [10, 12, 15, 13, 18, 15, 20, 17, 22, 18, 20, 15, 18]
  };

  // Rush level color
  const getRushColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  // Rush level background color
  const getRushBgColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500/20';
      case 'HIGH': return 'bg-orange-500/20';
      case 'MEDIUM': return 'bg-yellow-500/20';
      default: return 'bg-green-500/20';
    }
  };

  // Get needle rotation angle based on rush level (from -90 to 90 degrees)
  const getNeedleRotation = (level) => {
    switch (level) {
      case 'CRITICAL': return 60;  // Far right (red zone)
      case 'HIGH': return 30;      // Right-center (orange zone)
      case 'MEDIUM': return -15;   // Center-left (yellow zone)
      default: return -60;         // Far left (green zone)
    }
  };

  // Get needle color based on rush level
  const getNeedleColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      default: return '#22c55e';
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030B12] overflow-x-hidden">
      <SideNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="min-h-screen w-full lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[#0a1628] text-white p-4 flex items-center justify-between sticky top-0 z-30 border-b border-white/10">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-bold">Dashboard</span>
          <div className="w-10"></div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard </h1>
            <p className="text-white/60 text-sm">Monitor and manage hospital equipment inventory</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-white">Admin {userName}</span>
            <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-4 sm:p-6">
          {/* Top Row - Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Hospital Rush Level */}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4"
            >
              <h3 className="text-white font-semibold mb-4">Hospital Rush Level</h3>
              <div className="flex flex-col items-center">
                {/* Gauge */}
                <div className="relative w-32 h-16 mb-2">
                  {rushLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-white/60">Loading...</span>
                    </div>
                  ) : (
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      {/* Background arc */}
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#1e3a5f"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      {/* Colored arc */}
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="url(#rushGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="126"
                        strokeDashoffset="25"
                      />
                      <defs>
                        <linearGradient id="rushGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="50%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                      {/* Needle - dynamically positioned based on rush level */}
                      <line
                        x1="50"
                        y1="50"
                        x2="50"
                        y2="15"
                        stroke={getNeedleColor(rushLevel)}
                        strokeWidth="2"
                        transform={`rotate(${getNeedleRotation(rushLevel)} 50 50)`}
                        style={{ transition: 'transform 0.5s ease-in-out' }}
                      />
                      <circle cx="50" cy="50" r="4" fill={getNeedleColor(rushLevel)} />
                    </svg>
                  )}
                </div>
                <span className={`px-4 py-1 rounded-full text-sm font-bold ${getRushBgColor(rushLevel)} ${getRushColor(rushLevel)}`}>
                  {rushLoading ? '...' : rushLevel}
                </span>
              </div>
            </GlassSurface>

            {/* Doctors on Duty*/}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4"
            >
              <div className="mb-4 flex flex-col  justify-center h-full ">
                <p className="text-white/60 text-sm mb-2">Doctors on Duty</p>
                <div className="flex  gap-2 pt-6 ">
                  {doctorsLoading ? (
                    <span className="text-4xl font-bold text-white">...</span>
                  ) : (
                    <span className="text-4xl font-bold text-white ">
                      {doctorsData.doctorsOnDuty}/{doctorsData.totalDoctors}
                    </span>
                  )}
                </div>
              </div>
            </GlassSurface>

            {/* Active Ambulances */}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4"
            >
              <p className="text-white/60 text-sm mb-2">Active Ambulances</p>
              <div className="flex items-center gap-2 mb-3">
                {ambulanceLoading ? (
                  <span className="text-3xl font-bold text-yellow-400">...</span>
                ) : (
                  <span className="text-3xl font-bold text-yellow-400">{activeAmbulances}</span>
                )}
                <span className="text-white/60">On Duty</span>
              </div>
              {/* Mini Map Placeholder */}
              <div className="bg-blue-900/30 rounded-lg h-20 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-50">
                  <svg viewBox="0 0 100 60" className="w-full h-full">
                    <path d="M10,30 Q30,10 50,30 T90,30" stroke="#3b82f6" fill="none" strokeWidth="1" />
                    <path d="M20,40 Q40,20 60,40 T100,40" stroke="#3b82f6" fill="none" strokeWidth="1" />
                    <circle cx="30" cy="25" r="3" fill="#22c55e" />
                    <circle cx="60" cy="35" r="3" fill="#22c55e" />
                    <circle cx="75" cy="20" r="3" fill="#22c55e" />
                  </svg>
                </div>
                <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full z-10">
                  {ambulanceLoading ? '...' : activeAmbulances}
                </div>
              </div>
            </GlassSurface>

            {/* SOS Requests Summary */}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4"
            >
              <p className="text-white font-semibold mb-3">SOS Requests</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-yellow-500/20 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-yellow-400">
                    {sosLoading ? '...' : sosData.total}
                  </p>
                  <p className="text-xs text-yellow-400">Total</p>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {sosLoading ? '...' : sosData.inProgress}
                  </p>
                  <p className="text-xs text-blue-400">In Progress</p>
                </div>
                <div className="bg-red-500/20 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-red-400">
                    {sosLoading ? '...' : sosData.pending}
                  </p>
                  <p className="text-xs text-red-400">Pending</p>
                </div>
               
              
                <div className="bg-green-500/20 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {sosLoading ? '...' : sosData.assigned}
                  </p>
                  <p className="text-xs text-green-400">Assigned</p>
                </div>
              </div>
            </GlassSurface>
          </div>

          {/* Second Row - Alerts and Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Critical Alerts */}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-white font-semibold">Critical Alerts</h3>
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {dashboardData.criticalAlerts.length}
                </span>
              </div>
              <div className="space-y-3">
                {dashboardData.criticalAlerts.map((alert, index) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-yellow-400 font-medium text-sm">{alert.type}</p>
                      <p className="text-white text-sm">{alert.item}</p>
                      <p className="text-white/40 text-xs">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassSurface>

            {/* Patient Inflow Chart */}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4"
            >
              <h3 className="text-white font-semibold mb-4">Patient Inflow (Last 24h)</h3>
              <div className="h-40 flex items-end justify-between gap-1">
                {/* Simple line chart representation */}
                <svg viewBox="0 0 200 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="inflowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <path
                    d="M0,80 L15,75 L30,60 L45,50 L60,65 L75,55 L90,45 L105,50 L120,40 L135,35 L150,30 L165,25 L180,20 L200,15 L200,100 L0,100 Z"
                    fill="url(#inflowGradient)"
                  />
                  {/* Line */}
                  <path
                    d="M0,80 L15,75 L30,60 L45,50 L60,65 L75,55 L90,45 L105,50 L120,40 L135,35 L150,30 L165,25 L180,20 L200,15"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  {/* X-axis labels */}
                  <text x="15" y="98" fill="#ffffff60" fontSize="8">8</text>
                  <text x="60" y="98" fill="#ffffff60" fontSize="8">12</text>
                  <text x="105" y="98" fill="#ffffff60" fontSize="8">16</text>
                  <text x="150" y="98" fill="#ffffff60" fontSize="8">20</text>
                </svg>
              </div>
            </GlassSurface>

            {/* SOS Trend Chart */}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4"
            >
              <h3 className="text-white font-semibold mb-4">SOS Trend</h3>
              <div className="h-40 flex items-end justify-between gap-1 px-2">
                {dashboardData.sosTrend.map((value, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-red-500 rounded-t"
                    style={{ height: `${(value / 25) * 100}%`, minWidth: '8px', maxWidth: '20px' }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-white/40 text-xs mt-2 px-2">
                <span>8</span>
                <span>12</span>
                <span>16</span>
                <span>20</span>
              </div>
            </GlassSurface>
          </div>

          {/* Third Row - More Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Critical Alerts List */}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4"
            >
              <h3 className="text-white font-semibold mb-4">Critical Alerts</h3>
              <div className="space-y-3">
                {dashboardData.criticalAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-1zm0-4V7h2v6h-2z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-yellow-400 font-medium">{alert.type}</p>
                        <p className="text-white/60 text-sm">{alert.item}</p>
                        <p className="text-white/40 text-xs">{alert.message}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </GlassSurface>

            {/* SOS Requests Detailed */}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4"
            >
              <h3 className="text-white font-semibold mb-4">SOS Requests</h3>
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <p className="text-4xl font-bold text-white">{dashboardData.sosRequests.total}</p>
                  <p className="text-white/60 text-sm">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{dashboardData.sosRequests.pending}</p>
                  <p className="text-red-400 text-xs">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{dashboardData.sosRequests.inProgress}</p>
                  <p className="text-blue-400 text-xs">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{dashboardData.sosRequests.assigned}</p>
                  <p className="text-green-400 text-xs">Assigned</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-black">!</span>
                  </div>
                  <span className="text-white/60">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-white/60">In Progress</span>
                </div>
              </div>
            </GlassSurface>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
