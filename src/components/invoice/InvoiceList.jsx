import { useState } from "react";
import { useInvoice } from "../../context/InvoiceContext";
import { useSearch } from "../../hooks/useSearch";
import { GlassCard } from "../ui/GlassCard";
import { GlassButton } from "../ui/GlassButton";
import { FileText, Plus, Trash2, Search, ChevronRight, History, X, Pencil, AlertTriangle, Loader2 } from "lucide-react";

export function InvoicePage({ onEdit }) {
  const { drafts, invoiceHistory, createNewInvoice, deleteInvoice, loadInvoice, formatCurrency } = useInvoice();
  const [showHistory, setShowHistory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteInvoice(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const { searchTerm: historySearch, setSearchTerm: setHistorySearch, filteredItems: filteredHistory, isSearching } = useSearch(
    invoiceHistory,
    ['id', 'client.name']
  );

  const handleNew = () => {
    createNewInvoice();
    onEdit();
  };

  const handleOpenDraft = (inv) => {
    loadInvoice(inv);
    onEdit();
  };

  const handleOpenHistory = (inv) => {
    loadInvoice(inv);
    setShowHistory(false);
    onEdit();
  };

  const getTotal = (inv) => {
    return (inv.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price)), 0);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Invoices</h2>
        <div className="flex items-center gap-3">
          {/* History Icon */}
          <button
            onClick={() => setShowHistory(true)}
            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors relative"
            title="Invoice History"
          >
            <History size={22} />
            {invoiceHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{invoiceHistory.length}</span>
            )}
          </button>

          {/* New Invoice Button */}
          <GlassButton onClick={handleNew} className="flex items-center gap-2">
            <Plus size={16} /> Create New Invoice
          </GlassButton>
        </div>
      </div>

      {/* Draft Cards */}
      {drafts.length === 0 ? (
        <GlassCard className="text-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-slate-100 rounded-full">
              <FileText size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No draft invoices</p>
            <p className="text-slate-400 text-sm">Create a new invoice or save one as draft to see it here.</p>
          </div>
        </GlassCard>
      ) : (
        <>
          <p className="text-sm text-slate-500 font-medium">Drafts ({drafts.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drafts.map(inv => (
              <GlassCard
                key={inv.id}
                className="group hover:bg-slate-50 transition-all border border-amber-200/60 hover:border-amber-300 cursor-pointer relative"
                onClick={() => handleOpenDraft(inv)}
              >
                <div className="absolute top-3 right-3">
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Draft</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 mt-0.5">
                    <Pencil size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800">{inv.id}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{inv.date}</p>
                    {inv.client?.name && (
                      <p className="text-sm text-slate-600 mt-1 font-medium truncate">{inv.client.name}</p>
                    )}
                    <p className="text-lg font-bold text-indigo-600 mt-2">
                      {formatCurrency(getTotal(inv))}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end mt-3 gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(inv.id); }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                  <span className="text-xs text-slate-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to edit <ChevronRight size={14} />
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col mx-4 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 pb-3">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History size={20} className="text-indigo-600" /> Invoice History
              </h3>
              <button onClick={() => setShowHistory(false)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {invoiceHistory.length > 0 && (
              <div className="px-6 pb-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-sm font-medium"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={32} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 font-medium text-sm">
                    {invoiceHistory.length === 0 ? "No saved invoices yet" : "No invoices match"}
                  </p>
                </div>
              ) : (
                filteredHistory.map(inv => (
                  <div 
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 cursor-pointer transition-colors border border-slate-200 hover:border-indigo-300 group"
                    onClick={() => handleOpenHistory(inv)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{inv.id}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{inv.date}</span>
                          {inv.client?.name && (
                            <>
                              <span className="text-slate-300 text-xs">•</span>
                              <span className="text-xs text-slate-500">{inv.client.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-indigo-600 text-sm">{formatCurrency(getTotal(inv))}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(inv.id); }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-7 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 max-w-sm mx-4 w-full">
            <div className="p-3 bg-rose-100 rounded-full">
              <AlertTriangle size={28} className="text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Delete Invoice?</h3>
            <p className="text-slate-500 text-center text-sm">
              Are you sure you want to delete <span className="font-semibold text-slate-700">{deleteConfirmId}</span>? This cannot be undone.
            </p>
            <div className="flex w-full gap-3 mt-1">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors text-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

