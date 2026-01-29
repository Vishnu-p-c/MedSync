import { useState, useEffect } from 'react';
import SideNav from '../components/SideNav';
import GlassSurface from '../components/GlassSurface/GlassSurface';
import axiosInstance from '../utils/axiosInstance';

// Equipment icons
import ventilatorIcon from '../assets/ventilation.png';
import defibrillatorIcon from '../assets/defribillator.png';
import ecgIcon from '../assets/ecg.png';
import labIcon from '../assets/lab.png';

const Equipment = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch equipment data from API
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get admin_id from localStorage (user_id is same as admin_id)
        const adminId = localStorage.getItem('userId');
        
        if (!adminId) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        // First, get the hospital_id for this admin
        const hospitalRes = await axiosInstance.post('/hospital/admin_hospital', {
          admin_id: Number(adminId)
        });

        if (hospitalRes.data.status !== 'success') {
          setError('Error fetching hospital information');
          setLoading(false);
          return;
        }

        const hospitalId = hospitalRes.data.hospital_id;

        // Now fetch all equipment for this hospital
        const equipmentRes = await axiosInstance.post('/hospital/total_equipment', {
          hospital_id: hospitalId,
          admin_id: Number(adminId)
        });

        if (equipmentRes.data.status !== 'success') {
          setError('Error fetching equipments');
          setLoading(false);
          return;
        }

        // Map API response to component format
        const mappedEquipment = equipmentRes.data.equipment.map(item => ({
          id: item.equipment_id,
          name: item.name,
          status: mapStatus(item.status),
          lastChecked: new Date(item.last_checked)
        }));

        setEquipmentList(mappedEquipment);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching equipment:', err);
        setError('Error fetching equipments');
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  // Map backend status to frontend display status
  const mapStatus = (status) => {
    switch (status) {
      case 'working':
        return 'Available';
      case 'maintenance':
        return 'Maintenance';
      case 'down':
        return 'Out of Order';
      default:
        return 'In Use';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'In Use':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Maintenance':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'Out of Order':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getEquipmentIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ventilator')) return ventilatorIcon;
    if (lowerName.includes('defibrillator')) return defibrillatorIcon;
    if (lowerName.includes('ecg') || lowerName.includes('monitor')) return ecgIcon;
    return labIcon; // default icon for all other equipment
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    All: equipmentList.length,
    Available: equipmentList.filter((e) => e.status === 'Available').length,
    'In Use': equipmentList.filter((e) => e.status === 'In Use').length,
    Maintenance: equipmentList.filter((e) => e.status === 'Maintenance').length,
    'Out of Order': equipmentList.filter((e) => e.status === 'Out of Order').length,
  };

  return (
    <div className="min-h-screen w-full bg-[#030B12] overflow-x-hidden">
      <SideNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="min-h-screen w-full lg:pl-64 relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[#030B12] border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Equipment</h1>
          <div className="w-10"></div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Equipment Status</h1>
              <p className="text-white/60 text-sm sm:text-base">Monitor and manage hospital equipment inventory</p>
            </div>
            <button className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white/90 rounded-full text-black font-semibold hover:bg-white active:scale-[0.98] transition-transform text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Equipment
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            status !== 'All' && (
              <GlassSurface
                key={status}
                opacity={0.9}
                backgroundOpacity={0.1}
                brightness={50}
                blur={10}
                borderRadius={16}
                className="p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-xs sm:text-sm">{status}</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{count}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'Available' ? 'bg-green-400' :
                    status === 'In Use' ? 'bg-blue-400' :
                    status === 'Maintenance' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}></div>
                </div>
              </GlassSurface>
            )
          ))}
        </div>

        {/* Filters */}
        <GlassSurface
          opacity={0.93}
          backgroundOpacity={0.1}
          brightness={50}
          blur={11}
          borderRadius={16}
          className="p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {Object.keys(statusCounts).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {status} ({statusCounts[status]})
                </button>
              ))}
            </div>
          </div>
        </GlassSurface>

        {/* Equipment Table */}
        <GlassSurface
          opacity={0.93}
          backgroundOpacity={0.1}
          brightness={50}
          blur={11}
          borderRadius={16}
          className="overflow-hidden"
        >
          <div className="overflow-x-auto">
            {/* Loading State */}
            {loading && (
              <div className="p-8 text-center text-white/60">
                <svg
                  className="w-12 h-12 mx-auto mb-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <p>Loading equipment...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-8 text-center text-red-400">
                <svg
                  className="w-12 h-12 mx-auto mb-4 opacity-70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-lg font-medium">Error fetching equipments</p>
                <p className="text-white/40 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Equipment Table - Only show when not loading and no error */}
            {!loading && !error && (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-white/60 font-medium">Equipment Name</th>
                      <th className="text-left p-4 text-white/60 font-medium">Status</th>
                      <th className="text-left p-4 text-white/60 font-medium">Last Checked</th>
                      <th className="text-right p-4 text-white/60 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipment.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          index === filteredEquipment.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center p-1.5">
                              <img
                                src={getEquipmentIcon(item.name)}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="text-white font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-white/60">{formatDate(item.lastChecked)}</td>
                        <td className="p-4 text-right">
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredEquipment.length === 0 && (
                  <div className="p-8 text-center text-white/40">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>No equipment found matching your criteria</p>
                  </div>
                )}
              </>
            )}
          </div>
        </GlassSurface>
        </div>
      </main>
    </div>
  );
};

export default Equipment;
