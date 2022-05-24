from fastapi.responses import HTMLResponse
from fastapi import FastAPI, WebSocket
from pydantic import BaseModel
import chess.engine
import chess.pgn
import chess

class Fen(BaseModel):
    fen: str

app = FastAPI()


async def evaluate(fen):
    engine = chess.engine.SimpleEngine.popen_uci("/home/mint/share/Other/stockfish_14.1_linux_x64/stockfish_14.1_linux_x64")

    with engine.analysis(chess.Board(str(fen.fen))) as analysis:
        for info in analysis:
            print(info.get("score"))
            
            yield f"{info.get('score')}".encode('UTF-8')

            # Arbitrary stop condition.
            if info.get("seldepth", 0) > 15:
                break
    engine.quit()

html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>WebSocket Chat</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            var ws = new WebSocket("ws://127.0.0.1:8000/ws");
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""

@app.get("/")
async def get():
    return HTMLResponse(html)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, fen: Fen):
    await websocket.accept()
    while True:
        # data = await websocket.receive_text()
        data = await evaluate(fen)
        await websocket.send_text(f"Message text was: {data}")
