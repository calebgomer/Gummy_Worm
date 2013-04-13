//Globals
var WIDTH = window.innerWidth,
	HEIGHT = window.innerHeight,
	ASPECT = WIDTH / HEIGHT,
	GRIDSIZE = 10,
	UNITSIZE = 300,
	WALLHEIGHT = UNITSIZE / 3,
	MOVESPEED = 300,
	STARTLENGTH = 600,
	LOOKSPEED = 0.050,
	APPLE = -10,
	GAPPLE = -11,
	AIR = 0,
	WIREFRAMES = false;

var scene, camera, renderer, controls, clock;
var speed_gauge, length_gauge, applesEaten = 0;
var runAnim = true;
var mouse = { x: 0, y: 0 };
var fov = 50, near = 0.1, far = 10000;
//angle to radians conversion factor
var ATR = 3.1415926536/180.0;

//grid of the world
var map = new Array(GRIDSIZE);
for (var i = 0; i < GRIDSIZE; i++) {
	map[i] = new Array(GRIDSIZE);
	for (var j = 0; j < GRIDSIZE; j++) {
		map[i][j] = new Array(GRIDSIZE);
		for (var k = 0; k < GRIDSIZE; k++) {
			map[i][j][k] = 0;
		}
	}
}
var mapWidth = map.length;
var mapHeight = map[0].length;
var mapDepth = map[0][0].length;

//apples
var rApple = new Apple(APPLE, UNITSIZE);
var gApple = new Apple(GAPPLE, UNITSIZE);

//snake
var snake;

function scored(apple) {
	applesEaten++;
	snake.eat(apple);
	$('#score').text(applesEaten);
	$('#score').fadeIn();
	setTimeout(function() {
		$('#score').fadeOut();
	}, 3000);
	apple.randomize(map, GRIDSIZE);
}

//everything's ready
function startUp() {
	init();
	animate();
}
// $(document).ready(function() {
// 	init();
// 	animate();
// 	// $('#music')[0].play();
// });

// Handle window resizing
$(window).resize(function() {
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
	ASPECT = WIDTH / HEIGHT;
	if (camera) {
		camera.aspect = ASPECT;
		camera.updateProjectionMatrix();
	}
	if (renderer) {
		renderer.setSize(WIDTH, HEIGHT);
	}
});

//stop moving around when the window is unfocused
$(window).blur(function() {
	if (controls) controls.freeze = true;
});
//begin moving when windows regains focus
$(window).focus(function() {
	if (controls) controls.freeze = false;
});

//animate
function animate() {
	if (runAnim) {
		requestAnimationFrame(animate);
	}
	render();
}

//Initialize everything
function init() {

	scene = new THREE.Scene();
	clock = new THREE.Clock();

	camera = new THREE.PerspectiveCamera(fov, ASPECT, near, far);
	scene.add(camera);
	//make sure camera is inside a block, not halfway between two
	camera.position.x += UNITSIZE/2;
	camera.position.z += UNITSIZE/2;

	//make the snake
	snake = new Snake("Snake", coordToGrid(camera.position));

	//init apples
	rApple = new Apple(APPLE);
	scene.add(rApple.sphere);
	rApple.randomize();

	gApple = new Apple(GAPPLE);
	scene.add(gApple.sphere);
	gApple.randomize();

	//setup first person controls
	controls = new THREE.FirstPersonControls(camera);
	controls.movementSpeed = MOVESPEED;
	controls.lookSpeed = LOOKSPEED;
	controls.snakeMode = true;

	//put all the objects in the world
	createWorld();

	//set up the web renderer and 
	renderer = new THREE.WebGLRenderer();
	renderer.setSize(WIDTH,HEIGHT);
	document.body.appendChild(renderer.domElement);

	//add score, coord, and start button hud
	$('body').append('<div id="score" class="score">Snake 3D</div>');
	// $('body').append('<div id="snake_length" class="snake_length">o</div>');
	$('body').append('<div id="start_button" class="start_button">Click Anywhere to Start</div>');
	$('body').append('<canvas id="speed_gauge" class="speed_gauge"></canvas>');
	$('body').append('<canvas id="length_gauge" class="length_gauge"></canvas>');

	//start!
	$('body').one('click', function(e) {
		e.preventDefault();
		$('#start_button').fadeOut();
		$('#score').fadeOut();
		speed_gauge.set(MOVESPEED);
		controls.moveForward = true;

		// $('#music')[0].pause();
		// $('#musicsrc')[0].src='music/valley-remix.mp3';
		// $('#music')[0].load();

		// $('#effectsrc')[0].src='effects/start-mario1.wav';
		// $('#effect')[0].load();
		// $('#effect')[0].play();
		// $('#effect')[0].addEventListener("ended", function() {
		// 	$('#music')[0].play();
		// });	
	});

	//snake spedometer
	var opts = {
	  lines: 12, // The number of lines to draw
	  angle: 0.15, // The length of each line
	  lineWidth: 0.44, // The line thickness
	  pointer: {
	    length: 0.9, // The radius of the inner circle
	    strokeWidth: 0.035, // The rotation offset
	    color: '#000000' // Fill color
	  },
	  colorStart: '#FF0000',   // Colors
	  colorStop: '#FF0000',    // just experiment with them
	  strokeColor: '#FFFFFF',   // to see which ones work best for you
	  generateGradient: true
	};

	//setup speed gauge
	var target = document.getElementById('speed_gauge'); // your canvas element
	speed_gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
	speed_gauge.maxValue = MOVESPEED*25; // set max gauge value
	speed_gauge.animationSpeed = 32; // set animation speed (32 is default value)
	speed_gauge.set(0); // set actual value

	//setup length gauge
	var opts = {
	  lines: 12, // The number of lines to draw
	  angle: 0.35, // The length of each line
	  lineWidth: 0.1, // The line thickness
	  colorStart: '#FF8C00',   // Colors
	  colorStop: '#FF8C00',    // just experiment with them
	  strokeColor: '#EEEEEE',  // to see which ones work best for you
	  generateGradient: true
	};
	var target_len = document.getElementById('length_gauge')
	length_gauge = new Donut(target_len).setOptions(opts);
	length_gauge.maxValue = STARTLENGTH*25;
	length_gauge.minValue = STARTLENGTH;
	length_gauge.animationSpeed = 32;
	length_gauge.set(STARTLENGTH);
}

