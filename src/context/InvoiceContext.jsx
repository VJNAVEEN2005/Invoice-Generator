import { createContext, useContext, useState, useEffect } from "react";
import { saveInvoiceToDisk, loadInvoiceFromDisk, saveGlobalData, loadGlobalData, listInvoicesFromDisk, deleteInvoiceFromDisk } from "../services/storage";

const InvoiceContext = createContext();

export const useInvoice = () => useContext(InvoiceContext);

export const InvoiceProvider = ({ children }) => {
  // --- State ---
  const [invoice, setInvoice] = useState({
    id: "INV-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-001",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    status: "new", // "new", "draft", "saved"
    client: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    items: [
      { id: crypto.randomUUID(), description: "Web Design Service", quantity: 1, price: 500 },
    ],
    taxRate: 10,
    discountRate: 0,
    currency: "INR",
    notes: "Thank you for your business!",
  });

  const [savedClients, setSavedClients] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]); // All saved invoices (drafts + finalized)
  const [companySettings, setCompanySettings] = useState({
    name: "",
    logo: "",
    address: "",
    phone: "",
    email: "",
    showInPreview: true,
    enableTax: true,
    enableDiscount: false,
    enableAI: false,
    apiKey: "",
    aiModel: "gemini-2.0-flash"
  });

  // Derived: split drafts vs finalized
  const drafts = allInvoices.filter(inv => inv.status === "draft");
  const invoiceHistory = allInvoices.filter(inv => inv.status === "saved");

  // --- Persistence ---
  useEffect(() => {
    async function loadData() {
      const data = await loadGlobalData();
      if (data) {
        if (data.clients) setSavedClients(data.clients);
        if (data.products) setSavedProducts(data.products);
        if (data.companySettings) setCompanySettings(data.companySettings);
      }
      const all = await listInvoicesFromDisk();
      setAllInvoices(all);
    }
    loadData();
  }, []);

  useEffect(() => {
     saveGlobalData({ clients: savedClients, products: savedProducts, companySettings });
  }, [savedClients, savedProducts, companySettings]);

  // Save as Draft
  const saveDraft = async () => {
    const draftInvoice = { ...invoice, status: "draft" };
    const success = await saveInvoiceToDisk(draftInvoice);
    if (success) {
      setInvoice(draftInvoice);
      setAllInvoices(prev => {
        const idx = prev.findIndex(inv => inv.id === draftInvoice.id);
        if (idx >= 0) return prev.map((inv, i) => i === idx ? { ...draftInvoice } : inv);
        return [{ ...draftInvoice }, ...prev];
      });
    }
    return success;
  };

  // Save as Finalized
  const saveInvoiceFinal = async () => {
    const finalInvoice = { ...invoice, status: "saved" };
    const success = await saveInvoiceToDisk(finalInvoice);
    if (success) {
      setInvoice(finalInvoice);
      setAllInvoices(prev => {
        const idx = prev.findIndex(inv => inv.id === finalInvoice.id);
        if (idx >= 0) return prev.map((inv, i) => i === idx ? { ...finalInvoice } : inv);
        return [{ ...finalInvoice }, ...prev];
      });
    }
    return success;
  };

  const createNewInvoice = () => {
    const prefix = companySettings.invoicePrefix || "INV";
    const nextNum = companySettings.nextInvoiceNumber || 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const newId = `${prefix}-${dateStr}-${String(nextNum).padStart(3, "0")}`;
    
    setInvoice({
      id: newId,
      date: new Date().toISOString().slice(0, 10),
      dueDate: "",
      status: "new",
      client: { name: "", email: "", phone: "", address: "" },
      items: [{ id: crypto.randomUUID(), description: "", quantity: 1, price: 0 }],
      taxRate: 10,
      discountRate: 0,
      currency: "INR",
      notes: "Thank you for your business!",
    });
    
    // Increment the counter for next invoice
    setCompanySettings(prev => ({ ...prev, nextInvoiceNumber: nextNum + 1 }));
  };

  const loadInvoice = (inv) => {
    setInvoice({ ...inv });
  };

  const deleteInvoice = async (id) => {
    const success = await deleteInvoiceFromDisk(id);
    if (success) {
      setAllInvoices(prev => prev.filter(inv => inv.id !== id));
      if (invoice.id === id) {
        createNewInvoice();
      }
    }
  };

  // --- Actions ---

  const addItem = (initialData = {}) => {
    setInvoice((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { 
          id: crypto.randomUUID(), 
          description: initialData.description || "", 
          quantity: initialData.quantity || 1, 
          price: initialData.price || 0 
        },
      ],
    }));
  };

  const updateItem = (id, field, value) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeItem = (id) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateClient = (field, value) => {
    setInvoice((prev) => ({
      ...prev,
      client: { ...prev.client, [field]: value },
    }));
  };

  const selectClient = (client) => {
    setInvoice((prev) => ({
      ...prev,
      client: { ...client },
    }));
  };
  
  const saveClientToDB = () => {
    const exists = savedClients.find(c => c.name === invoice.client.name);
    if (!exists && invoice.client.name) {
      setSavedClients(prev => [...prev, invoice.client]);
    }
  };

  const updateSettings = (field, value) => {
    setInvoice(prev => ({ ...prev, [field]: value }));
  };

  // --- Calculations ---
  const subtotal = invoice.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
  const discountAmount = companySettings.enableDiscount ? (subtotal * invoice.discountRate) / 100 : 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = companySettings.enableTax ? (taxableAmount * invoice.taxRate) / 100 : 0;
  const total = taxableAmount + taxAmount;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency,
    }).format(amount);
  };

  const value = {
    invoice,
    setInvoice,
    savedClients,
    setSavedClients,
    savedProducts,
    setSavedProducts,
    drafts,
    invoiceHistory,
    addItem,
    updateItem,
    removeItem,
    updateClient,
    selectClient,
    saveClientToDB,
    updateSettings,
    companySettings,
    updateCompanySettings: (field, value) => setCompanySettings(prev => ({ ...prev, [field]: value })),
    saveInvoiceFinal,
    createNewInvoice,
    loadInvoice,
    deleteInvoice,
    totals: { subtotal, discountAmount, taxAmount, total },
    formatCurrency,
  };

  return (
    <InvoiceContext.Provider value={value}>
      {children}
    </InvoiceContext.Provider>
  );
};
