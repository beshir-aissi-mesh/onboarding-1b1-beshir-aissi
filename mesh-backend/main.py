"""
Mesh Integration API Server

This FastAPI application integrates with the Mesh Connect API to facilitate
cryptocurrency transfers, authentication, and account management.

It provides HTML endpoints for user interaction and API endpoints for handling
authentication tokens, transfer previews, and transfer execution.
"""

# --- Standard Library Imports ---
import os
import logging
import uuid
import base64
import json
from typing import Optional, Dict, Any

# --- Third-Party Imports ---
import requests
from fastapi import Body, FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# --- Constants ---
DEFAULT_TIMEOUT = 10
PENDING_STATUS = "pending"
SUCCESS_STATUS = "success"
FAILED_STATUS = "failed"

# --- Settings and Configuration ---
class Settings(BaseSettings):
    """Application configuration settings loaded from environment variables."""
    load_dotenv()
    client_id: str = os.getenv("MESH_CLIENT_ID")
    sandbox: int = os.getenv("SANDBOX")
    client_secret: str = os.getenv("MESH_API_SECRET") if os.getenv("SANDBOX") == "1" else os.getenv("MESH_PROD_API_SECRET")
    mesh_api_base: str = "https://sandbox-integration-api.meshconnect.com" if os.getenv("SANDBOX") == "1" else "https://integration-api.meshconnect.com/"
    auth_domain: str = "sandbox-web.meshconnect.com"
    to_address: str = "0x0000000000000000F0F000000000ffFf00f0F0f0" if os.getenv("SANDBOX") == "1" else os.getenv("RECEIVING_WALLET_ADDRESS")
    coinbase_network_id: str = "aa883b03-120d-477c-a588-37c2afd3ca71"
    rainbow_wallet_address: str = os.getenv("RAINBOW_WALLET_ADDRESS")
    coinbase_wallet_address: str = os.getenv("COINBASE_WALLET_ADDRESS")

settings = Settings()
app = FastAPI(title="Mesh Sandbox Integration")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# --- Data Models ---
class TokenResponse(BaseModel):
    """Response model for token retrieval"""
    access_token: str
    status: str = SUCCESS_STATUS
    broker_type: str

class ExecuteTransferPayload(BaseModel):
    """Payload model for transfer execution"""
    auth_token: str
    from_type: str
    preview_id: str
    mfa_code: str

class TransferRequest(BaseModel):
    """Model for initiating a transfer request"""
    amount: float = Field(..., gt=0)
    request_id: Optional[str] = None

class TransferResult(BaseModel):
    """Model for transfer result data"""
    request_id: str
    status: str  # "success" | "failed"
    tx_hash: Optional[str] = None

# --- In-Memory Storage ---
token_storage: Dict[str, Dict[str, Any]] = {}
transfer_storage: Dict[str, Dict[str, Any]] = {}

# --- Mesh API Utility Functions ---
def get_mesh_headers() -> Dict[str, str]:
    """
    Returns the standard headers required for Mesh API calls.
    
    Returns:
        Dict[str, str]: Headers dictionary with client ID, secret, and content type
    """
    return {
        "X-Client-Id": settings.client_id,
        "X-Client-Secret": settings.client_secret,
        "Content-Type": "application/json"
    }

def get_link_token() -> str:
    """
    Retrieve Mesh link token with enhanced error handling.
    
    Returns:
        str: The link token for Mesh authentication
        
    Raises:
        HTTPException: If the API call fails
    """
    headers = get_mesh_headers()
    
    try:
        response = requests.post(
            f"{settings.mesh_api_base}/api/v1/linktoken",
            headers=headers,
            json={
                "userId": "sandbox_user",
                "restrictMultipleAccounts": True,
            },
            timeout=DEFAULT_TIMEOUT
        )
        
        response.raise_for_status()
        result = response.json()
        logger.info("Successfully retrieved link token")
        
        return result['content']['linkToken']
    except requests.RequestException as e:
        error_msg = f"Link token request failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)

