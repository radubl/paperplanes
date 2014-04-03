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

var users = 0; 																	//count the users

io.sockets.on('connection', function (socket) { 								// First connection

//========================================================= ON CONNECTION FUNCTIONS ======================================

	socket.on('setPlayerName', function (data) { 								// Assign a name to the user
		if (userArray.indexOf(data) == -1 && noSwear(data) && data != '') 		// Test if the name is already taken
		{
			users += 1; 														// Add 1 to the count 	
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
		//need to check for planes.
		socket.set('playerPlanes', data);
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
		users -= 1;
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
		reloadUsers();
	});

//============================================================	GAME FUNCTIONS =========================================================

	socket.on('askPlayerForGame', function(opponent){									// asking data for a game.
		var playerName;

		socket.get('playerName', function(err, name) {
			playerName = name;
		});
		socketArray[opponent].emit('questionForGame', playerName);

	});

	socket.on('responseForGame', function(opponent){									// evaluating response from opponent

		if(opponent.response == 1)
		{
			var playerName;

			socket.get('playerName', function(err, name) {
				playerName = name;
			});

			var pair = new PlayerPair(socket, socketArray[opponent.playerName]);
			pairArray.push(pair);

			socket.set('playerReady', 0);
			socketArray[opponent.playerName].set('playerReady', 0);						// making both players unready

			io.sockets.emit('playerReadyStatus',{ playerStatus : 0, playerName : opponent.playerName });
			io.sockets.emit('playerReadyStatus',{ playerStatus : 0, playerName : playerName });

			socket.emit("startingGame");												// start game for both of them
			socketArray[opponent.playerName].emit("startingGame");
		}
		else																			// if the opponent is not ready.
		{
			socketArray[opponent.playerName].emit("playerDeclined", playerName );
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
	io.sockets.emit('users',{userNo : users-1, allusers: userArray} );
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