
import { useState } from "react";
import { useInvoice } from "../../context/InvoiceContext";
import { useToast } from "../../context/ToastContext";
import { GlassCard } from "../ui/GlassCard";
import { GlassInput } from "../ui/GlassInput";
import { GlassAutocomplete } from "../ui/GlassAutocomplete";
import { GlassButton } from "../ui/GlassButton";
import { Trash2, Plus, Package, Search, ArrowLeft, Save, FileDown, Printer, Share2 } from "lucide-react";
import { openUrl } from '@tauri-apps/plugin-opener';

import { generatePDF, printPDF, copyInvoiceToClipboard, shareInvoice } from "../../services/pdf"; 
import { ProductPicker } from "../products/ProductPicker";

export function Editor({ onBack }) {
  const { invoice, updateSettings, updateClient, addItem, updateItem, removeItem, totals, formatCurrency, saveDraft, saveInvoiceFinal, companySettings, savedClients, savedProducts, selectClient, deleteInvoice } = useInvoice();
  const { addToast } = useToast();
  const [isPickingProduct, setIsPickingProduct] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [clientSearch, setClientSearch] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientHighlightIdx, setClientHighlightIdx] = useState(-1);
  const filteredClients = savedClients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const isSaved = invoice.status === "saved";
  const isDraft = invoice.status === "draft";

  const handleClientKeyDown = (e) => {
    if (!showClientDropdown || !clientSearch) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setClientHighlightIdx(prev => (prev < filteredClients.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setClientHighlightIdx(prev => (prev > 0 ? prev - 1 : filteredClients.length - 1));
    } else if (e.key === 'Enter' && clientHighlightIdx >= 0 && clientHighlightIdx < filteredClients.length) {
      e.preventDefault();
      selectClient(filteredClients[clientHighlightIdx]);
      setClientSearch("");
      setShowClientDropdown(false);
      setClientHighlightIdx(-1);
    } else if (e.key === 'Escape') {
      setShowClientDropdown(false);
      setClientHighlightIdx(-1);
    }
  };

  const handleSaveClick = () => {
    setShowSaveDialog(true);
  };

  const handleSaveAsDraft = async () => {
    const result = await saveDraft();
    setShowSaveDialog(false);
    if (result.success) {
      addToast("Saved as draft!", "success");
      if (onBack) onBack();
    } else {
      addToast(`Save failed: ${result.error}`, "error");
    }
  };

  const handleSaveFinal = async () => {
    const result = await saveInvoiceFinal();
    setShowSaveDialog(false);
    if (result.success) {
      addToast("Invoice saved!", "success");
    } else {
      addToast(`Save failed: ${result.error}`, "error");
    }
  };

  const handleExport = async () => {
    await generatePDF("invoice-preview", `Invoice-${invoice.id}.pdf`);
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    await printPDF("invoice-preview");
    setIsPrinting(false);
  };

  const handleWhatsApp = async () => {
    addToast("Generating invoice image...", "loading");
    const success = await copyInvoiceToClipboard("invoice-preview");
    
    if (success) {
        addToast("Invoice image copied! Paste in WhatsApp.", "success");
        setTimeout(async () => {
            const text = `Invoice ${invoice.id}\nClient: ${invoice.client.name}\nTotal: ${formatCurrency(totals.total)}\nDate: ${invoice.date}\n\n(Paste the image from your clipboard)`;
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            await openUrl(url);
        }, 1000); 
    } else {
        addToast("Failed to copy image. Opening WhatsApp...", "error");
        const text = `Invoice ${invoice.id}\nClient: ${invoice.client.name}\nTotal: ${formatCurrency(totals.total)}\nDate: ${invoice.date}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        await openUrl(url);
    }
  };

  const handleShare = async () => {
     addToast("Opening share dialog...", "loading");
     const result = await shareInvoice("invoice-preview", invoice.id);
     if (result === 'shared') {
         addToast("Invoice shared successfully!", "success");
     } else if (result !== 'cancelled') {
         addToast("Share failed or not supported.", "error");
     }
  };

  const handleDelete = async () => {
    await deleteInvoice(invoice.id);
    addToast("Invoice deleted", "success");
    if (onBack) onBack();
    setShowDeleteDialog(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {isPickingProduct && <ProductPicker onClose={() => setIsPickingProduct(false)} />}
      
      {/* Save Confirmation Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 animate-in zoom-in-95 duration-300 max-w-sm mx-4 w-full">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Save size={32} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Save Invoice</h3>
            <p className="text-slate-500 text-center text-sm">
              How would you like to save <span className="font-semibold text-slate-700">{invoice.id}</span>?
            </p>
            <div className="flex flex-col w-full gap-2 mt-1">
              <button 
                onClick={handleSaveFinal}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Save size={16} /> Save
              </button>
              <button 
                onClick={handleSaveAsDraft}
                className="w-full px-4 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-semibold hover:bg-amber-100 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <FileDown size={16} /> Save as Draft
              </button>
              <button 
                onClick={() => setShowSaveDialog(false)}
                className="w-full px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 animate-in zoom-in-95 duration-300 max-w-sm mx-4 w-full">
            <div className="p-3 bg-rose-100 rounded-full">
              <Trash2 size={32} className="text-rose-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Delete Invoice?</h3>
            <p className="text-slate-500 text-center text-sm">
              Are you sure you want to delete <span className="font-semibold text-slate-700">{invoice.id}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex flex-col w-full gap-2 mt-1">
              <button 
                onClick={handleDelete}
                className="w-full px-4 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Delete Forever
              </button>
              <button 
                onClick={() => setShowDeleteDialog(false)}
                className="w-full px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <GlassCard>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-xl font-bold bg-gradient-to-r from-accent-primary to-accent-hover bg-clip-text text-transparent">
              Invoice Details
            </h2>
            {isDraft && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">Draft</span>
            )}
            {isSaved && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">Saved</span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end items-center">
             {!isSaved ? (
               <GlassButton onClick={handleSaveClick} className="flex items-center gap-1.5">
                 <Save size={14} /> Save Invoice
               </GlassButton>
             ) : (
               <>
                 <GlassButton onClick={handleSaveClick} variant="secondary" className="flex items-center gap-1.5 text-xs">
                   <Save size={14} /> Update
                 </GlassButton>
                 <GlassButton onClick={handleExport} className="flex items-center gap-1.5 text-xs">
                   <FileDown size={14} /> Export PDF
                 </GlassButton>
                 <GlassButton onClick={handlePrint} isLoading={isPrinting} variant="secondary" className="flex items-center gap-1.5 text-xs">
                   {!isPrinting && <Printer size={14} />} Print
                 </GlassButton>
                 <GlassButton onClick={handleShare} variant="secondary" className="flex items-center gap-1.5 text-xs">
                   <Share2 size={14} /> Share
                 </GlassButton>
                 <GlassButton onClick={handleWhatsApp} variant="secondary" className="flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                   <Share2 size={14} /> WhatsApp
                 </GlassButton>
                 {/* Delete Button */}
                 <button 
                   onClick={() => setShowDeleteDialog(true)}
                   className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                   title="Delete Invoice"
                 >
                   <Trash2 size={18} />
                 </button>
               </>
             )}
             
             {/* Allow deleting drafts too */}
             {isDraft && !isSaved && (
                 <button 
                   onClick={() => setShowDeleteDialog(true)}
                   className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                   title="Delete Draft"
                 >
                   <Trash2 size={18} />
                 </button>
             )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassInput 
            label="Invoice Number" 
            value={invoice.id} 
            onChange={(e) => updateSettings("id", e.target.value)}
          />
          <GlassInput 
            label="Date" 
            type="date"
            value={invoice.date} 
            onChange={(e) => updateSettings("date", e.target.value)}
          />
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="text-xl font-bold mb-4 text-slate-800">Client Information</h2>
        <div className="space-y-4">
          {savedClients.length > 0 && (
            <div className="relative">
              <label className="block text-sm font-medium text-slate-600 mb-1">Search & Select Client</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Type to search saved clients..."
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); setClientHighlightIdx(-1); }}
                  onKeyDown={handleClientKeyDown}
                  onFocus={() => setShowClientDropdown(true)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all font-medium"
                />
              </div>
              {showClientDropdown && clientSearch && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-sm text-slate-400 text-center">No clients match</div>
                  ) : (
                    filteredClients.map((c, i) => (
                      <div 
                        key={i}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${i === clientHighlightIdx ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-indigo-50'}`}
                        onClick={() => { selectClient(c); setClientSearch(""); setShowClientDropdown(false); setClientHighlightIdx(-1); }}
                        ref={i === clientHighlightIdx ? el => el?.scrollIntoView({ block: 'nearest' }) : undefined}
                      >
                        <span className="font-medium text-slate-800">{c.name}</span>
                        {c.email && <span className="text-sm text-slate-400 ml-2">{c.email}</span>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <GlassAutocomplete 
            label="Client Name" 
            placeholder="e.g. Acme Corp"
            value={invoice.client.name} 
            onChange={(e) => updateClient("name", e.target.value)}
            suggestions={savedClients}
            getSuggestionValue={(client) => client.name}
            onSelect={(client) => selectClient(client)}
            renderSuggestion={(client) => (
                <div>
                    <div className="font-medium">{client.name}</div>
                    {client.email && <div className="text-xs text-slate-400">{client.email}</div>}
                </div>
            )}
          />
          <GlassInput 
            label="Email" 
            placeholder="client@example.com"
            type="email"
            value={invoice.client.email} 
            onChange={(e) => updateClient("email", e.target.value)}
          />
          <GlassInput 
            label="Phone" 
            placeholder="+1 (555) 000-0000"
            type="tel"
            value={invoice.client.phone || ""} 
            onChange={(e) => updateClient("phone", e.target.value)}
          />
          <GlassInput 
            label="Address" 
            placeholder="123 Business Rd, Tech City"
            value={invoice.client.address} 
            onChange={(e) => updateClient("address", e.target.value)}
          />
          {companySettings.enableGST && (
              <GlassInput 
                label="Client GSTIN" 
                placeholder="29ABCDE1234F1Z5" 
                value={invoice.client.gstin || ""}
                onChange={(e) => updateClient("gstin", e.target.value.toUpperCase())}
              />
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">Items</h2>
            <div className="flex gap-2">
                <GlassButton onClick={() => setIsPickingProduct(true)} variant="secondary" className="text-xs">
                    <Package size={14} className="mr-1" /> Load Product
                </GlassButton>
                <GlassButton onClick={() => addItem()} className="text-xs">
                    <Plus size={14} className="mr-1" /> Add Item
                </GlassButton>
            </div>
        </div>
        
        <div className="space-y-4">
          {invoice.items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-accent-primary/50 transition-colors shadow-sm">
              <div className="col-span-6">
                <GlassAutocomplete 
                  placeholder="Description" 
                  value={item.description} 
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  suggestions={savedProducts}
                  getSuggestionValue={(product) => product.name}
                  onSelect={(product) => {
                      updateItem(item.id, "description", product.name);
                      updateItem(item.id, "price", Number(product.price));
                  }}
                  renderSuggestion={(product) => (
                      <div className="flex justify-between">
                          <span>{product.name}</span>
                          <span className="text-slate-400 font-medium">{formatCurrency(product.price)}</span>
                      </div>
                  )}
                  className="mb-0 bg-white"
                />
              </div>
              <div className="col-span-2">
                <GlassInput 
                  type="number" 
                  placeholder="Qty" 
                  value={item.quantity} 
                  onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                  className="mb-0 text-center bg-white"
                />
              </div>
              <div className="col-span-3">
                 <GlassInput 
                  type="number" 
                  placeholder="Price" 
                  value={item.price} 
                  onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                  className="mb-0 text-right bg-white"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-end mt-6 space-y-2 text-right">
            <div className="text-slate-500 font-medium">Subtotal: <span className="text-slate-800 font-bold ml-2">{formatCurrency(totals.subtotal)}</span></div>
            
            {companySettings?.enableDiscount && (
                <div className="text-slate-500 flex items-center justify-end gap-2 font-medium">
                    <span>Discount (%):</span>
                    <input 
                        type="number" 
                        value={invoice.discountRate} 
                        onChange={e => updateSettings("discountRate", Number(e.target.value))}
                        className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 text-right focus:outline-none focus:border-accent-primary shadow-inner"
                    />
                    <span className="text-slate-800 font-bold ml-2">-{formatCurrency(totals.discountAmount)}</span>
                </div>
            )}

            {companySettings?.enableTax && (
                <div className="text-slate-500 flex items-center justify-end gap-2 font-medium">
                    <span>Tax (%):</span>
                    <input 
                        type="number" 
                        value={invoice.taxRate} 
                        onChange={e => updateSettings("taxRate", Number(e.target.value))}
                        className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 text-right focus:outline-none focus:border-accent-primary shadow-inner"
                    />
                    <span className="text-slate-800 font-bold ml-2">{formatCurrency(totals.taxAmount)}</span>
                </div>
            )}

            <div className="text-xl font-bold text-accent-primary mt-2 flex items-center gap-2">
                Total: {formatCurrency(totals.total)}
            </div>
        </div>
      </GlassCard>
      
      <GlassCard className="mb-20">
          <h2 className="text-xl font-bold mb-4 text-slate-800">Notes</h2>
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all min-h-[100px] shadow-inner font-medium"
            placeholder="Add any notes or payment terms..."
            value={invoice.notes}
            onChange={(e) => updateSettings("notes", e.target.value)}
          />
      </GlassCard>
    </div>
  );
}

