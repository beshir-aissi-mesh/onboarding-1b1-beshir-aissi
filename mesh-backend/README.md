# Mesh Backend

This is the backend wrapper for the Mesh to simplify integration.

## Getting Started

### Request Tokens and Authentication

The authentication process uses request tokens to manage the state of user verification. Here's how it works:

1.  **Request a new ID:** Call the `/api/request_id` endpoint to get a unique `request_id`. This ID is used to track the authentication process for a specific user.
2.  **Initialize Authentication:** Call the `/init_auth/{request_id}` endpoint, replacing `{request_id}` with the ID obtained in the previous step. This endpoint will return an HTML page containing an iframe that loads the Mesh authentication interface.
3.  **User Verification:** The user interacts with the Mesh authentication interface within the iframe to verify their identity and connect their account.
4.  **Token Storage:** Once the user successfully completes the verification process, the Mesh interface will send an authentication token back to your backend via the `/api/store_token/{request_id}` endpoint. This token is stored server-side, associated with the `request_id`.
5.  **Retrieve Token:** After the user has completed verification, you can retrieve the stored authentication token by calling the `/api/get_token/{request_id}` endpoint. The token will only be available after the user finishes verification.

## Environment Setup

1.  Create a virtual environment:

    ```bash
    python -m venv venv
    ```

2.  Activate the virtual environment:

    ```bash
    # On macOS and Linux
    source venv/bin/activate

    # On Windows
    .\venv\Scripts\activate
    ```

3.  Install the necessary packages:

    ```bash
    pip install -r requirements.txt
    ```

4.  Create a `.env` file in the `mesh-backend` directory.

## How to Run

1.  Navigate to the `mesh-backend` directory in your terminal.
2.  Run the following command to start the backend service:

    ```bash
    uvicorn main:app --reload
    ```

    This will start the FastAPI application using uvicorn with auto-reloading enabled.

## API Endpoint Usage

The API endpoints are defined in the `main.py` file.
2.  Add the following environment variables to the `.env` file:

    ```
    MESH_CLIENT_ID=your_mesh_client_id
    MESH_API_SECRET=your_mesh_api_secret
    MESH_PROD_API_SECRET=your_mesh_prod_api_secret
    RECEIVING_WALLET_ADDRESS=your_receiving_wallet_address
    PAYMENT_NETWORK_ID=your_payment_network_id
    PAYMENT_SYMBOL=your_payment_symbol
    ```

    Replace the placeholder values with your actual values.

## API Endpoint Usage

The API endpoints are defined in the `main.py` file.

### Initialize Authentication Endpoint

*   Endpoint: `/init_auth` and `/init_auth/{request_id}`
*   Method: `GET`
*   Description: This endpoint serves the HTML page containing the iframe for the Mesh authentication interface. It can be called without a `request_id` to generate a new one, or with an existing `request_id` to resume an authentication flow.
*   Parameters (Path Parameter - optional):
    *   `request_id` (string): The ID of an existing request to resume.
*   Response: (HTML content for the authentication page)

### Dummy Endpoint

*   Endpoint: `/api/dummy`
*   Method: `GET`
*   Description: This endpoint is used to check the server status.
*   Response:
    ```json
    {
      "status": "ok"
    }
    ```

### Request ID Endpoint

*   Endpoint: `/api/request_id`
*   Method: `GET`
*   Description: This endpoint is used to create a new Request ID. This request ID can then be used to call /api/get_token/{request_id} to retrieve an access token asynchronously. 
*   Response:
    ```json
    {
      "request_id": "string"
    }
    ```

### Store Token Endpoint

*   Endpoint: `/api/store_token/{request_id}`
*   Method: `POST`
*   Description: This endpoint is used to store the token from the auth process. Used to store the access token after user verification. 
*   Parameters:
    *   `request_id` (path parameter): The ID of the request.
    *   Request Body (JSON):
        ```json
        {
          "access_token": "string",
          "broker_type": "string"
        }
        ```
*   Response:
    ```json
    {
      "status": "success"
    }
    ```

### Get Token Endpoint

*   Endpoint: `/api/get_token/{request_id}`
*   Method: `GET`
*   Description: This endpoint is used to retrieve a stored token.
*   Parameters:
    *   `request_id` (path parameter): The ID of the request.
*   Response:
    ```json
    {
      "access_token": "string",
      "status": "success",
      "broker_type": "string"
    }
    ```

### Get Link Token Endpoint

*   Endpoint: `/api/get_linktoken`
*   Method: `GET`
*   Description: This endpoint is used to retrieve the link token.
*   Response:
    ```json
    {
      "link_token": "string"
    }
    ```

### Transfer Preview Endpoint

*   Endpoint: `/api/transfer_preview`
*   Method: `GET`
*   Description: This endpoint is used to get a transfer preview.
*   Parameters (Query Parameters):
    *   `auth_token` (string): The authentication token.
    *   `from_type` (string): The type of the source (e.g., "coinbase").
    *   `to_type` (string): The type of the destination (e.g., "kraken").
    *   `to_address` (string): The destination wallet address.
    *   `amount` (float): The amount to transfer.
    *   `address_tag` (string): The address tag (optional).
    *   `symbol` (string): The symbol of the cryptocurrency (e.g., "USDC").
*   Response: (Details of the transfer preview)

### Execute Transfer Endpoint

*   Endpoint: `/api/execute_transfer`
*   Method: `POST`
*   Description: This endpoint is used to execute a transfer.
*   Parameters (Request Body - JSON):
    ```json
    {
      "auth_token": "string",
      "from_type": "string",
      "preview_id": "string",
      "mfa_code": "string"
    }
    ```
*   Response: (Details of the executed transfer)

### Get Holdings Endpoint

*   Endpoint: `/api/get_holdings`
*   Method: `GET`
*   Description: This endpoint is used to get holdings.
*   Parameters (Query Parameters):
    *   `auth_token` (string): The authentication token.
    *   `from_type` (string): The type of the source (e.g., "coinbase").
*   Response: (Details of the holdings)

### Get Networks Endpoint

*   Endpoint: `/api/get_networks`
*   Method: `GET`
*   Description: This endpoint is used to get networks.

## Test Pages

The test pages are located in the `templates` directory.

*   `auth_frame.html`: This page is used to display the authentication frame.
*   `auth_user.html`: This page is used to authenticate a user.
*   `preview_transfer.html`: This page is used to preview a transfer.
*   `execute_transfer.html`: This page is used to execute a transfer.
*   `holdings.html`: This page is used to display holdings.
