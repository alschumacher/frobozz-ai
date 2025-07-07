from enum import Enum


class InteractiveActions(Enum):
    GO = "go"
    LOOK = "look"
    EXAMINE = "examine"
    DESCRIBE = "describe"
    TAKE = "take"
    GET = 'get'
    DROP = "drop"
    PUT = 'put'
    USE = "use"
    OPEN = "open"
    CLOSE = "close"
    N = "n"
    S = "s"
    E = "e"
    W = "w"
    NORTH = "north"
    SOUTH = "south"
    EAST = "east"
    WEST = "west"
    LIGHT = 'light'
    BURN = 'burn'
    IGNITE = 'ignite'
    CUT = 'cut'
    SLICE = 'slice'
    SAW = 'saw' 
    TURN = 'turn'
    ROTATE = 'rotate'
    PUSH = 'push'
    PULL = 'pull'

class GameActions(Enum):
    INVENTORY = "inventory"
    HELP = "help"
    QUIT = "quit"


class GameVerbs(Enum):
    INVENTORY = "inventory"
    HELP = "help"


class ItemVerbs(Enum):
    LOOK = "look"
    OPEN = "open"
    CLOSE = "close"
    TAKE = "take"
    CUT = 'cut'
    SLICE = 'slice'
    SAW = 'saw' 

class FixtureVerbs(Enum):
    LOOK = 'look'
    OPEN = 'open'
    CLOSE = 'close'
    LIGHT = 'light'
    BURN = 'burn'
    IGNITE = 'ignite'
    CUT = 'cut'
    SLICE = 'slice'
    SAW = 'saw'
    TURN = 'turn'
    ROTATE = 'rotate'
    PUSH = 'push'
    PULL = 'pull'

class AreaVerbs(Enum):
    LOOK = 'look'
    TAKE = 'take'
    DROP = 'close'
    N = 'n'
    S = 's'
    E = 'e'
    W = 'w'
    GO = 'go'
    USE = 'use'


class IntransitiveVerbs(Enum):
    LOOK = 'look'
    N = 'n'
    S = 's'
    E = 'e'
    W = 'w'
    GO = 'go'
    QUIT = 'quit'
    INVENTORY = 'inventory'
    HELP = 'help'


class ThreePlacePredicates(Enum):
    USE = 'use'
    LIGHT = 'light'
    BURN = 'burn'
    IGNITE = 'ignite'
    CUT = 'cut'
    SLICE = 'slice'
    SAW = 'saw'
    PUT = 'put'
    DROP = 'drop'