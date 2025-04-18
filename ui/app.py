import streamlit as st
import requests

from constants import BACKEND_URL, RUN_COMMAND

st.session_state['user_message'] = "What wouldst thou deaux?"

st.title("Thyne Donegeonman")

st.write("")
st.write("")
st.write("")

st.text(st.session_state.get('display_text', ''))

col1, col2, col3 = st.columns([1, 2, 1])  # Adjust column width ratios

def change_display_text():
    response = requests.get(f"{BACKEND_URL}{RUN_COMMAND}", params={"command": st.session_state.get('user_input')})
    st.session_state['display_text'] = response.text

# Put the input box in the center column
with col2:
    st.text_input(
        st.session_state.get('user_message'),
        key="user_input",
        on_change=change_display_text
    )

