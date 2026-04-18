import { FileText, CheckSquare, Square, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BillType, getBaseAmount } from "@/lib/summaryHelper";

interface ClientBillsTableProps {
  activeClientId: string | null;
  currentClientBills: BillType[];
  selectedBills: string[];
  toggleBill: (id: string) => void;
  toggleSelectAll: () => void;
  handleProceed: () => void;
}

export function ClientBillsTable({
  activeClientId, currentClientBills, selectedBills, toggleBill, toggleSelectAll, handleProceed
}: ClientBillsTableProps) {
  if (!activeClientId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
        <div className="p-6 bg-white rounded-full shadow-sm mb-6 border border-slate-100">
          <FileText className="h-10 w-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-600 tracking-tight">No Client Selected</h3>
        <p className="text-sm mt-2 text-slate-500 font-medium">Choose a client from the directory to begin summarizing.</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-10 py-8 border-b border-slate-200 bg-white flex justify-between items-end shrink-0 z-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Client Bills</h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">Select the bills you wish to include in this summary.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={toggleSelectAll} 
          className="h-10 px-6 text-sm font-bold border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-[#ea580c] hover:border-orange-200 transition-colors"
        >
          {selectedBills.length === currentClientBills.length ? "Deselect All" : "Select All"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-10 pb-32">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[300px] relative">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm">
              <tr>
                <th className="w-16 py-4 px-6"></th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-[25%]">Date</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest w-[40%]">Category / Details</th>
                <th className="py-4 px-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right w-[25%]">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentClientBills.map(bill => {
                const isSelected = selectedBills.includes(bill._id);
                const displayTitle = bill.category || bill.description || bill.billNumber || `Bill #${bill._id.substring(0, 6).toUpperCase()}`;
                
                return (
                  <tr 
                    key={bill._id} 
                    onClick={() => toggleBill(bill._id)}
                    className={`cursor-pointer transition-all duration-200 ${isSelected ? "bg-orange-50/30" : "hover:bg-slate-50"}`}
                  >
                    <td className="py-5 px-6">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-[#ea580c] transition-transform scale-110" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 transition-transform" />
                      )}
                    </td>
                    <td className="py-5 px-6 text-sm font-medium text-slate-500">
                      {bill.date ? new Date(bill.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "—"}
                    </td>
                    <td className="py-5 px-6">
                      <p className="text-sm font-bold text-slate-900">{displayTitle}</p>
                    </td>
                    <td className="py-5 px-6 text-sm font-black text-slate-900 text-right">
                      Rs {getBaseAmount(bill).toLocaleString("en-PK")}
                    </td>
                  </tr>
                );
              })}
              {currentClientBills.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm font-medium text-slate-500 bg-slate-50/50">
                    This client has no bills available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBills.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-5 px-10 flex justify-between items-center animate-in slide-in-from-bottom-4 z-20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-sm font-black text-[#ea580c]">{selectedBills.length}</span>
            </div>
            <p className="font-bold text-slate-600 text-sm">
              {selectedBills.length === 1 ? "Bill Selected" : "Bills Selected"}
            </p>
          </div>
          <Button 
            onClick={handleProceed} 
            className="bg-[#ea580c] text-white hover:bg-[#d44d0a] hover:shadow-lg hover:shadow-orange-500/20 px-8 h-12 text-sm font-black transition-all"
          >
            Proceed to Tax Setup <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </>
  );
}