import pyglet
from pyglet.window import key
import webbrowser
import requests

import overlay_ui

# --- Configuration ---
TILE_SIZE = 64  # Pixels
WINDOW_WIDTH = int(15 * TILE_SIZE)  # 15 tiles wide
WINDOW_HEIGHT = int(10 * TILE_SIZE) # tiles high

# Colors (will be mostly replaced by sprites, but kept for reference or fallbacks)
COLOR_PLAYER_FALLBACK = (255, 0, 0)
COLOR_HAT_FALLBACK = (0, 0, 0) # Black color for the hat

# Map Data (Tile types: 0=Grass, 1=Wall, 2=AUTH, 3=VERIFY, 4=BALANCE, 5=SHOP)
MAP_DATA = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 5, 0, 0, 4, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]
MAP_HEIGHT_TILES = len(MAP_DATA)
MAP_WIDTH_TILES = len(MAP_DATA[0])

# Player state (grid coordinates and hat status)
player_x = 1 # Starting column
player_y = 1 # Starting row
has_hat = False # New state variable for the hat

# Global variables for API interaction state
request_id = None
auth_token = None
from_type = None
to_address = "0x0000000000000000F0F000000000ffFf00f0F0f0" # Example address
network_id = "e3c7fdd8-b1fc-4e51-85ae-bb276e075611" # Example network ID

# Pyglet setup
window = pyglet.window.Window(WINDOW_WIDTH, WINDOW_HEIGHT, caption="Mesh Demo")
batch = pyglet.graphics.Batch()
overlay_ui.init_overlay_system(WINDOW_WIDTH, WINDOW_HEIGHT)

# --- Load Assets ---
def load_image(filename):
    img = pyglet.image.load(f"./assets/{filename}.png")
    # Set anchor to center for easier positioning if needed, though for tiles, bottom-left is fine.
    # img.anchor_x = img.width // 2
    # img.anchor_y = img.height // 2
    return img

player_image = load_image("player")
hat_image = load_image("hat")
grass_tile_image = load_image("grass_tile")
wall_tile_image = load_image("wall_tile")
auth_tile_image = load_image("auth_tile")
verify_tile_image = load_image("verify_tile")
balance_tile_image = load_image("balance_tile")
shop_tile_image = load_image("shop_tile")

# Store tile images in a list for easy access by type code
TILE_IMAGES = [
    grass_tile_image,    # 0
    wall_tile_image,     # 1
    auth_tile_image,     # 2
    verify_tile_image,   # 3
    balance_tile_image,  # 4
    shop_tile_image      # 5
]

# Map visuals storage (will store sprites)
map_sprites_grid = [[None for _ in range(MAP_WIDTH_TILES)] for _ in range(MAP_HEIGHT_TILES)]

# Player and Hat sprites
player_sprite = None
hat_sprite = None

# --- Helper Functions ---
def fetch_data(url, params=None, type="GET"):
    """Fetches data from a given URL and returns the JSON response."""
    try:
        payload = params if params else {}
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        if type == "POST":
            response = requests.post(url, headers=headers, json=payload)
        else:
            response = requests.get(url, headers=headers, params=payload)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def update_tile_visual(grid_x, grid_y, new_tile_type_code):
    """Updates the visual representation of a tile on the map by changing its sprite image."""
    global map_sprites_grid, TILE_IMAGES

    if not (0 <= grid_y < MAP_HEIGHT_TILES and 0 <= grid_x < MAP_WIDTH_TILES):
        print(f"Error: Coordinates ({grid_x}, {grid_y}) out of bounds for visual update.")
        return

    sprite_to_update = map_sprites_grid[grid_y][grid_x]
    if sprite_to_update:
        if 0 <= new_tile_type_code < len(TILE_IMAGES):
            sprite_to_update.image = TILE_IMAGES[new_tile_type_code]
            # print(f"Visual for tile ({grid_x},{grid_y}) updated to type {new_tile_type_code}.")
        else:
            print(f"Warning: New tile type code {new_tile_type_code} out of bounds for TILE_IMAGES. Defaulting to grass.")
            sprite_to_update.image = TILE_IMAGES[0] # Default to grass
    else:
        print(f"Error: No sprite found for tile ({grid_x},{grid_y}) to update.")

# create_tile_shape is no longer needed as we use sprites directly

def is_walkable(grid_x, grid_y):
    """Checks if a tile at given grid coordinates is walkable."""
    if not (0 <= grid_x < MAP_WIDTH_TILES and 0 <= grid_y < MAP_HEIGHT_TILES):
        return False # Out of bounds
    tile_type = MAP_DATA[grid_y][grid_x] # Access map data with [y][x]
    return tile_type != 1 # Not a wall

