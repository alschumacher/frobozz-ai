from langgraph.graph import StateGraph, END
from agent.nodes import root_node, planner_node, curious_node, solver_node, jester_node
from agent.personas.models import State

def create_initial_state(purpose: str, adventure_name: str) -> State:
    """Create a State object with default values"""
    return {
        'purpose': purpose,
        'adventure_name': adventure_name,
        'action': {},
        'current_tile_description': "You are standing in front of a cave entrance, which is to the NORTH. The inside of the cave is not lit, so you can't see any further. Out front of the entrance is a what looks like a FIREPIT.",
        'deliberation_round': 0,
        'deliberation_max': '7',
        'game_message_history': [],
        'planner_advice': 'Not queried last round',
        'curious_advice': 'Not queried last round',
        'solver_advice': 'Not queried last round',
        'jester_advice': 'Not queried last round',
        'root_instructions': 'The root has no opinion at this time.'
    }


def create_graph():
    graph = StateGraph(State)
    
    graph.add_node("root", root_node)
    graph.add_node("planner", planner_node)
    graph.add_node("curious", curious_node)
    graph.add_node("solver", solver_node)
    graph.add_node("jester", jester_node)
    
    # Simple serial chain
    graph.set_entry_point("root")
    graph.add_edge("root", "planner")
    graph.add_edge("planner", "curious")
    graph.add_edge("curious", "solver")
    graph.add_edge("solver", "jester")
    graph.add_edge("jester", END)
    
    return graph.compile()