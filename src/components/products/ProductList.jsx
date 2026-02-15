import { useState, useMemo } from "react";
import { useInvoice } from "../../context/InvoiceContext";
import { useToast } from "../../context/ToastContext";
import { useSearch } from "../../hooks/useSearch";
import { GlassCard } from "../ui/GlassCard";
import { GlassButton } from "../ui/GlassButton";
import { GlassInput } from "../ui/GlassInput";
import { CategorySelect } from "../ui/CategorySelect";
import { Package, Plus, Pencil, Trash2, Check, X, Search, Tag, AlertTriangle, Loader2, ChevronDown } from "lucide-react";

export function ProductList() {
  const { savedProducts, setSavedProducts } = useInvoice();
  const { addToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ description: "", price: "", category: "" });
  const [editingIndex, setEditingIndex] = useState(null);
  const [editProduct, setEditProduct] = useState({ description: "", price: "", category: "" });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);

  const { searchTerm, setSearchTerm, filteredItems: searchedProducts, isSearching } = useSearch(
    savedProducts,
    ['description', 'category']
  );

  // Apply category filter on top of search results
  const filteredProducts = useMemo(() => {
    if (categoryFilter === "all") return searchedProducts;
    return searchedProducts.filter(p => p.category === categoryFilter);
  }, [searchedProducts, categoryFilter]);

  const categories = ["all", ...new Set(savedProducts.map(p => p.category).filter(Boolean))];
  const existingCategories = Array.from(new Set(savedProducts.map(p => p.category).filter(Boolean)));

  const handleAddProduct = () => {
    if (newProduct.description) {
      setSavedProducts(prev => [...prev, newProduct]);
      setNewProduct({ description: "", price: "", category: "" });
      setIsAdding(false);
      addToast("Product added!", "success");
    }
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditProduct({ ...savedProducts[index] });
  };

  const saveEdit = () => {
    setSavedProducts(prev => prev.map((p, i) => i === editingIndex ? editProduct : p));
    setEditingIndex(null);
    addToast("Product updated!", "success");
  };

  const confirmDelete = () => {
    setSavedProducts(prev => prev.filter((_, i) => i !== deleteConfirmIndex));
    setDeleteConfirmIndex(null);
    addToast("Product deleted!", "success");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Products</h1>
          <p className="text-slate-500 ">Manage your product catalog.</p>
        </div>
        <GlassButton onClick={() => setIsAdding(true)} className="flex items-center gap-2">
          <Plus size={16} /> Add Product
        </GlassButton>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-primary animate-spin" />}
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-sm font-medium"
          />
        </div>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all text-sm font-medium cursor-pointer"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Add Product Form */}
      {isAdding && (
        <GlassCard className="p-6 border-2 border-indigo-200 ">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-indigo-600 " /> New Product
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <GlassInput
              placeholder="Product Description"
              value={newProduct.description}
              onChange={e => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
            />
            <GlassInput
              placeholder="Price"
              type="number"
              value={newProduct.price}
              onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
            />
            <CategorySelect
              value={newProduct.category}
              onChange={e => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
              categories={existingCategories}
              placeholder="Category (optional)"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <GlassButton onClick={() => setIsAdding(false)} variant="secondary" className="text-sm">
              <X size={14} className="mr-1" /> Cancel
            </GlassButton>
            <GlassButton onClick={handleAddProduct} className="text-sm">
              <Check size={14} className="mr-1" /> Add Product
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Package size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">
            {searchTerm || categoryFilter !== "all" ? "No products match your filters" : "No products yet. Add your first product!"}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product, index) => {
            const actualIndex = savedProducts.indexOf(product);
            const isEditing = editingIndex === actualIndex;

            return (
              <GlassCard key={actualIndex} className="p-4 hover:shadow-lg transition-shadow">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <GlassInput
                      value={editProduct.description}
                      onChange={e => setEditProduct(prev => ({ ...prev, description: e.target.value }))}
                    />
                    <GlassInput
                      type="number"
                      value={editProduct.price}
                      onChange={e => setEditProduct(prev => ({ ...prev, price: e.target.value }))}
                    />
                    <CategorySelect
                      value={editProduct.category || ""}
                      onChange={e => setEditProduct(prev => ({ ...prev, category: e.target.value }))}
                      categories={existingCategories}
                      placeholder="Category"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 ">
                        <Package size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 ">{product.description}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-indigo-600 ">₹{product.price}</span>
                          {product.category && (
                            <>
                              <span className="text-slate-300 ">•</span>
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                <Tag size={10} /> {product.category}
                              </span>
                            </>
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

      {/* Delete Confirmation */}
      {deleteConfirmIndex !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-7 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 max-w-sm mx-4 w-full">
            <div className="p-3 bg-rose-100 rounded-full">
              <AlertTriangle size={28} className="text-rose-600 " />
            </div>
            <h3 className="text-lg font-bold text-slate-800 ">Delete Product?</h3>
            <p className="text-slate-500 text-center text-sm">
              Are you sure you want to delete <span className="font-semibold text-slate-700 ">{savedProducts[deleteConfirmIndex]?.description}</span>?
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

