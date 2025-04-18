import pytest
from unittest.mock import MagicMock
from game.models import HandleActionResponse
from game.actions.actions import Actions

@pytest.fixture
def actions():
    return Actions()

def test_action_handler_called_correctly(actions):
    mock_handler = MagicMock(return_value=HandleActionResponse(message='Action performed'))
    actions.register_action('test_action')(mock_handler)
    context = MagicMock()
    action = {'action': 'test_action', 'object': 'test_object'}
    game_state = MagicMock()
    response = actions.do_action(context, action, game_state)
    mock_handler.assert_called_once_with(context=context, object='test_object', iobject=None, game_state=game_state)
    assert response.message == 'Action performed'

def test_action_handler_not_found(actions):
    context = MagicMock()
    action = {'action': 'non_existent_action'}
    game_state = MagicMock()
    response = actions.do_action(context, action, game_state)
    assert response.message == "You can't do that here."

def test_action_handler_with_iobject(actions):
    mock_handler = MagicMock(return_value=HandleActionResponse(message='Action with iobject performed'))
    actions.register_action('test_action')(mock_handler)
    context = MagicMock()
    action = {'action': 'test_action', 'object': 'test_object', 'iobject': 'test_iobject'}
    game_state = MagicMock()
    response = actions.do_action(context, action, game_state)
    mock_handler.assert_called_once_with(context=context, object='test_object', iobject='test_iobject', game_state=game_state)
    assert response.message == 'Action with iobject performed'

def test_action_handler_with_multiple_names(actions):
    mock_handler = MagicMock(return_value=HandleActionResponse(message='Action performed'))
    actions.register_action(['action1', 'action2'])(mock_handler)
    context = MagicMock()
    action1 = {'action': 'action1', 'object': 'test_object'}
    action2 = {'action': 'action2', 'object': 'test_object'}
    game_state = MagicMock()
    response1 = actions.do_action(context, action1, game_state)
    response2 = actions.do_action(context, action2, game_state)
    mock_handler.assert_any_call(context=context, object='test_object', iobject=None, game_state=game_state)
    assert response1.message == 'Action performed'
    assert response2.message == 'Action performed'
