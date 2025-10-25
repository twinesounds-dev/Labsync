'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { 
  TestTube, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign,
  Tag,
  Beaker 
} from 'lucide-react';

export default function TestsPage() {
  const [tests] = useState([
    {
      id: '1',
      code: 'FBC',
      name: 'Full Hemogram',
      category: 'HEMATOLOGY',
      price: 15000,
      turnaroundTime: '2 hours',
      sampleType: 'Blood (EDTA)',
      containerType: 'Purple top tube',
      isActive: true,
      totalOrders: 245,
      monthlyOrders: 28,
    },
    {
      id: '2',
      code: 'LFT',
      name: 'Liver Function Tests',
      category: 'BIOCHEMISTRY',
      price: 25000,
      turnaroundTime: '4 hours',
      sampleType: 'Blood (Serum)',
      containerType: 'Red top tube',
      isActive: true,
      totalOrders: 189,
      monthlyOrders: 22,
    },
    {
      id: '3',
      code: 'MP',
      name: 'Malaria Parasite Test',
      category: 'HEMATOLOGY',
      price: 5000,
      turnaroundTime: '30 mins',
      sampleType: 'Blood (EDTA)',
      containerType: 'Purple top tube',
      isActive: true,
      totalOrders: 456,
      monthlyOrders: 52,
    },
    {
      id: '4',
      code: 'HIV',
      name: 'HIV Rapid Test',
      category: 'SEROLOGY',
      price: 10000,
      turnaroundTime: '30 mins',
      sampleType: 'Blood',
      containerType: 'EDTA tube',
      isActive: true,
      totalOrders: 123,
      monthlyOrders: 15,
    },
    {
      id: '5',
      code: 'TFT',
      name: 'Thyroid Function Tests',
      category: 'HORMONES',
      price: 45000,
      turnaroundTime: '24 hours',
      sampleType: 'Blood (Serum)',
      containerType: 'Red top tube',
      isActive: true,
      totalOrders: 67,
      monthlyOrders: 8,
    },
    {
      id: '6',
      code: 'URINE',
      name: 'Urine Microscopy',
      category: 'MICROBIOLOGY',
      price: 10000,
      turnaroundTime: '2 hours',
      sampleType: 'Urine',
      containerType: 'Urine container',
      isActive: false,
      totalOrders: 234,
      monthlyOrders: 0,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const categories = ['HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'SEROLOGY', 'HORMONES'];

  const getCategoryColor = (category: string) => {
    const colors = {
      'HEMATOLOGY': 'bg-red-100 text-red-800',
      'BIOCHEMISTRY': 'bg-blue-100 text-blue-800',
      'MICROBIOLOGY': 'bg-green-100 text-green-800',
      'SEROLOGY': 'bg-purple-100 text-purple-800',
      'HORMONES': 'bg-orange-100 text-orange-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || test.category === selectedCategory;
    const matchesStatus = !selectedStatus || 
      (selectedStatus === 'active' && test.isActive) ||
      (selectedStatus === 'inactive' && !test.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const testStats = {
    total: tests.length,
    active: tests.filter(t => t.isActive).length,
    inactive: tests.filter(t => !t.isActive).length,
    totalRevenue: tests.reduce((sum, test) => sum + (test.price * test.monthlyOrders), 0),
    totalOrders: tests.reduce((sum, test) => sum + test.monthlyOrders, 0),
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Test Management</h1>
          <div className="flex space-x-3">
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Import Tests
            </button>
            <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add New Test
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Tests</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{testStats.total}</p>
              </div>
              <TestTube className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Tests</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{testStats.active}</p>
              </div>
              <Beaker className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Monthly Orders</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{testStats.totalOrders}</p>
              </div>
              <Tag className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Monthly Revenue</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {(testStats.totalRevenue / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-orange-600">UGX</p>
              </div>
              <DollarSign className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex space-x-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Tests Table */}
        <Card>
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
                    Orders (MTD)
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
                      <div className="flex items-center">
                        <TestTube className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{test.name}</div>
                          <div className="text-sm text-gray-500">Code: {test.code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(test.category)}`}>
                        {test.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(test.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {test.turnaroundTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{test.sampleType}</div>
                      <div className="text-sm text-gray-500">{test.containerType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{test.monthlyOrders}</div>
                      <div className="text-sm text-gray-500">Total: {test.totalOrders}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        test.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {test.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-primary hover:text-primary-dark">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}