FROM python:3.10
WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY /adventures adventures/
COPY /agent agent/
COPY /backend backend/
COPY /game game/
COPY /tests tests/
COPY /ui ui/
COPY play.sh .
COPY .env .
COPY simulate.py .

EXPOSE 5440

CMD ["./play.sh"]
