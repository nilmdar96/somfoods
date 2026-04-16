"use client";

import React, { useRef, useCallback, useState } from "react";
import { Stage, Layer, Rect, Line, Text, Group, Image } from "react-konva";
import type Konva from "konva";
import { usePlanogramStore } from "@/store/usePlanogramStore";
import { validatePlacement } from "@/lib/spatialMath";
import { PIXELS_PER_CM } from "@/types";
import type { Product, Placement } from "@/types";
import { RotateCcw, TrendingUp, DollarSign } from "lucide-react";

function useLoadedImage(src: string) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImage(img);
    img.onerror = () => setImage(null);
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return image;
}

// ─── Coordinate helpers ────────────────────────────────────────────────────

function cmToPx(cm: number): number {
  return cm * PIXELS_PER_CM;
}

function pxToCm(px: number): number {
  return px / PIXELS_PER_CM;
}

// ─── Canvas padding / margins ──────────────────────────────────────────────

const CANVAS_PADDING = 60;

// ─── Sub-components ────────────────────────────────────────────────────────

interface ShelfLineProps {
  yOffset: number;
  width: number;
  fixtureHeightPx: number;
  shelfId: string;
  shelfHeight: number;
}

function ShelfLine({ yOffset, width, fixtureHeightPx, shelfId, shelfHeight }: ShelfLineProps) {
  const yPx = fixtureHeightPx - cmToPx(yOffset);

  return (
    <Group>
      {/* Shelf surface line */}
      <Line
        points={[0, yPx, cmToPx(width), yPx]}
        stroke="#64748b"
        strokeWidth={2}
        dash={[6, 3]}
      />
      {/* Shelf label */}
      <Text
        x={cmToPx(width) + 6}
        y={yPx - 8}
        text={shelfId.replace("shelf-", "S")}
        fontSize={11}
        fill="#94a3b8"
        fontFamily="Inter, sans-serif"
      />
      {/* Clearance zone highlight */}
      <Rect
        x={0}
        y={yPx - cmToPx(shelfHeight)}
        width={cmToPx(width)}
        height={cmToPx(shelfHeight)}
        fill="rgba(99,102,241,0.03)"
        listening={false}
      />
    </Group>
  );
}

interface PlacedProductProps {
  placement: Placement;
  product: Product;
  fixtureHeightPx: number;
  onDragEnd: (placementId: string, newXCm: number, newYCm: number) => void;
  onRemove: (placementId: string) => void;
}

