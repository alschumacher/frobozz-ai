from pydantic import Field
from typing import Any

from game.actions.action_enums import FixtureVerbs, ItemVerbs, GameVerbs, IntransitiveVerbs
from game.actions import area_actions
from game.actions import game_actions
from game.models import AreaProperties
from game.core.artifact import Artifact

from game.logger import logger

class Area(Artifact):
    """
    Represents an area in the game.

    Attributes:
        interactions (dict): A dictionary of interactions associated with the area.
        properties (AreaProperties): The properties of the area.
        exits_ (dict): A dictionary of exits from the area.
    """
    interactions: dict = Field(default_factory=dict)
    properties: AreaProperties = Field(default_factory=AreaProperties)
    exits_: dict = Field(default_factory=dict)

    def handle_action(self, action: dict, game_state):

        if action.get('object'):

            logger.debug(f"Attempting to dispatch action with object {action.get('object').id}")

            for artifact_id in game_state.artifacts:
                if artifact_id == self.id:
                    continue

                artifact = game_state.artifacts.get(artifact_id)
                logger.debug(f'Found object {artifact.id}')

                is_target_object = artifact.id == action['object'].id
                is_delegatable_action = (
                        action['action'] in FixtureVerbs._value2member_map_ or
                        action['action'] in ItemVerbs._value2member_map_
                )
                requires_object = action['action'] not in IntransitiveVerbs._value2member_map_

                if is_target_object:# and requires_object:
                    logger.info(f"Found target object: {artifact.id} for action {action['action']}; handling action.")
                    logger.debug(f"Dispatching action {action['action']} to {artifact.id}")
                    action['dispatched'] = True
                    response = artifact.handle_action(action, game_state)
                    if response.success:
                        logger.debug(f"Action {action['action']} dispatched to {artifact.id} successfully")
                        return response
                elif not is_target_object and is_delegatable_action and action.get('object').id in artifact.fixtures + artifact.items and requires_object:
                    action['dispatched'] = True
                    response = artifact.handle_action(action, game_state)
                    if response.success:
                        logger.debug(f"Action {action['action']} dispatched to {artifact.id} successfully")
                        return response


        elif action['action'] in GameVerbs._value2member_map_:
            logger.debug(f"Dispatching action {action['action']} to game actions")
            return game_actions.do_action(self, action, game_state)

        return area_actions.do_action(self, action, game_state)

    def _make_exits(self, areas):
        exits = {'n':None, 's':None, 'e':None, 'w':None}
        for area in areas:
            direction = self.exits_.get(area.id)
            if direction:
                exits[direction] = area
        self.exits_ = [
            exits.get('n'),
            exits.get('s'),
            exits.get('e'),
            exits.get('w')
        ]

    @property
    def exits(self):
        return self.exits_