def get_transfer_preview(
    auth_token: str, 
    from_type: str, 
    to_type: str, 
    to_address: str, 
    amount: float, 
    address_tag: str, 
    symbol: str, 
    network_id: str
) -> Dict[str, Any]:
    """
    Get transfer preview from Mesh API.
    
    Args:
        auth_token: User authentication token
        from_type: Source account type
        to_type: Destination account type
        to_address: Destination wallet address
        amount: Transfer amount
        address_tag: Address tag if required
        symbol: Cryptocurrency symbol
        network_id: Network ID for the transaction
        
    Returns:
        Dict[str, Any]: Transfer preview data
        
    Raises:
        HTTPException: If the API call fails
    """
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
    
    headers = get_mesh_headers()
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        error_msg = f"Transfer preview request failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)

def execute_transfer(
    auth_token: str, 
    from_type: str, 
    preview_id: str, 
    mfa_code: str
) -> Dict[str, Any]:
    """
    Execute transfer using Mesh API.
    
    Args:
        auth_token: User authentication token
        from_type: Source account type
        preview_id: ID from the transfer preview
        mfa_code: Multi-factor authentication code
        
    Returns:
        Dict[str, Any]: Transfer execution result
        
    Raises:
        HTTPException: If the API call fails
    """
    url = f"{settings.mesh_api_base}/api/v1/transfers/managed/execute"
    
    payload = {
        "fromAuthToken": auth_token,
        "fromType": from_type,
        "previewId": preview_id,
        "mfaCode": mfa_code
    }
    
    headers = get_mesh_headers()
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        error_msg = f"Transfer execution failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)

def get_holdings(auth_token: str, from_type: str) -> Dict[str, Any]:
    """
    Get holdings using Mesh API.
    
    Args:
        auth_token: User authentication token
        from_type: Account type
        
    Returns:
        Dict[str, Any]: Holdings data
        
    Raises:
        HTTPException: If the API call fails
    """
    url = f"{settings.mesh_api_base}/api/v1/holdings/get"
    
    payload = {
        "authToken": auth_token,
        "type": from_type
    }
    
    headers = get_mesh_headers()
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        error_msg = f"Holdings request failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)

def get_networks() -> Dict[str, Any]:
    """
    Get networks using Mesh API.
    
    Returns:
        Dict[str, Any]: Networks data
        
    Raises:
        HTTPException: If the API call fails
    """
    url = f"{settings.mesh_api_base}/api/v1/transfers/managed/networks"
    headers = get_mesh_headers()
    
    try:
        response = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        error_msg = f"Networks request failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=502, detail=error_msg)

# --- HTML Page Routes ---
@app.get("/", response_class=HTMLResponse)
async def auth_interface(request: Request):
    """
    Main endpoint serving the iframe-enabled authentication interface.
    
    Args:
        request: FastAPI request object
        
    Returns:
        HTMLResponse: The authentication interface page
    """
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
    """Render the transfer preview page."""
    return templates.TemplateResponse("preview_transfer.html", {"request": request})

@app.get("/execute_transfer", response_class=HTMLResponse)
async def execute_transfer_page(request: Request):
    """Render the transfer execution page."""
    return templates.TemplateResponse("execute_transfer.html", {"request": request})

@app.get("/holdings", response_class=HTMLResponse)
async def holdings_page(request: Request):
    """Render the holdings page."""
    return templates.TemplateResponse("holdings.html", {"request": request})

@app.get("/rainbow_payment", response_class=HTMLResponse)
async def rainbow_payment_page(request: Request):
    """Page for starting the $5 payment to RainbowWallet."""
    return templates.TemplateResponse("rainbow_payment.html", {"request": request})

@app.get("/rainbow_preview", response_class=HTMLResponse)
async def rainbow_preview_page(request: Request):
    """Page for previewing the payment to RainbowWallet."""
    return templates.TemplateResponse("rainbow_preview.html", {
        "request": request,
        "rainbow_wallet_address": settings.rainbow_wallet_address
    })

@app.get("/rainbow_mfa", response_class=HTMLResponse)
async def rainbow_mfa_page(request: Request):
    """Page for MFA verification for RainbowWallet payment."""
    return templates.TemplateResponse("rainbow_mfa.html", {"request": request})

