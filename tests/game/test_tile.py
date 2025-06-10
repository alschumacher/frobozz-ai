# tests/core/test_tile.py
import pytest
from game.models import GameState
from game.core.area import Area
from game.core.fixture import Fixture
from game.core.item import Item

@pytest.fixture
def artifacts():
    return [
    Area.model_validate({
        'type':'area',
        'id': 'tr',
        'name': 'Treasure Room',
        'description_': {'start':'Ye find yeself in the treasure room.'},
        'fixtures_': ['pedastel'],
        'exits_': {'Door Room': 'south'},
        'properties': {'is_accessible': False, 'is_visible': True},
        "triggers": {'open_ze_door__True': {"is_accessible": True}},
    }),
    Fixture.model_validate({
        'type': 'fixture',
        'id': 'pedastel',
        'name': 'Pedastel',
        'container_description': 'Ye see a PEDASTEL.',
        'description_': {'start': 'It is a pedastel.'},
        'items_': ['golden_flask'],
        'interactions': {
            'take__golden_flask': {
                'message': 'You got ye flask!',
                'events': {'open_ze_door': True}
            }
        }
    }),
    Item.model_validate({
        'type': 'item',
        'id': 'golden_flask',
        'name': 'GoldenFlask',
        'description_': {'start': 'It is a golden flask. It is shiny and very valuable.'},
    })
]

def test_tile_initialization(artifacts):
    game_state = GameState()
    area = artifacts[0]
    game_state.artifacts = {art.id: art for art in artifacts}
    assert area.description_.render(area, game_state) == 'Ye find yeself in the treasure room. Ye see a PEDASTEL.'

def test_tile_handle_action(artifacts):
    area = artifacts[0]
    action = {'action': 'enter', 'object': area}
    game_state = GameState()
    response = area.handle_action(action, game_state)
    assert response is not None


def test_tile_properties(artifacts):
    area = artifacts[0]
    assert area.is_accessible == area.properties.is_accessible

# @pytest.mark.skip('old way of triggering events')
def test_tile_trigger_events(artifacts):
    area = artifacts[0]
    event = {'open_ze_door': True}
    assert area.is_accessible == False
    area._trigger_events(event)
    assert area.is_accessible == True
