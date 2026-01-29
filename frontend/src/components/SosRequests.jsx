function SOSRequests() {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        Active SOS Requests
      </h3>

      <div className="flex items-center gap-4">
        <p className="text-5xl text-red-600 font-bold">8</p>
        <p className="text-xl text-red-600">En Route</p>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-m text-gray-600">
          Pending: <span className="font-bold text-red-700">2</span>
        </p>
        <p className="text-m text-gray-600">
          Assigned: <span className="font-bold">5</span>
        </p>
      </div>
    </div>
  );
}

export default SOSRequests;
