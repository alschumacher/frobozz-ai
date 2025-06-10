import en_core_web_sm

nlp = en_core_web_sm.load()

def parse_command(command:str) -> tuple:
    """
    Parses a command string into an action, object, and indirect object.

    Args:
        command (str): The command string to parse.

    Returns:
        tuple: A tuple containing the action, object, and indirect object.
    """
    # parse it with spacy
    parsed_command = nlp(command)

    # all verbs have to be a single token and the first in the command
    action = parsed_command[0].text

    prep_in_command = any([tok.pos_ == 'ADP' for tok in parsed_command])
    dative_in_command = any([tok.dep_ == 'dative' for tok in parsed_command])

    object, iobject = '', ''

    # if there are no prepositions
    if not prep_in_command:
        # then the rest of the command is the object
        object = " ".join([x.text for x in parsed_command[1:]])

    # if there are prepositions and it is not a double object construction
    elif len(parsed_command) > 2 and not dative_in_command and prep_in_command:
        # find the preposition
        adp_index = [tok.i for tok in parsed_command if tok.pos_ == 'ADP'][0]
        # the object is everything before the preposition
        object = " ".join([x.text for x in parsed_command[1:adp_index]])

        # the indirect object is everything after the preposition
        iobject = " ".join([x.text for x in parsed_command[adp_index+1:]])
    # if there are prepositions and it is a double object construction
    elif len(parsed_command) > 2 and dative_in_command:
        # find the direct object
        for tok in parsed_command:
            if tok.dep_ == 'dobj':
                object = tok.text
                break
        # find the indirect object
        for tok in parsed_command:
            if tok.dep_ in ['dative', 'pobj']:
                iobject = tok.text
                break

    return action, object, iobject