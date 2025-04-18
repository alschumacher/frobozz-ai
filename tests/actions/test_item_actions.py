import pytest
from unittest.mock import MagicMock
from game.actions.item import *
from game.models import HandleActionResponse, GameState

@pytest.fixture
def context():
    return MagicMock()

@pytest.fixture
def game_state():
    return MagicMock()

def test_open_no_object(context, game_state):
    object = MagicMock()
    response = open(context, '', game_state)
    assert response.message == "You don't have that."

def test_open_locked_object(context, game_state):
    object = MagicMock()
    object.is_locked = True
    object.name = 'chest'
    response = open(context, object, game_state)
    assert response.message == 'chest is locked.'

def test_open_not_openable_object(context, game_state):
    object = MagicMock()
    object.is_locked = False
    object.is_openable = False
    object.name = 'rock'
    response = open(context, object, game_state)
    assert response.message == "You can't open that."

def test_open_success(context, game_state):
    object = MagicMock()
    object.is_locked = False
    object.is_openable = True
    object.is_open = False
    object.id = 'box'
    object.name = 'box'
    object.interactions = {}
    game_state.interactions = {}
    context.interactions = {}
    response = open(context, object, game_state)
    assert response.success
    assert response.message == 'You opened the box'