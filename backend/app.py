from fastapi import FastAPI

from game.engine import TextAdventure

adventure = TextAdventure(config='./adventures/sample.json')

app = FastAPI()

@app.get("/run_command")
def run_command(command):
    return adventure.run_command(command)

