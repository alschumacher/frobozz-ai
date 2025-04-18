from game.actions.actions import Actions
from game.models import HandleActionResponse
from game.actions.utils import dispatch_events
from game.models import GameState
from game.logger import logger

class AreaActions(Actions):
    pass


@AreaActions.register_action('n')
def n(context, game_state:GameState, **kwargs) -> HandleActionResponse:
    if context.exits[0] is not None and context.exits[0].is_accessible:
        logger.debug(f'Going north to {context.exits[0].name}')
        return HandleActionResponse(
            message=context.exits[0].get_description(game_state),
            changed_state=True,
            new_state=context.exits[0],
            success=True
        )
    return HandleActionResponse(message='You can\'t go that way.')


@AreaActions.register_action('s')
def s(context, game_state, **kwargs) -> HandleActionResponse:
    if context.exits[1] is not None and context.exits[1].is_accessible:
        logger.debug(f'Going south to {context.exits[1].name}')
        return HandleActionResponse(
            message=context.exits[1].get_description(game_state),
            changed_state=True,
            new_state=context.exits[1],
            success=True
        )
    return HandleActionResponse(message='You can\'t go that way.')


@AreaActions.register_action('e')
def e(context, game_state, **kwargs) -> HandleActionResponse:
    if context.exits[2] is not None and context.exits[2].is_accessible:
        logger.debug(f'Going east to {context.exits[2].name}')
        return HandleActionResponse(
            message=context.exits[2].get_description(game_state),
            changed_state=True,
            new_state=context.exits[2],
            success=True
        )
    return HandleActionResponse(message='You can\'t go that way.')


@AreaActions.register_action('w')
def w(context, game_state, **kwargs) -> HandleActionResponse:
    if context.exits[3] is not None and context.exits[3].is_accessible :
        logger.debug(f'Going west to {context.exits[3].name}')
        return HandleActionResponse(
            message=context.exits[3].get_description(game_state),
            changed_state=True,
            new_state=context.exits[3],
            success = True
        )
    return HandleActionResponse(message='You can\'t go that way.')


@AreaActions.register_action('go')
def go(context:'Artifact', object:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:
    dirs = {'n':n, 's':s, 'e':e, 'w':w}
    if object.lower() in dirs.keys():
        return dirs[object.lower()](context, game_state)
    logger.debug(f'No direction found for {object}')
    return HandleActionResponse(message='You can\'t go that way.')


@AreaActions.register_action('use')
def use(context:'Artifact', object:'Artifact', iobject:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:

    object_in_inventory = any([item == object.id for item in game_state.inventory])

    if not object_in_inventory:
        logger.debug(f'{context.id} failed to find {object.id} in inventory')
        return HandleActionResponse(message=f'You don\'t have a {object.name}')

    iobject_available = any([item == iobject.id for item in game_state.inventory+context.fixtures+context.items])

    if not iobject_available:
        logger.debug(f'{context.id} failed to find {iobject.id} in environment')
        return HandleActionResponse(message=f'You don\'t have a {iobject.name}')

    response = HandleActionResponse(message=f'You can\'t do that here.')

    response = dispatch_events(response, context, game_state, 'use', object, **{'iobject': iobject, 'item': iobject, 'item_use': (object.id, iobject.id)})

    return response
