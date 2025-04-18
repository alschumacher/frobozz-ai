# tests/core/test_item.py
import pytest
from game.core.item import Item
from game.models import ItemProperties, GameState

sample_items = [
    {
        'id': 'box',
        'name': 'Box',
        'description_': {"start":'This is the start', 'end':'This is the end'},
        'properties': {'is_openable': True},
    }
]

@pytest.mark.parametrize("item_data", sample_items)
def test_item_initialization(item_data):
    item = Item(**item_data)
    game_state = GameState()
    assert item.name == item_data['name']
    assert item.description_.render(item, game_state) == 'This is the start  This is the end'
    assert item.properties == ItemProperties.model_validate(item_data['properties'])

@pytest.mark.parametrize("item_data", sample_items)
def test_item_handle_action(item_data):
    item = Item(**item_data)
    action = {'action': 'open', 'object': item}
    game_state = GameState()
    response = item.handle_action(action, game_state)
    assert response is not None

@pytest.mark.parametrize("item_data", sample_items)
def test_item_trigger_events(item_data):
    item = Item(**item_data)
    event = {'event1': 'value1'}
    item._trigger_events(event)

@pytest.mark.parametrize("item_data", sample_items)
def test_item_assign_container(item_data):
    item = Item(**item_data)
    game_state = GameState()
    item._assign_container(game_state)
    for obs in item.fixtures:
        assert obs.container == item

@pytest.mark.parametrize("item_data", sample_items)
def test_item_properties(item_data):
    item = Item(**item_data)
    assert item.is_openable == item.properties.is_openable
    assert item.is_open == item.properties.is_open
    assert item.is_locked == item.properties.is_locked
    assert item.is_broken == item.properties.is_broken
    assert item.is_accessible == item.properties.is_accessible