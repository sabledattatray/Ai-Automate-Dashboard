import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, LabelList, AreaChart, Area, ScatterChart, Scatter, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Treemap } from "recharts";
import { TileConfig, useCanvasStore } from "../store/canvasStore";
import { useDatasetStore } from "../store/datasetStore";
import { Card, CardContent } from "./ui/card";
import { Edit3, Database, BarChart2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

const mockBarData = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3000 },
  { name: "Mar", sales: 2000 },
  { name: "Apr", sales: 2780 },
  { name: "May", sales: 1890 },
  { name: "Jun", sales: 2390 },
];

const mockLineData = [
  { name: "Jan", users: 400 },
  { name: "Feb", users: 800 },
  { name: "Mar", users: 1200 },
  { name: "Apr", users: 1100 },
  { name: "May", users: 1500 },
  { name: "Jun", users: 2000 },
];

const mockPieData = [
  { name: "Desktop", value: 400 },
  { name: "Mobile", value: 300 },
  { name: "Tablet", value: 300 },
];
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

export function CanvasTile({ tile, isSelected, onSelect }: { tile: TileConfig; isSelected: boolean; onSelect: () => void }) {
  const { datasets } = useDatasetStore();
  const { updateTile } = useCanvasStore();
  const [chartData, setChartData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use useEffect to fetch from the newly added SQL backend
  useEffect(() => {
    if (!tile.datasetId) {
      setChartData(null);
      return;
    }
    if (tile.type !== "KPI_CARD" && !tile.xAxis) {
      setChartData(null);
      return;
    }
    
    // Check if the dataset exists (metadata)
    const dataset = datasets.find(d => d.id === tile.datasetId);
    if (!dataset) return;

    let isMounted = true;
    setIsLoading(true);

    fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableName: typeof dataset.id === "string" && !dataset.id.startsWith("data_") ? `data_${dataset.id}` : dataset.id, // Handle potential old data
        xAxis: tile.xAxis,
        yAxis: tile.yAxis,
        aggregation: tile.aggregation || "sum",
        type: tile.type,
      })
    })
    .then(r => r.json())
    .then((data) => {
      if (isMounted) {
        setChartData(Array.isArray(data) ? data : null);
        setIsLoading(false);
      }
    })
    .catch(err => {
      console.error("Fetch query failed", err);
      if (isMounted) setIsLoading(false);
    });

    return () => { isMounted = false; };
  }, [tile.datasetId, tile.xAxis, tile.yAxis, tile.aggregation, tile.type, datasets]);

  const [dragCounter, setDragCounter] = useState(0);
  const isDragOver = dragCounter > 0;
  
  const renderContent = () => {
    // Determine active data and keys
    const isCustomData = !!chartData;
    const dataToUse = isCustomData ? chartData : null;
    const xKey = "name";
    const yKey = isCustomData ? "value" : undefined;

    switch (tile.type) {
      case "KPI_CARD":
        if (isCustomData) {
          const total = dataToUse.reduce((s: number, curr: any) => s + curr.value, 0);
          const formattedVal = total.toLocaleString(undefined, { 
            minimumFractionDigits: tile.decimals ?? 0, 
            maximumFractionDigits: tile.decimals ?? 2 
          });
          const aggNames: Record<string, string> = { sum: "Sum", avg: "Average", count: "Count", max: "Maximum", min: "Minimum" };
          const aggLabel = aggNames[tile.aggregation || "sum"];
          return (
            <div className="flex flex-col h-full justify-center px-4">
              <h3 
                className="text-4xl font-light font-mono tracking-tight"
                style={{ color: tile.valueColor || 'inherit' }}
              >
                {tile.prefix || ''}{formattedVal}{tile.suffix || ''}
              </h3>
              <p 
                className="text-sm mt-2 flex items-center"
                style={{ color: tile.labelColor || '#64748b' }}
              >
                {tile.customLabel || `${aggLabel} of ${tile.yAxis}`}
              </p>
            </div>
          );
        }
        return (
          <div className="flex flex-col h-full justify-center px-4">
            <h3 
              className="text-4xl font-light font-mono tracking-tight"
              style={{ color: tile.valueColor || 'inherit' }}
            >
              {tile.prefix || ''}{(42500).toLocaleString(undefined, {
                minimumFractionDigits: tile.decimals ?? 0,
                maximumFractionDigits: tile.decimals ?? 2
              })}{tile.suffix || ''}
            </h3>
            <p 
              className="text-sm mt-2 flex items-center"
              style={{ color: tile.labelColor || '#16a34a' }}
            >
              <span className="mr-1">↑</span> {tile.customLabel || '12.5% vs last month'}
            </p>
          </div>
        );
      case "BAR_CHART":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataToUse || mockBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => {
                 if(val > 1000) return (val/1000).toFixed(1) + 'k';
                 return val;
              }} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey={yKey || "sales"} fill="#3b82f6" radius={[4, 4, 0, 0]}>
                <LabelList dataKey={yKey || "sales"} position="top" style={{ fontSize: '10px', fill: '#64748b' }} formatter={(val: any) => {
                  if(typeof val === 'number' && val > 1000) return (val/1000).toFixed(1) + 'k';
                  return val;
                }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "LINE_CHART":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataToUse || mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => {
                 if(val > 1000) return (val/1000).toFixed(1) + 'k';
                 return val;
              }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey={yKey || "users"} stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }}>
                <LabelList dataKey={yKey || "users"} position="top" style={{ fontSize: '10px', fill: '#64748b' }} formatter={(val: any) => {
                  if(typeof val === 'number' && val > 1000) return (val/1000).toFixed(1) + 'k';
                  return val;
                }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        );
      case "AREA_CHART":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataToUse || mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => {
                 if(val > 1000) return (val/1000).toFixed(1) + 'k';
                 return val;
              }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey={yKey || "users"} stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "PIE_CHART":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={dataToUse || mockPieData} 
                innerRadius={60} 
                outerRadius={80} 
                fill="#8884d8" 
                paddingAngle={5} 
                dataKey={yKey || "value"} 
                nameKey={xKey}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
                style={{ fontSize: '11px', fill: '#64748b' }}
              >
                {(dataToUse || mockPieData).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case "SCATTER":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid />
              <XAxis dataKey={xKey} />
              <YAxis dataKey={yKey || "value"} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Data" data={dataToUse || mockBarData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case "RADAR":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dataToUse || mockBarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey={xKey} />
              <PolarRadiusAxis />
              <Radar name="Data" dataKey={yKey || "value"} stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      case "TREEMAP":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={dataToUse || mockPieData}
              dataKey={yKey || "value"}
              stroke="#fff"
              fill="#8884d8"
            />
          </ResponsiveContainer>
        );
      case "TABLE":
        return (
          <div className="w-full h-full overflow-auto p-4 custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 dark:text-slate-400 sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-medium">{xKey}</th>
                  <th className="px-4 py-2 font-medium">{yKey || "value"}</th>
                </tr>
              </thead>
              <tbody>
                {(dataToUse || mockBarData).map((row: any, i: number) => (
                  <tr key={i} className="border-b dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2">{row[xKey] || row.name}</td>
                    <td className="px-4 py-2 font-medium">{row[yKey || "sales"] || row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "FUNNEL":
        // Fallback to a sorted bar chart for funnel
        const sortedData = [...(dataToUse || mockBarData)].sort((a, b) => (b[yKey || "value"] || 0) - (a[yKey || "value"] || 0));
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={sortedData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis dataKey={xKey} type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: 'transparent' }} />
              <Bar dataKey={yKey || "value"} fill="#f97316" radius={[0, 4, 4, 0]}>
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case "GAUGE":
        // Fallback to half-pie
        const gaugeValue = (dataToUse || mockPieData)[0]?.[yKey || "value"] || 50;
        const total = 100;
        const gaugeData = [
          { name: "Value", value: gaugeValue },
          { name: "Empty", value: Math.max(total - gaugeValue, 0) }
        ];
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="70%"
                startAngle={180}
                endAngle={0}
                innerRadius="60%"
                outerRadius="80%"
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#f43f5e" />
                <Cell fill="#f1f5f9" />
              </Pie>
              <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-slate-700 dark:fill-slate-200">
                {gaugeValue}
              </text>
            </PieChart>
          </ResponsiveContainer>
        );
      case "MAP":
      case "HEATMAP":
      case "SANKEY":
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl opacity-50">?</span>
            </div>
            <p className="font-medium text-sm text-slate-500 mb-1">{tile.type.replace('_', ' ')} Visualization</p>
            <p className="text-xs">This chart type requires advanced rendering capabilities. Using standard charting as fallback.</p>
          </div>
        );
      case "IMAGE":
        return (
           <div className="w-full h-full p-2 flex items-center justify-center bg-slate-50 dark:bg-slate-900 overflow-hidden">
             <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop" alt="Placeholder" className="max-w-full max-h-full object-contain rounded opacity-50 sepia" />
           </div>
        );
      case "TEXT":
        return (
          <div className="flex flex-col h-full px-4 overflow-auto prose dark:prose-invert prose-sm">
            <h3 className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200"><Edit3 className="w-4 h-4"/> Executive Summary</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Q1 revenue exceeded projections by <strong>12.5%</strong>. 
              The new product line launch in February led to a significant spike in 
              new user acquisition across all target demographics.
            </p>
          </div>
        );
      default:
        return <div className="p-4 text-slate-500 flex items-center justify-center h-full">Preview not available</div>;
    }
  };

  const isConfigured = !!chartData;

  const getBackgroundColor = () => {
    const color = tile.backgroundColor;
    if (!color) return undefined;
    if (color.startsWith('#') && color.length === 7) {
      const alpha = Math.round((100 - (tile.backgroundTransparency || 0)) / 100 * 255).toString(16).padStart(2, '0');
      return `${color}${alpha}`;
    }
    return color;
  };

  return (
    <Card 
      className={`h-full w-full flex flex-col transition-all cursor-pointer relative overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md ring-offset-1 dark:ring-offset-[#0a0a0a]' : 'hover:shadow-sm shadow-sm'
      } ${!tile.backgroundColor ? 'bg-white dark:bg-[#0a0a0a]' : ''} ${
        !tile.borderColor && tile.showBorder !== false && !isSelected ? 'border-slate-200 dark:border-slate-800' : ''
      }`}
      style={{
        backgroundColor: getBackgroundColor(),
        borderWidth: tile.showBorder !== false ? `${tile.borderWidth || 1}px` : '0px',
        borderStyle: tile.showBorder !== false ? 'solid' : 'none',
        borderColor: tile.showBorder !== false ? (tile.borderColor || (isSelected ? '#3b82f6' : undefined)) : undefined,
        borderRadius: `${tile.borderRadius ?? 8}px`,
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDragEnter={(e) => {
        if (tile.type !== "TEXT") {
          e.preventDefault();
          setDragCounter(prev => prev + 1);
        }
      }}
      onDragLeave={(e) => {
        if (tile.type !== "TEXT") {
          e.preventDefault();
          setDragCounter(prev => Math.max(0, prev - 1));
        }
      }}
      onDragOver={(e) => {
        if (tile.type !== "TEXT") {
          e.preventDefault();
        }
      }}
      onDrop={() => setDragCounter(0)}
    >
      <div className="px-4 py-3 flex items-center justify-between transition-colors z-10 relative">
        <div className="flex items-center gap-2">
           <h4 
             className="text-sm font-semibold tracking-tight"
             style={{ color: tile.titleColor || 'inherit' }}
           >
             {tile.title}
           </h4>
           {!isConfigured && tile.type !== "TEXT" && (
             <span className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
               <Database className="w-3 h-3" /> Mock Data
             </span>
           )}
        </div>
        {isSelected && (
          <div className="flex gap-1 opacity-100">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </div>
        )}
      </div>
      <CardContent className="flex-1 p-0 pb-2 relative overflow-hidden">
        {renderContent()}
      </CardContent>

      {/* Drag Overlay */}
      {isDragOver && tile.type !== "TEXT" && (
        <div className="absolute inset-0 z-50 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-sm flex flex-col p-2 space-y-2">
          {tile.type !== "KPI_CARD" && (
            <div 
              className="flex-1 border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-md flex items-center justify-center bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors pointer-events-auto"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragCounter(0);
                try {
                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                  if (data.field && data.datasetId) {
                    updateTile(tile.id, { datasetId: data.datasetId, xAxis: data.field });
                  }
                } catch(err) {}
              }}
            >
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2 pointer-events-none">
                <BarChart2 className="w-4 h-4" /> Drop for X-Axis (Dimension)
              </span>
            </div>
          )}
          <div 
            className="flex-1 border-2 border-dashed border-emerald-400 dark:border-emerald-500 rounded-md flex items-center justify-center bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors pointer-events-auto"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragCounter(0);
              try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (data.field && data.datasetId) {
                  updateTile(tile.id, { datasetId: data.datasetId, yAxis: data.field });
                }
              } catch(err) {}
            }}
          >
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2 pointer-events-none">
              <Database className="w-4 h-4" /> Drop for Y-Axis / Metric
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
