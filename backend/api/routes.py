from fastapi import APIRouter, Depends

from shared.schemas import (
    OptimizationResponseSchema,
    OptimizationRequestSchema
)
from services.optimization_service import optimize_route
from auth.firebase_auth import verify_firebase_token

router = APIRouter()

@router.post(
    "/optimize",
    response_model=OptimizationResponseSchema,
    dependencies=[Depends(verify_firebase_token)]
)
def optimize(data: OptimizationRequestSchema):
    return optimize_route(data)