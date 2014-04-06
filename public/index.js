// sa ramana avionaele pe ecran si sa apara buton de dismiss.

var matrix = [];
var oppmatrix = [];
var chosenPoints = [];
var openset = [];								// the set of cells to be evaluated
var planeArray = [];							// the set of arrays that each have 8 cells i.e. a plane.
var opensetSize = 0;
var undefinedCellColor = "red";
var planeNumber = 0;
var undefinedOpacity = 0.75;
var undefinedHoverColor = "#ccccff";
var colorsArray = new Array("DarkMagenta","Chocolate","Coral ","Crimson","DarkBlue",
							"DarkRed","DeepPink ","LightSeaGreen","OrangeRed","Tomato");

var chosenColorList = new LinkedList();
var canproceed = false;
var planesLocked = false;
var socket = io.connect();
var playerName = '';
var html = '';
var allUsers = [];
var infoContainer = '';
var playerReady = 1;
var rulesUp = true;
var oppName = '';
var round = 0;
var timer;
var chosenOppCell = '';

// initialise the grid:
window.onload = function (){

		$('#battleships-title').show("slide", {direction: "left"}, 800, function(){
		var cells ='';
		
		for (var i = 0; i < 10; i++){

			matrix[i] = [];

			for (var j = 0; j < 10; j++){

				matrix[i][j] = new Cell(i,j);

				cells += "<span class = 'cell' id='cell"+ i + "" + j + "'  ></span>";
			}
		}

		$('#yourgrid').html(cells);
		loadExampleCells();

		var array1 = [];

		for (var i = 0; i<100;i++)
			if (i<10)
				array1[i] = "#cell0" + i;
			else
				array1[i] = "#cell" + i;

		shuffle(array1);

		var fade_time = 20;

		for (var i = 0; i<array1.length;i++)
			{
				fade_time += 035;
				$(array1[i]).fadeIn(fade_time);
			}

		$('.grid').fadeIn("slow", function(){

				$('#copyright').css("opacity", '1');
				$('#copyright-container').css("margin-left", '0px').css("width", "560");
				$('#author-container').css("margin-right", '-20px').css("width", "300");
				$('#widgets-container').css("opacity", '1');
				$('#author').css("opacity", '1');
				$('#showrules').css("opacity", '1');
		});

	});
}

function loadExampleCells(){

	var examplecells='';

examplecells += "<span class = 'e-cell' style='border:1px solid rgb(233, 233, 233);'></span>";
	examplecells += "<span class = 'e-cell' style='background-color:LightSeaGreen;' ></span>";
examplecells += "<span class = 'e-cell' style='border:1px solid rgb(233, 233, 233);'></span>";
	examplecells += "<span class = 'e-cell' style='background-color:LightSeaGreen;' ></span>";
	examplecells += "<span class = 'e-cell' style='background-color:LightSeaGreen;' ></span>";
	examplecells += "<span class = 'e-cell' style='background-color:LightSeaGreen;' ></span>";
	examplecells += "<span class = 'e-cell' style='background-color:LightSeaGreen;' ></span>";
	examplecells += "<span class = 'e-cell' style='background-color:LightSeaGreen;' ></span>";
examplecells += "<span class = 'e-cell' style='border:1px solid rgb(233, 233, 233);'></span>";
	examplecells += "<span class = 'e-cell' style='background-color:LightSeaGreen;' ></span>";
examplecells += "<span class = 'e-cell' style='border:1px solid rgb(233, 233, 233);'></span>";
	examplecells += "<span class = 'e-cell' style='background-color:LightSeaGreen;' ></span>";

	$('#example').html(examplecells);
}

$(document).on("click", "#reset", function(){resetGrid(""); } );
//reset the grid

$(document).on("mouseover", ".cell", function(){

	$(this).css("background-color", undefinedHoverColor).css("opacity" , undefinedOpacity);;

});

$(document).on("mouseover", ".oppcell", function(){

	$(this).css("background-color", undefinedHoverColor).css("opacity" , undefinedOpacity);;

});

$(document).on("mouseleave", ".oppcell", function(){
	
	var i = $(this).attr('id').slice(-2).charAt(0);
	var j = $(this).attr('id').slice(-1);
	if (oppmatrix[i][j].color=="red" || oppmatrix[i][j].color == undefinedHoverColor)
		$(this).css("background-color", oppmatrix[i][j].color ).css("opacity" , "1");
	else
		$(this).css("background-color", oppmatrix[i][j].color );
});

$(document).on("mouseleave", ".cell", function(){
	
	var i = $(this).attr('id').slice(-2).charAt(0);
	var j = $(this).attr('id').slice(-1);
	if (matrix[i][j].color=="red" || matrix[i][j].color == undefinedHoverColor)
		$(this).css("background-color", matrix[i][j].color ).css("opacity" , "1");
	else
		$(this).css("background-color", matrix[i][j].color );
});

