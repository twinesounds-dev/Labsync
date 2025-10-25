'use client';

import { useState } from 'react';
import { X, Building2, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';

interface AddFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFacilityAdded: () => void;
}

interface FacilityFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
}

export default function AddFacilityModal({ isOpen, onClose, onFacilityAdded }: AddFacilityModalProps) {
  const [formData, setFormData] = useState<FacilityFormData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateFacilityCode = () => {
    const words = formData.name.split(' ');
    let code = '';
    
    for (const word of words) {
      if (word.length > 0 && code.length < 4) {
        code += word[0].toUpperCase();
      }
    }
    
    if (code.length < 4) {
      code += Math.floor(Math.random() * 100).toString().padStart(2, '0');
    }
    
    setFormData(prev => ({ ...prev, code: code.substring(0, 4) }));
  };

  const generateLicenseNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData(prev => ({ ...prev, licenseNumber: `LAB-UG-${year}-${random}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await firestoreService.create(COLLECTIONS.FACILITIES, {
        ...formData,
        isActive: true,
      });

      // Reset form
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        licenseNumber: '',
      });

      onFacilityAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create facility');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Facility</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facility Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - KAMPALA"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facility Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="pr-20 pl-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="FLKL"
                />
                <button
                  type="button"
                  onClick={generateFacilityCode}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-dark text-xs px-2 py-1 rounded"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                  className="pl-10 pr-20 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="LAB-UG-2024-001"
                />
                <button
                  type="button"
                  onClick={generateLicenseNumber}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-dark text-xs px-2 py-1 rounded"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <textarea
                required
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Plot 123, Medical Center Road, Kampala District, Uganda"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="+256 700 000 000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="kampala@firstlinelab.ug"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Facility Preview</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Name:</strong> {formData.name || 'Not set'}</p>
              <p><strong>Code:</strong> {formData.code || 'Not set'}</p>
              <p><strong>License:</strong> {formData.licenseNumber || 'Not set'}</p>
              <p><strong>Contact:</strong> {formData.phone || 'Not set'} | {formData.email || 'Not set'}</p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}