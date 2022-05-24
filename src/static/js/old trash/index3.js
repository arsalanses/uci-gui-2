var board = null;
var game = new Chess();
var $status = $('#status');
var $fen = $('#fen_value');
var $pgn = $('#pgn');

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false;

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return 'snapback';

  updateStatus();
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen());
}

function updateStatus () {
  var status = '';

  var moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position';
  }

  // game still on
  else {
    status = moveColor + ' to move';

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check';
    }
  }

    $status.html(status);
    $pgn.html(game.pgn({max_width: 5, newline_char: '<br>'}));
    $fen.val(game.fen());
}

var config = {
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
};
board = Chessboard('chess_board', config);

function Evaluate() {
    $('#take_back').attr('disabled', true);

    $.post('/evaluate',{
        'fen': game.fen(),
        'fixed_depth': $('#fixed_depth').val(),
        'move_time': $('#move_time').val() 
    }, (data) => {
        game.move(data.best_move, {sloppy: true});
        board.position(game.fen());

        updateStatus();

        $('#score').text(data.score);
        $('#depth').text(data.depth);
        $('#time').text(data.time);
        $('#nodes').text(data.nodes);
        var knps = Math.round(Number($('#nodes').text()) / parseFloat($('#time').text())) / 1000
        $('#knps').text(knps);
        
        $('#take_back').attr('disabled', false);
    });
}

$('#take_back').on('click', () => {
    game.undo();
    board.position(game.fen());

    updateStatus();
});

$('#new_game').on('click', () => {
    game.reset();
    board.position('start');

    $('#score').text('');
    $('#depth').text('');
    $('#time').text('');
    $('#nodes').text('');
    $('#knps').text('');

    updateStatus();
});

$('#make_move').on('click', Evaluate);
$('#flip_board').on('click', board.flip);

$('#move_time').on('change', () => {
    $('#fixed_depth').val('0');
});

$('#fixed_depth').on('change', () => {
    $('#move_time').val('0');
});

$('#set_fen').on('click', () => {
    var validate_fen = game.validate_fen($fen.val())
    if(validate_fen['valid']) {
        game.load($fen.val());
        board.position(game.fen());

        console.log(game.ascii());

        updateStatus();
    } else {
        alert(validate_fen['error']);
    }
});

$('#analysis_btn').on('click', () => {
    const socket = io();

    socket.on('connect', function() {
        console.log(socket.connected);
        socket.emit('/fen', {data: game.fen()});
    });

    socket.on('message', function(data) {
        console.log(data);
        // if(data == 'finished') socket.close();
    });

    socket.on('/analysis', function(data) {
        console.log('analysis triger');
        console.log(data);
    });

    socket.on('/finished', function(data) {
        console.log('finished triger');
        socket.close();
    });

    socket.on('disconnect', function() {
        console.log('disconnect');
        socket.close();
    });

    socket.on('error', function(data) {
        console.log('error' + data);
    });

});

updateStatus();
