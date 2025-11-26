"""
AWS Lambda Handler für FastAPI
"""
from mangum import Mangum
from app.main import app

# Lambda Handler mit API Gateway v2 Support
handler = Mangum(app, lifespan="off", api_gateway_base_path="/")
