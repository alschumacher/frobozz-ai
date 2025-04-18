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
    _help = 'lol look at you, asking for help in a text adventure game\n'
    _help += 'Here are some commands you can use:\n'
    _help += 'go [direction]\n'
    _help += 'look\n'
    _help += 'take [item]\n'
    _help += 'drop [item]\n'
    _help += 'use [item] on/with etc. [thing/item]\n'
    _help += 'open [thing/item]\n'
    _help += 'close [thing/item]\n'
    return HandleActionResponse(message=_help)


@GameActions.register_action('quit')
def quit(**kwargs):
    return HandleActionResponse(message='Quitting...', events={'quit_game':True})