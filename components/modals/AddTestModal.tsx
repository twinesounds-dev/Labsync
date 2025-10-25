'use client';

import { useState } from 'react';
import { X, TestTube, Tag, DollarSign, Clock, Beaker } from 'lucide-react';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';

interface AddTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestAdded: () => void;
}

interface TestFormData {
  code: string;
  name: string;
  category: string;
  price: number;
  turnaroundTime: string;
  sampleType: string;
  containerType: string;
  storageRequirements: string;
}

const categories = [
  'HEMATOLOGY',
  'BIOCHEMISTRY',
  'MICROBIOLOGY',
  'SEROLOGY',
  'HORMONES',
  'IMMUNOLOGY',
  'MOLECULAR',
  'HISTOPATHOLOGY'
];

const sampleTypes = [
  'Blood',
  'Serum',
  'Plasma',
  'Urine',
  'Stool',
  'Sputum',
  'CSF',
  'Swab',
  'Tissue',
  'Other'
];

const containerTypes = [
  'EDTA Tube',
  'Plain Tube',
  'Heparin Tube',
  'Fluoride Tube',
  'Urine Container',
  'Stool Container',
  'Swab Transport',
  'Biopsy Container'
];

export default function AddTestModal({ isOpen, onClose, onTestAdded }: AddTestModalProps) {
  const [formData, setFormData] = useState<TestFormData>({
    code: '',
    name: '',
    category: '',
    price: 0,
    turnaroundTime: '',
    sampleType: '',
    containerType: '',
    storageRequirements: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateTestCode = () => {
    const category = formData.category;
    if (!category) return;
    
    const prefix = category.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setFormData(prev => ({ ...prev, code: `${prefix}${random}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await firestoreService.create(COLLECTIONS.TESTS, {
        ...formData,
        isActive: true,
      });

      // Reset form
      setFormData({
        code: '',
        name: '',
        category: '',
        price: 0,
        turnaroundTime: '',
        sampleType: '',
        containerType: '',
        storageRequirements: '',
      });

      onTestAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create test');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Test</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Code
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="pl-10 pr-20 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="HEM001"
                />
                <button
                  type="button"
                  onClick={generateTestCode}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-dark text-xs px-2 py-1 rounded"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <div className="relative">
                <TestTube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Complete Blood Count (CBC)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (UGX)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="25000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turnaround Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={formData.turnaroundTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, turnaroundTime: e.target.value }))}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="2 hours"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Type
              </label>
              <div className="relative">
                <Beaker className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  required
                  value={formData.sampleType}
                  onChange={(e) => setFormData(prev => ({ ...prev, sampleType: e.target.value }))}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Sample Type</option>
                  {sampleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Container Type
              </label>
              <select
                required
                value={formData.containerType}
                onChange={(e) => setFormData(prev => ({ ...prev, containerType: e.target.value }))}
                className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Container</option>
                {containerTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Storage Requirements
            </label>
            <textarea
              value={formData.storageRequirements}
              onChange={(e) => setFormData(prev => ({ ...prev, storageRequirements: e.target.value }))}
              className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Store at room temperature, process within 2 hours..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Test Preview</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Code:</strong> {formData.code || 'Not set'}</p>
              <p><strong>Name:</strong> {formData.name || 'Not set'}</p>
              <p><strong>Category:</strong> {formData.category || 'Not set'}</p>
              <p><strong>Price:</strong> {formData.price ? `UGX ${formData.price.toLocaleString()}` : 'Not set'}</p>
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
              {loading ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}