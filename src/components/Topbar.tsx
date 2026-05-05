import { useCanvasStore } from "../store/canvasStore";
import { Button } from "./ui/button";
import { Share2, Download, Eye, Edit2, Play, Sparkles, Filter, Calendar, LogOut } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { toast } from "sonner";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export function Topbar() {
  const { mode, setMode } = useCanvasStore();

  const handleShare = () => toast.success("Share link copied to clipboard");
  const handleExport = () => toast.success("Dashboard exported successfully");
  const handlePresent = () => toast.info("Entering presentation mode...");
  const handleLogout = () => {
    if (auth) {
      signOut(auth);
      toast.success("Successfully logged out");
    }
  };

  return (
    <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0a0a] flex items-center justify-between px-4 flex-shrink-0 z-20 shadow-sm relative">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 ml-2">Q1 Revenue Dashboard</h1>
        <div className="bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Live</div>
      </div>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger render={
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-600 dark:text-slate-400 font-medium mr-2">
              <Filter className="w-3.5 h-3.5" /> Filters
              <span className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] ml-1">2</span>
            </Button>
          } />
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <h4 className="font-medium leading-none mb-3">Page Filters</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Date Range</Label>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-8 text-xs select-none">
                    <Calendar className="mr-2 h-3.5 w-3.5" />
                    Jan 01, 2026 - Mar 31, 2026
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Region</Label>
                  <Select defaultValue="na" onValueChange={() => toast.success("Filter applied")}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      <SelectItem value="na">North America</SelectItem>
                      <SelectItem value="emea">EMEA</SelectItem>
                      <SelectItem value="apac">APAC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Label className="text-xs">Include Internal Users</Label>
                  <Switch id="internal" onCheckedChange={() => toast.success("Filter applied")} />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-md border border-slate-200 dark:border-slate-800 mr-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-3 text-xs font-medium rounded-sm ${mode === 'edit' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            onClick={() => setMode('edit')}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-3 text-xs font-medium rounded-sm ${mode === 'view' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            onClick={() => setMode('view')}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" /> View
          </Button>
        </div>

        <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 dark:border-slate-800 font-medium" onClick={handleShare}>
          <Share2 className="w-3.5 h-3.5" /> Share
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 dark:border-slate-800 font-medium" onClick={handleExport}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>

        <Button size="sm" className="h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium ml-1 shadow-sm shadow-indigo-500/20" onClick={handlePresent}>
          <Play className="w-3.5 h-3.5" /> Present
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" onClick={handleLogout} title="Sign Out">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
