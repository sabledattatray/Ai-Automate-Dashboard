import { Upload, Database, CheckCircle2, RefreshCw, Plus } from "lucide-react";
import { useDatasetStore } from "../store/datasetStore";
import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Button } from "./ui/button";

export function DataWorkspace() {
  const { addDataset, datasets, setViewingDatasetId, setActiveDataset } = useDatasetStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast.error("Format not supported. Please upload a CSV or JSON file.");
      return;
    }

    setUploadProgress(0);
    const toastId = toast.loading(`Uploading ${file.name}... 0%`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
            if (percent < 100) {
              toast.loading(`Uploading ${file.name}... ${percent}%`, { id: toastId });
            } else {
              toast.loading(`Processing ${file.name}... (This may take a while for large files)`, { id: toastId });
            }
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve(res);
            } catch (err) {
              reject(new Error("Failed to parse server response"));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText} (${xhr.status})`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error occurred during upload"));
        });

        xhr.open("POST", "/api/upload", true);
        xhr.send(formData);
      });
      
      const newDataset = {
        id: result.id,
        name: file.name,
        columns: result.columns || [],
        rowCount: result.rowCount || 0,
        data: result.sampleData || [],
      };

      addDataset(newDataset);
      setActiveDataset(newDataset.id);
      toast.success(`Successfully uploaded ${file.name}`, { id: toastId });
    } catch (error: any) {
      toast.error(`Error uploading file: ${error.message}`, { id: toastId });
    } finally {
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex-1 bg-white dark:bg-[#0A0A0B] p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 font-serif">Data Workspace</h1>
            <p className="text-slate-500 dark:text-slate-400">Ingest, explore, and transform your datasets for analysis.</p>
          </div>
          <Button className="bg-slate-900 border-0 hover:bg-slate-800 text-white rounded-full px-6 py-5 text-sm dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 flex items-center shadow-lg font-medium">
            <Plus className="w-5 h-5 mr-2" />
            Connect New Source
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-3xl p-12 transition-all flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/30 ${
                isDragging 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                  : "border-slate-200 dark:border-slate-800"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-6">
                <Upload className={`w-8 h-8 ${isDragging ? "text-blue-500" : "text-slate-400 dark:text-slate-500"} transition-colors`} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 font-serif">Quick Ingest</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">
                Drag and drop your data files. Our ETL engine will automatically clean, transform, and map your schema.
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                className="hidden" 
                accept=".csv,.json"
              />
              <Button 
                variant="outline" 
                className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-full px-8 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
            </div>

            {/* Active Datasets List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 font-serif">Active Datasets</h3>
                <span className="text-sm font-medium text-slate-500">{datasets.length} sources connected</span>
              </div>
              
              {datasets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm italic">
                  No datasets uploaded yet
                </div>
              ) : (
                <div className="space-y-3">
                  {datasets.map((ds) => (
                    <div key={ds.id} className="group flex items-center p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl shadow-sm cursor-pointer transition-colors" onClick={() => setActiveDataset(ds.id)}>
                      <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mr-4">
                        <Database className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{ds.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{ds.columns?.length || 0} columns • {ds.rowCount?.toLocaleString() || ds.data?.length?.toLocaleString() || 0} rows</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setViewingDatasetId(ds.id); }}>
                        View Schema
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm sticky top-0">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center mr-3">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg font-serif">Ingestion Hub</h3>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/80">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Activity</h4>
                
                <div className="space-y-4">
                  {datasets.slice(0, 3).map((ds) => (
                    <div key={ds.id} className="flex items-start">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{ds.name} loaded</p>
                        <p className="text-xs text-slate-400 mt-1">Processed successfully</p>
                      </div>
                    </div>
                  ))}
                  {datasets.length === 0 && (
                    <div className="flex items-start">
                      <RefreshCw className="w-4 h-4 text-blue-500 mr-3 mt-0.5 shrink-0 animate-spin-slow" />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Syncing PostgreSQL...</p>
                        <p className="text-xs text-slate-400 mt-1">Connection established</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
