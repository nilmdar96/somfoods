from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from ortools.linear_solver import pywraplp

app = FastAPI(title="Planogram Optimizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Product(BaseModel):
    id: str
    width: float
    height: float
    profit: float
    min_facings: int = 1
    max_facings: int = 10
    stock: Optional[int] = None

class Shelf(BaseModel):
    id: str
    width: float
    height_clearance: float

class PlanogramRequest(BaseModel):
    shelves: List[Shelf]
    products: List[Product]

class PlacementResponse(BaseModel):
    product_id: str
    shelf_id: str
    facings: int
    x_position: float

@app.post("/api/optimize", response_model=List[PlacementResponse])
def optimize_planogram(request: PlanogramRequest):
    shelves = request.shelves
    products = request.products

    solver = pywraplp.Solver.CreateSolver('SCIP')
    if not solver:
        raise HTTPException(status_code=500, detail="SCIP solver not available.")

    num_shelves = len(shelves)
    num_products = len(products)

    # Variables
    # x[p][s] = number of facings of product p on shelf s
    x = {}
    for p in range(num_products):
        for s in range(num_shelves):
            # Constraint 3: Height check mapping. 
            # If the product is strictly taller than the shelf space, force facings to 0.
            if products[p].height > shelves[s].height_clearance:
                upper_bound = 0
            else:
                upper_bound = products[p].max_facings
            x[(p, s)] = solver.IntVar(0, upper_bound, f'x_{p}_{s}')

    # y[p] = indicator variable, 1 if product p is placed on ANY shelf, 0 otherwise
    y = {}
    for p in range(num_products):
        y[p] = solver.IntVar(0, 1, f'y_{p}')

    # Constraint 2: Width limit per shelf
    for s in range(num_shelves):
        solver.Add(
            sum(x[(p, s)] * products[p].width for p in range(num_products)) <= shelves[s].width
        )

    # Constraint 4: Global min/max facings logic.
    # Total facings over all shelves constrained by y indicator logic.
    for p in range(num_products):
        total_facings = sum(x[(p, s)] for s in range(num_shelves))
        
        # If y[p] is 1, total_facings must be >= min_facings
        solver.Add(total_facings >= products[p].min_facings * y[p])
        
        # If y[p] is 0, total_facings is locked to <= 0. If y[p] is 1, it's bound by max_facings
        solver.Add(total_facings <= products[p].max_facings * y[p])

        # Constraint 5: Physical Inventory Capping
        if products[p].stock is not None:
            solver.Add(total_facings <= products[p].stock)

    # Constraint 1: Maximize sum(facings * profit) across all items
    objective = solver.Objective()
    for p in range(num_products):
        for s in range(num_shelves):
            objective.SetCoefficient(x[(p, s)], products[p].profit)
            
    objective.SetMaximization()

    # Optimization Step
    status = solver.Solve()

    if status not in [pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE]:
        raise HTTPException(status_code=400, detail="No feasible planogram placement found. Try adjusting constraints or bounds.")

    # Execution Post-Processing: Iterator mapping X coordinates onto shelf locations
    placements = []
    for s_idx, shelf in enumerate(shelves):
        current_x = 0.0
        for p_idx, product in enumerate(products):
            facings_val = round(x[(p_idx, s_idx)].solution_value())
            if facings_val > 0:
                placements.append(PlacementResponse(
                    product_id=product.id,
                    shelf_id=shelf.id,
                    facings=facings_val,
                    x_position=current_x
                ))
                # Next product starts directly after all facings of this product
                current_x += (product.width * facings_val)

    return placements
