export const Dashboard = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">Financial Overview</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-gray-500 mb-2">Current Balance</h3>
        <p className="text-3xl font-bold">₹45,000</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-gray-500 mb-2">Safe Reserve</h3>
        <p className="text-3xl font-bold text-green-600">₹20,000</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-gray-500 mb-2">Safe to Spend</h3>
        <p className="text-3xl font-bold text-blue-600">₹25,000</p>
      </div>
    </div>
    <div className="mt-8 grid grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-bold mb-4">Upcoming Income</h3>
        <ul className="space-y-3">
          <li className="flex justify-between border-b pb-2"><span className="text-gray-600">Salary (Oct 1)</span><span className="font-semibold text-green-600">+₹60,000</span></li>
        </ul>
      </div>
      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <h3 className="text-lg font-bold mb-4">Upcoming Obligations</h3>
        <ul className="space-y-3">
          <li className="flex justify-between border-b pb-2"><span className="text-gray-600">Rent (Sep 20)</span><span className="font-semibold text-red-600">-₹15,000</span></li>
        </ul>
      </div>
    </div>
  </div>
);
