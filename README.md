# Frobozz AI

While there's debate about whether LLMs are capable of deductive reasoning (verdict: close enough), and inductive reasoning (verdict: situationally), there's no chatter that I've seen on whether LLMs are capable of a third kind of reasoning, *abductive* reasoning. This project is intended to test whether LLMs (whether structured as agents or not) are capable of such reasoning.

Let's define abductive reasoning in the following way: the seeking of the best explanation for some observation or circumstance.  Here's a conventional example: you get in your car and press the engine start button, but the car doesn't start.  Even for banal every day scenarios such as this, there is an enormous (some would say infinite) set of explanations for what we observe.  In this case alone, we might entertain any of: (a) the battery is dead (b) the spark plugs are faulty (c) space aliens tampered with your car's electronics.  Abductive reasoning is the process of sorting through this enormous space to come up with the most plausible explanations, which inform future action (check the battery, check the spark plugs, watch the night sky for trickster space aliens).

Humans - and AI agents - have limited resources.  We can't efficiently search the entire hypothesis space before deciding to take an action.  We rely on abductive reasoning to help us navigate the uncertainties of daily life.  So the question becomes, how well do LLMs perform abductive reasoning? It certainly poses some unique challenges; it is often highly contextual, involving a world model, and intuition.  Still, I think LLMs have repeatedly proven their ability to push beyond what a reductive model of their capabilities would imply.

So how best to test their abductive reasoning capabilities? There are two main challenges:
 - **Controlling the environment**: Abductive reasoning is definitionally *contextual*. An environment that is completely controlled is necessary.
 - **Data Contamination**: LLMs (or LLM providers) have demonstrated that they can train greedily on the testing data.  If this is going to be a good test, it needs to be completely novel.

An idea that meets these criteria (and is convenient for certain other reasons) is *text adventures* like the classic Zork series (from which this repo gets its name). In a text adventure, the player solves puzzles with certain pre-defined actions in different contexts.  The entire world is based on text descriptions, which makes them ideal for LLMs, since it's natively text-in-text-out, as LLMs are.  So for example, the text adventure might say something like "There is a key behind a locked glass case.", with the idea that the player must check their inventory for a hammer, and then send a command like "hit glass with hammer", to then make it possible to "take key". 

A text adventure has certain defining characteristics:
 - An **inventory** of persistent objects which can be taken with the player.
 - A set of predefined **actions** which the player can do to interact with the environment.
 - A series of **areas** with different **items** the player can take and **fixtures** which the player can interact with.
 - A **goal**, the accomplishing of which terminates the adventure in success.

With this in mind, it should be clear now just how great of a test of abductive reasoning this is.  There are some practical challenges, however.  In all likelihood, every text adventure every written has been used as training data for LLMs. So I wrote a text adventure engine (`game/`) in which I could write whatever text adventures I wanted, and then I wrote (for now, a very rudimentary) chained LLM (which we can generously call an agent, since it has memory and separation of concerns). Using structured outputs, the agent can be forced to make correct inputs to the text adventure, and then we get to see what happens. 

## Launching the Project

It just uses docker + streamlit, for now anyway, so you'll need that. You'll also need an `OPENAI_API_KEY` and to put that in a `.env` file (just one line of `OPENAI_API_KEY=...` should do it). And then run the following:

`docker build -t text_adventure .`
` docker run -p 5440:5440 -e OPENAI_API_KEY="$(grep OPENAI_API_KEY .env | cut -d '=' -f2)" text_adventure`

Once you do that, you'll be able to just head over to http://localhost:5440

At this point, if you're interested, you can play the text adventure yourself.  

## Provisional Results

Yeah, the agent doesn't do very well.  In most runs, it gets way too distracted by the distractor flask at the very beginning, probably because it was told that finding a flask was the objective of the game. Oh well. It's early days. I'll make an adventurer of ChatGPT yet, I'm sure.

## Notes

* There is a conspicous editor/text-adventure-editor folder in here.  It is a mostly vibe-coded React project for building text adventures by hand within the engine I wrote.
* For now, only OpenAI models are supported. Easy extension later on. The project is still very much in the early stages.
* There is another, much harder, text adventure in the works that will really test all this stuff.