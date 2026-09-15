import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { fetchForecast, fetchProfile } from '../services/api';

export const CashFlow = () => {
  const [data, setData] = useState<any[]>([]);
  const [minBalance, setMinBalance] = useState(0);

  useEffect(() => {
    fetchProfile('test_user').then(p => setMinBalance(p.minimum_balance_to_keep)).catch(console.error);
    fetchForecast('test_user').then(res => {
      if (res.status === 'ok') {
        const chartData = res.forecast.map((f: any) => ({
          name: f.date,
          balance: f.balance
        }));
        setData(chartData);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">90-Day Cash Flow Projection</h1>
      {data.length > 0 ? (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" tick={{fontSize: 12}} minTickGap={30} />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Balance']}
              />
              <ReferenceLine y={minBalance} label={`Minimum Reserve (₹${minBalance.toLocaleString()})`} stroke="red" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-gray-500">Loading forecast...</div>
      )}
      <p className="mt-4 text-gray-500 text-sm">Forecast combines your current profile and scheduled events.</p>
    </div>
  );
};
