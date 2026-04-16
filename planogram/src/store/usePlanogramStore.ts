import { create } from "zustand";
import type { PlanogramState, Placement, Fixture } from "@/types";
import { MOCK_PRODUCTS, MOCK_FIXTURE } from "@/data/mock";
import { optimizePlanogram, type OptimizationStrategy } from "@/lib/optimizationEngine";

export const usePlanogramStore = create<PlanogramState>((set, get) => ({
  products: MOCK_PRODUCTS,
  fixture: MOCK_FIXTURE,
  placements: [],
  isOptimizing: false,

  addPlacement: (placement: Placement) =>
    set((state) => ({
      placements: [...state.placements, placement],
    })),

  removePlacement: (placementId: string) =>
    set((state) => ({
      placements: state.placements.filter((p) => p.id !== placementId),
    })),

  updatePlacement: (placementId: string, updates: Partial<Placement>) =>
    set((state) => ({
      placements: state.placements.map((p) =>
        p.id === placementId ? { ...p, ...updates } : p
      ),
    })),

  updateProduct: (productId: string, updates: Partial<Product>) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, ...updates } : p
      ),
    })),

  setFixture: (fixture: Fixture) => set({ fixture }),

  resetPlacements: () => set({ placements: [] }),

  autoOptimize: async (strategy: OptimizationStrategy) => {
    set({ isOptimizing: true });
    try {
      const { fixture, products } = get();
      const placements = await optimizePlanogram(fixture, products, strategy);
      set({ placements, isOptimizing: false });
    } catch (error) {
      set({ isOptimizing: false });
      throw error;
    }
  },
}));
