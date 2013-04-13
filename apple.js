function Apple(colorFlag, UNITSIZE) {
	this.flag = colorFlag;
	this.position = new THREE.Vector3(0,0,0);
	if (colorFlag == APPLE) {
		this.geometry = new THREE.SphereGeometry(UNITSIZE/1.75,16,16);
		this.material = new THREE.MeshLambertMaterial({color: 0xFF0000});
	} else if (colorFlag = GAPPLE) {
		this.geometry = new THREE.SphereGeometry(UNITSIZE/4,16,16)
		this.material = new THREE.MeshLambertMaterial({color: 0xFF8C00});
	}
	this.sphere = new THREE.Mesh(this.geometry, this.material);
}

Apple.prototype = {
	//randomize apple location
	randomize: function() {
		//remove existing apple
		map[this.position.x][this.position.y][this.position.z] = AIR;

		//get new apple location
		this.position.x = Math.floor(Math.random()*GRIDSIZE);
		this.position.y = Math.floor(Math.random()*GRIDSIZE);
		this.position.z = Math.floor(Math.random()*GRIDSIZE);

		//mark new apple location
		map[this.position.x][this.position.y][this.position.z] = this.flag;

		//move apple object to new location
		this.sphere.position.x = (this.position.x-GRIDSIZE/2)*UNITSIZE+UNITSIZE/2;
		this.sphere.position.y =  this.position.y*UNITSIZE;
		this.sphere.position.z = (this.position.z-GRIDSIZE/2)*UNITSIZE+UNITSIZE/2;
	}
}