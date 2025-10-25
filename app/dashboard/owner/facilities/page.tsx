'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Building2, Plus, Edit2, Search } from 'lucide-react';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { Facility } from '@/types';

export default function FacilityManagementPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const facilitiesData = await firestoreService.getAll<Facility>(
        COLLECTIONS.FACILITIES
      );
      setFacilities(facilitiesData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (facility?: Facility) => {
    if (facility) {
      setEditingFacility(facility);
      setFormData({
        name: facility.name,
        code: facility.code,
        address: facility.address,
        phone: facility.phone,
        email: facility.email,
        licenseNumber: facility.licenseNumber,
      });
    } else {
      setEditingFacility(null);
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        licenseNumber: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingFacility) {
        // Update existing facility
        await firestoreService.update<Facility>(
          COLLECTIONS.FACILITIES,
          editingFacility.id,
          formData
        );
        alert('Facility updated successfully!');
      } else {
        // Create new facility
        await firestoreService.create<Facility>(COLLECTIONS.FACILITIES, {
          ...formData,
          isActive: true,
        } as Partial<Facility>);
        alert('Facility added successfully!');
      }

      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        email: '',
        licenseNumber: '',
      });
      setIsModalOpen(false);
      setEditingFacility(null);
      loadData();
    } catch (error) {
      console.error('Error saving facility:', error);
      alert('Failed to save facility');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFacilities = facilities.filter(
    (facility) =>
      facility.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Facility Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your laboratory facilities and locations
            </p>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Facility
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search facilities by name, code, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-none focus:ring-0"
            />
          </div>
        </Card>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => (
            <Card key={facility.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {facility.name}
                    </h3>
                    <p className="text-sm text-gray-600">{facility.code}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleOpenModal(facility)}
                  className="text-primary hover:text-primary-dark p-2"
                  title="Edit Facility"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Address:</span>
                  <p className="text-gray-900">{facility.address}</p>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="text-gray-900">{facility.phone}</p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="text-gray-900">{facility.email}</p>
                </div>
                <div>
                  <span className="text-gray-600">License:</span>
                  <p className="text-gray-900">{facility.licenseNumber}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    facility.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {facility.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {filteredFacilities.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No facilities found
          </div>
        )}

        {/* Add/Edit Facility Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingFacility ? 'Edit Facility' : 'Add New Facility'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facility Name *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., FIRSTLINE - NTUNGAMO"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facility Code *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="e.g., FLNT"
                    maxLength={4}
                    className="uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    2-4 characters, used in patient IDs
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="e.g., Plot 123, Main Street, Ntungamo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <Input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+256 700 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="facility@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number *
                  </label>
                  <Input
                    type="text"
                    required
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    placeholder="e.g., UG-LAB-2024-001"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting
                      ? 'Saving...'
                      : editingFacility
                      ? 'Update Facility'
                      : 'Add Facility'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingFacility(null);
                    }}
                    disabled={submitting}
                    className="flex-1 bg-gray-500 hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
