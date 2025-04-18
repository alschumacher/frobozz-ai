from enum import Enum


class InteractiveActions(Enum):
    GO = "go"
    LOOK = "look"
    TAKE = "take"
    GET = 'get'
    DROP = "drop"
    USE = "use"
    OPEN = "open"
    CLOSE = "close"
    N = "n"
    S = "s"
    E = "e"
    W = "w"


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


class FixtureVerbs(Enum):
    LOOK = 'look'
    OPEN = 'open'
    CLOSE = 'close'


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