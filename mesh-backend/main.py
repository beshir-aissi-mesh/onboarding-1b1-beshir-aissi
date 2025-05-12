# mesh_sandbox_integration.py
import os
import logging
import uuid
import base64
import json # Added for reading json file
from typing import Optional

import requests
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# --- Settings and Configuration ---

class Settings(BaseSettings):
    load_dotenv()
    client_id: str = os.getenv("MESH_CLIENT_ID")
    sandbox: int = os.getenv("SANDBOX")
    client_secret: str = os.getenv("MESH_API_SECRET") if os.getenv("SANDBOX") == "1" else os.getenv("MESH_PROD_API_SECRET")
    mesh_api_base: str = "https://sandbox-integration-api.meshconnect.com" if os.getenv("SANDBOX") == "1" else "https://integration-api.meshconnect.com/"
    auth_domain: str = "sandbox-web.meshconnect.com"
    to_address: str = "0x0000000000000000F0F000000000ffFf00f0F0f0" if os.getenv("SANDBOX") == "1" else ""
    coinbase_network_id: str = "e3c7fdd8-b1fc-4e51-85ae-bb276e075611"

settings = Settings()
app = FastAPI(title="Mesh Sandbox Integration")
templates = Jinja2Templates(directory="templates")

# --- Models ---

class TokenResponse(BaseModel):
    access_token: str
    status: str = "success"
    broker_type: str

class ExecuteTransferPayload(BaseModel):
    auth_token: str
    from_type: str
    preview_id: str
    mfa_code: str

# --- Storage ---
token_storage = {}

# --- Utility Functions ---

def get_link_token() -> str:
    """Retrieve Mesh link token with enhanced error handling"""
    headers = {
        "X-Client-Id": settings.client_id,
        "X-Client-Secret": settings.client_secret,
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{settings.mesh_api_base}/api/v1/linktoken",
        headers=headers,
        json={
            "userId": "sandbox_user",
            "restrictMultipleAccounts": True,
        },
        timeout=10
    )
    
    if response.status_code != 200:
        error_msg = f"Link token request failed: {response.text}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)
    
    print(f"Link token response: {response.text}")
    
    return response.json()['content']['linkToken']

