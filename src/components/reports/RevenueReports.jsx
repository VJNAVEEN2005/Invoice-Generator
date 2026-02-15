import { useState, useEffect } from "react";
import { useInvoice } from "../../context/InvoiceContext";
import { GlassCard } from "../ui/GlassCard";
import { DateRangePicker } from "../ui/DateRangePicker";
import { CalendarView } from "./CalendarView";
import { TrendingUp, Calendar, DollarSign, PieChart, Users, BarChart3 } from "lucide-react";

export function RevenueReports({ initialView = "overview", initialDateRange = null }) {
  const { invoiceHistory, formatCurrency } = useInvoice();
  const [viewMode, setViewMode] = useState(initialView); 
  
  // Update view mode if prop changes
  useEffect(() => {
     if (initialView) setViewMode(initialView);
  }, [initialView]);

  const [timePeriod, setTimePeriod] = useState("month"); // day, month, year
  const [dateRange, setDateRange] = useState(initialDateRange); // { start, end }

  // Update date range if prop changes
  useEffect(() => {
    if (initialDateRange) setDateRange(initialDateRange);
  }, [initialDateRange]);

  // Filter invoices by date range if set
  const filteredInvoices = dateRange
    ? invoiceHistory.filter(inv => {
        const invDate = new Date(inv.date);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        return invDate >= start && invDate <= end;
      })
    : invoiceHistory;

  // Calculate all data
  const monthlyData = {};
  const yearlyData = {};
  const dailyData = {};
  const clientData = {};
  const categoryData = {};
  let totalRevenue = 0;

  filteredInvoices.forEach(inv => {
    const total = (inv.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price)), 0);
    totalRevenue += total;

    const date = new Date(inv.date);
    
    // Daily data
    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    if (!dailyData[dayKey]) dailyData[dayKey] = { total: 0, count: 0 };
    dailyData[dayKey].total += total;
    dailyData[dayKey].count += 1;

    // Monthly data
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyData[monthKey]) monthlyData[monthKey] = { total: 0, count: 0 };
    monthlyData[monthKey].total += total;
    monthlyData[monthKey].count += 1;

    // Yearly data
    const year = date.getFullYear();
    if (!yearlyData[year]) yearlyData[year] = { total: 0, count: 0 };
    yearlyData[year].total += total;
    yearlyData[year].count += 1;

    // Client data
    const clientName = inv.client?.name || "Unknown";
    if (!clientData[clientName]) clientData[clientName] = { total: 0, count: 0 };
    clientData[clientName].total += total;
    clientData[clientName].count += 1;

    // Category data (from items)
    (inv.items || []).forEach(item => {
      const category = item.category || "Uncategorized";
      const itemTotal = Number(item.quantity) * Number(item.price);
      if (!categoryData[category]) categoryData[category] = { total: 0, count: 0 };
      categoryData[category].total += itemTotal;
      categoryData[category].count += 1;
    });
  });


  const months = Object.keys(monthlyData).sort().slice(-12);
  const maxRevenue = Math.max(...months.map(m => monthlyData[m].total), 1);
  const years = Object.keys(yearlyData).sort();
  const days = Object.keys(dailyData).sort().slice(-30); // Last 30 days
  
  // Select data based on time period
  let timeData, timeKeys, maxTimeRevenue, timeLabel;
  if (timePeriod === "day") {
    timeData = dailyData;
    timeKeys = days;
    maxTimeRevenue = Math.max(...days.map(d => dailyData[d].total), 1);
    timeLabel = "Daily Revenue (Last 30 Days)";
  } else if (timePeriod === "month") {
    timeData = monthlyData;
    timeKeys = months;
    maxTimeRevenue = maxRevenue;
    timeLabel = "Monthly Revenue (Last 12 Months)";
  } else {
    timeData = yearlyData;
    timeKeys = years;
    maxTimeRevenue = Math.max(...years.map(y => yearlyData[y].total), 1);
    timeLabel = "Yearly Revenue";
  }
  
  const topClients = Object.entries(clientData).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  const topCategories = Object.entries(categoryData).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Revenue Reports</h1>
          <p className="text-slate-500">Comprehensive analytics and insights.</p>
        </div>
        <DateRangePicker onDateChange={setDateRange} />
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "monthly", label: "Monthly Trends", icon: TrendingUp },
          { id: "clients", label: "Top Clients", icon: Users },
          { id: "categories", label: "Categories", icon: PieChart },
          { id: "calendar", label: "Calendar", icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                viewMode === tab.id
                  ? "bg-gradient-to-b from-accent-primary to-accent-hover text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <Icon size={16} />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {viewMode === "overview" && (
        <>
          {/* Key Metrics */}
          {/* Key Metrics */}
          <div className="mb-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-500 text-sm uppercase tracking-wider">Total Revenue</h3>
                  <p className="text-4xl font-bold text-slate-800 mt-1">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 pl-16">{invoiceHistory.length} total invoices generated</p>
            </GlassCard>
          </div>

          {/* Yearly Summary */}
          <GlassCard>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Yearly Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {years.map(year => (
                <div key={year} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-slate-500" />
                    <h3 className="font-bold text-slate-800">{year}</h3>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 mb-1">
                    {formatCurrency(yearlyData[year].total)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {yearlyData[year].count} invoice{yearlyData[year].count !== 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      )}

      {/* Monthly Trends Tab */}
      {viewMode === "monthly" && (
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">{timeLabel}</h2>
            </div>
            
            {/* Time Period Selector */}
            <div className="flex gap-2">
              {[
                { id: "day", label: "Day" },
                { id: "month", label: "Month" },
                { id: "year", label: "Year" }
              ].map(period => (
                <button
                  key={period.id}
                  onClick={() => setTimePeriod(period.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    timePeriod === period.id
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {timeKeys.length === 0 ? (
            <p className="text-center text-slate-400 py-12">No revenue data yet. Create invoices to see reports!</p>
          ) : (
            <div className="space-y-3">
              {timeKeys.map(key => {
                const data = timeData[key];
                const percentage = (data.total / maxTimeRevenue) * 100;
                
                // Format label based on time period
                let displayLabel;
                if (timePeriod === "day") {
                  displayLabel = new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                } else if (timePeriod === "month") {
                  const [year, monthNum] = key.split('-');
                  displayLabel = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                } else {
                  displayLabel = key;
                }

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700">{displayLabel}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{data.count} invoice{data.count !== 1 ? 's' : ''}</span>
                        <span className="font-bold text-indigo-600">{formatCurrency(data.total)}</span>
                      </div>
                    </div>
                    <div className="h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 20 && (
                          <span className="text-xs font-bold text-white">{formatCurrency(data.total)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* Top Clients Tab */}
      {viewMode === "clients" && (
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Users size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Top 5 Clients by Revenue</h2>
          </div>

          {topClients.length === 0 ? (
            <p className="text-center text-slate-400 py-12">No client data yet.</p>
          ) : (
            <div className="space-y-4">
              {topClients.map(([client, data], index) => {
                const percentage = (data.total / totalRevenue) * 100;
                return (
                  <div key={client} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{client}</h3>
                          <p className="text-xs text-slate-500">{data.count} invoice{data.count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">{formatCurrency(data.total)}</p>
                        <p className="text-xs text-slate-500">{percentage.toFixed(1)}% of total</p>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* Categories Tab */}
      {viewMode === "categories" && (
        <GlassCard>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
              <PieChart size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Revenue by Category</h2>
          </div>

          {topCategories.length === 0 ? (
            <p className="text-center text-slate-400 py-12">No category data yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topCategories.map(([category, data]) => {
                const percentage = (data.total / totalRevenue) * 100;
                return (
                  <div key={category} className="p-4 bg-slate-50 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-slate-800">{category}</h3>
                        <p className="text-xs text-slate-500">{data.count} item{data.count !== 1 ? 's' : ''}</p>
                      </div>
                      <p className="font-bold text-pink-600">{formatCurrency(data.total)}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 bg-white rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 text-right">{percentage.toFixed(1)}% of total revenue</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      )}

      {/* Calendar Tab */}
      {viewMode === "calendar" && (
        <GlassCard>
          <CalendarView invoices={filteredInvoices} formatCurrency={formatCurrency} />
        </GlassCard>
      )}
    </div>
  );
}
