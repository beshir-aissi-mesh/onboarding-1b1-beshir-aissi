# overlay_ui.py
import pyglet

# --- Overlay Configuration & State (managed within this module) ---
_OVERLAY_VISIBLE = False
_overlay_batch = None
_overlay_background_group = None
_overlay_foreground_group = None
_overlay_elements = []

# --- Styling Constants ---
STYLE = {
    "BG_COLOR": (0, 0, 0, 200),
    "TEXT_COLOR": (220, 220, 220, 255),
    "HEADER_COLOR": (255, 255, 255, 255),
    "PADDING": 20,
    "LINE_HEIGHT": 25,
    "FONT_NAME": 'Arial',
    "FONT_SIZE_NORMAL": 20,
    "FONT_SIZE_HEADER": 24,
    "FONT_SIZE_TITLE": 30,
}

_WINDOW_WIDTH = 0
_WINDOW_HEIGHT = 0

def init_overlay_system(window_width, window_height, game_graphics_group_level=0):
    global _overlay_batch, _overlay_background_group, _overlay_foreground_group
    global _WINDOW_WIDTH, _WINDOW_HEIGHT

    _WINDOW_WIDTH = window_width
    _WINDOW_HEIGHT = window_height

    _overlay_batch = pyglet.graphics.Batch()
    _overlay_background_group = pyglet.graphics.Group(order=game_graphics_group_level + 1)
    _overlay_foreground_group = pyglet.graphics.Group(order=game_graphics_group_level + 2)
    # print("Overlay system initialized.")

def _clear_overlay_elements():
    global _overlay_elements
    for element in _overlay_elements:
        element.delete()
    _overlay_elements = []

