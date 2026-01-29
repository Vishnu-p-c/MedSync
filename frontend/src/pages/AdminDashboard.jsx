import DashboardLayout from "../layout/DashboardLayout";
import PatientOverview from "../components/PatientOverview";
import SosRequests from "../components/SosRequests";
import DoctorsOnDuty from "../components/DoctorsOnDuty";
import ActiveAmbulace from "../components/ActiveAmbulance";


function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="p-6 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
