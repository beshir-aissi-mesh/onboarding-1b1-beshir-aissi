import pyglet
from pyglet.window import key
import webbrowser
import requests

import overlay_ui

# Helper functions to fetch data from a an API
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
    """Updates the visual representation of a tile on the map."""
    global map_shapes_grid # Make sure this is accessible
    global COLOR_WALL, COLOR_GRASS, COLOR_SPECIAL # Make colors accessible

    if not (0 <= grid_y < MAP_HEIGHT_TILES and 0 <= grid_x < MAP_WIDTH_TILES):
        print(f"Error: Coordinates ({grid_x}, {grid_y}) out of bounds for visual update.")
        return

    shape_to_update = map_shapes_grid[grid_y][grid_x]
    if shape_to_update:
        new_color = shape_to_update.color # Default to current if type unknown
        if new_tile_type_code == 1: # Wall
            new_color = COLOR_WALL
        elif new_tile_type_code == 0: # Grass
            new_color = COLOR_GRASS
        elif new_tile_type_code == 2: # Special Tile
            new_color = COLOR_SPECIAL
        # Add more cases if you have other tile types

        shape_to_update.color = new_color
        # print(f"Visual for tile ({grid_x},{grid_y}) updated.") # Optional debug
    else:
        print(f"Error: No visual shape found for tile ({grid_x},{grid_y}) to update.")

# --- Configuration ---
TILE_SIZE = 128*1.5  # Pixels
WINDOW_WIDTH = 15 * TILE_SIZE  # 15 tiles wide
WINDOW_HEIGHT = 10 * TILE_SIZE # tiles high

window = pyglet.window.Window(WINDOW_WIDTH, WINDOW_HEIGHT, caption="Mesh Demo")
batch = pyglet.graphics.Batch()

overlay_ui.init_overlay_system(WINDOW_WIDTH, WINDOW_HEIGHT)

MAP_DATA = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 2, 0, 3, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 5, 0, 0, 4, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], # 2 is a special tile (e.g. tall grass)
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]
MAP_HEIGHT_TILES = len(MAP_DATA)
MAP_WIDTH_TILES = len(MAP_DATA[0])

COLOR_GRASS = (50, 150, 50)
COLOR_WALL = (100, 100, 100)
COLOR_PLAYER = (255, 0, 0)
COLOR_SPECIAL = (30, 100, 30)
COLOR_VERIFY = (16, 232, 164)
COLOR_BALANCE = (0, 0, 255)
COLOR_SHOP = (232, 185, 16)

# Player state (grid coordinates)
player_x = 1 # Starting column
player_y = 1 # Starting row

tile_sprites = [] # To hold our tile shapes/sprites
map_tiles = []    # To hold the shapes for tiles
map_shapes_grid = [[None for _ in range(MAP_WIDTH_TILES)] for _ in range(MAP_HEIGHT_TILES)]

def create_tile_shape(x_pixel, y_pixel, color):
    """Creates a rectangle shape for a tile."""
    return pyglet.shapes.Rectangle(
        x_pixel, y_pixel, TILE_SIZE, TILE_SIZE, color=color, batch=batch
    )

# Create map visuals
for r_idx, row in enumerate(MAP_DATA):
    for c_idx, tile_type in enumerate(row):
        # Pyglet's Y is bottom-up, map data is often top-down
        # So we invert the row index for drawing
        pixel_x = c_idx * TILE_SIZE
        pixel_y = (MAP_HEIGHT_TILES - 1 - r_idx) * TILE_SIZE # Invert Y for drawing

        color_array = [COLOR_GRASS, COLOR_WALL, COLOR_SPECIAL, COLOR_VERIFY, COLOR_BALANCE, COLOR_SHOP]
        if tile_type >= len(color_array):
            print(f"Error: Tile type {tile_type} out of bounds for color array. Defaulting to grass.")
            tile_type = 0

        current_color = color_array[tile_type]
        map_tiles.append(create_tile_shape(pixel_x, pixel_y, current_color))

        shape = pyglet.shapes.Rectangle(
            pixel_x, pixel_y, TILE_SIZE, TILE_SIZE, color=current_color, batch=batch
        )
        map_shapes_grid[r_idx][c_idx] = shape # Store in the 2D grid
        

