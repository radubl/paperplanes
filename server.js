//	Customization

var appPort = 16558;

// Librairies

var express = require('express'), 
	app = express();

var http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);


var jade = require('jade');
// var io = require('socket.io').listen(app);
var userArray = []; 
var forbidden = ['dick', 'cock', 'pussy', 'admin', 'shit', 'pula', 'fuck'];
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
// app.listen(appPort);
console.log("Server listening on port 16558");

// Handle the socket.io connections

var users = 0; 																//count the users

io.sockets.on('connection', function (socket) { 							// First connection

																			// Send the count to all the users
	socket.on('message', function (data) { 									// Broadcast the message to all
		if(playerNameSet(socket))
		{
			var transmit = {date : new Date().toISOString(), playerName : returnplayerName(socket), message : data};
			socket.broadcast.emit('message', transmit);
			console.log("user "+ transmit['playerName'] +" said \""+data+"\"");
		}
	});

	socket.on('setPlayerName', function (data) { 							// Assign a name to the user
		if (userArray.indexOf(data) == -1 && noSwear(data)) 				// Test if the name is already taken
		{
			users += 1; 													// Add 1 to the count 	
			socket.set('playerName', data, function(){
				userArray.push(data);
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

	socket.on("fetchUsers", function(){
		reloadUsers();
	});

	socket.on('disconnect', function () { 									// Disconnection of the client
		users -= 1;
		if (playerNameSet(socket))
		{
			var playerName;
			socket.get('playerName', function(err, name) {
				playerName = name;
			});
			var index = userArray.indexOf(playerName);
			userArray.splice(index, 1);
		}
		reloadUsers();
	});
});

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