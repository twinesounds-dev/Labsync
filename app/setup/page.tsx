'use client';

import { useState } from 'react';
import { Database, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSeedDatabase = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to seed database');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <Database className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LabSync Setup</h1>
          <p className="text-gray-600">Initialize your laboratory management system</p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Database Initialization</h2>
            <p className="text-blue-700 mb-4">
              This will populate your database with:
            </p>
            <ul className="text-sm text-blue-700 space-y-2 mb-4">
              <li>• 3 Sample facilities (FLNT, FLMB, PCMC)</li>
              <li>• 8 Test categories (Hematology, Biochemistry, etc.)</li>
              <li>• 15 Common laboratory tests</li>
              <li>• 4 Default user accounts with different roles</li>
            </ul>
            
            <button
              onClick={handleSeedDatabase}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Initializing Database...
                </>
              ) : (
                <>
                  <Database className="w-5 h-5 mr-2" />
                  Initialize Database
                </>
              )}
            </button>
          </div>

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-900">Setup Completed!</h3>
              </div>
              <p className="text-green-700 mb-4">{result.message}</p>
              
              <div className="space-y-2 text-sm text-green-700">
                <p>✓ {result.details?.facilities}</p>
                <p>✓ {result.details?.testCategories}</p>
                <p>✓ {result.details?.tests}</p>
                <p>✓ {result.details?.users}</p>
              </div>

              <div className="mt-4 p-4 bg-white rounded border">
                <h4 className="font-medium text-gray-900 mb-2">Default Login Credentials:</h4>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><strong>Owner:</strong> admin@firstlinelab.ug / Admin123!</p>
                  <p><strong>Receptionist:</strong> reception@firstlinelab.ug / Reception123!</p>
                  <p><strong>Clerk:</strong> clerk@firstlinelab.ug / Clerk123!</p>
                  <p><strong>Lab Tech:</strong> labtech@firstlinelab.ug / LabTech123!</p>
                </div>
              </div>

              <div className="mt-4">
                <a
                  href="/auth/login"
                  className="inline-block bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  Go to Login Page
                </a>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <AlertCircle className="w-6 h-6 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-red-900">Setup Failed</h3>
              </div>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError('')}
                className="mt-3 text-red-600 hover:text-red-800 text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Next Steps</h3>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Initialize the database using the button above</li>
              <li>Login with one of the default accounts</li>
              <li>Explore the role-based dashboards</li>
              <li>Add your own facilities, users, and tests</li>
              <li>Start processing patient samples</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}