'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import AddFacilityModal from '@/components/modals/AddFacilityModal';
import EditFacilityModal from '@/components/modals/EditFacilityModal';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { Facility } from '@/types';
import { Building2, MapPin, Phone, Mail, Users, TrendingUp, Edit } from 'lucide-react';

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const loadFacilities = async () => {
    try {
      const facilitiesData = await firestoreService.getAll<Facility>(COLLECTIONS.FACILITIES);
      setFacilities(facilitiesData);
    } catch (error) {
      console.error('Error loading facilities:', error);
    }
  };

  const handleEditFacility = (facility: Facility) => {
    setSelectedFacility(facility);
    setShowEditModal(true);
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Facilities Management</h1>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            Add New Facility
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {facilities.map((facility) => (
            <Card key={facility.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Building2 className="w-8 h-8 text-primary mr-3" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{facility.name}</h2>
                    <p className="text-sm text-gray-600">Code: {facility.code}</p>
                    <p className="text-sm text-gray-600">License: {facility.licenseNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    facility.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {facility.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button 
                    onClick={() => handleEditFacility(facility)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{facility.address}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  <span className="text-sm">{facility.phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  <span className="text-sm">{facility.email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="text-sm">0 Active Staff</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">0</p>
                  <p className="text-xs text-gray-600">Total Patients</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">0.0M</p>
                  <p className="text-xs text-gray-600">Monthly Revenue</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">0</p>
                  <p className="text-xs text-gray-600">Pending Approvals</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <p className="text-2xl font-bold text-green-600">+0%</p>
                  </div>
                  <p className="text-xs text-gray-600">Growth</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <AddFacilityModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onFacilityAdded={loadFacilities}
        />

        <EditFacilityModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onFacilityUpdated={loadFacilities}
          facility={selectedFacility}
        />
      </div>
    </DashboardLayout>
  );
}