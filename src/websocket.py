from websockets.exceptions import ConnectionClosedOK
from flask import Flask, render_template
from flask_socketio import SocketIO
import asyncio
import chess
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

async def infiniteAnalysis(engine, board, ws):
    with await engine.analysis(board) as analysis:
        async for info in analysis:
            if info.pv != None:
                analysisResult = board.variation_san(info.pv)

                try:
                    isMate = info.score.is_mate()
                    data = {
                        'msg': 'analysis',
                        'data': {
                            'depth': info.depth,
                            'isMate': isMate,
                            'score': info.score.white().score()/100 if not isMate else info.score.white().mate(),
                            'pv': analysisResult
                        }
                    }
                    await ws.send(json.dumps(data))

                    if info.score.is_mate():
                        break;
                except (ConnectionClosedOK):
                    await engine.quit()
                    break

if __name__ == '__main__':
    # socketio.run(app)
    asyncio.set_event_loop_policy(chess.engine.EventLoopPolicy())
    server_cor = app.create_server(host="0.0.0.0", port=5000, return_asyncio_server=True, protocol=WebSocketProtocol)

    loop = asyncio.get_event_loop()
    task = loop.create_task(server_cor)
    server = loop.run_until_complete(task)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        loop.stop()
    finally:
        # Wait for server to close
        close_task = server.close()
        loop.run_until_complete(close_task)

        # Complete all tasks on the loop
        for connection in server.connections:
            connection.close_if_idle()
