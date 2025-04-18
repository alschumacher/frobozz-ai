from typing import Dict, Callable, Union, Any
from game.models import HandleActionResponse, GameState
from game.logger import logger

class Actions:

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        cls._action_handlers = {}

    def __init__(self):
        pass

    @classmethod
    def register_action(cls, action_name: Union[str, list]) -> Callable:
        """
        Registers an action handler for the given action name(s).

        Args:
            action_name (Union[str, list]): The name or list of names of the action(s) to register.

        Returns:
            Callable: A decorator that registers the given function as the handler for the specified action(s).
        """
        def decorator(func):
            if isinstance(action_name, list):
                for name in action_name:
                    cls._action_handlers[name] = func
            else:
                cls._action_handlers[action_name] = func
            return func

        return decorator

    def do_action(self, context:'Artifact', action: Dict[str, Any], game_state:GameState):
        """
        Executes the logic and state changes as the consequence of an action based on the provided context, action, and game state.

        Args:
            context (Any[Item, Fixture, Area]): The context in which the action is performed.
                This can be an item, fixture, or area. This conte
            action (Dict[str, Any]): A dictionary containing the action details.
                Expected keys are 'action', 'object', and 'iobject'.
            game_state (GameState): The current state of the game.
        """
        action_name = action.get('action')
        logger.debug(f'Attempting to perform action: {action_name}')

        handler = self.__class__._action_handlers.get(action_name)

        if not handler:
            logger.error(f'No handler found for action: {action_name}')
            return HandleActionResponse(message=f'You can\'t do that here.')

        handler_args = {
            'context': context,
            'object': action.get('object'),
            'iobject': action.get('iobject'),
            'game_state': game_state
        }

        handler_args_str = str(handler_args['context']) + ', ' + str(handler_args["object"]) + ', ' + str(handler_args["iobject"])
        logger.debug(f'Handler arguments: ' + handler_args_str)
        logger.debug(f'Action handled by {self.__class__.__name__}.{handler.__name__}')
        return handler(**handler_args)