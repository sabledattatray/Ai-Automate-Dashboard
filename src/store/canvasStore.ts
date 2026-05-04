import { create } from "zustand";

export type TileType = "BAR_CHART" | "LINE_CHART" | "PIE_CHART" | "KPI_CARD" | "TEXT" | "AREA_CHART" | "TABLE" | "MAP" | "GAUGE" | "FUNNEL" | "TREEMAP" | "SANKEY" | "HEATMAP" | "SCATTER" | "RADAR" | "IMAGE";

export interface TileConfig {
  id: string;
  type: TileType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  datasetId?: string;
  xAxis?: string;
  yAxis?: string;
  aggregation?: "sum" | "count" | "max" | "min" | "avg";
  prefix?: string;
  suffix?: string;
  decimals?: number;
  backgroundColor?: string;
  backgroundTransparency?: number;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  showBorder?: boolean;
  titleColor?: string;
  valueColor?: string;
  labelColor?: string;
  customLabel?: string;
}

interface CanvasState {
  tiles: TileConfig[];
  selectedTileId: string | null;
  mode: "view" | "edit" | "presentation";
  currentView: "dashboard" | "reports" | "datasets" | "workspace" | "ai_insights" | "admin";
  addTile: (type: TileType, w: number, h: number) => void;
  removeTile: (id: string) => void;
  updateTile: (id: string, updates: Partial<TileConfig>) => void;
  selectTile: (id: string | null) => void;
  setTiles: (tiles: TileConfig[]) => void;
  setMode: (mode: "view" | "edit" | "presentation") => void;
  setCurrentView: (view: "dashboard" | "reports" | "datasets" | "workspace" | "ai_insights" | "admin") => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  tiles: [],
  selectedTileId: null,
  mode: "edit",
  currentView: "workspace",
  addTile: (type, w, h) =>
    set((state) => ({
      tiles: [
        ...state.tiles,
        {
          id: Math.random().toString(36).substring(7),
          type,
          title: "New Tile",
          x: 0, // simple placement
          y: state.tiles.length * 2, // simple placement
          w,
          h,
        },
      ],
    })),
  removeTile: (id) =>
    set((state) => ({
      tiles: state.tiles.filter((t) => t.id !== id),
      selectedTileId: state.selectedTileId === id ? null : state.selectedTileId,
    })),
  updateTile: (id, updates) =>
    set((state) => ({
      tiles: state.tiles.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  setTiles: (tiles) => set({ tiles }),
  selectTile: (id) => set({ selectedTileId: id }),
  setMode: (mode) => set({ mode }),
  setCurrentView: (view) => set({ currentView: view }),
}));
