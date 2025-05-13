# Mesh Backend

## Overview

A FastAPI application that integrates with the Mesh Connect API to facilitate cryptocurrency transfers, authentication, and account management. This backend provides HTML endpoints for user interaction and API endpoints for handling authentication tokens, transfer previews, and transfer execution.

## Getting Started

### Request Tokens and Authentication

The authentication process uses request tokens to manage the state of user verification. Here's how it works:

1.  **Request a new ID:** Call the `/api/request_id` endpoint to get a unique `request_id`. This ID is used to track the authentication process for a specific user.
2.  **Initialize Authentication:** Call the `/init_auth/{request_id}` endpoint, replacing `{request_id}` with the ID obtained in the previous step. This endpoint will return an HTML page containing an iframe that loads the Mesh authentication interface.
3.  **User Verification:** The user interacts with the Mesh authentication interface within the iframe to verify their identity and connect their account.
4.  **Token Storage:** Once the user successfully completes the verification process, the Mesh interface will send an authentication token back to your backend via the `/api/store_token/{request_id}` endpoint. This token is stored server-side, associated with the `request_id`.
5.  **Retrieve Token:** After the user has completed verification, you can retrieve the stored authentication token by calling the `/api/get_token/{request_id}` endpoint. The token will only be available after the user finishes verification.

## Code Architecture

### Organization

The application is structured into logical sections:
- **Imports**: Organized by standard library, third-party, and local imports
- **Constants**: Defined for status values and timeouts
- **Settings and Configuration**: Environment variables and API configurations
- **Data Models**: Pydantic models for request/response validation
- **In-Memory Storage**: Token and transfer storage dictionaries
- **API Utility Functions**: Helper functions for Mesh API interaction
- **HTML Page Routes**: Endpoints for serving HTML pages
- **API Routes**: Endpoints for API interactions

### Storage Mechanisms

The application uses in-memory dictionaries for storage:
- `token_storage`: Stores authentication tokens indexed by request ID
- `transfer_storage`: Stores transfer information indexed by request ID

### Error Handling and Logging

The application uses a comprehensive error handling and logging approach:
- Structured logging with timestamp, module name, and log levels
- Specific error types with descriptive messages
- Consistent HTTP status codes for API errors
- Try/except blocks with appropriate error propagation

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

5.  Add the following environment variables to the `.env` file:

    ```
    MESH_CLIENT_ID=your_mesh_client_id
    MESH_API_SECRET=your_mesh_api_secret
    MESH_PROD_API_SECRET=your_mesh_prod_api_secret
    RECEIVING_WALLET_ADDRESS=your_receiving_wallet_address
    RAINBOW_WALLET_ADDRESS=your_rainbow_wallet_address (for sample rainbow deposit)
    COINBASE_WALLET_ADDRESS=your_coinbase_wallet_address (for sample coinbase deposit)
    SANDBOX=1  # Set to 0 for production
    ```

    Replace the placeholder values with your actual values.

### Configuration Details

The application uses a `Settings` class to manage configuration:

- **Sandbox Mode**: Toggle between sandbox and production environments using the `SANDBOX` environment variable
- **API Endpoints**: Automatically adjust endpoints based on sandbox mode
- **Default Timeout**: Set to 10 seconds for API calls to prevent hanging operations
- **Status Constants**: Standardized status values (pending, success, failed)

## How to Run

1.  Navigate to the `mesh-backend` directory in your terminal.
2.  Run the following command to start the backend service:

    ```bash
    uvicorn main:app --reload
    ```

    or on Windows
    ```powershell
    python -m uvicorn main:app --reload
    ```

    This will start the FastAPI application using uvicorn with auto-reloading enabled.

## Demo Pages

The application includes several demo pages to showcase different Mesh integration patterns:

### Authentication and Wallet Connection
- **Main Auth Interface (`/`)**: Main endpoint serving the iframe-enabled authentication interface
- **Iframe Link (`/iframe_link`)**: Page that embeds the Mesh Link UI inside an iframe
- **Auth User (`/init_auth`)**: Initialize authentication process with a new request ID
- **Auth User with Request ID (`/init_auth/{request_id}`)**: Continue authentication with existing request ID

### Transfer Functionalities
- **Transfer Test (`/transfer_test`)**: Testing page for transfers that allows entering an amount, handles authentication, and executes transfers
- **Rainbow to Coinbase (`/rainbow_to_coinbase`)**: Fixed-amount (5 USDC) transfer from Rainbow wallet to Coinbase

### Rainbow Payment Flow
- **Rainbow Payment (`/rainbow_payment`)**: Start the payment flow to Rainbow wallet
- **Rainbow Preview (`/rainbow_preview`)**: Preview the payment details
- **Rainbow MFA (`/rainbow_mfa`)**: Enter MFA verification code
- **Rainbow Success (`/rainbow_success`)**: Payment success confirmation page

