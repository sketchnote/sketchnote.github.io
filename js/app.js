var myPath, paths = []

var penColor = 'black', penWidth = 3;

var redoBuffer = []

var backgroundImage = null, mode = 'pen';

var hitPath, hitOptions = {segment: true, stroke: true,	fill: true,	tolerance: 6};

function onMouseDown(event) {
	if(mode == 'pen')	
	{	myPath = new Path();
		myPath.strokeColor = penColor;
		myPath.strokeWidth = penWidth;
	 	myPath.name = 'path';
	}
	else if(mode == 'move')	
	{	myPath = new Path({name: 'dashedPath', strokeColor: 'black', strokeWidth: 3, dashArray: [6, 4]});
	
		// Remove the path, when the mouse is released:
	 	myPath.removeOnUp();
	 
	 	if((event.modifiers.control || event.modifiers.command) && selectedItems.length > 0) // clone while dragging
			for(var i=0; i<selectedItems.length; i++)  
			{
				selectedItems[i].selected = false;
				var newItem = selectedItems[i].clone();
				newItem.name = 'path';
				//newItem.bringToFront();
				
				paths.push(newItem);
			}
	}	
	
	hitPath = project.hitTest(event.point, hitOptions).item;
	pasteConstant = 1;
}

function onMouseDrag(event) {
	if(mode == 'pen')
		myPath.add(event.point);
	else if(mode == 'move')
	{	
		if(selectedItems.length > 0)      // selected items are moved
		{
			for(var i=0; i<selectedItems.length; i++)  
				selectedItems[i].position += event.delta;
		}
		else if (hitPath && hitPath.name == 'path')  //only clicked item is moved
			hitPath.position += event.delta;
		else
			myPath.add(event.point); // it is selection with dashed line
	}
	else if(mode == 'erase')
	{
		var hitResult = project.hitTest(event.point, hitOptions);
		
		if (hitResult.item.name == 'path') 
			hitResult.item.remove();
	}
}

function differentSimplicity(pathp){
	
	console.log(pathp)
	
	for(var k=1; k < 10; k++){
	
		var dd = pathp.clone();
		dd.position.y = pathp.position.y + 20 + 50*k;
		
		dd.strokeColor = penColor;
		dd.strokeWidth = penWidth;

		dd.smooth({type:'catmull-rom'});
		dd.simplify(10 / k);
		
		console.log((10 / k) +' simplification.')
		console.log(dd.segments.length);
	}
	
}

function mergeIfIntersects(myPath){
	
	var last = paths.last();
	
	if(last == undefined) return;

	var ints = myPath.getIntersections(last);
	console.log(ints.length)
	
	
	if(ints.length > 0)
	{
		return new Group([last, myPath])
	}
	else 
	{
		return myPath;
	}	
	
}

selectedItems = []
function onMouseUp(event) {
	if(mode == 'pen'){			// drawing mode
		
		//differentSimplicity(myPath);
		
		mergeIfIntersects(myPath)
		
		myPath.smooth({type:'catmull-rom'});
		myPath.simplify(8);

		if(myPath.segments.length < 2)
		{	
			myPath.remove();
			myPath = new Path.Circle({name: 'path',center: event.point, radius: 3, fillColor:'black'});
		}

		paths.push(myPath);
		redoBuffer = [];
	}
	else if(mode == 'move'){ 	// selection mode
		
		if(myPath.length <= 3)
		{
			for(var i=0; i < paths.length ;i++)
				paths[i].selected = false;
			
			selectedItems = []
			document.getElementById('myCanvas0').className = "canvasDefault" 
			
			return;
		}
			
		for(var i=0; i < paths.length ;i++)			// find seleted items
		{
			myPath.closed = true;
			var intersections = myPath.getIntersections(paths[i]);
			
			if(isContains(paths[i], myPath) || intersections.length > 0)
			{
				paths[i].selected = true;
				selectedItems.push(paths[i]);
				console.log(paths[i])
			}
		}
		
		if(selectedItems.length > 0)
			document.getElementById('myCanvas0').className = "canvasMove" 
		
		console.log(selectedItems.length+' items are selected.')
	}
}

function onKeyDown(evt) {
	console.log(evt.key.charCodeAt(0))
		
	if(evt.key.charCodeAt(0) == 49 || evt.key.charCodeAt(0) == 112) // pen is captured
		window.selectPen();
	else if(evt.key.charCodeAt(0) == 50 || evt.key.charCodeAt(0) == 101) // eraser is captured
		window.selectEraser();
	else if(evt.key.charCodeAt(0) == 51 || evt.key.charCodeAt(0) == 109) // move is captured
		window.selectMove();		
	else if(evt.key.charCodeAt(0) == 26 || evt.key.charCodeAt(0) == 122 || evt.key.charCodeAt(0) == 108) // left key or ctrl+z or command+z
		window.backward();
	else if(evt.key.charCodeAt(0) == 114 || evt.key.charCodeAt(0) == 121) // right key or ctrl+y
		window.forward();
	else if(evt.key.charCodeAt(0) == 98 || evt.key.charCodeAt(0) == 100) // back space or delete
	{
		//selected items will be deleted
		for(var i=0; i<selectedItems.length; i++)
			selectedItems[i].remove();
	}
	else if(evt.key.charCodeAt(0) == 118) // paste selected items
	{
		var newSelectedItems = [];
		for(var i=0; i<selectedItems.length; i++)  
		{
			selectedItems[i].selected = false;
			var newItem = selectedItems[i].clone();
			newItem.selected = true;
			newItem.name = 'path';
			newItem.position += [150, 80];

			paths.push(newItem);
			newSelectedItems.push(newItem);
		}
		selectedItems = newSelectedItems;
	}
	view.update();
};


