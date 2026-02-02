import { useState, useEffect, useCallback } from 'react';
import SideNav from '../components/SideNav';
import TopNavbar from '../components/TopNavbar';
import GlassSurface from '../components/GlassSurface/GlassSurface';
import axiosInstance from '../utils/axiosInstance';

const Alerts = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'critical', 'warning', 'info'
  const [filteredAlerts, setFilteredAlerts] = useState([]);

  const userId = localStorage.getItem('userId');

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get(`/admin/dashboard/critical-alerts?admin_id=${userId}`);
      if (response.data.status === 'success') {
        // Transform the data into alerts format
        const alertsData = response.data.data || [];
        const formattedAlerts = alertsData.map((item, index) => ({
          id: index + 1,
          type: item.type === 'equipment' ? 'warning' : 'critical',
          category: item.type === 'equipment' ? 'Equipment' : 'Stock',
          title: item.name,
          message: item.type === 'equipment' 
            ? `Equipment ${item.status}: ${item.name}` 
            : `Low stock alert: ${item.name} (${item.current_quantity}/${item.minimum_threshold})`,
          timestamp: new Date().toISOString(),
          isRead: false
        }));
        setAlerts(formattedAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Filter alerts
  useEffect(() => {
    if (filter === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(alert => alert.type === filter));
    }
  }, [alerts, filter]);

  // Get alert styling based on type
  const getAlertStyle = (type) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: 'text-red-400',
          badge: 'bg-red-500/20 text-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          icon: 'text-amber-400',
          badge: 'bg-amber-500/20 text-amber-400'
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          icon: 'text-blue-400',
          badge: 'bg-blue-500/20 text-blue-400'
        };
      default:
        return {
          bg: 'bg-white/5',
          border: 'border-white/10',
          icon: 'text-white/60',
          badge: 'bg-white/10 text-white/60'
        };
    }
  };

  // Get icon based on type
  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
        );
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Count alerts by type
  const alertCounts = {
    all: alerts.length,
    critical: alerts.filter(a => a.type === 'critical').length,
    warning: alerts.filter(a => a.type === 'warning').length,
    info: alerts.filter(a => a.type === 'info').length
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
          <h1 className="text-lg font-semibold">Alerts</h1>
          <div className="w-10"></div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <TopNavbar title="Alerts" subtitle="System Alerts & Notifications" />
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setFilter('all')}
            >
              <p className="text-white/60 text-xs sm:text-sm">All Alerts</p>
              <p className={`text-2xl sm:text-3xl font-bold ${filter === 'all' ? 'text-blue-400' : 'text-white'}`}>
                {alertCounts.all}
              </p>
            </GlassSurface>

            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setFilter('critical')}
            >
              <p className="text-white/60 text-xs sm:text-sm">Critical</p>
              <p className={`text-2xl sm:text-3xl font-bold ${filter === 'critical' ? 'text-red-400' : 'text-red-400'}`}>
                {alertCounts.critical}
              </p>
            </GlassSurface>

            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setFilter('warning')}
            >
              <p className="text-white/60 text-xs sm:text-sm">Warnings</p>
              <p className={`text-2xl sm:text-3xl font-bold ${filter === 'warning' ? 'text-amber-400' : 'text-amber-400'}`}>
                {alertCounts.warning}
              </p>
            </GlassSurface>

            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setFilter('info')}
            >
              <p className="text-white/60 text-xs sm:text-sm">Info</p>
              <p className={`text-2xl sm:text-3xl font-bold ${filter === 'info' ? 'text-blue-400' : 'text-blue-400'}`}>
                {alertCounts.info}
              </p>
            </GlassSurface>
          </div>

          {/* Alerts List */}
          <GlassSurface
            opacity={0.9}
            backgroundOpacity={0.1}
            brightness={50}
            blur={10}
            borderRadius={16}
            className="p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                {filter === 'all' ? 'All Alerts' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Alerts`}
              </h2>
              <button
                onClick={fetchAlerts}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white/60">Loading alerts...</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredAlerts.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-white/60 text-lg">No alerts at this time</span>
                  <p className="text-white/40 text-sm">All systems are running smoothly</p>
                </div>
              </div>
            )}

            {/* Alerts */}
            {!loading && filteredAlerts.length > 0 && (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => {
                  const style = getAlertStyle(alert.type);
                  return (
                    <div
                      key={alert.id}
                      className={`${style.bg} ${style.border} border rounded-xl p-4 transition-all hover:scale-[1.01]`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`${style.icon} shrink-0`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-white font-medium truncate">{alert.title}</h3>
                            <span className={`${style.badge} px-2 py-0.5 rounded-full text-xs font-medium shrink-0`}>
                              {alert.category}
                            </span>
                          </div>
                          <p className="text-white/60 text-sm mb-2">{alert.message}</p>
                          <span className="text-white/40 text-xs">{formatTime(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassSurface>
        </main>
      </div>
    </div>
  );
};

export default Alerts;
