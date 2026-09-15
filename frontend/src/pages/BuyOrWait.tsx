import { useState } from 'react';
import axios from 'axios';

export const BuyOrWait = () => {
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/v1/analyze', {
        request_id: 'req_1',
        user_id: 'test_user', // from seeder
        request_date: new Date().toISOString().split('T')[0],
        requested_amount: Number(amount),
        desired_completion_date: new Date().toISOString().split('T')[0],
        allows_partial_payment: true,
        request_type: 'purchase',
        payment_options: []
      });
      setResult(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
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
          disabled={loading || !amount}
          className="bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 w-full transition disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {result && (
        <div className={`p-6 rounded-lg border shadow-sm max-w-xl ${result.affordability_status === 'affordable_now' ? 'bg-green-50 border-green-200' : result.affordability_status.includes('affordable') ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center space-x-2 mb-4">
            <h2 className="text-xl font-bold uppercase tracking-wide">
              {result.affordability_status.replace('_', ' ')}
            </h2>
          </div>
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
              <span className="font-semibold capitalize">{result.recommended_payment_method.replace('_', ' ')}</span>
            </p>
            {result.earliest_date_for_full_payment && (
              <p className="flex justify-between border-b border-gray-200/50 pb-2">
                <span className="text-gray-600">Earliest Full Payment:</span>
                <span className="font-semibold">{result.earliest_date_for_full_payment}</span>
              </p>
            )}
            {result.spending_changes_needed !== 'none' && (
              <p className="flex justify-between border-b border-gray-200/50 pb-2">
                <span className="text-gray-600">Required changes:</span>
                <span className="font-semibold text-red-600">{result.spending_changes_needed}</span>
              </p>
            )}
            <div className="mt-4 bg-white/60 p-4 rounded border text-sm text-gray-800">
              {result.decision_explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