### Other Demo Features
- **Preview Transfer (`/preview_transfer`)**: Page to preview a transfer
- **Execute Transfer (`/execute_transfer`)**: Page to execute a transfer
- **Holdings (`/holdings`)**: Page to display wallet holdings
- **Demo Page (`/demo`)**: Main demo page with various examples

## API Endpoint Reference

### Authentication Endpoints

*   **Request ID Endpoint**
    *   Endpoint: `/api/request_id`
    *   Method: `GET`
    *   Description: Creates a new Request ID for tracking authentication and token retrieval
    *   Response:
        ```json
        {
          "request_id": "string"
        }
        ```
    *   Error Codes: 500 (Server Error)

*   **Store Token Endpoint**
    *   Endpoint: `/api/store_token/{request_id}`
    *   Method: `POST`
    *   Description: Stores the authentication token after user verification
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
    *   Error Codes: 404 (Request ID Not Found)

*   **Get Token Endpoint**
    *   Endpoint: `/api/get_token/{request_id}`
    *   Method: `GET`
    *   Description: Retrieves a stored authentication token
    *   Parameters:
        *   `request_id` (path parameter): The ID of the request
    *   Response:
        ```json
        {
          "access_token": "string",
          "status": "success",
          "broker_type": "string"
        }
        ```
        or if pending:
        ```json
        {
          "status": "pending",
          "message": "Token not yet available"
        }
        ```
    *   Error Codes: 404 (Request ID Not Found)

*   **Get Link Token Endpoint**
    *   Endpoint: `/api/get_linktoken`
    *   Method: `GET`
    *   Description: Retrieves a link token for wallet connection
    *   Response:
        ```json
        {
          "link_token": "string"
        }
        ```
    *   Error Codes: 500 (Failed to Get Link Token)

### Transfer Endpoints

*   **Transfer Preview Endpoint**
    *   Endpoint: `/api/transfer_preview`
    *   Method: `GET`
    *   Description: Gets a preview of a transfer with cost estimates
    *   Parameters (Query Parameters):
        *   `auth_token` (string, required): The authentication token
        *   `from_type` (string, required): The type of the source (e.g., "coinbase")
        *   `to_type` (string, required): The type of the destination (e.g., "kraken")
        *   `to_address` (string, required): The destination wallet address
        *   `amount` (float, required): The amount to transfer
        *   `symbol` (string, required): The symbol of the cryptocurrency (e.g., "USDC")
        *   `address_tag` (string, optional): The address tag if required
    *   Response: Details of the transfer preview
    *   Error Codes: 500 (Transfer Preview Failed)

*   **Execute Transfer Endpoint**
    *   Endpoint: `/api/execute_transfer`
    *   Method: `POST`
    *   Description: Executes a transfer with or without MFA
    *   Parameters (Request Body - JSON):
        ```json
        {
          "auth_token": "string",
          "from_type": "string",
          "preview_id": "string",
          "mfa_code": "string"
        }
        ```
    *   Response: Details of the executed transfer
    *   Error Codes: 
        * 500 (Internal Server Error)
        * Other codes from execute_transfer function

*   **Link Token Transfer Endpoint**
    *   Endpoint: `/api/linktoken_transfer`
    *   Method: `POST`
    *   Description: Creates a link token specifically for transfers
    *   Parameters:
        *   Request Body: `{ "amount": number }`
    *   Response: `{ "link_token": "string" }`
    *   Error Codes: 500 (Transfer Token Failed)

*   **Rainbow to Coinbase Transfer Endpoint**
    *   Endpoint: `/api/rainbow_to_coinbase_transfer`
    *   Method: `POST`
    *   Description: Creates a link token for Rainbow to Coinbase transfers
    *   Parameters:
        *   Request Body: `{ "amount": number, "request_id"?: string }`
    *   Response: `{ "request_id": "string", "link_token": "string" }`
    *   Error Codes: 500 (Transfer Initialization Failed)

*   **Transfer Request Endpoint**
    *   Endpoint: `/api/transfer_request`
    *   Method: `POST`
    *   Description: Initiates a transfer request
    *   Parameters:
        *   Request Body: `{ "amount": number, "request_id"?: string }`
    *   Response: `{ "request_id": "string", "link_token": "string" }`
    *   Error Codes: 500 (Transfer Request Failed)

*   **Transfer Result Endpoint**
    *   Endpoint: `/api/transfer_result`
    *   Method: `POST`
    *   Description: Reports the transfer result from the client
    *   Parameters:
        *   Request Body: `{ "request_id": "string", "status": "string", "tx_hash"?: "string" }`
    *   Response: `{ "status": "recorded" }`
    *   Error Codes: 404 (Unknown Request ID)