//creates all the objects in the world
function createWorld() {
	var units = mapWidth;

	//floor
	var floorTexture = new THREE.ImageUtils.loadTexture('clouds3.jpg');
	floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set(2,2);
	var floor = new THREE.Mesh(
		new THREE.CubeGeometry(units*UNITSIZE,0.1,units*UNITSIZE),
		new THREE.MeshLambertMaterial({color: 0xEDCBA0}/*, {map: floorTexture, side: THREE.DoubleSide}*/)
	);
	floor.position.y = -UNITSIZE/2;
	scene.add(floor);

	//slighly visible boundary walls and ceiling
	var cloudTexture = new THREE.ImageUtils.loadTexture('clouds3.jpg');
	cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;
	cloudTexture.repeat.set(8,1);
	var boundaryWallGeometry = new THREE.CubeGeometry(UNITSIZE,units*UNITSIZE,UNITSIZE);
	var boundaryCeilingGeometry = new THREE.CubeGeometry((units+2)*UNITSIZE,UNITSIZE,(units+2)*UNITSIZE);
	var boundaryMaterial = new THREE.MeshLambertMaterial({color: 0x1234FF, opacity: 0.5, transparent: true/*, map: cloudTexture, side: THREE.DoubleSide*/});

	var ceiling = new THREE.Mesh(boundaryCeilingGeometry, boundaryMaterial);
	ceiling.position.y = GRIDSIZE*UNITSIZE + 1;
	scene.add(ceiling);

	//light 1
	var directionalLight1 = new THREE.DirectionalLight( 0xF7EFBE, 0.7);
	directionalLight1.position.set( 0.5, 1, 0.5);
	scene.add(directionalLight1);

	//light 2
	var directionalLight2 = new THREE.DirectionalLight( 0xF7EFBE, 0.5);
	directionalLight2.position.set( -0.5, 1, -0.5);
	scene.add(directionalLight2);

	var wallGeometry = new THREE.CubeGeometry(UNITSIZE,UNITSIZE,GRIDSIZE*UNITSIZE);
	var wallMaterial = new THREE.MeshLambertMaterial({color: 0x97694F});
	var wall = {};

	wall['left'] = new THREE.Mesh(wallGeometry, wallMaterial);
	wall['left'].position.x = -GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['left-boundary'] = new THREE.Mesh(boundaryWallGeometry, boundaryMaterial);
	wall['left-boundary'].position.x = -GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['left-boundary'].position.y = GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['left-boundary'].position.z = GRIDSIZE*UNITSIZE/2+UNITSIZE/2;

	wall['right'] = new THREE.Mesh(wallGeometry, wallMaterial);
	wall['right'].position.x = GRIDSIZE*UNITSIZE/2+UNITSIZE/2;
	wall['right-boundary'] = new THREE.Mesh(boundaryWallGeometry, boundaryMaterial);
	wall['right-boundary'].position.x = GRIDSIZE*UNITSIZE/2+UNITSIZE/2;
	wall['right-boundary'].position.y = GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['right-boundary'].position.z = GRIDSIZE*UNITSIZE/2+UNITSIZE/2;

	wall['top'] = new THREE.Mesh(wallGeometry, wallMaterial);
	wall['top'].rotation.y = 90*ATR;
	wall['top'].position.z = GRIDSIZE*UNITSIZE/2+UNITSIZE/2;
	wall['top-boundary'] = new THREE.Mesh(boundaryWallGeometry, boundaryMaterial);
	wall['top-boundary'].position.x = -GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['top-boundary'].position.y = GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['top-boundary'].position.z = -GRIDSIZE*UNITSIZE/2-UNITSIZE/2;


	wall['bottom'] = new THREE.Mesh(wallGeometry, wallMaterial);
	wall['bottom'].rotation.y = 90*ATR;
	wall['bottom'].position.z = -GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['bottom-boundary'] = new THREE.Mesh(boundaryWallGeometry, boundaryMaterial);
	wall['bottom-boundary'].position.x = GRIDSIZE*UNITSIZE/2+UNITSIZE/2;
	wall['bottom-boundary'].position.y = GRIDSIZE*UNITSIZE/2-UNITSIZE/2;
	wall['bottom-boundary'].position.z = -GRIDSIZE*UNITSIZE/2-UNITSIZE/2;

	//add all the walls and boundaries
	scene.add(wall['left']);
	scene.add(wall['left-boundary']);
	scene.add(wall['right']);
	scene.add(wall['right-boundary']);
	scene.add(wall['top']);
	scene.add(wall['top-boundary']);
	scene.add(wall['bottom']);
	scene.add(wall['bottom-boundary']);

	if (WIREFRAMES) {
		var wireframeCubeGeometry = new THREE.CubeGeometry(UNITSIZE,UNITSIZE,UNITSIZE);
		var wireframeCubeMaterial = new THREE.MeshLambertMaterial({color: 0x1234FF, opacity: 0.5, transparent: true, wireframe:true});

		 for (var i = 0; i < GRIDSIZE; i++)
		 	for (var j = 0; j < GRIDSIZE; j++)
		 		for (var k = 0; k < GRIDSIZE; k++) {
		 			var newBlock = new THREE.Mesh(wireframeCubeGeometry, wireframeCubeMaterial);
		 			newBlock.position.x = (i-GRIDSIZE/2)*UNITSIZE+UNITSIZE/2;
		 			newBlock.position.y = j*UNITSIZE;
		 			newBlock.position.z = (k-GRIDSIZE/2)*UNITSIZE+UNITSIZE/2;
		 			scene.add(newBlock);
		 		}
 	}

	// create a point light
	var pointLight = new THREE.PointLight(0xFFFFFF);

	// set its position
	pointLight.position.x = 10;
	pointLight.position.y = 0;
	pointLight.position.z = 50;

	// add to the scene
	scene.add(pointLight);
}

