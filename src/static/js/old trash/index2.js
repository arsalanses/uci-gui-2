function make_move() {
    $('#take_back').attr('disabled', true);

    $.post('/make_move',{
        'pgn': game.pgn(),
        'fixed_depth': $('#fixed_depth option:selected').val(),
        'move_time': $('#move_time option:selected').val() 
    }, function(data) {
        game.move(data.best_move, { sloppy: true })
        board.position(game.fen());
        $score.text(data.score);
        $depth.text(data.depth);
        $time.text(data.time);
        $nodes.text(data.nodes);
        $knps.text(Math.round(Number($nodes.text()) / parseFloat($time.text())) / 1000)
        
        updateStatus();
        
        $('#take_back').attr('disabled', false);
    });
}

$('#new_game').on('click', function() {
    game.reset();
    board.position('start');
    updateStatus();
});

$('#make_move').on('click', function() {
    make_move();
});

$('#take_back').on('click', function() {
    game.undo();
    game.undo();
    board.position(game.fen());

    updateStatus();
});

$('#flip_board').on('click', function() {
    board.flip();
});

$('#move_time').on('change', function() {
    $('#fixed_depth').val('0');
});

$('#fixed_depth').on('change', function() {
    $('#move_time').val('0');
});

$('#set_fen').on('click', function() {
    if (game.load($('#fen').val()))
        board.position(game.fen());
    else
        alert('Illegal FEN!');
});

// $('#download_button').on('click', function() {
//     var date = new Date();
//     var pgn_header = '';
//     var user_name = prompt('What is your name?');
//     var user_color = prompt('What color did you play with? (please type "White" or "Black")');
//     if (user_color == 'White') {
//         pgn_header = '[White "' + user_name + '"]\n[Black ""]\n\n';
//         $('#download_link').attr('download', user_name + date.toString().replace(/\s/g, "_") + '.pgn');
//     } else if (user_color == 'Black') {
//         pgn_header = '[White ""]\n[Black "' + user_name + '"]\n\n';
//         $('#download_link').attr('download', user_name + '_' + date.toString().replace(/\s/g, "_") + '.pgn');
//     } else {
//         alert('Color is illegal, please type "White" or "Black"');
//         return; 
//     }
//     $('#download_link').attr('href', window.URL.createObjectURL(new Blob([pgn_header + game.pgn()], {type: 'text'})));
//     $('#download_link')[0].click();
// });

var board = null;
var game = new Chess();
var $status = $('#status');
var $fen = $('#fen');
var $pgn = $('#pgn');
var $score = $('#score');
var $depth = $('#depth');
var $time = $('#time');
var $nodes = $('#nodes');
var $knps = $('#knps')

function onDragStart (source, piece, position, orientation) {
    if (game.game_over()) return false
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onDrop (source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })
    if (move === null) return 'snapback'
    make_move();
    updateStatus();
}

function onSnapEnd () {
    board.position(game.fen())
}

function updateStatus () {
    var status = ''
    var moveColor = 'White'
    if (game.turn() === 'b') {
        moveColor = 'Black'
    }

    if (game.in_checkmate()) {
        status = 'Game over, ' + moveColor + ' is in checkmate.'
    } else if (game.in_draw()) {
        status = 'Game over, drawn position'
    } else {
        status = moveColor + ' to move'
        if (game.in_check()) {
            status += ', ' + moveColor + ' is in check'
        }
    }
    $status.html(status)
    $fen.val(game.fen())
    $pgn.html(game.pgn({max_width: 5, newline_char: '<br/>'}))
}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
}

board = Chessboard('chess_board', config)

$('#chess_board').on('scroll touchmove touchend touchstart contextmenu', function(e) {
    e.preventDefault();
});

updateStatus();