def create_financial_overlay(data_dict):
    global _overlay_elements, _OVERLAY_VISIBLE

    if not _overlay_batch:
        print("Error: Overlay system not initialized. Call init_overlay_system() first.")
        return

    _clear_overlay_elements()

    if not data_dict or 'content' not in data_dict or 'cryptocurrencyPositions' not in data_dict['content']:
        # ... (error handling as before) ...
        error_label = pyglet.text.Label( # Copied from previous for brevity
            "Error: Could not load financial data.", font_name=STYLE["FONT_NAME"], font_size=STYLE["FONT_SIZE_NORMAL"],
            color=STYLE["TEXT_COLOR"], x=_WINDOW_WIDTH / 2, y=_WINDOW_HEIGHT / 2, anchor_x='center', anchor_y='center',
            batch=_overlay_batch, group=_overlay_foreground_group
        )
        _overlay_elements.append(error_label)
        _OVERLAY_VISIBLE = True
        return


    content = data_dict['content']
    crypto_positions = content.get('cryptocurrencyPositions', [])
    institution_name = content.get('institutionName', 'N/A')
    account_name = content.get('accountName', 'N/A')

    bg_width = _WINDOW_WIDTH * 0.9 # Might need to make overlay wider for more columns
    bg_height = _WINDOW_HEIGHT * 0.8
    bg_x = (_WINDOW_WIDTH - bg_width) / 2
    bg_y = (_WINDOW_HEIGHT - bg_height) / 2

    background_shape = pyglet.shapes.Rectangle(
        bg_x, bg_y, bg_width, bg_height,
        color=STYLE["BG_COLOR"],
        batch=_overlay_batch,
        group=_overlay_background_group
    )
    _overlay_elements.append(background_shape)

    current_y = bg_y + bg_height - STYLE["PADDING"]

    title_text = f"{institution_name} - {account_name}"
    title_label = pyglet.text.Label(
        title_text, font_name=STYLE["FONT_NAME"], font_size=STYLE["FONT_SIZE_TITLE"],
        color=STYLE["HEADER_COLOR"], x=bg_x + bg_width / 2, y=current_y,
        anchor_x='center', anchor_y='top', batch=_overlay_batch, group=_overlay_foreground_group
    )
    _overlay_elements.append(title_label)
    current_y -= STYLE["FONT_SIZE_TITLE"] + STYLE["PADDING"]

    if crypto_positions:
        header_y = current_y
        num_cols = 5 # Now 5 columns: Name, Symbol, Amount, Cost Basis, Total Value
        effective_bg_width = bg_width - (2 * STYLE["PADDING"]) # Content area

        # Define relative widths for columns (sum should ideally be close to 1.0 or handled)
        # These are proportions of the effective_bg_width
        col_proportions = {
            "Name": 0.28,
            "Symbol": 0.12,
            "Amount": 0.15,
            "Cost Basis": 0.20,
            "Total Value": 0.25  # Give total value a bit more space
        }

        # Calculate absolute widths
        col_widths = {name: effective_bg_width * prop for name, prop in col_proportions.items()}


        headers_info = [
            ("Name", col_widths["Name"], 'left'),
            ("Symbol", col_widths["Symbol"], 'center'),
            ("Amount", col_widths["Amount"], 'center'),
            ("Cost Basis", col_widths["Cost Basis"], 'center'), # Changed to center for consistency
            ("Total Value", col_widths["Total Value"], 'right') # New column
        ]

        current_x_offset = bg_x + STYLE["PADDING"]
        for i, (header_text, c_width, anchor) in enumerate(headers_info):
            label_x = current_x_offset
            if anchor == 'center':
                label_x += c_width / 2
            elif anchor == 'right':
                label_x += c_width

            header_label = pyglet.text.Label(
                header_text, font_name=STYLE["FONT_NAME"], font_size=STYLE["FONT_SIZE_HEADER"],
                color=STYLE["HEADER_COLOR"], x=label_x, y=header_y,
                anchor_x=anchor, anchor_y='top', batch=_overlay_batch, group=_overlay_foreground_group
            )
            _overlay_elements.append(header_label)
            current_x_offset += c_width
        current_y -= STYLE["FONT_SIZE_HEADER"] + (STYLE["PADDING"] / 2)


        for position in crypto_positions:
            current_y -= STYLE["LINE_HEIGHT"]
            if current_y < bg_y + STYLE["PADDING"] + STYLE["LINE_HEIGHT"]:
                warning_label = pyglet.text.Label( # Copied for brevity
                    "...more items not shown...", font_name=STYLE["FONT_NAME"], font_size=STYLE["FONT_SIZE_NORMAL"],
                    color=STYLE["TEXT_COLOR"], x=bg_x + bg_width / 2, y=current_y, aFnchor_x='center',
                    anchor_y='top', batch=_overlay_batch, group=_overlay_foreground_group
                )
                _overlay_elements.append(warning_label)
                break

            name = position.get('name', 'N/A')
            symbol = position.get('symbol', 'N/A')
            amount = position.get('amount', 0.0)
            cost_basis = position.get('costBasis', 0.0)
            total_value = amount * cost_basis # Calculate total value

            position_texts_info = [
                (name, col_widths["Name"], 'left'),
                (symbol, col_widths["Symbol"], 'center'),
                (f"{amount:.4f}", col_widths["Amount"], 'center'), # Keep amount precise
                (f"${cost_basis:,.2f}", col_widths["Cost Basis"], 'center'), # Changed to center
                (f"${total_value:,.2f}", col_widths["Total Value"], 'right') # New calculated value
            ]

            current_x_offset = bg_x + STYLE["PADDING"]
            for text_val, c_width, anchor in position_texts_info:
                label_x = current_x_offset
                if anchor == 'center':
                    label_x += c_width / 2
                elif anchor == 'right':
                    label_x += c_width

                item_label = pyglet.text.Label(
                    str(text_val), font_name=STYLE["FONT_NAME"], font_size=STYLE["FONT_SIZE_NORMAL"],
                    color=STYLE["TEXT_COLOR"], x=label_x, y=current_y,
                    anchor_x=anchor, anchor_y='top', batch=_overlay_batch, group=_overlay_foreground_group
                )
                _overlay_elements.append(item_label)
                current_x_offset += c_width

    close_y_pos = bg_y + STYLE["PADDING"]
    close_label = pyglet.text.Label(
        "Press ESC to close", font_name=STYLE["FONT_NAME"], font_size=STYLE["FONT_SIZE_NORMAL"] - 2,
        color=STYLE["TEXT_COLOR"], x=bg_x + bg_width / 2, y=close_y_pos,
        anchor_x='center', anchor_y='bottom', batch=_overlay_batch, group=_overlay_foreground_group
    )
    _overlay_elements.append(close_label)

    _OVERLAY_VISIBLE = True
    # print("Financial overlay created and shown.")


def show(data_to_display):
    if not _overlay_batch:
        print("Cannot show overlay: system not initialized.")
        return
    create_financial_overlay(data_to_display)

def hide():
    global _OVERLAY_VISIBLE
    if not _overlay_batch:
        return
    _OVERLAY_VISIBLE = False
    _clear_overlay_elements()
    # print("Overlay hidden.")

def is_visible():
    return _OVERLAY_VISIBLE

def draw():
    if _OVERLAY_VISIBLE and _overlay_batch:
        _overlay_batch.draw()

def handle_key_press(symbol, modifiers):
    if _OVERLAY_VISIBLE:
        if symbol == pyglet.window.key.ESCAPE:
            hide()
            return True
    return False