@app.get("/rainbow_success", response_class=HTMLResponse)
async def rainbow_success_page(request: Request):
    """Success page for RainbowWallet payment."""
    return templates.TemplateResponse("rainbow_success.html", {
        "request": request,
        "rainbow_wallet_address": settings.rainbow_wallet_address
    })

@app.get("/rainbow_to_coinbase", response_class=HTMLResponse)
async def rainbow_to_coinbase_page(request: Request):
    """
    Page for transferring USDC from Rainbow to Coinbase using the Link SDK.
    
    Args:
        request: FastAPI request object
        
    Returns:
        HTMLResponse: The Rainbow to Coinbase transfer page
    """
    try:
        link_token = get_link_token()
        return templates.TemplateResponse(
            "rainbow_to_coinbase.html",
            {
                "request": request,
                "link_token": link_token,
                "mesh_client_id": settings.client_id,
                "coinbase_wallet_address": settings.coinbase_wallet_address
            },
        )
    except Exception as e:
        logger.error(f"Failed to load rainbow_to_coinbase page: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize transfer page")

@app.get("/iframe_link", response_class=HTMLResponse)
async def iframe_link(request: Request):
    """
    Renders a page that embeds the Mesh Link UI inside an iframe.
    The server mints the one-time link token so the secret never
    touches the browser.
    
    Args:
        request: FastAPI request object
        
    Returns:
        HTMLResponse: The iframe link page
    """
    try:
        link_token = get_link_token()
    except Exception as e:
        logger.exception("Could not get link token")
        raise HTTPException(status_code=500, detail="Failed to create link token")

    return templates.TemplateResponse(
        "iframe_link.html",
        {
            "request": request,
            "link_token": link_token,
            "mesh_client_id": settings.client_id,
            "DEST_SYMBOL": "USDC",
        },
    )

@app.get("/demo", response_class=HTMLResponse)
async def demo_page(request: Request):
    """
    Serves the main demo page.
    
    Args:
        request: FastAPI request object
        
    Returns:
        HTMLResponse: The demo page
    """
    addresses = []
    try:
        with open("receiving_addresses.json", "r") as f:
            logger.info("Loading receiving addresses from JSON file.")
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
    """
    Initialize the authentication process.
    
    Args:
        request: FastAPI request object
        request_id: Optional request ID
        
    Returns:
        HTMLResponse: The authentication interface page
    """
    # Generate a unique request ID
    if request_id is None:
        request_id = str(uuid.uuid4())
        # Initialize token storage with pending status
        logger.info(f"Generated new request ID: {request_id}")
        token_storage[request_id] = {"status": PENDING_STATUS, "token": None}
    elif request_id not in token_storage:
        logger.info(f"Request ID {request_id} not found in storage. Generating a new one.")
        request_id = str(uuid.uuid4())
        token_storage[request_id] = {"status": PENDING_STATUS, "token": None}
    else:
        logger.info(f"Using existing request ID: {request_id}")

    # Auth URL from Mesh Connect
    link_token = get_link_token()
    auth_url = base64.b64decode(link_token).decode('utf-8')
    
    # Return the HTML with request_id embedded
    return templates.TemplateResponse("auth_user.html", {
        "request": request,
        "auth_url": auth_url,
        "request_id": request_id
    })

@app.get("/transfer_test", response_class=HTMLResponse)
async def transfer_test(request: Request):
    """
    Tiny page that:
      • lets you type an amount
      • calls /api/transfer_request
      • opens Mesh Link
      • sends /api/transfer_result when finished
      • polls /api/transfer_status every 3 s
      
    Args:
        request: FastAPI request object
        
    Returns:
        HTMLResponse: The transfer test page
    """
    link_token = get_link_token()  # for the initial wallet link
    return templates.TemplateResponse(
        "transfer_test.html",
        {
            "request": request,
            "link_token": link_token,
            "mesh_client_id": settings.client_id,
            "dest_symbol": "USDC",
        },
    )

# --- API Routes ---

@app.get("/api/dummy", response_class=JSONResponse)
async def dummy_endpoint(request: Request):
    """
    Dummy endpoint to check server status.
    
    Args:
        request: FastAPI request object
        
    Returns:
        JSONResponse: Simple OK status response
    """
    return JSONResponse(content={"status": "ok"})

