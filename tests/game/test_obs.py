# tests/core/test_obs.py
import pytest
from game.core.fixture import Fixture as Obs
from game.models import FixtureProperties, GameState
from tests.actions.test_fixture_actions import game_state

sample_obs = [
    {
        "id": "dummy_rune",
        "name": "Rune",
        "container_description": " It is difficult to make out.",
        "description_": {"start":"Turns out the rune isn't a rune at all, it is some words that read \"This isn't the flask you're looking for\". Ironic!"},
        'properties':{}
    }
]

@pytest.mark.parametrize("obs_data", sample_obs)
def test_obs_initialization(obs_data):
    obs = Obs(**obs_data)
    game_state = GameState()
    assert obs.name == obs_data['name']
    assert obs.description_.render(obs, game_state) == 'Turns out the rune isn\'t a rune at all, it is some words that read "This isn\'t the flask you\'re looking for". Ironic!'
    assert obs.properties == FixtureProperties.model_validate(obs_data['properties'])

@pytest.mark.parametrize("obs_data", sample_obs)
def test_obs_handle_action(obs_data):
    obs = Obs(**obs_data)
    action = {'action': 'look', 'object': obs}
    game_state = GameState()
    response = obs.handle_action(action, game_state)
    assert response is not None

@pytest.mark.parametrize("obs_data", sample_obs)
def test_obs_trigger_events(obs_data):
    obs = Obs(**obs_data)
    event = {'event1': 'value1'}
    obs._trigger_events(event)

@pytest.mark.parametrize("obs_data", sample_obs)
def test_obs_properties(obs_data):
    obs = Obs(**obs_data)
    assert obs.is_openable == obs.properties.is_openable
    assert obs.is_open == obs.properties.is_open
    assert obs.is_locked == obs.properties.is_locked