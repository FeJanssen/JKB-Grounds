"""
AWS Lambda Handler für FastAPI
"""
from mangum import Mangum
from app.main import app

# Lambda Handler mit Function URL Support (kein API Gateway Base Path)
handler = Mangum(app, lifespan="off")
