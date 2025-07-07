import os
import pickle
import base64
from datetime import datetime, timedelta

from fastapi import FastAPI
from pydantic import BaseModel

from game.engine import TextAdventure

# Load adventure function
def load_adventure():
    if os.path.exists('./adventures/the_vault.pkl'):
        return pickle.load(open('./adventures/the_vault.pkl', 'rb'))
    elif os.path.exists('./adventures/sample.json'):
        return TextAdventure(config='./adventures/sample.json')
    return None

adventure = load_adventure()

# Track last activity time for inactivity timeout
last_activity_time = None

# Define the inactivity timeout (15 minutes)
INACTIVITY_TIMEOUT = timedelta(minutes=15)

class CommandRequest(BaseModel):
    game_state: str  # Base64 encoded pickle
    command: str


app = FastAPI()


def serialize_game_state(game_state):
    """Serialize game state to base64 string"""
    pickled = pickle.dumps(game_state)
    return base64.b64encode(pickled).decode('utf-8')


def deserialize_game_state(serialized_state):
    """Deserialize game state from base64 string"""
    pickled = base64.b64decode(serialized_state.encode('utf-8'))
    return pickle.loads(pickled)


@app.get("/run_command")
def run_command(command):
    global last_activity_time
    global adventure
    
    now = datetime.now()
    
    # Check for inactivity timeout
    if adventure is None:
        adventure = load_adventure()
    if last_activity_time and (now - last_activity_time) > INACTIVITY_TIMEOUT:
        print(f"Game reset due to inactivity. Last activity: {last_activity_time}, now: {now}")
        adventure = load_adventure()
    
    last_activity_time = now
    
    return adventure.run_command(command)


@app.post("/run_state_command")
def run_state_command(request: CommandRequest):
    try:
        # Deserialize the game state
        game_state = deserialize_game_state(request.game_state)
        command = request.command
        
        new_game_state, response = adventure.run_state_command(game_state, command)
        
        return {
            "game_state": serialize_game_state(new_game_state),
            "response": response
        }
    except Exception as e:
        return {"error": f"Failed to process command: {str(e)}"}