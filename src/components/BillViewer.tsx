import React, { useEffect, useState } from 'react';
import { Search, Eye, FileText, User, Calendar, DollarSign, Trash2 } from 'lucide-react';

interface Bill {
  id: string;
  customerName: string;
  transcription: string;
  extractedProducts: Array<{
    name: string;
    quantity: number;
  }>;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
    discount?: number;
  }>;
  unavailableItems: Array<{
    name: string;
    quantity: number;
    reason: string;
  }>;
  totalAmount: number;
  createdAt: string;
  driverName?: string;
  bikeNo?: string;
}

const BillViewer: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    setEditingBill(selectedBill ? JSON.parse(JSON.stringify(selectedBill)) : null);
  }, [selectedBill]);

  const fetchBills = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/bills');
      const data = await response.json();
      setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(bill =>
    bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleItemChange = (index: number, field: 'quantity' | 'discount', value: number) => {
    if (!editingBill) return;
    const items = [...editingBill.items];
    const item = { ...items[index] };
    const oldQuantity = item.quantity;
    if (field === 'quantity') {
      item.quantity = value;
      const diff = value - oldQuantity;
      if (diff !== 0) {
        fetch(`http://localhost:3001/api/stock/${item.name.toLowerCase()}/adjust`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ diff: -diff }),
        });
      }
    } else {
      item.discount = value;
    }
    item.total = (item.price * item.quantity) - (item.discount || 0);
    items[index] = item;
    const totalAmount = items.reduce((sum, it) => sum + it.total, 0);
    setEditingBill({ ...editingBill, items, totalAmount });
  };

  const handleRemoveItem = (index: number) => {
    if (!editingBill) return;
    const items = [...editingBill.items];
    const removed = items.splice(index, 1)[0];
    fetch(`http://localhost:3001/api/stock/${removed.name.toLowerCase()}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ diff: removed.quantity }),
    });
    const totalAmount = items.reduce((sum, it) => sum + it.total, 0);
    setEditingBill({ ...editingBill, items, totalAmount });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Bill Management</h2>
        <p className="text-sm md:text-base text-gray-600">View and search customer bills and order history</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5" />
          <input
            type="text"
            placeholder="Search by customer name or bill ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 md:pl-10 pr-4 py-2 md:py-3 text-sm md:text-base border border-gray-300 rounded-lg md:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Bills List */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">Bills ({filteredBills.length})</h3>
          </div>
          
          <div className="max-h-[calc(100vh-24rem)] md:max-h-96 overflow-y-auto">
            {filteredBills.length === 0 ? (
              <div className="text-center py-8 md:py-12 text-gray-500">
                <FileText className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
                <p className="text-sm md:text-base">No bills found</p>
              </div>
            ) : (
              <div className="space-y-2 p-3 md:p-4">
                {filteredBills.map((bill) => (
                  <div
                    key={bill.id}
                    onClick={() => setSelectedBill(bill)}
                    className={`p-3 md:p-4 rounded-lg md:rounded-xl cursor-pointer transition-all hover:bg-gray-50 ${
                      selectedBill?.id === bill.id ? 'bg-blue-50 border-2 border-blue-200' : 'border border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
                        <span className="font-medium text-sm md:text-base text-gray-900">{bill.customerName}</span>
                      </div>
                      <span className="text-xs md:text-sm text-gray-500">
                        {bill.id.slice(0, 8)}...
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs md:text-sm text-gray-600">
                      <div className="flex items-center gap-1 md:gap-2">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                        {formatDate(bill.createdAt)}
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                        ${bill.totalAmount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100">
          <div className="p-4 md:p-6 border-b border-gray-100">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="w-4 h-4 md:w-5 md:h-5" />
              Bill Details
            </h3>
          </div>
          
          <div className="p-4 md:p-6">
            {editingBill ? (
              <div className="space-y-4 md:space-y-6">
                {/* Bill Header */}
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Bill ID</p>
                      <p className="text-sm md:text-base font-medium">{selectedBill?.id}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Customer</p>
                      <p className="text-sm md:text-base font-medium">{selectedBill?.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Date</p>
                      <p className="text-sm md:text-base font-medium">{formatDate(selectedBill?.createdAt || '')}</p>
                    </div>
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Total</p>
                      <p className="text-sm md:text-base font-medium text-green-600">${selectedBill?.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Driver Detail */}
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                  <h4 className="text-sm md:text-base font-medium text-gray-900 mb-2">Delivery Driver Detail</h4>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs md:text-sm text-gray-600 mb-1">Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingBill.driverName || ''}
                          onChange={e => setEditingBill({ ...editingBill, driverName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Driver Name"
                        />
                      ) : (
                        <div className="text-sm text-gray-800">{editingBill.driverName || '-'}</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs md:text-sm text-gray-600 mb-1">Bike No.</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingBill.bikeNo || ''}
                          onChange={e => setEditingBill({ ...editingBill, bikeNo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Bike Number"
                        />
                      ) : (
                        <div className="text-sm text-gray-800">{editingBill.bikeNo || '-'}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Editable Bill Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm md:text-base font-medium text-gray-900">Order Summary</h4>
                    {isEditing ? (
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        onClick={() => setIsEditing(false)}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border rounded-lg">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-2 py-2 border">Sr No.</th>
                          <th className="px-2 py-2 border">Product</th>
                          <th className="px-2 py-2 border">Quantity</th>
                          <th className="px-2 py-2 border">Rate</th>
                          <th className="px-2 py-2 border">Amount</th>
                          <th className="px-2 py-2 border">Discount</th>
                          <th className="px-2 py-2 border">Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editingBill.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="border px-2 py-1 text-center">{idx + 1}</td>
                            <td className="border px-2 py-1">{item.name}</td>
                            <td className="border px-2 py-1">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                                  className="w-16 px-1 py-0.5 border rounded"
                                />
                              ) : (
                                item.quantity
                              )}
                            </td>
                            <td className="border px-2 py-1 text-right">{item.price}</td>
                            <td className="border px-2 py-1 text-right">{item.total.toFixed(2)}</td>
                            <td className="border px-2 py-1">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min={0}
                                  value={item.discount || 0}
                                  onChange={e => handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                                  className="w-16 px-1 py-0.5 border rounded"
                                />
                              ) : (
                                item.discount || 0
                              )}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {isEditing ? (
                                <button onClick={() => handleRemoveItem(idx)} className="text-red-600 hover:text-red-800">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td className="border px-2 py-1 font-semibold text-right" colSpan={4}>Total</td>
                          <td className="border px-2 py-1 text-right font-semibold">{editingBill.items.reduce((sum, it) => sum + it.total, 0).toFixed(2)}</td>
                          <td className="border px-2 py-1" colSpan={2}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Old Amt, Grand Total, QR code */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="text-lg font-semibold">Old Balance <span className="ml-2 font-normal">0</span></div>
                    <div className="text-lg font-semibold">Grand Total <span className="ml-2 text-green-600">{editingBill.items.reduce((sum, it) => sum + it.total, 0).toFixed(2)}</span></div>
                  </div>
                  <div className="flex flex-col items-center">
                    {/* Placeholder for QR code */}
                    <div className="w-24 h-24 bg-gray-200 flex items-center justify-center rounded mb-2">QR</div>
                    <div className="text-center text-sm text-gray-700">{editingBill.id}</div>
                  </div>
                </div>

                {/* Save & Print Button */}
                <div className="flex justify-end mt-6">
                  <button
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
                    onClick={async () => {
                      if (!editingBill) return;
                      // Save the bill to backend
                      await fetch(`http://localhost:3001/api/bills/${editingBill.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(editingBill),
                      });
                      // Optionally refresh bill list
                      fetchBills();
                      // Print logic: open a print-friendly window
                      const printWindow = window.open('', '_blank', 'width=800,height=600');
                      if (printWindow) {
                        printWindow.document.write('<html><head><title>Print Bill</title>');
                        printWindow.document.write('<style>body{font-family:sans-serif;padding:2rem;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ccc;padding:8px;text-align:left;} .header{font-size:1.5rem;font-weight:bold;margin-bottom:1rem;} .section{margin-bottom:1.5rem;} .label{font-weight:bold;} .logo-container{text-align:center;margin-bottom:1rem;} .logo-container img{max-width:150px;height:auto;} .company-name{font-size:1.2rem;font-weight:bold;color:#2563eb;margin-top:0.5rem;}</style>');
                        printWindow.document.write('</head><body>');
                        printWindow.document.write(`<div class='logo-container'><img className='w-20 h-20' src='./src/images/logo.png' alt='Zaid Traders Logo'/><div class='company-name'>Zaid Traders</div></div>`);
                        printWindow.document.write(`<div class='header'>Bill</div>`);
                        printWindow.document.write(`<div class='section'><span class='label'>Bill ID:</span> ${editingBill.id}<br/><span class='label'>Customer:</span> ${editingBill.customerName}<br/><span class='label'>Date:</span> ${formatDate(editingBill.createdAt)}<br/><span class='label'>Driver:</span> ${editingBill.driverName || '-'}<br/><span class='label'>Bike No.:</span> ${editingBill.bikeNo || '-'}</div>`);
                        printWindow.document.write(`<div class='section'><table><thead><tr><th>Product</th><th>Qty</th><th>Rate</th><th>Discount</th><th>Amount</th></tr></thead><tbody>`);
                        editingBill.items.forEach(item => {
                          printWindow.document.write(`<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.price}</td><td>${item.discount || 0}</td><td>${item.total.toFixed(2)}</td></tr>`);
                        });
                        printWindow.document.write(`</tbody></table></div>`);
                        printWindow.document.write(`<div class='section'><span class='label'>Grand Total:</span> $${editingBill.items.reduce((sum, it) => sum + it.total, 0).toFixed(2)}</div>`);
                        printWindow.document.write('</body></html>');
                        printWindow.document.close();
                        printWindow.focus();
                        printWindow.print();
                      }
                    }}
                  >
                    Save & Print
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 md:py-12 text-gray-500">
                <FileText className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-50" />
                <p className="text-sm md:text-base">Select a bill to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillViewer;