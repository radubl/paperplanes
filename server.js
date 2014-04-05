//	Customization

var appPort = 16558;

// Librairies

var express = require('express'), 
	app = express();
var http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);
var jade = require('jade');

// Utils -> User Stores, Pairing Array, Filters.

var userArray = [];
var pairArray = [];
var socketArray = [];
var forbidden = ['dick', 'cock', 'pussy', 'admin', 'shit', 'pula', 'fuck', 'pizda'];
// Views Options

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set("view options", { layout: false })

app.configure(function() {
	app.use(express.static(__dirname + '/public'));
});

// Render and send the main page

app.get('/', function(req, res){
  res.render('index.jade');
});

server.listen(process.env.PORT || appPort)



console.log("Server listening on port 16558");

// Handle the socket.io connections
																				//count the users

io.sockets.on('connection', function (socket) { 								// First connection

//========================================================= ON CONNECTION FUNCTIONS ======================================

	socket.on('setPlayerName', function (data) { 								// Assign a name to the user
		if (userArray.indexOf(data) == -1 && noSwear(data) && data != '') 		// Test if the name is already taken
		{

			socket.set('playerName', data, function(){
				userArray.push(data);
				socketArray[data] = socket;
				socket.emit('playerNameStatus', 'ok');
				console.log("user " + data + " connected");
			});
			reloadUsers();
		}
		else
		{
			socket.emit('playerNameStatus', 'error') 							// Send the error
		}
	});

	socket.on('setPlayerPlanes', function(data){								// set player planes
		
		var truePlanes = true;
		var tempPlaneArrayChecker = [];											// the set of the cells we have stored.

		if(data.length != 3) 													// if player sent other than 3 planes
			truePlanes = false;
		else
		{
			for (var i = 2; i >= 0; i--) 
			{
			if(data[i].length != 8)												// if plane has a different number of cells
			{
				truePlanes = false;
				break;
			}
			else
			{
				for (var j = 8; j >= 0; j--) 
				{
					if (tempPlaneArrayChecker.indexOf(data[i][j]) != -1)		// if we have seen this cell before, it's bad
					{
						truePlanes = false;
						break;
					}
					else
						tempPlaneArrayChecker.push(data[i][j]);
				}
			}

			}
		}
		
		if (truePlanes)
		{
			socket.set('playerPlanes', data);
		}
		else
		{
			socket.emit("wrongPlanes");
		}
	});

	socket.on('getPlayerPlanes', function(){									// get player planes
		var playerPlanes;

		socket.get('playerPlanes', function(err, planes){
			playerPlanes = planes;
		});
		socket.emit('playerReadyStatus', playerPlanes);
	});

	socket.on('setPlayerReady', function(data){									// set status
		socket.set('playerReady', data, function(){
			var playerReadyStatus;

			socket.get('playerReady', function(err, status){
				playerReadyStatus = status;
			});

			var playerName;

			socket.get('playerName', function(err, name) {
				playerName = name;
			});

			io.sockets.emit('playerReadyStatus',{ playerStatus : playerReadyStatus, playerName : playerName });
		});
		
	});

	socket.on('getPlayerReady', function(playerName){										// get status
			var playerReadyStatus;

			if(socketArray[playerName] != null)
				socketArray[playerName].get('playerReady', function(err, status){
					playerReadyStatus = status;
			});


			socket.emit('requestedPlayerReadyStatus',{ playerStatus : playerReadyStatus, playerName : playerName });
	});

	socket.on("fetchUsers", function(){											// get users
		reloadUsers();
	});

	socket.on('disconnect', function () { 										// disconnection of the client
		if (playerNameSet(socket))
		{
			var playerName;

			socket.get('playerName', function(err, name) {
				playerName = name;
			});

			var index = userArray.indexOf(playerName);
			userArray.splice(index, 1);	
			socketArray[playerName] = null;
		}
		var pairIndex;
		var oppSocket = null;															// let's check if the player disconnects
		
		for (var i = pairArray.length - 1; i >= 0; i--) 								// during a game
			{																			// searching for opponent's socket

				if (pairArray[i].player1 == socket)
				{
					oppSocket = pairArray[i].player2;
					pairIndex = i;
					break;
				}

				if (pairArray[i].player2 == socket)
				{
					oppSocket = pairArray[i].player1;
					pairIndex = i;
					break;
				}

			}

		if(oppSocket != null)		
		{
			oppSocket.emit("gameOver", 2)
			oppSocket.set("gameStatus", 0);

		
			oppSocket.set('playerPlanes', null);		

			pairArray.splice(pairIndex, 1);		
		}
		reloadUsers();
	});

//============================================================	PRE-GAME FUNCTIONS =========================================================

	socket.on('askPlayerForGame', function(opponent){									// asking data for a game.
		var playerName;

		socket.get('playerName', function(err, name) {
			playerName = name;
		});

		var pPlanes;

		socket.get('playerPlanes', function(err, planes){
				pPlanes = planes;
		});

		var oPlanes;

		socketArray[opponent].get('playerPlanes', function(err, planes){
				oPlanes = planes;
		});

		if(pPlanes == null)
			socket.emit('planesNotReady');
		else
			if( oPlanes == null)
				socket.emit('oppPlanesNotReady');
			else
				socketArray[opponent].emit('questionForGame', playerName);

	});

	socket.on('responseForGame', function(opponent){									// evaluating response from opponent
		
		var playerName;

		socket.get('playerName', function(err, name) {
			playerName = name;
		});


		if(opponent.response == 1)
		{
			var pair = new PlayerPair(socket, socketArray[opponent.playerName]);
			pairArray.push(pair);

			socket.set('playerReady', 0);
			socketArray[opponent.playerName].set('playerReady', 0);						// making both players unready

			io.sockets.emit('playerReadyStatus',{ playerStatus : 0, playerName : opponent.playerName });
			io.sockets.emit('playerReadyStatus',{ playerStatus : 0, playerName : playerName });

			socket.emit("startingGame", opponent.playerName);							// start game for both of them
			socketArray[opponent.playerName].emit("startingGame", playerName);

			socket.set("round", 1);
			socketArray[opponent.playerName].set("round", 0);

			socket.emit("roundOppResponse", {hit : -1, i : 0, j : 0 });
			socketArray[opponent.playerName].emit("roundSelfResponse", {hit : -1, i : 0, j : 0 });
		}
		else																			// if the opponent is not ready.
		{
			socketArray[opponent.playerName].emit("playerDeclined", playerName );
		}

	});
//======================================================= IN - GAME FUNCIONS =================================================

	socket.on("roundResult", function(data) {

		var oppSocket = null;
		var round;
		var pairIndex;

		socket.get('round', function(err, r) {
			round = r;
		});

		if (round == 1)
		{

			for (var i = pairArray.length - 1; i >= 0; i--) 
			{																			// searching for opponent's socket

				if (pairArray[i].player1 == socket)
				{
					oppSocket = pairArray[i].player2;
					pairIndex = i;
					break;
				}

				if (pairArray[i].player2 == socket)
				{
					oppSocket = pairArray[i].player1;
					pairIndex = i;
					break;
				}

			}

			if (oppSocket != null)														// if we have an opponent.
			{
				var oppPlanes;

				oppSocket.get('playerPlanes', function(err, planes){
					oppPlanes = planes;
				});

				var gameStatus;

				socket.get('gameStatus', function(err, status){							// let's see how we're staying, 
					gameStatus = status;												// if the game ends today
				});

				var hit = 0;

				for (var i = 0; i < 3; i++)									// let's see if we have a hit.
				{
					for (var j = 0; j < 8; j++)
					{
						
						if (oppPlanes[i][j].i==data.i && oppPlanes[i][j].j==data.j)
						{
							if ( j == 0 )
							{
								hit = 2;
								gameStatus++;
							}
							else
								hit = 1;
							break;
						}
					}
				}

				if (gameStatus == 3)
				{
					socket.emit("gameOver", 1);
					oppSocket.emit("gameOver", 0);

					socket.set("gameStatus", 0);
					oppSocket.set("gameStatus", 0);

					socket.set('playerPlanes', null);
					oppSocket.set('playerPlanes', null);						// making both players ready again

					pairArray.splice(pairIndex, 1);								// Delete our pair.

				}
				else
				{
					socket.emit("roundSelfResponse", {hit : hit, i : data.i, j : data.j });		// we get the response of what we've hit
					oppSocket.emit("roundOppResponse", {hit : hit, i : data.i, j : data.j } );		// we announce our opponent what we've hit and it's his turn

					socket.set("round", 0);										// we change rounds;
					oppSocket.set("round", 1);	

					socket.set("gameStatus", gameStatus);						// Update game status for current player
				}

			}

		}

	});
});


function playerName(){
	var playerName;

	socket.get('playerName', function(err, name) {
		playerName = name;
	});

	return playerName;
}

function reloadUsers() { 														// Send the count of the users to all

	io.sockets.emit('users',{userNo : userArray.length-1, allusers: userArray} );
}

function playerNameSet(socket) { 												// Test if the user has a name
	var test;
	socket.get('playerName', function(err, name) {
		if (name == null ) test = false;
		else test = true;
	});
	return test;
}
function returnplayerName(socket) { 											// Return the name of the user
	var playerName;
	socket.get('playerName', function(err, name) {
		if (name == null ) playerName = false;
		else playerName = name;
	});
	return playerName;
}

function noSwear(name){

	for (var i = forbidden.length - 1; i >= 0; i--) {
		if(name.indexOf(forbidden[i]) > -1)
			return false;
	};

	return true;
}

function PlayerPair(p1, p2) {
	this.player1 = p1;
	this.player2 = p2;
}