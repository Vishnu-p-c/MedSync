
import { useEffect, useState } from "react";

function ActiveAmbulance() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/ambulance/active-count")
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setCount(data.activeDrivers);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching active ambulance drivers:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        Active Ambulance Drivers
      </h3>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-5xl text-green-600 font-bold">
            {count}
          </span>
          <p className="text-xl text-green-600">
            On Duty
          </p>
        </div>
      )}
    </div>
  );
}

export default ActiveAmbulance;
