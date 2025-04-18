import pytest
from unittest.mock import MagicMock
from game.models import GameState, HandleActionResponse
from game.core.area import Area
from game.engine import TextAdventure
from game.parser import parse_command

adventure = TextAdventure(config='/home/alex/claira/projects/agents/adventures/sample3.json')

def test_game_state():

    expected_objects = set(['Dungeon Room',
     'Flask',
     'Dungeon Room 2',
     'Marking',
     'Box',
     'Door Room',
     'Rune',
     'Key',
     'Door',
     'Treasure Room',
     'Pedastel',
     'Plaque',
     'Golden Flask'])


    assert set([x.name for x in adventure.game_state.artifacts.values()]) == expected_objects


def test_game_data():
    areas = [area for area in adventure.game_state.artifacts.values() if isinstance(area, Area)]
    assert [x.name for x in areas] ==  ['Dungeon Room', 'Dungeon Room 2', 'Door Room', 'Treasure Room']
    assert [x.triggers for x in areas] == [{}, {}, {}, {"open_ze_door__True": [['is_accessible', True]]}]


def test_parse_command():

    test_commands = ['get flask', 'n', 'go s', 'look', 'look flask']

    expected_commands = [
        {'action': 'get', 'object': 'dummy_flask', 'iobject': ''},
        {'action': 'n', 'object': '', 'iobject': ''},
        {'action': 'go', 'object': '', 'iobject': ''},
        {'action': 'look', 'object': '', 'iobject': ''},
        {'action': 'look', 'object': 'dummy_flask', 'iobject': ''},
    ]

    parsed_commands = []
    for command in test_commands:
        cmd = adventure._parse_command(command)

        obj = ''
        if cmd['object']:
            obj = cmd['object'].id

        iobj = ''
        if cmd['iobject']:
            iobj = cmd['iobject'].id

        parsed_commands.append(
            {
                'action':cmd['action'],
                'object':obj,
                'iobject':iobj
            }
        )

    assert parsed_commands == expected_commands

def test_adventure():

    expected_responses =[
        'lol look at you, asking for help in a text adventure game\nHere are some commands you can use:\ngo [direction]\nlook\ntake [item]\ndrop [item]\nuse [item] on/with etc. [thing/item]\nopen [thing/item]\nclose [thing/item]\n',
         'Ye find yeself in yon dungeon. Ye see a FLASK. Obvious exits are NORTH, SOUTH, and DENNIS.',
         "I don't see any box here.",
         'It is a flask. There appears to be some strange MARKING on it.',
         'The marking is a RUNE of some sort.  It is difficult to make out.',
         'Turns out the rune isn\'t a rune at all, it is some words that read "This isn\'t the flask you\'re looking for". Ironic!',
         "You can't take that.",
         "You can't take that.",
         'Ye find yeself a little farther into yon dungeon. Ye see a BOX. Exits are WEST, and SOUTH.',
         'It is a box. It looks like it can be opened.',
         'You took the Box',
         'You have:\nBox\n',
         'You dropped the Box',
         'You have:\n',
         'You took the Box',
         'Ye find yeself in yon dungeon. Ye see a FLASK. Obvious exits are NORTH, SOUTH, and DENNIS.',
         'It is a box. It looks like it can be opened.',
         'You dropped the Box',
         'Ye find yeself in yon dungeon. Ye see a FLASK. Ye see a BOX. Obvious exits are NORTH, SOUTH, and DENNIS.',
         'You took the Box',
         'Ye find yeself a little farther into yon dungeon.  Exits are WEST, and SOUTH.',
         'You have:\nBox\n',
         'You open the box. There is a key inside.',
         'It is a box. It looks like it can be opened. There is a key inside.',
         'It looks like a door key. It is shiny and made of brass.',
         'You took the Key',
         "You can't take that.",
         'It is a box. It looks like it can be opened.',
         'You have:\nBox\nKey\n',
         'Ye find yeself in yet another room To the NORTH there is a closed DOOR. Exits are EAST, and NORTH.',
         "You can't go that way.",
         'You unlock the door with the key.',
         "Ye find yeself in the treasure room. There is a PLACQUE on the wall. Ye see a PEDASTEL. I could tell you the exits, but you don't really want to go backwards do you? There's nothing for you there. Oh, fine, whatever. Exits are SOUTH.",
         "It reads: 'Here is an anagram: This text adventure sucks.' You think for a long time, but the only way you can think to decode it is with the sentence 'This text adventure sucks'",
         'It is a pedastel. There is a GOLDEN FLASK on it.',
         'You have won the game!'
    ]

    commands = [
        'help',
        'look',
        'look box',
        'look flask',
        'look marking',
        'look rune',
        'take flask',
        'get flask',
        'n',
        'look box',
        'take box',
        'inventory',
        'drop box',
        'inventory',
        'get box',
        's',
        'look box',  # still functions when it's in our inventory
        'drop box',
        'look',
        'get box',
        'n',
        'inventory',  # but not when it's dropped and in another room...
        'open box',
        'look box',
        'look key',
        'take key',
        'take key',
        'look box',
        'inventory',
        'w',
        'n',  # should not work
        'use key on door',
        'n',
        'look plaque',
        'look pedastel',
        'take Golden Flask'
    ]

    actual_responses = []
    for command in commands:
        actual_responses.append(
            adventure.run_command(command)
        )

    assert actual_responses == expected_responses

@pytest.fixture
def mock_game_state():
    return GameState()

@pytest.fixture
def mock_tile():
    tile = MagicMock(spec=Area)
    tile.handle_action.return_value = HandleActionResponse()
    return tile

@pytest.fixture
def text_adventure(mock_game_state, mock_tile):
    config = {'tiles': [mock_tile], 'game_state': mock_game_state}
    return TextAdventure(config)

def run_command_valid_action(text_adventure):
    command = 'look'
    response = text_adventure.run_command(command)
    assert response is not None

def run_command_invalid_action(text_adventure):
    command = 'invalid'
    response = text_adventure.run_command(command)
    assert response == "I don't understand that command"

def run_command_consumed_item(text_adventure, mock_tile):
    command = 'use item'
    mock_tile.handle_action.return_value.consumed = True
    mock_tile.handle_action.return_value.item = 'item'
    text_adventure.game_data.inventory = ['item']
    response = text_adventure.run_command(command)
    assert 'item' not in text_adventure.game_data.inventory

def run_command_non_repeatable_action(text_adventure, mock_tile):
    command = 'use item'
    mock_tile.handle_action.return_value.is_repeatable = False
    mock_tile.handle_action.return_value.item_use = 'item_use'
    text_adventure.current_state.interactions = {'item_use': 'some_use'}
    response = text_adventure.run_command(command)
    assert 'item_use' not in text_adventure.current_state.interactions

def run_command_new_state(text_adventure, mock_tile):
    command = 'move'
    new_state = MagicMock(spec=Area)
    mock_tile.handle_action.return_value.new_state = new_state
    response = text_adventure.run_command(command)
    assert text_adventure.current_state == new_state
    assert new_state in text_adventure.game_state.visited_tiles

def run_command_game_victory(text_adventure, mock_tile):
    command = 'win'
    mock_tile.handle_action.return_value.events = {'game_victory': True}
    response = text_adventure.run_command(command)
    assert response == 'You have won the game!'

def run_command_quit_game(text_adventure, mock_tile):
    command = 'quit'
    mock_tile.handle_action.return_value.events = {'quit_game': True}
    response = text_adventure.run_command(command)
    assert response == 'You have won the game!'