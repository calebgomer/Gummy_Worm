var traceGeometry;
var traceMaterial = new THREE.MeshLambertMaterial({color: 0x00FF00, opacity: 0.5, transparent: true});

function Snake(name, UNITSIZE) {
	this.name = name;
	this.sections = new LinkedList();
	this.newSectionLocation = null;
	this.length = STARTLENGTH;
	this.traces = [];
	this.speed = MOVESPEED;
	traceGeometry = new THREE.SphereGeometry(UNITSIZE/10,16,16);
}
function Snake(name, headPos, UNITSIZE) {
	this.name = name;
	this.sections = new LinkedList();
	this.sections.add(headPos);
	this.newSectionLocation = null;
	this.length = STARTLENGTH;
	this.traces = [];
	this.speed = MOVESPEED;
	traceGeometry = new THREE.SphereGeometry(UNITSIZE/10,16,16);
}

Snake.prototype = {
	//just scored/ate the apple
	eat: function(theApple) {
		if (theApple.flag == APPLE)
			this.speed = Math.floor(this.speed += 100);
		else if (theApple.flag == GAPPLE)
			this.length = Math.floor(this.length += 100);
		controls.movementSpeed = this.speed;
		speed_gauge.set(this.speed);
		length_gauge.set(this.length)	;
	},
	grow: function() {
		//useless for now
	},
	tail: function() {
		var newTrace = new THREE.Mesh(traceGeometry, traceMaterial);
		var roundedPos = gridToCoord(coordToGrid(camera.position));
		//newTrace.position.x = roundedPos.x;
		//newTrace.position.y = roundedPos.y;
		//newTrace.position.z = roundedPos.z;
		newTrace.position.x = camera.position.x;
		newTrace.position.y = camera.position.y;
		newTrace.position.z = camera.position.z;
		this.traces.splice(0,0,newTrace);
		scene.add(newTrace);

		if (this.traces[this.length-1]) {
			scene.remove(this.traces[this.length-1]);
			this.traces.splice(this.length-1,1);
		}
	}
}