@app.get("/api/request_id", response_class=JSONResponse)
async def request_id(request: Request):
    """
    Endpoint to request a new ID.
    
    Args:
        request: FastAPI request object
        
    Returns:
        JSONResponse: New request ID
    """
    request_id = str(uuid.uuid4())
    token_storage[request_id] = {"status": PENDING_STATUS, "token": None}
    return JSONResponse(content={"request_id": request_id})

@app.post("/api/store_token/{request_id}")
async def store_token(request_id: str, token_data: dict):
    """
    Store the token from auth process.
    
    Args:
        request_id: Request ID to associate with the token
        token_data: Token data including access_token and broker_type
        
    Returns:
        Dict: Success status
        
    Raises:
        HTTPException: If request ID is not found
    """
    if request_id not in token_storage:
        raise HTTPException(status_code=404, detail="Request ID not found")
    
    # Store the token
    token_storage[request_id] = {
        "status": "complete",
        "token": token_data.get("access_token"),
        "broker_type": token_data.get("broker_type")
    }
    return {"status": SUCCESS_STATUS}

@app.get("/api/get_token/{request_id}")
async def get_token(request_id: str):
    """
    Retrieve a stored token.
    
    Args:
        request_id: Request ID associated with the token
        
    Returns:
        TokenResponse or Dict: Token data or pending status
        
    Raises:
        HTTPException: If request ID is not found
    """
    if request_id not in token_storage:
        raise HTTPException(status_code=404, detail="Request ID not found")
    
    token_data = token_storage[request_id]
    if token_data["status"] == PENDING_STATUS:
        return {"status": PENDING_STATUS, "message": "Token not yet available"}
    
    logger.info(f"Returning token data for request ID: {request_id}")
    
    return TokenResponse(access_token=token_data["token"], broker_type=token_data["broker_type"])

@app.get("/api/get_linktoken", response_class=JSONResponse)
async def get_linktoken_endpoint(request: Request):
    """
    Endpoint to retrieve the link token.
    
    Args:
        request: FastAPI request object
        
    Returns:
        JSONResponse: Link token
        
    Raises:
        HTTPException: If token retrieval fails
    """
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
    symbol: str,
    address_tag: str = None,
):
    """
    Endpoint to get transfer preview.
    
    Args:
        request: FastAPI request object
        auth_token: User authentication token
        from_type: Source account type
        to_type: Destination account type
        to_address: Destination address
        amount: Transfer amount
        symbol: Cryptocurrency symbol
        address_tag: Optional address tag
        
    Returns:
        JSONResponse: Transfer preview data
        
    Raises:
        HTTPException: If preview request fails
    """
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
    """
    Endpoint to execute a transfer.
    
    Args:
        payload: Transfer execution payload
        
    Returns:
        Dict: Transfer result data
        
    Raises:
        HTTPException: If transfer execution fails
    """
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
    """
    Endpoint to get holdings.
    
    Args:
        request: FastAPI request object
        auth_token: User authentication token
        from_type: Account type
        
    Returns:
        JSONResponse: Holdings data
        
    Raises:
        HTTPException: If holdings request fails
    """
    try:
        holdings_data = get_holdings(auth_token, from_type)
        return JSONResponse(content=holdings_data)
    except Exception as e:
        logger.error(f"Holdings request failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Holdings request failed: {str(e)}")

@app.get("/api/get_networks")
async def api_get_networks(request: Request):
    """
    Endpoint to get networks.
    
    Args:
        request: FastAPI request object
        
    Returns:
        JSONResponse: Networks data
        
    Raises:
        HTTPException: If networks request fails
    """
    try:
        networks_data = get_networks()
        return JSONResponse(content=networks_data)
    except Exception as e:
        logger.error(f"Networks request failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Networks request failed: {str(e)}")

