import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  ChevronDown,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Package,
  ShoppingBag,
  Percent,
  Users,
} from 'lucide-react';
import { useDemoData } from '../../context/DemoDataContext';
import { formatDate, getSalePaymentStatus } from '../../lib/formatters';

export const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { sales, products, customers, setAboutModalOpen } = useDemoData();

  // Revenue Analysis time-frame tab
  const [revenueTab, setRevenueTab] = useState<'1h' | 'Day' | 'Month' | '2025'>('2025');

  // Search filter for Revenue Summary or Products
  const [productSearch, setProductSearch] = useState('');

  // Sorting state for Sales Overview table
  const [sortOrder, setSortOrder] = useState<'date' | 'amount'>('date');

  const formatUSDWithDecimals = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Static/dynamic curve coordinates based on active tab for the smooth SVG area chart
  const linePointsByTab = useMemo(() => {
    switch (revenueTab) {
      case '1h':
        return [
          { m: '00', x: 20, y: 120 },
          { m: '10', x: 60, y: 100 },
          { m: '20', x: 100, y: 110 },
          { m: '30', x: 140, y: 80 },
          { m: '40', x: 180, y: 85 },
          { m: '50', x: 220, y: 60 },
          { m: '60', x: 260, y: 65 },
          { m: '70', x: 300, y: 90 },
          { m: '80', x: 340, y: 55 },
          { m: '90', x: 380, y: 45 },
          { m: '100', x: 420, y: 70 },
          { m: '110', x: 460, y: 50 },
        ];
      case 'Day':
        return [
          { m: '04h', x: 20, y: 130 },
          { m: '06h', x: 60, y: 115 },
          { m: '08h', x: 100, y: 95 },
          { m: '10h', x: 140, y: 90 },
          { m: '12h', x: 180, y: 70 },
          { m: '14h', x: 220, y: 75 },
          { m: '16h', x: 260, y: 85 },
          { m: '18h', x: 300, y: 60 },
          { m: '20h', x: 340, y: 50 },
          { m: '22h', x: 380, y: 65 },
          { m: '23h', x: 420, y: 55 },
          { m: '24h', x: 460, y: 40 },
        ];
      case 'Month':
        return [
          { m: 'W1', x: 20, y: 110 },
          { m: 'W2', x: 60, y: 95 },
          { m: 'W3', x: 100, y: 100 },
          { m: 'W4', x: 140, y: 75 },
          { m: 'W5', x: 180, y: 80 },
          { m: 'W6', x: 220, y: 65 },
          { m: 'W7', x: 260, y: 70 },
          { m: 'W8', x: 300, y: 85 },
          { m: 'W9', x: 340, y: 48 },
          { m: 'W10', x: 380, y: 52 },
          { m: 'W11', x: 420, y: 60 },
          { m: 'W12', x: 460, y: 45 },
        ];
      case '2025':
      default:
        return [
          { m: 'Jan', x: 20, y: 115 },
          { m: 'Feb', x: 60, y: 105 },
          { m: 'Mar', x: 100, y: 90 },
          { m: 'Apr', x: 140, y: 95 },
          { m: 'May', x: 180, y: 70 },
          { m: 'Jun', x: 220, y: 75 },
          { m: 'Jul', x: 260, y: 85 },
          { m: 'Aug', x: 300, y: 90 },
          { m: 'Sep', x: 340, y: 48 }, // Peak September
          { m: 'Oct', x: 380, y: 62 },
          { m: 'Nov', x: 420, y: 55 },
          { m: 'Dec', x: 460, y: 45 },
        ];
    }
  }, [revenueTab]);

  // Generate cubic bezier SVG path smoothly
  const svgPathData = useMemo(() => {
    const pts = linePointsByTab;
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i !== pts.length - 2 ? pts[i + 2] : p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [linePointsByTab]);

  const svgAreaPathData = useMemo(() => {
    if (!svgPathData) return '';
    return `${svgPathData} L 460 150 L 20 150 Z`;
  }, [svgPathData]);

  // Combined real & showroom transactions for the Sales Overview table
  const tableRows = useMemo(() => {
    const showcaseItems = [
      {
        id: 'ord-1',
        productName: 'Reno Serie 13',
        productSub: 'OPPO Phone',
        dateStr: 'Dec 20, 2025, 10:28 AM',
        orderNum: '#102125',
        customerName: 'Stella Caldwell',
        delivery: 'Free Shipping',
        totalUSD: 550.0,
        statusColor: 'bg-[#10B981]',
      },
      {
        id: 'ord-2',
        productName: 'OPPO Pad 3',
        productSub: 'OPPO Tablet',
        dateStr: 'Dec 20, 2025, 10:24 AM',
        orderNum: '#102124',
        customerName: 'Thomas Smith',
        delivery: 'Free Shipping',
        totalUSD: 720.0,
        statusColor: 'bg-[#F59E0B]',
      },
      {
        id: 'ord-3',
        productName: 'Enco Air 4',
        productSub: 'OPPO Audio',
        dateStr: 'Dec 20, 2025, 10:22 AM',
        orderNum: '#102123',
        customerName: 'Eloise Cobain',
        delivery: 'Free Shipping',
        totalUSD: 120.0,
        statusColor: 'bg-[#EF4444]',
      },
      {
        id: 'ord-4',
        productName: 'Ultra Fast 5G',
        productSub: 'OPPO Router',
        dateStr: 'Dec 20, 2025, 10:20 AM',
        orderNum: '#102122',
        customerName: 'Ernest Waverly',
        delivery: 'Free Shipping',
        totalUSD: 340.0,
        statusColor: 'bg-[#10B981]',
      },
    ];

    const dynamicItems = sales
      .filter((s) => s.status === 'CONFIRMED')
      .slice(0, 4)
      .map((s) => ({
        id: s.id,
        productName: s.items[0]?.product_name_snapshot || 'Enterprise Hardware Bundle',
        productSub: s.items[0]?.sku_snapshot || 'SKU-ENT',
        dateStr: formatDate(s.sale_date),
        orderNum: `#${s.id.toUpperCase().slice(-6)}`,
        customerName: s.customer_name_snapshot || 'Global Supplies Ltd',
        delivery: 'Free Shipping',
        totalUSD: Math.round(s.total_minor / 100),
        statusColor: getSalePaymentStatus(s) === 'PAID' ? 'bg-[#10B981]' : 'bg-[#F59E0B]',
      }));

    const combined = [...dynamicItems, ...showcaseItems].slice(0, 4);

    if (sortOrder === 'amount') {
      return [...combined].sort((a, b) => b.totalUSD - a.totalUSD);
    }
    return combined;
  }, [sales, sortOrder]);

  return (
    <div className="space-y-6">
      {/* 1. Page Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#181A2A] tracking-tight">Overview</h1>
          <button
            onClick={() => setAboutModalOpen(true)}
            className="text-xs text-[#8A90A2] hover:text-[#5B50E6] transition-colors inline-flex items-center gap-1 mt-1 cursor-pointer"
          >
            <span>More information. Read Docs</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div>
          <button
            onClick={() => navigate('/products/new')}
            className="bg-[#5B50E6] hover:bg-[#4E44D4] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ Add New Product</span>
          </button>
        </div>
      </div>

      {/* 2. Top Row: 3 Dashboard Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Card 1: Revenue Analysis (Area Chart) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#ECEEF5] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Header & Tabs */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#181A2A]">Revenue Analysis</h3>
                <p className="text-xs text-[#8A90A2] mt-0.5 font-medium">
                  Average Monthly Revenue <span className="font-semibold text-[#5B50E6]">$120,780</span>
                </p>
              </div>

              {/* Segmented Timeframe Controls */}
              <div className="inline-flex p-0.5 bg-[#F7F8FC] rounded-lg border border-[#ECEEF5] text-xs">
                {(['1h', 'Day', 'Month', '2025'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRevenueTab(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      revenueTab === tab
                        ? 'bg-[#5B50E6] text-white shadow-xs'
                        : 'text-[#8A90A2] hover:text-[#181A2A]'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Wave Line Area Chart */}
            <div className="relative mt-4 h-44 w-full">
              <svg viewBox="0 0 480 160" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="symphonyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B50E6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#5B50E6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal dotted grid lines */}
                <line x1="20" y1="40" x2="460" y2="40" stroke="#ECEEF5" strokeDasharray="3 3" />
                <line x1="20" y1="80" x2="460" y2="80" stroke="#ECEEF5" strokeDasharray="3 3" />
                <line x1="20" y1="120" x2="460" y2="120" stroke="#ECEEF5" strokeDasharray="3 3" />

                {/* Vertical dotted guide line on peak */}
                <line x1="340" y1="48" x2="340" y2="150" stroke="#5B50E6" strokeDasharray="3 3" strokeOpacity="0.6" />

                {/* Gradient area under the line */}
                <path d={svgAreaPathData} fill="url(#symphonyAreaGrad)" />

                {/* Smooth vibrant curve line */}
                <path d={svgPathData} fill="none" stroke="#5B50E6" strokeWidth="2.5" strokeLinecap="round" />

                {/* Active Tooltip Badge at Peak Point (X=340, Y=48) */}
                <circle cx="340" cy="48" r="4.5" fill="#5B50E6" stroke="#FFFFFF" strokeWidth="2.5" />
                
                {/* Floating Tooltip Card */}
                <g transform="translate(305, 0)">
                  <rect
                    x="0"
                    y="0"
                    width="74"
                    height="40"
                    rx="8"
                    fill="#FFFFFF"
                    stroke="#ECEEF5"
                    filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))"
                  />
                  <text x="37" y="11" textAnchor="middle" fontSize="8" fill="#8A90A2" fontWeight="500">
                    10 Sep 2025
                  </text>
                  <text x="37" y="24" textAnchor="middle" fontSize="10.5" fill="#181A2A" fontWeight="bold">
                    $100,210
                  </text>
                  <text x="37" y="34" textAnchor="middle" fontSize="8" fill="#10B981" fontWeight="bold">
                    + 4.6 %
                  </text>
                </g>
              </svg>

              {/* Month Labels */}
              <div className="flex justify-between text-[10px] text-[#8A90A2] font-medium px-2 mt-1">
                {linePointsByTab.map((p) => (
                  <span key={p.m}>{p.m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Metrics */}
          <div className="flex items-center justify-between pt-4 border-t border-[#ECEEF5] mt-2">
            <div className="flex items-center gap-1.5 text-lg font-bold text-[#10B981]">
              <span>+17.37%</span>
              <span className="text-xs">▲</span>
            </div>
            <div className="text-[11px] text-[#8A90A2] flex items-center gap-1.5 font-medium">
              <span>Data Updated</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>20 Dec 2025, 10:10 AM</span>
            </div>
          </div>
        </div>

        {/* Card 2: Weekly Revenue Bar Chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#ECEEF5] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Header: Value + Trend + Timeframe */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#181A2A] tracking-tight">$160,350</span>
                  <span className="text-xs font-semibold text-[#10B981]">▲ +35%</span>
                </div>
                <p className="text-[11px] text-[#8A90A2] mt-0.5">from last week</p>
              </div>

              <div className="relative">
                <button className="flex items-center gap-1 text-xs font-medium text-[#5E6478] bg-[#F7F8FC] border border-[#ECEEF5] px-2.5 py-1 rounded-lg">
                  <span>Weekly</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8A90A2]" />
                </button>
              </div>
            </div>

            {/* Vertical Bar Chart with Target Benchmark */}
            <div className="relative mt-6 h-48 flex items-end">
              {/* Y-Axis Column */}
              <div className="h-full flex flex-col justify-between text-[10px] text-[#8A90A2] font-mono pr-3 pb-6">
                <span>200</span>
                <span>150</span>
                <span>100</span>
                <span>50</span>
                <span>20</span>
                <span>0</span>
              </div>

              {/* Benchmark Target Dashed Line at Level 160 */}
              <div className="absolute left-8 right-0 top-[28%] border-b border-dashed border-[#5B50E6]/50 z-0">
                <span className="absolute -top-6 right-2 text-[10px] font-bold text-[#5B50E6] bg-[#EEF2FF] px-1.5 py-0.5 rounded">
                  $160,350
                </span>
              </div>

              {/* 7 Day Bars Grid */}
              <div className="flex-1 h-full flex items-end justify-between gap-1.5 pb-6 z-10">
                {[
                  { day: 'Mon', height: '48%', active: false },
                  { day: 'Tue', height: '36%', active: false },
                  { day: 'Wed', height: '44%', active: false },
                  { day: 'Thu', height: '82%', active: true },
                  { day: 'Fri', height: '28%', active: false },
                  { day: 'Sat', height: '22%', active: false },
                  { day: 'Sun', height: '42%', active: false },
                ].map((bar) => (
                  <div key={bar.day} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div
                      style={{ height: bar.height }}
                      className={`w-4 sm:w-5 rounded-t-lg transition-all ${
                        bar.active
                          ? 'bg-[#5B50E6] shadow-sm'
                          : 'bg-[#C7D2FE] group-hover:bg-[#A5B4FC]'
                      }`}
                    />
                    <span className="text-[10px] font-medium text-[#8A90A2] mt-2">
                      {bar.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Revenue Summary (Search + 6 Progress Tiles) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#ECEEF5] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#181A2A]">Revenue Summary</h3>

            {/* Product Search Input Bar */}
            <div className="relative mt-3 flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#8A90A2] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Product name"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#F7F8FC] border border-[#ECEEF5] rounded-lg text-[#181A2A] placeholder-[#8A90A2] focus:outline-none focus:border-[#5B50E6]"
                />
              </div>
              <button
                onClick={() => navigate('/products')}
                className="bg-[#5B50E6] hover:bg-[#4E44D4] text-white px-3.5 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>

            {/* 6 Metric Progress Mini-Cards (2 columns x 3 rows) */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 mt-4">
              {/* 1. Earnings */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A2A]">
                  <div className="w-5 h-5 rounded-md bg-[#EEF2FF] text-[#5B50E6] flex items-center justify-center">
                    <DollarSign className="w-3 h-3" />
                  </div>
                  <span>Earnings</span>
                </div>
                <div className="text-base font-bold text-[#181A2A] tabular-nums">$190,230</div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div className="w-[82%] h-full bg-[#10B981] rounded-full" />
                </div>
              </div>

              {/* 2. Profit */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A2A]">
                  <div className="w-5 h-5 rounded-md bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                  <span>Profit</span>
                </div>
                <div className="text-base font-bold text-[#181A2A] tabular-nums">$120,230</div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div className="w-[64%] h-full bg-[#C7D2FE] rounded-full" />
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
                  {products.length > 0 ? (12720 + products.length).toLocaleString() : '12,720'}
                </div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div className="w-[70%] h-full bg-[#3B82F6] rounded-full" />
                </div>
              </div>

              {/* 4. Sales */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A2A]">
                  <div className="w-5 h-5 rounded-md bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center">
                    <ShoppingBag className="w-3 h-3" />
                  </div>
                  <span>Sales</span>
                </div>
                <div className="text-base font-bold text-[#181A2A] tabular-nums">
                  {sales.length > 0 ? (23570 + sales.length).toLocaleString() : '23,570'}
                </div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-[#10B981] rounded-full" />
                </div>
              </div>

              {/* 5. Growth */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#181A2A]">
                  <div className="w-5 h-5 rounded-md bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                    <Percent className="w-3 h-3" />
                  </div>
                  <span>Growth</span>
                </div>
                <div className="text-base font-bold text-[#181A2A] tabular-nums">97%</div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div className="w-[97%] h-full bg-[#10B981] rounded-full" />
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
                  {customers.length > 0 ? (3220 + customers.length).toLocaleString() : '3,220'}
                </div>
                <div className="w-full h-1 bg-[#ECEEF5] rounded-full overflow-hidden">
                  <div className="w-[52%] h-full bg-[#4F46E5] rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Sales Overview Table + Support Tracker Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Sales Overview Table (Spans 8 columns) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#ECEEF5] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Top Table Control Bar */}
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-sm font-bold text-[#181A2A]">Sales Overview</h3>

              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'date' | 'amount')}
                  className="text-xs font-medium text-[#5E6478] bg-[#F7F8FC] border border-[#ECEEF5] px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer"
                >
                  <option value="date">Sorting by Date</option>
                  <option value="amount">Sorting by Amount</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ECEEF5] text-[10px] font-semibold text-[#8A90A2] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Order</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Delivery</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEEF5]">
                  {tableRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F7F8FC] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#181A2A]">{row.productName}</div>
                        <div className="text-[10px] text-[#8A90A2]">{row.productSub}</div>
                      </td>

                      <td className="py-3 px-3 text-[11px] text-[#8A90A2] whitespace-nowrap">
                        {row.dateStr}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-[#8A90A2]">
                        {row.orderNum}
                      </td>

                      <td className="py-3 px-3 font-medium text-[#5E6478]">
                        {row.customerName}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-[#8A90A2]">
                        {row.delivery}
                      </td>

                      <td className="py-3 px-3 font-bold text-[#5B50E6] tabular-nums whitespace-nowrap">
                        {formatUSDWithDecimals(row.totalUSD)}
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${row.statusColor} ring-2 ring-white`} />
                          <button
                            onClick={() => navigate('/sales')}
                            className="p-1 text-[#8A90A2] hover:text-[#181A2A] rounded-lg cursor-pointer"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer: Pagination & Link to All Sales */}
          <div className="flex items-center justify-between pt-4 border-t border-[#ECEEF5] mt-3">
            <div className="flex items-center gap-1.5">
              <button
                className="w-7 h-7 rounded-lg border border-[#ECEEF5] flex items-center justify-center text-[#8A90A2] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                className="w-7 h-7 rounded-lg border border-[#ECEEF5] flex items-center justify-center text-[#8A90A2] hover:text-[#181A2A] hover:bg-[#F7F8FC] transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <Link
              to="/sales"
              className="text-xs font-semibold text-[#5E6478] hover:text-[#5B50E6] inline-flex items-center gap-1 transition-colors"
            >
              <span>View all sales</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Support Tracker Heatmap (Spans 4 columns) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#ECEEF5] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Header + Actions */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#181A2A]">Support Tracker</h3>
              <button className="p-1 text-[#8A90A2] hover:text-[#181A2A] rounded-lg border border-[#ECEEF5] cursor-pointer">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Gradient Intensity Legend */}
            <div className="flex items-center gap-1 text-[10px] text-[#8A90A2] font-mono mt-3">
              <span>0</span>
              <span className="w-2.5 h-2.5 rounded-xs bg-[#EEF2FF]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#C7D2FE]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#818CF8]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#6366F1]" />
              <span className="w-2.5 h-2.5 rounded-xs bg-[#4F46E5]" />
              <span>500</span>
            </div>

            {/* 5x7 Activity Matrix (5 hours x 7 days) */}
            <div className="mt-4 space-y-2">
              {[
                {
                  hour: '5PM',
                  tiles: ['#EEF2FF', '#C7D2FE', '#818CF8', '#C7D2FE', '#818CF8', '#C7D2FE', '#EEF2FF'],
                },
                {
                  hour: '4PM',
                  tiles: ['#EEF2FF', '#C7D2FE', '#818CF8', 'HIGHLIGHT', '#818CF8', '#C7D2FE', '#EEF2FF'],
                },
                {
                  hour: '3PM',
                  tiles: ['#EEF2FF', '#EEF2FF', '#C7D2FE', '#4F46E5', '#C7D2FE', '#EEF2FF', '#EEF2FF'],
                },
                {
                  hour: '2PM',
                  tiles: ['#EEF2FF', '#EEF2FF', '#C7D2FE', '#6366F1', '#C7D2FE', '#EEF2FF', '#EEF2FF'],
                },
                {
                  hour: '1PM',
                  tiles: ['#EEF2FF', '#EEF2FF', '#C7D2FE', '#818CF8', '#C7D2FE', '#EEF2FF', '#EEF2FF'],
                },
              ].map((row) => (
                <div key={row.hour} className="flex items-center gap-2">
                  <span className="w-7 text-[10px] text-[#8A90A2] font-mono text-right">{row.hour}</span>
                  <div className="flex-1 grid grid-cols-7 gap-1.5">
                    {row.tiles.map((color, idx) => {
                      if (color === 'HIGHLIGHT') {
                        return (
                          <div
                            key={idx}
                            className="aspect-square rounded-md bg-[#5B50E6] flex items-center justify-center text-[10px] font-bold text-white shadow-xs cursor-pointer hover:scale-105 transition-transform"
                            title="497 support tickets resolved"
                          >
                            497
                          </div>
                        );
                      }
                      return (
                        <div
                          key={idx}
                          style={{ backgroundColor: color }}
                          className="aspect-square rounded-md hover:ring-1 hover:ring-[#5B50E6] transition-all cursor-pointer"
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Day Labels along bottom of matrix */}
              <div className="flex items-center gap-2 pt-1">
                <span className="w-7" />
                <div className="flex-1 grid grid-cols-7 gap-1.5 text-center text-[10px] text-[#8A90A2] font-medium">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Page Footer */}
      <footer className="text-center text-xs text-[#8A90A2] pt-4 pb-2">
        <p>
          Copyright © 2025 Symphony, LLC. All rights reserved.{' '}
          <button
            onClick={() => setAboutModalOpen(true)}
            className="hover:text-[#5B50E6] underline cursor-pointer"
          >
            Privacy Policy
          </button>{' '}
          |{' '}
          <button
            onClick={() => setAboutModalOpen(true)}
            className="hover:text-[#5B50E6] underline cursor-pointer"
          >
            Terms
          </button>
        </p>
      </footer>
    </div>
  );
};
