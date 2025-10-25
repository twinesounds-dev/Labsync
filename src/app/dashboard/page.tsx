'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TestTube, CreditCard, FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  // Mock data - in a real app, this would come from the database
  const stats = {
    totalPatients: 1247,
    testsToday: 89,
    pendingResults: 23,
    completedResults: 66,
    totalRevenue: 2450000,
    monthlyGrowth: 12.5,
  };

  const recentActivities = [
    {
      id: 1,
      type: 'patient',
      message: 'New patient registered: John Doe (FLNT-00123)',
      time: '2 minutes ago',
      icon: Users,
    },
    {
      id: 2,
      type: 'test',
      message: 'Test results completed: Full Hemogram for Jane Smith',
      time: '15 minutes ago',
      icon: TestTube,
    },
    {
      id: 3,
      type: 'payment',
      message: 'Payment received: UGX 45,000 from ABC Hospital',
      time: '1 hour ago',
      icon: CreditCard,
    },
    {
      id: 4,
      type: 'report',
      message: 'Lab report generated: RPT-FLNT-20241224-001',
      time: '2 hours ago',
      icon: FileText,
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome to your LabSync dashboard. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Today</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testsToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedResults} completed, {stats.pendingResults} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Results</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingResults}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              UGX {stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest updates from your laboratory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <activity.icon className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button className="w-full text-left p-3 rounded-md border hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Register New Patient</p>
                    <p className="text-sm text-gray-500">Add patient information</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-md border hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <TestTube className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Create Test Request</p>
                    <p className="text-sm text-gray-500">Order laboratory tests</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-md border hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Generate Report</p>
                    <p className="text-sm text-gray-500">Print lab results</p>
                  </div>
                </div>
              </button>

              <button className="w-full text-left p-3 rounded-md border hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Process Payment</p>
                    <p className="text-sm text-gray-500">Record payment</p>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Completed Today</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completedResults}</div>
            <p className="text-sm text-gray-500">Tests completed successfully</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>In Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.pendingResults}</div>
            <p className="text-sm text-gray-500">Tests awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Growth Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">+{stats.monthlyGrowth}%</div>
            <p className="text-sm text-gray-500">Monthly growth in tests</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}