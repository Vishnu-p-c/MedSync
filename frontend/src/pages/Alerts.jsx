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
  const [hospitalId, setHospitalId] = useState(null);

  // Hospital message modal state
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [sendToAllHospitals, setSendToAllHospitals] = useState(false);
  const [hospitalMessage, setHospitalMessage] = useState('');
  const [hospitalSubject, setHospitalSubject] = useState('');
  const [hospitalPriority, setHospitalPriority] = useState('normal');
  const [sendingHospitalMessage, setSendingHospitalMessage] = useState(false);
  const [hospitalSearchQuery, setHospitalSearchQuery] = useState('');

  // Reply modal state
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const userId = localStorage.getItem('userId'); // This is admin_id

  // Fetch hospital_id from admin_id
  const fetchHospitalId = useCallback(async () => {
    if (!userId) return;
    
    try {
      console.log('Fetching hospital_id for admin_id:', userId);
      const response = await axiosInstance.post('/hospital/admin_hospital', {
        admin_id: parseInt(userId)
      });
      console.log('Hospital info response:', response.data);
      
      if (response.data.status === 'success' && response.data.hospital_id) {
        setHospitalId(response.data.hospital_id);
        console.log('Set hospital_id to:', response.data.hospital_id);
      } else {
        console.error('No hospital_id found for admin');
      }
    } catch (error) {
      console.error('Error fetching hospital_id:', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchHospitalId();
  }, [fetchHospitalId]);

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
    if (!hospitalId) {
      console.log('No hospital_id available yet');
      return;
    }
    
    try {
      console.log('Fetching doctors for hospital_id:', hospitalId);
      const response = await axiosInstance.post('/doctor/list', {
        hospital_id: parseInt(hospitalId), // Use hospitalId instead of userId
        page: 1,
        limit: 1000
      });
      console.log('Doctor list response:', response.data);
      if (response.data.status === 'success') {
        const doctorsList = response.data.doctors || [];
        console.log('Doctors found:', doctorsList.length);
        setDoctors(doctorsList);
      } else {
        console.error('Failed to fetch doctors:', response.data.message);
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      console.error('Error details:', error.response?.data);
      setDoctors([]);
    }
  }, [hospitalId]); // Use hospitalId instead of userId

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

    if (!hospitalId) {
      alert('Hospital ID not available. Please refresh the page.');
      return;
    }

    setSendingMessage(true);
    try {
      const response = await axiosInstance.post('/hospital/send-message', {
        hospital_id: parseInt(hospitalId), // Use hospitalId instead of userId
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

  // Fuzzy match function for hospital search
  const fuzzyMatch = (text, query) => {
    if (!query) return true;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Direct substring match
    if (textLower.includes(queryLower)) return true;
    
    // Fuzzy: check if all query chars appear in order
    let qi = 0;
    for (let i = 0; i < textLower.length && qi < queryLower.length; i++) {
      if (textLower[i] === queryLower[qi]) qi++;
    }
    if (qi === queryLower.length) return true;

    // Levenshtein-based: allow typos for short queries
    const words = textLower.split(/\s+/);
    for (const word of words) {
      if (levenshteinDistance(word, queryLower) <= Math.max(1, Math.floor(queryLower.length / 3))) {
        return true;
      }
    }
    return false;
  };

  const levenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  // Fetch hospitals for inter-hospital messaging
  const fetchHospitals = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await axiosInstance.get(`/hospital/inter-message/hospitals?admin_id=${parseInt(userId)}`);
      if (response.data.status === 'success') {
        setHospitals(response.data.hospitals || []);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([]);
    }
  }, [userId]);

  // Open hospital message modal
  const openHospitalModal = () => {
    setShowHospitalModal(true);
    fetchHospitals();
  };

  // Handle hospital selection
  const toggleHospitalSelection = (hospitalId) => {
    setSelectedHospitals(prev => {
      if (prev.includes(hospitalId)) {
        return prev.filter(id => id !== hospitalId);
      } else {
        return [...prev, hospitalId];
      }
    });
  };

  // Send message to hospitals
  const sendMessageToHospitals = async () => {
    if (!hospitalMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    if (!sendToAllHospitals && selectedHospitals.length === 0) {
      alert('Please select at least one hospital');
      return;
    }

    setSendingHospitalMessage(true);
    try {
      const response = await axiosInstance.post('/hospital/inter-message/send', {
        admin_id: parseInt(userId),
        hospital_ids: sendToAllHospitals ? 'all' : selectedHospitals,
        message: hospitalMessage,
        subject: hospitalSubject,
        priority: hospitalPriority
      });

      if (response.data.status === 'success') {
        alert(`Message sent to ${response.data.results.messages_sent} hospital(s).`);
        setShowHospitalModal(false);
        setHospitalMessage('');
        setHospitalSubject('');
        setHospitalPriority('normal');
        setSelectedHospitals([]);
        setSendToAllHospitals(false);
        setHospitalSearchQuery('');
        fetchAlerts(); // Refresh alerts
      } else {
        alert(`Failed to send message: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error sending hospital message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setSendingHospitalMessage(false);
    }
  };

  // Reply to a hospital message
  const openReplyModal = (alertItem) => {
    setReplyingTo(alertItem);
    setReplyMessage('');
    setShowReplyModal(true);
  };

  const sendReply = async () => {
    if (!replyMessage.trim()) {
      alert('Please enter a reply message');
      return;
    }

    setSendingReply(true);
    try {
      const response = await axiosInstance.post('/hospital/inter-message/reply', {
        admin_id: parseInt(userId),
        parent_message_id: replyingTo.message_id,
        message: replyMessage
      });

      if (response.data.status === 'success') {
        alert(`Reply sent to ${response.data.data.to_hospital_name}`);
        setShowReplyModal(false);
        setReplyMessage('');
        setReplyingTo(null);
        fetchAlerts(); // Refresh alerts
      } else {
        alert(`Failed to send reply: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Error sending reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  };

  // Mark hospital message as read
  const markMessageRead = async (messageId) => {
    try {
      await axiosInstance.post('/hospital/inter-message/mark-read', {
        admin_id: parseInt(userId),
        message_ids: [messageId]
      });
      fetchAlerts();
    } catch (error) {
      console.error('Error marking message read:', error);
    }
  };

  // Get filtered hospitals based on fuzzy search
  const filteredHospitals = hospitals.filter(h =>
    fuzzyMatch(h.name + ' ' + (h.address || ''), hospitalSearchQuery)
  );

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

          {/* Send Message Buttons */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={openMessageModal}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Send Message to Doctors
            </button>
            <button
              onClick={openHospitalModal}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Send Message to Hospitals
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
                  const isHospitalMessage = alert.id?.startsWith('ihm-');
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
                          {isHospitalMessage && (
                            <p className="text-emerald-400 text-xs mb-1 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                              From: {alert.from_hospital_name}
                              {alert.is_broadcast && <span className="ml-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded text-[10px]">Broadcast</span>}
                              {alert.priority === 'urgent' && <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">Urgent</span>}
                              {alert.priority === 'critical' && <span className="ml-1 px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px]">Critical</span>}
                            </p>
                          )}
                          <p className="text-white/60 text-sm mb-2">{alert.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-white/40 text-xs">{formatTime(alert.timestamp)}</span>
                            {isHospitalMessage && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openReplyModal(alert)}
                                  className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                  Reply
                                </button>
                                <button
                                  onClick={() => markMessageRead(alert.message_id)}
                                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/50 text-xs rounded-lg transition-colors"
                                >
                                  Mark Read
                                </button>
                              </div>
                            )}
                          </div>
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

      {/* Hospital Message Modal */}
      {showHospitalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassSurface
            opacity={0.95}
            backgroundOpacity={0.15}
            brightness={50}
            blur={20}
            borderRadius={20}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Send Message to Hospitals
                </h2>
                <button
                  onClick={() => {
                    setShowHospitalModal(false);
                    setHospitalMessage('');
                    setHospitalSubject('');
                    setHospitalPriority('normal');
                    setSelectedHospitals([]);
                    setSendToAllHospitals(false);
                    setHospitalSearchQuery('');
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Send to All Hospitals */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendToAllHospitals}
                    onChange={(e) => {
                      setSendToAllHospitals(e.target.checked);
                      if (e.target.checked) {
                        setSelectedHospitals([]);
                      }
                    }}
                    className="w-5 h-5 rounded border-white/20 bg-white/10 checked:bg-emerald-600"
                  />
                  <span className="text-white font-medium">Send to All Hospitals</span>
                  <span className="text-white/40 text-sm">({hospitals.length} hospitals)</span>
                </label>
              </div>

              {/* Hospital Selection with Fuzzy Search */}
              {!sendToAllHospitals && (
                <div className="mb-6">
                  <label className="block text-white/60 text-sm mb-2">Select Hospitals:</label>
                  {/* Search Input */}
                  <div className="relative mb-2">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={hospitalSearchQuery}
                      onChange={(e) => setHospitalSearchQuery(e.target.value)}
                      placeholder="Search hospitals..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                    />
                    {hospitalSearchQuery && (
                      <button
                        onClick={() => setHospitalSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-white/5 rounded-lg p-3">
                    {filteredHospitals.length === 0 ? (
                      <p className="text-white/40 text-sm text-center py-4">
                        {hospitalSearchQuery ? 'No hospitals match your search' : 'No hospitals found'}
                      </p>
                    ) : (
                      filteredHospitals.map((hospital) => (
                        <label key={hospital.hospital_id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedHospitals.includes(hospital.hospital_id)}
                            onChange={() => toggleHospitalSelection(hospital.hospital_id)}
                            className="w-4 h-4 rounded border-white/20 bg-white/10 checked:bg-emerald-600 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{hospital.name}</p>
                            {hospital.address && (
                              <p className="text-white/40 text-xs truncate">{hospital.address}</p>
                            )}
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedHospitals.length > 0 && (
                    <p className="text-emerald-400 text-sm mt-2">{selectedHospitals.length} hospital(s) selected</p>
                  )}
                  {hospitalSearchQuery && filteredHospitals.length > 0 && (
                    <p className="text-white/30 text-xs mt-1">Showing {filteredHospitals.length} of {hospitals.length} hospitals</p>
                  )}
                </div>
              )}

              {/* Subject */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Subject (optional):</label>
                <input
                  type="text"
                  value={hospitalSubject}
                  onChange={(e) => setHospitalSubject(e.target.value)}
                  placeholder="Message subject..."
                  maxLength={200}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                />
              </div>

              {/* Priority */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Priority:</label>
                <div className="flex gap-2">
                  {['normal', 'urgent', 'critical'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setHospitalPriority(p)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        hospitalPriority === p
                          ? p === 'critical' ? 'bg-red-600 text-white'
                            : p === 'urgent' ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                          : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="mb-6">
                <label className="block text-white/60 text-sm mb-2">Message:</label>
                <textarea
                  value={hospitalMessage}
                  onChange={(e) => setHospitalMessage(e.target.value)}
                  placeholder="Type your message to hospitals..."
                  rows={5}
                  maxLength={2000}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                <p className="text-white/40 text-xs mt-1">{hospitalMessage.length} / 2000 characters</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={sendMessageToHospitals}
                  disabled={sendingHospitalMessage || !hospitalMessage.trim() || (!sendToAllHospitals && selectedHospitals.length === 0)}
                  className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {sendingHospitalMessage ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      {sendToAllHospitals ? `Send to All (${hospitals.length})` : `Send Message`}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowHospitalModal(false);
                    setHospitalMessage('');
                    setHospitalSubject('');
                    setHospitalPriority('normal');
                    setSelectedHospitals([]);
                    setSendToAllHospitals(false);
                    setHospitalSearchQuery('');
                  }}
                  disabled={sendingHospitalMessage}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </GlassSurface>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && replyingTo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <GlassSurface
            opacity={0.95}
            backgroundOpacity={0.15}
            brightness={50}
            blur={20}
            borderRadius={20}
            className="w-full max-w-lg max-h-[90vh] overflow-auto"
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Reply to Message</h2>
                <button
                  onClick={() => { setShowReplyModal(false); setReplyMessage(''); setReplyingTo(null); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Original Message */}
              <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-emerald-400 text-sm font-medium">{replyingTo.from_hospital_name}</span>
                  <span className="text-white/30 text-xs">{formatTime(replyingTo.timestamp)}</span>
                </div>
                {replyingTo.title && <p className="text-white/80 text-sm font-medium mb-1">{replyingTo.title}</p>}
                <p className="text-white/50 text-sm">{replyingTo.message}</p>
              </div>

              {/* Reply Input */}
              <div className="mb-4">
                <label className="block text-white/60 text-sm mb-2">Your Reply:</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={4}
                  maxLength={2000}
                  autoFocus
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
                <p className="text-white/40 text-xs mt-1">{replyMessage.length} / 2000 characters</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={sendReply}
                  disabled={sendingReply || !replyMessage.trim()}
                  className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {sendingReply ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Send Reply
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setShowReplyModal(false); setReplyMessage(''); setReplyingTo(null); }}
                  disabled={sendingReply}
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
