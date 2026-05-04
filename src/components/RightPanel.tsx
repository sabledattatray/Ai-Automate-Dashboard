import { useCanvasStore } from "../store/canvasStore";
import { useDatasetStore } from "../store/datasetStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Database, Palette, Settings2, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { generateTileInsight } from "../lib/aiService";
import { toast } from "sonner";

export function RightPanel() {
  const { selectedTileId, tiles, updateTile, removeTile } = useCanvasStore();
  const { datasets, activeDatasetId } = useDatasetStore();
  const selectedTile = tiles.find(t => t.id === selectedTileId);
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  if (!selectedTile) {
    const activeDataset = datasets.find(d => d.id === activeDatasetId) || datasets[0];
    
    return (
      <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] flex flex-col h-full flex-shrink-0">
        <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 bg-slate-50 dark:bg-slate-900">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Data Fields</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeDataset ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-md">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="truncate">{activeDataset.name}</span>
              </div>
              <div className="space-y-1">
                {activeDataset.columns.map(col => (
                  <div 
                    key={col} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({ field: col, datasetId: activeDataset.id }));
                    }}
                    className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md cursor-grab active:cursor-grabbing border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
                  >
                    <div className="w-4 h-4 flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-sm text-[10px] font-bold text-slate-500">
                      {typeof activeDataset.data[0]?.[col] === 'number' ? '123' : 'Abc'}
                    </div>
                    <span className="truncate flex-1" title={col}>{col}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
              <Database className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <p className="text-sm text-center px-4">Select a tile to edit properties or add a dataset to see fields.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleGenerateInsight = async () => {
    setIsLoadingInsight(true);
    setInsight(null);
    const result = await generateTileInsight(selectedTile.title, selectedTile.type, "Q1 data showing a 15% upward trend across the board, mainly driven by desktop users in March.");
    setInsight(result || "Could not generate insight.");
    setIsLoadingInsight(false);
  };

  const handleRunQuery = () => {
    if (!selectedTile.datasetId) {
      toast.error("Please select a dataset first.");
      return;
    }
    toast.promise(new Promise(resolve => setTimeout(resolve, 800)), {
      loading: 'Running query...',
      success: 'Query complete! Chart updated.',
      error: 'Query failed'
    });
  };

  const selectedDataset = datasets.find(d => d.id === selectedTile.datasetId);
  const columns = selectedDataset?.columns || [];

  return (
    <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] flex flex-col h-full flex-shrink-0">
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between bg-slate-50 dark:bg-slate-900">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Properties</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" onClick={() => removeTile(selectedTile.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="visual" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b border-slate-200 dark:border-slate-800 bg-transparent h-auto flex-wrap p-0">
          <TabsTrigger value="data" className="flex-1 min-w-fit px-3 py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none shadow-none bg-transparent">
            <Database className="w-3.5 h-3.5 mr-1.5" /> Data
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex-1 min-w-fit px-3 py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none shadow-none bg-transparent">
            <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Visual
          </TabsTrigger>
          <TabsTrigger value="format" className="flex-1 min-w-fit px-3 py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none shadow-none bg-transparent">
            <Palette className="w-3.5 h-3.5 mr-1.5" /> Format
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1 min-w-fit px-3 py-2.5 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none shadow-none bg-transparent text-indigo-500 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto p-4 min-h-0 custom-scrollbar">
          <TabsContent value="data" className="mt-0 space-y-4 flex flex-col h-full min-h-0">
            <div className="space-y-4 flex-shrink-0">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase">Dataset</Label>
                <Select 
                  value={selectedTile.datasetId || ""} 
                  onValueChange={(val: string) => updateTile(selectedTile.id, { datasetId: val, xAxis: undefined, yAxis: undefined })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map(d => (
                       <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                    {datasets.length === 0 && (
                      <div className="px-2 py-1 text-sm text-slate-500">No datasets available. Please upload a CSV.</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTile.type !== 'KPI_CARD' && (
                <div 
                  className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md border border-slate-100 dark:border-slate-800"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50/50', 'dark:bg-blue-900/20'); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/50', 'dark:bg-blue-900/20'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/50', 'dark:bg-blue-900/20');
                    try {
                      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                      const field = data.field;
                      const datasetId = data.datasetId;
                      if (field && datasetId && selectedTile.datasetId === datasetId) {
                        updateTile(selectedTile.id, { xAxis: field });
                      } else if (field && (!selectedTile.datasetId || datasetId)) {
                        updateTile(selectedTile.id, { datasetId: datasetId, xAxis: field });
                      }
                    } catch(err) {}
                  }}
                >
                  <Label className="text-xs font-medium text-slate-500 uppercase">X-Axis (Dimension)</Label>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={selectedTile.xAxis || ""} 
                      onValueChange={(val: string) => updateTile(selectedTile.id, { xAxis: val })}
                      disabled={!selectedDataset}
                    >
                      <SelectTrigger className="h-8 text-sm flex-1">
                        <SelectValue placeholder="Select or drag field" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div 
                className="space-y-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-md border border-slate-100 dark:border-slate-800"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-400', 'bg-blue-50/50', 'dark:bg-blue-900/20'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/50', 'dark:bg-blue-900/20'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/50', 'dark:bg-blue-900/20');
                  try {
                    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const field = data.field;
                    const datasetId = data.datasetId;
                    if (field && datasetId && selectedTile.datasetId === datasetId) {
                      updateTile(selectedTile.id, { yAxis: field });
                    } else if (field && (!selectedTile.datasetId || datasetId)) {
                      updateTile(selectedTile.id, { datasetId: datasetId, yAxis: field });
                    }
                  } catch(err) {}
                }}
              >
                <Label className="text-xs font-medium text-slate-500 uppercase">Y-Axis (Measure) / KPI Metric</Label>
                <Select 
                  value={selectedTile.yAxis || ""} 
                  onValueChange={(val: string) => updateTile(selectedTile.id, { yAxis: val })}
                  disabled={!selectedDataset}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select or drag field" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map(col => (
                      <SelectItem key={col} value={col}>{col}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTile.yAxis && (
                  <div className="pt-2">
                    <Label className="text-[10px] font-medium text-slate-400 uppercase mb-1 block">Aggregation</Label>
                    <Select 
                      value={selectedTile.aggregation || "sum"} 
                      onValueChange={(val: any) => updateTile(selectedTile.id, { aggregation: val })}
                    >
                      <SelectTrigger className="h-7 text-xs bg-white dark:bg-[#0a0a0a]">
                        <SelectValue placeholder="Select aggregation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sum">Sum</SelectItem>
                        <SelectItem value="count">Count</SelectItem>
                        <SelectItem value="avg">Average</SelectItem>
                        <SelectItem value="max">Maximum</SelectItem>
                        <SelectItem value="min">Minimum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <Button className="w-full h-8 mt-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm text-sm font-medium" onClick={handleRunQuery}>Run Query</Button>
            </div>
            
            {/* Added Fields section within the Data tab */}
            <div className="flex-1 mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col min-h-[200px]">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Available Fields</h4>
              <div className="flex-1 overflow-y-auto pr-1 space-y-1">
                {selectedDataset ? selectedDataset.columns.map(col => (
                  <div 
                    key={col} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', JSON.stringify({ field: col, datasetId: selectedDataset?.id }));
                    }}
                    className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md cursor-grab active:cursor-grabbing border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-colors bg-white dark:bg-[#0a0a0a] shadow-sm"
                  >
                    <div className="w-4 h-4 flex items-center justify-center bg-slate-200 dark:bg-slate-800 rounded-sm text-[10px] font-bold text-slate-500">
                      {typeof selectedDataset.data[0]?.[col] === 'number' ? '123' : 'Abc'}
                    </div>
                    <span className="truncate flex-1" title={col}>{col}</span>
                  </div>
                )) : (
                  <div className="text-xs text-slate-500 text-center py-4">Select a dataset to see fields</div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="visual" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase">Title</Label>
              <Input 
                className="h-8 text-sm placeholder:text-slate-400" 
                value={selectedTile.title} 
                onChange={(e) => updateTile(selectedTile.id, { title: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-500 uppercase">Chart Type</Label>
              <Select 
                value={selectedTile.type} 
                onValueChange={(val: any) => updateTile(selectedTile.id, { type: val })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAR_CHART">Bar Chart</SelectItem>
                  <SelectItem value="LINE_CHART">Line Chart</SelectItem>
                  <SelectItem value="PIE_CHART">Pie Chart</SelectItem>
                  <SelectItem value="KPI_CARD">KPI Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedTile.type === 'KPI_CARD' && (
              <>
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Label className="text-xs font-medium text-slate-500 uppercase">Prefix (e.g. $)</Label>
                  <Input 
                    placeholder="$"
                    value={selectedTile.prefix || ''} 
                    onChange={(e) => updateTile(selectedTile.id, { prefix: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase">Suffix (e.g. %)</Label>
                  <Input 
                    placeholder="%"
                    value={selectedTile.suffix || ''} 
                    onChange={(e) => updateTile(selectedTile.id, { suffix: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-500 uppercase">Decimals</Label>
                  <Select 
                    value={selectedTile.decimals?.toString() || "auto"} 
                    onValueChange={(val: string) => updateTile(selectedTile.id, { decimals: val === "auto" ? undefined : parseInt(val) })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="format" className="mt-0 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase">Card Title</Label>
                <Input 
                  placeholder="Leave empty for default"
                  value={selectedTile.title || ''} 
                  onChange={(e) => updateTile(selectedTile.id, { title: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase">Background Color</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="color"
                    value={selectedTile.backgroundColor || '#ffffff'} 
                    onChange={(e) => updateTile(selectedTile.id, { backgroundColor: e.target.value })}
                    className="h-8 w-12 p-1 cursor-pointer"
                  />
                  <Input 
                    placeholder="e.g. #ffffff or transparent"
                    value={selectedTile.backgroundColor || ''} 
                    onChange={(e) => updateTile(selectedTile.id, { backgroundColor: e.target.value })}
                    className="h-8 text-sm flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase flex justify-between">
                  <span>Transparency</span>
                  <span>{selectedTile.backgroundTransparency || 0}%</span>
                </Label>
                <input 
                  type="range" min="0" max="100" 
                  value={selectedTile.backgroundTransparency || 0}
                  onChange={(e) => updateTile(selectedTile.id, { backgroundTransparency: parseInt(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Label className="text-xs font-medium text-slate-500 uppercase">Show Border</Label>
                <input 
                  type="checkbox" 
                  checked={selectedTile.showBorder !== false}
                  onChange={(e) => updateTile(selectedTile.id, { showBorder: e.target.checked })}
                  className="rounded text-blue-600"
                />
              </div>
              {selectedTile.showBorder !== false && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500 uppercase">Border Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color"
                        value={selectedTile.borderColor || '#e2e8f0'} 
                        onChange={(e) => updateTile(selectedTile.id, { borderColor: e.target.value })}
                        className="h-8 w-12 p-1 cursor-pointer"
                      />
                      <Input 
                        placeholder="e.g. #e2e8f0"
                        value={selectedTile.borderColor || ''} 
                        onChange={(e) => updateTile(selectedTile.id, { borderColor: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500 uppercase flex justify-between">
                      <span>Border Width</span>
                      <span>{selectedTile.borderWidth || 1}px</span>
                    </Label>
                    <input 
                      type="range" min="1" max="10" 
                      value={selectedTile.borderWidth || 1}
                      onChange={(e) => updateTile(selectedTile.id, { borderWidth: parseInt(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-500 uppercase flex justify-between">
                  <span>Border Radius (Corner Rounding)</span>
                  <span>{selectedTile.borderRadius ?? 8}px</span>
                </Label>
                <input 
                  type="range" min="0" max="40" 
                  value={selectedTile.borderRadius ?? 8}
                  onChange={(e) => updateTile(selectedTile.id, { borderRadius: parseInt(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              {selectedTile.type === 'KPI_CARD' && (
                <>
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Label className="text-xs font-medium text-slate-500 uppercase">Title Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color"
                        value={selectedTile.titleColor || '#64748b'} 
                        onChange={(e) => updateTile(selectedTile.id, { titleColor: e.target.value })}
                        className="h-8 w-12 p-1 cursor-pointer"
                      />
                      <Input 
                        placeholder="#64748b"
                        value={selectedTile.titleColor || ''} 
                        onChange={(e) => updateTile(selectedTile.id, { titleColor: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500 uppercase">Value Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color"
                        value={selectedTile.valueColor || '#1e293b'} 
                        onChange={(e) => updateTile(selectedTile.id, { valueColor: e.target.value })}
                        className="h-8 w-12 p-1 cursor-pointer"
                      />
                      <Input 
                        placeholder="#1e293b"
                        value={selectedTile.valueColor || ''} 
                        onChange={(e) => updateTile(selectedTile.id, { valueColor: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-500 uppercase">Subtext Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="color"
                        value={selectedTile.labelColor || '#64748b'} 
                        onChange={(e) => updateTile(selectedTile.id, { labelColor: e.target.value })}
                        className="h-8 w-12 p-1 cursor-pointer"
                      />
                      <Input 
                        placeholder="#64748b"
                        value={selectedTile.labelColor || ''} 
                        onChange={(e) => updateTile(selectedTile.id, { labelColor: e.target.value })}
                        className="h-8 text-sm flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Label className="text-xs font-medium text-slate-500 uppercase">Custom Subtext</Label>
                    <Input 
                      placeholder="e.g. Total users"
                      value={selectedTile.customLabel || ''} 
                      onChange={(e) => updateTile(selectedTile.id, { customLabel: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="mt-0 space-y-4">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-xl shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900 rounded-md text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">AI Insights</h4>
              </div>
              
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Generate intelligent analysis for <strong className="font-medium text-slate-800 dark:text-slate-200">"{selectedTile.title}"</strong> based on current dataset.
              </p>
              
              {!insight ? (
                <Button 
                  onClick={handleGenerateInsight} 
                  disabled={isLoadingInsight}
                  className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 shadow-md transition-all font-medium text-sm gap-2"
                >
                  {isLoadingInsight ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing data...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate Insight</>
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/50 shadow-sm relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-lg"></div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{insight}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateInsight} 
                    disabled={isLoadingInsight}
                    className="w-full h-8 text-xs font-medium border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                  >
                    {isLoadingInsight ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                    Regenerate
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

