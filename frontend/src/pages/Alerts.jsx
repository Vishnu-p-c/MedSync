import { useState, useEffect, useCallback } from 'react';
import SideNav from '../components/SideNav';
import TopNavbar from '../components/TopNavbar';
import GlassSurface from '../components/GlassSurface/GlassSurface';
import { getAllAlerts } from '../api/alertsApi';
import axiosInstance from '../utils/axiosInstance';

const Alerts = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'critical', 'warning', 'info'
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [summary, setSummary] = useState({ total: 0, critical: 0, warning: 0, info: 0 });
  
  // Message modal state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [sendToAll, setSendToAll] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const userId = localStorage.getItem('userId');

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await getAllAlerts(userId);
      if (response.status === 'success') {
        setAlerts(response.data || []);
        setSummary(response.summary || { total: 0, critical: 0, warning: 0, info: 0 });
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

  // Fetch doctors linked to hospital
  const fetchDoctors = useCallback(async () => {
    try {
      const response = await axiosInstance.post('/doctor/list', {
        hospital_id: parseInt(userId), // Filter by current hospital
        page: 1,
        limit: 1000
      });
      if (response.data.status === 'success') {
        setDoctors(response.data.doctors || []);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  }, [userId]);

  // Open message modal and fetch doctors
  const openMessageModal = () => {
    setShowMessageModal(true);
    fetchDoctors();
  };

  // Handle doctor selection
  const toggleDoctorSelection = (doctorId) => {
    setSelectedDoctors(prev => {
      if (prev.includes(doctorId)) {
        return prev.filter(id => id !== doctorId);
      } else {
        return [...prev, doctorId];
      }
    });
  };

  // Send message to doctors
  const sendMessageToDoctors = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (!sendToAll && selectedDoctors.length === 0) {
      alert('Please select at least one doctor');
      return;
    }

    setSendingMessage(true);
    try {
      const response = await axiosInstance.post('/hospital/send-message', {
        hospital_id: parseInt(userId),
        doctor_ids: sendToAll ? 'all' : selectedDoctors,
        message: message
      });

      if (response.data.status === 'success') {
        alert(`Message sent to ${response.data.results.messages_sent} doctor(s). ${response.data.results.notifications_sent} notification(s) delivered.`);
        setShowMessageModal(false);
        setMessage('');
        setSelectedDoctors([]);
        setSendToAll(false);
      } else {
        alert(`Failed to send message: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

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

  // Count alerts by type - use summary from API
  const alertCounts = {
    all: summary.total,
    critical: summary.critical,
    warning: summary.warning,
    info: summary.info
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

          {/* Send Message Button */}
          <div className="mb-6">
            <button
              onClick={openMessageModal}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Send Message to Doctors
            </button>
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

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassSurface
            opacity={0.95}
            backgroundOpacity={0.15}
            brightness={50}
            blur={20}
            borderRadius={20}
            className="w-full max-w-2xl max-h-[90vh] overflow-auto"
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Send Message to Doctors</h2>
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessage('');
                    setSelectedDoctors([]);
                    setSendToAll(false);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Send to All Checkbox */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendToAll}
                    onChange={(e) => {
                      setSendToAll(e.target.checked);
                      if (e.target.checked) {
                        setSelectedDoctors([]);
                      }
                    }}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 checked:bg-blue-600"
                  />
                  <span className="text-white font-medium">Send to All Doctors</span>
                </label>
              </div>

              {/* Doctor Selection */}
              {!sendToAll && (
                <div className="mb-6">
                  <label className="block text-white/60 text-sm mb-2">Select Doctors:</label>
                  <div className="max-h-48 overflow-y-auto space-y-2 bg-white/5 rounded-lg p-3">
                    {doctors.length === 0 ? (
                      <p className="text-white/40 text-sm text-center py-4">No doctors found</p>
                    ) : (
                      doctors.map((doctor) => (
                        <label key={doctor.doctor_id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedDoctors.includes(doctor.doctor_id)}
                            onChange={() => toggleDoctorSelection(doctor.doctor_id)}
                            className="w-4 h-4 rounded border-white/20 bg-white/10 checked:bg-blue-600"
                          />
                          <div className="flex-1">
                            <p className="text-white text-sm">{doctor.name || `${doctor.first_name} ${doctor.last_name || ''}`}</p>
                            <p className="text-white/40 text-xs">{doctor.department}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedDoctors.length > 0 && (
                    <p className="text-blue-400 text-sm mt-2">{selectedDoctors.length} doctor(s) selected</p>
                  )}
                </div>
              )}

              {/* Message Input */}
              <div className="mb-6">
                <label className="block text-white/60 text-sm mb-2">Message:</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
                <p className="text-white/40 text-xs mt-1">{message.length} / 2000 characters</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={sendMessageToDoctors}
                  disabled={sendingMessage || !message.trim() || (!sendToAll && selectedDoctors.length === 0)}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {sendingMessage ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send Message
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowMessageModal(false);
                    setMessage('');
                    setSelectedDoctors([]);
                    setSendToAll(false);
                  }}
                  disabled={sendingMessage}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </GlassSurface>
        </div>
      )}
    </div>
  );
};

export default Alerts;
