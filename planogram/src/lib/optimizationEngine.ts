import type { Fixture, Product, Placement } from "@/types";

export type OptimizationStrategy = "profit" | "sales";

/**
 * Enterprise-grade space optimization engine.
 * Solves mathematical mixed-integer models through the FastAPI SCIP Backend.
 */
export async function optimizePlanogram(
  fixture: Fixture,
  products: Product[],
  strategy: OptimizationStrategy
): Promise<Placement[]> {
  if (!products.length || !fixture.shelves.length) return [];

  try {
    const payload = {
      shelves: fixture.shelves.map((s) => ({
        id: s.id,
        width: s.width,
        height_clearance: s.height,
      })),
      products: products.map((p) => ({
        id: p.id,
        width: p.width,
        height: p.height,
        profit: strategy === "profit" ? p.profitMargin : p.salesVelocity,
        min_facings: 1,
        max_facings: 6,
        stock: p.stock ?? null,
      })),
    };

    const apiBaseUrl = process.env.NEXT_PUBLIC_OPTIMIZER_URL ?? "http://localhost:8000";
    const response = await fetch(`${apiBaseUrl}/api/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errJson = await response.json();
        if (errJson.detail) errorDetail = errJson.detail;
      } catch (e) {
        // Fallback to text
        errorDetail = await response.text();
      }
      throw new Error(`Solver API Error: ${errorDetail}`);
    }

    const data = await response.json();
    
    // Map backend PlacementResponse back to frontend Placement format
    const placements: Placement[] = data.map((item: any) => {
      const shelf = fixture.shelves.find((s) => s.id === item.shelf_id);
      return {
        id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: item.product_id,
        shelfId: item.shelf_id,
        x_position: item.x_position,
        y_position: shelf ? shelf.y_offset : 0,
        facings_x: item.facings,
        facings_y: 1,
      };
    });

    return placements;

  } catch (error: any) {
    console.error("Optimization Engine failed:", error);
    if (error instanceof TypeError) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_OPTIMIZER_URL ?? "http://localhost:8000";
      throw new Error(
        `Failed to connect to the optimization backend at ${apiBaseUrl}. Make sure the FastAPI server is running and accessible.`
      );
    }
    throw error;
  }
}
