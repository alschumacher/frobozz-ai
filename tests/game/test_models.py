# tests/core/test_models.py
from game.models import GameState, HandleActionResponse, ItemProperties, FixtureProperties, AreaProperties

def test_game_state_initialization():
    game_state = GameState()
    assert game_state.inventory == []
    assert game_state.log == ['[GAME START]']
    assert game_state.score == 0
    assert game_state.timer == 0
    assert game_state.artifacts == {}
    assert game_state.events == {}
    assert game_state.interactions == {}
    assert game_state.visited_tiles == []

def test_game_state_event_log():
    game_state = GameState()
    event = {'event1': 'value1'}
    game_state.event_log = event
    assert game_state.events == event

def test_handle_action_response_initialization():
    response = HandleActionResponse()
    assert response.message == ''
    assert response.events == {}
    assert response.new_state is None
    assert response.consumed is None
    assert response.item is None
    assert response.is_repeatable is True
    assert response.success is False

def test_item_properties_initialization():
    item_properties = ItemProperties()
    assert item_properties.is_openable is False
    assert item_properties.is_open is False
    assert item_properties.is_broken is False
    assert item_properties.is_accessible is True
    assert item_properties.is_locked is False

def test_obs_properties_initialization():
    obs_properties = FixtureProperties()
    assert obs_properties.is_openable is False
    assert obs_properties.is_open is False
    assert obs_properties.is_locked is False

def test_tile_properties_initialization():
    tile_properties = AreaProperties()
    assert tile_properties.is_accessible is True