from game.actions.actions import Actions
from game.models import HandleActionResponse
from game.actions.utils import dispatch_events
from game.models import GameState
from game.logger import logger

class ItemActions(Actions):
    pass



@ItemActions.register_action('open')
def open(context:'Artifact', object:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:

    if not object:
        logger.debug(f"That is not in player inventory")
        return HandleActionResponse(message=f'You don\'t have that.')

    if object.is_locked:
        logger.debug(f'{object.id} is locked at context {context.id}.')
        return HandleActionResponse(message=f'{object.name} is locked.')

    if not object.is_openable:
        logger.debug(f'{object.id} is not openable at context {context.id}.')
        return HandleActionResponse(message=f'You can\'t open that.')

    object.is_open = True

    response = HandleActionResponse(message=f'You opened the {object.name}', success=True)

    response = dispatch_events(response, context, game_state, 'open', object, **{'item': object})

    return response


@ItemActions.register_action('close')
def close(context:'Artifact', object:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:

    if not object:
        logger.debug(f"{object.id} not in player inventory")
        return HandleActionResponse(message=f'You don\'t have a {object.name}')

    if not object.is_openable:
        logger.debug(f'{object.id} is not closeable at context {context.id}.')
        return HandleActionResponse(message=f'You can\'t close that.')

    object.is_open = False

    response = HandleActionResponse(message=f'You closed the {object.name}', success=True)

    response = dispatch_events(response, context, game_state, 'close', object, **{'item': object})

    return response

