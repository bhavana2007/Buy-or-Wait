import { useEffect, useState } from 'react';
import { fetchProfile, fetchEvents } from '../services/api';

export const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  
  useEffect(() => {
    fetchProfile('test_user').then(setProfile).catch(console.error);
    fetchEvents('test_user').then(setEvents).catch(console.error);
  }, []);

  if (!profile) return <div className="p-8">Loading dashboard...</div>;

  const upcomingIncome = events.filter(e => e.is_income && e.status !== 'settled').slice(0, 3);
  const upcomingObligations = events.filter(e => !e.is_income && e.status !== 'settled').slice(0, 3);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Financial Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 mb-2">Current Balance</h3>
          <p className="text-3xl font-bold">₹{profile.current_balance.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 mb-2">Safe Reserve</h3>
          <p className="text-3xl font-bold text-green-600">₹{profile.minimum_balance_to_keep.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-gray-500 mb-2">Safe to Spend</h3>
          <p className="text-3xl font-bold text-blue-600">₹{(profile.current_balance - profile.minimum_balance_to_keep).toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Upcoming Income</h3>
          <ul className="space-y-3">
            {upcomingIncome.map((inc, i) => (
              <li key={i} className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Income ({inc.date})</span>
                <span className="font-semibold text-green-600">+₹{inc.amount.toLocaleString()}</span>
              </li>
            ))}
            {upcomingIncome.length === 0 && <li className="text-gray-500 text-sm">None upcoming</li>}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Upcoming Obligations</h3>
          <ul className="space-y-3">
            {upcomingObligations.map((obl, i) => (
              <li key={i} className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Expense ({obl.date})</span>
                <span className="font-semibold text-red-600">-₹{obl.amount.toLocaleString()}</span>
              </li>
            ))}
            {upcomingObligations.length === 0 && <li className="text-gray-500 text-sm">None upcoming</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};