def update_player_sprite_position():
    """Updates the visual sprite's pixel position based on grid position."""
    global player_sprite, hat_sprite # Need to access global sprites

    # Calculate bottom-left corner for player sprite based on grid position
    # Player sprite's origin is its bottom-left.
    player_pixel_x = player_x * TILE_SIZE
    player_pixel_y = (MAP_HEIGHT_TILES - 1 - player_y) * TILE_SIZE

    player_sprite.x = player_pixel_x
    player_sprite.y = player_pixel_y
    
    # Update hat position relative to the player
    if hat_sprite:
        hat_offset_y_pixels = TILE_SIZE * (12 / 32.0) # Shift hat up by 12 'original' pixels

        hat_sprite.x = player_pixel_x 
        hat_sprite.y = player_pixel_y + hat_offset_y_pixels
        

# --- Game Setup (Create map and player and hat visuals) ---
def setup_game():
    global player_sprite, hat_sprite, map_sprites_grid, TILE_IMAGES # Need to access global sprites
    
    # Create map sprites
    for r_idx, row in enumerate(MAP_DATA):
        for c_idx, tile_type in enumerate(row):
            pixel_x = c_idx * TILE_SIZE
            pixel_y = (MAP_HEIGHT_TILES - 1 - r_idx) * TILE_SIZE # Invert Y for drawing

            if 0 <= tile_type < len(TILE_IMAGES):
                tile_image_to_use = TILE_IMAGES[tile_type]
            else:
                print(f"Error: Tile type {tile_type} out of bounds for TILE_IMAGES. Defaulting to grass.")
                tile_image_to_use = TILE_IMAGES[0] # Default to grass
            
            tile_sprite = pyglet.sprite.Sprite(
                img=tile_image_to_use,
                x=pixel_x, y=pixel_y,
                batch=batch
            )
            tile_sprite.scale = TILE_SIZE / tile_sprite.width # Assuming square sprites (32x32)
            map_sprites_grid[r_idx][c_idx] = tile_sprite
            
    # Player sprite
    player_sprite = pyglet.sprite.Sprite(
        img=player_image,
        batch=batch
    )
    player_sprite.scale = TILE_SIZE / player_sprite.width # Scale player to fill a tile

    # Hat sprite
    hat_sprite = pyglet.sprite.Sprite(
        img=hat_image,
        batch=batch
    )
    hat_sprite.scale = TILE_SIZE / hat_sprite.width # Scale hat to fill a tile (relative positioning is key)
    hat_sprite.visible = False # Hat is not visible initially

    # Initial player and hat sprite position update
    update_player_sprite_position()

setup_game() # Call the setup function

