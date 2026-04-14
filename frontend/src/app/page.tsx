"use client";

import { useState, useEffect } from "react";
import FileUploader from "@/components/FileUploader";
import ChatInterface from "@/components/ChatInterface";
import DashboardChart from "@/components/DashboardChart";
import { DatasetSnapshot, ChartConfig } from "@/types/dashboard";
import { FileSpreadsheet, Trash2 } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function Home() {
  const [snapshots, setSnapshots] = useState<DatasetSnapshot[]>([]);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load persistent memory on mount
  useEffect(() => {
    const savedSnapshots = localStorage.getItem("dashboard_snapshots");
    const savedCharts = localStorage.getItem("dashboard_charts");
    if (savedSnapshots) setSnapshots(JSON.parse(savedSnapshots));
    if (savedCharts) setCharts(JSON.parse(savedCharts));
  }, []);

  const handleUploadSuccess = (newSnapshots: any[]) => {
    const combinedSnapshots = [...snapshots, ...newSnapshots];
    setSnapshots(combinedSnapshots);
    localStorage.setItem("dashboard_snapshots", JSON.stringify(combinedSnapshots));
    
    const newCharts = newSnapshots
        .map(s => s.chart_config)
        .filter(Boolean);
    
    const combinedCharts = [...charts, ...newCharts];
    setCharts(combinedCharts);
    localStorage.setItem("dashboard_charts", JSON.stringify(combinedCharts));
  };
  
  const confirmClearMemory = () => {
    localStorage.removeItem("dashboard_snapshots");
    localStorage.removeItem("dashboard_charts");
    localStorage.removeItem("chat_session_id");
    setSnapshots([]);
    setCharts([]);
    setShowConfirmModal(false);
    // Force a page reload to cleanly bootstrap a fresh UUID session for the Chat
    window.location.reload();
  };

  const handleClearMemoryClick = () => {
    setShowConfirmModal(true);
  };

  return (
    <main className="flex h-screen bg-zinc-950 text-zinc-200 overflow-hidden font-sans">
      {/* Left Main Content */}
      <div className="flex-1 overflow-y-auto">
        <header className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-violet-600 p-2 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100">AI Data Analyst</h1>
              <p className="text-sm text-zinc-400">Automated CSV Intelligence Dashboard</p>
            </div>
          </div>
          
          {/* Flush Memory Button */}
          <button 
            onClick={handleClearMemoryClick}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
            Clear Memory
          </button>
        </header>
        
        <div className="p-8 max-w-5xl mx-auto space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">1. Data Ingestion</h2>
            <FileUploader onUploadSuccess={handleUploadSuccess} />
          </section>

          {snapshots.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-lg font-semibold text-zinc-100 mb-4">2. Key Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                  <p className="text-zinc-400 text-sm font-medium mb-1">Total Rows</p>
                  <p className="text-3xl font-bold text-zinc-100">{snapshots[0].row_count.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                  <p className="text-zinc-400 text-sm font-medium mb-1">Data Domain</p>
                  <p className="text-3xl font-bold text-zinc-100">{snapshots[0].profile?.domain || "Unknown"}</p>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
                  <p className="text-zinc-400 text-sm font-medium mb-1">Memory Allocation</p>
                  <p className="text-3xl font-bold text-zinc-100">{snapshots[0].memory_mb} MB</p>
                </div>
              </div>
            </section>
          )}

          <section>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-100">3. Visualization Canvas</h2>
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {charts.length > 0 ? (
                    charts.map(chart => <DashboardChart key={chart.id} config={chart} />)
                ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                        <FileSpreadsheet className="w-8 h-8 mb-2 opacity-50" />
                        <p>Upload a file to generate AI data visualizations</p>
                    </div>
                )}
             </div>
          </section>
        </div>
      </div>

      {/* Right Sidebar - Agent Chat */}
      <div className="w-[400px] shrink-0 border-l border-zinc-800 h-full">
        <ChatInterface datasets={snapshots} />
      </div>

      <ConfirmModal 
        isOpen={showConfirmModal}
        title="Clear Memory?"
        description="This will completely erase all uploaded Data Schemas natively mapped to the dashboard, as well as your local Chat Session identifiers. This action cannot be undone."
        confirmText="Erase Everything"
        cancelText="Cancel"
        onConfirm={confirmClearMemory}
        onCancel={() => setShowConfirmModal(false)}
      />
    </main>
  );
}