/*toggling the cell:
	- changing color depending on the curent color.
	- adding/removing cell from stack depending on color.
*/

$(document).on("mousedown", ".cell", function(){

if (!planesLocked)
{
	var i = $(this).attr('id').slice(-2).charAt(0);
	var j = $(this).attr('id').slice(-1);
		
	if (matrix[i][j].color == "white"){
		//we add to stack
		add_to_openset(matrix[i][j]);

		// we change color to red
		matrix[i][j].color = undefinedCellColor;
		$(this).css("background-color", undefinedCellColor).css("opacity" , "1");

	}
	else{
		// we remove from stack
		remove_from_openset(matrix[i][j]);

		// we change color to white
		matrix[i][j].color = "white";
		$(this).css("background-color", "white")
		
	}

	checkForPlane(matrix[i][j]);
	checkProceed();
}
});

function checkForPlane(mat_elem){
 // console.log(openset_indexOf(mat_elem));
if (openset_indexOf(mat_elem) != -1)						// the element checked is not in openset
{

	for (var i = 0; i<opensetSize; i++) {

        var curentCell = openset[i];
        // console.log("checking for " +  curentCell.i + " , " + curentCell.j);

        /* plane to WEST */
        if (curentCell.i>0 && curentCell.i<9)												
	        if (curentCell.j>2 && openset_indexOf(matrix[curentCell.i][curentCell.j-3])!=-1)		//head and bumm exist
	        {
	        	if (openset_indexOf(matrix[curentCell.i-1][curentCell.j-3])!=-1
	        	 && openset_indexOf(matrix[curentCell.i+1][curentCell.j-3])!=-1)					//bumm and legs
	        	 {
	        	 	if (openset_indexOf(matrix[curentCell.i][curentCell.j-2])!=-1)					//body center
	        	 	{
	        	 		if (openset_indexOf(matrix[curentCell.i][curentCell.j-1])!=-1 				// body arms
	        	 			&& openset_indexOf(matrix[curentCell.i+1][curentCell.j-1])!=-1
	        	 			&& openset_indexOf(matrix[curentCell.i-1][curentCell.j-1])!=-1)
	        	 		{
	        	 			definePlane(matrix[curentCell.i][curentCell.j], "west");
	        	 			break;
	        	 		}
	        	 	}
	        	 }					
	   		 }

		/* plane to EAST */
	   	if (curentCell.i>0 && curentCell.i<9)												
	        if (curentCell.j<7 && openset_indexOf(matrix[curentCell.i][curentCell.j+3])!=-1)		//head and bumm exist
	        {
	        	if (openset_indexOf(matrix[curentCell.i-1][curentCell.j+3])!=-1
	        	 && openset_indexOf(matrix[curentCell.i+1][curentCell.j+3])!=-1)					//bumm and legs
	        	 {
	        	 	if (openset_indexOf(matrix[curentCell.i][curentCell.j+2])!=-1)					//body center
	        	 	{
	        	 		if (openset_indexOf(matrix[curentCell.i][curentCell.j+1])!=-1 				// body arms
	        	 			&& openset_indexOf(matrix[curentCell.i+1][curentCell.j+1])!=-1
	        	 			&& openset_indexOf(matrix[curentCell.i-1][curentCell.j+1])!=-1)
	        	 		{
	        	 			definePlane(matrix[curentCell.i][curentCell.j], "east");
	        	 			break;
	        	 		}
	        	 	}
	        	 }					
	   		 }

	   	/* plane to NORTH */
	   	if (curentCell.j>0 && curentCell.j<9)												
	        if (curentCell.i>2 && openset_indexOf(matrix[curentCell.i-3][curentCell.j])!=-1)		//head and bumm exist
	        {
	        	if (openset_indexOf(matrix[curentCell.i-3][curentCell.j-1])!=-1
	        	 && openset_indexOf(matrix[curentCell.i-3][curentCell.j+1])!=-1)					//bumm and legs
	        	 {
	        	 	if (openset_indexOf(matrix[curentCell.i-2][curentCell.j])!=-1)					//body center
	        	 	{
	        	 		if (openset_indexOf(matrix[curentCell.i-1][curentCell.j])!=-1 				// body arms
	        	 			&& openset_indexOf(matrix[curentCell.i-1][curentCell.j+1])!=-1
	        	 			&& openset_indexOf(matrix[curentCell.i-1][curentCell.j-1])!=-1)
	        	 		{
	        	 			definePlane(matrix[curentCell.i][curentCell.j], "south");
	        	 			break;
	        	 		}
	        	 	}
	        	 }					
	   		 }
		/* plane to SOUTH */
	   	if (curentCell.j>0 && curentCell.j<9)												
	        if (curentCell.i<7 && openset_indexOf(matrix[curentCell.i+3][curentCell.j])!=-1)		//head and bumm exist
	        {
	        	if (openset_indexOf(matrix[curentCell.i+3][curentCell.j-1])!=-1
	        	 && openset_indexOf(matrix[curentCell.i+3][curentCell.j+1])!=-1)					//bumm and legs
	        	 {
	        	 	if (openset_indexOf(matrix[curentCell.i+2][curentCell.j])!=-1)					//body center
	        	 	{
	        	 		if (openset_indexOf(matrix[curentCell.i+1][curentCell.j])!=-1 				// body arms
	        	 			&& openset_indexOf(matrix[curentCell.i+1][curentCell.j+1])!=-1
	        	 			&& openset_indexOf(matrix[curentCell.i+1][curentCell.j-1])!=-1)
	        	 		{
	        	 			definePlane(matrix[curentCell.i][curentCell.j], "north");
	        	 			break;
	        	 		}
	        	 	}
	        	 }					
	   		 }
    }
}
else															// the element is not in openset
{
	for (var i = 0; i < planeNumber; i++) {			// let's see if the element is part of a plane
		
		var j = 0;
		var k = -1;

        for (j = 0; j<8 ; j++){									// search through the existing planes
       
        	if (planeArray[i][j].i==mat_elem.i && planeArray[i][j].j==mat_elem.j)
        	{
        		k = 0;											// if we found our element, it means that the element was toggled
        		console.log("not in openset")
        		break;											// thus, the plane has been dismembered.
        	}
        }

        if (k==0)
        {
        	for (var m = 0; m<8 ; m++){
        		if (m!=j)
        		{
        			add_to_openset(planeArray[i][m]);
        			var id = "#cell" + planeArray[i][m].i + "" + planeArray[i][m].j;
					$(id).css("background-color", undefinedCellColor).css("opacity" , "1");
					planeArray[i][m].color = undefinedCellColor;
        		}
        	}
        	
	        
        	for (var p = i; p < planeNumber-1; p++) 					// if we're toggling off a part of this plane, it's no longer whole
        	{
        			for (var o = 0; o < 8; o++)
        				planeArray[p][o] = planeArray[p+1][o];			// delete it from the plane array and shift all elements left with 1.
        	}
        	planeNumber--;
        	
        	break;
        }

	}
}
}

