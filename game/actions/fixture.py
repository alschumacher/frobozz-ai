from game.actions.actions import Actions
from game.models import HandleActionResponse
from game.actions.utils import dispatch_events
from game.models import GameState

from game.logger import logger

class FixtureActions(Actions):
    pass



@FixtureActions.register_action('open')
def open(context:'Artifact', object:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:

    if object.is_open:
        logger.debug(f'{object.id} is already open at context {context.id}.')
        return HandleActionResponse(message=f'{object.name} is already open.')

    if object.is_locked:
        logger.debug(f'{object.id} is locked at context {context.id}.')
        return HandleActionResponse(message=f'{object.name} is locked.')

    if not object.is_openable:
        logger.debug(f'{object.id} is not openable at context {context.id}.')
        return HandleActionResponse(message=f'You can\'t open that.')

    object.is_open = True

    response = HandleActionResponse(message=f'You opened the {object.name}', success=True)

    response = dispatch_events(response, context, game_state, 'open', object)

    return response


@FixtureActions.register_action('close')
def close(context:'Artifact', object:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:

    if not object.is_openable:
        logger.debug(f'{object.id} is not closeable at context {context.id}.')
        return HandleActionResponse(message=f'You can\'t close that.')

    if not object.is_open:
        logger.debug(f'{object.id} is already closed at context {context.id}.')
        return HandleActionResponse(message=f'{object.name} is already closed.')

    object.is_open = False

    response = HandleActionResponse(message=f'You closed the {object.name}', success=True)

    response = dispatch_events(response, context, game_state, 'close', object)

    return response

