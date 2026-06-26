import React, { useEffect, useState } from 'react';

interface Bill {
  id: string;
  customerName: string;
  createdAt: string;
  totalAmount: number;
  driverName?: string;
  bikeNo?: string;
}

const getDayLabel = (dateStr: string) => {
  const today = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((today.setHours(0,0,0,0) - date.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString();
};

const DeliveryDriver: React.FC = () => {
  // const [bills, setBills] = useState<Bill[]>([]);
  const [grouped, setGrouped] = useState<{ [day: string]: Bill[] }>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:3001/api/bills');
    const data = await res.json();
    // setBills(data);
    // Group bills by day
    const group: { [day: string]: Bill[] } = {};
    data.forEach((bill: Bill) => {
      const label = getDayLabel(bill.createdAt);
      if (!group[label]) group[label] = [];
      group[label].push(bill);
    });
    setGrouped(group);
    setLoading(false);
  };

  const dayList = Object.keys(grouped).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  // Static drivers with name, code, and unique bikeNo
  const staticDrivers = [
    { name: 'Driver 1', code: '1234', bikeNo: 'DRIV1001' },
    { name: 'Driver 2', code: '2345', bikeNo: 'DRIV2002' },
    { name: 'Driver 3', code: '3456', bikeNo: 'DRIV3003' },
    { name: 'Driver 4', code: '4567', bikeNo: 'DRIV4004' },
    { name: 'Driver 5', code: '5678', bikeNo: 'DRIV5005' },
  ];

  // Get bills for selected driver on selected day
  const billsForDriver = selectedDay && selectedDriver
    ? grouped[selectedDay].filter(bill => {
        const driver = staticDrivers.find(d => d.name === selectedDriver);
        if (!driver) return false;
        // Match by driverName or, if missing, by code (bill.bikeNo === driver.code)
        return (bill.driverName && bill.driverName === driver.name) ||
               (!bill.driverName && bill.bikeNo && bill.bikeNo === driver.code);
      })
    : [];

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-4">Delivery Driver</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/4">
            <h3 className="text-lg font-semibold mb-2">Days</h3>
            <ul className="space-y-2">
              {dayList.map(day => (
                <li
                  key={day}
                  className={`bg-white rounded-xl shadow border p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-blue-400 ${selectedDay === day ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                  onClick={() => { setSelectedDay(day); setSelectedDriver(null); }}
                >
                  <span className="font-medium text-blue-900">{day}</span>
                  <span className="ml-2 text-xs text-gray-500">({grouped[day].length} bills)</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:w-1/4">
            {selectedDay && (
              <>
                <h3 className="text-lg font-semibold mb-2">Drivers</h3>
                <ul className="space-y-2">
                  {staticDrivers.map(driver => (
                    <li
                      key={driver.name}
                      className={`bg-white rounded-xl shadow border p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg hover:border-green-400 ${selectedDriver === driver.name ? 'ring-2 ring-green-500 border-green-500' : ''}`}
                      onClick={() => setSelectedDriver(driver.name)}
                    >
                      <span className="font-medium text-green-900">{driver.name}</span>
                      <div className="text-xs text-gray-500 mt-1">Code: {driver.code}</div>
                      <span className="ml-2 text-xs text-gray-500">({selectedDay ? grouped[selectedDay].filter(bill => (bill.driverName && bill.driverName === driver.name) || (!bill.driverName && bill.bikeNo && bill.bikeNo === driver.code)).length : 0} bills)</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="md:w-2/4">
            {selectedDay && selectedDriver ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Bills for {selectedDriver} on {selectedDay}</h3>
                <ul className="divide-y divide-gray-200 bg-white rounded-xl shadow border">
                  {billsForDriver.map(bill => (
                    <li key={bill.id} className="p-4">
                      <div className="font-medium">Bill ID: {bill.id}</div>
                      <div className="text-sm text-gray-600">Customer: {bill.customerName}</div>
                      <div className="text-sm text-gray-600">Date: {new Date(bill.createdAt).toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total: ${bill.totalAmount.toFixed(2)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-gray-500">Select a day and driver to view bills.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDriver; 