import { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import axios from 'axios';

export const Documents = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLoading(true);
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      try {
        const res = await axios.post('http://localhost:8000/api/v1/documents/extract', formData);
        setExtraction(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
  };

  const handleApprove = () => {
    setApproved(true);
    // In a real app, this would route to BuyOrWait with prepopulated data
    setTimeout(() => {
      window.location.href = '/buy-or-wait';
    }, 1500);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Invoice Extraction (Mock/Real AI)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 max-w-xl">
          <label className="block border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition cursor-pointer">
            <Upload className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Click to upload invoice</h3>
            <p className="text-sm text-gray-500">Image or PDF (max. 5MB)</p>
            <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleUpload} />
          </label>
          
          {loading && <div className="mt-4 text-center text-blue-600 font-medium">Extracting data...</div>}
          
          <div className="mt-8 bg-blue-50 p-4 rounded border border-blue-100 text-blue-800 text-sm">
            <strong>Security Note:</strong> Your invoice is processed in memory and never stored permanently.
          </div>
        </div>

        {/* Extraction Results */}
        {extraction && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-100 max-w-xl">
            <h2 className="text-xl font-bold mb-4">Extraction Results</h2>
            {extraction.requires_review && (
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded mb-4 text-sm border border-yellow-200">
                <strong>Warning:</strong> {extraction.warnings.join(' ')}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Merchant</label>
                <input type="text" defaultValue={extraction.extraction.merchant} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Amount</label>
                <input type="number" defaultValue={extraction.extraction.amount} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Currency</label>
                <input type="text" defaultValue={extraction.extraction.currency} className="w-full border rounded p-2" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Confidence</label>
                <div className="text-sm font-semibold">{Math.round(extraction.confidence * 100)}%</div>
              </div>
              
              {!approved ? (
                <button onClick={handleApprove} className="w-full bg-blue-600 text-white font-medium p-3 rounded hover:bg-blue-700">
                  Approve and Analyze
                </button>
              ) : (
                <div className="text-green-600 flex items-center justify-center space-x-2 p-3">
                  <CheckCircle /> <span>Approved! Redirecting...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
