from agent.personas import (
    CuriousGeorge, curious_prompt,
    TaskPlanner, planner_prompt,
    Jester, jester_prompt,
    RootAgent, root_agent_prompt,
    PuzzleSolver, solver_prompt
)
from .llm import llm
from typing import TypedDict
from agent.personas.models import State

root = RootAgent(
    name='root',
    persona_prompt=root_agent_prompt,
    llm=llm,
    temperature=0.7
)

def root_node(graph_state: State) -> State:
    graph_state = root.generate_response(graph_state)        
    return graph_state

planner = TaskPlanner(
    name='planner',
    persona_prompt=planner_prompt,
    llm=llm,
    temperature=0.1
)

def planner_node(graph_state: State) -> State:
    graph_state = planner.generate_response(graph_state)
    return graph_state

curious = CuriousGeorge(
    name='curious',
    persona_prompt=curious_prompt,
    llm=llm,
    temperature=0.1
)

def curious_node(graph_state: State) -> State:
    graph_state = curious.generate_response(graph_state)
    return graph_state


solver = PuzzleSolver(
    name='solver',
    persona_prompt=solver_prompt,
    llm=llm,
    temperature=0.1
)

def solver_node(graph_state: State) -> State:
    graph_state = solver.generate_response(graph_state)
    return graph_state


jester = Jester(
    name='jester',
    persona_prompt=jester_prompt,
    llm=llm,
    temperature=0.1
)

def jester_node(graph_state: State) -> State:
    graph_state = jester.generate_response(graph_state)
    return graph_state