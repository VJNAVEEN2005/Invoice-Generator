import { X, Package, Search } from "lucide-react";
import { useState } from "react";
import { useInvoice } from "../../context/InvoiceContext";
import { GlassCard } from "../ui/GlassCard";

export function ProductPicker({ onClose }) {
  const { savedProducts, addItem } = useInvoice();
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const filtered = savedProducts.filter(p => p.description.toLowerCase().includes(search.toLowerCase()));

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(prev => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(prev => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter' && highlightIdx >= 0 && highlightIdx < filtered.length) {
      e.preventDefault();
      handleSelect(filtered[highlightIdx]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (product) => {
    addItem(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="w-full max-w-md max-h-[80vh] flex flex-col relative animate-in fade-in zoom-in duration-200">
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors"
        >
            <X size={20} />
        </button>
        
        <h3 className="text-xl font-bold mb-4 text-slate-800">Select Product</h3>
        
        <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => { setSearch(e.target.value); setHighlightIdx(-1); }}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-sm font-medium"
                autoFocus
            />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            {filtered.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    {savedProducts.length === 0 ? "No saved products found." : "No products match your search."}
                </div>
            ) : (
                filtered.map((product, index) => (
                    <div 
                        key={index}
                        onClick={() => handleSelect(product)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors border ${index === highlightIdx ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200' : 'bg-slate-50 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'}`}
                        ref={index === highlightIdx ? el => el?.scrollIntoView({ block: 'nearest' }) : undefined}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-primary/10 rounded-md text-accent-primary">
                                <Package size={18} />
                            </div>
                            <div>
                                <p className="font-medium text-slate-800">{product.description}</p>
                            </div>
                        </div>
                        <span className="font-semibold text-accent-primary">₹{product.price}</span>
                    </div>
                ))
            )}
        </div>
      </GlassCard>
    </div>
  );
}

