from game.actions.actions import Actions
from game.models import HandleActionResponse
from game.actions.utils import dispatch_events
from game.models import GameState

from game.logger import logger

class FixtureActions(Actions):
    pass



@FixtureActions.register_action('open')
def open(context:'Artifact', object:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:

    if context.is_open:
        logger.debug(f'{context.id} is already open.')
        return HandleActionResponse(message=f'{context.name} is already open.')

    if context.is_locked:
        logger.debug(f'{context.id} is locked.')
        return HandleActionResponse(message=f'{context.name} is locked.')

    if not context.is_openable:
        logger.debug(f'{context.id} is not openable.')
        return HandleActionResponse(message=f'You can\'t open that.')

    context.is_open = True

    response = HandleActionResponse(message=f'You opened the {context.name}', success=True)

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

@FixtureActions.register_action(['turn', 'rotate'])
def turn(context:'Artifact', object:'Artifact', game_state:GameState, **kwargs) -> HandleActionResponse:
    
    response = HandleActionResponse(message=f'You can\'t turn that.', success=False)

    response = dispatch_events(response, context, game_state, 'turn', object)

    return response
