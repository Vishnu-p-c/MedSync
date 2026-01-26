import DashboardLayout from "../layout/DashboardLayout";



function AdminDashboard(){
    return(
        <DashboardLayout>
            {/* over all content div*/}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-200 min-h-screen ">
                <h1>Admin Dashboards</h1>

                {/* patient overview content */}
                <div className="bg-gray-200 p-4 rounded-lg">
                    <h3>Patient overview</h3>
                    <p>
                        Total Patients:<span>100</span>
                    </p>
                    <p>
                        Active Patients:<span>80</span>
                    </p>
                    <p>Appointments</p>
                    <div className="bg-gray-600 w-2x1 m-2 w-28 text-0.4 ">Appointments</div>
                    <div className="bg-gray-600">Discharges</div>
                </div>

                {/* sos requests div */}
                <div className="bg-slate-100 p-4 rounded-lg ">
                    <h3>Active SOS Requests</h3>
                    <div className="flex col-flex gap-4">
                        <p className="text-6xl text-red-700 font-bold"> 8</p>
                        <p className="text-2xl text-red-700">En Route</p>
                    </div>
                    <div className="mt-4 flex col-flex gap-4">
                        <p className="text-sm">Pending:&nbsp;<span>2</span></p>
                        <p className="text-sm">Assigned:&nbsp;<span>50</span></p>
                    </div>
                </div>

            {/* doctors on duty  div */}
            <div className="bg-white p-4 rounded-lg h-25 shadow-md ">
                <h3>Doctors on Duty</h3>
                <p>total : <span>150</span></p>
                <p>Available : <span>120</span></p>
            </div>



            </div>
        </DashboardLayout>
    );
    
}

export default AdminDashboard;