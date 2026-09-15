import { useEffect, useState } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { fetchForecast, fetchProfile } from '../services/api';
import { Activity, RefreshCw, AlertCircle, Calendar, TrendingDown, Shield } from 'lucide-react';

export const CashFlow = () => {
  const [data, setData] = useState<any[]>([]);
  const [minBalance, setMinBalance] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [lowestBalance, setLowestBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const p = await fetchProfile('test_user');
      setMinBalance(p.minimum_balance_to_keep);
      setCurrentBalance(p.current_balance);
      
      const res = await fetchForecast('test_user');
      if (res.status === 'ok') {
        let lowest = p.current_balance;
        const chartData = res.forecast.map((f: any) => {
          if (f.balance < lowest) lowest = f.balance;
          return {
            name: f.date,
            balance: f.balance
          };
        });
        setData(chartData);
        setLowestBalance(lowest);
      }
    } catch (e) {
      setError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
        <p className="font-medium">Loading 90-day projection...</p>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4 bg-white rounded-2xl border border-red-100 p-8 shadow-sm">
        <AlertCircle className="text-red-500" size={48} />
        <p className="text-lg font-medium text-slate-800">Unable to load projection data.</p>
        <button onClick={loadData} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cash Flow Timeline</h1>
        <p className="text-slate-500 mt-1">Detailed 90-day trajectory based on scheduled income and expenses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg"><Activity size={20} className="text-blue-600" /></div>
            <h3 className="font-medium text-slate-600">Current Position</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">₹{currentBalance.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-slate-50 rounded-lg"><TrendingDown size={20} className="text-slate-600" /></div>
            <h3 className="font-medium text-slate-600">Lowest Projected</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">₹{lowestBalance.toLocaleString()}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg"><Shield size={20} className="text-red-500" /></div>
            <h3 className="font-medium text-slate-600">Safety Reserve</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">₹{minBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-2 mb-8">
          <Calendar className="text-slate-400" size={20} />
          <h2 className="text-xl font-bold text-slate-800">90-Day Projection</h2>
        </div>
        
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} minTickGap={30} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                labelFormatter={(label) => `Date: ${label}`}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Projected Balance']}
              />
              <ReferenceLine y={minBalance} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={2} label={{ position: 'insideBottomRight', value: 'Safety Reserve', fill: '#ef4444', fontSize: 12 }} />
              <Area type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
