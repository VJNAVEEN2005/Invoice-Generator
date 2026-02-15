import { useState } from "react";
import { useInvoice } from "../../context/InvoiceContext";
import { useToast } from "../../context/ToastContext";
import { useSearch } from "../../hooks/useSearch";
import { GlassCard } from "../ui/GlassCard";
import { GlassButton } from "../ui/GlassButton";
import { GlassInput } from "../ui/GlassInput";
import { User, Plus, Pencil, Trash2, Check, X, Search, AlertTriangle, FileText, Loader2 } from "lucide-react";

export function ClientList() {
  const { savedClients, setSavedClients, invoiceHistory } = useInvoice();
  const { addToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", address: "" });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editClient, setEditClient] = useState({ name: "", email: "", phone: "", address: "" });
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);
  const [viewingClientHistory, setViewingClientHistory] = useState(null);

  const { searchTerm, setSearchTerm, filteredItems: filteredClients, isSearching } = useSearch(
    savedClients,
    ['name', 'email', 'phone', 'address']
  );

  const handleAddClient = () => {
    if (newClient.name) {
      setSavedClients(prev => [...prev, newClient]);
      setNewClient({ name: "", email: "", phone: "", address: "" });
      setIsAdding(false);
      addToast("Client added!", "success");
    }
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditClient({ ...savedClients[index] });
  };

  const saveEdit = () => {
    setSavedClients(prev => prev.map((c, i) => i === editingIndex ? editClient : c));
    setEditingIndex(null);
    addToast("Client updated!", "success");
  };

  const confirmDelete = () => {
    setSavedClients(prev => prev.filter((_, i) => i !== deleteConfirmIndex));
    setDeleteConfirmIndex(null);
    addToast("Client deleted!", "success");
  };

  const getClientInvoices = (clientName) => {
    return invoiceHistory.filter(inv => inv.client?.name === clientName);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Clients</h1>
          <p className="text-slate-500 ">Manage your client database.</p>
        </div>
        <GlassButton onClick={() => setIsAdding(true)} className="flex items-center gap-2">
          <Plus size={16} /> Add Client
        </GlassButton>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-primary animate-spin" />}
        <input
          type="text"
          placeholder="Search clients by name, email, phone, or address..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-sm font-medium"
        />
      </div>

      {/* Add Client Form */}
      {isAdding && (
        <GlassCard className="p-6 border-2 border-indigo-200 ">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600 " /> New Client
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <GlassInput
              placeholder="Client Name"
              value={newClient.name}
              onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
            />
            <GlassInput
              placeholder="Email"
              type="email"
              value={newClient.email}
              onChange={e => setNewClient(prev => ({ ...prev, email: e.target.value }))}
            />
            <GlassInput
              placeholder="Phone"
              type="tel"
              value={newClient.phone}
              onChange={e => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
            />
            <GlassInput
              placeholder="Address"
              value={newClient.address}
              onChange={e => setNewClient(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <GlassButton onClick={() => setIsAdding(false)} variant="secondary" className="text-sm">
              <X size={14} className="mr-1" /> Cancel
            </GlassButton>
            <GlassButton onClick={handleAddClient} className="text-sm">
              <Check size={14} className="mr-1" /> Add Client
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Clients List */}
      {filteredClients.length === 0 ? (
        <GlassCard className="text-center py-16">
          <User size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">
            {searchTerm ? "No clients match your search" : "No clients yet. Add your first client!"}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client, index) => {
            const actualIndex = savedClients.indexOf(client);
            const isEditing = editingIndex === actualIndex;
            const clientInvoices = getClientInvoices(client.name);

            return (
              <GlassCard key={actualIndex} className="p-4 hover:shadow-lg transition-shadow">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <GlassInput
                      value={editClient.name}
                      onChange={e => setEditClient(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <GlassInput
                      type="email"
                      value={editClient.email}
                      onChange={e => setEditClient(prev => ({ ...prev, email: e.target.value }))}
                    />
                    <GlassInput
                      type="tel"
                      value={editClient.phone}
                      onChange={e => setEditClient(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <GlassInput
                      value={editClient.address}
                      onChange={e => setEditClient(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-violet-100 rounded-xl text-violet-600 ">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 ">{client.name}</h3>
                        <div className="flex flex-col gap-0.5 mt-1">
                          {client.email && <span className="text-xs text-slate-500 ">{client.email}</span>}
                          {client.phone && <span className="text-xs text-slate-500 ">{client.phone}</span>}
                          {clientInvoices.length > 0 && (
                            <button
                              onClick={() => setViewingClientHistory(client.name)}
                              className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1"
                            >
                              <FileText size={12} /> {clientInvoices.length} invoice{clientInvoices.length !== 1 ? 's' : ''}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(actualIndex)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmIndex(actualIndex)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-2 justify-end">
                    <GlassButton onClick={() => setEditingIndex(null)} variant="secondary" className="text-sm">
                      <X size={14} className="mr-1" /> Cancel
                    </GlassButton>
                    <GlassButton onClick={saveEdit} className="text-sm">
                      <Check size={14} className="mr-1" /> Save
                    </GlassButton>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Client Invoice History Modal */}
      {viewingClientHistory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col mx-4 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 pb-3 border-b border-slate-200 ">
              <h3 className="text-lg font-bold text-slate-800 ">
                Invoices for {viewingClientHistory}
              </h3>
              <button onClick={() => setViewingClientHistory(null)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {getClientInvoices(viewingClientHistory).map(inv => {
                const total = (inv.items || []).reduce((s, i) => s + (Number(i.quantity) * Number(i.price)), 0);
                return (
                  <div key={inv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{inv.id}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{inv.date}</p>
                    </div>
                    <span className="font-bold text-indigo-600 text-sm">₹{total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-7 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 max-w-sm mx-4 w-full">
            <div className="p-3 bg-rose-100 rounded-full">
              <AlertTriangle size={28} className="text-rose-600 " />
            </div>
            <h3 className="text-lg font-bold text-slate-800 ">Delete Client?</h3>
            <p className="text-slate-500 text-center text-sm">
              Are you sure you want to delete <span className="font-semibold text-slate-700 ">{savedClients[deleteConfirmIndex]?.name}</span>?
            </p>
            <div className="flex w-full gap-3 mt-1">
              <button
                onClick={() => setDeleteConfirmIndex(null)}
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

