import React, { useState, useEffect } from 'react';
import { 
  Wine, TrendingUp, AlertTriangle, DollarSign, Package, 
  ShoppingCart, Eye, Clock, BarChart3, Activity 
} from 'lucide-react';
import { api } from '../services/apiClient';

export default function LiquorStoreDashboard() {
  const [salesData, setSalesData] = useState(null);
  const [products, setProducts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summary, productList, alertList] = await Promise.all([
        api.get('/api/pos/daily-summary'),
        api.get('/api/pos/products'),
        api.get('/api/alerts')
      ]);

      setSalesData(summary);
      setProducts(productList.filter(p => p.category === 'liquor'));
      setAlerts(alertList.filter(a => !a.read).slice(0, 5));
      setLoading(false);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const profit = (salesData?.today_revenue || 0) - (salesData?.today_profit || 0);
  const profitMargin = salesData?.today_revenue > 0 
    ? ((profit / salesData.today_revenue) * 100).toFixed(1) 
    : 0;

  // Calculate top sellers
  const topProducts = products
    .sort((a, b) => (b.stock || 0) - (a.stock || 0))
    .slice(0, 5);

  // Calculate low stock items
  const lowStock = products.filter(p => (p.stock || 0) < 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wine className="w-7 h-7 text-amber-500" />
            Liquor Store Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">Real-time sales, inventory & theft monitoring</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Last updated</p>
          <p className="text-sm text-slate-300">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/20 rounded">TODAY</span>
          </div>
          <p className="text-xs text-slate-400 uppercase mb-1">Revenue</p>
          <p className="text-3xl font-bold text-white">KES {(salesData?.today_revenue || 0).toLocaleString()}</p>
          <p className="text-xs text-emerald-400 mt-2">{salesData?.today_sales || 0} transactions</p>
        </div>

        {/* Today's Profit */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <span className="text-xs text-blue-400 font-semibold px-2 py-1 bg-blue-500/20 rounded">{profitMargin}%</span>
          </div>
          <p className="text-xs text-slate-400 uppercase mb-1">Profit</p>
          <p className="text-3xl font-bold text-white">KES {profit.toLocaleString()}</p>
          <p className="text-xs text-blue-400 mt-2">Margin: {profitMargin}%</p>
        </div>

        {/* Active Alerts */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <span className="text-xs text-red-400 font-semibold px-2 py-1 bg-red-500/20 rounded">LIVE</span>
          </div>
          <p className="text-xs text-slate-400 uppercase mb-1">Active Alerts</p>
          <p className="text-3xl font-bold text-white">{alerts.length}</p>
          <p className="text-xs text-red-400 mt-2">Theft & suspicious activity</p>
        </div>

        {/* Inventory Status */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Package className="w-8 h-8 text-amber-400" />
            <span className="text-xs text-amber-400 font-semibold px-2 py-1 bg-amber-500/20 rounded">STOCK</span>
          </div>
          <p className="text-xs text-slate-400 uppercase mb-1">Total Products</p>
          <p className="text-3xl font-bold text-white">{products.length}</p>
          <p className="text-xs text-amber-400 mt-2">{lowStock.length} low stock items</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Top Products
            </h3>
            <span className="text-xs text-slate-500">By stock</span>
          </div>
          <div className="space-y-3">
            {topProducts.map((product, idx) => {
              const profit = product.selling_price - product.buying_price;
              const margin = ((profit / product.buying_price) * 100).toFixed(1);
              return (
                <div key={product.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                      idx === 1 ? 'bg-slate-500/20 text-slate-400' :
                      idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-slate-700/20 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{product.brand_name.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-400">Stock: {product.stock} | Margin: {margin}%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">KES {product.selling_price}</p>
                    <p className="text-xs text-slate-500">+{profit} profit</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-red-400" />
              Recent Alerts
            </h3>
            <span className="text-xs text-slate-500">Last 24h</span>
          </div>
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No active alerts</p>
                <p className="text-slate-600 text-xs">All clear! 🎉</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${
                  alert.severity === 'alert' ? 'bg-red-500/10 border-red-500/30' :
                  alert.severity === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${
                        alert.severity === 'alert' ? 'text-red-400' :
                        alert.severity === 'warning' ? 'text-amber-400' :
                        'text-blue-400'
                      }`}>
                        {alert.type.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <AlertTriangle className={`w-5 h-5 ${
                      alert.severity === 'alert' ? 'text-red-400' :
                      alert.severity === 'warning' ? 'text-amber-400' :
                      'text-blue-400'
                    }`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Warning */}
      {lowStock.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Low Stock Alert</h3>
            <span className="text-xs text-amber-400 font-semibold px-2 py-1 bg-amber-500/20 rounded">
              {lowStock.length} items
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((product) => (
              <div key={product.id} className="bg-slate-900 rounded-lg p-3 border border-amber-500/20">
                <p className="font-semibold text-white text-sm">{product.brand_name.replace(/_/g, ' ')}</p>
                <p className="text-xs text-amber-400 mt-1">Only {product.stock} left in stock</p>
                <p className="text-xs text-slate-500 mt-1">Reorder recommended</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors">
            <ShoppingCart className="w-6 h-6 text-blue-400" />
            <span className="text-sm text-blue-400 font-semibold">View Sales</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors">
            <Package className="w-6 h-6 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-semibold">Manage Stock</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <span className="text-sm text-red-400 font-semibold">View Alerts</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors">
            <Activity className="w-6 h-6 text-amber-400" />
            <span className="text-sm text-amber-400 font-semibold">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}
