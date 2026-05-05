import { LayoutGrid, BarChart2, PieChart, Database, Filter, SlidersHorizontal, Settings, Plus, Type, Sparkles, AreaChart, Table as TableIcon, Map, Gauge, GitMerge, Grid3X3, ScatterChart, Radar, Shield, Image as ImageIcon, LayoutTemplate, FileBarChart, Folder } from "lucide-react";
import { useCanvasStore } from "../store/canvasStore";
import { useDatasetStore } from "../store/datasetStore";
import { chartConfigs } from "../lib/constants";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useRef, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { generateDashboardLayout } from "../lib/gemini";
import { auth } from "../lib/firebase";

import { useAuthState } from "react-firebase-hooks/auth";
import { isRealFirebase } from "../lib/firebase";

export function Sidebar() {
  const { addTile, setTiles, currentView, setCurrentView } = useCanvasStore();
  const { datasets, activeDatasetId } = useDatasetStore();
  const [isGenerating, setIsGenerating] = useState(false);

  // Use useAuthState for reactive auth updates
  const safeAuthForHook = isRealFirebase ? auth : {
    currentUser: JSON.parse(localStorage.getItem('lumina_demo_user') || 'null'),
    onAuthStateChanged: (cb: any) => { cb(JSON.parse(localStorage.getItem('lumina_demo_user') || 'null')); return () => {}; }
  };
  const [user] = useAuthState(safeAuthForHook as any);

  const isAdmin = user?.email === "sabledattatray@gmail.com" || user?.uid === 'demo-user';

  const handleGenerateDashboard = async () => {
    if (!activeDatasetId) return;
    const dataset = datasets.find(d => d.id === activeDatasetId);
    if (!dataset) return;

    console.log("[AI] Starting dashboard generation...");
    setIsGenerating(true);
    const toastId = toast.loading("AI is analyzing your dataset and generating a dashboard...");

    try {
      if (!dataset.columns || dataset.columns.length === 0) {
        throw new Error("Dataset has no columns to analyze.");
      }

      const generatedTiles = await generateDashboardLayout(
        dataset.columns,
        dataset.data || [],
        dataset.id,
        dataset.name
      );
      
      console.log("[AI] Generated tiles count:", generatedTiles?.length);
      if (generatedTiles && generatedTiles.length > 0) {
        setTiles(generatedTiles);
        setCurrentView('dashboard');
        toast.success("Dashboard generated successfully!", { id: toastId });
      } else {
        toast.error("AI returned an empty layout. This can happen with very small or complex datasets.", { id: toastId });
      }
    } catch (error: any) {
      console.error("[AI] Generation UI error:", error);
      const msg = error.message || "Authentication or API error occurred.";
      toast.error(`AI Helper: ${msg}`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] flex flex-col h-full flex-shrink-0">
      <div className="px-4 py-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tighter shadow-sm">L</div>
        <span className="font-semibold text-lg tracking-tight dark:text-slate-100">LuminaBI</span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        <div className="mb-4 space-y-1">
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${currentView === 'dashboard' ? 'dark:text-slate-200 bg-slate-100 dark:bg-slate-800 text-slate-900' : 'dark:text-slate-400 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <LayoutGrid className={`w-4 h-4 mr-3 ${currentView === 'dashboard' ? 'text-blue-500' : ''}`} />
            Dashboards
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${currentView === 'reports' ? 'dark:text-slate-200 bg-slate-100 dark:bg-slate-800 text-slate-900' : 'dark:text-slate-400 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
            onClick={() => setCurrentView('reports')}
          >
            <FileBarChart className={`w-4 h-4 mr-3 ${currentView === 'reports' ? 'text-blue-500' : ''}`} />
            Reports
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${currentView === 'datasets' ? 'dark:text-slate-200 bg-slate-100 dark:bg-slate-800 text-slate-900' : 'dark:text-slate-400 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
            onClick={() => setCurrentView('datasets')}
          >
            <Database className={`w-4 h-4 mr-3 ${currentView === 'datasets' ? 'text-blue-500' : ''}`} />
            Datasets
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${currentView === 'workspace' ? 'dark:text-slate-200 bg-slate-100 dark:bg-slate-800 text-slate-900' : 'dark:text-slate-400 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'}`}
            onClick={() => setCurrentView('workspace')}
          >
            <Folder className={`w-4 h-4 mr-3 ${currentView === 'workspace' ? 'text-blue-500' : ''}`} />
            Workspace
          </Button>
          <Button 
            variant="ghost" 
            className={`w-full justify-start text-sm font-medium ${currentView === 'ai_insights' ? 'text-fuchsia-600 bg-fuchsia-100 dark:bg-fuchsia-500/20 dark:text-fuchsia-400' : 'text-fuchsia-500 hover:text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10'}`}
            onClick={() => setCurrentView('ai_insights')}
          >
            <Sparkles className="w-4 h-4 mr-3" />
            AI Insights
          </Button>
          {isAdmin && (
            <Button 
              variant="ghost" 
              className={`w-full justify-start text-sm font-medium mt-2 ${currentView === 'admin' ? 'dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
              onClick={() => setCurrentView('admin')}
            >
              <Shield className={`w-4 h-4 mr-3 ${currentView === 'admin' ? 'text-indigo-500' : ''}`} />
              Admin Panel
            </Button>
          )}
        </div>

        <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 mt-4 pt-2">Add Visuals</h4>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("KPI_CARD", 3, 2)} title="KPI Card">
            <div className="text-[11px] font-bold tracking-tight text-slate-700 dark:text-slate-300 w-5 text-center mr-1.5">123</div>
            <span className="text-[11px] text-slate-600 truncate">KPI Card</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("BAR_CHART", 6, 4)} title="Bar Chart">
            <BarChart2 className="w-4 h-4 text-blue-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Bar Chart</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("LINE_CHART", 6, 4)} title="Line Chart">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 mr-2.5 flex-shrink-0"><path d="m3 17 9-11 4 4 5-5"/><path d="m19 12v3"/></svg>
            <span className="text-[11px] text-slate-600 truncate">Line Chart</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("AREA_CHART", 6, 4)} title="Area Chart">
            <AreaChart className="w-4 h-4 text-teal-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Area Chart</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("PIE_CHART", 4, 4)} title="Pie Chart">
            <PieChart className="w-4 h-4 text-indigo-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Pie Chart</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("TABLE", 6, 5)} title="Table">
            <TableIcon className="w-4 h-4 text-slate-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Table</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("MAP", 6, 5)} title="Map">
            <Map className="w-4 h-4 text-green-600 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Map</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("GAUGE", 3, 3)} title="Gauge">
            <Gauge className="w-4 h-4 text-rose-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Gauge</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("FUNNEL", 4, 4)} title="Funnel">
            <Filter className="w-4 h-4 text-orange-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Funnel</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("TREEMAP", 6, 4)} title="Treemap">
            <LayoutTemplate className="w-4 h-4 text-sky-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Treemap</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("SANKEY", 6, 4)} title="Sankey">
            <GitMerge className="w-4 h-4 text-purple-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Sankey</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("HEATMAP", 6, 4)} title="Heatmap">
            <Grid3X3 className="w-4 h-4 text-red-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Heatmap</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("SCATTER", 6, 4)} title="Scatter">
            <ScatterChart className="w-4 h-4 text-cyan-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Scatter</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("RADAR", 4, 4)} title="Radar">
            <Radar className="w-4 h-4 text-fuchsia-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Radar</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("TEXT", 6, 3)} title="Text Box">
            <Type className="w-4 h-4 text-amber-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Text Box</span>
          </Button>
          <Button variant="outline" className="w-full justify-start h-12 px-3 bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80 shadow-sm" onClick={() => addTile("IMAGE", 4, 4)} title="Image">
            <ImageIcon className="w-4 h-4 text-pink-500 mr-2.5 flex-shrink-0" />
            <span className="text-[11px] text-slate-600 truncate">Image</span>
          </Button>
        </div>

      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0">
        <Button
          className="w-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 hover:from-violet-400 hover:via-fuchsia-400 hover:to-pink-400 text-white hover:text-white dark:text-white dark:hover:text-white font-bold border-0 shadow-lg shadow-fuchsia-500/25 dark:shadow-fuchsia-500/10 gap-2 h-11 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-100 disabled:shadow-none disabled:hover:scale-100"
          onClick={handleGenerateDashboard}
          disabled={isGenerating || !activeDatasetId}
          title={!activeDatasetId ? "Select a dataset first to auto-generate a dashboard" : "Auto-Generate Dashboard"}
        >
          <Sparkles className="w-4 h-4 flex-shrink-0 text-white drop-shadow-sm" />
          <span className="truncate text-white drop-shadow-md">{isGenerating ? "Generating..." : "AI Auto Generate"}</span>
        </Button>
        
        <div className="mt-3 flex items-center justify-between px-1">
          <button 
            onClick={() => setCurrentView('privacy')}
            className="text-[10px] uppercase tracking-wider font-bold text-slate-400 hover:text-indigo-500 dark:text-slate-500 transition-colors flex items-center gap-1"
          >
            <Shield className="w-2.5 h-2.5" />
            Privacy
          </button>
          <span className="text-[10px] text-slate-300 dark:text-slate-800">|</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">v1.2.4</span>
        </div>
      </div>
    </div>
  );
}
