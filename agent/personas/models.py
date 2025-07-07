from typing import Tuple, List, TypedDict
from abc import ABC, abstractmethod

class State(TypedDict):
    purpose: str
    adventure_name: str
    action: dict
    current_tile_description: str
    deliberation_round: int
    deliberation_max: str
    game_message_history: List[str]
    planner_advice: str
    curious_advice: str
    solver_advice: str
    jester_advice: str
    root_instructions: str

def create_initial_state(purpose: str, adventure_name: str) -> State:
    """Create a State object with default values"""
    return {
        'purpose': purpose,
        'adventure_name': adventure_name,
        'action': {},
        'current_tile_description': '',
        'deliberation_round': 0,
        'deliberation_max': '7',
        'game_message_history': [],
        'planner_advice': 'Not queried last round',
        'curious_advice': 'Not queried last round',
        'solver_advice': 'Not queried last round',
        'jester_advice': 'Not queried last round',
        'root_instructions': 'The root has no opinion at this time.'
    }

class Persona(ABC):
    """Base class for all agent personas"""
    def __init__(
        self, 
        name: str, 
        persona_prompt:str,
        llm,
        temperature: float = 0.1,
    ):
        self.name = name
        self.persona_prompt = persona_prompt
        self.llm = llm
        self.temperature = temperature
    

    @abstractmethod
    def _make_prompt(self, state: State) -> Tuple[State, str]:
        ...

    @abstractmethod
    def generate_response(self, state: State) -> State:
        ...
