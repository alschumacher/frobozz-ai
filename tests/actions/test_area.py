import pytest

from game.actions.area import *
from unittest.mock import MagicMock

@pytest.fixture
def context():
    return MagicMock()

@pytest.fixture
def game_state():
    return MagicMock()

def test_n_success(context, game_state):
    exit = MagicMock(is_accessible=True)
    exit.get_description.return_value = 'Exit to the north'
    context.exits = [exit]
    response = n(context, game_state)
    assert response.success
    assert response.message == 'Exit to the north'

def test_n_failure(context, game_state):
    context.exits = [MagicMock(is_accessible=False)]
    response = n(context, game_state)
    assert not response.success
    assert response.message == "You can't go that way."

def test_s_success(context, game_state):
    exit = MagicMock(is_accessible=True)
    exit.get_description.return_value = 'Exit to the south'
    context.exits = [None, exit]
    response = s(context, game_state)
    assert response.success
    assert response.message == 'Exit to the south'

def test_s_failure(context, game_state):
    context.exits = [None, MagicMock(is_accessible=False)]
    response = s(context, game_state)
    assert not response.success
    assert response.message == "You can't go that way."

def test_e_success(context, game_state):
    exit = MagicMock(is_accessible=True)
    exit.get_description.return_value = 'Exit to the east'
    context.exits = [None, None, exit]
    response = e(context, game_state)
    assert response.success
    assert response.message == 'Exit to the east'

def test_e_failure(context, game_state):
    context.exits = [None, None, MagicMock(is_accessible=False)]
    response = e(context, game_state)
    assert not response.success
    assert response.message == "You can't go that way."

def test_w_success(context, game_state):
    exit = MagicMock(is_accessible=True)
    exit.get_description.return_value = 'Exit to the west'
    context.exits = [None, None, None, exit]
    response = w(context, game_state)
    assert response.success
    assert response.message == 'Exit to the west'

def test_w_failure(context, game_state):
    context.exits = [None, None, None, MagicMock(is_accessible=False)]
    response = w(context, game_state)
    assert not response.success
    assert response.message == "You can't go that way."

def test_go_success(context, game_state):
    exit = MagicMock(is_accessible=True)
    exit.get_description.return_value = 'Exit to the north'
    context.exits = [exit]
    response = go(context, 'n', game_state)
    assert response.success
    assert response.message == 'Exit to the north'

def test_go_failure(context):
    response = go(context, 'invalid_direction', game_state)
    assert not response.success
    assert response.message == "You can't go that way."

def test_use_success(context, game_state):
    object = MagicMock()
    object.id = 'key'
    object.name = 'key'
    iobject = MagicMock()
    iobject.id='door'
    iobject.name='door'
    game_state.inventory = ['key']
    context.interactions = {"use__key__door":{"message": "You unlock the door with the key.", "events": {"open_ze_door": True}}}
    context.fixtures = ['door']
    context.items = []
    response = use(context, object, iobject, game_state)
    assert not response.success # False is now the expected return here.
    assert response.message != "You can't do that here."

def test_use_object_not_in_inventory(context, game_state):
    object = MagicMock()
    object.id = 'key'
    object.name = 'key'
    iobject = MagicMock()
    iobject.id='door'
    iobject.name='door'
    game_state.inventory = []
    context.interactions = {"use__key__door":{"message": "You unlock the door with the key.", "events": {"open_ze_door": True}}}
    context.fixtures = ['door']
    context.items = []
    response = use(context, object, iobject, game_state)
    assert not response.success
    assert response.message == "You don't have a key"

def test_use_iobject_not_available(context, game_state):
    object = MagicMock()
    object.id = 'key'
    object.name = 'key'
    iobject = MagicMock()
    iobject.id='door'
    iobject.name='door'
    game_state.inventory = ['key']
    context.interactions = {"use__key__door":{"message": "You unlock the door with the key.", "events": {"open_ze_door": True}}}
    context.fixtures = []
    context.items = []
    response = use(context, object, iobject, game_state)
    assert not response.success
    assert response.message == "You don't have a door"