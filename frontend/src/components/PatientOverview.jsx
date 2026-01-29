function PatientOverview() {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        Patient Overview
      </h3>

      <p className="text-sm text-gray-600">
        Total Patients: <span className="font-bold">100</span>
      </p>
      <p className="text-sm text-gray-600">
        Active Patients: <span className="font-bold">80</span>
      </p>

      <div className="flex gap-4 mt-4">
        <div className="bg-blue-500 text-white text-sm px-4 py-2 rounded">
          Appointments
        </div>
        <div className="bg-gray-500 text-white text-sm px-4 py-2 rounded">
          Discharges
        </div>
      </div>
    </div>
  );
}

export default PatientOverview;
