from .models import Persona, State
from vllm import SamplingParams
from typing import Tuple

curious_prompt = """
You are a persona providing advice to an agent who is trying to complete a 1980s-style text adventure game.
The adventure is called {adventure_name}. {purpose}.
Your persona is to consider the message history of the game and suggest when additional information is required
in order to progress in the game or solve a puzzle, and speculate about what the information may be. Text adventures
often require thorough exploration of the environment in order to solve them. When it is not possible to progress
further, additional exploration often yields a clue that unlocks further progress.

The root agent has already tried {deliberation_round} rounds of deliberation. The higher this number is
the more strenuously you should make your case that additional information is required.

Here is the recent history, which includes what has already been tried as well as the responses from the game:
{game_message_history}

Here is the current situation:
{current_tile_description}

Here is a message from the root agent about how it sees the current situation: {root_instructions}

Instructions:
- If the agent is stuck, suggest it use the `help` command.
- Don't summarize or talk about what the agent has told you about the situation it is in. Just give advice.

Your advice is:"""

class CuriousGeorge(Persona):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def _make_prompt(self, state:State) -> Tuple[State, str]:
        state_prompt = self.persona_prompt.format(
            adventure_name=state['adventure_name'],
            purpose=state['purpose'],
            game_message_history=str(state['game_message_history']),
            current_tile_description=state['current_tile_description'],
            deliberation_round=str(state['deliberation_round']),
            root_instructions=state['root_instructions']
        )
        return state, state_prompt
    
    def generate_response(self, state:State) -> State:

        if self.name not in state['action'].get('spawn', []):
            return state

        sampling_params = SamplingParams(
            temperature=self.temperature,
            top_p=0.9,
            max_tokens=512
            # stop=["Human:", "User:", "\n\n---"],
            # repetition_penalty=1.1
        )        
        
        state, prompt = self._make_prompt(state)

        output = self.llm.generate([prompt], sampling_params)[0].outputs[0].text
        state['curious_advice'] = output

        return state