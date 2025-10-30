'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/firestore';
import { InventoryItem } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { Package, Plus, Minus, AlertTriangle } from 'lucide-react';

interface ConsumableUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  testResultId?: string;
  testRequestId?: string;
  usageType: 'test' | 'sample_collection' | 'quality_control' | 'other';
}

export default function ConsumableUsageModal({
  isOpen,
  onClose,
  testResultId,
  testRequestId,
  usageType,
}: ConsumableUsageModalProps) {
  const { userProfile } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{
    itemId: string;
    quantity: number;
  }[]>([]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userProfile?.facilityId) return;

    // Subscribe to inventory items for this facility
    const inventoryQuery = query(
      collection(db, COLLECTIONS.INVENTORY_ITEMS),
      where('facilityId', '==', userProfile.facilityId),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(inventoryQuery, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InventoryItem[];
      setInventoryItems(items);
    });

    return () => unsubscribe();
  }, [isOpen, userProfile]);

  const handleAddItem = (itemId: string) => {
    if (selectedItems.find(item => item.itemId === itemId)) {
      // Item already added, increase quantity
      setSelectedItems(prev =>
        prev.map(item =>
          item.itemId === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Add new item
      setSelectedItems(prev => [...prev, { itemId, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.itemId !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
    } else {
      setSelectedItems(prev =>
        prev.map(item =>
          item.itemId === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleSubmit = async () => {
    if (!userProfile || selectedItems.length === 0) return;

    setLoading(true);

    try {
      // Record each consumable usage
      for (const selectedItem of selectedItems) {
        const item = inventoryItems.find(i => i.id === selectedItem.itemId);
        if (!item) continue;

        // Add usage record
        await addDoc(collection(db, COLLECTIONS.CONSUMABLE_USAGE), {
          facilityId: userProfile.facilityId,
          inventoryItemId: selectedItem.itemId,
          testResultId: testResultId || null,
          testRequestId: testRequestId || null,
          quantity: selectedItem.quantity,
          usedBy: userProfile.id,
          usageType,
          notes,
          date: Timestamp.now(),
          createdAt: Timestamp.now(),
        });

        // Update inventory stock
        const newStock = item.currentStock - selectedItem.quantity;
        await updateDoc(doc(db, COLLECTIONS.INVENTORY_ITEMS, selectedItem.itemId), {
          currentStock: Math.max(0, newStock),
          updatedAt: Timestamp.now(),
        });
      }

      // Reset and close
      setSelectedItems([]);
      setNotes('');
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error('Error recording consumable usage:', error);
      alert('Failed to record consumable usage. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getItemDetails = (itemId: string) => {
    return inventoryItems.find(i => i.id === itemId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Record Consumable Usage</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select items used for this {usageType.replace('_', ' ')}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search consumables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">Selected Items</h3>
                <div className="space-y-2">
                  {selectedItems.map((selectedItem) => {
                    const item = getItemDetails(selectedItem.itemId);
                    if (!item) return null;

                    const hasEnoughStock = item.currentStock >= selectedItem.quantity;

                    return (
                      <div
                        key={selectedItem.itemId}
                        className={`flex items-center justify-between p-3 bg-white rounded-lg ${
                          !hasEnoughStock ? 'border-2 border-red-300' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Available: {item.currentStock} {item.unit}
                          </p>
                          {!hasEnoughStock && (
                            <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                              <AlertTriangle className="w-3 h-3" />
                              Insufficient stock!
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleUpdateQuantity(selectedItem.itemId, selectedItem.quantity - 1)}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={selectedItem.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(selectedItem.itemId, parseInt(e.target.value) || 0)
                            }
                            className="w-16 text-center px-2 py-1 border border-gray-300 rounded"
                            min="0"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(selectedItem.itemId, selectedItem.quantity + 1)}
                            className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(selectedItem.itemId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Items */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Available Consumables</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No consumables found</p>
                  </div>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedItems.some(si => si.itemId === item.id);
                    const isLowStock = item.currentStock <= item.minimumStock;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {isLowStock && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                                Low Stock
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            Stock: {item.currentStock} {item.unit}
                          </p>
                        </div>
                        <button
                          onClick={() => handleAddItem(item.id)}
                          disabled={item.currentStock === 0}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSelected ? 'Add More' : 'Add'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                rows={3}
                placeholder="Add any additional notes about this usage..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedItems.length === 0 || selectedItems.some(si => {
              const item = getItemDetails(si.itemId);
              return !item || item.currentStock < si.quantity;
            })}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Recording...' : `Record Usage (${selectedItems.length} items)`}
          </button>
        </div>
      </div>
    </div>
  );
}
