#!/bin/bash

# Start FastAPI app on port 8000
echo "Starting FastAPI on port 8000..."
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000 &

# Start MCP Server on port 8001
# echo "Starting MCP Server on port 8001..."
export PYTHONPATH=.
python ./backend/mcp_server.py &

# Wait for FastAPI and MCP Server to start (optional, can be customized)
sleep 5 # Increased sleep to allow both services to start

# Start Streamlit app on port 8501
echo "Starting Streamlit on port 8501..."
python -m streamlit run ui/app_no_agent.py --server.address 0.0.0.0 --server.port 8501