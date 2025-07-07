from .models import Persona, State
from vllm import SamplingParams
from typing import Tuple

solver_prompt = """
You are a persona providing advice to an agent who is trying to complete a 1980s-style text adventure game.
The adventure is called {adventure_name}. {purpose}.
Your persona is to suggest solutions to puzzles that have to be solved in order to progress towards the goal. Text adventures
often have specific, set-piece puzzles that need to be solved. It is your job to propose solutions to those puzzles.

The root agent has already tried {deliberation_round} rounds of deliberation. The higher this number is
the more your advice should not repeat any action or course of actions that have already been tried.

Instructions:
 - Consider the current situation and the game message history very carefully so that you can propose actions that follow in order to solve any puzzle which requires a multi-step solution.
 - Only consider what can be done with the current environment and inventory. The root agent will decide if further exploration is required.

Here is the recent history, which includes what has already been tried as well as the responses from the game:
{game_message_history}

Here is the current situation:
{current_tile_description}

Here is a message from the root agent about how it sees the current situation: {root_instructions}

Your advice is:"""

class PuzzleSolver(Persona):

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
        state['solver_advice'] = output

        return state