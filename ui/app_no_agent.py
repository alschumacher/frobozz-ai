import streamlit as st
import requests
import datetime
import pickle
import streamlit.components.v1 as components
import sys
import os

# Add project root to the Python path to find 'game'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Game Imports
from game.engine import TextAdventure

# Local UI imports
from constants import BACKEND_URL, RUN_COMMAND

import logging

st.set_page_config(
    page_title="Text Adventure",
    page_icon="🏰",
    layout="wide",
    initial_sidebar_state="expanded"
)

logging.disable(logging.CRITICAL)

# --- GAME INITIALIZATION ---
def initialize_game():
    """Initializes the game, storing it in the session."""
    if os.path.exists('./adventures/the_vault.pkl'):
        if 'game_initialized' not in st.session_state:
            adventure = pickle.load(open('./adventures/the_vault.pkl', 'rb'))
            st.session_state.adventure = adventure
            st.session_state.game_initialized = True
    elif os.path.exists('./adventures/sample.json'):
        if 'game_initialized' not in st.session_state:
            st.session_state.adventure = TextAdventure(config='./adventures/sample.json')
            st.session_state.game_initialized = True

# Initialize game state
initialize_game()

# Configure page

# Initialize session state variables
if 'chat_history' not in st.session_state:
    st.session_state['chat_history'] = []

if 'display_text' not in st.session_state:
    st.session_state['display_text'] = 'Begin by typing "look"'

if 'user_input' not in st.session_state:
    st.session_state['user_input'] = ''

if 'game_started' not in st.session_state:
    st.session_state['game_started'] = False

# Custom CSS for better styling
st.markdown("""
<style>
.main-game-text {
    background-color: #fff3e0;
    padding: 2rem;
    border-radius: 1rem;
    border-left: 4px solid #ff9800;
    font-size: 1.1rem;
    line-height: 1.6;
    margin: 1rem 0;
}
.stTextInput > div > div > input {
    font-size: 1.1rem;
    color: black;
}
</style>
""", unsafe_allow_html=True)

# Header
st.title("🏰 An Adventurer Are You!")
st.markdown("*An Interactive Text Adventure*")

# Sidebar with game info and controls
with st.sidebar:
    st.header("🎮 Game Controls")
    
    # New game button
    if st.button("🔄 New Game", help="Start a fresh adventure"):
        st.session_state['chat_history'] = []
        st.session_state['display_text'] = 'Begin by typing "look"'
        st.session_state['game_started'] = True
        st.rerun()
    
    # Clear history button
    if st.button("🗑️ Clear History", help="Clear chat history but keep current game state"):
        st.session_state['chat_history'] = []
        st.rerun()
    
    st.divider()
    
    # Game stats/info
    st.header("📊 Session Info")
    st.metric("Commands Sent", len(st.session_state['chat_history']))
    
    if st.session_state['chat_history']:
        last_command_time = st.session_state['chat_history'][-1]['timestamp']
        st.text(f"Last command: {last_command_time.strftime('%H:%M:%S')}")
    
    st.divider()
    
    # Help section
    st.header("💡 Tips")
    st.markdown("""
    - Try commands like: *look*, *go north*, *take sword*
    - Type *help* for game commands
    - Use *inventory* to see your items
    - Commands are not case-sensitive
    """)

# Main game area
col1, col2 = st.columns([2, 1])

