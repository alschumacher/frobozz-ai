from pydantic import BaseModel, Field
from typing import List, Any
from game.core.description import Description
from game.logger import logger

class Artifact(BaseModel):
    """
    The central construct of the game. Artifacts are anything that can be interacted with in the game world, principally
    Areas, Fixtures and Items.

    Attributes:
        id (str): The unique identifier of the artifact.
        name (str): The name of the artifact.
        triggers (dict): A dictionary of triggers associated with the artifact.
        description_ (Description): The description of the artifact.
        items_ (List[Item]): A list of items contained within the artifact.
        fixtures_ (List[Fixture]): A list of fixtures contained within the artifact.
        container_ (Any): The container that holds this artifact, if any.
        display_order (list): The order in which items and fixtures are displayed when rendering the description.
        container_description (str): The description of this artifact in its container.
    """
    id: str
    name: str
    triggers: dict = {}
    description_: Description
    items_: List[str] = Field(default_factory=list)
    fixtures_: List[str] = Field(default_factory=list)
    container_: Any = None
    display_order: list = Field(default_factory=list)
    container_description: str = ""
    _capacity: int = 100

    class Config:
        extra = "allow"

    def __str__(self):
        return self.id

    def _assign_container(self, game_state):
        """
        The container property has to be set at runtime so this function post init assigns this artifact
        as the container to all of the fixtures it contains.
        :return:
        """
        for art in self._get_artifacts(self.fixtures + self.items, game_state):
            art.container = self

    def _trigger_events(self, event: dict):
        """
        Triggers events based on the provided event dictionary.

        Args:
            event (dict): A dictionary where the key is the event name and the value is the event data.

        This method updates the object's attributes and modifies its description based on the triggers
        defined in the `triggers` attribute. If a trigger is found, it sets the corresponding attribute
        to the specified value and modifies the description accordingly.

        TODO: this method seems to be setting event properties that have already been set.
              I don't really know why and it's not affecting state but it is annoying and unnecessary.
        """
        for item in event.items():
            trigger_name = f"{item[0]}__{item[1]}"
            if trigger_name in self.triggers:
                # logger.debug(f"Looking for trigger {trigger_name} with value on {self.id}")
                triggers = self.triggers[trigger_name]
                for trigger in triggers:
                    # logger.debug(f"Triggering event: {trigger} with value: {triggers[trigger]} on {self.id}")

                    # this check is necessary if the db dumps properties verbosely
                    if self.triggers.get(trigger) != getattr(self, trigger, 'no_match'):
                        try:
                            setattr(self, trigger, triggers[trigger])
                        except:
                            logger.warning(f"Attribute {trigger} is not settable; this is fine in principle if the property is not supposed to be modified.")

            self.description_._modify_description(trigger_name)

    def _get_artifacts(self, ids, game_state):
        """
        Retrieves artifacts from the game state based on their IDs.

        Args:
            ids (list): A list of artifact IDs.
            game_state (GameState): The current game state.

        Returns:
            list: A list of artifacts that match the provided IDs.
        """
        artifacts = []
        for id in ids:
            try:
                artifacts.append(
                    game_state.artifacts[id]
                )
            except:
                logger.warning(f"Could not get artifact with ID: {id}")
        return artifacts

    def get_description(self, game_state) -> str:
        """
        Renders the description of the artifact based on current object state.
        :return: The rendered description.
        """
        return self.description_.render(self, game_state)

    @property
    def capacity(self):
        return self._capacity

    @property
    def items(self):
        return self.items_

    @items.setter
    def items(self, items):
        self.items_ = items

    @property
    def fixtures(self):
        return self.fixtures_

    @fixtures.setter
    def fixtures(self, fixtures):
        self.fixtures_ = fixtures

    @property
    def container(self):
        return self.container_

    @container.setter
    def container(self, container):
        self.container_ = container

    @property
    def is_openable(self):
        return self.properties.is_openable

    @property
    def is_open(self):
        return self.properties.is_open

    @is_open.setter
    def is_open(self, value):
        if not self.properties.is_open and value:
            self.properties.is_open = True
        elif self.properties.is_open and not value:
            self.properties.is_open = False

    @property
    def is_locked(self):
        return self.properties.is_locked

    @is_locked.setter
    def is_locked(self, value):
        if self.properties.is_openable and not self.properties.is_open and self.properties.is_locked:
            self.properties.is_locked = False

    @property
    def is_visible(self):
        return self.properties.is_visible

    @is_visible.setter
    def is_visible(self, value):
        self.properties.is_visible = value

    @property
    def is_accessible(self):
        return self.properties.is_accessible

    @is_accessible.setter
    def is_accessible(self, value):
        self.properties.is_accessible = value

    @property
    def is_dark(self):
        return self.properties.is_dark

    @is_dark.setter
    def is_dark(self, value):
        self.properties.is_dark = value