function definePlane(head, direction){
	/*create a new openset for our plane, add all the cells to it, remove them from the open openset, and change color */

	planeArray[planeNumber] = [];
	
	planeArray[planeNumber][0] = head;

	var count = 0;

	switch(direction){
		case "north":
			planeArray[planeNumber][++count] = (matrix[head.i+1][head.j]);
			planeArray[planeNumber][++count] = (matrix[head.i+1][head.j+1]);
			planeArray[planeNumber][++count] = (matrix[head.i+1][head.j-1]);
			planeArray[planeNumber][++count] = (matrix[head.i+2][head.j]);
			planeArray[planeNumber][++count] = (matrix[head.i+3][head.j]);
			planeArray[planeNumber][++count] = (matrix[head.i+3][head.j-1]);
			planeArray[planeNumber][++count] = (matrix[head.i+3][head.j+1]);
			break;
		case "south":
			planeArray[planeNumber][++count] = (matrix[head.i-1][head.j]);
			planeArray[planeNumber][++count] = (matrix[head.i-1][head.j+1]);
			planeArray[planeNumber][++count] = (matrix[head.i-1][head.j-1]);
			planeArray[planeNumber][++count] = (matrix[head.i-2][head.j]);
			planeArray[planeNumber][++count] = (matrix[head.i-3][head.j]);
			planeArray[planeNumber][++count] = (matrix[head.i-3][head.j-1]);
			planeArray[planeNumber][++count] = (matrix[head.i-3][head.j+1]);
			break;
		case "east":
			planeArray[planeNumber][++count] = (matrix[head.i][head.j+1]);
			planeArray[planeNumber][++count] = (matrix[head.i-1][head.j+1]);
			planeArray[planeNumber][++count] = (matrix[head.i+1][head.j+1]);
			planeArray[planeNumber][++count] = (matrix[head.i][head.j+2]);
			planeArray[planeNumber][++count] = (matrix[head.i][head.j+3]);
			planeArray[planeNumber][++count] = (matrix[head.i-1][head.j+3]);
			planeArray[planeNumber][++count] = (matrix[head.i+1][head.j+3]);
			break;
		case "west":
			planeArray[planeNumber][++count] = (matrix[head.i][head.j-1]);
			planeArray[planeNumber][++count] = (matrix[head.i-1][head.j-1]);
			planeArray[planeNumber][++count] = (matrix[head.i+1][head.j-1]);
			planeArray[planeNumber][++count] = (matrix[head.i][head.j-2]);
			planeArray[planeNumber][++count] = (matrix[head.i][head.j-3]);
			planeArray[planeNumber][++count] = (matrix[head.i-1][head.j-3]);
			planeArray[planeNumber][++count] = (matrix[head.i+1][head.j-3]);
			break;
	}

	do{				// choose a new color from the color array. If the color has been chosen before, rechoose.
		if (chosenColorList.getSize()==colorsArray.length)
			chosenColorList.emptyList();

		var index = Math.floor(Math.random() * colorsArray.length);

	} while (chosenColorList.indexOf(index)!=-1);

	chosenColorList.add(index);

	for (var i = 0; i<8; i++) {

        planeArray[planeNumber][i].color = colorsArray[index];
		var id = "#cell" + planeArray[planeNumber][i].i + "" + planeArray[planeNumber][i].j;

		$(id).css("background-color", colorsArray[index]).css("opacity" , undefinedOpacity);

		remove_from_openset(planeArray[planeNumber][i]);
		//console.log("removed from openset cell " + planeArray[planeNumber][i].i +", " + planeArray[planeNumber][i].j);

    }

    planeNumber++;
    
	//alert(direction);

}
//=========================================================== PLANES READY ========================================================
function proceed(){
	
	if (canproceed)
	{
		$('#right-grid-getReady').fadeOut('slow', function(){
			html = $('#right-grid-selectOpp').html();
			var intermediateHtml = "<div class='info-container' id='playerNameContainer' style='margin-top: 125px;' >" +
										"<input id = 'nameEnter' value='Enter your name here'></input>" + 
								   		"<div class='btn' onClick='checkName()' style='float:right; margin-right:19px;' > Go </div> " +
								   	"</div>";
			$('#right-grid-selectOpp').html(intermediateHtml);
			$('#right-grid-selectOpp').fadeIn('slow');

		});
		planesLocked = true;
	}


}
function checkName(){

	if (infoContainer =='') 
		infoContainer = $('#playerNameContainer').html();
	
	if (playerName !='' && playerName.length<15)
	{
		socket.emit("setPlayerName", playerName);

		socket.on("playerNameStatus", function(data){
		if (data == "ok")
			{
				socket.emit("setPlayerPlanes", planeArray);	
				socket.emit("setPlayerReady", 1);									//player ready at the beginning

				$('#right-grid-selectOpp').fadeOut('slow', function(){

				$('#right-grid-selectOpp').html(html);
				$('#right-grid-selectOpp').fadeIn('slow', function() {
					socket.emit("fetchUsers");
					fetchedUsers();
				});

		});
			}
			else
			{
				var addition = "<div id='takenName' >Name already taken or forbidden</div>";
				$('#playerNameContainer').html(infoContainer + addition);
			}
		});
	}

}

