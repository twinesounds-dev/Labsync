'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, Timestamp, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import { DollarSign, TrendingUp, TrendingDown, PlusCircle, Receipt, Calendar, Wallet, CreditCard, Smartphone } from 'lucide-react';
import { Expenditure } from '@/types';
import { useAuth } from '@/lib/auth-context';

interface FinancialManagementProps {
  facilityId: string | 'all';
}

export default function FinancialManagement({ facilityId }: FinancialManagementProps) {
  const { userProfile } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  
  const [financialData, setFinancialData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    cashIncome: 0,
    mobileMoneyIncome: 0,
    insuranceIncome: 0,
    cardIncome: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState<Array<{ id: string; [key: string]: unknown }>>([]);
  const [expenses, setExpenses] = useState<Expenditure[]>([]);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);

  // New expense form state
  const [newExpense, setNewExpense] = useState({
    category: 'consumables' as Expenditure['category'],
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const getPeriodQuery = useCallback(() => {
    const now = new Date();
    const startDate = new Date();

    switch (selectedPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return Timestamp.fromDate(startDate);
  }, [selectedPeriod]);

  useEffect(() => {
    if (!userProfile) return;

    const unsubscribers: (() => void)[] = [];
    const periodStart = getPeriodQuery();

    // Subscribe to payments for income tracking
    const paymentsQueryConstraints = [
      ...(facilityId !== 'all' ? [where('facilityId', '==', facilityId)] : []),
      where('createdAt', '>=', periodStart),
      orderBy('createdAt', 'desc'),
    ];

    const paymentsQuery = query(
      collection(db, COLLECTIONS.PAYMENTS),
      ...paymentsQueryConstraints
    );

    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      let totalIncome = 0;
      let cashIncome = 0;
      let mobileMoneyIncome = 0;
      let insuranceIncome = 0;
      let cardIncome = 0;

      const transactions = snapshot.docs.map((doc) => {
        const data = doc.data();
        totalIncome += data.total || 0;

        switch (data.paymentMethod) {
          case 'Cash':
            cashIncome += data.total || 0;
            break;
          case 'Mobile Money':
            mobileMoneyIncome += data.total || 0;
            break;
          case 'Insurance':
            insuranceIncome += data.total || 0;
            break;
          case 'Card':
            cardIncome += data.total || 0;
            break;
        }

        return { id: doc.id, ...data };
      });

      setFinancialData((prev) => ({
        ...prev,
        totalIncome,
        cashIncome,
        mobileMoneyIncome,
        insuranceIncome,
        cardIncome,
      }));

      setRecentTransactions(transactions.slice(0, 10));
    });
    unsubscribers.push(unsubPayments);

    // Subscribe to expenditures
    const expendituresQueryConstraints = [
      ...(facilityId !== 'all' ? [where('facilityId', '==', facilityId)] : []),
      orderBy('date', 'desc'),
      limit(50),
    ];

    const expendituresQuery = query(
      collection(db, COLLECTIONS.EXPENDITURES),
      ...expendituresQueryConstraints
    );

    const unsubExpenses = onSnapshot(expendituresQuery, (snapshot) => {
      const expensesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Expenditure[];

      const totalExpenses = expensesData.reduce((sum, exp) => {
        const expDate = exp.date instanceof Timestamp ? exp.date.toDate() : new Date(exp.date);
        if (expDate >= periodStart.toDate()) {
          return sum + exp.amount;
        }
        return sum;
      }, 0);

      setExpenses(expensesData);
      setFinancialData((prev) => ({
        ...prev,
        totalExpenses,
        netProfit: prev.totalIncome - totalExpenses,
      }));
    });
    unsubscribers.push(unsubExpenses);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [userProfile, facilityId, selectedPeriod, getPeriodQuery]);

  const handleAddExpense = async () => {
    if (!userProfile || facilityId === 'all') return;

    try {
      await addDoc(collection(db, COLLECTIONS.EXPENDITURES), {
        facilityId,
        category: newExpense.category,
        amount: Number(newExpense.amount),
        description: newExpense.description,
        date: Timestamp.fromDate(new Date(newExpense.date)),
        createdBy: userProfile.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setShowAddExpenseModal(false);
      setNewExpense({
        category: 'consumables',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString('en-UG')}`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Management</h2>
          <p className="text-gray-600 mt-1">
            {facilityId === 'all' ? 'All facilities' : 'Single facility view'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddExpenseModal(true)}
            disabled={facilityId === 'all'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-5 h-5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['today', 'week', 'month', 'year'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedPeriod === period
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Income</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(financialData.totalIncome)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-600">+12.5%</p>
              </div>
            </div>
            <DollarSign className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Total Expenses</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {formatCurrency(financialData.totalExpenses)}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <p className="text-xs text-red-600">-5.3%</p>
              </div>
            </div>
            <Receipt className="w-10 h-10 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Net Profit</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {formatCurrency(financialData.netProfit)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {((financialData.netProfit / financialData.totalIncome) * 100 || 0).toFixed(1)}% margin
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Tax Estimate</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {formatCurrency(financialData.netProfit * 0.30)}
              </p>
              <p className="text-xs text-purple-600 mt-1">30% of net profit</p>
            </div>
            <Calendar className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Income Breakdown */}
      <Card title="Income Breakdown by Payment Method">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Wallet className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Cash</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(financialData.cashIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Mobile Money</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(financialData.mobileMoneyIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Card</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(financialData.cardIncome)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Receipt className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Insurance</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(financialData.insuranceIncome)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Transactions & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Transactions">
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No transactions yet</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">{String(transaction.invoiceNumber)}</p>
                      <p className="text-sm text-gray-600">{String(transaction.paymentMethod)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(Number(transaction.total))}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Recent Expenses">
          <div className="space-y-2">
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No expenses recorded yet</p>
              </div>
            ) : (
              expenses.slice(0, 10).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-600 capitalize">{expense.category.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      -{formatCurrency(expense.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(expense.date)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Expense</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, category: e.target.value as Expenditure['category'] })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="consumables">Consumables</option>
                  <option value="salaries">Salaries</option>
                  <option value="utilities">Utilities</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="rent">Rent</option>
                  <option value="equipment">Equipment</option>
                  <option value="marketing">Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (UGX)
                </label>
                <input
                  type="number"
                  value={newExpense.amount || ''}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={3}
                  placeholder="Enter expense details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                disabled={!newExpense.amount || !newExpense.description}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
