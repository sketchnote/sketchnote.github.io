var myPath;
paths = []

var penColor = 'black', penWidth = 3;

var redoBuffer = []

var backgroundImage = null, mode = 'pen';

var hitOptions = { segment: true, stroke: true, fill: true, tolerance: 6 };



function onMouseUp(event) {
	if (mode == 'pen') {			// drawing mode

		myPath.smooth({ type: 'catmull-rom' });
		myPath.simplify(8);

		if (myPath.segments.length < 2) {
			myPath.remove();
			myPath = new Path.Circle({ name: 'path', center: event.point, radius: 3, fillColor: penColor });
		}

		var last = paths.last();
		//if(mergeIfIntersects(myPath) > 0)
		//	paths.push(new Group([myPath, last]));
		//else
		paths.push(myPath);

		redoBuffer = [];
	}
	else if (mode == 'move') { 	// selection mode

		console.log(dashedPath)

		if (hitPath && hitPath.name == 'path') {
			console.log('activated')

			//deselectAllItems();
			hitPath.selected = true;
			activateStyleButtons();
			document.getElementById('myCanvas0').className = "canvasMove";
			return;
		}
		else if (event.delta.length < 10) {
			//deselectAllItems();
			paper.project.selectedItems.forEach(function (el) { el.selected = false; });
			document.getElementById('myCanvas0').className = "canvasDefault"

			return;
		}


		//		else if(dashedPath.segments.length > 0 && dashedPath.length <= 10)
		//		{
		//			deselectAllItems();
		//
		//			console.log('hoppaa')
		//			console.log(dashedPath)
		//			document.getElementById('myCanvas0').className = "canvasDefault"
		//			return;
		//		}
		else if (dashedPath.segments.length > 0 && dashedPath.length > 10) {
			for (var i = 0; i < paths.length; i++)			// find seleted items
			{
				dashedPath.closed = true;
				var intersections = dashedPath.getIntersections(paths[i]);

				if (isContains(paths[i], dashedPath) || intersections.length > 0)
					paths[i].selected = true;
			}
		}

		console.log(paper.project.selectedItems.length + ' items are selected.')
	}
}

function onMouseDown(event) {
	if (mode == 'pen') {
		myPath = new Path();
		myPath.strokeColor = penColor;
		myPath.strokeWidth = penWidth;
		myPath.name = 'path';
	}
	else if (mode == 'move') {
		dashedPath = new Path({ name: 'dashedPath', strokeColor: 'black', strokeWidth: 3, dashArray: [6, 4] });
		dashedPath.removeOnUp(); // Remove the path, when the mouse is released:

		var newSelected = [];
		if ((event.modifiers.control || event.modifiers.command) && paper.project.selectedItems.length > 0) // clone while dragging
		{
			for (var i = 0; i < paper.project.selectedItems.length; i++) {
				var newItem = paper.project.selectedItems[i].clone();
				newItem.selected = false;
				newItem.name = 'path';

				newSelected.push(newItem);
				paths.push(newItem);

			}

			paper.project.selectedItems.forEach(function (el) { el.selected = false; });
			newSelected.forEach(function (el) { el.selected = true; });
		}
	}

	hitPath = project.hitTest(event.point, hitOptions).item;
	if (hitPath && hitPath.name == 'path') {
		deselectAllItems();

		if (hitPath)
			hitPath.selected = true;
	}
}

function onMouseDrag(event) {

	if (mode == 'pen')
		myPath.add(event.point);
	else if (mode == 'move') {
		if (paper.project.selectedItems.length > 0)      // selected items are moved
		{
			for (var i = 0; i < paper.project.selectedItems.length; i++)
				paper.project.selectedItems[i].position += event.delta;
		}
		else if (hitPath && hitPath.name == 'path')  //only clicked item is moved
			hitPath.position += event.delta;
		else
			dashedPath.add(event.point); // it is selection with dashed line
	}
	else if (mode == 'erase') {
		var hitResult = project.hitTest(event.point, hitOptions);

		if (hitResult.item.name == 'path')
			hitResult.item.remove();
	}
}

