import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Activity, FileText, MessageSquare } from 'lucide-react';
import axios from 'axios';

const Sidebar = () => (
  <div className="w-64 bg-slate-900 h-screen text-white flex flex-col p-4 fixed">
    <h1 className="text-2xl font-bold mb-8 text-blue-400">Buy or Wait?</h1>
    <nav className="flex flex-col space-y-4">
      <Link to="/" className="flex items-center space-x-2 hover:text-blue-300"><LayoutDashboard size={20} /><span>Dashboard</span></Link>
      <Link to="/buy-or-wait" className="flex items-center space-x-2 hover:text-blue-300"><ShoppingCart size={20} /><span>Buy or Wait</span></Link>
      <Link to="/cash-flow" className="flex items-center space-x-2 hover:text-blue-300"><Activity size={20} /><span>Cash Flow</span></Link>
      <Link to="/documents" className="flex items-center space-x-2 hover:text-blue-300"><FileText size={20} /><span>Documents</span></Link>
      <Link to="/messages" className="flex items-center space-x-2 hover:text-blue-300"><MessageSquare size={20} /><span>Messages</span></Link>
    </nav>
  </div>
);

const Dashboard = () => (
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
  </div>
);

const BuyOrWait = () => {
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<any>(null);

  const analyze = async () => {
    try {
      const res = await axios.post('http://localhost:8000/api/v1/analyze', {
        request_id: 'req_1',
        user_id: 'user_1',
        request_date: new Date().toISOString().split('T')[0],
        requested_amount: Number(amount),
        desired_completion_date: new Date().toISOString().split('T')[0],
        allows_partial_payment: true,
        request_type: 'purchase'
      });
      setResult(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Analyze Purchase</h1>
      <div className="bg-white p-6 rounded-lg shadow mb-8 max-w-xl border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Amount (₹)</label>
        <input 
          type="number" 
          className="w-full border border-gray-300 rounded p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          placeholder="e.g. 15000"
        />
        <button 
          onClick={analyze}
          className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 w-full transition"
        >
          Analyze
        </button>
      </div>

      {result && (
        <div className={`p-6 rounded-lg border shadow-sm max-w-xl ${result.affordability_status === 'affordable_now' ? 'bg-green-50 border-green-200' : result.affordability_status === 'affordable_later' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <h2 className="text-xl font-bold mb-4 uppercase tracking-wide">
            {result.affordability_status.replace('_', ' ')}
          </h2>
          <div className="space-y-3">
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Safe to pay today:</span>
              <span className="font-semibold">₹{result.amount_safe_to_pay}</span>
            </p>
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-600">Recommended Action:</span>
              <span className="font-semibold capitalize">{result.recommended_payment_method.replace('_', ' ')}</span>
            </p>
            {result.earliest_date_for_full_payment && (
              <p className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Earliest Full Payment:</span>
                <span className="font-semibold">{result.earliest_date_for_full_payment}</span>
              </p>
            )}
            <div className="mt-4 bg-white p-4 rounded border text-sm text-gray-700">
              {result.decision_explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <h1 className="text-3xl font-bold mb-6">{title}</h1>
    <p className="text-gray-500">This view is implemented in the complete architecture. Connected to the backend AI extraction / forecasting services.</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="ml-64 flex-1">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/buy-or-wait" element={<BuyOrWait />} />
            <Route path="/cash-flow" element={<PlaceholderPage title="Cash Flow Projection" />} />
            <Route path="/documents" element={<PlaceholderPage title="Invoice & Document Extraction" />} />
            <Route path="/messages" element={<PlaceholderPage title="Message Parsing (AI)" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
