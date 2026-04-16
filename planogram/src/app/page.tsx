"use client";

import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";

// react-konva requires browser APIs – disable SSR
const PlanogramCanvas = dynamic(() => import("@/components/PlanogramCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
      <div className="w-8 h-8 border-3 border-slate-700 border-t-indigo-500 rounded-full animate-spinner" />
      <span>Loading canvas…</span>
    </div>
  ),
});

export default function HomePage() {
  return (
    <main className="flex h-screen w-screen bg-[#0a0e1a] text-slate-50">
      <Sidebar />
      <PlanogramCanvas />
    </main>
  );
}
