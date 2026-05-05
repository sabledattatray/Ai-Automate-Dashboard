import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "./ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { useDatasetStore } from "../store/datasetStore";
import { MoreVertical, Trash2, Edit2, Columns, Settings2, Table as TableIcon, Filter, Plus, FileType2, Variable, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function DataPreviewModal() {
  const { viewingDatasetId, setViewingDatasetId, datasets, updateDataset } = useDatasetStore();
  const dataset = datasets.find((d) => d.id === viewingDatasetId);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState("");
  
  // Custom column state
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [customColName, setCustomColName] = useState("");
  const [customColFormula, setCustomColFormula] = useState("");
  const [editingCell, setEditingCell] = useState<{rowIndex: number, col: string} | null>(null);

  const handleUpdateCell = (rowIndex: number, col: string, newVal: string) => {
    const newData = [...dataset.data];
    // if newVal is empty, maybe keep it empty string or convert to whatever type was before (skip type cast for now)
    newData[rowIndex] = { ...newData[rowIndex], [col]: newVal === "" ? null : newVal };
    updateDataset(dataset.id, { data: newData });
    setEditingCell(null);
  };

  if (!dataset) return null;

  const handleRenameColumn = (oldName: string) => {
    if (!newColumnName || newColumnName === oldName || dataset.columns.includes(newColumnName)) {
      setEditingColumn(null);
      return;
    }

    const newColumns = dataset.columns.map(c => c === oldName ? newColumnName : c);
    const newData = dataset.data.map(row => {
      const newRow = { ...row };
      newRow[newColumnName] = newRow[oldName];
      delete newRow[oldName];
      return newRow;
    });

    updateDataset(dataset.id, { columns: newColumns, data: newData });
    setEditingColumn(null);
    toast.success(`Column "${oldName}" renamed to "${newColumnName}".`);
  };

  const handleDeleteColumn = (colToRemove: string) => {
    const newColumns = dataset.columns.filter(c => c !== colToRemove);
    const newData = dataset.data.map(row => {
      const newRow = { ...row };
      delete newRow[colToRemove];
      return newRow;
    });
    updateDataset(dataset.id, { columns: newColumns, data: newData });
    toast.success(`Column "${colToRemove}" has been deleted.`);
  };

  const handleDeleteRow = (index: number) => {
    const newData = [...dataset.data];
    newData.splice(index, 1);
    updateDataset(dataset.id, { data: newData });
    toast.success('Row deleted.');
  };

  const handleCleanData = () => {
    const beforeCount = dataset.data.length;
    const newData = dataset.data.filter(row => {
      return Object.values(row).every(v => v !== null && v !== undefined && v !== "");
    });
    updateDataset(dataset.id, { data: newData });
    toast.success(`Cleaned data: removed ${beforeCount - newData.length} rows with empty values.`);
  };

  const handleChangeType = (col: string, type: 'string' | 'number' | 'boolean') => {
    const newData = dataset.data.map(row => {
      const newRow = { ...row };
      const val = newRow[col];
      if (val === null || val === undefined) return newRow;
      
      try {
        if (type === 'number') {
          newRow[col] = Number(val);
        } else if (type === 'string') {
          newRow[col] = String(val);
        } else if (type === 'boolean') {
          newRow[col] = Boolean(val);
        }
      } catch (e) {
        // Leave as is if fail
      }
      return newRow;
    });
    updateDataset(dataset.id, { data: newData });
    toast.success(`Column "${col}" converted to ${type}.`);
  };

  const handleAddCustomColumn = () => {
    if (!customColName) {
      toast.error("Column name is required");
      return;
    }
    if (dataset.columns.includes(customColName)) {
      toast.error("Column already exists");
      return;
    }
    
    try {
      // Safe-ish eval for playground
      const formulaFn = new Function('row', `return ${customColFormula}`);
      
      const newData = dataset.data.map(row => {
        const newRow = { ...row };
        try {
          newRow[customColName] = formulaFn(row);
        } catch (e) {
          newRow[customColName] = null;
        }
        return newRow;
      });
      
      updateDataset(dataset.id, { 
        columns: [...dataset.columns, customColName],
        data: newData 
      });
      
      setCustomColName("");
      setCustomColFormula("");
      setIsAddingColumn(false);
      toast.success(`Added custom column "${customColName}"`);
    } catch (e: any) {
      toast.error(`Invalid formula: ${e.message}`);
    }
  };

  return (
    <Dialog open={!!viewingDatasetId} onOpenChange={(open) => !open && setViewingDatasetId(null)}>
      <DialogContent className="fixed top-0 left-0 translate-x-0 translate-y-0 w-screen h-screen max-w-none sm:max-w-none rounded-none shadow-none border-none p-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#0a0a0a]">
        <DialogHeader className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] flex-shrink-0 shadow-sm relative z-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md">
                <TableIcon className="w-5 h-5" />
              </div>
              Power Query: {dataset.name}
            </DialogTitle>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400 whitespace-nowrap">
                {dataset.data.length} rows, {dataset.columns.length} columns
              </span>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
              
              <Popover open={isAddingColumn} onOpenChange={setIsAddingColumn}>
                <PopoverTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900/50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 h-8 px-3 gap-1.5 text-xs font-medium whitespace-nowrap cursor-pointer">
                    <Variable className="w-3.5 h-3.5" /> Custom Logic
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Add Custom Column</h4>
                      <p className="text-xs text-slate-500">Calculate new values based on existing columns.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="colName" className="text-xs">Column Name</Label>
                      <Input id="colName" value={customColName} onChange={e => setCustomColName(e.target.value)} placeholder="e.g. TotalProfit" className="h-8 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="formula" className="text-xs flex justify-between">
                        <span>Formula</span>
                        <span className="text-[10px] text-slate-400 font-mono">JS Evaluated</span>
                      </Label>
                      <Input id="formula" value={customColFormula} onChange={e => setCustomColFormula(e.target.value)} placeholder="row.sales - row.cost" className="h-8 text-sm font-mono" />
                      <p className="text-[10px] text-slate-500">Use `row.columnName` to access row values.</p>
                    </div>
                    <Button size="sm" className="w-full" onClick={handleAddCustomColumn}>Add Column</Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-medium whitespace-nowrap" onClick={handleCleanData}>
                <Filter className="w-3.5 h-3.5" /> Clean Nulls
              </Button>
              <Button size="sm" variant="default" className="h-8 gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 whitespace-nowrap" onClick={() => {toast.success("Dataset saved and activated."); setViewingDatasetId(null);}}>
                Done <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 relative">
          <div className="min-w-[800px] border-b border-r border-slate-200 dark:border-slate-800 h-full inline-block min-w-full align-top bg-white dark:bg-[#0a0a0a]">
            <Table>
              <TableHeader className="bg-slate-100/80 dark:bg-slate-900/80 sticky top-0 z-10 shadow-sm backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16 sticky left-0 z-20 bg-slate-100/90 dark:bg-slate-900/90 text-center font-bold text-slate-400 text-xs uppercase tracking-wider py-3 border-r border-slate-200 dark:border-slate-800 backdrop-blur-md">#</TableHead>
                  {dataset.columns.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap font-medium text-slate-700 dark:text-slate-200 py-2 px-3 border-r border-slate-200/50 dark:border-slate-800/50 last:border-r-0 min-w-[150px]">
                      <div className="flex items-center justify-between gap-3 group">
                        {editingColumn === col ? (
                          <Input
                            autoFocus
                            className="h-7 text-xs px-2 py-0 w-full min-w-[100px] font-semibold border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500 rounded bg-white dark:bg-black"
                            defaultValue={col}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            onBlur={() => handleRenameColumn(col)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameColumn(col);
                              if (e.key === 'Escape') setEditingColumn(null);
                            }}
                          />
                        ) : (
                          <span className="font-semibold text-sm truncate flex-1" title={col}>{col}</span>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-6 w-6 opacity-40 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800 rounded bg-transparent shrink-0 cursor-pointer">
                              <Settings2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => {
                              setEditingColumn(col);
                              setNewColumnName(col);
                            }} className="cursor-pointer text-sm">
                              <Edit2 className="w-4 h-4 mr-2 text-slate-500" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="text-sm">
                                <FileType2 className="w-4 h-4 mr-2 text-slate-500" /> Convert Type
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleChangeType(col, 'string')}>To String</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeType(col, 'number')}>To Number</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleChangeType(col, 'boolean')}>To Boolean</DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem className="text-red-600 cursor-pointer text-sm font-medium focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/40" onClick={() => handleDeleteColumn(col)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Drop Column
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="w-12 bg-transparent"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataset.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={dataset.columns.length + 2} className="h-48 text-center text-slate-500">
                      No data available.
                    </TableCell>
                  </TableRow>
                ) : (
                  dataset.data.slice(0, 100).map((row, idx) => (
                    <TableRow key={idx} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-100 dark:border-slate-800/60">
                      <TableCell className="sticky left-0 bg-white dark:bg-[#0a0a0a] group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 text-center text-xs font-medium text-slate-400 py-2.5 z-10 transition-colors">{idx + 1}</TableCell>
                      {dataset.columns.map((col) => {
                        const val = row[col];
                        const isNull = val === null || val === undefined;
                        const isNum = typeof val === 'number';
                        const isEditing = editingCell?.rowIndex === idx && editingCell?.col === col;
                        return (
                          <TableCell 
                            key={col} 
                            className={`whitespace-nowrap tabular-nums py-2.5 px-3 text-sm max-w-[300px] truncate border-r border-slate-100 dark:border-slate-800/50 last:border-r-0 ${isNum ? 'text-blue-600 dark:text-blue-400 text-right' : 'text-slate-600 dark:text-slate-400'}`} 
                            title={String(val)}
                            onDoubleClick={() => setEditingCell({ rowIndex: idx, col })}
                          >
                            {isEditing ? (
                              <Input
                                autoFocus
                                className="h-6 text-xs px-1 py-0 border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-500 rounded bg-white dark:bg-black min-w-[60px]"
                                defaultValue={String(val || "")}
                                onBlur={(e) => handleUpdateCell(idx, col, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateCell(idx, col, e.currentTarget.value);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                              />
                            ) : !isNull ? String(val) : (
                              <span className="text-slate-300 dark:text-slate-600 italic font-medium">null</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center py-1 px-1 bg-white dark:bg-[#0a0a0a] group-hover:bg-slate-50/80 dark:group-hover:bg-slate-800/40">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          onClick={() => handleDeleteRow(idx)}
                          title="Drop Row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {dataset.data.length > 100 && (
              <div className="p-4 text-center text-sm font-medium border-t border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50 dark:bg-slate-900">
                Displaying first 100 of {dataset.data.length.toLocaleString()} rows
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