//render the scene
function render() {

	//update the camera
	var delta = clock.getDelta();
	controls.update(delta);

	//update the snake's tail
	snake.tail();

	var cameraVector = coordToGrid(camera.position);
	var coordText = "";
	coordText += (cameraVector.x<GRIDSIZE && cameraVector.x >= 0) ? cameraVector.x : "...";
	coordText += ",";
	coordText += (cameraVector.y<GRIDSIZE && cameraVector.y >= 0) ? cameraVector.y : "...";
	coordText += ",";
	coordText += (cameraVector.z<GRIDSIZE && cameraVector.z >= 0) ? cameraVector.z : "...";
	$('#curr_coord').text(coordText);

	if (cameraVector.equals(rApple.position))
		scored(rApple);
	if (cameraVector.equals(gApple.position))
		scored(gApple);

	//actually render the scene
	renderer.render(scene, camera);
}

//translates coordinates from a point/vector in space onto the snake game grid
function coordToGrid(v) {
	return new THREE.Vector3(Math.round((v.x - UNITSIZE/2)/UNITSIZE+GRIDSIZE/2),Math.round(v.y/UNITSIZE),Math.round((v.z - UNITSIZE/2)/UNITSIZE+GRIDSIZE/2));
}

//translates coordinates on the snake game grid to their real space position
function gridToCoord(v) {
	return new THREE.Vector3(Math.round((v.x-GRIDSIZE/2)*UNITSIZE+UNITSIZE/2),Math.round(v.y*UNITSIZE),Math.round((v.z-GRIDSIZE/2)*UNITSIZE+UNITSIZE/2));
}