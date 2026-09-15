import { useEffect, useState } from 'react';
import { fetchProfile, fetchEvents, fetchForecast } from '../services/api';
import { Wallet, ShieldCheck, CreditCard, Activity, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [pRes, eRes, fRes] = await Promise.all([
        fetchProfile('test_user'),
        fetchEvents('test_user'),
        fetchForecast('test_user')
      ]);
      setProfile(pRes);
      setEvents(eRes);
      if (fRes.status === 'ok') {
        setChartData(fRes.forecast.map((f: any) => ({
          date: f.date,
          balance: f.balance
        })));
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
        <p className="font-medium">Loading your financial overview...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 space-y-4 bg-white rounded-2xl border border-red-100 p-8 shadow-sm">
        <AlertCircle className="text-red-500" size={48} />
        <p className="text-lg font-medium text-slate-800">Unable to load financial data.</p>
        <button onClick={loadData} className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium">
          Retry Connection
        </button>
      </div>
    );
  }

  const upcomingIncome = events.filter(e => e.is_income && e.status !== 'settled').slice(0, 3);
  const upcomingObligations = events.filter(e => !e.is_income && e.status !== 'settled').slice(0, 3);
  
  const safeToSpend = Math.max(0, profile.current_balance - profile.minimum_balance_to_keep);
  const healthStatus = safeToSpend > profile.minimum_balance_to_keep * 0.5 ? 'Healthy' : safeToSpend > 0 ? 'Warning' : 'Critical';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
        <p className="text-slate-500 mt-1">Understand what you can safely spend today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={64} className="text-slate-900" />
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-slate-50 rounded-lg"><Wallet size={20} className="text-slate-700" /></div>
            <h3 className="font-medium text-slate-600">Current Balance</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">₹{profile.current_balance.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShieldCheck size={64} className="text-blue-600" />
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg"><ShieldCheck size={20} className="text-blue-700" /></div>
            <h3 className="font-medium text-slate-600">Safe Reserve</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">₹{profile.minimum_balance_to_keep.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden group ring-1 ring-emerald-500/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard size={64} className="text-emerald-600" />
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg"><CreditCard size={20} className="text-emerald-700" /></div>
            <h3 className="font-medium text-slate-600">Safe to Spend</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-600 tracking-tight">₹{safeToSpend.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={64} className={healthStatus === 'Healthy' ? 'text-emerald-600' : 'text-amber-500'} />
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-slate-50 rounded-lg">
              <Activity size={20} className={healthStatus === 'Healthy' ? 'text-emerald-600' : 'text-amber-500'} />
            </div>
            <h3 className="font-medium text-slate-600">Financial Health</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{healthStatus}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Upcoming Income</h3>
              <ArrowUpRight className="text-emerald-500" size={20} />
            </div>
            <div className="p-2">
              {upcomingIncome.length > 0 ? (
                upcomingIncome.map((inc, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{inc.event_id.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500">{inc.date}</p>
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-sm">
                      +₹{inc.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-xl m-2 border border-dashed border-slate-200">
                  No upcoming income found.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Upcoming Obligations</h3>
              <ArrowDownRight className="text-red-500" size={20} />
            </div>
            <div className="p-2">
              {upcomingObligations.length > 0 ? (
                upcomingObligations.map((obl, i) => (
                  <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{obl.event_id.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500">{obl.date}</p>
                    </div>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-sm">
                      -₹{obl.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500 bg-slate-50 rounded-xl m-2 border border-dashed border-slate-200">
                  No upcoming obligations found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chart Column */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">90-Day Cash Flow Projection</h3>
              <p className="text-sm text-slate-500">Your projected daily balance based on confirmed schedule.</p>
            </div>
          </div>
          
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} minTickGap={30} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fontSize: 12}} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Projected Balance']}
                  />
                  <ReferenceLine y={profile.minimum_balance_to_keep} stroke="#ef4444" strokeDasharray="4 4" opacity={0.6} />
                  <Line type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                Chart data unavailable
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center space-x-6 text-sm text-slate-500 justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>Projected Balance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 border-t-2 border-dashed border-red-400"></div>
              <span>Minimum Reserve</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
