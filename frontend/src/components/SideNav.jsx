
import { NavLink } from "react-router-dom";

function MenuItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 rounded-lg text-sm font-medium
         ${isActive ? "bg-blue-50 text-blue-600" : "hover:bg-slate-100"}`
      }
    >
      {label}
    </NavLink>
  );
}

function SideNav() {
  return (
    <aside className="w-64 h-screen bg-white border-r fixed left-0 top-0">
      
      {/* Brand */}
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center font-bold">
          M
        </div>
        <span className="text-xl font-semibold text-slate-800">
          MedSync
        </span>
      </div>

      {/* Menu */}
      <nav className="px-3 py-4 flex flex-col gap-1 text-slate-700">

        <MenuItem to="/dashboard"  label="Dashboard" />
        <MenuItem to="/doctors"  label="Doctors" />
        <MenuItem to="/ambulances"  label="Ambulances" />
        <MenuItem to="/sos"  label="SOS Requests" />
        <MenuItem to="/reports"  label="Reports" />
        <div className="my-3 border-t" />
        <MenuItem to="/alerts"  label="Alerts" />
        <MenuItem to="/settings"  label="Settings" />

      </nav>
    </aside>
  );
}

export default SideNav;