function PlacedProduct({
  placement,
  product,
  fixtureHeightPx,
  onDragEnd,
  onRemove,
}: PlacedProductProps) {
  const boxW = cmToPx(product.width);
  const boxH = cmToPx(product.height);
  const totalW = boxW * placement.facings_x;
  const totalH = boxH * placement.facings_y;

  // Canvas coordinates: fixture bottom = fixtureHeightPx, y_position is from bottom
  const xPx = cmToPx(placement.x_position);
  const yPx = fixtureHeightPx - cmToPx(placement.y_position) - totalH;

  const [hovered, setHovered] = useState(false);
  const image = useLoadedImage(product.imageUrl);

  // Generate matrix of facings layout
  const facingNodes = [];
  for (let fx = 0; fx < placement.facings_x; fx++) {
    for (let fy = 0; fy < placement.facings_y; fy++) {
      const offsetX = fx * boxW;
      const offsetY = fy * boxH;
      
      facingNodes.push(
        <Group key={`${fx}-${fy}`} x={offsetX} y={offsetY}>
          {/* Product image or fallback rectangle */}
          {image ? (
            <Image
              image={image}
              width={boxW}
              height={boxH}
              stroke={hovered ? "#818cf8" : "#475569"}
              strokeWidth={hovered ? 2 : 1}
              cornerRadius={2}
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={hovered ? 8 : 3}
              shadowOffsetY={2}
            />
          ) : (
            <Rect
              width={boxW}
              height={boxH}
              fill={product.color}
              stroke={hovered ? "#818cf8" : "#475569"}
              strokeWidth={hovered ? 2 : 1}
              cornerRadius={2}
              shadowColor="rgba(0,0,0,0.3)"
              shadowBlur={hovered ? 8 : 3}
              shadowOffsetY={2}
            />
          )}
          
          {/* Retail POS Price Tag / Barcode */}
          {boxH > 20 && (
            <Group x={1} y={boxH - Math.min(18, boxH * 0.4)}>
              <Rect 
                width={Math.max(1, boxW - 2)} 
                height={Math.min(17, boxH * 0.4 - 1)} 
                fill="#ffffff" 
                cornerRadius={[0, 0, 2, 2]} 
                opacity={0.95} 
              />
              <Text
                x={2}
                y={2}
                width={Math.max(1, boxW - 4)}
                text={product.name.toUpperCase()}
                fontSize={Math.max(6, Math.min(8, boxW * 0.15))}
                fontStyle="bold"
                fill="#0f172a"
                fontFamily="Inter, sans-serif"
                ellipsis
                wrap="none"
                align="center"
              />
              {/* Fake barcode strokes */}
              {boxW > 25 && boxH >= 30 && Array.from({ length: Math.floor((boxW - 6) / 3) }).map((_, i) => (
                <Line
                  key={`bc-${i}`}
                  points={[3 + i * 3, 11, 3 + i * 3, 14]}
                  stroke="#334155"
                  strokeWidth={i % 3 === 0 ? 1.5 : 1}
                  opacity={0.8}
                />
              ))}
            </Group>
          )}
        </Group>
      );
    }
  }

  return (
    <Group
      x={xPx}
      y={yPx}
      draggable
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
        const node = e.target;
        const newXPx = node.x();
        const newYPxTop = node.y();
        // Convert canvas px back to fixture-cm (bottom-up)
        const newYCm = pxToCm(fixtureHeightPx - newYPxTop - totalH);
        const newXCm = pxToCm(newXPx);
        onDragEnd(placement.id, newXCm, newYCm);
      }}
      onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = "grab";
        setHovered(true);
      }}
      onMouseLeave={(e: Konva.KonvaEventObject<MouseEvent>) => {
        const container = e.target.getStage()?.container();
        if (container) container.style.cursor = "default";
        setHovered(false);
      }}
      onDblClick={() => onRemove(placement.id)}
    >
      {facingNodes}
    </Group>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155;
}

// ─── Main Canvas Component ────────────────────────────────────────────────

