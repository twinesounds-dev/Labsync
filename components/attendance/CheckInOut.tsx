'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { AttendanceRecord, Employee } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { Clock, CheckCircle, LogOut, Calendar } from 'lucide-react';

export default function CheckInOut() {
  const { userProfile } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!userProfile) return;

    const today = new Date().toISOString().split('T')[0];

    // Get employee record
    const employeeQuery = query(
      collection(db, COLLECTIONS.EMPLOYEES),
      where('userId', '==', userProfile.id),
      where('facilityId', '==', userProfile.facilityId)
    );

    const unsubEmployee = onSnapshot(employeeQuery, (snapshot) => {
      if (!snapshot.empty) {
        const empData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Employee;
        setEmployee(empData);

        // Check today's attendance
        const attendanceQuery = query(
          collection(db, COLLECTIONS.ATTENDANCE_RECORDS),
          where('employeeId', '==', empData.id),
          where('date', '==', today)
        );

        onSnapshot(attendanceQuery, (attSnapshot) => {
          if (!attSnapshot.empty) {
            setTodayAttendance({
              id: attSnapshot.docs[0].id,
              ...attSnapshot.docs[0].data(),
            } as AttendanceRecord);
          } else {
            setTodayAttendance(null);
          }
        });
      }
    });

    return () => unsubEmployee();
  }, [userProfile]);

  const handleCheckIn = async () => {
    if (!userProfile || !employee) return;

    setLoading(true);

    try {
      const now = Timestamp.now();
      const today = new Date().toISOString().split('T')[0];
      
      // Determine if late (after 9 AM)
      const currentHour = new Date().getHours();
      const status = currentHour > 9 ? 'late' : 'present';

      await addDoc(collection(db, COLLECTIONS.ATTENDANCE_RECORDS), {
        employeeId: employee.id,
        facilityId: userProfile.facilityId,
        date: today,
        checkIn: now,
        checkOut: null,
        hoursWorked: 0,
        status,
        ipAddress: '', // You can add IP tracking if needed
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!userProfile || !todayAttendance || !todayAttendance.checkIn) return;

    setLoading(true);

    try {
      const now = Timestamp.now();
      const checkInTime = todayAttendance.checkIn instanceof Timestamp 
        ? todayAttendance.checkIn.toDate() 
        : new Date(todayAttendance.checkIn);
      
      const hoursWorked = (now.toDate().getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      await updateDoc(doc(db, COLLECTIONS.ATTENDANCE_RECORDS, todayAttendance.id), {
        checkOut: now,
        hoursWorked: parseFloat(hoursWorked.toFixed(2)),
        updatedAt: now,
      });
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Failed to check out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getCheckInTime = () => {
    if (!todayAttendance?.checkIn) return null;
    const checkIn = todayAttendance.checkIn instanceof Timestamp 
      ? todayAttendance.checkIn.toDate() 
      : new Date(todayAttendance.checkIn);
    return checkIn;
  };

  const getWorkingHours = () => {
    const checkIn = getCheckInTime();
    if (!checkIn) return '0:00:00';
    
    const now = new Date();
    const diff = now.getTime() - checkIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!employee) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          No employee record found. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Attendance</h2>
            <p className="text-sm text-gray-600">{formatDate(currentTime)}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-mono font-bold text-gray-900">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {!todayAttendance ? (
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Clock className="w-12 h-12 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-700 mb-4">
              You haven&apos;t checked in today. Please check in to start your shift.
            </p>
            <button
              onClick={handleCheckIn}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              <CheckCircle className="w-5 h-5" />
              {loading ? 'Checking In...' : 'Check In Now'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">Checked In</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                todayAttendance.status === 'present' 
                  ? 'bg-green-200 text-green-900'
                  : 'bg-yellow-200 text-yellow-900'
              }`}>
                {todayAttendance.status === 'present' ? 'On Time' : 'Late'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Check In Time</p>
                <p className="font-bold text-gray-900">
                  {formatTime(getCheckInTime()!)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Working Hours</p>
                <p className="font-bold text-gray-900 font-mono">
                  {getWorkingHours()}
                </p>
              </div>
            </div>
          </div>

          {!todayAttendance.checkOut && (
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              {loading ? 'Checking Out...' : 'Check Out'}
            </button>
          )}

          {todayAttendance.checkOut && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <LogOut className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Already Checked Out</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Check Out Time</p>
                  <p className="font-bold text-gray-900">
                    {formatTime(
                      todayAttendance.checkOut instanceof Timestamp
                        ? todayAttendance.checkOut.toDate()
                        : new Date(todayAttendance.checkOut)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Hours</p>
                  <p className="font-bold text-gray-900">
                    {todayAttendance.hoursWorked.toFixed(2)} hrs
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
