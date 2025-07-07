from game.actions.actions import Actions
from game.models import HandleActionResponse


class GameActions(Actions):
    pass


@GameActions.register_action('inventory')
def inventory(game_state, **kwargs):
    inv = 'You have:\n'
    for item in game_state.inventory:
        inv += f'{game_state.artifacts[item].name}\n'
    return HandleActionResponse(message=inv)


@GameActions.register_action('help')
def help(**kwargs):
    _help = """
    Here are the names of all the actions:
    - look / examine
    - take
    - get
    - drop
    - put
    - use
    - open
    - close
    - n (means go north)
    - s (means go south)
    - e (means go east)
    - w (measn go west)
    - light
    - burn
    - ignite
    - cut
    - saw
    - turn
    - rotate
    - push
    - pull

    To see your inventory, type:
    - inventory
    """
    return HandleActionResponse(message=_help)


@GameActions.register_action('quit')
def quit(**kwargs):
    return HandleActionResponse(message='Quitting...', events={'quit_game':True})