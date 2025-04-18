#!/bin/bash

# Start FastAPI app on port 8000
echo "Starting FastAPI on port 8000..."
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000 &

# Wait for FastAPI to start (optional, can be customized based on your needs)
sleep 2

# Start Streamlit app on port 5440
echo "Starting Streamlit on port 5440..."
python -m streamlit run ui/app.py --server.address 0.0.0.0 --server.port 5440
