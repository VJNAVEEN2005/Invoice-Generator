import { useState } from "react";
import { useInvoice } from "../../context/InvoiceContext";
import { useToast } from "../../context/ToastContext";
import { GlassCard } from "../ui/GlassCard";
import { GlassInput } from "../ui/GlassInput";
import { GlassButton } from "../ui/GlassButton";
import { Upload, Download, UploadCloud, Hash } from "lucide-react";
import { saveGlobalData, loadGlobalData, listInvoicesFromDisk } from "../../services/storage";

export function Settings() {
  const { companySettings, updateCompanySettings, savedClients, savedProducts, setSavedClients, setSavedProducts, invoiceHistory, drafts } = useInvoice();
  const { addToast } = useToast();
  const [importFile, setImportFile] = useState(null);

  // Export all data as JSON
  const handleExportData = async () => {
    try {
      const allInvoices = await listInvoicesFromDisk();
      const data = {
        companySettings,
        clients: savedClients,
        products: savedProducts,
        invoices: allInvoices,
        exportDate: new Date().toISOString(),
        version: "1.0"
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoicer-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("Data exported successfully!", "success");
    } catch (e) {
      addToast("Export failed: " + e.message, "error");
    }
  };

  // Import/Restore from JSON
  const handleImport = async () => {
    if (!importFile) return;
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      
      // Import clients
      if (data.clients) {
        setSavedClients(data.clients);
        await saveGlobalData("clients", data.clients);
      }
      
      // Import products
      if (data.products) {
        setSavedProducts(data.products);
        await saveGlobalData("products", data.products);
      }
      
      // Import company settings
      if (data.companySettings) {
        Object.entries(data.companySettings).forEach(([key, val]) => {
          updateCompanySettings(key, val);
        });
        await saveGlobalData("companySettings", data.companySettings);
      }
      
      // Import invoices (save each one to disk)
      if (data.invoices && Array.isArray(data.invoices)) {
        const { saveInvoiceToDisk } = await import("../../services/storage");
        for (const invoice of data.invoices) {
          await saveInvoiceToDisk(invoice);
        }
      }
      
      addToast(`Data restored successfully! Imported ${data.clients?.length || 0} clients, ${data.products?.length || 0} products, ${data.invoices?.length || 0} invoices.`, "success");
      setImportFile(null);
      
      // Reload page to refresh all data
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      addToast("Import failed: " + e.message, "error");
    }
  };

  // Export History as CSV (Excel compatible)
  const handleExportCSV = async () => {
    try {
      const allInvoices = await listInvoicesFromDisk();
      if (!allInvoices || allInvoices.length === 0) {
        addToast("No invoices to export.", "error");
        return;
      }

      // Define headers
      const headers = ["Invoice Number", "Date", "Client Name", "Client GSTIN", "Items", "Total Amount", "Status", "Notes"];
      
      // Map data to CSV rows
      const rows = allInvoices.map(inv => [
        `"${inv.id}"`, // Quote strings to handle commas
        `"${inv.date}"`,
        `"${inv.client.name.replace(/"/g, '""')}"`, // Escape quotes
        `"${inv.client.gstin || ""}"`,
        `"${inv.items.map(item => `${item.description.replace(/"/g, '""')} (${item.quantity} x ${item.price})`).join("; ")}"`, // Items summary
        inv.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0).toFixed(2), 
        // Note: Using calculated subtotal for simplicity in this csv view, or similar logic as before
        (function(i) {
            const sub = i.items.reduce((s, it) => s + (Number(it.quantity) * Number(it.price)), 0);
            const disc = (companySettings.enableDiscount && i.discountRate) ? (sub * i.discountRate) / 100 : 0;
            const tax = (companySettings.enableTax && i.taxRate) ? ((sub - disc) * i.taxRate) / 100 : 0;
            return (sub - disc + tax).toFixed(2);
        })(inv),
        `"${inv.status}"`,
        `"${(inv.notes || "").replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice_history_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("History exported as CSV!", "success");

    } catch (e) {
        console.error(e);
        addToast("CSV Export failed: " + e.message, "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-500 ">Manage your company details and invoice preferences.</p>
      </div>

      {/* Company Profile */}
      <GlassCard className="p-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-3">
          <span className="w-1 h-6 bg-accent-primary rounded-full"/>
          Company Profile
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1">
             <div className="mb-2 text-sm text-slate-500 font-medium">Company Logo</div>
             <div 
                className="relative group cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl h-48 flex flex-col items-center justify-center bg-slate-50 hover:bg-white hover:border-accent-primary/50 transition-all overflow-hidden shadow-inner"
                onClick={() => document.getElementById('logo-upload').click()}
             >
                {companySettings.logo ? (
                    <img src={companySettings.logo} alt="Company Logo" className="w-full h-full object-contain p-4" />
                ) : (
                    <div className="flex flex-col items-center text-slate-400 group-hover:text-accent-primary transition-colors">
                        <Upload size={32} className="mb-2" />
                        <span className="text-xs font-medium">Click to Upload or Paste URL below</span>
                    </div>
                )}
                <input 
                    type="file" 
                    id="logo-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                updateCompanySettings("logo", reader.result);
                            };
                            reader.readAsDataURL(file);
                        }
                    }}
                />
             </div>
             <div className="mt-3">
               <GlassInput 
                  placeholder="Logo URL (https://...)" 
                  value={companySettings.logo}
                  onChange={(e) => updateCompanySettings("logo", e.target.value)}
                  className="text-xs"
               />
             </div>
          </div>

          <div className="col-span-2 space-y-4">
            <GlassInput 
              label="Company Name" 
              placeholder="Your Business Name"
              value={companySettings.name}
              onChange={(e) => updateCompanySettings("name", e.target.value)}
            />
            <GlassInput 
              label="Business Address" 
              placeholder="123 Innovation Dr, Tech City"
              value={companySettings.address}
              onChange={(e) => updateCompanySettings("address", e.target.value)}
            />
            <GlassInput 
               label="Phone Number" 
               placeholder="+1 (555) 123-4567" 
               type="tel"
               value={companySettings.phone || ""}
               onChange={(e) => updateCompanySettings("phone", e.target.value)}
            />
            <GlassInput 
              label="Contact Email" 
              placeholder="billing@yourcompany.com"
              type="email"
              value={companySettings.email}
              onChange={(e) => updateCompanySettings("email", e.target.value)}
            />
          </div>
        </div>
      </GlassCard>

      {/* Invoice Numbering */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-3">
          <span className="w-1 h-6 bg-sky-500 rounded-full"/>
          <Hash size={20} className="text-sky-500" />
          Invoice Numbering
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassInput 
            label="Invoice Prefix" 
            placeholder="INV"
            value={companySettings.invoicePrefix || "INV"}
            onChange={(e) => updateCompanySettings("invoicePrefix", e.target.value)}
          />
          <GlassInput 
            label="Next Invoice Number" 
            placeholder="001"
            type="number"
            value={companySettings.nextInvoiceNumber || 1}
            onChange={(e) => updateCompanySettings("nextInvoiceNumber", Number(e.target.value))}
          />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Preview: <span className="font-semibold text-slate-600 ">{companySettings.invoicePrefix || "INV"}-{new Date().toISOString().slice(0,10).replace(/-/g,"")}-{String(companySettings.nextInvoiceNumber || 1).padStart(3, "0")}</span>
        </p>
      </GlassCard>

      {/* Invoice Preferences */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-3">
          <span className="w-1 h-6 bg-purple-500 rounded-full"/>
          Invoice Preferences
        </h2>
        
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="text-slate-800 font-medium mb-1">Enable GST Features</div>
                  <div className="text-sm text-slate-500 ">Show GSTIN fields on invoices.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={companySettings.enableGST || false}
                    onChange={(e) => updateCompanySettings("enableGST", e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary shadow-inner"></div>
                </label>
            </div>

            {companySettings.enableGST && (
               <GlassInput 
                  label="Company GSTIN" 
                  placeholder="29ABCDE1234F1Z5"
                  value={companySettings.gstin || ""}
                  onChange={(e) => updateCompanySettings("gstin", e.target.value.toUpperCase())}
               />
            )}

            {[
              { field: "showInPreview", label: "Show Company Details", desc: "Toggle whether your company info appears on the generated PDF." },
              { field: "enableTax", label: "Enable Tax Calculation", desc: "Automatically calculate and show tax on invoices." },
              { field: "enableDiscount", label: "Enable Discount", desc: "Allow applying a percentage discount to the subtotal." },
            ].map(toggle => (
              <div key={toggle.field} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="text-slate-800 font-medium mb-1">{toggle.label}</div>
                  <div className="text-sm text-slate-500 ">{toggle.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={companySettings[toggle.field]}
                    onChange={(e) => updateCompanySettings(toggle.field, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary shadow-inner"></div>
                </label>
              </div>
            ))}
        </div>
      </GlassCard>

      {/* AI Integration */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-3">
          <span className="w-1 h-6 bg-rose-500 rounded-full"/>
          AI Integration
        </h2>
        
        <div className="space-y-4">
           {/* Enable Toggle */}
           <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <div className="text-slate-800 font-medium mb-1">Enable AI Assistant</div>
                <div className="text-sm text-slate-500 ">Allow the AI to help you manage invoices.</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={companySettings.enableAI || false}
                  onChange={(e) => updateCompanySettings("enableAI", e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary shadow-inner"></div>
              </label>
           </div>

            {/* API Key Input */}
            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-700">Google Gemini API Key</label>
               <div className="flex gap-2">
                 <GlassInput 
                   type="password"
                   placeholder="Enter your API Key"
                   value={companySettings.apiKey || ""}
                   onChange={(e) => updateCompanySettings("apiKey", e.target.value)}
                   className="flex-1"
                 />
                 <GlassButton variant="primary" onClick={async () => {
                    // Force save global data immediately
                    await saveGlobalData({
                        companySettings,
                        clients: savedClients,
                        products: savedProducts
                    });
                    addToast("API Key saved successfully!", "success");
                 }}>
                    Save
                 </GlassButton>
               </div>
               <p className="text-xs text-slate-500">
                 Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-accent-primary hover:underline">Google AI Studio</a>.
               </p>
            </div>

           {/* Model Selection Dropdown */}
           <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Select AI Model</label>
              <div className="relative">
                <select
                  value={companySettings.aiModel || "gemini-2.0-flash"}
                  onChange={(e) => updateCompanySettings("aiModel", e.target.value)}
                  className="w-full px-4 py-3 bg-white/50 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-primary/20 text-slate-700 appearance-none shadow-sm transition-all text-sm"
                >
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Standard)</option>
                  <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite (Cost-efficient)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Balanced)</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite (Ultra fast)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Reasoning)</option>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Next-gen speed)</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (Most powerful)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                </div>
              </div>
           </div>
        </div>
      </GlassCard>

      {/* Export & Backup */}
      <GlassCard>
        <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-3">
          <span className="w-1 h-6 bg-emerald-500 rounded-full"/>
          Backup & Restore
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-4">
            <div className="p-3 bg-emerald-100 rounded-full inline-flex">
              <Download size={24} className="text-emerald-600 " />
            </div>
            <h3 className="font-bold text-slate-800 ">Export Data</h3>
            <p className="text-sm text-slate-500 ">Download all your data as a JSON backup file.</p>
            <GlassButton onClick={handleExportData} className="w-full flex items-center justify-center gap-2">
              <Download size={16} /> Export All Data (JSON)
            </GlassButton>
            <GlassButton onClick={handleExportCSV} variant="secondary" className="w-full flex items-center justify-center gap-2 mt-2 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
              <Download size={16} /> Export History (Excel/CSV)
            </GlassButton>
          </div>

          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-4">
            <div className="p-3 bg-amber-100 rounded-full inline-flex">
              <UploadCloud size={24} className="text-amber-600 " />
            </div>
            <h3 className="font-bold text-slate-800 ">Restore Data</h3>
            <p className="text-sm text-slate-500 ">Import a previously exported backup file.</p>
            <input 
              type="file" 
              accept=".json"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-amber-100 file:text-amber-700 file:font-semibold file:cursor-pointer hover:file:bg-amber-200"
            />
            {importFile && (
              <GlassButton onClick={handleImport} variant="secondary" className="w-full flex items-center justify-center gap-2 mt-2">
                <UploadCloud size={16} /> Restore from {importFile.name}
              </GlassButton>
            )}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

