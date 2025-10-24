'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter, Eye, CreditCard, Smartphone, Building2, Receipt } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import PaymentForm from '@/components/payments/PaymentForm';
import { Payment, Patient } from '@/lib/types';

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - in a real app, this would come from the database
  useEffect(() => {
    const mockPayments: Payment[] = [
      {
        id: '1',
        patientId: '1',
        patient: {
          id: '1',
          patientId: 'FLNT-00123',
          surname: 'Doe',
          givenName: 'John',
          dateOfBirth: new Date('1985-05-15'),
          gender: 'Male',
          maritalStatus: 'Married',
          phoneNumber: '+256 700 123 456',
          facilityId: 'flnt',
          registrationDate: new Date('2024-12-20'),
          address: {
            village: 'Kampala Central',
            parish: 'Nakasero',
            subCounty: 'Kampala Central',
            district: 'Kampala',
          },
          urgency: 'Routine',
          paymentType: 'Cash',
          isActive: true,
          createdAt: new Date('2024-12-20'),
          updatedAt: new Date('2024-12-20'),
        },
        facilityId: 'flnt',
        invoiceNumber: 'INV-FLNT-20241224-001',
        tests: [
          {
            testId: 'fbc',
            test: {
              id: 'fbc',
              categoryId: 'hematology',
              name: 'Full Hemogram',
              code: 'FBC',
              price: 15000,
              turnaroundTime: '2 hours',
              sampleType: 'Blood',
              normalRanges: [],
              isActive: true,
              createdAt: new Date(),
            },
            name: 'Full Hemogram',
            price: 15000,
          },
          {
            testId: 'mp',
            test: {
              id: 'mp',
              categoryId: 'hematology',
              name: 'Malaria Parasite Test',
              code: 'MP',
              price: 5000,
              turnaroundTime: '30 mins',
              sampleType: 'Blood',
              normalRanges: [],
              isActive: true,
              createdAt: new Date(),
            },
            name: 'Malaria Parasite Test',
            price: 5000,
          },
        ],
        subtotal: 20000,
        discount: 0,
        tax: 0,
        total: 20000,
        amountPaid: 20000,
        balance: 0,
        paymentMethod: 'Cash',
        receivedBy: 'user1',
        receivedByUser: {
          id: 'user1',
          email: 'receptionist@labsync.ug',
          name: 'Jane Receptionist',
          role: 'receptionist',
          facilityId: 'flnt',
          isActive: true,
          createdAt: new Date(),
        },
        paymentDate: new Date('2024-12-24T09:30:00'),
        status: 'Paid',
        notes: 'Payment received in full',
      },
      {
        id: '2',
        patientId: '2',
        patient: {
          id: '2',
          patientId: 'FLNT-00124',
          surname: 'Smith',
          givenName: 'Jane',
          dateOfBirth: new Date('1990-08-22'),
          gender: 'Female',
          maritalStatus: 'Single',
          phoneNumber: '+256 700 987 654',
          facilityId: 'flnt',
          registrationDate: new Date('2024-12-21'),
          address: {
            village: 'Mbarara Town',
            parish: 'Kakoba',
            subCounty: 'Mbarara Municipality',
            district: 'Mbarara',
          },
          urgency: 'Urgent',
          paymentType: 'Insurance',
          insuranceProvider: 'AAR Insurance',
          insuranceNumber: 'AAR123456',
          isActive: true,
          createdAt: new Date('2024-12-21'),
          updatedAt: new Date('2024-12-21'),
        },
        facilityId: 'flnt',
        invoiceNumber: 'INV-FLNT-20241224-002',
        tests: [
          {
            testId: 'bhcg',
            test: {
              id: 'bhcg',
              categoryId: 'hormones',
              name: 'Beta HCG',
              code: 'BHCG',
              price: 25000,
              turnaroundTime: '2 hours',
              sampleType: 'Blood',
              normalRanges: [],
              isActive: true,
              createdAt: new Date(),
            },
            name: 'Beta HCG',
            price: 25000,
          },
        ],
        subtotal: 25000,
        discount: 0,
        tax: 0,
        total: 25000,
        amountPaid: 0,
        balance: 25000,
        paymentMethod: 'Insurance',
        receivedBy: 'user1',
        receivedByUser: {
          id: 'user1',
          email: 'receptionist@labsync.ug',
          name: 'Jane Receptionist',
          role: 'receptionist',
          facilityId: 'flnt',
          isActive: true,
          createdAt: new Date(),
        },
        paymentDate: new Date('2024-12-24T10:00:00'),
        status: 'Pending',
        notes: 'Insurance claim pending',
      },
    ];

    setPayments(mockPayments);
    setFilteredPayments(mockPayments);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.patient?.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.patient?.givenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.patient?.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    setFilteredPayments(filtered);
  }, [searchTerm, statusFilter, payments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash':
        return <CreditCard className="h-4 w-4" />;
      case 'Mobile Money':
        return <Smartphone className="h-4 w-4" />;
      case 'Insurance':
        return <Building2 className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsFormOpen(true);
  };

  const handleView = (payment: Payment) => {
    setSelectedPayment(payment);
    // In a real app, this would navigate to a detailed view or open a receipt
    console.log('View payment:', payment);
  };

  const handleFormSubmit = (paymentData: Omit<Payment, 'id' | 'paymentDate'>) => {
    if (selectedPayment) {
      // Update existing payment
      const updatedPayments = payments.map(p =>
        p.id === selectedPayment.id
          ? { ...p, ...paymentData }
          : p
      );
      setPayments(updatedPayments);
      setFilteredPayments(updatedPayments);
    } else {
      // Add new payment
      const newPayment: Payment = {
        ...paymentData,
        id: Date.now().toString(),
        paymentDate: new Date(),
      };
      setPayments([newPayment, ...payments]);
      setFilteredPayments([newPayment, ...filteredPayments]);
    }
    setIsFormOpen(false);
    setSelectedPayment(null);
  };

  const totalRevenue = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + p.amountPaid, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + p.balance, 0);

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
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-2">
            Manage payments and financial transactions
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Payment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {payments.filter(p => p.status === 'Paid').length} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              From {payments.filter(p => p.status === 'Pending').length} pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              All payment records
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
                  placeholder="Search payments by patient name, ID, or invoice number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <div className="grid gap-4">
        {filteredPayments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 text-lg">No payments found</p>
              <p className="text-gray-400 mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Get started by recording your first payment'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPayments.map((payment) => (
            <Card key={payment.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {payment.patient?.givenName} {payment.patient?.surname}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Invoice: {payment.invoiceNumber}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span className="ml-1">{payment.paymentMethod}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Tests:</strong> {payment.tests.length} test(s)
                        </p>
                        <div className="mt-1 space-y-1">
                          {payment.tests.map((test, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span>{test.name}</span>
                              <span className="text-gray-500">{formatCurrency(test.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <strong>Payment Date:</strong> {formatDate(payment.paymentDate)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Received By:</strong> {payment.receivedByUser?.name}
                        </p>
                        {payment.mobileMoneyNumber && (
                          <p className="text-sm text-gray-600">
                            <strong>Mobile Money:</strong> {payment.mobileMoneyNumber}
                          </p>
                        )}
                        {payment.transactionId && (
                          <p className="text-sm text-gray-600">
                            <strong>Transaction ID:</strong> {payment.transactionId}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Subtotal</p>
                        <p className="font-medium">{formatCurrency(payment.subtotal)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Discount</p>
                        <p className="font-medium">{formatCurrency(payment.discount || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount Paid</p>
                        <p className="font-medium text-green-600">{formatCurrency(payment.amountPaid)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Balance</p>
                        <p className={`font-medium ${payment.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(payment.balance)}
                        </p>
                      </div>
                    </div>

                    {payment.notes && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Notes:</strong> {payment.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold">
                        Total: {formatCurrency(payment.total)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(payment)}
                        >
                          Edit
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

      {/* Payment Form Modal */}
      {isFormOpen && (
        <PaymentForm
          payment={selectedPayment}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedPayment(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}