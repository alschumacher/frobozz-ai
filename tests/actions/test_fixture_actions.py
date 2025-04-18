import pytest
from unittest.mock import MagicMock
from game.actions.item import open, close
from game.actions import look, take
from game.models import HandleActionResponse

@pytest.fixture
def context():
    return MagicMock()

@pytest.fixture
def game_state():
    return MagicMock()

@pytest.fixture
def obj():
    return MagicMock()

def test_look_action(mocker, game_state):

    mock_context = mocker.Mock()
    mock_context.get_description.return_value = "A detailed description of the item."

    response = look(mock_context, game_state)

    assert isinstance(response, HandleActionResponse)
    assert response.message == "A detailed description of the item."
    assert response.success is True

def test_open_no_object_no_context(context, obj, game_state):
    obj.is_open = False
    obj.is_locked = False
    obj.is_openable = False
    game_state.inventory = []
    response = open(context, obj, game_state)
    assert response.message == 'You can\'t open that.'
    assert not response.success

def test_open_no_object_with_context(context, game_state, obj):
    obj.is_open = False
    obj.is_locked = False
    obj.is_openable = False
    game_state.inventory = []
    context.items = ['key']
    obj.name = 'key'
    context.interactions = {}
    game_state.interactions = {}
    response = open(context, obj, game_state)
    assert response.message == 'You can\'t open that.'
    assert not response.success

def test_open_object_locked(context, game_state, obj):
    obj.is_open = False
    obj.is_locked = True
    obj.is_openable = True
    obj.name = 'key'
    game_state.inventory = ['key']
    response = open(context, obj, game_state)
    assert response.message == 'key is locked.'
    assert not response.success

def test_open_object_not_openable(context, game_state, obj):
    obj.is_open = False
    obj.is_locked = False
    obj.is_openable = False
    obj.name = 'key'
    game_state.inventory = ['key']
    response = open(context, obj, game_state)
    assert response.message == "You can't open that."
    assert not response.success

def test_open_success(context, game_state, obj):
    obj.is_open = False
    obj.is_locked = False
    obj.is_openable = True
    obj.name = 'key'
    context.interactions = {}
    game_state.inventory = ['key']
    game_state.interactions = {}
    response = open(context, obj, game_state)
    assert response.message == 'You opened the key'
    assert response.success

def test_open_with_interactions(context, game_state, obj):
    obj.is_open = False
    obj.is_locked = False
    obj.is_openable = True
    obj.name = 'key'
    obj.id = 'key'
    context.interactions = {}
    obj.interactions = {}
    game_state.inventory = ['key']
    game_state.interactions = {'open__key': {'message': 'Special open', 'success': True}}
    response = open(context,obj, game_state)
    assert response.message == 'Special open'
    assert response.success

def test_open_with_game_state_interactions(context, game_state, obj):
    obj.is_open = False
    obj.is_locked = False
    obj.is_openable = True
    obj.name = 'key'
    obj.id = 'key'
    context.interactions = {}
    game_state.inventory = ['key']
    game_state.interactions = {'open__key': {'message': 'Special open', 'success': True}}
    response = open(context, obj, game_state)
    assert response.message == 'Special open'
    assert response.success


def test_close_object_locked(context, game_state, obj):
    obj.is_open = True
    obj.is_locked = True
    obj.is_openable = True
    obj.is_locked = True
    obj.name = 'key'
    obj.id = 'key'
    game_state.inventory = ['key']
    game_state.interactions = {}
    context.interactions = {}
    response = close(context, obj, game_state)
    assert response.message == 'You closed the key'
    assert response.success

def test_close_object_not_openable(context, game_state, obj):
    obj.is_open = False
    obj.is_locked = False
    obj.is_openable = False
    obj.name = 'key'
    obj.id = 'key'
    game_state.inventory = ['key']
    game_state.interactions = {}
    context.interactions = {}
    response = close(context, obj, game_state)
    assert response.message == "You can't close that."
    assert not response.success

def test_close_success(context, game_state, obj):
    obj.is_open = True
    obj.is_locked = False
    obj.is_openable = True
    obj.name = 'key'
    obj.id = 'key'
    game_state.inventory = ['key']
    game_state.interactions = {}
    context.interactions = {}
    response = close(context, obj, game_state)
    assert response.message == 'You closed the key'
    assert response.success

def test_close_with_interactions(context, game_state, obj):
    obj.is_open = True
    obj.is_locked = False
    obj.is_openable = True
    obj.name = 'key'
    obj.id = 'key'
    game_state.inventory = ['key']
    game_state.interactions = {}
    context.interactions = {('close', 'key'): {'message': 'Special close', 'success': True}}
    response = close(context, obj, game_state)
    assert response.message == 'You closed the key'
    assert response.success

def test_close_with_game_state_interactions(context, game_state, obj):
    obj.is_open = True
    obj.is_locked = False
    obj.is_openable = True
    obj.name = 'key'
    obj.id = 'key'
    game_state.inventory = ['key']
    context.interactions = {}
    game_state.interactions = {('close', 'key'): {'message': 'Special close', 'success': True}}
    response = close(context, obj, game_state)
    assert response.message == 'You closed the key'
    assert response.success


def test_take_object_not_in_context(context, game_state, obj):
    obj.name = 'key'
    obj.id = 'key'
    context.items = []
    context.interactions = {}
    game_state.interactions = {}
    game_state.inventory = []
    response = take(context, obj, game_state)
    assert response.message == "You can't take that."
    assert not response.success

def test_take_object_not_accessible(context, game_state, obj):
    obj.name = 'key'
    obj.id = 'key'
    obj.is_accessible = False
    context.items = ['key']
    response = take(context, obj, game_state)
    assert response.message == "You can't take that."
    assert not response.success

def test_take_success(context, game_state, obj):
    obj.name = 'key'
    obj.id = 'key'
    obj.is_accessible = True
    context.items = ['key']
    context.interactions = {}
    game_state.interactions = {}
    response = take(context, obj, game_state)
    assert response.message == 'You took the key'
    assert response.success

def test_take_with_interactions(context, game_state, obj):
    obj.name = 'key'
    obj.id = 'key'
    obj.is_accessible = True
    game_state.inventory = []
    context.items = ['key']
    context.interactions = {'take__key': {'message': 'Special take', 'success': True}}
    game_state.interactions = {}
    response = take(context, obj, game_state)
    assert response.message == 'Special take'
    assert response.success

def test_take_with_game_state_interactions(context, game_state, obj):
    obj.name = 'key'
    obj.id = 'key'
    obj.is_accessible = True
    context.items = ['key']
    context.interactions = {}
    game_state.inventory = []
    game_state.interactions = {'take__key': {'message': 'Special take', 'success': True}}
    response = take(context, obj, game_state)
    assert response.message == 'Special take'
    assert response.success
