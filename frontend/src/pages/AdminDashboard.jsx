import DashboardLayout from "../layout/DashboardLayout";
import PatientOverview from "../components/PatientOverview";
import SosRequests from "../components/SosRequests";
import DoctorsOnDuty from "../components/DoctorsOnDuty";
import ActiveAmbulace from "../components/ActiveAmbulance";


function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <PatientOverview />
          <SosRequests />
          <DoctorsOnDuty />
          <ActiveAmbulace />
          
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
