# Mesh Backend

This is the backend service for the Mesh project.

## Environment Setup

1.  Create a `.env` file in the `mesh-backend` directory.
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

### Dummy Endpoint

*   Endpoint: `/api/dummy`
*   Method: `GET`
*   Description: This endpoint is used to check the server status.

### Request ID Endpoint

*   Endpoint: `/api/request_id`
*   Method: `GET`
*   Description: This endpoint is used to request a new ID.

### Store Token Endpoint

*   Endpoint: `/api/store_token/{request_id}`
*   Method: `POST`
*   Description: This endpoint is used to store the token from the auth process.

### Get Token Endpoint

*   Endpoint: `/api/get_token/{request_id}`
*   Method: `GET`
*   Description: This endpoint is used to retrieve a stored token.

### Get Link Token Endpoint

*   Endpoint: `/api/get_linktoken`
*   Method: `GET`
*   Description: This endpoint is used to retrieve the link token.

### Transfer Preview Endpoint

*   Endpoint: `/api/transfer_preview`
*   Method: `GET`
*   Description: This endpoint is used to get a transfer preview.

### Execute Transfer Endpoint

*   Endpoint: `/api/execute_transfer`
*   Method: `POST`
*   Description: This endpoint is used to execute a transfer.

### Get Holdings Endpoint

*   Endpoint: `/api/get_holdings`
*   Method: `GET`
*   Description: This endpoint is used to get holdings.

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

## API Documentation

The API documentation is available at `/docs`.
