import SideNav from "../components/SideNav";
import TopNavbar from "../components/TopNavbar";

function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex-shrink-0">
        <SideNav />
      </aside>

      {/* Main section */}
      <div className="flex flex-col flex-1">

        {/* Top Navbar */}
        <TopNavbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>

      </div>
    </div>
  );
}

export default DashboardLayout;