*   **Transfer Status Endpoint**
    *   Endpoint: `/api/transfer_status/{request_id}`
    *   Method: `GET`
    *   Description: Gets the status of a transfer
    *   Parameters:
        *   `request_id` (path parameter): The ID of the transfer request
    *   Response: Status information about the transfer
    *   Error Codes: 404 (Unknown Request ID)

### Other API Endpoints

*   **Get Holdings Endpoint**
    *   Endpoint: `/api/get_holdings`
    *   Method: `GET`
    *   Description: Gets holdings information for a wallet
    *   Parameters (Query Parameters):
        *   `auth_token` (string, required): The authentication token
        *   `from_type` (string, required): The type of the wallet/exchange
    *   Response: Holdings information including cryptocurrency positions
    *   Error Codes: 500 (Holdings Request Failed)

*   **Get Networks Endpoint**
    *   Endpoint: `/api/get_networks`
    *   Method: `GET`
    *   Description: Gets available networks for transfers
    *   Response: List of available networks
    *   Error Codes: 500 (Networks Request Failed)

*   **Dummy Endpoint**
    *   Endpoint: `/api/dummy`
    *   Method: `GET`
    *   Description: Simple endpoint to check server status
    *   Response:
        ```json
        {
          "status": "ok"
        }
        ```

## Development Guide

### Coding Standards

The codebase follows these standards:
- Type annotations using Python's typing module
- Docstrings in all functions with parameter and return type descriptions
- Organized imports (standard library, third-party, local)
- Constants for magic values
- Clear section organization

### Logging

The application uses Python's built-in logging module with:
- INFO level for normal operation
- ERROR level for API failures and exceptions
- WARNING level for non-critical issues
- Consistent format with timestamps

### Performance Considerations

- Default timeout of 10 seconds for external API calls
- Error handling to prevent hanging operations
- In-memory storage for low overhead

## Future Improvements

### Local Transaction Storage

The current implementation stores transaction information in-memory, which is lost when the server restarts. A future improvement would be to implement persistent storage for transactions, similar to the request_tokens mechanism. This could be achieved by:

1. Creating a TransactionManager class to handle transaction storage and retrieval
2. Using a SQLite database for simple deployments
3. Implementing a transaction status update mechanism
4. Adding endpoints to query transaction history

Example implementation:

```python
from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

Base = declarative_base()

class Transaction(Base):
    __tablename__ = 'transactions'
    
    request_id = Column(String, primary_key=True)
    status = Column(String)
    amount = Column(Float)
    tx_hash = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    source_type = Column(String)
    destination_type = Column(String)
    
# Initialize database
engine = create_engine('sqlite:///transactions.db')
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
```

### Transaction Polling System

Building on the local storage, a transaction polling system would allow users to:
1. Submit a transaction request
2. Receive immediate confirmation of request receipt
3. Poll an endpoint to check transaction status
4. Receive updates as the transaction progresses

This would enable:
- Better integration with client applications
- Asynchronous transaction processing
- Robust error recovery

Example endpoints to add:
- GET `/api/transactions/status/{tx_id}` - Get current status
- GET `/api/transactions/history` - List recent transactions
- GET `/api/transactions/pending` - List pending transactions

### Integration Simplification

The improvements above would allow users to easily facilitate transactions using both Mesh Link and direct API with minimal configuration:

1. **Link SDK Integration**: Using the existing patterns but with persistent storage
2. **Direct API Integration**: With enhanced error handling and status tracking
3. **Unified API**: Common interfaces for both methods

This would significantly reduce the implementation effort for new projects integrating with the Mesh API.

### Database Integration

For production use, in-memory storage should be replaced with a database solution:

1. **SQLite**: For simple deployments and testing
2. **PostgreSQL**: For high-reliability production environments
3. **MongoDB**: For flexible schema requirements

The data models are already structured for easy migration to a database ORM.

### Webhook Support

Adding webhook capabilities would allow for proactive notification of transaction status changes:

1. Configuration endpoint to register webhook URLs
2. Event system to trigger notifications
3. Retry mechanisms for failed webhook deliveries
4. Security mechanisms (signing, authentication) for webhook payloads

## Additional Resources

- [Mesh API Documentation](https://docs.meshconnect.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Uvicorn ASGI Server](https://www.uvicorn.org/)

## Troubleshooting

### Common Issues

- **Authentication Errors**: Check client ID and secret in .env file
- **Network Timeouts**: Ensure proper internet connectivity
- **Invalid Tokens**: Tokens expire after some time; request a new token if authentication fails
- **Transfer Failures**: Verify account balances and wallet addresses
- **MFA Issues**: Ensure MFA codes are entered correctly and within time limits

### Debugging

When encountering issues:

1. Check the application logs for detailed error messages
2. Verify environment variables are correctly set
3. Ensure the Mesh API is accessible
4. Test with the dummy endpoint to verify server connectivity
