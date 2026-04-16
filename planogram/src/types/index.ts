// ─── Core Domain Types ─────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  width: number;   // in cm
  height: number;  // in cm
  depth: number;   // in cm
  color: string;   // hex color
  imageUrl: string; // URL to product image
  category: string;
  salesVelocity: number; // units sold per week
  profitMargin: number;  // profit per unit in dollars
  stock?: number;        // Optional inventory maximum limit
}

export interface Shelf {
  id: string;
  y_offset: number;   // distance from fixture bottom, in cm
  width: number;       // shelf width in cm
  height: number;      // vertical clearance of this shelf zone, in cm
  max_weight: number;  // kg
}

export interface Fixture {
  id: string;
  name: string;
  width: number;   // cm
  height: number;  // cm
  depth: number;   // cm
  shelves: Shelf[];
}

export interface Placement {
  id: string;
  productId: string;
  shelfId: string;
  x_position: number;  // x offset within the shelf, in cm
  y_position: number;  // y offset (bottom of product relative to fixture bottom)
  facings_x: number;   // horizontal repetitions
  facings_y: number;   // vertical stack count
}

// ─── Store Types ───────────────────────────────────────────────────────────

export interface PlanogramState {
  products: Product[];
  fixture: Fixture;
  placements: Placement[];
  isOptimizing: boolean;

  // Actions
  addPlacement: (placement: Placement) => void;
  removePlacement: (placementId: string) => void;
  updatePlacement: (placementId: string, updates: Partial<Placement>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  setFixture: (fixture: Fixture) => void;
  resetPlacements: () => void;
  autoOptimize: (strategy: "profit" | "sales") => Promise<void>;
}

// ─── Canvas Coordinate Helpers ─────────────────────────────────────────────

/** Scale factor: how many pixels per centimeter on canvas */
export const PIXELS_PER_CM = 4;


