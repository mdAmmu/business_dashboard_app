import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: {
    id: string;
    customerName: string;
    totalAmount: number;
    createdAt: string;
  };
  oldBalance: number | null;
  onSave: (paymentDetails: {
    cashAmount: number;
    onlineAmount: number;
    oldBalance: number;
  }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, bill, oldBalance, onSave }) => {
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [onlineAmount, setOnlineAmount] = useState<number>(0);
  const [currentOldBalance, setCurrentOldBalance] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCashAmount(0);
      setOnlineAmount(0);
      setError('');
      setCurrentOldBalance(oldBalance || 0);
    }
  }, [isOpen, bill.customerName, oldBalance]);

  if (!isOpen) return null;

  const totalPayment = cashAmount + onlineAmount;
  const remainingAmount = (bill.totalAmount + currentOldBalance) - totalPayment;

  const handleSave = () => {
    onSave({
      cashAmount,
      onlineAmount,
      oldBalance: currentOldBalance
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Info */}
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-medium">{bill.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex justify-between items-center">
                  <span>Bill Amount</span>
                  <span className="ml-2">Old Balance</span>
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-600">${bill.totalAmount.toFixed(2)}</span>
                  <span className="font-medium text-blue-600 ml-4">${currentOldBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Old Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Old Balance
            </label>
            <div className="relative">
              <input
                type="number"
                value={currentOldBalance}
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
              />
              {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
              )}
            </div>
          </div>

          {/* Payment Inputs */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cash Payment
              </label>
              <input
                type="number"
                value={cashAmount}
                onChange={(e) => setCashAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter cash amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Online Payment
              </label>
              <input
                type="number"
                value={onlineAmount}
                onChange={(e) => setOnlineAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter online amount"
              />
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Payment:</span>
              <span className="font-medium">${totalPayment.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining Amount:</span>
              <span className={`font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${remainingAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Payment
        </button>
      </div>
    </div>
  );
};

export default PaymentModal; 