with col1:
    # Current game state display
    st.markdown("### 🎯 Current Scene")
    if st.session_state['display_text']:
        st.markdown(f'<div class="main-game-text">{st.session_state["display_text"]}</div>', 
                   unsafe_allow_html=True)
    
    # Command input
    def send_command():
        user_command = st.session_state.get('command_input', '').strip()
        if user_command:
            # Add to chat history
            st.session_state.chat_history.append({
                'user_command': user_command,
                'game_response': "Command sent to game...",  # Placeholder
                'timestamp': datetime.datetime.now(),
                'is_agent': False
            })
            
            try:
                # Make API request
                response = requests.get(
                    f"{BACKEND_URL}{RUN_COMMAND}", 
                    params={"command": user_command},
                    timeout=10
                )
                st.session_state.display_text = response.text
                st.session_state.chat_history[-1]['game_response'] = response.text  # Update placeholder
                
            except requests.exceptions.RequestException as e:
                error_msg = f"Connection error: {str(e)}"
                st.error(error_msg)
                st.session_state.display_text = error_msg
                st.session_state.chat_history[-1]['game_response'] = error_msg

            # Clear input for next command
            st.session_state['command_input'] = ''
            # No need to call st.rerun() explicitly; Streamlit will rerun on state change

    # Command input with better styling
    st.text_input(
        "Enter your command:",
        key="command_input",
        placeholder="What wouldst thou deaux?",
        on_change=send_command,
        help="Type your command and press Enter"
    )

    # Create a layout for the buttons
    col1_btn, col2_btn = st.columns(2)
    with col1_btn:
        if st.button("⚡ Send Command", type="primary", use_container_width=True):
            send_command()

with col2:
    # Chat history display
    st.markdown("### 📜 Adventure Log")
    
    if st.session_state['chat_history']:
        # Build the HTML for the chat log (newest first). We'll reverse later via flex.
        messages_html = ""
        for entry in reversed(st.session_state['chat_history']):  # Reverse the order to show newest last
            timestamp_str = entry['timestamp'].strftime('%H:%M:%S')
            response_preview = entry['game_response']
            user_command = entry['user_command']
            
            # Check if the command was from the agent
            actor_icon = "👤"
            actor_name = "You"

            # Wrap each exchange in a container div
            messages_html += f"""
            <div class='chat-message user-message'>
                <strong>{actor_icon} {actor_name}:</strong> {user_command}<span class='timestamp'> {timestamp_str}</span>
            </div>
            <div class='chat-message game-response'>
                <strong>🏰 Game:</strong> {response_preview}
            </div>
            """
        
        chat_html = f"""
        <style>
            #chat-log {{
                height: 400px;
                overflow-y: auto;
                padding: 1rem;
                background-color: #fafafa;
                border: 1px solid #e0e0e0;
                border-radius: 0.5rem;
                display: flex;
                flex-direction: column; /* Change to normal order */
            }}
            .chat-message {{
                padding: 0.5rem 0.75rem;
                border-radius: 0.5rem;
                margin-bottom: 0.5rem;
                font-size: 0.95rem;
                line-height: 1.4;
            }}
            .user-message {{ background-color:#e3f2fd; align-self: flex-start; }}
            .game-response {{ background-color:#f5f5f5; align-self: flex-end; }}
            .timestamp {{
                font-size: 0.75rem;
                color:#666;
                margin-left:0.5rem;
            }}
            /* Scrollbar styling */
            #chat-log::-webkit-scrollbar {{ width:8px; }}
            #chat-log::-webkit-scrollbar-track {{ background:#f1f1f1; }}
            #chat-log::-webkit-scrollbar-thumb {{ background:#c1c1c1; border-radius:4px; }}
            #chat-log::-webkit-scrollbar-thumb:hover {{ background:#a8a8a8; }}
        </style>
        <div id='chat-log'>
            {messages_html}
        </div>
        <script>
            // Ensure view sticks to bottom on update
            const chatLog = window.parent.document.getElementById('chat-log');
            if(chatLog) {{ chatLog.scrollTop = chatLog.scrollHeight; }}
        </script>
        """
        components.html(chat_html, height=420)
        st.caption(f"💬 {len(st.session_state['chat_history'])} messages in this session")
    else:
        st.markdown("""
        <div style="height: 400px; border: 1px solid #e0e0e0; border-radius: 0.5rem; background-color: #fafafa; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center; color: #666; padding: 2rem;">
                <p>🌟 Your adventure log will appear here as you play!</p>
                <p>Start by typing a command like <em>'look around'</em> or <em>'help'</em></p>
            </div>
        </div>
        """, unsafe_allow_html=True)

# Footer
st.markdown("---")