@app.post("/api/linktoken_transfer")
async def linktoken_transfer(
    amount: float = Body(..., embed=True)
):
    """
    Create a link token for a transfer.
    
    Args:
        amount: Transfer amount
        
    Returns:
        Dict: Link token data
        
    Raises:
        HTTPException: If token creation fails
    """
    try:
        resp = requests.post(
            f"{settings.mesh_api_base}/api/v1/linktoken",
            headers=get_mesh_headers(),
            json={
                "userId": "demo-user",
                "restrictMultipleAccounts": True,
                "transferOptions": {
                    "amount": amount,
                    "toAddresses": [
                        {
                            "networkId": settings.coinbase_network_id,
                            "symbol": "USDC",
                            "address": settings.to_address,
                            "amount": amount,
                        }
                    ],
                },
            },
            timeout=DEFAULT_TIMEOUT,
        )
        resp.raise_for_status()
        link_token = resp.json()["content"]["linkToken"]
        return {"link_token": link_token}
    except Exception as e:
        logger.exception("Transfer token failed")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rainbow_to_coinbase_transfer")
async def rainbow_to_coinbase_transfer(request_data: TransferRequest):
    """
    Create a link token specifically for Rainbow to Coinbase transfers.
    
    Args:
        request_data: Transfer request data
        
    Returns:
        Dict: Request ID and link token
        
    Raises:
        HTTPException: If transfer initialization fails
    """
    request_id = request_data.request_id or str(uuid.uuid4())
    coinbase_address = settings.coinbase_wallet_address
    
    try:
        # Create a link token with Coinbase as the destination
        resp = requests.post(
            f"{settings.mesh_api_base}/api/v1/linktoken",
            headers=get_mesh_headers(),
            json={
                "userId": "rainbow-coinbase-user",
                "restrictMultipleAccounts": True,
                "transferOptions": {
                    "amount": request_data.amount,
                    "toAddresses": [
                        {
                            "networkId": settings.coinbase_network_id,
                            "symbol": "USDC",
                            "address": coinbase_address,
                            "amount": request_data.amount,
                        }
                    ],
                },
            },
            timeout=DEFAULT_TIMEOUT,
        )
        resp.raise_for_status()
        link_token = resp.json()["content"]["linkToken"]
        
        # Record as pending in storage
        transfer_storage[request_id] = {
            "status": PENDING_STATUS,
            "amount": request_data.amount,
            "tx_hash": None,
        }
        
        return {"request_id": request_id, "link_token": link_token}
    except Exception as e:
        logger.exception("Rainbow to Coinbase transfer initialization failed")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/transfer_request")
async def transfer_request(req: TransferRequest):
    """
    Handle a transfer request.
    
    Args:
        req: Transfer request data
        
    Returns:
        Dict: Request ID and link token
        
    Raises:
        HTTPException: If transfer request fails
    """
    request_id = req.request_id or str(uuid.uuid4())
    try:
        # Call the helper that hits Mesh
        mesh_resp = await linktoken_transfer(amount=req.amount)
        link_token = mesh_resp["link_token"]

        # Record as pending
        transfer_storage[request_id] = {
            "status": PENDING_STATUS,
            "amount": req.amount,
            "tx_hash": None,
        }
        return {"request_id": request_id, "link_token": link_token}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.exception("Transfer_request failed")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/transfer_result")
async def transfer_result(result: TransferResult):
    """
    Browser notifies backend when Mesh fires onTransferFinished.
    
    Args:
        result: Transfer result data
        
    Returns:
        Dict: Status confirmation
        
    Raises:
        HTTPException: If request ID is unknown
    """
    if result.request_id not in transfer_storage:
        raise HTTPException(status_code=404, detail="Unknown request_id")
    transfer_storage[result.request_id].update(
        status=result.status, tx_hash=result.tx_hash
    )
    return {"status": "recorded"}

@app.get("/api/transfer_status/{request_id}")
async def transfer_status(request_id: str):
    """
    Poll for transfer status.
    
    Args:
        request_id: Request ID to check status for
        
    Returns:
        Dict: Transfer status data
        
    Raises:
        HTTPException: If request ID is unknown
    """
    if request_id not in transfer_storage:
        raise HTTPException(status_code=404, detail="Unknown request_id")
    return transfer_storage[request_id]

# --- Main Entry Point ---

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Mesh Backend server on localhost:3000")
    uvicorn.run(app, host="localhost", port=3000)
