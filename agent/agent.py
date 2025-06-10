
from typing import TypedDict, Sequence, List, Any
from langgraph.graph import END, Graph
from langchain_core.messages import AIMessage
from langchain_core.prompts import ChatPromptTemplate

from game.core.area import Area


class AgentState(TypedDict):
    actions: List[str]
    reasonings: List[str]
    plans: List[str]
    visited_tiles = List[Area]
    purpose: str
    location_name: str
    description: str
    result: str
    map: str
    known_stuff: str
    command: Any # this is lazy!


reason_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are playing a text adventure. The objective of this text adventure is {purpose}."
               "You are the reasoning component of an agent designed to complete this text adventure. "
               "Consider the current situation and make a strategic decision about how to complete the adventure."),
    ("system", "Your previous plan was {last_plan} based on the last rationale which was: {last_rationale}. "
              "The most recently taken action by you is {last_action}. The result of that last action was {result}."),
    ("system", "The name of the location you are currently in is {location_name}. This is its description: {description}"
               "This is a map of the areas in the adventure that you have explored: {map}"
                "This is what you know about each area: {known_stuff}"),
    ("system", "Given all of the preceding, write a short statement assessing what the best goal to pursue is.")])


plan_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are playing a text adventure. The objective of this text adventure is {purpose}."
               "You are the planning component of an agent designed to complete this text adventure. "
               "Based on the reasoning made by the preceding step, write a plan on how to accomplish the rationale."),
    ("system", "The name of the location you are currently in is {location_name}. This is its description: {description}"
               "The most recently taken action by you is {last_action}. The result of that last action was {result}."),
    ("system", "Current reasoning: {reasoning}. Write a plan.")
])


act_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are playing a text adventure. The objective of this text adventure is {purpose}."
               "You are the acting component of an agent designed to complete this text adventure. "
               "Based on the plan made by the preceding step, write a text adventure command to further the plan."),
    ("system", "The name of the location you are currently in is {location_name}. This is its description: {description}"
               "The most recently taken action by you is {last_action}. The result of that last action was {result}."),
    ("system", "Given the following {plan}, make the text adventure command that will best further it.")
])


def make_reason(model):
    def reason(state: AgentState) -> AgentState:
        prompt = reason_prompt.format_prompt(
            purpose=state['purpose'],
            location_name=state['location_name'],
            description=state['description'],
            last_action=state['actions'][-1],
            result=state['result'],
            map=state['map'],
            known_stuff=state['known_stuff'],
            last_plan=state['plans'][-1],
            last_rationale=state['reasonings'][-1],
        )
        response = model.invoke(prompt)
        return {
            **state,
            "reasonings": state['reasonings'] + [response.content],
        }
    return reason


def make_plan(model):

    def plan(state: AgentState) -> AgentState:
        prompt = plan_prompt.format_prompt(
            purpose=state['purpose'],
            location_name=state['location_name'],
            description=state['description'],
            last_action=state['actions'][-1],
            result=state['result'],
            reasoning=state['reasonings'][-1],
        )
        response = model.invoke(prompt)
        return {
            **state,
            "plans": state['plans'] + [response.content],
        }

    return plan


def make_act(model):

    def act(state: AgentState) -> AgentState:

        prompt = act_prompt.format_prompt(
            purpose=state['purpose'],
            location_name=state['location_name'],
            description=state['description'],
            last_action=state['actions'][-1],
            result=state['result'],
            plan=state['plans'][-1]
        )

        response = model.invoke(prompt)

        return {
            **state,
            "command": response
        }

    return act


def make_agent(reason_model, plan_model, act_model):

    reason = make_reason(reason_model)
    plan = make_plan(plan_model)
    act = make_act(act_model)
    workflow = Graph()

    workflow.add_node("reason", reason)
    workflow.add_node("plan", plan)
    workflow.add_node("act", act)

    workflow.add_edge("reason", "plan")
    workflow.add_edge("plan", "act")
    workflow.add_edge("act", END)

    workflow.set_entry_point("reason")
    graph = workflow.compile()
    return graph

