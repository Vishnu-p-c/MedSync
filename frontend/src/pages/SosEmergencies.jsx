import { useState, useEffect, useCallback, useRef } from 'react';
import SideNav from '../components/SideNav';
import TopNavbar from '../components/TopNavbar';
import GlassSurface from '../components/GlassSurface/GlassSurface';
import { getHospitalIncomingSos } from '../api/sosApi';
import { getFrontendConfig } from '../api/configApi';

const SosEmergencies = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sosRequests, setSosRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSos, setSelectedSos] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const routePolylineRef = useRef(null);

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

  // Initialize Google Maps
  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    if (!window.google || !window.google.maps) {
      setMapError('Google Maps not loaded. Please refresh the page.');
      return;
    }

    try {
      // Default to Kochi coordinates
      const defaultLat = 9.9312;
      const defaultLng = 76.2673;

      mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: defaultLat, lng: defaultLng },
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#242f3e' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.stroke',
            stylers: [{ color: '#242f3e' }]
          },
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#746855' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#17263c' }]
          }
        ]
      });

      setMapError(null);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setMapError('Failed to initialize map. Please refresh the page.');
    }
  }, []);

  // Update map markers and route
  const updateMap = useCallback((sos) => {
    if (!mapRef.current || !window.google) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = {};

    // Clear existing route
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (!sos) return;

    const bounds = new window.google.maps.LatLngBounds();

    // Hospital marker (red with cross icon)
    if (sos.hospital_latitude && sos.hospital_longitude) {
      const hospitalPos = { lat: sos.hospital_latitude, lng: sos.hospital_longitude };
      
      const hospitalMarker = new window.google.maps.Marker({
        position: hospitalPos,
        map: mapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 12
        },
        title: sos.hospital_name || 'Hospital',
        animation: window.google.maps.Animation.DROP
      });

      const hospitalInfoWindow = new window.google.maps.InfoWindow({
        content: `<div style="color: #000; padding: 8px;">
          <strong>Hospital</strong><br/>
          ${sos.hospital_name || 'Unknown Hospital'}
        </div>`
      });

      hospitalMarker.addListener('click', () => {
        hospitalInfoWindow.open(mapRef.current, hospitalMarker);
      });

      markersRef.current.hospital = hospitalMarker;
      bounds.extend(hospitalPos);
    }

    // Patient marker (orange)
    if (sos.patient_latitude && sos.patient_longitude) {
      const patientPos = { lat: sos.patient_latitude, lng: sos.patient_longitude };
      
      const patientMarker = new window.google.maps.Marker({
        position: patientPos,
        map: mapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#f97316',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 12
        },
        title: sos.patient_name || 'Patient',
        animation: window.google.maps.Animation.DROP
      });

      const patientInfoWindow = new window.google.maps.InfoWindow({
        content: `<div style="color: #000; padding: 8px;">
          <strong>Patient: ${sos.patient_name || 'Unknown'}</strong><br/>
          SOS #${sos.sos_id}
        </div>`
      });

      patientMarker.addListener('click', () => {
        patientInfoWindow.open(mapRef.current, patientMarker);
      });

      markersRef.current.patient = patientMarker;
      bounds.extend(patientPos);
    }

    // Driver marker (blue, animated)
    if (sos.driver_latitude && sos.driver_longitude) {
      const driverPos = { lat: sos.driver_latitude, lng: sos.driver_longitude };
      
      const driverMarker = new window.google.maps.Marker({
        position: driverPos,
        map: mapRef.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          scale: 14
        },
        title: sos.driver_name || 'Driver',
        animation: window.google.maps.Animation.BOUNCE
      });

      const driverInfoWindow = new window.google.maps.InfoWindow({
        content: `<div style="color: #000; padding: 8px;">
          <strong>Driver: ${sos.driver_name || 'Unknown'}</strong><br/>
          Vehicle: ${sos.vehicle_number || 'N/A'}
        </div>`
      });

      driverMarker.addListener('click', () => {
        driverInfoWindow.open(mapRef.current, driverMarker);
      });

      markersRef.current.driver = driverMarker;
      bounds.extend(driverPos);
    }

    // Draw route from driver to patient to hospital
    if (sos.driver_latitude && sos.driver_longitude && 
        sos.hospital_latitude && sos.hospital_longitude) {
      const routePath = [];
      
      // Start: Driver
      routePath.push({ lat: sos.driver_latitude, lng: sos.driver_longitude });
      
      // Optional: Patient pickup
      if (sos.patient_latitude && sos.patient_longitude) {
        routePath.push({ lat: sos.patient_latitude, lng: sos.patient_longitude });
      }
      
      // End: Hospital
      routePath.push({ lat: sos.hospital_latitude, lng: sos.hospital_longitude });

      routePolylineRef.current = new window.google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapRef.current
      });
    }

    // Fit bounds if we have markers
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 50 });
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

  // Fetch config and initialize map on mount
  useEffect(() => {
    const loadConfig = async () => {
      const configResult = await getFrontendConfig();
      
      if (!configResult.success || !configResult.config.googleMapsApiKey) {
        setMapError('Google Maps API key not configured on server. Please contact administrator.');
        return;
      }

      const apiKey = configResult.config.googleMapsApiKey;
      setGoogleMapsApiKey(apiKey);

      // Load Google Maps API
      if (!window.google || !window.google.maps) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          initializeMap();
        };
        script.onerror = () => {
          setMapError('Failed to load Google Maps. Please check your network connection.');
        };
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    loadConfig();

    return () => {
      // Cleanup map on unmount
      if (mapRef.current) {
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
