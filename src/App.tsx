import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { CanvasGrid } from "./components/CanvasGrid";
import { RightPanel } from "./components/RightPanel";
import { DataPreviewModal } from "./components/DataPreviewModal";
import { DataWorkspace } from "./components/DataWorkspace";
import { useCanvasStore } from "./store/canvasStore";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "./lib/firebase";
import { AuthPage } from "./components/AuthPage";
import { Sparkles } from "lucide-react";
import { useDatasetStore } from "./store/datasetStore";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";

import { AdminPanel } from "./components/AdminPanel";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, loading, error] = useAuthState(auth);
  const { datasets, setDatasets, addDataset } = useDatasetStore();
  const { tiles, setTiles, currentView, setCurrentView } = useCanvasStore();
  
  // Sync logic flags
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  useEffect(() => {
    // Force dark mode for Elegant Dark theme
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Load once
    const loadUserData = async () => {
      try {
        // Load Datasets
        const datasetsSnap = await getDocs(collection(db, `users/${user.uid}/datasets`));
        if (!datasetsSnap.empty) {
          const loadedDatasets = datasetsSnap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as any));
          setDatasets(loadedDatasets);
        }

        // Load Dashboards
        const dashboardRef = doc(db, `users/${user.uid}/dashboards`, "main");
        const dashboardSnap = await getDoc(dashboardRef);
        if (dashboardSnap.exists()) {
          const data = dashboardSnap.data();
          if (data.tiles) {
            setTiles(data.tiles);
          }
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
      } finally {
        setInitialSyncDone(true);
      }
    };
    
    loadUserData();
  }, [user]);

  // Save changes to Firestore
  useEffect(() => {
    if (!user || !initialSyncDone) return;
    
    const saveToFirestore = async () => {
       try {
         // Save main dashboard layouts
         await setDoc(doc(db, `users/${user.uid}/dashboards`, "main"), {
           userId: user.uid,
           tiles: tiles,
           updatedAt: Date.now()
         });

         // Sync datasets (this might be heavy, so we only save metadata and columns/sampleData)
         for (const ds of datasets) {
           await setDoc(doc(db, `users/${user.uid}/datasets`, ds.id), {
             userId: user.uid,
             name: ds.name,
             columns: ds.columns || [],
             data: ds.data || [], // Sample data
             size: ds.rowCount || 0,
             lastModified: Date.now()
           }, { merge: true });
         }

       } catch (err) {
         console.error("Save failed:", err);
       }
    };

    // Debounce save
    const timeout = setTimeout(saveToFirestore, 2000);
    return () => clearTimeout(timeout);
  }, [tiles, datasets, user, initialSyncDone]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-blue-600 text-white text-3xl font-bold font-mono">
        <div className="flex flex-col items-center">
          <div className="animate-spin text-white mb-4">
            <Sparkles className="w-16 h-16" />
          </div>
          <div>REACT IS LOADING AND RUNNING...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster />
      </>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900 dark:bg-[#0A0A0B] dark:text-slate-300 font-sans antialiased select-none">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Topbar />
          {currentView === "workspace" || currentView === "datasets" ? (
            <DataWorkspace />
          ) : currentView === "admin" ? (
            <AdminPanel />
          ) : currentView === "ai_insights" ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 dark:bg-[#0A0A0B]">
               <div className="max-w-md w-full text-center space-y-4">
                 <div className="w-16 h-16 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                   <Sparkles className="w-8 h-8 text-white" />
                 </div>
                 <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">AI Insights</h2>
                 <p className="text-slate-500 dark:text-slate-400">
                   Select a dataset and ask AI to analyze it. The AI will discover trends, anomalies, and generate actionable insights automatically.
                 </p>
                 <div className="pt-4 text-sm font-medium text-slate-400">
                   (Coming soon...)
                 </div>
               </div>
            </div>
          ) : (
            <>
              <CanvasGrid />
              
              {/* Bottom Page Tabs (Power BI style) */}
              <div className="h-10 bg-slate-100 dark:bg-[#111113] border-t border-slate-200 dark:border-slate-800 flex items-center px-2 flex-shrink-0">
                <div className="flex items-center">
                  <div className="px-4 py-1.5 bg-white dark:bg-[#0A0A0B] border border-slate-200 dark:border-slate-800 border-b-0 rounded-t-sm text-xs font-semibold text-blue-600 dark:text-indigo-400 relative z-10 shadow-sm translate-y-px">
                    Page 1
                  </div>
                  <div className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
                    Page 2
                  </div>
                  <button className="ml-2 w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500">
                    +
                  </button>
                </div>
                
                <div className="ml-auto flex items-center border-l border-slate-300 dark:border-slate-800 pl-4 space-x-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Theme</span>
                  <button 
                    onClick={toggleDarkMode}
                    className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-transparent dark:border-slate-700"
                  >
                    {isDarkMode ? '🌙' : '☀️'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        {(currentView === "dashboard" || currentView === "reports") && <RightPanel />}
        <DataPreviewModal />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
