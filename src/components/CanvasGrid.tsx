import { useCanvasStore } from "../store/canvasStore";
import { CanvasTile } from "./CanvasTile";
import RGL from "react-grid-layout";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Extract with extreme caution for various RGL distributions
const RGLModule: any = (RGL as any).default || RGL || {};
const Responsive = RGLModule.Responsive || (RGL as any).Responsive;
const WidthProvider = RGLModule.WidthProvider || (RGL as any).WidthProvider;

// Create the component safely
const ResponsiveGridLayout = (typeof WidthProvider === 'function' && Responsive) 
  ? WidthProvider(Responsive) 
  : (Responsive || (({ children }: any) => <div className="p-4 bg-red-500/10 text-red-500 rounded border border-red-500/20">Grid System Error: Component Missing</div>));

export function CanvasGrid() {
  const { tiles, selectedTileId, selectTile, updateTile, mode } = useCanvasStore();
  // Using WidthProvider instead of a custom non-existent hook

  const layout = tiles.map(tile => ({
    i: tile.id,
    x: tile.x,
    y: tile.y,
    w: tile.w,
    h: tile.h,
    minW: 2,
    minH: 2
  }));

  const onLayoutChange = (newLayout: any) => {
    newLayout.forEach((l: any) => {
      updateTile(l.i, { x: l.x, y: l.y, w: l.w, h: l.h });
    });
  };

  return (
    <div className="flex-1 h-full w-full bg-[#f4f5f5] dark:bg-[#0A0A0B] overflow-auto p-4 custom-scrollbar relative" onClick={() => selectTile(null)}>
      {/* Subtle grid background pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="mx-auto w-full max-w-7xl relative z-10">
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={80}
          margin={[16, 16]}
          isDraggable={mode === "edit"}
          isResizable={mode === "edit"}
          onLayoutChange={onLayoutChange}
        >
          {tiles.map((tile) => (
            <div key={tile.id}>
              <CanvasTile 
                tile={tile} 
                isSelected={selectedTileId === tile.id} 
                onSelect={() => selectTile(tile.id)} 
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}
