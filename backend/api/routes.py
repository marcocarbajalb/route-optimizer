from fastapi import APIRouter

from shared.schemas import (
    OptimizationResponseSchema,
    OptimizationRequestSchema
)

from services.optimization_service import optimize_route

router = APIRouter()


@router.post(
    "/optimize",
    response_model=OptimizationResponseSchema
)
def optimize(data: OptimizationRequestSchema):
    return optimize_route(data)