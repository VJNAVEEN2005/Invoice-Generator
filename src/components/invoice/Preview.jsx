import { useInvoice } from "../../context/InvoiceContext";
import { GlassCard } from "../ui/GlassCard";
import { Download } from "lucide-react";
import { generatePDF } from "../../services/pdf"; 
import { GlassButton } from "../ui/GlassButton";

export function Preview() {
  const { invoice, totals, formatCurrency, companySettings } = useInvoice();

  const handleExport = async () => {
    await generatePDF("invoice-preview", `Invoice-${invoice.id}.pdf`);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-end">
        <GlassButton onClick={handleExport} className="flex items-center gap-2">
            <Download size={18} />
            Export PDF
        </GlassButton>
      </div>

      <div id="invoice-preview" className="bg-white text-slate-900 p-8 rounded-lg shadow-2xl h-full overflow-y-auto aspect-[1/1.414] text-sm relative"> {/* A4 Ratio approx */}
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">INVOICE</h1>
                <p className="text-slate-500 font-medium">#{invoice.id}</p>
            </div>
            {companySettings.showInPreview && (
                <div className="text-right">
                    {companySettings.logo && (
                        <div className="mb-3 flex justify-end">
                            <img src={companySettings.logo} alt="Logo" className="h-12 object-contain" />
                        </div>
                    )}
                    <h2 className="font-bold text-xl text-indigo-600">{companySettings.name || "Your Company Name"}</h2>
                    <p className="text-slate-500 whitespace-pre-wrap">{companySettings.address || "123 Business Rd\nCity, State 12345"}</p>
                    <p className="text-slate-500">{companySettings.phone}</p>
                    <p className="text-slate-500">{companySettings.email}</p>
                </div>
            )}
        </div>

        {/* Client & Date */}
        <div className="flex justify-between mb-8">
            <div>
                <h3 className="text-slate-500 font-bold mb-1">Bill To:</h3>
                <p className="font-bold text-slate-800">{invoice.client.name || "Client Name"}</p>
                <p className="text-slate-600 whitespace-pre-wrap">{invoice.client.address}</p>
                <p className="text-slate-600">{invoice.client.phone}</p>
                <p className="text-slate-600">{invoice.client.email}</p>
            </div>
            <div className="text-right">
                <div className="mb-2">
                    <span className="text-slate-500 font-bold block">Date:</span>
                    <span>{invoice.date}</span>
                </div>
                {invoice.dueDate && (
                    <div>
                        <span className="text-slate-500 font-bold block">Due Date:</span>
                        <span>{invoice.dueDate}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Table */}
        <table className="w-full mb-8">
            <thead>
                <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 font-bold text-slate-600">Description</th>
                    <th className="text-center py-3 font-bold text-slate-600 w-20">Qty</th>
                    <th className="text-right py-3 font-bold text-slate-600 w-24">Price</th>
                    <th className="text-right py-3 font-bold text-slate-600 w-24">Amount</th>
                </tr>
            </thead>
            <tbody>
                {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                        <td className="py-3 text-slate-700">{item.description}</td>
                        <td className="py-3 text-center text-slate-700">{item.quantity}</td>
                        <td className="py-3 text-right text-slate-700">{formatCurrency(item.price)}</td>
                        <td className="py-3 text-right font-medium text-slate-800">{formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        {/* Totals */}
        <div className="flex flex-col items-end gap-2 border-t border-slate-200 pt-4">
             <div className="flex justify-between w-64 text-slate-600">
                 <span>Subtotal</span>
                 <span>{formatCurrency(totals.subtotal)}</span>
             </div>
             
             {companySettings?.enableDiscount && (
                <div className="flex justify-between w-64 text-emerald-600">
                    <span>Discount ({invoice.discountRate}%)</span>
                    <span>-{formatCurrency(totals.discountAmount)}</span>
                </div>
             )}

             {companySettings?.enableTax && (
                <div className="flex justify-between w-64 text-slate-600">
                    <span>Tax ({invoice.taxRate}%)</span>
                    <span>{formatCurrency(totals.taxAmount)}</span>
                </div>
             )}

             <div className="h-px w-64 bg-slate-200 my-1"></div>
             <div className="flex justify-between w-64 text-xl font-bold text-indigo-700">
                 <span>Total</span>
                 <span>{formatCurrency(totals.total)}</span>
             </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
            <div className="mt-12 pt-4 border-t-2 border-slate-100">
                <h3 className="text-slate-500 font-bold mb-2">Notes:</h3>
                <p className="text-slate-600 italic">{invoice.notes}</p>
            </div>
        )}

      </div>
    </div>
  );
}

