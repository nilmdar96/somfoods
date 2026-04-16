import type { Shelf, Placement, Product, Fixture } from "@/types";

/**
 * Find the nearest shelf to a given y-coordinate (in fixture-cm space).
 * Always returns the closest shelf — products always snap to a shelf surface
 * regardless of distance, since floating products make no physical sense.
 */
export function findNearestShelf(
  yDropCm: number,
  shelves: Shelf[]
): Shelf | null {
  if (shelves.length === 0) return null;

  let bestShelf: Shelf | null = null;
  let bestDistance = Infinity;

  for (const shelf of shelves) {
    const shelfSurface = shelf.y_offset;
    const distance = Math.abs(yDropCm - shelfSurface);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestShelf = shelf;
    }
  }

  return bestShelf;
}

/**
 * Check whether a product placement would exceed the shelf's vertical clearance.
 * The product's total stacked height (height × facings_y) must be ≤ shelf.height.
 */
export function fitsVertically(
  product: Product,
  shelf: Shelf,
  facingsY: number
): boolean {
  return product.height * facingsY <= shelf.height;
}

/**
 * Check whether a product placement would exceed the shelf's horizontal boundary.
 * xPosition + totalWidth must be ≤ shelf.width  AND  xPosition ≥ 0.
 */
export function fitsHorizontally(
  product: Product,
  shelf: Shelf,
  xPosition: number,
  facingsX: number
): boolean {
  const totalWidth = product.width * facingsX;
  return xPosition >= 0 && xPosition + totalWidth <= shelf.width;
}

/**
 * Check for overlaps on the X-axis with existing placements on the same shelf.
 * Two placements overlap if their horizontal extents intersect.
 *
 * Returns `true` if there IS an overlap (placement is invalid).
 */
export function hasXOverlap(
  xPosition: number,
  productWidth: number,
  facingsX: number,
  shelfId: string,
  existingPlacements: Placement[],
  products: Product[],
  excludePlacementId?: string
): boolean {
  const newLeft = xPosition;
  const newRight = xPosition + productWidth * facingsX;

  for (const placement of existingPlacements) {
    if (placement.shelfId !== shelfId) continue;
    if (excludePlacementId && placement.id === excludePlacementId) continue;

    const existingProduct = products.find((p) => p.id === placement.productId);
    if (!existingProduct) continue;

    const existingLeft = placement.x_position;
    const existingRight =
      placement.x_position + existingProduct.width * placement.facings_x;

    if (newLeft < existingRight && newRight > existingLeft) {
      return true;
    }
  }

  return false;
}

/**
 * Full validation: can this product be placed at (xCm, yCm) on the fixture?
 *
 * 1. Find nearest shelf (always snaps — no threshold-based rejection).
 * 2. If the product doesn't fit vertically on the nearest shelf, try
 *    the next-nearest one that CAN fit it (smart shelf fallback).
 * 3. Auto-clamp X so the product stays within shelf bounds.
 * 4. Check collision with existing placements.
 *
 * Returns { valid, shelf, snappedX, snappedY, reason }.
 */
export function validatePlacement(
  product: Product,
  xCm: number,
  yCm: number,
  fixture: Fixture,
  existingPlacements: Placement[],
  products: Product[],
  facingsX: number = 1,
  facingsY: number = 1,
  excludePlacementId?: string
): {
  valid: boolean;
  shelf: Shelf | null;
  snappedX: number;
  snappedY: number;
  reason: string;
} {
  // Sort shelves by distance to drop point
  const shelvesByDistance = [...fixture.shelves].sort(
    (a, b) => Math.abs(yCm - a.y_offset) - Math.abs(yCm - b.y_offset)
  );

  // Try shelves in order of proximity — pick the first one the product fits on
  let targetShelf: Shelf | null = null;
  for (const shelf of shelvesByDistance) {
    if (fitsVertically(product, shelf, facingsY)) {
      targetShelf = shelf;
      break;
    }
  }

  // If no shelf can fit this product vertically at all
  if (!targetShelf) {
    return {
      valid: false,
      shelf: null,
      snappedX: xCm,
      snappedY: yCm,
      reason: `Product height (${product.height * facingsY}cm) exceeds all shelf clearances.`,
    };
  }

  const snappedY = targetShelf.y_offset;

  // Auto-clamp X within shelf bounds
  const totalWidth = product.width * facingsX;
  const snappedX = Math.max(0, Math.min(xCm, targetShelf.width - totalWidth));

  // Collision check
  if (
    hasXOverlap(
      snappedX,
      product.width,
      facingsX,
      targetShelf.id,
      existingPlacements,
      products,
      excludePlacementId
    )
  ) {
    return {
      valid: false,
      shelf: targetShelf,
      snappedX,
      snappedY,
      reason: "Overlaps with an existing product on this shelf.",
    };
  }

  return { valid: true, shelf: targetShelf, snappedX, snappedY, reason: "" };
}
