'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import { Users, Calendar, CheckCircle, XCircle, AlertCircle, TrendingUp, UserCheck } from 'lucide-react';
import { Employee, AttendanceRecord, LeaveRequest, User } from '@/types';
import { useAuth } from '@/lib/auth-context';

interface HRManagementProps {
  facilityId: string | 'all';
}

export default function HRManagement({ facilityId }: HRManagementProps) {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leaves' | 'performance'>('overview');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
  });

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!userProfile) return;

    const unsubscribers: (() => void)[] = [];
    const today = getTodayDate();

    // Subscribe to users (staff)
    const usersQueryConstraints = [
      ...(facilityId !== 'all' ? [where('facilityId', '==', facilityId)] : []),
      where('isActive', '==', true),
    ];

    const usersQuery = query(
      collection(db, COLLECTIONS.USERS),
      ...usersQueryConstraints
    );

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[];
      setUsers(usersData);
    });
    unsubscribers.push(unsubUsers);

    // Subscribe to employees
    const employeesQueryConstraints = [
      ...(facilityId !== 'all' ? [where('facilityId', '==', facilityId)] : []),
      where('isActive', '==', true),
    ];

    const employeesQuery = query(
      collection(db, COLLECTIONS.EMPLOYEES),
      ...employeesQueryConstraints
    );

    const unsubEmployees = onSnapshot(employeesQuery, (snapshot) => {
      const employeesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Employee[];
      setEmployees(employeesData);
      setStats(prev => ({ ...prev, totalEmployees: employeesData.length }));
    });
    unsubscribers.push(unsubEmployees);

    // Subscribe to today's attendance
    const attendanceQueryConstraints = [
      ...(facilityId !== 'all' ? [where('facilityId', '==', facilityId)] : []),
      where('date', '==', today),
    ];

    const attendanceQuery = query(
      collection(db, COLLECTIONS.ATTENDANCE_RECORDS),
      ...attendanceQueryConstraints
    );

    const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const attendanceData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AttendanceRecord[];
      
      setTodayAttendance(attendanceData);
      
      const present = attendanceData.filter(a => a.status === 'present' || a.checkIn).length;
      const absent = attendanceData.filter(a => a.status === 'absent').length;
      
      setStats(prev => ({ ...prev, presentToday: present, absentToday: absent }));
    });
    unsubscribers.push(unsubAttendance);

    // Subscribe to leave requests
    const leaveQueryConstraints = [
      ...(facilityId !== 'all' ? [where('facilityId', '==', facilityId)] : []),
      orderBy('appliedDate', 'desc'),
      limit(50),
    ];

    const leaveQuery = query(
      collection(db, COLLECTIONS.LEAVE_REQUESTS),
      ...leaveQueryConstraints
    );

    const unsubLeaves = onSnapshot(leaveQuery, (snapshot) => {
      const leavesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LeaveRequest[];
      
      setLeaveRequests(leavesData);
      
      const pending = leavesData.filter(l => l.status === 'pending').length;
      const approved = leavesData.filter(l => l.status === 'approved').length;
      
      setStats(prev => ({ ...prev, pendingLeaves: pending, approvedLeaves: approved }));
    });
    unsubscribers.push(unsubLeaves);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [userProfile, facilityId]);

  const handleLeaveAction = async (leaveId: string, action: 'approved' | 'rejected', notes?: string) => {
    if (!userProfile) return;

    try {
      await updateDoc(doc(db, COLLECTIONS.LEAVE_REQUESTS, leaveId), {
        status: action,
        reviewedBy: userProfile.id,
        reviewedAt: Timestamp.now(),
        reviewNotes: notes || '',
      });
    } catch (error) {
      console.error('Error updating leave request:', error);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      const user = users.find(u => u.id === employee.userId);
      if (user) {
        return `${user.firstName} ${user.lastName}`;
      }
    }
    return 'Unknown';
  };

  const formatDate = (date: Timestamp | Date | string | unknown) => {
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    if (typeof date === 'string' || typeof date === 'number') {
      return new Date(date).toLocaleDateString();
    }
    return new Date().toLocaleDateString();
  };

  const formatTime = (date: Timestamp | Date | string | unknown) => {
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (date instanceof Date) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (typeof date === 'string' || typeof date === 'number') {
      return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateHours = (checkIn: Timestamp | Date | string | unknown, checkOut: Timestamp | Date | string | unknown) => {
    if (!checkIn || !checkOut) return 0;
    
    let start: Date;
    let end: Date;
    
    if (checkIn instanceof Timestamp) {
      start = checkIn.toDate();
    } else if (checkIn instanceof Date) {
      start = checkIn;
    } else if (typeof checkIn === 'string' || typeof checkIn === 'number') {
      start = new Date(checkIn);
    } else {
      return 0;
    }
    
    if (checkOut instanceof Timestamp) {
      end = checkOut.toDate();
    } else if (checkOut instanceof Date) {
      end = checkOut;
    } else if (typeof checkOut === 'string' || typeof checkOut === 'number') {
      end = new Date(checkOut);
    } else {
      return 0;
    }
    
    return ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Human Resources & Attendance</h2>
          <p className="text-gray-600 mt-1">
            {facilityId === 'all' ? 'All facilities' : 'Single facility view'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: UserCheck },
          { id: 'leaves', label: 'Leave Management', icon: Calendar },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Staff</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalEmployees}</p>
                  <p className="text-xs text-blue-600 mt-1">Active employees</p>
                </div>
                <Users className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Present Today</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{stats.presentToday}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {stats.totalEmployees > 0 
                      ? `${((stats.presentToday / stats.totalEmployees) * 100).toFixed(0)}% attendance`
                      : '0% attendance'}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Absent Today</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{stats.absentToday}</p>
                  <p className="text-xs text-red-600 mt-1">Needs follow-up</p>
                </div>
                <XCircle className="w-10 h-10 text-red-500 opacity-50" />
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setActiveTab('leaves')}>
                <div>
                  <p className="text-sm text-orange-600 font-medium">Pending Leaves</p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">{stats.pendingLeaves}</p>
                  <p className="text-xs text-orange-600 mt-1">Awaiting approval</p>
                </div>
                <AlertCircle className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Quick Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Today&apos;s Attendance Summary">
              <div className="space-y-3">
                {todayAttendance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No attendance records for today</p>
                  </div>
                ) : (
                  todayAttendance.slice(0, 5).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          record.checkIn ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{getEmployeeName(record.employeeId)}</p>
                          <p className="text-sm text-gray-600">
                            {record.checkIn ? `Checked in at ${formatTime(record.checkIn)}` : 'Not checked in'}
                          </p>
                        </div>
                      </div>
                      {record.checkIn && record.checkOut && record.hoursWorked && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {record.hoursWorked.toFixed(1)} hrs
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card title="Staff by Department">
              <div className="space-y-3">
                {[
                  { name: 'Reception', count: users.filter(u => u.role === 'receptionist').length, color: 'bg-blue-500' },
                  { name: 'Lab Technician', count: users.filter(u => u.role === 'lab_tech').length, color: 'bg-green-500' },
                  { name: 'Clerk', count: users.filter(u => u.role === 'clerk').length, color: 'bg-purple-500' },
                  { name: 'Owner', count: users.filter(u => u.role === 'owner').length, color: 'bg-orange-500' },
                ].map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${dept.color}`}></div>
                      <p className="font-medium text-gray-900">{dept.name}</p>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{dept.count}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <Card title="Today&apos;s Attendance">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Employee</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Role</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Check In</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Check Out</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Hours</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        <UserCheck className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No attendance records for today</p>
                      </td>
                    </tr>
                  ) : (
                    todayAttendance.map((record) => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{getEmployeeName(record.employeeId)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm capitalize">
                            {employees.find(e => e.id === record.employeeId)?.position || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {record.checkIn ? (
                            <span className="text-gray-900 font-medium">{formatTime(record.checkIn)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {record.checkOut ? (
                            <span className="text-gray-900 font-medium">{formatTime(record.checkOut)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {record.checkIn && record.checkOut ? (
                            <span className="font-medium text-gray-900">
                              {calculateHours(record.checkIn, record.checkOut)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            record.status === 'present' ? 'bg-green-100 text-green-800' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                            record.status === 'absent' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Leave Management Tab */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <Card title="Leave Requests">
            <div className="space-y-3">
              {leaveRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No leave requests</p>
                </div>
              ) : (
                leaveRequests.map((leave) => (
                  <div
                    key={leave.id}
                    className={`p-4 rounded-lg border-2 ${
                      leave.status === 'pending' ? 'border-orange-200 bg-orange-50' :
                      leave.status === 'approved' ? 'border-green-200 bg-green-50' :
                      'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-gray-900">{getEmployeeName(leave.employeeId)}</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            leave.status === 'pending' ? 'bg-orange-200 text-orange-900' :
                            leave.status === 'approved' ? 'bg-green-200 text-green-900' :
                            'bg-red-200 text-red-900'
                          }`}>
                            {leave.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Leave Type</p>
                            <p className="font-medium text-gray-900 capitalize">{leave.leaveType.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Duration</p>
                            <p className="font-medium text-gray-900">{leave.days} days</p>
                          </div>
                          <div>
                            <p className="text-gray-600">From</p>
                            <p className="font-medium text-gray-900">{formatDate(leave.startDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">To</p>
                            <p className="font-medium text-gray-900">{formatDate(leave.endDate)}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-600">Reason</p>
                            <p className="font-medium text-gray-900">{leave.reason}</p>
                          </div>
                        </div>
                      </div>
                      
                      {leave.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleLeaveAction(leave.id, 'approved')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleLeaveAction(leave.id, 'rejected', 'Rejected by owner')}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {leave.status !== 'pending' && leave.reviewNotes && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Review Notes:</span> {leave.reviewNotes}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <Card title="Performance Metrics">
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Performance Analytics Coming Soon</p>
              <p className="text-sm">Track employee productivity, test processing times, and quality metrics</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
