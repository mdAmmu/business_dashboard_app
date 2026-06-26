import React, { useEffect, useState } from 'react';
import PaymentModal from './PaymentModal';

interface Bill {
  id: string;
  customerName: string;
  createdAt: string;
  totalAmount: number;
  remainingAmount?: number; // Added for new payment status
  paymentStatus?: 'paid' | 'not_paid'; // Added for new payment status
}

const getDayLabel = (dateStr: string) => {
  const today = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((today.setHours(0,0,0,0) - date.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString();
};

const BillDisplay: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [grouped, setGrouped] = useState<{ [day: string]: Bill[] }>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedCustomerOldBalance, setSelectedCustomerOldBalance] = useState<number | null>(null);
  const [customerIdMap, setCustomerIdMap] = useState<{ [name: string]: string }>({});

  useEffect(() => {
    const fetchAll = async () => {
      await fetchBills();
      // Fetch customers and build a name-to-id map
      try {
        const res = await fetch('http://localhost:3001/api/customers');
        if (res.ok) {
          const customers: Array<{id: string, name: string}> = await res.json();
          const map: { [name: string]: string } = {};
          customers.forEach((c) => { map[c.name] = c.id; });
          setCustomerIdMap(map);
        }
      } catch { /* ignore */ }
    };
    fetchAll();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/bills');
      if (!res.ok) {
        throw new Error('Failed to fetch bills');
      }
      const data = await res.json();
      setBills(data);
      // Group bills by day
      const group: { [day: string]: Bill[] } = {};
      data.forEach((bill: Bill) => {
        const label = getDayLabel(bill.createdAt);
        if (!group[label]) group[label] = [];
        group[label].push(bill);
      });
      setGrouped(group);
      setError('');
    } catch (error) {
      console.error('Error fetching bills:', error);
      setError('Failed to fetch bills. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSave = async (paymentDetails: { cashAmount: number; onlineAmount: number; oldBalance: number }) => {
    if (!selectedBillForPayment) return;
    const customerId = customerIdMap[selectedBillForPayment.customerName];
    if (!customerId) {
      setError('Customer ID not found.');
      return;
    }
    try {
      // Save payment history
      const response = await fetch(`http://localhost:3001/api/customers/${customerId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: new Date().toISOString(),
          bill_amount: selectedBillForPayment.totalAmount,
          cash_paid: paymentDetails.cashAmount,
          online_paid: paymentDetails.onlineAmount,
          old_balance: paymentDetails.oldBalance,
          bill_id: selectedBillForPayment.id // Pass bill id for backend update
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save payment');
      }

      // Update customer balance
      const newBalance = Math.max(0, (selectedBillForPayment.totalAmount + paymentDetails.oldBalance) - (paymentDetails.cashAmount + paymentDetails.onlineAmount));
      const balanceResponse = await fetch(`http://localhost:3001/api/customers/${encodeURIComponent(selectedBillForPayment.customerName)}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          balance: newBalance.toString()
        }),
      });

      if (!balanceResponse.ok) {
        throw new Error('Failed to update balance');
      }

      await fetchBills();
      setError('');
    } catch (error) {
      console.error('Error saving payment:', error);
      setError('Failed to save payment. Please try again.');
    }
  };

  const handleBillClick = async (bill: Bill) => {
    setSelectedBillForPayment(bill);
    setIsPaymentModalOpen(true);
    setError('');
    // Fetch old balance for the selected customer
    try {
      const response = await fetch(`http://localhost:3001/api/customers/${encodeURIComponent(bill.customerName)}/balance`);
      if (!response.ok) throw new Error('Failed to fetch old balance');
      const data = await response.json();
      setSelectedCustomerOldBalance(parseFloat(data.balance) || 0);
    } catch {
      setSelectedCustomerOldBalance(0);
    }
  };

  const dayList = Object.keys(grouped).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <div className="p-4">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Day Selection */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Select Day</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              {dayList.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedDay === day
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Bill List */}
          {selectedDay ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Bills for {selectedDay}</h3>
              <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow border">
                {grouped[selectedDay].map(bill => (
                  <li 
                    key={bill.id} 
                    className="p-4 cursor-pointer hover:bg-gray-50 relative"
                    onClick={() => handleBillClick(bill)}
                  >
                    <div className="font-medium">Bill ID: {bill.id}</div>
                    <div className="text-sm text-gray-600">Customer: {bill.customerName}</div>
                    <div className="text-sm text-gray-600">Date: {new Date(bill.createdAt).toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total: ${bill.totalAmount.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Old Balance: ${bill.remainingAmount !== undefined ? bill.remainingAmount.toFixed(2) : (bill.totalAmount).toFixed(2)}</div>
                    {bill.paymentStatus === 'paid' ? (
                      <div className="absolute right-4 bottom-4 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-lg shadow-sm border border-green-200">
                        Paid
                      </div>
                    ) : (
                      <div className="absolute right-4 bottom-4 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-lg shadow-sm border border-red-200">
                        Not paid
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-gray-500">Select a day to view bills.</div>
          )}
        </div>
      )}

      {selectedBillForPayment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedBillForPayment(null);
            setError('');
            setSelectedCustomerOldBalance(null);
          }}
          bill={selectedBillForPayment}
          oldBalance={selectedCustomerOldBalance}
          onSave={handlePaymentSave}
        />
      )}
    </div>
  );
};

export default BillDisplay; 