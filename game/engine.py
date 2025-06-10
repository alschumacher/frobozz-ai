import json
from typing import Tuple, List, Iterable

from game.actions.action_enums import InteractiveActions, GameActions
from game.core.area import Area
from game.core.fixture import Fixture
from game.core.item import Item

from game.models import GameState
from game.parser import parse_command
from game.core.artifact import Artifact

from game.logger import logger

class TextAdventure:
    """
    A class to represent a text adventure game.

    This class handles the initialization, command execution, and game state management
    for a text adventure game. It loads the game configuration, parses commands, updates
    the game state, and manages interactions and events within the game.

    Attributes:
        game_data (list): A list of Area objects representing the game data.
        current_state (Area): The current area in the game.
        game_state (GameState): The current state of the game.
    """

    def __init__(self, config):
        # The order is deliberate and necessary.
        self.game_state = self._read_config(config)
        self._initialize()

    def run_command(self, command:str) -> str:
        """
        Executes a command in the text adventure game.

        This method parses the given command, handles the resulting action, updates the game state,
        and returns a response message. It also manages item consumption, event logging, and area transitions.

        Args:
            command (str): The command string to execute.

        Returns:
            str: The response message after executing the command.
        """
        # Parse the command
        command = self._parse_command(command)
        logger.info(f'Parsed command: {command}')

        # If the command is not understood
        if isinstance(command, str):
            logger.warning(f'Command not understood: {command}')
            return command

        # Handle the action
        response = self.current_state.handle_action(command, self.game_state)

        # If this sets any events
        self.game_state.event_log = response.events

        # If the action used an item that should be consumed on use
        if response.consumed:
            if response.item in self.game_state.inventory:
                self.game_state.inventory.remove(response.item)
            elif response.item in self.current_state.items:
                self.current_state.items.remove(response.item)
            else:
                logger.warning(f'Item not found in inventory or current state: {response.item}, nothing was removed!')
            logger.debug(f'Consumed item: {response.item}')

        # If the action changed the area
        if response.new_state:
            self.current_state = response.new_state
            logger.debug(f'Changed area to: {response.new_state}')
            if response.new_state not in self.game_state.visited_tiles:
                self.game_state.visited_tiles.append(response.new_state)

        # Calculate state events - we do this every time which is not efficient but it's not a big deal
        # Data model: { event: { "artifacts": { artifact_id: { property: value } }, "events": { event: True/False }, "event_value": True/False } ...  }
        for event, conditions in self.game_state.state_events.items():
            # logger.debug(f'Checking for changes in state event: {event}')
            event_triggered = True
            for artifiact_id in conditions['artifacts'].keys():
                for property_name, value in conditions['artifacts'][artifiact_id].items():
                    # logger.debug(f"Looking for {property_name} and {artifiact_id}")
                    property_value = getattr(self.game_state.artifacts[artifiact_id], property_name)
                    if isinstance(property_value, Iterable):
                        # corresponds to "at least one of the items in value must be in property_value" logic
                        if isinstance(value, list) and not set(value).issuperset(set(property_value)):
                            # logger.debug(f'State event {event} failed trigger: Property value {property_value} is not a subset of {value}')
                            event_triggered = False
                            break
                        # corresponds to "this item must be in the property_value" logic
                        elif not isinstance(value, list) and value not in property_value:
                            # logger.debug(f'State event {event} failed trigger: Property value {property_value} does not contain {value}')
                            event_triggered = False
                            break
                    elif property_value != value:
                        # logger.debug(f'State event {event} failed trigger: Property value {property_value} does not equal {value}')
                        event_triggered = False
                        break
                if not event_triggered:
                    break
            if event_triggered and conditions['events']:
                # logger.debug(f'Checking for events: {conditions["events"]}')
                for event_name, value in conditions['events'].items():
                    if self.game_state.events.get(event_name) != value:
                        # logger.debug(f'State event {event} failed trigger: Event value {self.game_state.events.get(event_name)} does not equal {value}')
                        event_triggered = False
                        break
            if event_triggered:
                if not self.game_state.event_log.get(event):
                    logger.info(f'Triggering state event: {event}')
                self.game_state.event_log = {event:True}
            else:
                if self.game_state.event_log.get(event):
                    logger.info(f'Turning off state event: {event}')
                self.game_state.event_log = {event:False}

        # If the game_victory event has been dispatched
        if self.game_state.events.get('game_victory'):
            logger.info('Game victory event dispatched')
            return 'You have won the game!'

        return response.message

    def _parse_command(self, command:str) -> dict:
        """
        Parses a command string and returns a dictionary representing the action.

        Args:
            command (str): The command string to parse.

        Returns:
            dict: A dictionary containing the parsed action and objects, or an error message if the command is not understood.
        """

        # If the game action is only a game action, we don't need to do anything else
        # so just start with that
        action = command.split()[0]
        if action in [x.value for x in GameActions]:
            logger.debug(f'Singleton Game action: {action}')
            return {'action':action}

        # If the action is a valid defined action, fail the command
        if action not in [x.value for x in InteractiveActions]:
            logger.warning(f'Command attempted with invalid action: {action}')
            return 'I don\'t understand that command'

        # Otherwise parse the command
        logger.debug(f'Parsing text as command: {command}')
        action, object_name, iobject_name = parse_command(command)

        if action == 'go':
            action = object_name
            object_name = None

        # And structure the command for action handling
        action = action.lower()
        object = self._name_to_obj(object_name)
        iobject = self._name_to_obj(iobject_name)

        if object_name and not object:
            logger.warning(f'Object not found: {object_name}')
            return f'I don\'t see any {object_name} here.'

        if iobject_name and not iobject:
            logger.warning(f'IObject not found: {iobject_name}')
            return f'I don\'t see any {iobject_name} here.'

        return {
            'action': action,
            'object': object,
            'iobject': iobject,
        }

    def _name_to_obj(self, name:str) -> Artifact:
        """
        Searches for an object by name within the current game context.

        This method searches through the player's inventory, the current area's items, and fixtures
        to find an object that matches the given name and is visible.

        Args:
            name (str): The name of the object to search for.

        Returns:
            object: The object that matches the given name and is visible, or None if no such object is found.
        """

        object = None
        if not name:
            logger.info('No object name provided')
            return object

        logger.debug(f'Searching for object by name: {name}')

        context = self.game_state.inventory + self.current_state.items + self.current_state.fixtures

        for artifact_id in context:
            artifact = self.game_state.artifacts[artifact_id]
            if artifact.name.lower() == name.lower() and artifact.is_visible:
                logger.debug(f'Found object: {name}')
                return artifact
            context.extend(artifact.items + artifact.fixtures)

        return object

    def _initialize(self):
        # Initializes the map by creating exits between areas.
        areas = [area for area in self.game_state.artifacts.values() if isinstance(area, Area)]
        for area in areas:
            area._make_exits(areas)
        
        # Propagates artifact name into descriptions
        for artifact in self.game_state.artifacts.values():
            if not artifact.description_.name:
                artifact.description_.name = artifact.id

    def _read_config(self, config:dict) -> Tuple[List[Area], GameState]:
        """ Deserializes the game configuration from a JSON file or dictionary into Artifact objects. """
        if isinstance(config, dict):
            game_state = self._from_dict(config)
        elif isinstance(config, str):
            game_state = self._from_json(config)

        return game_state

    def _from_dict(self, config:dict):

        game_state = config.get('game_state')
        if game_state:
            game_state = GameState.model_validate(game_state)
        else:
            game_state = GameState()

        artifacts = []
        for artifact in config.get('artifacts'):
            for at in [('area', Area), ('item', Item), ('fixture', Fixture)]:
                if artifact.get('type') == at[0]:
                    artifact = at[1].model_validate(artifact)
                    artifact._assign_container(game_state)
                    artifacts.append(artifact)
                    break

        game_state.artifacts = {artifact.id:artifact for artifact in artifacts}

        self.current_state = game_state.artifacts[config.get('start_area')]
        game_state.visited_tiles = [self.current_state]

        # If this fails, we can't trust anything.
        assert len(config.get('artifacts')) == len(set([x for x in game_state.artifacts.keys()]))

        # Create a mapping of object IDs to object names
        game_state.id_to_name = {obj.id: obj.name for obj in game_state.artifacts.values()}

        return game_state

    def _from_json(self, path_to_json):
        with open(path_to_json, 'r') as f:
            config = json.load(f)

        game_state = self._from_dict(config)

        return game_state