//============================================================= DISPLAY PLAYERS ======================================

	socket.on('playerReadyStatus', function(data){
		
		if(data.playerStatus == 1)													// if player ready
		{
			$('#' + data.playerName).removeClass();
			$('#' + data.playerName).addClass('selectOpponent');
			playerReady = 1;
		}
		else
		{
			$('#' + data.playerName).removeClass();
			$('#' + data.playerName).addClass('selectOpponentChange');
			playerReady = 0;
		}
	});


	socket.on('wrongPlanes', function(){

		alertify.alert("Tzc, tzc. You modified some javascript didn't you?");

	});

function fetchedUsers() {
		socket.on('users', function(data){

		var oppHtml = '';
		for (var i = 0; i < data.allusers.length; i++)
		{
			if(playerName != data.allusers[i])
				oppHtml += "<div class='selectOpponent' id='"+ data.allusers[i] +"'>"+ data.allusers[i] +"</div>";
		}
		allUsers = data.allusers;
		
		$('#opponents').html(oppHtml).slideDown("slow");

		if (data.userNo == 1)
			$('#oppnumber').html("There is <strong>" + (data.userNo) +"</strong> Opponent 	&nbsp;	| &nbsp; <strong> You</strong>  are:");
		else
			$('#oppnumber').html("There are <strong>" + (data.userNo) +"</strong> Opponents &nbsp;	| &nbsp; <strong> You</strong>  are:");
	});
}

function filterOutput(){

		var filter = $("#filterBox").val();
		var oppHtml = '';
		for (var i = 0; i < allUsers.length; i++)
		{
			if(allUsers[i].indexOf(filter) > -1 && playerName != allUsers[i])
				oppHtml += "<div class='selectOpponent' id='"+ allUsers[i] +"'>"+ allUsers[i] +"</div>";
		}


		$('#opponents').html(oppHtml);
}

//=========================================================PLAYER CHOOSING =================================================
$(document).on("click", ".selectOpponent", function(){

	var oppName = $(this).attr("id");

	socket.emit("askPlayerForGame", oppName);

});

