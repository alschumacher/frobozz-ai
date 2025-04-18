from pydantic import Field
from game.models import ItemProperties, GameState, HandleActionResponse
from game.actions import item_actions
from game.actions.action_enums import FixtureVerbs, ItemVerbs, IntransitiveVerbs
from game.core.artifact import Artifact
from game.logger import logger

class Item(Artifact):
    """
    Represents an item in the game.

    Attributes:
        properties (ItemProperties): The properties of the item.
        interactions (dict): A dictionary of interactions associated with the item.
    """
    properties: ItemProperties = Field(default_factory=ItemProperties)
    interactions: dict = Field(default_factory=dict)

    def handle_action(self, action: dict, game_state:GameState) -> HandleActionResponse:
        """
        Handles an action performed on the item.

        This method processes an action dictionary and returns a HandleActionResponse which
        determines how the game state will be updated accordingly.

        If the action is directed at an artifact within the item, it delegates the action
        to that artifact. Otherwise, it performs the action on the item itself.

        Args:
            action (dict): A dictionary containing the action details.
            game_state (GameState): The current state of the game.

        Returns:
            HandleActionResponse: The response after handling the action.
        """

        # Check if the action is directed at a specific object and has not been dispatched yet

        logger.debug(f"Attempting to dispatch action with object {action.get('object').id}")

        if action.get('object') and not action.get('dispatched'):
            # Iterate through fixtures and items to find the target object
            for artifact in self._get_artifacts(self.fixtures + self.items, game_state):

                is_target_object = artifact.id == action['object'].id
                is_delegatable_action = (
                        action['action'] in FixtureVerbs._value2member_map_ or
                        action['action'] in ItemVerbs._value2member_map_
                )
                requires_object = action['action'] not in IntransitiveVerbs._value2member_map_

                if is_target_object and is_delegatable_action and requires_object:

                    # Handle intransitive verbs by clearing the object reference
                    if requires_object:
                        action['object'] = None
                    # Delegate the action to the target object
                    logger.info(f"Dispatching action: {action['action']} onto artifact: {artifact.id} from context: {self.id}")
                    return artifact.handle_action(action, game_state)

        # Perform the action on the item itself if no specific object is targeted
        logger.debug(f"Dispatching action: {action['action']} onto context: {self.id}")
        return item_actions.do_action(self, action, game_state)


    @property
    def is_broken(self):
        return self.properties.is_broken


