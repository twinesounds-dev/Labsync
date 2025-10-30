'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { 
  Settings, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  FileText,
  Search
} from 'lucide-react';
import { COLLECTIONS, firestoreService } from '@/lib/firestore';
import { TestNormalRange, Test } from '@/types';
import { ALL_NORMAL_RANGES } from '@/lib/clinical-ranges';

export default function ClinicalRangesSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<Test[]>([]);
  const [normalRanges, setNormalRanges] = useState<TestNormalRange[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [editingRange, setEditingRange] = useState<TestNormalRange | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load tests
        const testsData = await firestoreService.getAll<Test>(COLLECTIONS.TESTS);
        setTests(testsData.filter(t => t.isActive));

        // Load normal ranges
        const rangesData = await firestoreService.getAll<TestNormalRange>(COLLECTIONS.TEST_NORMAL_RANGES);
        setNormalRanges(rangesData.filter(r => r.isActive));
      } catch (error) {
        console.error('Error loading data:', error);
        showMessage('error', 'Failed to load clinical ranges data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSelectTest = (test: Test) => {
    setSelectedTest(test);
    setEditingRange(null);
  };

  const handleEditRange = (range: TestNormalRange) => {
    setEditingRange({ ...range });
  };

  const handleSaveRange = async () => {
    if (!editingRange) return;

    setSaving(true);
    try {
      if (editingRange.id) {
        // Update existing range
        await firestoreService.update(COLLECTIONS.TEST_NORMAL_RANGES, editingRange.id, {
          ...editingRange,
          updatedAt: new Date(),
        });
        
        // Update local state
        setNormalRanges(normalRanges.map(r => r.id === editingRange.id ? editingRange : r));
        showMessage('success', 'Normal range updated successfully');
      } else {
        // Create new range
        const newId = await firestoreService.create(COLLECTIONS.TEST_NORMAL_RANGES, {
          ...editingRange,
          createdAt: new Date(),
        });
        
        setNormalRanges([...normalRanges, { ...editingRange, id: newId }]);
        showMessage('success', 'Normal range created successfully');
      }
      
      setEditingRange(null);
    } catch (error) {
      console.error('Error saving range:', error);
      showMessage('error', 'Failed to save normal range');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRange = async (rangeId: string) => {
    if (!confirm('Are you sure you want to delete this normal range? This action cannot be undone.')) {
      return;
    }

    try {
      await firestoreService.update(COLLECTIONS.TEST_NORMAL_RANGES, rangeId, {
        isActive: false,
        updatedAt: new Date(),
      });
      
      setNormalRanges(normalRanges.filter(r => r.id !== rangeId));
      showMessage('success', 'Normal range deleted successfully');
    } catch (error) {
      console.error('Error deleting range:', error);
      showMessage('error', 'Failed to delete normal range');
    }
  };

  const handleInitializeDefaults = async () => {
    if (!confirm('This will initialize default normal ranges from the Uganda population database. Continue?')) {
      return;
    }

    setSaving(true);
    try {
      let createdCount = 0;
      
      for (const testRange of ALL_NORMAL_RANGES) {
        // Find the test
        const test = tests.find(t => t.code === testRange.testCode);
        if (!test) continue;

        for (const param of testRange.parameters) {
          // Check if range already exists
          const existing = normalRanges.find(
            r => r.testId === test.id && r.parameter === param.parameter
          );
          
          if (!existing) {
            await firestoreService.create(COLLECTIONS.TEST_NORMAL_RANGES, {
              ...param,
              testId: test.id,
              createdAt: new Date(),
            });
            createdCount++;
          }
        }
      }

      // Reload ranges
      const rangesData = await firestoreService.getAll<TestNormalRange>(COLLECTIONS.TEST_NORMAL_RANGES);
      setNormalRanges(rangesData.filter(r => r.isActive));
      
      showMessage('success', `Successfully initialized ${createdCount} default normal ranges`);
    } catch (error) {
      console.error('Error initializing defaults:', error);
      showMessage('error', 'Failed to initialize default ranges');
    } finally {
      setSaving(false);
    }
  };

  const filteredTests = tests.filter(
    test =>
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTestRanges = selectedTest
    ? normalRanges.filter(r => r.testId === selectedTest.id)
    : [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading settings...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-primary" />
                Clinical Ranges Management
              </h1>
              <p className="text-gray-600 mt-1">
                Configure and customize normal reference ranges for laboratory tests
              </p>
            </div>
            
            <Button
              onClick={handleInitializeDefaults}
              isLoading={saving}
              className="bg-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Initialize Default Ranges
            </Button>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Selection */}
          <div className="lg:col-span-1">
            <Card title="Select Test">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search tests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredTests.map(test => {
                  const testRangeCount = normalRanges.filter(r => r.testId === test.id).length;
                  
                  return (
                    <button
                      key={test.id}
                      onClick={() => handleSelectTest(test)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedTest?.id === test.id
                          ? 'bg-primary text-white'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium text-sm">{test.name}</div>
                      <div className={`text-xs ${
                        selectedTest?.id === test.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {test.code} • {testRangeCount} parameter{testRangeCount !== 1 ? 's' : ''}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Range Configuration */}
          <div className="lg:col-span-2">
            {!selectedTest ? (
              <Card>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Test Selected
                  </h3>
                  <p className="text-gray-600">
                    Select a test from the list to view and configure its normal ranges
                  </p>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">{selectedTest.name}</h2>
                  <p className="text-sm text-gray-600">Test Code: {selectedTest.code}</p>
                </div>

                {/* Parameters List */}
                {selectedTestRanges.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">
                      No normal ranges configured for this test yet
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setEditingRange({
                        testId: selectedTest.id,
                        parameter: '',
                        unit: '',
                        rangeType: 'numeric',
                        isEditable: true,
                        isActive: true,
                        createdAt: new Date(),
                      } as TestNormalRange)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Parameter
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedTestRanges.map(range => (
                      <div key={range.id} className="border border-gray-200 rounded-lg p-4">
                        {editingRange?.id === range.id ? (
                          // Edit Mode
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Parameter Name
                                </label>
                                <Input
                                  value={editingRange.parameter}
                                  onChange={(e) => setEditingRange({
                                    ...editingRange,
                                    parameter: e.target.value
                                  })}
                                  disabled={!range.isEditable}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Unit
                                </label>
                                <Input
                                  value={editingRange.unit}
                                  onChange={(e) => setEditingRange({
                                    ...editingRange,
                                    unit: e.target.value
                                  })}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Normal Range (Male)
                                </label>
                                <Input
                                  value={editingRange.normalRangeMale || ''}
                                  onChange={(e) => setEditingRange({
                                    ...editingRange,
                                    normalRangeMale: e.target.value
                                  })}
                                  placeholder="e.g., 13.0-17.0"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Normal Range (Female)
                                </label>
                                <Input
                                  value={editingRange.normalRangeFemale || ''}
                                  onChange={(e) => setEditingRange({
                                    ...editingRange,
                                    normalRangeFemale: e.target.value
                                  })}
                                  placeholder="e.g., 12.0-15.0"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Normal Range (General)
                              </label>
                              <Input
                                value={editingRange.normalRangeGeneral || ''}
                                onChange={(e) => setEditingRange({
                                  ...editingRange,
                                  normalRangeGeneral: e.target.value
                                })}
                                placeholder="e.g., 4,000-11,000"
                              />
                            </div>

                            <div className="flex justify-end space-x-2 pt-4 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingRange(null)}
                              >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveRange}
                                isLoading={saving}
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-gray-900">{range.parameter}</h3>
                              <div className="flex space-x-2">
                                {range.isEditable && (
                                  <button
                                    onClick={() => handleEditRange(range)}
                                    className="text-primary hover:text-blue-700"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteRange(range.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Unit:</span>
                                <span className="ml-2 font-medium">{range.unit || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Type:</span>
                                <span className="ml-2 font-medium capitalize">{range.rangeType}</span>
                              </div>
                              
                              {range.normalRangeMale && (
                                <div>
                                  <span className="text-gray-600">Male Range:</span>
                                  <span className="ml-2 font-medium">{range.normalRangeMale}</span>
                                </div>
                              )}
                              
                              {range.normalRangeFemale && (
                                <div>
                                  <span className="text-gray-600">Female Range:</span>
                                  <span className="ml-2 font-medium">{range.normalRangeFemale}</span>
                                </div>
                              )}
                              
                              {range.normalRangeGeneral && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">General Range:</span>
                                  <span className="ml-2 font-medium">{range.normalRangeGeneral}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingRange({
                        testId: selectedTest.id,
                        parameter: '',
                        unit: '',
                        rangeType: 'numeric',
                        isEditable: true,
                        isActive: true,
                        createdAt: new Date(),
                      } as TestNormalRange)}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Parameter
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
