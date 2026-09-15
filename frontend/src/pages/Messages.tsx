import { useState } from 'react';
import { CheckCircle, Send, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export const Messages = () => {
  const [message, setMessage] = useState('');
  const [extraction, setExtraction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  
  // Editable
  const [eventType, setEventType] = useState('');
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');

  const handleExtract = async () => {
    if (!message) return;
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/v1/messages/extract', { text: message });
      setExtraction(res.data);
      setEventType(res.data.extraction.event_type || '');
      setAmount(res.data.extraction.amount || 0);
      setCurrency(res.data.extraction.currency || '');
      setEffectiveDate(res.data.extraction.effective_date || '');
      setApproved(false);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    try {
      await axios.post(`http://localhost:8000/api/v1/messages/${extraction.extraction_id}/approve`, {
        event_type: eventType,
        amount,
        currency,
        effective_date: effectiveDate
      });
      setApproved(true);
    } catch (err) {
      console.error(err);
      alert("Failed to approve. Please check dates and amounts.");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Message Extraction</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 max-w-xl">
          <label className="block text-sm font-medium text-gray-700 mb-2">Paste message or financial event text</label>
          <textarea 
            className="w-full border rounded p-3 h-32 focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="e.g. My rent is increasing to ₹18,000 next month starting 2026-10-01."
            value={message}
            onChange={e => setMessage(e.target.value)}
          ></textarea>
          <button 
            onClick={handleExtract}
            disabled={loading || !message}
            className="w-full bg-slate-800 text-white font-medium p-3 rounded flex justify-center items-center space-x-2 hover:bg-slate-700 disabled:opacity-50"
          >
            <span>{loading ? 'Extracting...' : 'Extract Event'}</span>
            <Send size={16} />
          </button>
        </div>

        {/* Extraction Results */}
        {extraction && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 max-w-xl">
            <h2 className="text-xl font-bold mb-4">Parsed Event</h2>
            {extraction.requires_review && !approved && (
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded mb-4 text-sm border border-yellow-200">
                <strong>Warning:</strong> {extraction.warnings.join(' ')}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Event Type</label>
                <input type="text" value={eventType} onChange={e => setEventType(e.target.value)} disabled={approved} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Amount</label>
                <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} disabled={approved} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Effective Date (YYYY-MM-DD)</label>
                <input type="text" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} disabled={approved} className="w-full border rounded p-2" />
              </div>
              
              {!approved ? (
                <button onClick={handleApprove} className="w-full bg-blue-600 text-white font-medium p-3 rounded hover:bg-blue-700 mt-4">
                  Approve & Update Forecast
                </button>
              ) : (
                <div className="mt-4 p-4 bg-green-50 rounded border border-green-200 text-center space-y-3">
                  <div className="text-green-700 font-medium flex justify-center items-center space-x-2">
                    <CheckCircle size={20} /> <span>Financial Event Created</span>
                  </div>
                  <p className="text-sm text-green-800">Your profile and cash flow projections have been updated.</p>
                  <Link to="/cash-flow" className="inline-flex items-center space-x-1 text-sm bg-white border border-green-300 text-green-700 px-4 py-2 rounded hover:bg-green-100 font-medium">
                    <TrendingUp size={16} /> <span>View New Forecast</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
