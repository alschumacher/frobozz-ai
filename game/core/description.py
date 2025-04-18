from pydantic import BaseModel

from game.models import GameState

from game.logger import logger

class Description(BaseModel):
    """
    Represents a description of an artifact in the game.

    Attributes:
        start (str): The starting part of the description.
        end (str): The ending part of the description.
        triggers (dict): A dictionary of triggers that modify the description.
        name (str): The name of the description.
    """
    start: str
    end: str = ""
    triggers: dict = {}
    name: str = ''

    def render(self, context: 'Artifact', game_state:GameState) -> str:
        """
        Renders the description of the artifact based on its current state.

        Args:
            context (Artifact): The artifact context containing fixtures and items.

        Returns:
            str: The rendered description.
        """
        self.name = context.name + "_description"
        middle = self._make_middle(context, game_state)
        return f"{self.start} {middle} {self.end}".strip()

    def _make_middle(self, context: 'Artifact', game_state:GameState) -> str:
        """
        Constructs the middle part of the description based on the visibility and display order of fixtures and items.

        Args:
            context (Artifact): The artifact context containing fixtures and items.

        Returns:
            str: The constructed middle part of the description.
        """

        # these need to be converted from ids to object references, dummy
        middle = []
        if context.display_order:
            for id in context.display_order:
                for fxt in context.fixtures:
                    fxt = game_state.artifacts[fxt]
                    if fxt.id == id and fxt.is_visible:
                        middle.append(fxt.container_description)
                for item in context.items:
                    item = game_state.artifacts[item]
                    if item.id == id and item.is_visible:
                        middle.append(item.container_description)
        else:
            context_artifact_ids = context.fixtures + context.items
            for fxt in context._get_artifacts(context_artifact_ids, game_state):
                if fxt.is_visible:
                    middle.append(fxt.container_description)
        return " ".join(middle)

    def _modify_description(self, event: dict):
        """
        Modifies the description based on the given event.
        """
        effect = self.triggers.get(event, {})
        if effect.get('start'):
            logger.debug(f"Setting {self.name} start description to {effect['start']} due to event {event}")
            self.start = effect['start']
        if effect.get('end'):
            logger.debug(f"Setting {self.name} end description to {effect['end']} due to event {event}")
            self.end = effect['end']