# --- Event Handlers ---
@window.event
def on_key_press(symbol, modifiers):
    global player_x, player_y, request_id, auth_token, from_type, to_address, network_id, has_hat # Declare all globals at the start

    next_x, next_y = player_x, player_y

    if symbol == key.UP:
        next_y -= 1
    elif symbol == key.DOWN:
        next_y += 1
    elif symbol == key.LEFT:
        next_x -= 1
    elif symbol == key.RIGHT:
        next_x += 1
    else:
        return  # Not an arrow key

    if is_walkable(next_x, next_y):
        player_x = next_x
        player_y = next_y
        update_player_sprite_position()

        current_tile_type = MAP_DATA[player_y][player_x]

        if current_tile_type == 2: # Player landed on a special tile (AUTH)
            print("Player is on a special tile (AUTH)!")

            # Your existing auth logic
            request_data = fetch_data("http://127.0.0.1:8000/api/request_id")
            if request_data and request_data.get('request_id'):
                request_id = request_data['request_id']
                webbrowser.open(f"http://127.0.0.1:8000/init_auth/{request_id}")

                # --- Add wall to the LEFT of the player's CURRENT position ---
                wall_target_x = player_x - 1
                wall_target_y = player_y

                print(f"Attempting to place wall at ({wall_target_x}, {wall_target_y}). Player is at ({player_x}, {player_y})")

                # Boundary check: ensure wall_target_x is within map bounds
                if 0 <= wall_target_x < MAP_WIDTH_TILES:
                    if MAP_DATA[wall_target_y][wall_target_x] != 1:
                        MAP_DATA[wall_target_y][wall_target_x] = 1  # Update logical map: 1 means wall
                        update_tile_visual(wall_target_x, wall_target_y, 1) # Update visual to wall

                # --- Add wall to three tiles to the RIGHT of the player's CURRENT position ---
                wall_target_x = player_x + 3
                wall_target_y = player_y

                print(f"Attempting to place wall at ({wall_target_x}, {wall_target_y}). Player is at ({player_x}, {player_y})")

                # Boundary check: ensure wall_target_x is within map bounds
                if 0 <= wall_target_x < MAP_WIDTH_TILES:
                    # Check if the tile to the left is not already a wall
                    if MAP_DATA[wall_target_y][wall_target_x] != 1:
                        MAP_DATA[wall_target_y][wall_target_x] = 1  # Update logical map: 1 means wall
                        update_tile_visual(wall_target_x, wall_target_y, 1) # Update visual to wall
            else:
                print("Failed to get request_id for authentication.")


        elif current_tile_type == 3: # verification tile
            print("Player is on a verification tile!")
            if request_id:
                request_fetch = fetch_data(f"http://127.0.0.1:8000/api/get_token/{request_id}")
                if request_fetch and request_fetch.get("status") == "success":
                    wall_target_x = player_x - 1
                    wall_target_y = player_y
                    grass_target_x = player_x + 1
                    grass_target_y = player_y

                    # Assuming these walls/grass are related to the auth flow
                    if 0 <= wall_target_x < MAP_WIDTH_TILES:
                         MAP_DATA[wall_target_y][wall_target_x] = 1
                         update_tile_visual(wall_target_x, wall_target_y, 1)
                    if 0 <= grass_target_x < MAP_WIDTH_TILES:
                         MAP_DATA[grass_target_y][grass_target_x] = 0
                         update_tile_visual(grass_target_x, grass_target_y, 0)

                    auth_token = request_fetch["access_token"]
                    from_type = request_fetch["broker_type"]
                    print("Authentication successful! Token obtained.")
                else:
                    print("Authentication failed or token not received.")
            else:
                print("No active request_id for verification.")
        
        elif current_tile_type == 4: # balance tile
            print("Player is on a balance tile!")
            if request_id and auth_token and from_type:
                request_fetch = fetch_data(f"http://127.0.0.1:8000/api/get_holdings", params={"auth_token": auth_token, "from_type": from_type})
                if request_fetch:
                    overlay_ui.show(request_fetch)
                    print("Holdings displayed.")
                else:
                    print("Failed to fetch holdings.")
            else:
                print("Authentication required to check balance.")
        
        elif current_tile_type == 5: # shop tile
            print("Player is on a shop tile!")
            if request_id and auth_token and from_type:
                # Check if player already has a hat
                if has_hat:
                    print("Player already has a hat!")
                    return # Do nothing if player already has a hat

                # Attempt to purchase item (transfer USDC)
                request_fetch = fetch_data(f"http://127.0.0.1:8000/api/transfer_preview", params={
                    "auth_token": auth_token,
                    "from_type": from_type,
                    "to_type": from_type,
                    "to_address": to_address,
                    "amount": 4, # Assuming cost is 4 USDC
                    "address_tag": "",
                    "symbol": "USDC",
                    "network_id": network_id
                })
                print(f"Transfer Preview: {request_fetch}")
                print(f"Status: {request_fetch.get('status') if request_fetch else 'No response'}")

                # Check if preview was successful before proceeding
                if request_fetch and request_fetch.get("status") == "ok":
                    response_content = request_fetch.get("content")
                    if response_content and response_content.get("previewResult") and response_content["previewResult"].get("previewId"):
                        preview_id = response_content["previewResult"]["previewId"]
                        mfa_code = "123456" # This seems hardcoded, might need clarification later

                        execute_fetch = fetch_data(f"http://127.0.0.1:8000/api/execute_transfer", type="POST", params={
                            "auth_token": auth_token,
                            "from_type": from_type,
                            "preview_id": preview_id,
                            "mfa_code": mfa_code,
                        })

                        print(f"Transfer Execution: {execute_fetch}")

                        # Check if execution was successful
                        if execute_fetch and execute_fetch.get("status") == "ok":
                            has_hat = True
                            print("Purchase successful! Player got a hat.")
                            if hat_sprite:
                                hat_sprite.visible = True # Make the hat visible

                            # Remove the shop tile by changing it to grass
                            MAP_DATA[player_y][player_x] = 0 # Change tile type to grass (0)
                            update_tile_visual(player_x, player_y, 0) # Update visual to grass
                            print(f"Shop tile at ({player_x}, {player_y}) removed.")
                        else:
                            print("Transfer execution failed.")
                    else:
                        print("Transfer preview content missing or invalid.")
                else:
                    print("Transfer preview failed.")
            else:
                print("Authentication required to use the shop.")

        
        elif current_tile_type == 0: # Player is on a grass tile
            overlay_ui.hide()
            # print("Player is on a grass tile.") # Optional debug

@window.event
def on_draw():
    window.clear()
    batch.draw()
    overlay_ui.draw()

# --- Main Game Loop ---
if __name__ == "__main__":
    pyglet.app.run()
