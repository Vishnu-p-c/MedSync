import SideNav from "../components/SideNav";

function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      
      {/* Sidebar */}
      <SideNav />

      {/* Page Content */}
      <main className="flex-1 ml-64 p-6 bg-slate-100 ">
        {children}
      </main>

    </div>
  );
}

export default DashboardLayout;