function onKeyDown(evt) {
	//console.log(evt.key.charCodeAt(0))

	if (evt.key.charCodeAt(0) == 49 || evt.key.charCodeAt(0) == 112) // pen is captured
		window.selectPen();
	else if (evt.key.charCodeAt(0) == 50 || evt.key.charCodeAt(0) == 101) // eraser is captured
		window.selectEraser();
	else if (evt.key.charCodeAt(0) == 51 || evt.key.charCodeAt(0) == 109) // move is captured
		window.selectMove();
	else if (evt.key.charCodeAt(0) == 26 || evt.key.charCodeAt(0) == 122 || evt.key.charCodeAt(0) == 108) // left key or ctrl+z or command+z
		window.backward();
	else if (evt.key.charCodeAt(0) == 114 || evt.key.charCodeAt(0) == 121) // right key or ctrl+y
		window.forward();
	else if (evt.key.charCodeAt(0) == 98 || evt.key.charCodeAt(0) == 100) // back space or delete
	{
		//selected items will be deleted
		var len = paper.project.selectedItems.length;

		for (var i = 0; i < len; i++)
			paper.project.selectedItems[0].remove();
	}
	else if (evt.key.charCodeAt(0) == 118) // paste selected items
	{
		var newSelected = [];
		for (var i = 0; i < paper.project.selectedItems.length; i++) {
			var newItem = paper.project.selectedItems[i].clone();
			newItem.selected = false;
			newItem.name = 'path';
			newItem.position += [150, 80];

			newSelected.push(newItem);
			paths.push(newItem);
		}
		paper.project.selectedItems.forEach(function (el) { el.selected = false; })
		newSelected.forEach(function (el) { el.selected = true; })
	}
	view.update();
};


function differentSimplicity(pathp) {

	console.log(pathp)

	for (var k = 1; k < 10; k++) {

		var dd = pathp.clone();
		dd.position.y = pathp.position.y + 20 + 50 * k;

		dd.strokeColor = penColor;
		dd.strokeWidth = penWidth;

		dd.smooth({ type: 'catmull-rom' });
		dd.simplify(10 / k);

		console.log((10 / k) + ' simplification.')
		console.log(dd.segments.length);
	}

}

function mergeIfIntersects(myPath) {

	var last = paths.last();

	if (last == undefined) return;

	var ints = myPath.getIntersections(last);
	console.log(ints.length)

	return ints.length;
}

function activateStyleButtons() {
	//$("#penColor").addClass("active").removeClass('disabled');
	$("#penWidth").addClass("active").removeClass('disabled');
	$("#objectSize").addClass("active").removeClass('disabled');

	//$("#styleEditPen").addClass("show").removeClass("hide");
	$("#styleEditWidth").addClass("show").removeClass("hide");
	$("#styleEditSize").addClass("show").removeClass("hide");
}

function disableStyleButtons() {
	//$("#penColor").addClass("disabled").removeClass('active');
	$("#penWidth").addClass("disabled").removeClass('active');
	$("#objectSize").addClass("disabled").removeClass('active');

	$("#styleEditWidth").addClass("hide").removeClass("show");
	$("#styleEditSize").addClass("hide").removeClass("show");
}

function deselectAllItems() {
	for (var i = 0; i < paths.length; i++)
		paths[i].selected = false;

	disableStyleButtons();
}

//////////////////////////////  Select Background Part  //////////////////////////////

backgrounds = [
	{ name: 'Empty notepad', link: '', settings: { scaleCons: 1, translate: [0, 0] }, screenSize: { height: 1200, width: 1170 }, opacity: 1 },
	{ name: 'Basic notepad', link: 'images/noteBackground1.jpeg', settings: { scaleCons: 0.68, translate: [-120, -230] }, screenSize: { height: 780, width: 960 }, opacity: 0.85 },
	{ name: 'Linear notepad', link: 'images/noteBackground2.jpeg', settings: { scaleCons: 1.3, translate: [+340, -5] }, screenSize: { height: 1200, width: 1170 }, opacity: 0.85 },
	{ name: 'Squared notepad', link: 'images/noteBackground3.jpeg', settings: { scaleCons: 1, translate: [12, 0] }, screenSize: { height: 1200, width: 1170 }, opacity: 0.75 },
	{ name: 'Stylish notepad', link: 'images/noteBackground4.jpeg', settings: { scaleCons: 0.93, translate: [-10, -135] }, screenSize: { height: 935, width: 1170 }, opacity: 0.75 },
	{ name: 'Image Coordinate notepad', link: 'images/noteBackground5.png', settings: { scaleCons: 1.25, translate: [540, 360] }, screenSize: { height: 535, width: 786 }, opacity: 0.7 }
]

window.drawBackground = function (num) {

	var link = backgrounds[num].link
	var scaleCons = backgrounds[num].settings.scaleCons;
	var src = backgrounds[num].screenSize;
	console.log(backgrounds[num])

	// document.getElementById("myCanvas0").height = src.height;
	// document.getElementById("myCanvas0").width = src.width;

	if (backgroundImage)
		backgroundImage.remove();

	backgroundImage = new Raster({
		name: 'background',
		position: new Point(src.width / 2, src.height / 2),
		// position: view.center,
		source: link,
		height: src.height,
		width: src.width,
		visible: true,
	});

	backgroundImage.matrix = new Matrix(1 * scaleCons, 0, 0, 1 * scaleCons, 0, 0);
	backgroundImage.translate(backgrounds[num].settings.translate)


	backgroundImage.opacity = backgrounds[num].opacity;
	backgroundImage.sendToBack();
	console.log(backgroundImage.position, backgroundImage)
	view.update();
}
drawBackground(5);

