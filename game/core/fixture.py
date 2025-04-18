from pydantic import Field
from game.models import FixtureProperties
from game.actions import fixture_actions
from game.core.artifact import Artifact
from game.models import HandleActionResponse, GameState
from game.logger import logger

class Fixture(Artifact):
    """
    Represents a fixture in the game.

    Attributes:
        interactions (dict): A dictionary of interactions associated with the fixture.
        properties (FixtureProperties): The properties of the fixture.
    """
    interactions: dict = Field(default_factory=dict)
    properties: FixtureProperties = Field(default_factory=FixtureProperties)

    def handle_action(self, action: dict, game_state: GameState) -> HandleActionResponse:
        """
        Handles an action performed on the fixture.

        This method processes an action dictionary and returns a HandleActionResponse which
        determines how game state will be updated accordingly.

        If the action is directed at an artifact within the fixture, it delegates the action
        to that artifact. Otherwise, it performs the action on the fixture itself.

        Args:
            action (dict): A dictionary containing the action details.
            game_state (GameState): The current state of the game.

        Returns:
            HandleActionResponse: The response after handling the action.
        """

        # Check if the action is directed at a specific object
        if action.get('object'):
            # Iterate through the fixtures contained within this fixture
            for fxt in self._get_artifacts(self.fixtures, game_state):
                # If the object ID matches, delegate the action to the contained fixture
                if fxt.id == action['object'].id:
                    action['object'] = None
                    logger.info(f"Dispatching action: {action['action']} onto fixture: {fxt.id} from context: {self.id}")
                    return fxt.handle_action(action, game_state)

        # Perform the action on this fixture if no specific object is targeted
        logger.info(f"Dispatching action: {action['action']} onto context: {self.id}")
        return fixture_actions.do_action(self, action, game_state)
1