def get_transfer_preview(auth_token: str, from_type: str, to_type: str, to_address: str, 
                        amount: float, address_tag: str, symbol: str, network_id: str):
    """Get transfer preview from Mesh API"""
    url = f"{settings.mesh_api_base}/api/v1/transfers/managed/preview"
    
    payload = {
        "fromAuthToken": auth_token,
        "fromType": from_type,
        "toType": to_type,
        "toAddress": to_address,
        "amount": amount,
        "addressTag": address_tag,
        "symbol": symbol,
        "networkId": network_id
    }
    
    headers = {
        "X-Client-Secret": settings.client_secret,
        "X-Client-Id": settings.client_id,
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code != 200:
        error_msg = f"Transfer preview request failed: {response.text}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)
    
    return response.json()

def execute_transfer(auth_token: str, from_type: str, preview_id: str, mfa_code: str):
    """Execute transfer using Mesh API"""
    url = f"{settings.mesh_api_base}/api/v1/transfers/managed/execute"
    payload = {
        "fromAuthToken": auth_token,
        "fromType": from_type,
        "previewId": preview_id,
        "mfaCode": mfa_code
    }
    headers = {
        "X-Client-Secret": settings.client_secret,
        "X-Client-Id": settings.client_id,
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        error_msg = f"Transfer execution failed: {response.text}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)
    return response.json()

def get_holdings(auth_token: str, from_type: str):
    """Get holdings using Mesh API"""
    url = f"{settings.mesh_api_base}/api/v1/holdings/get"
    payload = {
        "authToken": auth_token,
        "type": from_type
    }
    headers = {
        "X-Client-Secret": settings.client_secret,
        "X-Client-Id": settings.client_id,
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        error_msg = f"Holdings request failed: {response.text}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)
    return response.json()

def get_networks():
    """Get networks using Mesh API"""
    url = f"{settings.mesh_api_base}/api/v1/transfers/managed/networks"
    headers = {
        "X-Client-Secret": settings.client_secret,
        "X-Client-Id": settings.client_id,
        "Content-Type": "application/json"
    }
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        error_msg = f"Networks request failed: {response.text}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)
    return response.json()

# --- HTML Page Routes ---

@app.get("/", response_class=HTMLResponse)
async def auth_interface(request: Request):
    """Main endpoint serving the iframe-enabled authentication interface"""
    try:
        link_token = get_link_token()
        auth_url = base64.b64decode(link_token).decode('utf-8')
        return templates.TemplateResponse(
            "auth_frame.html",
            {
                "request": request,
                "auth_url": auth_url,
            }
        )
    except Exception as e:
        logger.error(f"Initialization failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Initialization failed")

@app.get("/preview_transfer", response_class=HTMLResponse)
async def preview_transfer_page(request: Request):
    return templates.TemplateResponse("preview_transfer.html", {"request": request})

@app.get("/execute_transfer", response_class=HTMLResponse)
async def execute_transfer_page(request: Request):
    return templates.TemplateResponse("execute_transfer.html", {"request": request})

@app.get("/holdings", response_class=HTMLResponse)
async def holdings_page(request: Request):
    return templates.TemplateResponse("holdings.html", {"request": request})

@app.get("/demo", response_class=HTMLResponse)
async def demo_page(request: Request):
    """Serves the main demo page"""
    addresses = []
    try:
        with open("receiving_addresses.json", "r") as f:
            print("Loading receiving addresses from JSON file.")
            data = json.load(f)
            addresses = data.get("addresses", [])
    except FileNotFoundError:
        logger.warning("receiving_addresses.json not found. Demo page will have an empty address list.")
    except json.JSONDecodeError:
        logger.warning("receiving_addresses.json is not valid JSON. Demo page will have an empty address list.")
    
    return templates.TemplateResponse(
        "demo.html",
        {
            "request": request,
            "receiving_addresses": addresses
        }
    )

@app.get("/init_auth", response_class=HTMLResponse)
@app.get("/init_auth/{request_id}", response_class=HTMLResponse)
async def initialize_auth(request: Request, request_id: Optional[str] = None):
    # Generate a unique request ID
    if request_id is None:
        request_id = str(uuid.uuid4())
        # Initialize token storage with pending status
        print(f"Generated new request ID: {request_id}")
        token_storage[request_id] = {"status": "pending", "token": None}
    elif request_id not in token_storage:
        print(f"Request ID {request_id} not found in storage. Generating a new one.")
        request_id = str(uuid.uuid4())
        token_storage[request_id] = {"status": "pending", "token": None}
    else:
        print(f"Using existing request ID: {request_id}")

    # Auth URL from Mesh Connect
    link_token = get_link_token()
    auth_url = base64.b64decode(link_token).decode('utf-8')
    
    # Return the HTML with request_id embedded
    return templates.TemplateResponse("auth_user.html", {
        "request": request,
        "auth_url": auth_url,
        "request_id": request_id
    })

# --- API Routes ---

@app.get("/api/dummy", response_class=JSONResponse)
async def dummy_endpoint(request: Request):
    """Dummy endpoint to check server status"""
    return JSONResponse(content={"status": "ok"})

@app.get("/api/request_id", response_class=JSONResponse)
async def request_id(request: Request):
    """Endpoint to request a new ID"""
    request_id = str(uuid.uuid4())
    token_storage[request_id] = {"status": "pending", "token": None}
    return JSONResponse(content={"request_id": request_id})

@app.post("/api/store_token/{request_id}")
async def store_token(request_id: str, token_data: dict):
    """Store the token from auth process"""
    if request_id not in token_storage:
        raise HTTPException(status_code=404, detail="Request ID not found")
    
    # Store the token
    token_storage[request_id] = {
        "status": "complete",
        "token": token_data.get("access_token"),
        "broker_type": token_data.get("broker_type")
    }
    return {"status": "success"}

@app.get("/api/get_token/{request_id}")
async def get_token(request_id: str):
    """Retrieve a stored token"""
    if request_id not in token_storage:
        raise HTTPException(status_code=404, detail="Request ID not found")
    
    token_data = token_storage[request_id]
    if token_data["status"] == "pending":
        return {"status": "pending", "message": "Token not yet available"}
    
    print(f"Token data: {token_data}")
    
    return TokenResponse(access_token=token_data["token"], broker_type=token_data["broker_type"])

@app.get("/api/get_linktoken", response_class=JSONResponse)
async def get_linktoken_endpoint(request: Request):
    """Endpoint to retrieve the link token"""
    try:
        link_token = get_link_token()
        return JSONResponse(content={"link_token": link_token})
    except Exception as e:
        logger.error(f"Failed to get link token: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get link token")

@app.get("/api/transfer_preview", response_class=JSONResponse)
async def transfer_preview_endpoint(
    request: Request, 
    auth_token: str, 
    from_type: str, 
    to_type: str, 
    to_address: str, 
    amount: float, 
    address_tag: str, 
    symbol: str
):
    """Endpoint to get transfer preview"""
    try:
        network_id = settings.coinbase_network_id
        
        transfer_preview_data = get_transfer_preview(
            auth_token,
            from_type,
            to_type,
            to_address,
            amount,
            address_tag,
            symbol,
            network_id
        )
        
        return JSONResponse(content=transfer_preview_data)
    except Exception as e:
        logger.error(f"Transfer preview failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transfer preview failed: {str(e)}")

@app.post("/api/execute_transfer")
async def api_execute_transfer_endpoint(payload: ExecuteTransferPayload):
    """Endpoint to execute a transfer"""
    try:
        transfer_result = execute_transfer(
            auth_token=payload.auth_token,
            from_type=payload.from_type,
            preview_id=payload.preview_id,
            mfa_code=payload.mfa_code
        )
        return transfer_result
    except HTTPException as e:
        # Re-raise HTTPExceptions that might come from execute_transfer
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in execute_transfer endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    
@app.get("/api/get_holdings")
async def api_get_holdings(request: Request, auth_token: str, from_type: str):
    """Endpoint to get holdings"""
    try:
        holdings_data = get_holdings(auth_token, from_type)
        return JSONResponse(content=holdings_data)
    except Exception as e:
        logger.error(f"Holdings request failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Holdings request failed: {str(e)}")

@app.get("/api/get_networks")
async def api_get_networks(request: Request):
    """Endpoint to get networks"""
    try:
        networks_data = get_networks()
        return JSONResponse(content=networks_data)
    except Exception as e:
        logger.error(f"Networks request failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Networks request failed: {str(e)}")

# --- Main Entry Point ---

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=3000)