//////  My own functions ////////////////////////////////////////////////////////////

function isContains(path, selection) {
	for (var i = 0; i < path.segments.length; i++)
		if (selection.contains(path.segments[i].point))
			return true;
	return false;
}

//////////////////////////////  Button Selection Part  //////////////////////////////

function removeClasses() {
	$("#penButton").removeClass("btn-primary btn-secondary")
	$("#moveButton").removeClass("btn-primary btn-secondary")
	$("#eraserButton").removeClass("btn-primary btn-secondary")
}

window.selectPen = function () {
	document.getElementById('myCanvas0').className = "canvasPen"

	removeClasses()
	$("#penButton").addClass("btn-primary").removeClass("btn-secondary")

	mode = 'pen'
}

window.selectMove = function () {
	document.getElementById('myCanvas0').className = "canvasDefault"

	removeClasses()
	$("#moveButton").addClass("btn-primary").removeClass("btn-secondary")

	mode = 'move'
}

window.selectEraser = function () {
	document.getElementById('myCanvas0').className = "canvasDelete"

	removeClasses();
	$("#eraserButton").addClass("btn-primary")

	mode = 'erase'
}

window.restart = function () {
	//project.activeLayer.removeChildren(); // clears all including background

	var r = confirm("Delete all drawings?");
	if (!r) return;

	for (var i = 0; i < paths.length; i++)
		paths[i].remove();

	for (var i = 0; i < redoBuffer.length; i++)
		redoBuffer[i].remove();

	redoBuffer = []
	paths = []


	view.update();
}

///////

window.backward = function () {
	var len = paths.length;

	if (len > 0) {
		redoBuffer.push(paths[len - 1]);
		paths[len - 1].visible = false;
		paths.pop();
	}
}

window.forward = function () {
	var len = redoBuffer.length;

	if (len > 0) {
		redoBuffer[len - 1].visible = true;
		paths.push(redoBuffer[len - 1]);
		redoBuffer.pop();
	}
}

window.changePenColor = function (color) {
	penColor = color;
	$("#penColor").css('color', color);

	for (var i = 0; i < paper.project.selectedItems.length; i++)
		paper.project.selectedItems[i].strokeColor = penColor;

	hitPath.strokeColor = penColor;
	view.update();
}

window.setWidth = function (width) {
	for (var i = 0; i < paper.project.selectedItems.length; i++)
		paper.project.selectedItems[i].strokeWidth = width;

	$("#penWidth").css('opacity', 1);

	hitPath.strokeWidth = width;
	view.update();
}

window.decreaseWidth = function () {
	var group = new Group();

	for (var i = 0; i < paper.project.selectedItems.length; i++)
		group.addChild(paper.project.selectedItems[i]);

	console.log(group.bounds)
	group.scale(0.9, group.bounds.center);
	hitPath.scale(0.9, hitPath.bounds.center);

	view.update();
}

window.increaseWidth = function () {
	var group = new Group();

	for (var i = 0; i < paper.project.selectedItems.length; i++)
		group.addChild(paper.project.selectedItems[i]);

	group.scale(1.1, group.bounds.center);
	hitPath.scale(1.1, hitPath.bounds.center);
	view.update();
}


//// useful array functions

Array.prototype.last = function () {
	return this[this.length - 1];
}



function handleFileSelect(evt) {
	var files = evt.target.files; // FileList object

	// Loop through the FileList and render image files as thumbnails.
	for (var i = 0, f; f = files[i]; i++) {

		// Only process image files.
		if (!f.type.match('image.*')) {
			continue;
		}

		var reader = new FileReader();
		var output = [];

		// Closure to capture the file information.
		reader.onload = (function (theFile) {
			return function (e) {
				// Render thumbnail.
				var span = document.createElement('span');
				span.innerHTML = ['<img class="thumb" src="', e.target.result,
					'" title="', escape(theFile.name), '"/>', '<strong>', escape(theFile.name), '</strong> <br> ', theFile.size, ' bytes <br>last modified: ', theFile.lastModifiedDate ? theFile.lastModifiedDate.toLocaleDateString() : 'n/a'].join('');

				document.getElementById('list').insertBefore(span, null);
			};
		})(f);

		// Read in the image file as a data URL.
		reader.readAsDataURL(f);


		reader = new FileReader();

		reader.onload = (function (theFile) {
			return function (e) {
				paper.project.importSVG(e.target.result)
				paths = paper.project.getItems({ name: 'path' })
			};
		})(f);

		reader.readAsText(f);
	}
}

document.getElementById('importSVG').addEventListener('change', handleFileSelect, false);

