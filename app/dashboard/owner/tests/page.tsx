'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FileText, Plus, Upload, Edit2, Trash2, Search } from 'lucide-react';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { Test, TestCategory } from '@/types';

export default function TestManagementPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    categoryId: '',
    price: '',
    turnaroundTime: '',
    sampleType: '',
    containerType: '',
    storageRequirements: '',
  });

  const [importData, setImportData] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsData, categoriesData] = await Promise.all([
        firestoreService.getAll<Test>(COLLECTIONS.TESTS),
        firestoreService.getAll<TestCategory>(COLLECTIONS.TEST_CATEGORIES),
      ]);
      setTests(testsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await firestoreService.create<Test>(COLLECTIONS.TESTS, {
        code: formData.code,
        name: formData.name,
        categoryId: formData.categoryId,
        price: parseFloat(formData.price),
        turnaroundTime: formData.turnaroundTime,
        sampleType: formData.sampleType,
        containerType: formData.containerType,
        storageRequirements: formData.storageRequirements,
        isActive: true,
      } as Partial<Test>);

      alert('Test added successfully!');
      setFormData({
        code: '',
        name: '',
        categoryId: '',
        price: '',
        turnaroundTime: '',
        sampleType: '',
        containerType: '',
        storageRequirements: '',
      });
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error adding test:', error);
      alert('Failed to add test');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportTests = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Parse CSV or JSON data
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 5) continue;

        const testData = {
          code: values[0],
          name: values[1],
          categoryId: values[2],
          price: parseFloat(values[3]),
          turnaroundTime: values[4],
          sampleType: values[5] || 'Blood',
          containerType: values[6] || '',
          storageRequirements: values[7] || '',
          isActive: true,
        };

        await firestoreService.create<Test>(COLLECTIONS.TESTS, testData as Partial<Test>);
      }

      alert(`Successfully imported ${lines.length - 1} tests!`);
      setImportData('');
      setIsImportModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Error importing tests:', error);
      alert('Failed to import tests. Please check the format.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      await firestoreService.update(COLLECTIONS.TESTS, testId, {
        isActive: false,
      });
      alert('Test deactivated successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test');
    }
  };

  const filteredTests = tests.filter(
    (test) =>
      test.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.sampleType?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-gray-900">Test Management</h1>
            <p className="text-gray-600 mt-1">Manage laboratory tests and pricing</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Upload className="w-5 h-5" />
              Import Tests
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Test
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tests by name, code, or sample type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 border-none focus:ring-0"
            />
          </div>
        </Card>

        {/* Tests List */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Code
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Test Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Sample Type
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Price (UGX)
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    TAT
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map((test) => {
                  const category = categories.find((c) => c.id === test.categoryId);
                  return (
                    <tr key={test.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {test.code}
                      </td>
                      <td className="py-3 px-4 text-gray-900">{test.name}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {category?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{test.sampleType}</td>
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {test.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {test.turnaroundTime}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            test.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {test.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteTest(test.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Deactivate Test"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tests found
              </div>
            )}
          </div>
        </Card>

        {/* Add Test Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Add New Test</h2>
              <form onSubmit={handleAddTest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Code *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      placeholder="e.g., MAL, HIV, LFT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Name *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Malaria Test"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <Select
                    required
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (UGX) *
                    </label>
                    <Input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="e.g., 15000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Turnaround Time *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.turnaroundTime}
                      onChange={(e) =>
                        setFormData({ ...formData, turnaroundTime: e.target.value })
                      }
                      placeholder="e.g., 2 hours"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sample Type *
                    </label>
                    <Select
                      required
                      value={formData.sampleType}
                      onChange={(e) =>
                        setFormData({ ...formData, sampleType: e.target.value })
                      }
                    >
                      <option value="">Select Sample Type</option>
                      <option value="Blood">Blood</option>
                      <option value="Urine">Urine</option>
                      <option value="Stool">Stool</option>
                      <option value="Sputum">Sputum</option>
                      <option value="Swab">Swab</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Container Type
                    </label>
                    <Input
                      type="text"
                      value={formData.containerType}
                      onChange={(e) =>
                        setFormData({ ...formData, containerType: e.target.value })
                      }
                      placeholder="e.g., EDTA tube"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storage Requirements
                  </label>
                  <Input
                    type="text"
                    value={formData.storageRequirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storageRequirements: e.target.value,
                      })
                    }
                    placeholder="e.g., Store at 2-8°C"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Adding...' : 'Add Test'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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

        {/* Import Tests Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Import Tests (CSV Format)</h2>
              <p className="text-gray-600 mb-4">
                Enter test data in CSV format. First line should be headers:
                <br />
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  code,name,categoryId,price,turnaroundTime,sampleType,containerType,storageRequirements
                </code>
              </p>
              <form onSubmit={handleImportTests} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CSV Data *
                  </label>
                  <textarea
                    required
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                    placeholder="code,name,categoryId,price,turnaroundTime,sampleType,containerType,storageRequirements
MAL,Malaria Test,cat123,15000,2 hours,Blood,EDTA tube,Room temp
HIV,HIV Test,cat123,25000,1 hour,Blood,EDTA tube,2-8°C"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? 'Importing...' : 'Import Tests'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
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
