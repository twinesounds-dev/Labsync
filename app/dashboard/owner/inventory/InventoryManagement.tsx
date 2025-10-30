'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import Card from '@/components/ui/Card';
import { Package, AlertTriangle, PlusCircle, TrendingDown, RefreshCw, Search } from 'lucide-react';
import { InventoryItem, StockAlert } from '@/types';
import { useAuth } from '@/lib/auth-context';

interface InventoryManagementProps {
  facilityId: string | 'all';
}

export default function InventoryManagement({ facilityId }: InventoryManagementProps) {
  const { userProfile } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'test_kits' as InventoryItem['category'],
    description: '',
    currentStock: 0,
    minimumStock: 0,
    unit: '',
    costPerUnit: 0,
    supplier: '',
  });

  const [restockAmount, setRestockAmount] = useState(0);

  useEffect(() => {
    if (!userProfile) return;

    const unsubscribers: (() => void)[] = [];

    // Subscribe to inventory items
    const inventoryQueryConstraints = [
      ...(facilityId !== 'all' ? [where('facilityId', '==', facilityId)] : []),
      orderBy('name'),
    ];

    const inventoryQuery = query(
      collection(db, COLLECTIONS.INVENTORY_ITEMS),
      ...inventoryQueryConstraints
    );

    const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setInventoryItems(items);

      // Auto-generate stock alerts
      items.forEach(async (item) => {
        if (item.currentStock <= item.minimumStock) {
          const severity = item.currentStock === 0 ? 'critical' : item.currentStock < item.minimumStock * 0.5 ? 'high' : 'medium';
          const alertType = item.currentStock === 0 ? 'out_of_stock' : 'low_stock';

          // Check if alert already exists
          const alertsQuery = query(
            collection(db, COLLECTIONS.STOCK_ALERTS),
            where('inventoryItemId', '==', item.id),
            where('acknowledged', '==', false)
          );

          onSnapshot(alertsQuery, (alertSnapshot) => {
            if (alertSnapshot.empty) {
              addDoc(collection(db, COLLECTIONS.STOCK_ALERTS), {
                facilityId: item.facilityId,
                inventoryItemId: item.id,
                alertType,
                severity,
                message: `${item.name} is ${alertType === 'out_of_stock' ? 'out of stock' : 'running low'}. Current: ${item.currentStock} ${item.unit}, Minimum: ${item.minimumStock} ${item.unit}`,
                acknowledged: false,
                createdAt: Timestamp.now(),
              });
            }
          });
        }
      });
    });
    unsubscribers.push(unsubInventory);

    // Subscribe to stock alerts
    const alertsQueryConstraints = [
      ...(facilityId !== 'all' ? [where('facilityId', '==', facilityId)] : []),
      where('acknowledged', '==', false),
      orderBy('createdAt', 'desc'),
    ];

    const alertsQuery = query(
      collection(db, COLLECTIONS.STOCK_ALERTS),
      ...alertsQueryConstraints
    );

    const unsubAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const alerts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StockAlert[];
      setStockAlerts(alerts);
    });
    unsubscribers.push(unsubAlerts);

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [userProfile, facilityId]);

  const handleAddItem = async () => {
    if (!userProfile || facilityId === 'all') return;

    try {
      await addDoc(collection(db, COLLECTIONS.INVENTORY_ITEMS), {
        facilityId,
        name: newItem.name,
        category: newItem.category,
        description: newItem.description,
        currentStock: Number(newItem.currentStock),
        minimumStock: Number(newItem.minimumStock),
        unit: newItem.unit,
        costPerUnit: Number(newItem.costPerUnit),
        supplier: newItem.supplier,
        testsUsing: [],
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setShowAddItemModal(false);
      setNewItem({
        name: '',
        category: 'test_kits',
        description: '',
        currentStock: 0,
        minimumStock: 0,
        unit: '',
        costPerUnit: 0,
        supplier: '',
      });
    } catch (error) {
      console.error('Error adding inventory item:', error);
    }
  };

  const handleRestock = async () => {
    if (!selectedItem || !restockAmount) return;

    try {
      const itemRef = doc(db, COLLECTIONS.INVENTORY_ITEMS, selectedItem.id);
      await updateDoc(itemRef, {
        currentStock: selectedItem.currentStock + restockAmount,
        lastRestockDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Acknowledge related alerts
      const alertsQuery = query(
        collection(db, COLLECTIONS.STOCK_ALERTS),
        where('inventoryItemId', '==', selectedItem.id),
        where('acknowledged', '==', false)
      );

      onSnapshot(alertsQuery, (snapshot) => {
        snapshot.docs.forEach(async (alertDoc) => {
          await updateDoc(doc(db, COLLECTIONS.STOCK_ALERTS, alertDoc.id), {
            acknowledged: true,
            acknowledgedBy: userProfile?.id,
            acknowledgedAt: Timestamp.now(),
          });
        });
      });

      setShowRestockModal(false);
      setSelectedItem(null);
      setRestockAmount(0);
    } catch (error) {
      console.error('Error restocking item:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.STOCK_ALERTS, alertId), {
        acknowledged: true,
        acknowledgedBy: userProfile?.id,
        acknowledgedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.currentStock === 0) return { label: 'Out of Stock', color: 'text-red-600' };
    if (item.currentStock <= item.minimumStock * 0.5) return { label: 'Critical', color: 'text-orange-600' };
    if (item.currentStock <= item.minimumStock) return { label: 'Low Stock', color: 'text-yellow-600' };
    return { label: 'In Stock', color: 'text-green-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory & Consumables Management</h2>
          <p className="text-gray-600 mt-1">
            {facilityId === 'all' ? 'All facilities' : 'Single facility view'}
          </p>
        </div>
        <button
          onClick={() => setShowAddItemModal(true)}
          disabled={facilityId === 'all'}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusCircle className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Items</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{inventoryItems.length}</p>
              <p className="text-xs text-blue-600 mt-1">Active inventory</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600 font-medium">Low Stock Alerts</p>
              <p className="text-3xl font-bold text-red-900 mt-1">
                {stockAlerts.filter(a => a.alertType === 'low_stock').length}
              </p>
              <p className="text-xs text-red-600 mt-1">Needs attention</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Out of Stock</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">
                {stockAlerts.filter(a => a.alertType === 'out_of_stock').length}
              </p>
              <p className="text-xs text-orange-600 mt-1">Urgent reorder</p>
            </div>
            <TrendingDown className="w-10 h-10 text-orange-500 opacity-50" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Total Value</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                UGX {inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0).toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">Current inventory</p>
            </div>
            <Package className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Stock Alerts */}
      {stockAlerts.length > 0 && (
        <Card title="Active Stock Alerts" className="border-red-200 bg-red-50">
          <div className="space-y-2">
            {stockAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm opacity-75 capitalize">{alert.severity} priority</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const item = inventoryItems.find(i => i.id === alert.inventoryItemId);
                      if (item) {
                        setSelectedItem(item);
                        setShowRestockModal(true);
                      }
                    }}
                    className="px-3 py-1 bg-white rounded hover:bg-gray-100 transition-colors text-sm"
                  >
                    Restock
                  </button>
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-3 py-1 bg-white rounded hover:bg-gray-100 transition-colors text-sm"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Categories</option>
            <option value="test_kits">Test Kits</option>
            <option value="sample_containers">Sample Containers</option>
            <option value="safety_equipment">Safety Equipment</option>
            <option value="reagents">Reagents</option>
            <option value="disposables">Disposables</option>
            <option value="other">Other</option>
          </select>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card title="Inventory Items">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Item Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Current Stock</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Min. Stock</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Unit Cost</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Total Value</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No inventory items found</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm capitalize">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        {item.minimumStock} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">
                        UGX {item.costPerUnit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        UGX {(item.currentStock * item.costPerUnit).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setShowRestockModal(true);
                          }}
                          className="p-2 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                          title="Restock"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add Inventory Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="e.g., Malaria RDT Strips"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value as InventoryItem['category'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="test_kits">Test Kits</option>
                  <option value="sample_containers">Sample Containers</option>
                  <option value="safety_equipment">Safety Equipment</option>
                  <option value="reagents">Reagents</option>
                  <option value="disposables">Disposables</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock *
                </label>
                <input
                  type="number"
                  value={newItem.currentStock || ''}
                  onChange={(e) => setNewItem({ ...newItem, currentStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock *
                </label>
                <input
                  type="number"
                  value={newItem.minimumStock || ''}
                  onChange={(e) => setNewItem({ ...newItem, minimumStock: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="e.g., strips, pairs, tubes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Per Unit (UGX) *
                </label>
                <input
                  type="number"
                  value={newItem.costPerUnit || ''}
                  onChange={(e) => setNewItem({ ...newItem, costPerUnit: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="0"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  value={newItem.supplier}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Supplier name"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItem.name || !newItem.unit || newItem.currentStock < 0 || newItem.minimumStock < 0}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Restock Item</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{selectedItem.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Current Stock: {selectedItem.currentStock} {selectedItem.unit}
                </p>
                <p className="text-sm text-gray-600">
                  Minimum Stock: {selectedItem.minimumStock} {selectedItem.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restock Amount ({selectedItem.unit})
                </label>
                <input
                  type="number"
                  value={restockAmount || ''}
                  onChange={(e) => setRestockAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="0"
                  min="1"
                />
              </div>

              {restockAmount > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    New Stock Level: <span className="font-bold text-gray-900">
                      {selectedItem.currentStock + restockAmount} {selectedItem.unit}
                    </span>
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Cost: <span className="font-bold text-gray-900">
                      UGX {(restockAmount * selectedItem.costPerUnit).toLocaleString()}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setSelectedItem(null);
                  setRestockAmount(0);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                disabled={restockAmount <= 0}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