# Player visual (a red square)
# Note: player_sprite's x, y will be updated based on player_x, player_y grid coords
player_sprite = pyglet.shapes.Circle(
    x=player_x * TILE_SIZE + TILE_SIZE // 2,  # Center X coordinate
    y=(MAP_HEIGHT_TILES - 1 - player_y) * TILE_SIZE + TILE_SIZE // 2,  # Center Y coordinate
    radius=TILE_SIZE // 2,  # Half tile size for radius
    color=COLOR_PLAYER,
    batch=batch
)

# --- Game Logic ---
def is_walkable(grid_x, grid_y):
    """Checks if a tile at given grid coordinates is walkable."""
    if not (0 <= grid_x < MAP_WIDTH_TILES and 0 <= grid_y < MAP_HEIGHT_TILES):
        return False # Out of bounds
    tile_type = MAP_DATA[grid_y][grid_x] # Access map data with [y][x]
    return tile_type != 1 # Not a wall

def update_player_sprite_position():
    """Updates the visual sprite's pixel position based on grid position."""
    player_sprite.x = player_x * TILE_SIZE + TILE_SIZE // 2  # Center X coordinate
    # Invert Y for drawing because map data is [row from top][col from left]
    # and Pyglet's origin is bottom-left
    player_sprite.y = (MAP_HEIGHT_TILES - 1 - player_y) * TILE_SIZE + TILE_SIZE // 2  # Center Y coordinate

request_id = None
auth_token = None
from_type = None
to_address = "0x0000000000000000F0F000000000ffFf00f0F0f0"
network_id = "e3c7fdd8-b1fc-4e51-85ae-bb276e075611"

@window.event # Assuming 'window' is your pyglet.window.Window instance
def on_key_press(symbol, modifiers):
    global player_x, player_y # For modifying player's grid position
    global request_id, auth_token, from_type, to_address, network_id

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
        if current_tile_type == 2: # Player landed on a special tile
            print("Player is on a special tile (AUTH)!")

            # Your existing auth logic
            request_id = fetch_data("http://localhost:3000/api/request_id")['request_id']
            webbrowser.open(f"http://localhost:3000/init_auth/{request_id}")



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

        elif current_tile_type == 3: # verification tile
            if request_id:
                request_fetch = fetch_data(f"http://localhost:3000/api/get_token/{request_id}")
                if request_fetch["status"] == "success":
                    wall_target_x = player_x - 1
                    wall_target_y = player_y
                    grass_target_x = player_x + 1
                    grass_target_y = player_y

                    MAP_DATA[wall_target_y][wall_target_x] = 1
                    update_tile_visual(wall_target_x, wall_target_y, 1)
                    MAP_DATA[grass_target_y][grass_target_x] = 0
                    update_tile_visual(grass_target_x, grass_target_y, 0)

                    auth_token = request_fetch["access_token"]
                    from_type = request_fetch["broker_type"]
        
        elif current_tile_type == 4: # balance tile
            if request_id:
                request_fetch = fetch_data(f"http://localhost:3000/api/get_holdings", params={"auth_token": auth_token, "from_type": from_type})
                overlay_ui.show(request_fetch)
        
        elif current_tile_type == 5: # shop tile
            if request_id:
                request_fetch = fetch_data(f"http://localhost:3000/api/transfer_preview", params={
                    "auth_token": auth_token,
                    "from_type": from_type,
                    "to_type": from_type,
                    "to_address": to_address,
                    "amount": 4,
                    "address_tag": "",
                    "symbol": "USDC",
                    "network_id": network_id
                })
                print(f"Transfer Preview: {request_fetch}")
                response = request_fetch["content"]
                preview_id = response["previewResult"]["previewId"]
                mfa_code = "123456"

                request_fetch = fetch_data(f"http://localhost:3000/api/execute_transfer", type="POST", params={
                    "auth_token": auth_token,
                    "from_type": from_type,
                    "preview_id": preview_id,
                    "mfa_code": mfa_code,
                })

                print(f"Transfer Execution: {request_fetch}")

        
        elif current_tile_type == 0:
            overlay_ui.hide()


@window.event
def on_draw():
    window.clear()
    batch.draw()
    overlay_ui.draw()

# Initial player sprite position update
update_player_sprite_position()

pyglet.app.run()
