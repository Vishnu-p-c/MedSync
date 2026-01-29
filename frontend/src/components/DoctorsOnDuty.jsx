function DoctorsOnDuty() {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        Doctors on Duty
      </h3>

      <p className="text-m text-gray-600">
        Total: <span className="font-bold">150</span>
      </p>
      <p className="text-m text-gray-600">
        Available:
        <span className="font-bold text-green-600"> 120</span>
      </p>
    </div>
  );
}

export default DoctorsOnDuty;
