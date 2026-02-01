import { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";

function TopNavbar({ title, subtitle }) {
  const [hospitalInfo, setHospitalInfo] = useState({ name: '', type: 'hospital' });
  const [adminInfo, setAdminInfo] = useState({ fullName: 'Admin', firstName: 'A' });
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('userId');

  // Fetch hospital/clinic info and admin details
  useEffect(() => {
    const fetchHospitalInfo = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(`/admin/dashboard/hospital-info?admin_id=${userId}`);
        if (response.data.status === 'success') {
          const data = response.data.data;
          setHospitalInfo({
            name: data.name,
            type: data.type,
            address: data.address,
            rushLevel: data.rushLevel
          });
          if (data.admin) {
            setAdminInfo(data.admin);
          }
        }
      } catch (error) {
        console.error('Error fetching hospital info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalInfo();
  }, [userId]);

  // Determine display title and subtitle
  const displayTitle = title || (loading ? 'Loading...' : (hospitalInfo.name || 'Dashboard'));
  const displaySubtitle = subtitle || (loading 
    ? 'Fetching information...' 
    : hospitalInfo.type === 'clinic' 
      ? 'Clinic Management Dashboard' 
      : 'Hospital Management Dashboard'
  );

  return (
    <header className="h-auto min-h-16 bg-[#0a1628] border-b border-white/10 px-6 py-4 flex items-center justify-between">
      
      {/* Left: Hospital/Clinic Name and subtitle */}
      <div className="flex-1">
        <h1 className="text-xl md:text-2xl font-bold text-white truncate">
          {displayTitle}
        </h1>
        <p className="text-white/60 text-sm hidden md:block">
          {displaySubtitle}
        </p>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 md:gap-5">

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
          <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
            {adminInfo.firstName ? adminInfo.firstName.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden md:block pr-2">
            <p className="text-sm font-medium text-white">
              {loading ? 'Loading...' : adminInfo.fullName}
            </p>
            <p className="text-xs text-white/60">
              Administrator
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}

export default TopNavbar;
