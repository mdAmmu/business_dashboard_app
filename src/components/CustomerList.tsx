import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

interface Bill {
  id: string;
  customerName: string;
  phone?: string;
  createdAt: string;
  totalAmount: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    unit?: string;
    discount?: number;
  }>;
}

interface Customer {
  name: string;
  phone?: string;
  bills: Bill[];
  oldBalance: string;
}

const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerBalances, setCustomerBalances] = useState<{ [key: string]: string }>({});

  const fetchCustomerBalances = async () => {
    try {
      const response = await fetch('/api/customers/balances');
      const balances = await response.json();
      setCustomerBalances(balances);
    } catch (error) {
      console.error('Error fetching customer balances:', error);
    }
  };

  const ensureCustomerBalance = async (customerName: string) => {
    if (!customerBalances[customerName]) {
      try {
        const response = await fetch(`http://localhost:3001/api/customers/${encodeURIComponent(customerName)}/balance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        setCustomerBalances(prev => ({
          ...prev,
          [customerName]: data.balance
        }));
      } catch (error) {
        console.error('Error setting customer balance:', error);
      }
    }
  };

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/bills');
      const data = await response.json();
      
      const customerMap: { [key: string]: Customer } = {};
      
      data.forEach((bill: Bill) => {
        if (!customerMap[bill.customerName]) {
          customerMap[bill.customerName] = {
            name: bill.customerName,
            phone: bill.phone,
            bills: [],
            oldBalance: customerBalances[bill.customerName] || '0'
          };
          ensureCustomerBalance(bill.customerName);
        }
        customerMap[bill.customerName].bills.push(bill);
      });
      
      setCustomers(Object.values(customerMap));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bills:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchCustomerBalances();
      await fetchBills();
    };
    initialize();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      (customer.phone && customer.phone.includes(search))
  );

  const handleBillClick = async (bill: Bill) => {
    if (!bill.items) {
      const res = await fetch(`http://localhost:3001/api/bills/${bill.id}`);
      const data = await res.json();
      setSelectedBill(data);
    } else {
      setSelectedBill(bill);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-4">Customers</h2>
      <div className="mb-4 flex items-center max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
        />
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Customer List</h3>
            <ul className="space-y-4">
              {filteredCustomers.length === 0 && (
                <li className="text-gray-400 text-center py-8 bg-white rounded-xl shadow border">No customers found.</li>
              )}
              {filteredCustomers.map((customer) => {
                const billsSorted = customer.bills.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                const firstBill = billsSorted[0];
                const lastBill = billsSorted[billsSorted.length - 1];
                return (
                  <li
                    key={customer.name}
                    className={`relative bg-white rounded-xl shadow border p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-blue-400 ${selectedCustomer?.name === customer.name ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setSelectedBill(null);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-lg text-blue-900">{customer.name}</div>
                      {selectedCustomer?.name === customer.name && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Selected</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">Phone: {customer.phone || 'N/A'}</div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>First Bill: {firstBill ? new Date(firstBill.createdAt).toLocaleDateString() : '-'}</span>
                      <span>Last Bill: {lastBill ? new Date(lastBill.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="absolute right-4 bottom-4 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-lg shadow-sm border border-red-200">
                      Old Balance: ${customer.oldBalance}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            {selectedCustomer ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Bills for {selectedCustomer.name}</h3>
                <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow border">
                  {selectedCustomer.bills.map((bill) => (
                    <li key={bill.id} className={`p-4 cursor-pointer hover:bg-blue-50 ${selectedBill?.id === bill.id ? 'bg-blue-100' : ''}`} onClick={() => handleBillClick(bill)}>
                      <div className="font-medium">Bill ID: {bill.id}</div>
                      <div className="text-sm text-gray-600">Date: {new Date(bill.createdAt).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total: ${bill.totalAmount.toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
                {selectedBill && (
                  <div className="mt-6 bg-white rounded-xl shadow border p-6">
                    <h4 className="text-lg font-bold mb-2">Bill Details</h4>
                    <div className="mb-2 text-sm text-gray-700">Bill ID: {selectedBill.id}</div>
                    <div className="mb-2 text-sm text-gray-700">Date: {new Date(selectedBill.createdAt).toLocaleString()}</div>
                    <div className="mb-2 text-sm text-gray-700">Total: ${selectedBill.totalAmount.toFixed(2)}</div>
                    {selectedBill.items && selectedBill.items.length > 0 && (
                      <div className="overflow-x-auto mt-4">
                        <table className="min-w-full text-sm border rounded-lg">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-2 py-2 border">Product</th>
                              <th className="px-2 py-2 border">Quantity</th>
                              <th className="px-2 py-2 border">Rate</th>
                              <th className="px-2 py-2 border">Discount</th>
                              <th className="px-2 py-2 border">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedBill.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="border px-2 py-1">{item.name}</td>
                                <td className="border px-2 py-1 text-center">{item.quantity}</td>
                                <td className="border px-2 py-1 text-right">{item.price}</td>
                                <td className="border px-2 py-1 text-right">{item.discount || 0}</td>
                                <td className="border px-2 py-1 text-right">{item.total.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">Select a customer to view their bills.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList; 