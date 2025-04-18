from game.models import HandleActionResponse, GameState
from game.actions.action_enums import ThreePlacePredicates

from game.logger import logger

def modify_response(response, **kwargs):
    for key, value in kwargs.items():
        try:
            setattr(response, key, value)
            logger.debug(f"Set attribute {key} on response object to {value}.")
        except AttributeError:
            logger.debug(f"Could not set attribute {key} on response object due to AttributeError.")
            pass
        except ValueError:
            logger.debug(f"Could not set attribute {key} on response object due to ValueError.")
            pass
    return response

def dispatch_events(
        response: HandleActionResponse,
        context: 'Artifact',
        game_state: GameState,
        action: str,
        object: 'Artifact', **kwargs) -> HandleActionResponse:
    """
    Checks if an action should dispatch an event and prepares the HandleActionResponse
    to trigger dispatch of events on return.

    Args:
        response (HandleActionResponse): The initial response object.
        context ('Artifact'): The context in which the action is performed.
        game_state (GameState): The current state of the game.
        action (str): The action being performed.
        object ('Artifact'): The object on which the action is performed.
        **kwargs: Additional keyword arguments.

    Returns:
        HandleActionResponse: The updated response after dispatching events.
    """
    interaction_name = f"{action}__{object.id}"

    # If the action is a ThreePlacePredicate, like `use`, the interaction name
    # requires it and the iobject in order to identify the interaction.
    if action in ThreePlacePredicates._value2member_map_:
        iobject = kwargs.get('iobject')
        if iobject:
            interaction_name += f"__{iobject.id}"

    logger.info(f"Dispatching events for interaction: {interaction_name}")

    locus = 'context'
    if context.interactions.get(interaction_name):
        interaction = context.interactions[interaction_name]
    elif game_state.interactions.get(interaction_name):
        interaction = game_state.interactions[interaction_name]
        locus = 'game_state'
    else:
        return response

    logger.info(f"Found interaction in {locus}: {interaction}")

    response = HandleActionResponse.model_validate(interaction)
    response = modify_response(response, **kwargs)
    response.success = True

    # If this action cannot be done more than once, eliminate it
    if not response.is_repeatable and locus == 'context':
        logger.debug(f"Removing interaction {interaction_name} from {locus}.")
        del context.interactions[interaction_name]
    elif not response.is_repeatable and locus == 'game_state':
        del game_state.interactions[interaction_name]
        logger.debug(f"Removing interaction {interaction_name} from {locus}.")

    return response