socket.on("questionForGame", function(opponent){

	alertify.set({ labels: {
    ok     : "Accept",
    cancel : "Decline"
} });

	alertify.confirm(opponent + " asks you to play a game together.", function (e) {
    if (e) {
        socket.emit("responseForGame", {playerName : opponent, response : 1} );
        socket.emit("setPlayerReady", 0);
    } else {
        socket.emit("responseForGame", {playerName : opponent, response : 0} );
        socket.emit("setPlayerReady", 1);
    }
	});

});

socket.on("playerDeclined", function(opponent){

	alertify.set({ labels: {
    ok     : "Ok"
	} });

	alertify.alert(opponent + "  has rejected your request.");
	socket.emit("setPlayerReady", 1);
});

socket.on("startingGame", function(opponent){

	var cells ='';

	oppName = opponent;

	for (var i = 0; i < 10; i++){									// fill the opponent matrix;

		oppmatrix[i] = [];

		for (var j = 0; j < 10; j++){

			oppmatrix[i][j] = new Cell(i,j);

			cells += "<span class = 'oppcell' id='oppcell"+ i + "" + j + "'  ></span>";
		}
	}

	for (var i = 0; i < 10; i++){									// fill the chosen Points matrix;

		chosenPoints[i] = [];

		for (var j = 0; j < 10; j++){

			chosenPoints[i][j] = 0;
		}
	}

	$('#oppgrid').html(cells);

	$('#right-grid-selectOpp').fadeOut( function(){
		$('#right-grid-Play').fadeIn(function(){
			$('.game-info-container').fadeIn('slow', function(){
				$('.game-info-container').css('width', '420px');
				setTimeout(function(){$('#second-game-info-box').fadeOut('slow', function(){
					$('#fuckjquery').fadeIn("slow");
					});
				},1000);

			});
		});
	});

});

socket.on("planesNotReady", function(){
		alertify.set({ labels: {
    ok     : "Ok"
	} });
	alertify.alert(" Your planes are not ready.");
});


socket.on("oppPlanesNotReady", function(){
		alertify.set({ labels: {
    ok     : "Ok"
	} });
	alertify.alert(" Your opponent's planes are not ready.");
});

//========================================================= IN - GAME FUNCTIONS ============================================


socket.on("roundSelfResponse", function(data){

	var cellid = '#oppcell' + data.i + '' + data.j;
	var color = $(cellid).css("background-color");

	if(data.hit == -1)
	{
		$("#turninfo").html("It's " + oppName +"'s Turn <span id='countdown'></span>");
	}

	if(data.hit == 0){

		$(cellid).addClass("air-cell");
		$(cellid).css("background-color", color);
	}
	else
		if(data.hit == 1)
		{
			$(cellid).addClass("hit-cell");
			$(cellid).css("background-color", color);
		}
		else
			if(data.hit == 2)
				{
					$(cellid).addClass("skull-cell");
					$(cellid).css("background-color", color);
				}

});

socket.on("roundOppResponse", function(data){

	//update my grid about opponen's change, change info about rounds, start timer, allow missile sending.

	$("#countdown").css("color", "green");
	$("#turninfo").html("It's your Turn <span id='countdown'></span>");

	var countdown = 31;

	if(data.hit == -1)
		var countdown = 34;

	round = 1;

	timer = setInterval( function(){

		countdown--;

		var scd = "" + countdown;

		document.getElementById("countdown").innerHTML = scd;

		if (countdown == 5)
			$("#countdown").css("color", "red");

		if (countdown == 0)											// if we reached the 1 min countdown, radomise and send;
		{
			do{

				var chosenI = Math.floor((Math.random()*10));
				var chosenJ = Math.floor((Math.random()*10));

			}while( chosenPoints[chosenI][chosenJ] != 0)

			chosenPoints[chosenI][chosenJ] = 1;

			socket.emit("roundResult", {i : chosenI, j : chosenJ});
			clearInterval(timer);
		}
	},1000);

	var cellid = '#cell' + data.i + '' + data.j;
	var color = $(cellid).css("background-color");

	if(data.hit == 0){

		$(cellid).addClass("air-cell");
		$(cellid).css("background-color", color);
	}
	else
		if(data.hit == 1)
		{
			$(cellid).addClass("hit-cell");
			$(cellid).css("background-color", color);
		}
		else
			if(data.hit == 2)
				{
					$(cellid).addClass("skull-cell");
					$(cellid).css("background-color", color);
				}
});

