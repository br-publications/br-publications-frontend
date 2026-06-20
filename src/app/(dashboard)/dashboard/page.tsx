import { Package, User, CreditCard, Settings, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <div className="bg-white rounded-xl p-6 border shadow-sm mb-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <User size={32} />
            </div>
            <h2 className="font-bold text-lg">Test User</h2>
            <p className="text-sm text-gray-500">user@example.com</p>
          </div>
          
          <nav className="flex flex-col space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-medium transition-colors">
              <User size={18} /> Profile
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
              <Package size={18} /> Orders
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
              <CreditCard size={18} /> Payment Methods
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
              <Settings size={18} /> Settings
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors mt-4">
              <LogOut size={18} /> Sign Out
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
            <p className="text-gray-500">Here is an overview of your account activity.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-white border-0 ring-1 ring-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gray-900">12</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-0 ring-1 ring-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Saved Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-gray-900">4</div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-gray-50/50">
              <h3 className="font-bold text-lg">Recent Orders</h3>
            </div>
            <div className="p-6 text-center text-gray-500">
              No recent orders found. <a href="/products" className="text-blue-600 hover:underline">Start shopping</a>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
