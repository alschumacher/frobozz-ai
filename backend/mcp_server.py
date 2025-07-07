import copy
import os
import pickle
from datetime import datetime, timedelta

from fastmcp import FastMCP

from game.engine import TextAdventure

adventure = None

# Load adventure
def load_adventure():
    if os.path.exists('./adventures/the_vault.pkl'):
        adventure = pickle.load(open('./adventures/the_vault.pkl', 'rb'))
    elif os.path.exists('./adventures/sample.json'):
        adventure = TextAdventure(config='./adventures/sample.json')
    return adventure

adventure = load_adventure()

# Single game state for this process/client
last_activity_time = None

# Define the inactivity timeout (30 minutes)
INACTIVITY_TIMEOUT = timedelta(minutes=30)

mcp_server_instance = FastMCP()

@mcp_server_instance.tool() 
def run_game_command(command:str) -> str:
    global last_activity_time
    global adventure

    print(command)
    
    response = ""

    now = datetime.now()

    if adventure is None:
        adventure = load_adventure()
    if last_activity_time and (now - last_activity_time) > INACTIVITY_TIMEOUT:
        print(f"Game reset due to inactivity. Last activity: {last_activity_time}, now: {now}")
        adventure = load_adventure()
        response = "Game reset due to 30 minutes of inactivity. Starting a new game.\n"
    
    last_activity_time = now
    
    if command:
        cmd_response = adventure.run_command(command)
        response += cmd_response
    
    return response

if __name__ == "__main__":
    mcp_server_instance.run(transport="streamable-http", port=8001)
