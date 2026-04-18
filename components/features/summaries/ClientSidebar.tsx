import { Search } from "lucide-react";
import { ClientType } from "@/lib/summaryHelper";

interface ClientSidebarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  isLoading: boolean;
  filteredClients: ClientType[];
  activeClientId: string | null;
  onSelectClient: (id: string) => void;
}

export function ClientSidebar({
  searchTerm, setSearchTerm, isLoading, filteredClients, activeClientId, onSelectClient
}: ClientSidebarProps) {
  return (
    <div className="w-[320px] border-r border-slate-200 bg-white flex flex-col shadow-sm z-10">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">Select Client</h2>
        <div className="relative group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-[#ea580c] transition-colors" />
          <input
            type="text"
            placeholder="Search directory..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <div className="w-5 h-5 border-2 border-orange-200 border-t-[#ea580c] rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-medium uppercase tracking-wider">Loading...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredClients.map(client => {
              const isActive = activeClientId === client._id;
              return (
                <button
                  key={client._id}
                  onClick={() => onSelectClient(client._id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? "bg-orange-50 text-[#ea580c] shadow-sm ring-1 ring-orange-200" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {client.name || "Unknown Client"}
                </button>
              );
            })}
            {filteredClients.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8 font-medium">No matching clients found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}