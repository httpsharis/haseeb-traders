"use client";

import { useRouter } from "next/navigation";
import { Trophy, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhantomLoader } from "@/components/ui/PhantomLoader";

import { TopClientsProps } from '@types/index';


export function TopClients({ data, loading }: TopClientsProps) {
  const router = useRouter();

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-widest flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" /> Top Clients
        </h3>
      </div>

      <div className="p-2">
        {loading ? (
          <PhantomLoader loading={true} animation="shimmer">
            <div className="flex flex-col gap-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 w-full bg-slate-50 rounded-lg"></div>
              ))}
            </div>
          </PhantomLoader>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-slate-400 flex flex-col items-center">
            <Users className="h-6 w-6 mb-2 opacity-20" />
            <p className="text-xs font-medium">No client data yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {data.map((client, idx) => (
              <div key={idx} className="flex justify-between items-center py-2.5 px-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-[10px] font-black text-slate-300 w-3">{idx + 1}</span>
                  <p className="text-xs font-bold text-slate-700 truncate">{client.name}</p>
                </div>
                <p className="text-xs font-black text-slate-900">
                  Rs {client.total.toLocaleString("en-PK", { minimumFractionDigits: 0 })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-xs text-slate-600 font-bold hover:bg-white hover:text-slate-900" 
          onClick={() => router.push("/dashboard/clients")}
        >
          View Directory <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}