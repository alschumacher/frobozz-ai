from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

from agent.models import Actions
from game.engine import TextAdventure
from game.core.area import Area
from agent.agent import make_agent
from agent.prompt import areas_to_known_stuff, create_tile_map

def define_structured_output(objects):

    object_names = [x.name for x in objects.values() if not isinstance(x, Area)] + ['n', 's', 'e', 'w']
    Object = Enum("Object", {s.upper(): s for s in object_names})

    class AdventureResponse(BaseModel):
        action: Actions
        object: Optional[Object]
        iobject: Optional[Object]

        def as_str(self):
            object = ""
            try:
                object = self.object.value
            except:
                pass

            iobject = ""
            try:
                iobject = self.iobject.value
            except:
                pass

            return f"{self.action.value} {object} {iobject}".strip()

    return AdventureResponse


def update_agent_state(agent_state, adventure, command, response):
    agent_state['actions'].append(command)
    agent_state['visited_tiles'] = adventure.game_state.visited_tiles
    agent_state['map'] = create_tile_map(adventure.current_state, agent_state['visited_tiles'])
    agent_state['known_stuff'] = areas_to_known_stuff(adventure.game_state, agent_state['visited_tiles'])
    agent_state['location_name'] = adventure.current_state.name
    agent_state['description'] = adventure.current_state.get_description(adventure.game_state)
    agent_state['result'] = response
    agent_state['command'] = None
    return agent_state


def main_loop(reason_model, plan_model, act_model, adventure_config, max_attempts=100):

    adventure = TextAdventure(config=adventure_config)
    response_format = define_structured_output(adventure.game_state.artifacts)
    act_model = act_model.with_structured_output(response_format)
    agent = make_agent(reason_model, plan_model, act_model)

    agent_state = {
        "actions":["<no prior actions>"],
        "reasonings":["<no prior reasonings>"],
        "plans":["<no prior plans>"],
        "visited_tiles":[adventure.current_state],
        "purpose":"to get ye flask.",
        "location_name":adventure.current_state.name,
        "description":adventure.current_state.get_description(adventure.game_state),
        "result":"<game start>",
        "map":adventure.current_state.name,
        "known_stuff":areas_to_known_stuff(adventure.game_state, [adventure.current_state]),
        "command":None
    }

    attempts = 0
    while True:

        agent_state = agent.invoke(agent_state)
        command = agent_state['command'].as_str()
        print(command)

        adventure_response = adventure.run_command(command)
        if adventure_response == 'You have won the game!':
            return adventure

        attempts += 1
        if attempts == max_attempts:
            break

        agent_state = update_agent_state(agent_state, adventure, command, adventure_response)

    return agent_state

