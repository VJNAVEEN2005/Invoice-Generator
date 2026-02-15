import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const ICONS = {
  success: <CheckCircle size={18} className="text-emerald-500" />,
  error: <AlertTriangle size={18} className="text-rose-500" />,
  info: <Info size={18} className="text-sky-500" />,
};

const BORDERS = {
  success: "border-emerald-200",
  error: "border-rose-200",
  info: "border-sky-200",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 2500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border ${BORDERS[toast.type]} px-4 py-3 flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300 min-w-[260px] max-w-sm`}
          >
            {ICONS[toast.type]}
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100 flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
