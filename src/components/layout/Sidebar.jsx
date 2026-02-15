import { FileText, Users, Package, Settings as SettingsIcon, LayoutDashboard, BarChart3 } from "lucide-react";

export function Sidebar({ activeTab, onTabChange }) {
  
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "editor", label: "Invoice", icon: FileText },
    { id: "clients", label: "Clients", icon: Users },
    { id: "products", label: "Products", icon: Package },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="w-20 lg:w-64 bg-white/80 backdrop-blur-md border-r border-slate-200 flex flex-col h-full transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
      <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-hover rounded-lg flex items-center justify-center shadow-lg shadow-accent-primary/20 text-white">
          <FileText size={18} />
        </div>
        <h1 className="hidden lg:block text-xl font-bold text-slate-800">
          Invoicer
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group font-medium ${
                isActive 
                  ? "bg-slate-100 text-accent-primary shadow-inner" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 hover:pl-4"
              }`}
            >
              <Icon size={20} className={`transition-colors ${isActive ? "text-accent-primary" : "text-slate-400 group-hover:text-slate-900"}`} />
              <span className="hidden lg:block">{item.label}</span>
              {isActive && (
                <div className="hidden lg:block ml-auto w-1.5 h-1.5 rounded-full bg-accent-primary" />
              )}
            </button>
          );
        })}
      </nav>


    </div>
  );
}

