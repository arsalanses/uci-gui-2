function onChange(oldPos, newPos) {
    if (localStorage.getItem("oldPos") === null) {
        var old_positions = [];
    } else {
        var old_positions = JSON.parse(localStorage.getItem("oldPos"));
    }

    old_positions.push(Chessboard.objToFen(oldPos));
    localStorage.setItem("oldPos", JSON.stringify(old_positions));
}

function onDrop(source, target, piece, newPos, oldPos, orientation) {
    Evaluate();
}

function onSnapEnd() {
    board.position(board.fen())
}

var config = {
    onSnapEnd: onSnapEnd,
    onChange: onChange,
    position: 'start',
    draggable: true,
    onDrop: onDrop
};
var board = Chessboard('chess_board', config);

function Evaluate() {
    $('#take_back').attr('disabled', true);

    $.post('/evaluate',{
        'fen': `${board.fen()} ${$('#color').val()}`,
        'fixed_depth': $('#fixed_depth option:selected').val(),
        'move_time': $('#move_time option:selected').val() 
    }, function(data) {
        $('#score').text(data.score);
        $('#depth').text(data.depth);
        $('#time').text(data.time);
        $('#nodes').text(data.nodes);
        $('#knps').text(Math.round(Number($('#nodes').text()) / parseFloat($('#time').text())) / 1000);
        
        $('#take_back').attr('disabled', false);

        // $status.html(status)
        // $fen.val(game.fen())
        // $('#pgn').html(game.pgn({max_width: 5, newline_char: '<br/>'}))
        $('#pgn').html(data.best_move)
    });
}

$('#new_game').on('click', () => {
    board.start();
    localStorage.clear();
});

$('#make_move').on('click', Evaluate);
$('#flip_board').on('click', board.flip);

$('#take_back').on('click', () => {
    if (localStorage.getItem("oldPos") !== null) {
        old_positions = JSON.parse(localStorage.getItem("oldPos"));
        board.position(old_positions.pop());
        localStorage.setItem("oldPos", JSON.stringify(old_positions));
    }
});

$('#move_time').on('change', () => {
    $('#fixed_depth').val('0');
});

$('#fixed_depth').on('change', () => {
    $('#move_time').val('0');
});