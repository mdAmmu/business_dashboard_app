import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PaymentModalProps {
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  const [billAmount, setBillAmount] = useState('15.00');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle payment submission
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bill Amount Total
            </label>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              ${billAmount}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Payment Method
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-full p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'cash' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <span className="font-medium text-gray-900">Cash</span>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="phone"
                  checked={paymentMethod === 'phone'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-full p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'phone' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <span className="font-medium text-gray-900">Phone Pay</span>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors"
          >
            Add Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;