'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Test, TestCategory } from '@/types';
import { firestoreService, COLLECTIONS } from '@/lib/firestore';
import { 
  TestTube, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  DollarSign,
  Clock,
  Eye,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import Link from 'next/link';

export default function TestsManagementPage() {
  const { userProfile } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  const [newTest, setNewTest] = useState({
    code: '',
    name: '',
    categoryId: '',
    price: 0,
    turnaroundTime: '',
    sampleType: '',
    containerType: '',
    storageRequirements: '',
    isActive: true,
  });

  useEffect(() => {
    loadTests();
    loadCategories();
  }, [userProfile?.facilityId]);

  useEffect(() => {
    let filtered = tests;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(test => 
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(test => test.categoryId === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(test => test.isActive === isActive);
    }

    setFilteredTests(filtered);
  }, [tests, searchTerm, categoryFilter, statusFilter]);

  const loadTests = async () => {
    try {
      const testsData = await firestoreService.getAll<Test>(COLLECTIONS.TESTS);
      setTests(testsData);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await firestoreService.getAll<TestCategory>(COLLECTIONS.TEST_CATEGORIES);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleAddTest = async () => {
    try {
      if (!newTest.code || !newTest.name || !newTest.categoryId) {
        alert('Please fill in all required fields');
        return;
      }

      await firestoreService.create<Test>(COLLECTIONS.TESTS, {
        ...newTest,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setShowAddModal(false);
      setNewTest({
        code: '',
        name: '',
        categoryId: '',
        price: 0,
        turnaroundTime: '',
        sampleType: '',
        containerType: '',
        storageRequirements: '',
        isActive: true,
      });
      
      loadTests();
      alert('Test added successfully!');
    } catch (error) {
      console.error('Error adding test:', error);
      alert('Failed to add test');
    }
  };

  const handleEditTest = async () => {
    try {
      if (!editingTest) return;

      await firestoreService.update(COLLECTIONS.TESTS, editingTest.id, {
        ...editingTest,
        updatedAt: new Date(),
      });

      setEditingTest(null);
      loadTests();
      alert('Test updated successfully!');
    } catch (error) {
      console.error('Error updating test:', error);
      alert('Failed to update test');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      await firestoreService.delete(COLLECTIONS.TESTS, testId);
      loadTests();
      alert('Test deleted successfully!');
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test');
    }
  };

  const toggleTestStatus = async (test: Test) => {
    try {
      await firestoreService.update(COLLECTIONS.TESTS, test.id, {
        isActive: !test.isActive,
        updatedAt: new Date(),
      });
      loadTests();
    } catch (error) {
      console.error('Error updating test status:', error);
      alert('Failed to update test status');
    }
  };

  const exportTests = () => {
    const csvContent = [
      ['Code', 'Name', 'Category', 'Price', 'Turnaround Time', 'Sample Type', 'Status'].join(','),
      ...filteredTests.map(test => [
        test.code,
        test.name,
        categories.find(c => c.id === test.categoryId)?.name || 'Unknown',
        test.price,
        test.turnaroundTime,
        test.sampleType,
        test.isActive ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading tests...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tests Management</h1>
            <p className="text-gray-600 mt-1">Manage laboratory tests, pricing, and categories</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportTests}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Test
            </Button>
          </div>
        </div>

        {/* Test Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Tests</p>
                <p className="text-2xl font-bold text-blue-900">{tests.length}</p>
              </div>
              <TestTube className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Active Tests</p>
                <p className="text-2xl font-bold text-green-900">
                  {tests.filter(t => t.isActive).length}
                </p>
              </div>
              <Settings className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Categories</p>
                <p className="text-2xl font-bold text-purple-900">{categories.length}</p>
              </div>
              <Filter className="w-8 h-8 text-purple-600 opacity-50" />
            </div>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Avg. Price</p>
                <p className="text-2xl font-bold text-orange-900">
                  {tests.length > 0 ? Math.round(tests.reduce((sum, t) => sum + t.price, 0) / tests.length / 1000) : 0}K
                </p>
                <p className="text-xs text-orange-600">UGX</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Test name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat.id, label: cat.name }))
              ]}
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
            <div className="flex items-end">
              <Link href="/dashboard/owner/tests/categories" className="w-full">
                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Categories
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Tests List */}
        <Card title="Tests List" subtitle={`${filteredTests.length} tests`}>
          {filteredTests.length === 0 ? (
            <div className="text-center py-8">
              <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tests found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Test
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Turnaround
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sample Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTests.map((test) => (
                    <tr key={test.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{test.name}</div>
                          <div className="text-sm text-gray-500">{test.code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getCategoryName(test.categoryId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          UGX {test.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          {test.turnaroundTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {test.sampleType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleTestStatus(test)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            test.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {test.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingTest(test)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <Link href={`/dashboard/owner/tests/${test.id}`}>
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Add Test Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Test</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input
                  label="Test Code"
                  value={newTest.code}
                  onChange={(e) => setNewTest({ ...newTest, code: e.target.value })}
                  placeholder="e.g., FBC"
                  required
                />
                <Input
                  label="Test Name"
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  placeholder="e.g., Full Blood Count"
                  required
                />
                <Select
                  label="Category"
                  value={newTest.categoryId}
                  onChange={(e) => setNewTest({ ...newTest, categoryId: e.target.value })}
                  options={[
                    { value: '', label: 'Select Category' },
                    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                  ]}
                  required
                />
                <Input
                  label="Price (UGX)"
                  type="number"
                  value={newTest.price}
                  onChange={(e) => setNewTest({ ...newTest, price: parseInt(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Turnaround Time"
                  value={newTest.turnaroundTime}
                  onChange={(e) => setNewTest({ ...newTest, turnaroundTime: e.target.value })}
                  placeholder="e.g., 2 hours"
                />
                <Input
                  label="Sample Type"
                  value={newTest.sampleType}
                  onChange={(e) => setNewTest({ ...newTest, sampleType: e.target.value })}
                  placeholder="e.g., Blood (EDTA)"
                />
                <Input
                  label="Container Type"
                  value={newTest.containerType}
                  onChange={(e) => setNewTest({ ...newTest, containerType: e.target.value })}
                  placeholder="e.g., Purple top tube"
                />
                <Input
                  label="Storage Requirements"
                  value={newTest.storageRequirements}
                  onChange={(e) => setNewTest({ ...newTest, storageRequirements: e.target.value })}
                  placeholder="e.g., Room temperature"
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTest}>
                  Add Test
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Test Modal */}
        {editingTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Test</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Input
                  label="Test Code"
                  value={editingTest.code}
                  onChange={(e) => setEditingTest({ ...editingTest, code: e.target.value })}
                  required
                />
                <Input
                  label="Test Name"
                  value={editingTest.name}
                  onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
                  required
                />
                <Select
                  label="Category"
                  value={editingTest.categoryId}
                  onChange={(e) => setEditingTest({ ...editingTest, categoryId: e.target.value })}
                  options={[
                    { value: '', label: 'Select Category' },
                    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                  ]}
                  required
                />
                <Input
                  label="Price (UGX)"
                  type="number"
                  value={editingTest.price}
                  onChange={(e) => setEditingTest({ ...editingTest, price: parseInt(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Turnaround Time"
                  value={editingTest.turnaroundTime}
                  onChange={(e) => setEditingTest({ ...editingTest, turnaroundTime: e.target.value })}
                />
                <Input
                  label="Sample Type"
                  value={editingTest.sampleType}
                  onChange={(e) => setEditingTest({ ...editingTest, sampleType: e.target.value })}
                />
                <Input
                  label="Container Type"
                  value={editingTest.containerType || ''}
                  onChange={(e) => setEditingTest({ ...editingTest, containerType: e.target.value })}
                />
                <Input
                  label="Storage Requirements"
                  value={editingTest.storageRequirements || ''}
                  onChange={(e) => setEditingTest({ ...editingTest, storageRequirements: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setEditingTest(null)}>
                  Cancel
                </Button>
                <Button onClick={handleEditTest}>
                  Update Test
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}