from flask import Flask, request, render_template
import chess.engine
import chess

app = Flask(__name__)

@app.route('/')
def root():
    return render_template('index.html')

@app.route('/evaluate', methods=['POST'])
def make_move():
    fen = request.form.get('fen')
    board = chess.Board()
    board.set_fen(fen)

    if board.is_game_over():
        return {}

    try:
        engine = chess.engine.SimpleEngine.popen_uci('/home/mint/share/Other/stockfish_14.1_linux_x64/stockfish_14.1_linux_x64')
    except:
        return {}
    
    # assert engine.ping() == None
    
    fixed_depth = request.form.get('fixed_depth')
    move_time = request.form.get('move_time')

    if not fixed_depth and not move_time:
        return {}

    if int(move_time) in range(1, 20):
        limit = chess.engine.Limit(time=int(move_time))
    elif int(fixed_depth) in range(1, 22):
        limit = chess.engine.Limit(depth=int(fixed_depth))

    try:
        info = engine.analyse(board, limit)
    except:
        return {}
    finally:
        engine.quit()
    
    score = info['score'].white().score() / 100 if not info['score'].is_mate() else info['score'].white().mate()
    best_move = board.san(chess.Move.from_uci(str(info['pv'][0])))
    
    return {
        'ready': True,
        'best_move': best_move,
        'depth': info['depth'],
        'nodes': info['nodes'],
        'time': info['time'],
        'nps': info['nps'],
        'score': score
    }

if __name__ == '__main__':
    app.run(debug=True, threaded=True)
