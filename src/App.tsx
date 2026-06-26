import React, { useState } from 'react';
import { Package, FileText, BarChart3, Menu, X, User, Receipt, Truck, DollarSign, History } from 'lucide-react';
import Dashboard from './components/Dashboard';
import OrderProcessor from './components/OrderProcessor';
import StockManager from './components/StockManager';
import BillViewer from './components/BillViewer';
import CustomerList from './components/CustomerList';
import BillDisplay from './components/BillDisplay';
import DeliveryDriver from './components/DeliveryDriver';
import PaymentHistory from './components/PaymentHistory';

function LoginSignup({ onAuth }: { onAuth: (user: { username: string; role: 'admin' | 'user' }) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password || (!isLogin && !role)) {
      setError('Please fill all fields');
      return;
    }
    try {
      const res = await fetch(isLogin ? '/api/login' : '/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLogin ? { username, password } : { username, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error');
        return;
      }
      if (isLogin) onAuth(data);
      else setIsLogin(true);
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-center">{isLogin ? 'Login' : 'Sign Up'}</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {!isLogin && (
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'user')}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          )}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
          >
            {isLogin ? 'No account? Sign up' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [user, setUser] = useState<{ username: string; role: 'admin' | 'user' } | null>(null);

  // Tabs for admin
  const adminTabs = [
    { id: 'customer', label: 'Customer', icon: User },
    { id: 'billDisplay', label: 'Bill Display', icon: Receipt },
    { id: 'deliveryDriver', label: 'Delivery Driver', icon: Truck },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'stock', label: 'Manage Stock', icon: Package },
    { id: 'bills', label: 'View Bills', icon: FileText },
    { id: 'cash', label: 'Cash Management', icon: DollarSign },
    { id: 'paymentHistory', label: 'Payment History', icon: History },
  ];

  const renderContent = () => {
    if (role === 'user') {
      return <OrderProcessor />;
    }
    switch (activeTab) {
      case 'customer':
        return <CustomerList />;
      case 'billDisplay':
        return <BillDisplay />;
      case 'deliveryDriver':
        return <DeliveryDriver />;
      case 'dashboard':
        return <Dashboard />;
      case 'stock':
        return <StockManager />;
      case 'bills':
        return <BillViewer />;
      case 'cash':
        return <div className="p-8 text-xl font-bold">Cash Management (Coming Soon)</div>;
      case 'paymentHistory':
        return <PaymentHistory />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return <LoginSignup onAuth={u => { setUser(u); setRole(u.role); setActiveTab(u.role === 'admin' ? 'dashboard' : 'orders'); }} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Role Switcher */}
      <div className="w-full flex justify-between items-center p-2 bg-white shadow-sm sticky top-0 z-50">
        <div className="text-sm text-gray-600">Logged in as: <span className="font-bold">{user.username}</span> ({user.role})</div>
        <div className="flex gap-2 items-center">
          <button
            className="px-3 py-1 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-blue-100"
            onClick={() => { setUser(null); setRole('user'); setActiveTab('dashboard'); }}
          >
            Logout
          </button>
          {/* Role switcher: only admin can switch */}
          {user.role === 'admin' ? (
            <>
              <span className="text-sm text-gray-600">Role:</span>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
                onClick={() => { setRole('user'); setActiveTab('orders'); setIsSidebarOpen(false); }}
              >
                User
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${role === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
                onClick={() => { setRole('admin'); setActiveTab('dashboard'); setIsSidebarOpen(false); }}
              >
                Admin
              </button>
            </>
          ) : (
            <span className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm font-medium">User</span>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
          <img src="./src/images/logo.png   " alt="logo  " className="w-20 h-20" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent ">Zaid Traders</h1>
            <p className="text-sm text-gray-500">Voice-to-Order System</p>
          </div>
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}
      </div>

      <div className="flex">
        {/* Sidebar - Desktop (Admin only) */}
        {role === 'admin' && (
          <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white shadow-xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
            <div className="p-6 border-b border-gray-200 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center">
                <img src="./src/images/logo.png   " alt="logo  " className="w-20 h-20" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">Zaid Traders</h1>
                  <p className="text-sm text-gray-500">Voice-to-Order System</p>
                </div>
              </div>
            </div>
            <nav className="p-4 space-y-2">
              {adminTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Overlay for mobile sidebar (Admin only) */}
        {role === 'admin' && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8 w-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;