import SideNav from "../components/SideNav";

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      
      {/* Sidebar */}
      <SideNav />

      {/* Page Content */}
      <main className="flex-1 ml-64">
        {children}
      </main>

    </div>
  );
}

export default DashboardLayout;
