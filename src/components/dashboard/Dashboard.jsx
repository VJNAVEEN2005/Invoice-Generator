import { useInvoice } from "../../context/InvoiceContext";
import { GlassCard } from "../ui/GlassCard";
import { FileText, Users, Package, TrendingUp, Clock, DollarSign } from "lucide-react";

export function Dashboard() {
  const { drafts, invoiceHistory, savedClients, savedProducts, formatCurrency } = useInvoice();

  const totalRevenue = invoiceHistory.reduce((sum, inv) => {
    return sum + (inv.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price)), 0);
  }, 0);

  const thisMonthInvoices = invoiceHistory.filter(inv => {
    const invDate = new Date(inv.date);
    const now = new Date();
    return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
  });

  const thisMonthRevenue = thisMonthInvoices.reduce((sum, inv) => {
    return sum + (inv.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price)), 0);
  }, 0);

  const stats = [
    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "bg-emerald-100 text-emerald-600 " },
    { label: "This Month", value: formatCurrency(thisMonthRevenue), icon: TrendingUp, color: "bg-sky-100 text-sky-600 " },
    { label: "Invoices", value: invoiceHistory.length, icon: FileText, color: "bg-indigo-100 text-indigo-600 " },
    { label: "Drafts", value: drafts.length, icon: Clock, color: "bg-amber-100 text-amber-600 " },
    { label: "Clients", value: savedClients.length, icon: Users, color: "bg-violet-100 text-violet-600 " },
    { label: "Products", value: savedProducts.length, icon: Package, color: "bg-rose-100 text-rose-600 " },
  ];

  const recentInvoices = [...invoiceHistory].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-2">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Dashboard</h1>
        <p className="text-slate-500 ">Overview of your invoicing activity.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.label} className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 ">{stat.value}</p>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Recent Invoices */}
      <GlassCard>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Invoices</h2>
        {recentInvoices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No invoices yet. Create your first one!</p>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map(inv => {
              const total = (inv.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price)), 0);
              return (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 ">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 ">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{inv.id}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{inv.date}</span>
                        {inv.client?.name && (
                          <>
                            <span className="text-slate-300 text-xs">•</span>
                            <span className="text-xs text-slate-500 ">{inv.client.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-indigo-600 text-sm">{formatCurrency(total)}</span>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

