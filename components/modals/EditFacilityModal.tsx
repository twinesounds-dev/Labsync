'use client';

import { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { Facility } from '@/types';

interface EditFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFacilityUpdated: () => void;
  facility: Facility | null;
}

interface FacilityFormData {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
  isActive: boolean;
}

export default function EditFacilityModal({ isOpen, onClose, onFacilityUpdated, facility }: EditFacilityModalProps) {
  const [formData, setFormData] = useState<FacilityFormData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (facility) {
      setFormData({
        name: facility.name,
        code: facility.code,
        address: facility.address,
        phone: facility.phone,
        email: facility.email,
        licenseNumber: facility.licenseNumber,
        isActive: facility.isActive,
      });
    }
  }, [facility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility) return;

    setLoading(true);
    setError('');

    try {
      await firestoreService.update(COLLECTIONS.FACILITIES, facility.id, formData);
      onFacilityUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update facility');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !facility) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Facility</h2>
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
              <input
                type="text"
                required
                maxLength={4}
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="FLKL"
              />
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
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="LAB-UG-2024-001"
                />
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Facility is active
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Facility Preview</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Name:</strong> {formData.name}</p>
              <p><strong>Code:</strong> {formData.code}</p>
              <p><strong>License:</strong> {formData.licenseNumber}</p>
              <p><strong>Status:</strong> {formData.isActive ? 'Active' : 'Inactive'}</p>
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
              {loading ? 'Updating...' : 'Update Facility'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}