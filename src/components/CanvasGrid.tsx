import { useCanvasStore } from "../store/canvasStore";
import { CanvasTile } from "./CanvasTile";
import { ResponsiveGridLayout, useContainerWidth } from "react-grid-layout";
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export function CanvasGrid() {
  const { tiles, selectedTileId, selectTile, updateTile, mode } = useCanvasStore();
  const { width, containerRef, mounted } = useContainerWidth();

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
      
      <div className="mx-auto w-full max-w-7xl relative z-10" ref={containerRef}>
        {mounted && (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            width={width}
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
        )}
      </div>

    </div>
  );
}
