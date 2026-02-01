import { useState, useEffect, useCallback } from "react";
import SideNav from "../components/SideNav";
import TopNavbar from "../components/TopNavbar";
import GlassSurface from "../components/GlassSurface/GlassSurface";
import axiosInstance from "../utils/axiosInstance";
import { getSosSummary, getSosTrend } from "../api/sosApi";

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
  const [sosTrendData, setSosTrendData] = useState([]);
  const [sosTrendLoading, setSosTrendLoading] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [patientInflowData, setPatientInflowData] = useState([]);
  const [patientInflowLoading, setPatientInflowLoading] = useState(true);
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

  // Fetch SOS trend data for chart
  const fetchSosTrend = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await getSosTrend(userId);
      if (result.success) {
        setSosTrendData(result.data);
      }
    } catch (error) {
      console.error('Error fetching SOS trend:', error);
    } finally {
      setSosTrendLoading(false);
    }
  }, [userId]);

  // Fetch critical alerts (equipment maintenance and low stock)
  const fetchCriticalAlerts = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await axiosInstance.get(`/admin/dashboard/critical-alerts?admin_id=${userId}`);
      if (response.data.status === 'success') {
        setCriticalAlerts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching critical alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  }, [userId]);

  // Fetch patient inflow data for chart
  const fetchPatientInflow = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await axiosInstance.get(`/admin/dashboard/patient-inflow?admin_id=${userId}`);
      if (response.data.status === 'success') {
        setPatientInflowData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching patient inflow:', error);
    } finally {
      setPatientInflowLoading(false);
    }
  }, [userId]);

  // Initial fetch and polling for real-time updates (every 30 seconds)
  useEffect(() => {
    fetchRushLevel();
    fetchSosSummary();
    fetchSosTrend();
    fetchCriticalAlerts();
    fetchPatientInflow();

    // Set up polling interval for real-time updates
    const pollInterval = setInterval(() => {
      fetchRushLevel();
      fetchSosSummary();
      fetchSosTrend();
      fetchCriticalAlerts();
      fetchPatientInflow();
    }, 30000); // Poll every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(pollInterval);
  }, [fetchRushLevel, fetchSosSummary, fetchSosTrend, fetchCriticalAlerts, fetchPatientInflow]);

  // Sample data - replace with API calls
  const dashboardData = {
    rushLevel: rushLevel,
    doctorsOnDuty: { current: 120, total: 150 },
    sosRequests: sosData,
    activeAmbulances: 8
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
        {/* Mobile Header with hamburger menu */}
        <div className="lg:hidden">
          <header className="bg-[#0a1628] text-white p-4 flex items-center sticky top-0 z-30 border-b border-white/10">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors mr-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1">
              <TopNavbar />
            </div>
          </header>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <TopNavbar />
        </div>

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
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white font-semibold">Doctors on Duty</p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  {doctorsLoading ? (
                    <span className="text-4xl font-bold text-white">...</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-emerald-400">{doctorsData.doctorsOnDuty}</span>
                      <span className="text-2xl font-medium text-white/40">/{doctorsData.totalDoctors}</span>
                    </>
                  )}
                  <p className="text-white/40 text-xs mt-1">Available today</p>
                </div>
                <div className="w-16 h-16">
                  <svg viewBox="0 0 36 36" className="w-full h-full">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#1e3a5f"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeDasharray={`${doctorsLoading ? 0 : (doctorsData.doctorsOnDuty / doctorsData.totalDoctors) * 100}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
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
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-white font-semibold">Active Ambulances</p>
              </div>
              <div className="flex items-center gap-4 mb-3">
                {ambulanceLoading ? (
                  <span className="text-4xl font-bold text-amber-400">...</span>
                ) : (
                  <>
                    <span className="text-4xl font-bold text-amber-400">{activeAmbulances}</span>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span className="text-white/60 text-sm">On Duty</span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-white/40 text-xs">Active today</p>
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
                  {alertsLoading ? '...' : criticalAlerts.length}
                </span>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {alertsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="text-white/60">Loading alerts...</span>
                  </div>
                ) : criticalAlerts.length === 0 ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="text-center">
                      <svg className="w-10 h-10 mx-auto text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-white/60 text-sm">No critical alerts</span>
                    </div>
                  </div>
                ) : (
                  criticalAlerts.map((alert, index) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg">
                      <div className={`w-6 h-6 ${alert.severity === 'critical' ? 'bg-red-500/20' : 'bg-yellow-500/20'} rounded-full flex items-center justify-center ${alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'} text-sm font-bold`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`${alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'} font-medium text-sm`}>{alert.type}</p>
                        <p className="text-white text-sm truncate">{alert.item}</p>
                        <p className="text-white/40 text-xs">{alert.message}</p>
                      </div>
                    </div>
                  ))
                )}
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
              {patientInflowLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <span className="text-white/60">Loading...</span>
                </div>
              ) : (
                <div className="h-40 flex items-end justify-between gap-1">
                  <svg viewBox="0 0 200 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="inflowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {patientInflowData.length > 0 ? (
                      (() => {
                        const maxCount = Math.max(...patientInflowData.map(d => d.count), 1);
                        const points = patientInflowData.map((item, index) => {
                          const x = (index / (patientInflowData.length - 1)) * 200;
                          const y = 90 - (item.count / maxCount) * 80;
                          return `${x},${y}`;
                        });
                        const linePath = `M${points.join(' L')}`;
                        const areaPath = `M0,90 L${points.join(' L')} L200,90 Z`;
                        
                        return (
                          <>
                            {/* Area fill */}
                            <path d={areaPath} fill="url(#inflowGradient)" />
                            {/* Line */}
                            <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" />
                            {/* Data points */}
                            {patientInflowData.map((item, index) => {
                              const x = (index / (patientInflowData.length - 1)) * 200;
                              const y = 90 - (item.count / maxCount) * 80;
                              return (
                                <circle
                                  key={index}
                                  cx={x}
                                  cy={y}
                                  r="2"
                                  fill="#3b82f6"
                                  className="hover:r-4 cursor-pointer"
                                >
                                  <title>{`${item.label}: ${item.count} patients`}</title>
                                </circle>
                              );
                            })}
                            {/* X-axis labels */}
                            <text x="0" y="98" fill="#ffffff60" fontSize="7">{patientInflowData[0]?.hour}:00</text>
                            <text x="65" y="98" fill="#ffffff60" fontSize="7">{patientInflowData[Math.floor(patientInflowData.length / 3)]?.hour}:00</text>
                            <text x="130" y="98" fill="#ffffff60" fontSize="7">{patientInflowData[Math.floor(patientInflowData.length * 2 / 3)]?.hour}:00</text>
                            <text x="180" y="98" fill="#ffffff60" fontSize="7">{patientInflowData[patientInflowData.length - 1]?.hour}:00</text>
                          </>
                        );
                      })()
                    ) : (
                      <text x="100" y="50" fill="#ffffff60" fontSize="10" textAnchor="middle">No data available</text>
                    )}
                  </svg>
                </div>
              )}
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
              <h3 className="text-white font-semibold mb-4">SOS Trend (Last 24h)</h3>
              {sosTrendLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <span className="text-white/60">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="h-40 flex items-end justify-between gap-1 px-2">
                    {sosTrendData.length > 0 ? (
                      sosTrendData.map((item, index) => {
                        const maxCount = Math.max(...sosTrendData.map(d => d.count), 1);
                        return (
                          <div
                            key={index}
                            className="flex-1 bg-red-500 rounded-t hover:bg-red-400 transition-colors cursor-pointer group relative"
                            style={{ 
                              height: `${(item.count / maxCount) * 100}%`, 
                              minWidth: '8px', 
                              maxWidth: '20px',
                              minHeight: item.count > 0 ? '4px' : '0px'
                            }}
                            title={`${item.label}: ${item.count} requests`}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {item.count}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-white/40">
                        No data available
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-white/40 text-xs mt-2 px-2">
                    {sosTrendData.length > 0 && (
                      <>
                        <span>{sosTrendData[0]?.hour}:00</span>
                        <span>{sosTrendData[Math.floor(sosTrendData.length / 3)]?.hour}:00</span>
                        <span>{sosTrendData[Math.floor(sosTrendData.length * 2 / 3)]?.hour}:00</span>
                        <span>{sosTrendData[sosTrendData.length - 1]?.hour}:00</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </GlassSurface>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