//////////////////////////////  Select Background Part  //////////////////////////////

backgrounds = [
	{name: 'Basic notepad', link:'images/noteBackground1.jpeg', settings: {scaleCons: 0.65, translate: [-100, -240]}, screenSize: {height: 800, width: 960}, opacity: 0.85},
	{name: 'Linear notepad', link:'images/noteBackground2.jpeg', settings: {scaleCons: 1.3, translate: [+340, -5]}, screenSize: {height: 1200, width: 1170}, opacity: 0.85},
	{name: 'Squared notepad', link:'images/noteBackground3.jpeg', settings: {scaleCons: 1, translate: [12, 0]}, screenSize: {height: 1200, width: 1170}, opacity: 0.75},
	{name: 'Stylish notepad', link:'images/noteBackground4.jpeg', settings: {scaleCons: 0.93, translate: [-10,-135]}, screenSize: {height: 935, width: 1170}, opacity: 0.75}
	]

window.drawBackground = function(num){	
	
	if(num == -1)
	{
		if(backgroundImage)
			backgroundImage.remove();
		view.update();
		return;
	}
	
	var link = backgrounds[num].link
	var scaleCons = backgrounds[num].settings.scaleCons;
	var scr = backgrounds[num].screenSize;
	
	if(backgroundImage)
		backgroundImage.remove();

	backgroundImage = new Raster({name:'background', source: link, position: view.center, height: scr.height, width: scr.width, visible: true});
	backgroundImage.matrix = new Matrix(1*scaleCons, 0, 0, 1*scaleCons, view.center.x, view.center.y);
	backgroundImage.translate(backgrounds[num].settings.translate)
		
	document.getElementById("myCanvas0").height = scr.height;
	document.getElementById("myCanvas0").width = scr.width;
	
	backgroundImage.opacity = backgrounds[num].opacity;
	backgroundImage.sendToBack();
	view.update();
}
drawBackground(1);

//////  My own functions ////////////////////////////////////////////////////////////

function isContains(path, selection)
{
	for(var i=0; i<path.segments.length; i++)
		if(selection.contains(path.segments[i].point))	
			return true;
	return false;
}

//////////////////////////////  Button Selection Part  //////////////////////////////

function removeClasses(){
	$("#penButton").removeClass("btn-primary btn-secondary")
	$("#moveButton").removeClass("btn-primary btn-secondary")
	$("#eraserButton").removeClass("btn-primary btn-secondary")
}

window.selectPen = function(){	
	document.getElementById('myCanvas0').className = "canvasPen" 
	
	removeClasses();
	$("#penButton").addClass("btn-primary")
	
	mode = 'pen'
}

window.selectMove = function(){
	document.getElementById('myCanvas0').className = "canvasDefault" 
	
	removeClasses();
	$("#moveButton").addClass("btn-primary")
	
	mode = 'move'
}

window.selectEraser = function(){
	document.getElementById('myCanvas0').className = "canvasDelete"	
	
	removeClasses();
	$("#eraserButton").addClass("btn-primary")
	mode = 'erase'
}

window.restart = function(){
	//project.activeLayer.removeChildren(); // clears all including background
		
	var r = confirm("Delete all drawings?");
	if(!r) return;
	
	for(var i=0; i<paths.length; i++)
		paths[i].remove();
	
	view.update();
}

///////

window.backward = function(){
	var len = paths.length;

	if(len > 0){
		redoBuffer.push(paths[len-1]);
		paths[len-1].visible = false;
		paths.pop();
	}
}

window.forward = function(){
	var len = redoBuffer.length;
	
	if(len > 0){
		redoBuffer[len-1].visible = true; 
		paths.push(redoBuffer[len-1]);
		redoBuffer.pop();
	}
}

window.changePenColor = function(color){
	penColor = color;
	$("#penColor").css('background-color', color);
	for(var i=0; i<selectedItems.length; i++)  
		selectedItems[i].strokeColor = penColor;
	view.update();
}

window.setWidth = function(width){
	penWidth = width;
	for(var i=0; i<selectedItems.length; i++)  
		selectedItems[i].strokeWidth = penWidth;
	view.update();
}

window.decreaseWidth = function(){
	var group = new Group();
	
	for(var i=0; i<selectedItems.length; i++)  
		group.addChild(selectedItems[i]);
	
	console.log(group.bounds)
	group.scale(0.9, group.bounds.center);
	view.update();
}

window.increaseWidth = function(){
	var group = new Group();
	
	for(var i=0; i<selectedItems.length; i++)  
		group.addChild(selectedItems[i]);
	
	group.scale(1.1, group.bounds.center);
	view.update();
}


//// useful array functions

Array.prototype.last = function() {
    return this[this.length-1];
}