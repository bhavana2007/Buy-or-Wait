import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyzePurchase, createPurchase } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export const BuyOrWait = () => {
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState(searchParams.get('amount') || '');
  const [merchant, setMerchant] = useState(searchParams.get('merchant') || '');
  const [documentId] = useState(searchParams.get('document_id') || '');
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      // 1. Create Purchase
      const today = new Date().toISOString().split('T')[0];
      const purchaseRes = await createPurchase({
        document_id: documentId || "manual",
        amount: Number(amount),
        currency: "INR",
        merchant: merchant || "Manual Purchase",
        purchase_date: today
      });
      
      // 2. Analyze Purchase
      const analyzeRes = await analyzePurchase({
        request_id: purchaseRes.request_id,
        user_id: 'test_user',
        request_date: today,
        requested_amount: Number(amount),
        desired_completion_date: today,
        allows_partial_payment: true,
        request_type: 'purchase',
        payment_options: []
      });
      
      setResult(analyzeRes);
    } catch (e) {
      console.error(e);
      alert("Failed to analyze. Please check inputs.");
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Analyze Purchase</h1>
      <div className="bg-white p-6 rounded-lg shadow mb-8 max-w-xl border border-gray-100">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Merchant / Item</label>
          <input 
            type="text" 
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={merchant} 
            onChange={e => setMerchant(e.target.value)} 
            placeholder="e.g. New Laptop"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Amount (₹)</label>
          <input 
            type="number" 
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            placeholder="e.g. 25000"
          />
        </div>
        <button 
          onClick={analyze}
          disabled={loading || !amount}
          className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 w-full transition disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Purchase'}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={`p-6 rounded-lg border shadow-sm ${result.affordability_status === 'affordable_now' ? 'bg-green-50 border-green-200' : result.affordability_status.includes('affordable') ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
            <h2 className="text-xl font-bold uppercase tracking-wide mb-4">
              {result.affordability_status.replace(/_/g, ' ')}
            </h2>
            <div className="space-y-3">
              <p className="flex justify-between border-b border-gray-200/50 pb-2">
                <span className="text-gray-600">Purchase Amount:</span>
                <span className="font-semibold">₹{amount}</span>
              </p>
              <p className="flex justify-between border-b border-gray-200/50 pb-2">
                <span className="text-gray-600">Safe to pay today:</span>
                <span className="font-semibold">₹{result.amount_safe_to_pay}</span>
              </p>
              <p className="flex justify-between border-b border-gray-200/50 pb-2">
                <span className="text-gray-600">Recommended Action:</span>
                <span className="font-semibold capitalize">{result.recommended_payment_method.replace(/_/g, ' ')}</span>
              </p>
              {result.earliest_date_for_full_payment && (
                <p className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-600">Earliest Full Payment:</span>
                  <span className="font-semibold">{result.earliest_date_for_full_payment}</span>
                </p>
              )}
              {result.spending_changes_needed && result.spending_changes_needed !== 'none' && (
                <p className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-gray-600">Required changes:</span>
                  <span className="font-semibold text-red-600">{result.spending_changes_needed}</span>
                </p>
              )}
              <div className="mt-4 bg-white p-4 rounded border text-sm text-gray-800 shadow-sm leading-relaxed">
                <strong className="block mb-1">Why?</strong>
                {result.decision_explanation}
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
            <h3 className="font-bold text-gray-700 mb-4">Impact Visualization (90 Days)</h3>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.chart_data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" tick={{fontSize: 10}} minTickGap={20} />
                  <YAxis stroke="#6b7280" tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <ReferenceLine y={30000} label="Reserve" stroke="red" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="baseline" name="Without Purchase" stroke="#9ca3af" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="with_purchase" name="With Purchase" stroke="#3b82f6" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="p-4 bg-slate-50 border rounded text-slate-600 text-sm">
              The blue line shows your projected balance after applying the recommended payment plan. The engine verifies it stays above your reserve.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
