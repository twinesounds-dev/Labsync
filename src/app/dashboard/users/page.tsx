'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter, Eye, Edit, Trash2, UserCheck, Shield, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import UserForm from '@/components/users/UserForm';
import { User, Facility } from '@/lib/types';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from the database
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: 'user1',
        email: 'receptionist@labsync.ug',
        name: 'Jane Receptionist',
        role: 'receptionist',
        facilityId: 'flnt',
        facility: {
          id: 'flnt',
          name: 'FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - NTUNGAMO',
          code: 'FLNT',
          address: 'Ntungamo, Uganda',
          phone: '+256 XXX XXX XXX',
          email: 'ntungamo@labsync.ug',
          isActive: true,
          createdAt: new Date(),
        },
        isActive: true,
        createdAt: new Date('2024-12-01'),
        lastLogin: new Date('2024-12-24T08:30:00'),
      },
      {
        id: 'user2',
        email: 'technician@labsync.ug',
        name: 'John Technician',
        role: 'lab_technician',
        facilityId: 'flnt',
        facility: {
          id: 'flnt',
          name: 'FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - NTUNGAMO',
          code: 'FLNT',
          address: 'Ntungamo, Uganda',
          phone: '+256 XXX XXX XXX',
          email: 'ntungamo@labsync.ug',
          isActive: true,
          createdAt: new Date(),
        },
        isActive: true,
        createdAt: new Date('2024-12-01'),
        lastLogin: new Date('2024-12-24T09:15:00'),
      },
      {
        id: 'user3',
        email: 'clerk@labsync.ug',
        name: 'Mary Clerk',
        role: 'clerk',
        facilityId: 'flnt',
        facility: {
          id: 'flnt',
          name: 'FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - NTUNGAMO',
          code: 'FLNT',
          address: 'Ntungamo, Uganda',
          phone: '+256 XXX XXX XXX',
          email: 'ntungamo@labsync.ug',
          isActive: true,
          createdAt: new Date(),
        },
        isActive: true,
        createdAt: new Date('2024-12-01'),
        lastLogin: new Date('2024-12-24T07:45:00'),
      },
      {
        id: 'user4',
        email: 'owner@labsync.ug',
        name: 'Dr. Smith (Owner)',
        role: 'owner',
        facilityId: 'flnt',
        facility: {
          id: 'flnt',
          name: 'FIRSTLINE MEDICAL LABORATORY DIAGNOSTICS - NTUNGAMO',
          code: 'FLNT',
          address: 'Ntungamo, Uganda',
          phone: '+256 XXX XXX XXX',
          email: 'ntungamo@labsync.ug',
          isActive: true,
          createdAt: new Date(),
        },
        isActive: true,
        createdAt: new Date('2024-11-15'),
        lastLogin: new Date('2024-12-24T10:00:00'),
      },
    ];

    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'receptionist':
        return <UserCheck className="h-4 w-4" />;
      case 'clerk':
        return <Clock className="h-4 w-4" />;
      case 'lab_technician':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'receptionist':
        return 'bg-blue-100 text-blue-800';
      case 'clerk':
        return 'bg-green-100 text-green-800';
      case 'lab_technician':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    // In a real app, this would navigate to a detailed view
    console.log('View user:', user);
  };

  const handleDelete = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== userId));
      setFilteredUsers(filteredUsers.filter(u => u.id !== userId));
    }
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
    setFilteredUsers(filteredUsers.map(u =>
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
  };

  const handleFormSubmit = (userData: Omit<User, 'id' | 'createdAt'>) => {
    if (selectedUser) {
      // Update existing user
      const updatedUsers = users.map(u =>
        u.id === selectedUser.id
          ? { ...u, ...userData }
          : u
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
    } else {
      // Add new user
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      setUsers([newUser, ...users]);
      setFilteredUsers([newUser, ...filteredUsers]);
    }
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-2">
            Manage system users and their access permissions
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              All system users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => !u.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Deactivated accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Today</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => {
                const today = new Date();
                const lastLogin = u.lastLogin ? new Date(u.lastLogin) : null;
                return lastLogin && lastLogin.toDateString() === today.toDateString();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Logged in today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="receptionist">Receptionist</option>
              <option value="clerk">Clerk</option>
              <option value="lab_technician">Lab Technician</option>
            </select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">No users found</p>
              <p className="text-gray-400 mt-2">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Get started by adding your first user'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((userItem) => (
            <Card key={userItem.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-lg font-medium text-primary-foreground">
                            {userItem.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {userItem.name}
                        </h3>
                        <p className="text-sm text-gray-500">{userItem.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(userItem.role)}`}>
                          {getRoleIcon(userItem.role)}
                          <span className="ml-1 capitalize">{userItem.role.replace('_', ' ')}</span>
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          userItem.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Facility:</strong> {userItem.facility?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Created:</strong> {formatDate(userItem.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Last Login:</strong> {userItem.lastLogin ? formatDate(userItem.lastLogin) : 'Never'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>User ID:</strong> {userItem.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {userItem.isActive ? 'User is active' : 'User account is deactivated'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(userItem)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(userItem)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(userItem.id)}
                          className={userItem.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {userItem.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(userItem.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* User Form Modal */}
      {isFormOpen && (
        <UserForm
          user={selectedUser}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedUser(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}