var matrix = [];
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
var proceeded = false;
var socket;
var playerName = '';
var html = '';
var allUsers = [];
var infoContainer = '';

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

		$('#grid-container').html(cells);
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
		$('.grid').fadeIn("slow");
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

$(document).on("click", "#reset", function(){resetGrid(); } );
//reset the grid

$(document).on("mouseover", ".cell", function(){

	$(this).css("background-color", undefinedHoverColor).css("opacity" , undefinedOpacity);;

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

if (!proceeded)
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
		console.log("removed from openset cell " + planeArray[planeNumber][i].i +", " + planeArray[planeNumber][i].j);

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
			var intermediateHtml = "<div class='info-container' id='xx' style='margin-top: 125px;' >" +
										"<input id = 'nameEnter' value='Enter your name here'></input>" + 
								   		"<div class='btn' onClick='checkName()' style='float:right; margin-right:19px;' > Go </div> " +
								   	"</div>";
			$('#right-grid-selectOpp').html(intermediateHtml);
			$('#right-grid-selectOpp').fadeIn('slow');

		});
		proceeded = true;
	}


}
function checkName(){

	if(infoContainer =='') 
		infoContainer = $('#xx').html();

	socket = io.connect();
	socket.emit("setPlayerName", playerName);

	if (playerName !='' && playerName.length<15)
	{

		socket.on("playerNameStatus", function(data){
		if (data == "ok")
			{
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
				$('#xx').html(infoContainer + addition);
			}
		});
	}

}

//============================================================= DISPLAY PLAYERS ======================================

if(socket != null)
{
	fetchedUsers();
}

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
		$('#oppnumber').html("Opponents: " + (data.userNo));
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
//============================================================= UTILS ======================================================

function resetGrid(){

	for (var i = 0; i < 10; i++)
		for (var j = 0; j < 10; j++){
			matrix[i][j] = new Cell(i,j);
			var id = "#cell" + i + "" + j;
	
			$(id).css("background-color", "white");

		}

		// and reset the stack

		openset = [];
		opensetSize = 0;
		planeNumber = 0;
	    
	    checkProceed();
}

function randomise(){

	console.log("hit randomise!");
	var randomise_count = 0;

	resetGrid();

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

	for (var i = 0; i< planeNumber; i++)
		for (var j = 0; j<8;j++){
			if (planeArray[i][j].i==cell.i && planeArray[i][j].j==cell.j){
				checker = true;
				break;
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
	console.log("added element " +cell.i + ", " + cell.j);
	console.log("new size = "  + opensetSize);
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

	console.log("removed element " + cell.i + ", " + cell.j);
	console.log("new size = "  + opensetSize);
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