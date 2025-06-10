
def create_tile_map(start_tile, valid_tiles):
    """
    So, I let Claude write this one. If it's buggy, not my fault!

    Creates an ASCII map of connected tiles starting from a given tile.
    Each tile is represented by its name attribute.

    Args:
        start_tile: The starting Area instance

    Returns:
        str: ASCII representation of the tile map
    """
    # Track visited tiles to handle cycles
    visited = []

    # Track boundaries of the map
    min_x = max_x = min_y = max_y = 0

    # Dictionary to store tile coordinates
    tile_positions = {}

    def explore_tiles(tile, x, y):
        """
        Recursively explores tiles and records their positions.

        Args:
            tile: Current Area instance
            x, y: Current coordinates
        """
        nonlocal min_x, max_x, min_y, max_y

        if tile is None or tile not in valid_tiles or tile in visited:
            return

        visited.append(tile)
        tile_positions[(x, y)] = tile.name

        # Update boundaries
        min_x = min(min_x, x)
        max_x = max(max_x, x)
        min_y = min(min_y, y)
        max_y = max(max_y, y)

        # Explore in each cardinal direction
        # North
        if tile.exits[0] and (x, y - 1) not in tile_positions:
            explore_tiles(tile.exits[0], x, y - 1)

        # East
        if tile.exits[1] and (x + 1, y) not in tile_positions:
            explore_tiles(tile.exits[1], x + 1, y)

        # South
        if tile.exits[2] and (x, y + 1) not in tile_positions:
            explore_tiles(tile.exits[2], x, y + 1)

        # West
        if tile.exits[3] and (x - 1, y) not in tile_positions:
            explore_tiles(tile.exits[3], x - 1, y)

    # Start exploration from the first tile at (0,0)
    explore_tiles(start_tile, 0, 0)

    # Create the map string
    map_lines = []

    # Add tiles and connections
    for y in range(min_y, max_y + 1):
        # First line: north connections
        north_line = ""
        for x in range(min_x, max_x + 1):
            if (x, y) in tile_positions:
                tile_char = "│" if (x, y - 1) in tile_positions else " "
            else:
                tile_char = " "
            north_line += f" {tile_char} "
        map_lines.append(north_line)

        # Second line: west/east connections and tile names
        tile_line = ""
        for x in range(min_x, max_x + 1):
            if (x, y) in tile_positions:
                west_char = "─" if (x - 1, y) in tile_positions else " "
                east_char = "─" if (x + 1, y) in tile_positions else " "
                tile_char = tile_positions[(x, y)]
                tile_line += f"{west_char}{tile_char}{east_char}"
            else:
                tile_line += "   "
        map_lines.append(tile_line)

        # Third line: south connections
        south_line = ""
        for x in range(min_x, max_x + 1):
            if (x, y) in tile_positions:
                tile_char = "│" if (x, y + 1) in tile_positions else " "
            else:
                tile_char = " "
            south_line += f" {tile_char} "
        map_lines.append(south_line)

    return "\n".join(map_lines)

def areas_to_known_stuff(game_state, areas):
    known_stuff = {}
    for area in areas:
        visible_things = [game_state.artifacts[x].name for x in area.fixtures+area.items]
        known_stuff[area.name] = f"Area Name: {area.name}. Area Description: {area.description_}. Things of Interest: {visible_things}"

    return "\n".join(list(known_stuff.values()))
