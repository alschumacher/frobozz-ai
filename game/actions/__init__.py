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

    has_light = any(
        [
            game_state.artifacts[item].is_lit 
            for item in game_state.inventory+context.fixtures+context.items
        ]
    )

    if context.is_dark and not has_light:
        return HandleActionResponse(message='It\'s too dark to see poop.', success=False)

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

    if len(context.items) + 1 >= context.capacity:
        return HandleActionResponse(message=f'There\'s no space to put that.')

    if kwargs.get('iobject'):
        logger.debug('Swapping iobject and context in drop action')
        context = kwargs['iobject']

    game_state.inventory.remove(object.id)

    # do this to trigger the setter
    context.items = context.items + [object.id]

    response = HandleActionResponse(message=f'You dropped the {object.name}', success=True)

    response = dispatch_events(response, context, game_state, 'drop', object, **kwargs)

    return response


@FixtureActions.register_action(['light', 'burn','ignite'])
@ItemActions.register_action(['light', 'burn', 'ignite'])
def light(context:'Artifact', object:'Artifact', iobject:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:

    if not object and iobject:
        logger.debug('Swapping object and context in light action')
        object = context

    if not object.is_flammable:
        return HandleActionResponse(message='It doesn\'t burn.', success=True)

    if object.is_lit:
        return HandleActionResponse(message='It\'s already on fire.', success=True)

    if not iobject.is_lit:
        return HandleActionResponse(message='There\'s no light to light it with.', success=True)

    object.is_lit = True

    response = HandleActionResponse(message=f'You lit the {object.name} on fire', success=True)

    response = dispatch_events(response, context, game_state, 'burn', object, **{'iobject': iobject})

    return response

@FixtureActions.register_action(['cut', 'slice', 'saw'])
@ItemActions.register_action(['cut', 'slice', 'saw'])
def cut(context:'Artifact', object:'Artifact', iobject:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:

    # Cutting will create new artifacts, so the only way to handle this is with an event

    default_response = HandleActionResponse(message=f'You can\'t cut that.', success=False)

    response = dispatch_events(default_response, context, game_state, 'cut', object, **{'iobject': iobject})

    return response

area_actions = AreaActions()

game_actions = GameActions()

item_actions = ItemActions()

fixture_actions = FixtureActions()