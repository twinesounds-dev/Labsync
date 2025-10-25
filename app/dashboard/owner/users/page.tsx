'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield,
  Building2 
} from 'lucide-react';

export default function UsersPage() {
  const [users] = useState([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Mugisha',
      email: 'owner@labsync.ug',
      role: 'owner',
      facility: 'FIRSTLINE - NTUNGAMO',
      facilityCode: 'FLNT',
      phone: '+256 700 000 100',
      isActive: true,
      lastLogin: '2024-10-25T08:30:00Z',
      createdAt: '2024-01-15T00:00:00Z',
    },
    {
      id: '2',
      firstName: 'Sarah',
      lastName: 'Nakato',
      email: 'reception.ntungamo@labsync.ug',
      role: 'receptionist',
      facility: 'FIRSTLINE - NTUNGAMO',
      facilityCode: 'FLNT',
      phone: '+256 700 000 101',
      isActive: true,
      lastLogin: '2024-10-25T09:15:00Z',
      createdAt: '2024-01-20T00:00:00Z',
    },
    {
      id: '3',
      firstName: 'David',
      lastName: 'Okello',
      email: 'clerk.ntungamo@labsync.ug',
      role: 'clerk',
      facility: 'FIRSTLINE - NTUNGAMO',
      facilityCode: 'FLNT',
      phone: '+256 700 000 102',
      isActive: true,
      lastLogin: '2024-10-25T07:45:00Z',
      createdAt: '2024-02-01T00:00:00Z',
    },
    {
      id: '4',
      firstName: 'Grace',
      lastName: 'Namusoke',
      email: 'labtech.ntungamo@labsync.ug',
      role: 'lab_tech',
      facility: 'FIRSTLINE - NTUNGAMO',
      facilityCode: 'FLNT',
      phone: '+256 700 000 103',
      isActive: true,
      lastLogin: '2024-10-25T08:00:00Z',
      createdAt: '2024-02-05T00:00:00Z',
    },
    {
      id: '5',
      firstName: 'Mary',
      lastName: 'Kwagala',
      email: 'reception.mbarara@labsync.ug',
      role: 'receptionist',
      facility: 'FIRSTLINE - MBARARA',
      facilityCode: 'FLMB',
      phone: '+256 700 000 104',
      isActive: true,
      lastLogin: '2024-10-24T16:30:00Z',
      createdAt: '2024-02-10T00:00:00Z',
    },
    {
      id: '6',
      firstName: 'Peter',
      lastName: 'Tumusiime',
      email: 'clerk.mbarara@labsync.ug',
      role: 'clerk',
      facility: 'FIRSTLINE - MBARARA',
      facilityCode: 'FLMB',
      phone: '+256 700 000 105',
      isActive: false,
      lastLogin: '2024-10-20T14:20:00Z',
      createdAt: '2024-02-15T00:00:00Z',
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'receptionist':
        return 'bg-blue-100 text-blue-800';
      case 'clerk':
        return 'bg-green-100 text-green-800';
      case 'lab_tech':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'lab_tech':
        return 'Lab Technician';
      case 'receptionist':
        return 'Receptionist';
      case 'clerk':
        return 'Clerk';
      case 'owner':
        return 'Owner';
      default:
        return role;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatLastLogin = (dateString: string) => {
    const now = new Date();
    const loginDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return formatDate(dateString);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesFacility = !selectedFacility || user.facilityCode === selectedFacility;
    
    return matchesSearch && matchesRole && matchesFacility;
  });

  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    byRole: {
      owner: users.filter(u => u.role === 'owner').length,
      receptionist: users.filter(u => u.role === 'receptionist').length,
      clerk: users.filter(u => u.role === 'clerk').length,
      lab_tech: users.filter(u => u.role === 'lab_tech').length,
    }
  };

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex items-center">
            <UserPlus className="w-4 h-4 mr-2" />
            Add New User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{userStats.total}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Users</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{userStats.active}</p>
              </div>
              <Shield className="w-12 h-12 text-green-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Lab Technicians</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{userStats.byRole.lab_tech}</p>
              </div>
              <Users className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Receptionists</p>
                <p className="text-3xl font-bold text-purple-900 mt-1">{userStats.byRole.receptionist}</p>
              </div>
              <Users className="w-12 h-12 text-purple-500 opacity-50" />
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex space-x-3">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="clerk">Clerk</option>
                  <option value="lab_tech">Lab Technician</option>
                </select>
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Facilities</option>
                  <option value="FLNT">FIRSTLINE - NTUNGAMO</option>
                  <option value="FLMB">FIRSTLINE - MBARARA</option>
                  <option value="PCMC">PRIMECURE MEDICAL</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div className="font-medium">{user.facilityCode}</div>
                          <div className="text-gray-500 text-xs">{user.facility}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastLogin(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-primary hover:text-primary-dark">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-4 h-4" />
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