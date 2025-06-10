from enum import Enum

from game.actions.action_enums import FixtureVerbs, ItemVerbs, GameVerbs, AreaVerbs

def merge_enums(name, *enums):
    members = {}
    for enum in enums:
        members.update({e.name: e.value for e in enum})
    return Enum(name, members)

Actions = merge_enums("Actions", FixtureVerbs, ItemVerbs, GameVerbs, AreaVerbs)

