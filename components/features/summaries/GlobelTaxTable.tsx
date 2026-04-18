import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DBTaxRule, GlobalAppliedTax, generateId } from "@/lib/summaryHelper";

interface GlobalTaxTableProps {
  globalTaxes: GlobalAppliedTax[];
  availableTaxRules: DBTaxRule[];
  mathResults: { processedTaxes: { id: string; calculatedAmount: number }[] };
  setGlobalTaxes: React.Dispatch<React.SetStateAction<GlobalAppliedTax[]>>;
  updateGlobalTax: (id: string, field: keyof GlobalAppliedTax, value: string | number) => void;
}

export function GlobalTaxTable({
  globalTaxes, availableTaxRules, mathResults, setGlobalTaxes, updateGlobalTax
}: GlobalTaxTableProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
        <h3 className="text-lg font-bold text-slate-800">Global Summary Taxes</h3>
        <Button 
          onClick={() => setGlobalTaxes(p => [...p, { id: generateId(), name: "", percentage: 0, target: "BaseAmount", impact: "Add" }])} 
          variant="outline" 
          size="sm" 
          className="font-bold text-[#ea580c] border-orange-200 hover:bg-orange-50 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Adjustment
        </Button>
      </div>

      {globalTaxes.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-medium bg-slate-50/50">No global taxes applied.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-100">
                <th className="py-4 px-6 font-black w-64">Adjustment Name</th>
                <th className="py-4 px-4 font-black w-24">Rate (%)</th>
                <th className="py-4 px-4 font-black w-40">Calculate On</th>
                <th className="py-4 px-4 font-black text-center w-36">Exclude from Total</th>
                <th className="py-4 px-6 font-black text-right w-36">Amount</th>
                <th className="py-4 px-4 font-black w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {globalTaxes.map((tax) => {
                const calculatedAmount = mathResults.processedTaxes.find(t => t.id === tax.id)?.calculatedAmount || 0;
                return (
                  <tr key={tax.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-3 px-6">
                      <select 
                        value={tax.name} 
                        onChange={(e) => {
                          const ruleName = e.target.value;
                          const rule = availableTaxRules.find(r => r.name === ruleName);
                          updateGlobalTax(tax.id, "name", ruleName);
                          if (rule) {
                            updateGlobalTax(tax.id, "percentage", rule.percentage);
                            updateGlobalTax(tax.id, "target", rule.target || "BaseAmount");
                            updateGlobalTax(tax.id, "impact", rule.impact || "Add");
                          }
                        }} 
                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 outline-none"
                      >
                        <option value="" disabled>Select a saved tax...</option>
                        {availableTaxRules.map((r) => (
                          <option key={r.name} value={r.name}>{r.name} ({r.percentage}%)</option>
                        ))}
                        <option value="Custom Tax">Create Custom Tax...</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input 
                        type="number" 
                        value={tax.percentage} 
                        onChange={(e) => updateGlobalTax(tax.id, "percentage", e.target.value)} 
                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 outline-none text-right" 
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select 
                        value={tax.target} 
                        onChange={(e) => updateGlobalTax(tax.id, "target", e.target.value)} 
                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-medium outline-none"
                      >
                        <option value="BaseAmount">Base Total</option>
                        <option value="SubtotalAmount">Subtotal</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        type="button" 
                        onClick={() => updateGlobalTax(tax.id, "impact", tax.impact === "DisplayOnly" ? "Add" : "DisplayOnly")} 
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${tax.impact === "DisplayOnly" ? 'bg-[#ea580c]' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${tax.impact === "DisplayOnly" ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="py-3 px-6 text-right font-bold">Rs {calculatedAmount.toLocaleString("en-PK")}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="icon" onClick={() => setGlobalTaxes(p => p.filter(t => t.id !== tax.id))} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100">
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}