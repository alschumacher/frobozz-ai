from typing import Any, List, Union, Optional, Literal
from pydantic import BaseModel, Field

from game.logger import logger

class GameState(BaseModel):
    inventory: list = Field(default_factory=list)
    log: List[str] = Field(default_factory=lambda: ['[GAME START]'])
    score: int = 0
    timer: int = 0
    artifacts: dict = Field(default_factory=dict)
    id_to_name: dict = Field(default_factory=dict)
    events: dict = Field(default_factory=dict)
    interactions: dict = Field(default_factory=dict)
    visited_tiles: list = Field(default_factory=list)

    @property
    def event_log(self):
        return self.events

    @event_log.setter
    def event_log(self, event:dict):
        if event:
            logger.info(f'Updating game state with event: {event}')
            self.events.update(event)
            self._trigger_events(event)

    # this has no toggle support
    def _trigger_events(self, event:dict):
        for object in self.artifacts.values():
            object._trigger_events(event)


class HandleActionResponse(BaseModel):
    key:str = '' # the lookup key for any interaction
    message: str = '' # display message on use of item
    events: dict = {} # game flags changed after use
    new_state: Any = None # the state to change the game to
    consumed: Optional[bool] = None # item consumed after use
    item: Optional[Any] = None # technically should be of the `Item` class (this should not be editable and should be hidden but be present for each with default value in db)
    is_repeatable: bool = True # action is repeatable
    success: bool = False # action succeeded (this should not be editable and should be hidden but be present for each with default value in db)


class ItemProperties(BaseModel):
    is_openable: bool = False # as in, openable in principle.
    is_open: bool = False
    is_broken: bool = False
    is_accessible: bool = True
    is_locked: bool = False
    is_visible: bool = True


class FixtureProperties(BaseModel):
    is_openable: bool = False
    is_open: bool = False
    is_locked: bool = False
    is_visible: bool = True
    is_accessible: Literal[False] = Field(False)


class AreaProperties(BaseModel):
    is_accessible: bool = True
    is_visible: bool = True