'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { Building2, CheckCircle, ArrowLeft } from 'lucide-react';

export default function NewFacilityPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'basic' | 'config' | 'inventory' | 'complete'>('basic');

  const [facilityData, setFacilityData] = useState({
    name: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    licenseNumber: '',
  });

  const [configData, setConfigData] = useState({
    taxRate: 30,
    enabledPaymentMethods: ['Cash', 'Mobile Money', 'Card', 'Insurance'],
    operatingHours: {
      monday: { open: '08:00', close: '17:00', isOpen: true },
      tuesday: { open: '08:00', close: '17:00', isOpen: true },
      wednesday: { open: '08:00', close: '17:00', isOpen: true },
      thursday: { open: '08:00', close: '17:00', isOpen: true },
      friday: { open: '08:00', close: '17:00', isOpen: true },
      saturday: { open: '08:00', close: '13:00', isOpen: true },
      sunday: { open: '09:00', close: '12:00', isOpen: false },
    },
  });

  const [defaultInventory] = useState([
    { name: 'Malaria RDT Strips', category: 'test_kits', unit: 'strips', minStock: 100, costPerUnit: 2000 },
    { name: 'EDTA Tubes', category: 'sample_containers', unit: 'tubes', minStock: 200, costPerUnit: 500 },
    { name: 'Gloves (Pairs)', category: 'safety_equipment', unit: 'pairs', minStock: 500, costPerUnit: 300 },
    { name: 'Syringes', category: 'disposables', unit: 'pieces', minStock: 200, costPerUnit: 400 },
    { name: 'Alcohol Swabs', category: 'disposables', unit: 'pieces', minStock: 500, costPerUnit: 100 },
    { name: 'Blood Collection Needles', category: 'disposables', unit: 'pieces', minStock: 200, costPerUnit: 800 },
    { name: 'Urine Containers', category: 'sample_containers', unit: 'pieces', minStock: 100, costPerUnit: 600 },
    { name: 'Microscope Slides', category: 'other', unit: 'pieces', minStock: 500, costPerUnit: 200 },
  ]);

  const handleCreateFacility = async () => {
    if (!userProfile) return;

    setLoading(true);

    try {
      // Create facility
      const facilityRef = await addDoc(collection(db, COLLECTIONS.FACILITIES), {
        ...facilityData,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const facilityId = facilityRef.id;

      // Create facility configuration
      await addDoc(collection(db, COLLECTIONS.FACILITY_CONFIGURATIONS), {
        facilityId,
        defaultTests: [],
        operatingHours: configData.operatingHours,
        taxRate: configData.taxRate,
        enabledPaymentMethods: configData.enabledPaymentMethods,
        notificationSettings: {
          lowStockAlerts: true,
          attendanceReminders: true,
          pendingApprovals: true,
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create default inventory items
      for (const item of defaultInventory) {
        await addDoc(collection(db, COLLECTIONS.INVENTORY_ITEMS), {
          facilityId,
          name: item.name,
          category: item.category,
          description: `Default ${item.name}`,
          currentStock: 0,
          minimumStock: item.minStock,
          unit: item.unit,
          costPerUnit: item.costPerUnit,
          supplier: '',
          testsUsing: [],
          isActive: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      setStep('complete');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/owner');
      }, 2000);
    } catch (error) {
      console.error('Error creating facility:', error);
      alert('Failed to create facility. Please try again.');
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 'basic') {
      return facilityData.name && facilityData.code && facilityData.address;
    }
    return true;
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Facility</h1>
          <p className="text-gray-600 mt-1">
            Set up a new facility with automatic configuration
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Basic Info', 'Configuration', 'Inventory', 'Complete'].map((label, index) => {
              const stepKeys: typeof step[] = ['basic', 'config', 'inventory', 'complete'];
              const currentStepIndex = stepKeys.indexOf(step);
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={label} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : index + 1}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                  </div>
                  {index < 3 && (
                    <div
                      className={`h-1 flex-1 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        {step === 'basic' && (
          <Card title="Basic Facility Information">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    value={facilityData.name}
                    onChange={(e) =>
                      setFacilityData({ ...facilityData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g., FIRSTLINE NTUNGAMO"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facility Code *
                  </label>
                  <input
                    type="text"
                    value={facilityData.code}
                    onChange={(e) =>
                      setFacilityData({ ...facilityData, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="e.g., FLNT"
                    maxLength={4}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={facilityData.address}
                    onChange={(e) =>
                      setFacilityData({ ...facilityData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Full facility address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={facilityData.phone}
                    onChange={(e) =>
                      setFacilityData({ ...facilityData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="+256"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={facilityData.email}
                    onChange={(e) =>
                      setFacilityData({ ...facilityData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="facility@example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    value={facilityData.licenseNumber}
                    onChange={(e) =>
                      setFacilityData({ ...facilityData, licenseNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Facility license number"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 'config' && (
          <Card title="Facility Configuration">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={configData.taxRate}
                  onChange={(e) =>
                    setConfigData({ ...configData, taxRate: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Methods
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Cash', 'Mobile Money', 'Card', 'Insurance'].map((method) => (
                    <label key={method} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={configData.enabledPaymentMethods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setConfigData({
                              ...configData,
                              enabledPaymentMethods: [...configData.enabledPaymentMethods, method],
                            });
                          } else {
                            setConfigData({
                              ...configData,
                              enabledPaymentMethods: configData.enabledPaymentMethods.filter(
                                (m) => m !== method
                              ),
                            });
                          }
                        }}
                        className="rounded text-primary focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-gray-700">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Hours
                </label>
                <div className="space-y-2">
                  {Object.entries(configData.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={hours.isOpen}
                        onChange={(e) =>
                          setConfigData({
                            ...configData,
                            operatingHours: {
                              ...configData.operatingHours,
                              [day]: { ...hours, isOpen: e.target.checked },
                            },
                          })
                        }
                        className="rounded text-primary"
                      />
                      <span className="w-24 capitalize text-gray-700">{day}</span>
                      {hours.isOpen && (
                        <>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) =>
                              setConfigData({
                                ...configData,
                                operatingHours: {
                                  ...configData.operatingHours,
                                  [day]: { ...hours, open: e.target.value },
                                },
                              })
                            }
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) =>
                              setConfigData({
                                ...configData,
                                operatingHours: {
                                  ...configData.operatingHours,
                                  [day]: { ...hours, close: e.target.value },
                                },
                              })
                            }
                            className="px-2 py-1 border border-gray-300 rounded"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {step === 'inventory' && (
          <Card title="Default Inventory Setup">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                The following inventory items will be automatically created for this facility. 
                You can adjust stock levels and add more items later.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-900">Item Name</th>
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-900">Category</th>
                      <th className="text-right py-2 px-3 text-sm font-semibold text-gray-900">Min. Stock</th>
                      <th className="text-right py-2 px-3 text-sm font-semibold text-gray-900">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultInventory.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 px-3 text-sm">{item.name}</td>
                        <td className="py-2 px-3 text-sm capitalize">{item.category.replace('_', ' ')}</td>
                        <td className="py-2 px-3 text-sm text-right">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="py-2 px-3 text-sm text-right">
                          UGX {item.costPerUnit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {step === 'complete' && (
          <Card>
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Facility Created Successfully!</h2>
              <p className="text-gray-600 mb-4">
                {facilityData.name} has been set up with all necessary configurations.
              </p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        {step !== 'complete' && (
          <div className="flex justify-between mt-6">
            <button
              onClick={() => {
                if (step === 'config') setStep('basic');
                else if (step === 'inventory') setStep('config');
              }}
              disabled={step === 'basic'}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {step === 'inventory' ? (
              <button
                onClick={handleCreateFacility}
                disabled={loading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Building2 className="w-5 h-5" />
                {loading ? 'Creating Facility...' : 'Create Facility'}
              </button>
            ) : (
              <button
                onClick={() => {
                  if (step === 'basic') setStep('config');
                  else if (step === 'config') setStep('inventory');
                }}
                disabled={!canProceed()}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
