import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const data = [
  { name: 'Sep 15', balance: 45000 },
  { name: 'Sep 20', balance: 30000 },
  { name: 'Sep 25', balance: 25000 },
  { name: 'Oct 01', balance: 85000 },
  { name: 'Oct 15', balance: 75000 },
  { name: 'Nov 01', balance: 135000 },
];

export const CashFlow = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">90-Day Cash Flow Projection</h1>
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100 h-96">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <ReferenceLine y={20000} label="Minimum Reserve (₹20,000)" stroke="red" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-4 text-gray-500">Note: This is a demo projection based on your seeded profile.</p>
  </div>
);
