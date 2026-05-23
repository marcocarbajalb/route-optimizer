from fastapi import APIRouter
from shared.schemas import OptimizationRequestSchema

router = APIRouter()


@router.post("/optimize")
def optimize(data: OptimizationRequestSchema):
    return {
        "message": "optimization request received",
        "locations_received": len(data.locations)
    }