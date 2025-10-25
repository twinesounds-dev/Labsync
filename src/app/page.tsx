'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestTube, Shield, Users, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <TestTube className="h-16 w-16 text-primary mr-4" />
              <h1 className="text-4xl font-bold text-gray-900">LabSync</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive Multi-Facility Laboratory Management System for Medical Laboratories in Uganda
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Multi-Facility Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Manage multiple laboratory facilities under one unified platform with role-based access control.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Complete Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  From patient registration to result approval, streamline your entire laboratory workflow.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track performance, revenue, and operational metrics with comprehensive dashboards.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Login Form */}
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Sign In</CardTitle>
                <CardDescription className="text-center">
                  Enter your credentials to access LabSync
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm />
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-gray-500">
            <p>&copy; 2024 LabSync. All rights reserved.</p>
            <p className="text-sm mt-2">
              Designed specifically for medical laboratories in Uganda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}