socket.on("gameOver", function(data){

	if(data.winner == 2)
	{
			alertify.set({ labels: {
		    ok     : "Ok"
			} });
			alertify.alert("You won. Opponent disconnected.");
	}
	else
		if(data.winner == 1)
		{
			alertify.set({ labels: {
		    ok     : "Ok"
			} });
			alertify.alert("You won.");
		}
		else
		{
			alertify.set({ labels: {
		    ok     : "Ok"
			} });
			alertify.alert("You lost.");
		}

	// Here I need to change color of Opponent planes.

	for (var i = 2; i >= 0; i--) 
	{
		for (var j = 7; j >= 0; j--) 
		{
			var oppcellid = "#oppcell" + data.oppPlanes[i][j].i + '' + data.oppPlanes[i][j].j;
			oppmatrix[data.oppPlanes[i][j].i][data.oppPlanes[i][j].j] = data.oppPlanes[i][j];

			$(oppcellid).css("background-color", data.oppPlanes[i][j].color);
		};
	};

	$('#turninfo').html("<div class='btn2' id='finishUp' onClick='finishGameAndComeBack()'> Finish Up </div>");
	

});

function finishGameAndComeBack() {

	$('#ready').css("width", "110");
	setTimeout(function(){
		$('#ready').removeClass();											// set player unready, just in case.
		$('#ready').addClass("unready");
		$('#ready').html("pending");
		playerReady = 0;
	},500);

	$('#fuckjquery').fadeOut("slow", function(){							// pop up the plane creation menu
		$("#second-game-info-box").fadeIn();
	});

	$('#right-grid-Play').fadeOut("slow", function(){						// come back to opponents chosing page.
		$('#right-grid-selectOpp').fadeIn();								// unlock planes for construction.
		planesLocked = false;
		resetGrid("all");
	});

}

$(document).on("mousedown", ".oppcell", function()							// player selects a spot to hit on.	
{
	if(round == 1)															// if it's his round,
	{
		var chosenI = $(this).attr('id').slice(-2).charAt(0);
		var chosenJ = $(this).attr('id').slice(-1);

		if (oppmatrix[chosenI][chosenJ].color.length == 3)					// if we already selected this cell, send it
		{
			chosenPoints[chosenI][chosenJ] = 1;
			socket.emit("roundResult", {i : chosenI, j : chosenJ});
			clearInterval(timer);											// stop the countdown.
			$("#turninfo").html("It's " + oppName +"'s Turn <span id='countdown'></span>");				
																			// announce opponent turn.
		}
		else 																// else, set it's color red;
		{
			$(this).css("background-color", "red").css("opacity" ,"1");
			$(chosenOppCell).css("background-color", "white").css("opacity", undefinedOpacity);

			oppmatrix[chosenI][chosenJ].color = "red";

			if(chosenOppCell.length > 1)
			{
				var chosenoppI = chosenOppCell.slice(-2).charAt(0);
				var chosenoppJ = chosenOppCell.slice(-1);

				oppmatrix[chosenoppI][chosenoppJ].color = "white";
			}
		}	

		chosenOppCell = '#oppcell' + chosenI + '' + chosenJ;
	}
});
//============================================================= UTILS ======================================================

function getReady(){

	if(canproceed)
	{
		socket.emit("setPlayerPlanes", planeArray);	
		socket.emit("setPlayerReady", 1);
		planesLocked = true;

		$('#ready').css("width", "100px");

		setTimeout(function(){
		$('#ready').removeClass();
		$('#ready').addClass("ready");
		$('#ready').html("ready");
		playerReady = 1;
		},500);
	}
}
function resetGrid(option){

	if(option === "all")
	{
		var cells ='';
		
		for (var i = 0; i < 10; i++){

			matrix[i] = [];

			for (var j = 0; j < 10; j++){

				matrix[i][j] = new Cell(i,j);

				cells += "<span class = 'cell' id='cell"+ i + "" + j + "'  ></span>";
			}
		}

		$('#yourgrid').html(cells);
		loadExampleCells();

		var array1 = [];

		for (var i = 0; i<100;i++)
			if (i<10)
				array1[i] = "#cell0" + i;
			else
				array1[i] = "#cell" + i;

		shuffle(array1);

		var fade_time = 20;

		for (var i = 0; i<array1.length;i++)
			{
				fade_time += 035;
				$(array1[i]).fadeIn(fade_time);
			}
	}
	else
	{

		for (var i = 0; i < 10; i++)
			for (var j = 0; j < 10; j++){
				matrix[i][j] = new Cell(i,j);
				var id = "#cell" + i + "" + j;
		
				$(id).css("background-color", "white");

			}
	}


		// and reset the stack

		openset = [];
		opensetSize = 0;
		planeNumber = 0;
	    
	    checkProceed();
}

