"use client";

import React, { useState } from "react";
import { Search, Package, GripVertical, Trash2, DollarSign, TrendingUp } from "lucide-react";
import { usePlanogramStore } from "@/store/usePlanogramStore";
import type { Product } from "@/types";

export default function Sidebar() {
  const products = usePlanogramStore((s) => s.products);
  const placements = usePlanogramStore((s) => s.placements);
  const removePlacement = usePlanogramStore((s) => s.removePlacement);
  const updateProduct = usePlanogramStore((s) => s.updateProduct);
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    product: Product
  ) => {
    e.dataTransfer.setData("application/planogram-product", JSON.stringify(product));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="w-[300px] min-w-[300px] h-screen bg-gray-900 border-r border-slate-700 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-3.5">
          <Package size={20} className="text-indigo-400" />
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-50">
            Product Catalog
          </h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            id="product-search"
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2 pl-[34px] pr-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 text-[13px] font-[family-name:var(--font-sans)] outline-none transition-colors duration-150 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {filtered.map((product) => (
          <div
            key={product.id}
            id={`product-card-${product.id}`}
            draggable
            onDragStart={(e) => handleDragStart(e, product)}
            className="flex flex-col px-3 py-2.5 mb-1 rounded-lg cursor-grab select-none border border-transparent transition-all duration-150 hover:bg-slate-800 hover:border-slate-700 active:cursor-grabbing active:shadow-lg active:shadow-black/30 active:border-indigo-500"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <GripVertical size={14} className="text-slate-500 shrink-0" />
                <div className="w-9 h-9 rounded-md shrink-0 border border-white/10 overflow-hidden bg-slate-800" style={{ backgroundColor: product.color }}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-medium text-slate-50 truncate">
                    {product.name}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-px">
                    {product.width}×{product.height}×{product.depth} cm
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-xl font-medium uppercase tracking-wider shrink-0">
                {product.category}
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-0.5">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="flex items-center gap-0.5" title="Profit Margin">
                  <DollarSign size={11} className="text-emerald-400" />
                  {product.profitMargin.toFixed(2)}
                </span>
                <span className="flex items-center gap-0.5" title="Sales Velocity">
                  <TrendingUp size={11} className="text-indigo-400" />
                  {product.salesVelocity}/wk
                </span>
              </div>
              <div className="flex items-center gap-1.5" onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <span className="text-[10px] text-slate-500 font-medium">Stock:</span>
                <input
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={product.stock === undefined ? "" : product.stock}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateProduct(product.id, { stock: val === "" ? undefined : parseInt(val, 10) });
                  }}
                  className="w-[42px] h-[22px] bg-slate-900 border border-slate-700 rounded text-[11px] text-center text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-600 appearance-none m-0"
                />
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-slate-500 text-center py-6 px-4 text-[13px]">
            No products match your search.
          </p>
        )}
      </div>

      {/* Placements Summary */}
      {placements.length > 0 && (
        <div className="border-t border-slate-700 p-3 max-h-[200px] overflow-y-auto">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Placed Items ({placements.length})
          </h3>
          <div className="flex flex-col gap-1">
            {placements.map((pl) => {
              const prod = products.find((p) => p.id === pl.productId);
              return (
                <div
                  key={pl.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-md bg-slate-800 border border-slate-700"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-4 h-4 rounded shrink-0 border border-white/10"
                      style={{ backgroundColor: prod?.color ?? "#666" }}
                    />
                    <span className="text-xs text-slate-50 truncate">
                      {prod?.name ?? "Unknown"}
                    </span>
                  </div>
                  <button
                    id={`remove-placement-${pl.id}`}
                    onClick={() => removePlacement(pl.id)}
                    className="bg-transparent border-none text-slate-500 cursor-pointer p-1 rounded flex items-center transition-colors duration-150 hover:text-red-500 hover:bg-red-500/10"
                    title="Remove placement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
