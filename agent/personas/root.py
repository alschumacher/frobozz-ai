import re
from typing import Dict, Optional, Tuple
from .models import Persona, State
from vllm import SamplingParams

root_agent_prompt = """
You are playing a 1980s-style text adventure. The adventure is called {adventure_name}. {purpose}.  
You are the root of the agent, which means you make the executive decisions. You will interact with the text
adventure in free text, so keep in mind the tendency of such games to capitalize interesting things.
To help you decide what to do at any point in the game, you have the ability to spawn personas, who will analyze the situation and
make suggestions.  Here is a description of those personas:

SPAWN OPTIONS:
- none: I can decide directly without persona help
- planner: Need help with strategic planning and goal setting
- curious: Need help with how to get more information gathering and exploration
- solver: Need advice on how to solve a puzzle that needs logical analysis  
- jester: Need creative, unorthodox ideas

Here is the recent history, which includes what has already been tried as well as the responses from the game:
{game_message_history}

**DO NOT** just keep trying the same thing over and over again! If you are stuck, try spawning different personas
that will help in different situations.

Here is the current situation:
{current_tile_description}

Here are the results of the last deliberation round:
 - planner: {planner_advice}
 - curious: {curious_advice}
 - solver_advice: {solver_advice}
 - jester_advice: {jester_advice}

In the current decision loop, you have queried personas for help {deliberation_round} time(s). You should
make the best guess you have after no more than {deliberation_max} rounds.

If you need to access your inventory, type 'inventory'. If you want help, type 'help'. You can type all commands in lower case.

Directions are done with 'go n/s/e/w' or just 'n', 's', 'e', 'w'.

**REMEMBER**: the personas are there to advise you, but they cannot give you more information or do anything for you directly. You are supposed to take their advice, synthesize it with your judgment about the situation, and execute a command.
**REMEMBER**: you must select "none" in the SPAWN category in order to take an action.

Decision format:
SPAWN: [planner/curious/solver/jester/any combination of the preceding such as planner, solver OR 'none']
REASON: [brief explanation of how you see the current situation and why you need this help, omit if taking DIRECT_ACTION]
DIRECT_ACTION: [only if SPAWN is 'none' - what specific command to send to the text adventure]

Decision:"""

class RootAgent(Persona):
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)


    def _make_prompt(self, state:State) -> Tuple[State, str]:
        print('CURIOUS ADVICE:'+state['curious_advice'])
        state_prompt = self.persona_prompt.format(
            adventure_name=state['adventure_name'],
            purpose=state['purpose'],
            game_message_history=str(state['game_message_history']),
            current_tile_description=state['current_tile_description'],
            planner_advice=state['planner_advice'],
            curious_advice=state['curious_advice'],
            solver_advice=state['solver_advice'],
            jester_advice=state['jester_advice'],
            deliberation_round=str(state['deliberation_round']),
            deliberation_max=state['deliberation_max']
        )
        state['solver_advice'] = 'Not queried last round'
        state['curious_advice'] = 'Not queried last round'
        state['planner_advice'] = 'Not queried last round'
        state['jester_advice'] = 'Not queried last round'
        return state, state_prompt

    def _parse_response(self, response:str) -> Dict[str, Optional[str]]:

        result = {
            'spawn': [],
            'reason': None,
            'direct_action': None
        }
        
        spawn_pattern = r'SPAWN:\s*([^\n]+)'
        reason_pattern = r'REASON:\s*([^\n]+)'
        action_pattern = r'DIRECT_ACTION:\s*([^\n]+)'
        
        spawn_match = re.search(spawn_pattern, response, re.IGNORECASE)
        reason_match = re.search(reason_pattern, response, re.IGNORECASE)
        action_match = re.search(action_pattern, response, re.IGNORECASE)
        
        if spawn_match:
            spawn_text = spawn_match.group(1).strip().lower()
            if spawn_text == 'none':
                result['spawn'] = []
            else:
                # Split by comma/space and clean up
                result['spawn'] = [name.strip() for name in spawn_text.replace(',', ' ').split()]
        if reason_match:
            result['reason'] = reason_match.group(1).strip()
        if action_match:
            result['direct_action'] = action_match.group(1).strip()
    
        return result

    def generate_response(self, state:State) -> State:
        sampling_params = SamplingParams(
            temperature=self.temperature,
            top_p=0.9,
            max_tokens=512
            # stop=["Human:", "User:", "\n\n---"],
            # repetition_penalty=1.1
        )
        
        state, prompt = self._make_prompt(state)
        print('PROMPT: '+prompt)
        print()
        query = self.llm.generate([prompt], sampling_params)[0]
        response = query.outputs[0].text
        action = self._parse_response(response)
        state['action'] = action
        if action['spawn'] != 'none':
            state['deliberation_round'] += 1
        state['root_instructions'] = action.get('reason', 'The root has no opinion at this time.')

        return state