function randomise(){

	var randomise_count = 0;

	resetGrid("");

	while (randomise_count < 3){

		var direction = Math.floor((Math.random()*4));
		switch(direction){
		case 0:		
			var x = Math.floor((Math.random()*7));
			var y = Math.floor((Math.random()*8)+1);

			if (planeArray_contains(matrix[x+1][y]))
				break;
			if (planeArray_contains(matrix[x+1][y+1]))
				break;
			if (planeArray_contains(matrix[x+1][y-1]))
				break;
			if (planeArray_contains(matrix[x+2][y]))
				break;
			if (planeArray_contains(matrix[x+3][y]))
				break;
			if (planeArray_contains(matrix[x+3][y-1]))
				break;
			if (planeArray_contains(matrix[x+3][y+1]))
				break;
			if (planeArray_contains(matrix[x][y]))
				break;

			definePlane(matrix[x][y], "north");
			randomise_count++;

			break;
		case 2:
			var x = Math.floor((Math.random()*7)+3);
			var y = Math.floor((Math.random()*8)+1);

			if (planeArray_contains(matrix[x-1][y]))
				break;
			if (planeArray_contains(matrix[x-1][y+1]))
				break;
			if (planeArray_contains(matrix[x-1][y-1]))
				break;
			if (planeArray_contains(matrix[x-2][y]))
				break;
			if (planeArray_contains(matrix[x-3][y]))
				break;
			if (planeArray_contains(matrix[x-3][y-1]))
				break;
			if (planeArray_contains(matrix[x-3][y+1]))
				break;
			if (planeArray_contains(matrix[x][y]))
				break;

			definePlane(matrix[x][y], "south");
			randomise_count++;

			break;
		case 1:
			var y = Math.floor((Math.random()*7));
			var x = Math.floor((Math.random()*8)+1);

			if (planeArray_contains(matrix[x][y+1]))
				break;
			if (planeArray_contains(matrix[x+1][y+1]))
				break;
			if (planeArray_contains(matrix[x-1][y+1]))
				break;
			if (planeArray_contains(matrix[x][y+2]))
				break;
			if (planeArray_contains(matrix[x][y+3]))
				break;
			if (planeArray_contains(matrix[x+1][y+3]))
				break;
			if (planeArray_contains(matrix[x-1][y+3]))
				break;
			if (planeArray_contains(matrix[x][y]))
				break;

			definePlane(matrix[x][y], "east");
			randomise_count++;

			break;
		case 3:
			var y = Math.floor((Math.random()*7)+3);
			var x = Math.floor((Math.random()*8)+1);

			if (planeArray_contains(matrix[x][y-1]))
				break;
			if (planeArray_contains(matrix[x+1][y-1]))
				break;
			if (planeArray_contains(matrix[x-1][y-1]))
				break;
			if (planeArray_contains(matrix[x][y-2]))
				break;
			if (planeArray_contains(matrix[x][y-3]))
				break;
			if (planeArray_contains(matrix[x+1][y-3]))
				break;
			if (planeArray_contains(matrix[x-1][y-3]))
				break;
			if (planeArray_contains(matrix[x][y]))
				break;

			definePlane(matrix[x][y], "west");
			randomise_count++;

			break;
		}
		console.log("looping");
	}

	checkProceed();
}

function planeArray_contains(cell){

	var checker = false;

	for (var i = 0; i < planeNumber; i++)
	{
		for (var j = 0; j < 8;j++){

			if (planeArray[i][j].i==cell.i && planeArray[i][j].j==cell.j){
				checker = true;
				break;
			}
		}
	}
	return checker;
}

function clearRed(){

		for (var i = 0; i < opensetSize; i++)
		{
			var id = "#cell" + openset[i].i + "" + openset[i].j;
			$(id).css("background-color", "white").css("opacity" , undefinedOpacity);
			openset[i].color = "white";
		}

		openset = [];
		opensetSize = 0;
		checkProceed();
}

function checkProceed(){

	if (planeNumber == 3 && opensetSize == 0)
	{
		$('.proceed').toggleClass("proceed-change");
		canproceed = true;
	}
	else
	{
		$('.proceed').removeClass().toggleClass("proceed");
		canproceed = false;
	}
}

function shuffle(o){ //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function openset_indexOf(cell){

	var index = -1;

	for (var i = 0; i<opensetSize;i++)
	{
		if (openset[i].i == cell.i && openset[i].j == cell.j)
		{
			index = i;
			break;
		}
	}

	return index;
}
function add_to_openset(cell){

	openset[opensetSize] = cell;
	opensetSize++;
	//console.log("added element " +cell.i + ", " + cell.j);
	//console.log("new size = "  + opensetSize);
}
function remove_from_openset(cell){

	var index = openset_indexOf(cell);							// get the index of the cell we want to remove;

	if (index != -1)
	{
		for (var i = index; i<opensetSize-1;i++)
		{
			openset[i] = openset[i+1];								// shift all the elemets to the left with 1.
		}

		opensetSize--;												// decrease set size.
	}

	//console.log("removed element " + cell.i + ", " + cell.j);
	//console.log("new size = "  + opensetSize);
}

function Cell(i,j) {
	this.i = i;
	this.j = j;
	this.color = "white";
}

$(document).on("focus",'#nameEnter', function(){
	$("#nameEnter").val("");
	$("#nameEnter").css("color", "black");
});

