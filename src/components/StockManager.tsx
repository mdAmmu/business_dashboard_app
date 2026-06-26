import React, { useEffect, useState } from 'react';
import { Package, Edit, Save, X, Plus, AlertTriangle, RotateCcw, Clock } from 'lucide-react';

interface StockItem {
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface Stock {
  [key: string]: StockItem;
}

interface StockHistory {
  id: string;
  productId: string;
  productName: string;
  type: 'return' | 'expire';
  quantity: number;
  reason: string;
  timestamp: string;
}

const StockManager: React.FC = () => {
  const [stock, setStock] = useState<Stock>({});
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ quantity: number; price: number }>({ quantity: 0, price: 0 });
  const [showModal, setShowModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'return' | 'expire' | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);
  const [actionQuantity, setActionQuantity] = useState(0);
  const [actionReason, setActionReason] = useState('');
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchStock();
    fetchStockHistory();
  }, []);

  const fetchStock = async () => {
    try {
      const response = await fetch('/api/stock');
      const data = await response.json();
      setStock(data);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockHistory = async () => {
    try {
      const response = await fetch('/api/stock/history');
      const data = await response.json();
      setStockHistory(data);
    } catch (error) {
      console.error('Error fetching stock history:', error);
    }
  };

  const handleReturnExpire = async () => {
    if (!selectedProduct || !selectedAction || actionQuantity <= 0 || !actionReason.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/stock/${selectedProduct.id}/${selectedAction}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: actionQuantity,
          reason: actionReason,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStock(prev => ({
          ...prev,
          [selectedProduct.id]: data.product
        }));
        fetchStockHistory();
        setShowModal(false);
        resetModal();
      }
    } catch (error) {
      console.error('Error processing action:', error);
    }
  };

  const resetModal = () => {
    setSelectedAction(null);
    setSelectedProduct(null);
    setActionQuantity(0);
    setActionReason('');
  };

  const startEditing = (productId: string, item: StockItem) => {
    setEditingItem(productId);
    setEditValues({ quantity: item.quantity, price: item.price });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditValues({ quantity: 0, price: 0 });
  };

  const saveChanges = async (productId: string) => {
    try {
      const response = await fetch(`/api/stock/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editValues),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setStock(prev => ({
          ...prev,
          [productId]: updatedItem
        }));
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (quantity < 10) return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  // Sort products: out of stock first, then low stock, then in stock
  const sortedStockEntries = Object.entries(stock).sort(([, a], [, b]) => {
    // Out of stock first
    if (a.quantity === 0 && b.quantity !== 0) return -1;
    if (a.quantity !== 0 && b.quantity === 0) return 1;
    // Low stock next
    if (a.quantity > 0 && a.quantity < 10 && (b.quantity >= 10 || b.quantity === 0)) return -1;
    if ((a.quantity >= 10 || a.quantity === 0) && b.quantity > 0 && b.quantity < 10) return 1;
    // Otherwise, keep order
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Stock Management</h2>
          <p className="text-sm md:text-base text-gray-600">Monitor and update your product inventory</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {/* Stock Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg md:rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{Object.keys(stock).length}</p>
              <p className="text-xs md:text-sm text-gray-600">Total Products</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 rounded-lg md:rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {Object.values(stock).filter(item => item.quantity === 0).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Out of Stock</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-100 rounded-lg md:rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">
                {Object.values(stock).filter(item => item.quantity > 0 && item.quantity < 10).length}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Low Stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">Product Inventory</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Product</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Price</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Quantity</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Unit</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedStockEntries.map(([productId, item]) => {
                const stockStatus = getStockStatus(item.quantity);
                const isEditing = editingItem === productId;
                
                return (
                  <tr key={productId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="font-medium text-sm md:text-base text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValues.price}
                          onChange={(e) => setEditValues(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          className="w-20 md:w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-sm md:text-base text-gray-900">${item.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.quantity}
                          onChange={(e) => setEditValues(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                          className="w-16 md:w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-sm md:text-base text-gray-900">{item.quantity}</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <span className="text-xs md:text-sm text-gray-600">{item.unit}</span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                        {stockStatus.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveChanges(productId)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(productId, item)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct({ id: productId, name: item.name });
                                setSelectedAction('return');
                                setShowModal(true);
                              }}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Return Stock"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedProduct({ id: productId, name: item.name });
                                setSelectedAction('expire');
                                setShowModal(true);
                              }}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Mark as Expired"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return/Expire Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {selectedAction === 'return' ? 'Return Stock' : 'Mark as Expired'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product
                </label>
                <input
                  type="text"
                  value={selectedProduct?.name || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={actionQuantity}
                  onChange={(e) => setActionQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Enter reason for return/expiration..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetModal();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReturnExpire}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock History */}
      {showHistory && (
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">Stock History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Date</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Product</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Type</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Quantity</th>
                  <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs md:text-sm font-medium text-gray-900">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stockHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-900">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-900">
                      {record.productName}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.type === 'return' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.type === 'return' ? 'Return' : 'Expired'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-900">
                      {record.quantity}
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-sm text-gray-900">
                      {record.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManager;