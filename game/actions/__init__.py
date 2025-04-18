from game.actions.fixture import FixtureActions
from game.actions.area import AreaActions
from game.actions.game import GameActions
from game.actions.item import ItemActions
from game.models import HandleActionResponse, GameState
from game.actions.utils import dispatch_events

from game.logger import logger

@FixtureActions.register_action('look')
@ItemActions.register_action('look')
@AreaActions.register_action('look')
def look(context, game_state, **kwargs):
    return HandleActionResponse(message=context.get_description(game_state), success=True)

@FixtureActions.register_action(['get', 'take'])
@ItemActions.register_action(['get', 'take'])
@AreaActions.register_action(['get', 'take'])
def take(context:'Artifact', object:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:

    if not object:
        logger.debug(f"Object not passed as usable object")
        return HandleActionResponse(message=f'You can\'t take that.')

    if not object.is_accessible or object.id not in context.items:
        logger.debug(f"{object.id} not accessible")
        return HandleActionResponse(message=f'You can\'t take that.')

    if object.id in game_state.inventory:
        logger.debug(f"{object.id} already in player inventory")
        return HandleActionResponse(message=f'You already have the {object.name}')

    # do this lazily so that we are calling the setter
    context.items = [item for item in context.items if item != object.id]

    game_state.inventory.append(object.id)

    response = HandleActionResponse(message=f'You took the {object.name}', success=True)

    response = dispatch_events(response, context, game_state, 'take', object)

    return response


@AreaActions.register_action(['put', 'drop'])
@FixtureActions.register_action(['put', 'drop'])
def drop(context:'Artifact', object:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:

    object_in_inventory = any([item == object.id for item in game_state.inventory])

    if not object_in_inventory:
        logger.debug(f"{object.id} not in player inventory")
        return HandleActionResponse(message=f'You don\'t have a {object.name}')

    game_state.inventory.remove(object.id)

    # do this to trigger the setter
    context.items = context.items + [object.id]

    response = HandleActionResponse(message=f'You dropped the {object.name}', success=True)

    response = dispatch_events(response, context, game_state, 'drop', object)

    return response


area_actions = AreaActions()

game_actions = GameActions()

item_actions = ItemActions()

fixture_actions = FixtureActions()