$(document).on("blur",'#nameEnter', function(){
	playerName = $('#nameEnter').val();
	$("#nameEnter").css("color", "rgb(204, 204, 255)");
	if(playerName =='')
	{
		$("#nameEnter").val("Enter your name here");
	}
});

$(document).on("keypress",'#nameEnter', function(e){
		playerName = $('#nameEnter').val();
		if(e.which == 13)
			checkName();
});

$(document).on("focus",'#filterBox', function(){
	$("#filterBox").val("");
	$("#filterBox").css("color", "black");
});
	
$(document).on("blur",'#filterBox', function(){	
	if($('#filterBox').val() =='')
	{
		$("#filterBox").val("Type here to filter");
		$("#filterBox").css("color", "rgb(204, 204, 255)");
	}
});

$(document).on("click",'#ready', function(){

	if (playerReady == 1)											// if the player is ready and we click
	{																// it means we wishes to change his readiness
		setTimeout(function(){
			$('#ready').removeClass();
			$('#ready').addClass("unready");
			$('#ready').html("pending");
			playerReady = 0;										// make the player unready
			socket.emit("setPlayerReady", playerReady);						// finally, update his status.
		},500);
		$('#ready').css("width", "110");

	}
	else 															// else, he is unready and wishes to be ready
	{
		setTimeout(function(){
			$('#ready').removeClass();
			$('#ready').addClass("ready");
			$('#ready').html("ready");
			playerReady = 1;
			socket.emit("setPlayerReady", playerReady);						// finally, update his status.
		},500);
		$('#ready').css("width", "100");
		
	}

	
});
function showRules(){

	if (rulesUp)
	{
		$('#copyright').css("height", "1020px");
		$('#rulez').fadeIn();
		rulesUp = false;
	}
	else
	{
		$('#rulez').fadeOut(function(){
			$('#copyright').css("height", "70px");
		});
		rulesUp = true;

	}
	
}

function OpenInNewTab()
{
  var win=window.open('https://github.com/radubl/paperplanes', '_blank');
  win.focus();
}

// ============================================= Linked list implementation ===========================================

function LinkedListNode() {
  this.data = null;
  this.next = null;
}

function LinkedList() {
  this.firstNode = null;
  this.lastNode = null;
  this.size = 0;

 this.add = function(data) {

    var newNode = new LinkedListNode();
    newNode.data = data;

    if (this.firstNode == null) {
      this.firstNode = newNode;
      this.lastNode = newNode;
    }
    else {
      this.lastNode.next = newNode;					// we set the next of last node the current node
      this.lastNode = newNode;						// we make the current node the last node.
    }

    this.size++;
    console.log(this.size);
  }

   this.remove = function(data) {
    var currentNode = this.firstNode;				// start from the first node.

        if (this.size == 0) {						// if the size of the list is 0, return( nothing to delete)
          return;
        }

        var wasDeleted = false;						// create a checking variable

        /* Are we deleting the first node? */
        if (this.size == 1) 
       		if (data.i == currentNode.data.i && data.j == currentNode.data.j) 
       		{

	              this.firstNode.data = null;
	              this.firstNode = null;
	              this.lastNode = null;
	              this.size--;
	              console.log(this.size);
	              return;

       		}

        while (true) {
            /* If end of list, stop */
            if (currentNode == null) {
              wasDeleted = false;
                break;
            }

            /* Check if the data of the next is what we're looking for */
            var nextNode = currentNode.next;
            if (nextNode != null) {
                if ((data.i == nextNode.data.i && data.j == nextNode.data.j )) {

                    /* Found the right one, loop around the node */
                    var nextNextNode = nextNode.next;
                    currentNode.next = nextNextNode;

                    nextNode = null;
                    wasDeleted = true;
                    break;
                }
            }

            currentNode = currentNode.next;
        }

        if (wasDeleted) {
        	this.size--;
        	console.log(this.size);
        }
    }

     this.getSize = function() {
    return this.size;
  }

  this.indexOf = function(data) {
    var currentNode = this.firstNode;
    var position = 0;
    var found = false;

        for (; ; position++) {
            if (currentNode == null) {
                break;
            }

            if (data == currentNode.data) {
              found = true;
                break;
            }

            currentNode = currentNode.next;
        }

        if (!found) {
          position = -1;
        }

        return position;
  }

  this.toString = function() {
      var currentNode = this.firstNode;

      result = '{';

      for (i = 0; currentNode != null; i++) {
        if (i > 0) {
          result += ',';
        }
        var dataObject = currentNode.data;

        result += (dataObject == null ? '' : dataObject);
          currentNode = currentNode.next;
      }
      result += '}';

      return result;
  }

  this.emptyList = function(){
  	  	this.firstNode = null;
  		this.lastNode = null;
  		this.size = 0;
  }
}