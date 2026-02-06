import { useState, useEffect, useCallback, useRef } from 'react';
import SideNav from '../components/SideNav';
import TopNavbar from '../components/TopNavbar';
import GlassSurface from '../components/GlassSurface/GlassSurface';
import { getHospitalIncomingSos } from '../api/sosApi';

const SosEmergencies = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sosRequests, setSosRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSos, setSelectedSos] = useState(null);
  const [mapError, setMapError] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const routeLayerRef = useRef(null);

  const userId = localStorage.getItem('userId');

  // Severity styling
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/40',
          text: 'text-red-400',
          badge: 'bg-red-500 text-white'
        };
      case 'severe':
        return {
          bg: 'bg-orange-500/20',
          border: 'border-orange-500/40',
          text: 'text-orange-400',
          badge: 'bg-orange-500 text-white'
        };
      case 'moderate':
        return {
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/40',
          text: 'text-amber-400',
          badge: 'bg-amber-500 text-white'
        };
      case 'mild':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/40',
          text: 'text-green-400',
          badge: 'bg-green-500 text-white'
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          border: 'border-gray-500/40',
          text: 'text-gray-400',
          badge: 'bg-gray-500 text-white'
        };
    }
  };

  // Status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'driver_arrived':
        return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'awaiting_driver_response':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  // Format status text
  const formatStatus = (status) => {
    switch (status) {
      case 'assigned': return 'Driver Assigned';
      case 'driver_arrived': return 'Driver Arrived';
      case 'awaiting_driver_response': return 'Awaiting Driver';
      default: return status?.replace(/_/g, ' ') || 'Unknown';
    }
  };

  // Initialize Leaflet map
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Check if Leaflet is available
    if (typeof window !== 'undefined' && window.L) {
      const L = window.L;
      
      // Default to Kochi coordinates
      const defaultLat = 9.9312;
      const defaultLng = 76.2673;

      mapRef.current = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 12);

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      setMapError(null);
    } else {
      setMapError('Map library not loaded. Please refresh the page.');
    }
  }, []);

  // Update map markers and route
  const updateMap = useCallback((sos) => {
    if (!mapRef.current || !window.L) return;

    const L = window.L;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      marker.remove();
    });
    markersRef.current = {};

    // Clear existing route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (!sos) return;

    const bounds = [];

    // Hospital marker (red)
    if (sos.hospital_latitude && sos.hospital_longitude) {
      const hospitalIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
          </svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const hospitalMarker = L.marker([sos.hospital_latitude, sos.hospital_longitude], { icon: hospitalIcon })
        .addTo(mapRef.current)
        .bindPopup(`<b>Hospital</b><br/>${sos.hospital_name || 'Unknown Hospital'}`);
      markersRef.current.hospital = hospitalMarker;
      bounds.push([sos.hospital_latitude, sos.hospital_longitude]);
    }

    // Patient marker (orange)
    if (sos.patient_latitude && sos.patient_longitude) {
      const patientIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #f97316; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const patientMarker = L.marker([sos.patient_latitude, sos.patient_longitude], { icon: patientIcon })
        .addTo(mapRef.current)
        .bindPopup(`<b>Patient: ${sos.patient_name || 'Unknown'}</b><br/>SOS #${sos.sos_id}`);
      markersRef.current.patient = patientMarker;
      bounds.push([sos.patient_latitude, sos.patient_longitude]);
    }

    // Driver marker (blue) - animated
    if (sos.driver_latitude && sos.driver_longitude) {
      const driverIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #3b82f6; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const driverMarker = L.marker([sos.driver_latitude, sos.driver_longitude], { icon: driverIcon })
        .addTo(mapRef.current)
        .bindPopup(`<b>Driver: ${sos.driver_name || 'Unknown'}</b><br/>Vehicle: ${sos.vehicle_number || 'N/A'}`);
      markersRef.current.driver = driverMarker;
      bounds.push([sos.driver_latitude, sos.driver_longitude]);
    }

    // Draw route from driver to hospital (if both exist)
    if (sos.driver_latitude && sos.driver_longitude && 
        sos.hospital_latitude && sos.hospital_longitude) {
      // Also include patient location in the route if available
      const routePoints = [];
      
      // Start: Driver
      routePoints.push([sos.driver_latitude, sos.driver_longitude]);
      
      // Optional: Patient pickup
      if (sos.patient_latitude && sos.patient_longitude) {
        routePoints.push([sos.patient_latitude, sos.patient_longitude]);
      }
      
      // End: Hospital
      routePoints.push([sos.hospital_latitude, sos.hospital_longitude]);

      routeLayerRef.current = L.polyline(routePoints, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
        lineCap: 'round'
      }).addTo(mapRef.current);
    }

    // Fit bounds if we have markers
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        mapRef.current.setView(bounds[0], 14);
      } else {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, []);

  // Fetch incoming SOS requests
  const fetchIncomingSos = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const result = await getHospitalIncomingSos(userId);
      if (result.success) {
        setSosRequests(result.data || []);
        
        // Auto-select first SOS if none selected
        if (result.data?.length > 0 && !selectedSos) {
          setSelectedSos(result.data[0]);
        }
        
        // Update selected SOS with fresh data
        if (selectedSos && result.data) {
          const updatedSos = result.data.find(s => s.sos_id === selectedSos.sos_id);
          if (updatedSos) {
            setSelectedSos(updatedSos);
          } else {
            // SOS no longer active, select first available
            setSelectedSos(result.data[0] || null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching incoming SOS:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedSos]);

  // Initialize map on mount
  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (!window.L && !document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        initializeMap();
      };
      document.head.appendChild(script);
    } else if (window.L) {
      initializeMap();
    }

    return () => {
      // Cleanup map on unmount
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [initializeMap]);

  // Fetch SOS on mount and poll every 5 seconds
  useEffect(() => {
    fetchIncomingSos();
    const interval = setInterval(fetchIncomingSos, 5000);
    return () => clearInterval(interval);
  }, [fetchIncomingSos]);

  // Update map when selected SOS changes
  useEffect(() => {
    updateMap(selectedSos);
  }, [selectedSos, updateMap]);

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen w-full bg-[#030B12] overflow-x-hidden">
      {/* Add pulse animation CSS */}
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
      `}</style>

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
          <h1 className="text-lg font-semibold">SOS & Emergencies</h1>
          <div className="w-10"></div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <TopNavbar title="SOS & Emergencies" subtitle="Live Emergency Tracking" />
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
              className="p-3 sm:p-4"
            >
              <p className="text-white/60 text-xs sm:text-sm">Active SOS</p>
              <p className="text-2xl sm:text-3xl font-bold text-white">{sosRequests.length}</p>
            </GlassSurface>

            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4"
            >
              <p className="text-white/60 text-xs sm:text-sm">Critical</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-400">
                {sosRequests.filter(s => s.severity === 'critical').length}
              </p>
            </GlassSurface>

            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4"
            >
              <p className="text-white/60 text-xs sm:text-sm">En Route</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">
                {sosRequests.filter(s => s.status === 'assigned').length}
              </p>
            </GlassSurface>

            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={12}
              className="p-3 sm:p-4"
            >
              <p className="text-white/60 text-xs sm:text-sm">Arrived</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-400">
                {sosRequests.filter(s => s.status === 'driver_arrived').length}
              </p>
            </GlassSurface>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Section */}
            <div className="lg:col-span-2">
              <GlassSurface
                opacity={0.9}
                backgroundOpacity={0.1}
                brightness={50}
                blur={10}
                borderRadius={16}
                className="p-4"
              >
                <h2 className="text-white text-lg font-semibold mb-4">Live Tracking Map</h2>
                
                {/* Map Legend */}
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-white/70">Hospital</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span className="text-white/70">Patient</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-white/70">Ambulance</span>
                  </div>
                </div>

                {/* Map Container */}
                <div 
                  ref={mapContainerRef}
                  className="w-full h-[400px] sm:h-[500px] rounded-lg overflow-hidden bg-[#0a1628]"
                >
                  {mapError && (
                    <div className="w-full h-full flex items-center justify-center text-white/60">
                      <p>{mapError}</p>
                    </div>
                  )}
                  {!mapError && !mapRef.current && (
                    <div className="w-full h-full flex items-center justify-center text-white/60">
                      <p>Loading map...</p>
                    </div>
                  )}
                </div>

                {/* Selected SOS Details */}
                {selectedSos && (
                  <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityStyle(selectedSos.severity).badge}`}>
                        {(selectedSos.severity || 'unknown').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusStyle(selectedSos.status)}`}>
                        {formatStatus(selectedSos.status)}
                      </span>
                      {selectedSos.eta_minutes && (
                        <span className="text-white/60 text-sm">
                          ETA: {selectedSos.eta_minutes} min
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-white/50">Patient</p>
                        <p className="text-white font-medium">{selectedSos.patient_name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Driver</p>
                        <p className="text-white font-medium">{selectedSos.driver_name || 'Pending'}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Vehicle</p>
                        <p className="text-white font-medium">{selectedSos.vehicle_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/50">Hospital</p>
                        <p className="text-white font-medium">{selectedSos.hospital_name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </GlassSurface>
            </div>

            {/* SOS List Section */}
            <div className="lg:col-span-1">
              <GlassSurface
                opacity={0.9}
                backgroundOpacity={0.1}
                brightness={50}
                blur={10}
                borderRadius={16}
                className="p-4 h-full"
              >
                <h2 className="text-white text-lg font-semibold mb-4">Active SOS Requests</h2>
                
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : sosRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-white/50">
                    <svg className="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-lg font-medium">No Active Emergencies</p>
                    <p className="text-sm">All clear at the moment</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {sosRequests.map((sos) => {
                      const severityStyle = getSeverityStyle(sos.severity);
                      const isSelected = selectedSos?.sos_id === sos.sos_id;
                      
                      return (
                        <div
                          key={sos.sos_id}
                          onClick={() => setSelectedSos(sos)}
                          className={`p-4 rounded-lg cursor-pointer transition-all border ${
                            isSelected 
                              ? `${severityStyle.bg} ${severityStyle.border} ring-2 ring-offset-0 ring-${sos.severity === 'critical' ? 'red' : sos.severity === 'severe' ? 'orange' : sos.severity === 'moderate' ? 'amber' : 'green'}-500/50`
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-white font-medium">SOS #{sos.sos_id}</p>
                              <p className="text-white/50 text-sm">{formatTimeAgo(sos.created_at)}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${severityStyle.badge}`}>
                              {(sos.severity || 'unknown').toUpperCase()}
                            </span>
                          </div>

                          {/* Patient Info */}
                          <div className="mb-2">
                            <p className="text-white/70 text-sm">
                              <span className="text-white/50">Patient:</span> {sos.patient_name || 'Unknown'}
                            </p>
                            {sos.patient_phone && (
                              <p className="text-white/70 text-sm">
                                <span className="text-white/50">Phone:</span> {sos.patient_phone}
                              </p>
                            )}
                          </div>

                          {/* Driver Info */}
                          <div className="mb-2">
                            <p className="text-white/70 text-sm">
                              <span className="text-white/50">Driver:</span> {sos.driver_name || 'Pending assignment'}
                            </p>
                            {sos.vehicle_number && (
                              <p className="text-white/70 text-sm">
                                <span className="text-white/50">Vehicle:</span> {sos.vehicle_number}
                              </p>
                            )}
                          </div>

                          {/* Status */}
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-xs border ${getStatusStyle(sos.status)}`}>
                              {formatStatus(sos.status)}
                            </span>
                            {sos.eta_minutes && (
                              <span className="text-white/50 text-xs">
                                ETA: {sos.eta_minutes} min
                              </span>
                            )}
                          </div>

                          {/* IDs for reference */}
                          <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-2 text-xs text-white/40">
                            <span>Patient ID: {sos.patient_id}</span>
                            {sos.assigned_driver_id && (
                              <span>Driver ID: {sos.assigned_driver_id}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassSurface>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SosEmergencies;
