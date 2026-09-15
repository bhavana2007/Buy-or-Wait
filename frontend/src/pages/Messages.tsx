import { useState } from 'react';
import { CheckCircle, Send } from 'lucide-react';
import axios from 'axios';

export const Messages = () => {
  const [message, setMessage] = useState('');
  const [extraction, setExtraction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleExtract = async () => {
    if (!message) return;
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/api/v1/messages/extract', { text: message });
      setExtraction(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleApprove = () => {
    setApproved(true);
    // In a real app, this adds the event to DB via API
    setTimeout(() => {
      setApproved(false);
      setExtraction(null);
      setMessage('');
      alert("Event added to financial profile! Forecast updated.");
    }, 1500);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Message Extraction (Mock/Real AI)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Input Section */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 max-w-xl">
          <label className="block text-sm font-medium text-gray-700 mb-2">Paste message or financial event text</label>
          <textarea 
            className="w-full border rounded p-3 h-32 focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="e.g. My rent is increasing to ₹18,000 next month."
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
            {extraction.requires_review && (
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded mb-4 text-sm border border-yellow-200">
                <strong>Warning:</strong> {extraction.warnings.join(' ')}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Event Type</label>
                <input type="text" defaultValue={extraction.extraction.event_type} className="w-full border rounded p-2 capitalize" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Amount</label>
                <input type="number" defaultValue={extraction.extraction.amount} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Effective Date</label>
                <input type="text" defaultValue={extraction.extraction.effective_date || 'N/A'} className="w-full border rounded p-2" />
              </div>
              
              {!approved ? (
                <button onClick={handleApprove} className="w-full bg-blue-600 text-white font-medium p-3 rounded hover:bg-blue-700 mt-4">
                  Approve and Add to Profile
                </button>
              ) : (
                <div className="text-green-600 flex items-center justify-center space-x-2 p-3 mt-4">
                  <CheckCircle /> <span>Approved & Added!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