export default function PlanogramCanvas() {
  const fixture = usePlanogramStore((s) => s.fixture);
  const placements = usePlanogramStore((s) => s.placements);
  const products = usePlanogramStore((s) => s.products);
  const addPlacement = usePlanogramStore((s) => s.addPlacement);
  const updatePlacement = usePlanogramStore((s) => s.updatePlacement);
  const removePlacement = usePlanogramStore((s) => s.removePlacement);
  const resetPlacements = usePlanogramStore((s) => s.resetPlacements);
  const autoOptimize = usePlanogramStore((s) => s.autoOptimize);
  const isOptimizing = usePlanogramStore((s) => s.isOptimizing);

  const stageRef = useRef<Konva.Stage>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [dropPreview, setDropPreview] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
    valid: boolean;
  } | null>(null);

  // Incrementing key to force PlacedProduct remount on revert
  const [revertCounter, setRevertCounter] = useState(0);

  const fixtureWidthPx = cmToPx(fixture.width);
  const fixtureHeightPx = cmToPx(fixture.height);

  const stageWidth = fixtureWidthPx + CANVAS_PADDING * 2 + 40;
  const stageHeight = fixtureHeightPx + CANVAS_PADDING * 2 + 20;

  // ── Toast helper ────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleOptimize = async (strategy: "profit" | "sales") => {
    try {
      await autoOptimize(strategy);
      showToast(`Successfully optimized for ${strategy}`);
    } catch (err: any) {
      showToast(err.message || "Optimization failed");
    }
  };

  // ── Handle drop FROM sidebar (DOM → Konva bridge) ─────────────────────

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDropPreview(null);

      const raw = e.dataTransfer.getData("application/planogram-product");
      if (!raw) return;

      const product: Product = JSON.parse(raw);

      const stage = stageRef.current;
      if (!stage) return;

      const stageBox = stage.container().getBoundingClientRect();
      const xPxRaw = e.clientX - stageBox.left - CANVAS_PADDING;
      const yPxRaw = e.clientY - stageBox.top - CANVAS_PADDING;

      // Convert pixel position to fixture-cm coordinates.
      // Cursor is roughly at product center, so offset by half-width for left edge.
      const xCmCenter = pxToCm(xPxRaw);
      const xCm = Math.max(0, xCmCenter - product.width / 2);

      // Y axis: canvas top-down → fixture bottom-up.
      // Offset by half product height so we measure from product bottom.
      const yCmRaw = pxToCm(fixtureHeightPx - yPxRaw);
      const yCm = Math.max(0, yCmRaw - product.height / 2);

      const result = validatePlacement(
        product,
        xCm,
        yCm,
        fixture,
        placements,
        products
      );

      if (!result.valid) {
        showToast(result.reason);
        return;
      }

      const newPlacement: Placement = {
        id: `pl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        shelfId: result.shelf!.id,
        x_position: result.snappedX,
        y_position: result.snappedY,
        facings_x: 1,
        facings_y: 1,
      };

      addPlacement(newPlacement);
    },
    [fixture, placements, products, addPlacement, fixtureHeightPx, showToast]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";

      const hasProduct = e.dataTransfer.types.includes("application/planogram-product");
      if (!hasProduct) return;

      const stage = stageRef.current;
      if (!stage) return;

      const stageBox = stage.container().getBoundingClientRect();
      const xPx = e.clientX - stageBox.left - CANVAS_PADDING;
      const yPx = e.clientY - stageBox.top - CANVAS_PADDING;

      const xCm = pxToCm(xPx);
      const yCm = pxToCm(fixtureHeightPx - yPx);

      setDropPreview({
        x: xPx,
        y: yPx,
        w: 40,
        h: 80,
        valid: xCm >= 0 && xCm <= fixture.width && yCm >= 0 && yCm <= fixture.height,
      });
    },
    [fixture, fixtureHeightPx]
  );

  const handleDragLeave = useCallback(() => {
    setDropPreview(null);
  }, []);

  // ── Handle re-positioning of already-placed products (Konva drag) ─────

  const handlePlacedProductDragEnd = useCallback(
    (placementId: string, newXCm: number, newYCm: number) => {
      const placement = placements.find((p) => p.id === placementId);
      if (!placement) return;

      const product = products.find((p) => p.id === placement.productId);
      if (!product) return;

      const result = validatePlacement(
        product,
        newXCm,
        newYCm,
        fixture,
        placements,
        products,
        placement.facings_x,
        placement.facings_y,
        placementId
      );

      if (!result.valid) {
        showToast(result.reason);
        // Force remount of PlacedProduct components so Konva nodes
        // reset to the correct position from the store.
        setRevertCounter((c) => c + 1);
        return;
      }

      updatePlacement(placementId, {
        x_position: result.snappedX,
        y_position: result.snappedY,
        shelfId: result.shelf!.id,
      });
    },
    [fixture, placements, products, updatePlacement, showToast]
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.04)_0%,transparent_60%),#0a0e1a]">
      {/* Canvas header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-bold tracking-tight text-slate-50">
            {fixture.name}
          </h1>
          <span className="text-[13px] text-slate-500">
            {fixture.width}×{fixture.height}×{fixture.depth} cm
          </span>
        </div>
        <div className="flex items-center gap-2">
          {placements.length > 0 && (
            <button
              id="reset-placements-btn"
              onClick={resetPlacements}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer transition-all duration-150 hover:bg-slate-700 hover:text-slate-100 hover:border-slate-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <RotateCcw size={13} />
              Reset All
            </button>
          )}
          <button
            id="optimize-sales-btn"
            onClick={() => handleOptimize("sales")}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 cursor-pointer transition-all duration-150 hover:bg-indigo-500/20 hover:text-indigo-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            title="Auto-fill shelves based on sales velocity"
          >
            <TrendingUp size={13} />
            Optimize Sales
          </button>
          <button
            id="optimize-profit-btn"
            onClick={() => handleOptimize("profit")}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 cursor-pointer transition-all duration-150 hover:bg-emerald-500/20 hover:text-emerald-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            title="Auto-fill shelves based on profit margins"
          >
            <DollarSign size={13} />
            Optimize Profit
          </button>
        </div>
      </div>

      {/* Canvas container (the DOM drop zone wrapping the Konva Stage) */}
      <div
        id="canvas-drop-zone"
        className="flex-1 flex items-center justify-center relative overflow-auto"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Stage ref={stageRef} width={stageWidth} height={stageHeight}>
          <Layer>
            <Group x={CANVAS_PADDING} y={CANVAS_PADDING}>
              {/* Fixture bounding box */}
              <Rect
                x={0}
                y={0}
                width={fixtureWidthPx}
                height={fixtureHeightPx}
                fill="#0f172a"
                stroke="#334155"
                strokeWidth={2}
                cornerRadius={4}
              />

              {/* Grid lines (subtle) */}
              {Array.from({ length: Math.floor(fixture.width / 10) + 1 }).map(
                (_, i) => (
                  <Line
                    key={`vgrid-${i}`}
                    points={[
                      cmToPx(i * 10),
                      0,
                      cmToPx(i * 10),
                      fixtureHeightPx,
                    ]}
                    stroke="rgba(148,163,184,0.08)"
                    strokeWidth={1}
                  />
                )
              )}
              {Array.from({
                length: Math.floor(fixture.height / 10) + 1,
              }).map((_, i) => (
                <Line
                  key={`hgrid-${i}`}
                  points={[
                    0,
                    cmToPx(i * 10),
                    fixtureWidthPx,
                    cmToPx(i * 10),
                  ]}
                  stroke="rgba(148,163,184,0.08)"
                  strokeWidth={1}
                />
              ))}

              {/* Shelves */}
              {fixture.shelves.map((shelf) => (
                <ShelfLine
                  key={shelf.id}
                  yOffset={shelf.y_offset}
                  width={shelf.width}
                  fixtureHeightPx={fixtureHeightPx}
                  shelfId={shelf.id}
                  shelfHeight={shelf.height}
                />
              ))}

              {/* Placed products — keyed by revertCounter to force remount on revert */}
              {placements.map((pl) => {
                const prod = products.find((p) => p.id === pl.productId);
                if (!prod) return null;
                return (
                  <PlacedProduct
                    key={`${pl.id}-${revertCounter}`}
                    placement={pl}
                    product={prod}
                    fixtureHeightPx={fixtureHeightPx}
                    onDragEnd={handlePlacedProductDragEnd}
                    onRemove={removePlacement}
                  />
                );
              })}

              {/* Drop preview ghost */}
              {dropPreview && (
                <Rect
                  x={dropPreview.x}
                  y={dropPreview.y}
                  width={dropPreview.w}
                  height={dropPreview.h}
                  fill={
                    dropPreview.valid
                      ? "rgba(99,102,241,0.2)"
                      : "rgba(239,68,68,0.2)"
                  }
                  stroke={dropPreview.valid ? "#818cf8" : "#ef4444"}
                  strokeWidth={1}
                  dash={[4, 4]}
                  listening={false}
                />
              )}

              {/* Dimension labels */}
              <Text
                x={fixtureWidthPx / 2 - 30}
                y={fixtureHeightPx + 8}
                text={`${fixture.width} cm`}
                fontSize={11}
                fill="#64748b"
                fontFamily="Inter, sans-serif"
              />
              <Text
                x={-30}
                y={fixtureHeightPx / 2}
                text={`${fixture.height} cm`}
                fontSize={11}
                fill="#64748b"
                fontFamily="Inter, sans-serif"
                rotation={-90}
              />
            </Group>
          </Layer>
        </Stage>

        {/* Toast notification */}
        {toast && (
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-5 py-2.5 rounded-lg text-[13px] font-medium shadow-lg shadow-black/40 z-50 animate-toast-in pointer-events-none"
            role="alert"
          >
            {toast}
          </div>
        )}

        {/* Instructions overlay */}
        {placements.length === 0 && !isOptimizing && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none text-center max-w-[240px] leading-relaxed">
            Drag a product from the sidebar and drop it onto a shelf
          </div>
        )}

        {/* Loading Spinner for Optimization */}
        {isOptimizing && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-800 p-6 rounded-xl flex flex-col items-center gap-5 shadow-2xl border border-slate-700">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-semibold text-slate-100 tracking-wide">Optimization Engine Running</span>
                <span className="text-xs text-slate-400">Solving SCIP Mixed-Integer Model...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
