import os
import logging

# Configure the logger
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Create or get a logger instance
logger = logging.getLogger('logger') 
# logging.disable(logging.DEBUG)

# LOG_FILE = '/home/alex/claira/projects/frobozz-ai/adventure.log'


# if os.path.exists(LOG_FILE):
#     os.remove(LOG_FILE)
#     print(f"Removed existing log file: {LOG_FILE}")

# class CombinedHandler(logging.FileHandler):
#     """
#     A custom logging handler that writes log records to a file
#     and also stores them in an in-memory list.
#     """
#     def __init__(self, filename, mode='a', encoding=None, delay=False, level=logging.DEBUG):
#         # Initialize the FileHandler parent class
#         super().__init__(filename, mode, encoding, delay)
#         self.level = level # Set the handler's level
#         self.records = []  # To store raw LogRecord objects
#         self.formatted_messages = [] # To store formatted string messages

#     def emit(self, record):
#         """
#         Emit a record.
#         This method is called by the logger to process a log record.
#         It first calls the parent FileHandler's emit to write to the file,
#         then stores the record and its formatted message in memory.
#         """
#         # 1. Write to file using the parent FileHandler's emit method
#         # This will also apply the formatter attached to this handler
#         super().emit(record)

#         # 2. Store the raw LogRecord object in memory
#         self.records.append(record)

#         # 3. Store the formatted message string in memory
#         # We need to format the record explicitly for the in-memory list
#         self.formatted_messages.append(self.format(record))

list_handler = None

# list_handler = CombinedHandler(LOG_FILE)
# logger.addHandler(list_handler)