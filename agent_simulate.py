import copy
import pickle
import torch
from agent.graph import create_graph, create_initial_state
from game.core.area import Area

with open('adventures/the_vault.pkl', 'rb') as f:
    adventure = pickle.load(f)


purpose = "The purpose of the adventure is to find the Vault, a secret cache of treasure. You know it is nearby."
adventure_name = "The Vault"


def update_agent_state(agent_state, log, area_descriptions):
    # TODO: this absolutely should be implemented in a dataclass instead of this hack
    reverse_log = copy.deepcopy(log)
    reverse_log.reverse()
    for message in reverse_log:
        if message in area_descriptions:
            break

    agent_state['game_message_history'] = log[-20:]
    agent_state['action'] = {}
    agent_state['current_tile_description'] = message
    agent_state['deliberation_round'] = 0
    agent_state['planner_advice'] = 'Not queried last round'
    agent_state['curious_advice'] = 'Not queried last round'
    agent_state['solver_advice'] = 'Not queried last round'
    agent_state['jester_advice'] = 'Not queried last round'
    agent_state['root_instructions'] = 'The root has no opinion at this time.'
    return agent_state

trace = []

def agent_plays_text_adventures(adventure, max_attempts=100):
    area_descriptions = [area.get_description(adventure.game_state) for area in adventure.game_state.artifacts.values() if isinstance(area, Area)]

    graph = create_graph()

    agent_state = create_initial_state(
        purpose=purpose,
        adventure_name=adventure_name
    )

    log = []
    attempts = 0
    while True:

        contemplation_round = 0
        while not agent_state['action'].get('direct_action'):
            trace.append(agent_state)
            agent_state = graph.invoke(agent_state)
            contemplation_round += 1
            if contemplation_round == 25:
                command = 'help'
                break

        command = agent_state['action']['direct_action']
        log.append(command)

        adventure_response = adventure.run_command(command)
        log.append(adventure_response)
        if adventure.game_state.events.get('game_victory'):
            print('hey, it actually won')
            return adventure, agent_state, log, attempts

        attempts += 1
        if attempts == max_attempts:
            break
    
        agent_state = update_agent_state(agent_state, log, area_descriptions)

    return adventure, agent_state, log, attempts

output = agent_plays_text_adventures(adventure)