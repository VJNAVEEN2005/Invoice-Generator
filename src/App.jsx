import { useState } from "react";
import { Editor } from "./components/invoice/Editor";
import { Preview } from "./components/invoice/Preview";
import { InvoicePage } from "./components/invoice/InvoiceList";
import { Sidebar } from "./components/layout/Sidebar";
import { ClientList } from "./components/clients/ClientList";
import { ProductList } from "./components/products/ProductList";
import { Settings } from "./components/settings/Settings";
import { Dashboard } from "./components/dashboard/Dashboard";
import { RevenueReports } from "./components/reports/RevenueReports";
import { InvoiceProvider } from "./context/InvoiceContext";
import { AIAssistant } from "./components/ai/AIAssistant";
import "./App.css";

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [reportView, setReportView] = useState("overview");
  const [reportDateRange, setReportDateRange] = useState(null);
  const [editorMode, setEditorMode] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-accent-primary/30 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setEditorMode(false); }} />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="flex-1 overflow-y-auto z-10 p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === "dashboard" && (
              <div className="animate-in fade-in duration-300">
                <Dashboard />
              </div>
            )}

            {activeTab === "editor" && !editorMode && (
              <div className="animate-in fade-in duration-300">
                <InvoicePage onEdit={() => setEditorMode(true)} />
              </div>
            )}
            {activeTab === "editor" && editorMode && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
                  <Editor onBack={() => setEditorMode(false)} />
                </div>
                <div className="hidden lg:block animate-in slide-in-from-right-4 duration-500 sticky top-0 h-fit">
                   <div id="invoice-preview-container" className="shadow-2xl shadow-black/50 rounded-lg overflow-hidden">
                      <Preview />
                   </div>
                </div>
              </div>
            )}
            
            {activeTab === "clients" && <ClientList />}
            {activeTab === "products" && <ProductList />}
            {activeTab === "reports" && <RevenueReports initialView={reportView} initialDateRange={reportDateRange} />}
            {activeTab === "settings" && <Settings />}
          </div>
        </div>
      </main>

      <AIAssistant onNavigate={(tab, params) => {
        setActiveTab(tab);
        if (tab === "editor") setEditorMode(true);
        else setEditorMode(false);
        
        if (tab === "reports") {
           if (params?.view) setReportView(params.view);
           if (params?.dateRange) setReportDateRange(params.dateRange);
        }
      }} />
    </div>
  );
}

function App() {
  return (
      <AppContent />
  );
}

export default App;
