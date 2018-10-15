/////////////////////////////////////////////////////////////////////////////////////////
//  UBC CPSC 314,  Vjan2018
//  Assignment Template
/////////////////////////////////////////////////////////////////////////////////////////


// SETUP RENDERER & SCENE
var canvas = document.getElementById('canvas');
var scene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer();
var camera;
var cameraFov = 30;     // initial camera vertical field of view, in degrees

//renderer.setClearColor(0x7ec0ee); // set background colour
canvas.appendChild(renderer.domElement);

//SCROLLBAR FUNCTION DISABLE
window.onscroll = function () {
     window.scrollTo(0,0);
   }

   var texture = THREE.ImageUtils.loadTexture( 'images/back.jpg' );
        var backgroundMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2, 0),
            new THREE.MeshBasicMaterial({
                map: texture
            }));

        backgroundMesh .material.depthTest = false;
        backgroundMesh .material.depthWrite = false;

        // Create your background scene
        var backgroundScene = new THREE.Scene();
        var backgroundCamera = new THREE.Camera();
        backgroundScene .add(backgroundCamera );
        backgroundScene .add(backgroundMesh );


// ADAPT TO WINDOW RESIZE
function resize() {
  console.log('resize called');
  renderer.setSize(window.innerWidth,window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
}

var animation = true;
var aniTime = 0.0;

var light;
var torus;
var worldFrame;
var sphere;
var box;
var mcc;
var floor;
var cylinder;
var cone;
var customObject;
var laserLine;
var models;

var body;
var leftLeg;
var rightLeg;
var leftLowerLeg;
var rightLowerLeg;
var rightArm;
var leftArm;
var rightLowerArm;
var leftLowerArm;
var back;
var tailSection1;
var tailSection2;
var tailSection3;
var tailSection4;
var head;
var hip;
var lowerBack;
var guide;
var mouthUp;
var mouthDown;
var leftEye;
var rightEye;
var leftFoot;
var rightFoot;
var upperSmallHorn;
var lowerSmallHorn;
var bigHorn;

var laserPosx = new THREE.Vector3(0, 0, 0);

var loadingManager = null;
var RESOURCES_LOADED = false;

var walkingAvars = [0, 0, 0];

////////////////////////////////////////////////////////////
// Keyframe   and   KFobj  classes
////////////////////////////////////////////////////////////

class Keyframe {
 constructor(name,time,avars) {
 this.name = name;
 this.time = time;
 this.avars = avars;
 }
}

class KFobj {
    constructor(setMatricesFunc) {
	this.keyFrameArray = [];          // list of keyframes
	this.maxTime = 0.0;               // time of last keyframe
	this.currTime = 0.0;              // current playback time
	this.setMatricesFunc = setMatricesFunc;    // function to call to update transformation matrices
    };
    reset() {                     // go back to first keyframe
	this.currTime = 0.0;
    };
    add(keyframe) {               // add a new keyframe at end of list
	this.keyFrameArray.push(keyframe);
	if (keyframe.time > this.maxTime)
	    this.maxTime = keyframe.time;
    };
    timestep(dt) {                //  take a time-step;  loop to beginning if at end
	this.currTime += dt;
	if (this.currTime > this.maxTime)
	    this.currTime = 0;
    }
    getAvars() {                  //  compute interpolated values for the current time
	var i = 1;
	while (this.currTime > this.keyFrameArray[i].time)       // find the right pair of keyframes
	    i++;
	var avars = [];
	for (var n=0; n<this.keyFrameArray[i-1].avars.length; n++) {   // interpolate the values
	    var y0 = this.keyFrameArray[i-1].avars[n];
	    var y1 = this.keyFrameArray[i].avars[n];
	    var x0 = this.keyFrameArray[i-1].time;
	    var x1 = this.keyFrameArray[i].time;
	    var x = this.currTime;
	    var y = y0 + (y1-y0)*(x-x0)/(x1-x0);    // linearly interpolate
	    avars.push(y);
	}
	return avars;         // return list of interpolated avars
    };
}

////////////////////////////////////////////////////////////////////////
// setup animated objects
////////////////////////////////////////////////////////////////////////

    // keyframes for the detailed T-rex:   name, time, [x, y, z]
var trexKFobj = new KFobj(trexSetMatrices);
trexKFobj.add(new Keyframe('rest pose',0.0, [0,1.9,0]));
trexKFobj.add(new Keyframe('rest pose',1.0, [1,1.9,0]));
trexKFobj.add(new Keyframe('rest pose',2.0, [1,2.9,0]));
trexKFobj.add(new Keyframe('rest pose',3.0, [0,2.9,0]));
trexKFobj.add(new Keyframe('rest pose',4.0, [0,1.9,0]));

  // basic interpolation test
console.log('kf 0.1 = ',trexKFobj.getAvars(0.1));    // interpolate for t=0.1
console.log('kf 2.9 = ',trexKFobj.getAvars(2.9));    // interpolate for t=2.9

    // keyframes for mydino:    name, time, [x, y, theta1, theta2, backAngle, hipAngle, lowerBackAngle, z-pos]
var mydinoKFobj= new KFobj(mydinoSetMatrices);
mydinoKFobj.add(new Keyframe('rest pose',0.0, [-10, 1.8, -270, -210, 45, 90, 40, -1*(Math.sqrt(10)), 0]));
mydinoKFobj.add(new Keyframe('rest pose',0.5, [-5, 1.9, -250, -250, 45, 90, 40, -1*(Math.sqrt(5)), 120]));
mydinoKFobj.add(new Keyframe('rest pose',1.0, [0, 2.0, -190, -290, 45, 90, 40, 0, 240]));
mydinoKFobj.add(new Keyframe('rest pose',1.5, [5, 1.8, -210, -270, 45, 90, 40, Math.sqrt(5), 360]));
mydinoKFobj.add(new Keyframe('rest pose',2.0, [10, 1.9, -220, -260, 45, 90, 40, Math.sqrt(10), 480]));
mydinoKFobj.add(new Keyframe('rest pose',2.5, [0, 2.0, -260, -220, 45, 90, 40, 0, 600]));
mydinoKFobj.add(new Keyframe('rest pose',3.0, [-10, 1.8, -270, -210, 45, 90, 40, -1*(Math.sqrt(10)), 720]));

// keyframes for mydino:    name, time, [x, y, theta1, theta2, backAngle, hipAngle, lowerBackAngle, flipAngle]

var mydinoKFFlipobj= new KFobj(mydinoSetMatrices);
mydinoKFFlipobj.add(new Keyframe('rest pose',0.0, [-10, 1.8, -270, -210, 45, 90, 40, -1*(Math.sqrt(10)), 720]));
mydinoKFFlipobj.add(new Keyframe('rest pose',0.5, [0, 2.0, -260, -220, 45, 90, 40, 0, 600]));
mydinoKFFlipobj.add(new Keyframe('rest pose',1.0, [10, 1.9, -220, -260, 45, 90, 40, Math.sqrt(10), 480]));
mydinoKFFlipobj.add(new Keyframe('rest pose',1.5, [5, 1.8, -210, -270, 45, 90, 40, Math.sqrt(5), 360]));
mydinoKFFlipobj.add(new Keyframe('rest pose',2.0, [0, 2.0, -190, -290, 45, 90, 40, 0, 240]));
mydinoKFFlipobj.add(new Keyframe('rest pose',2.5, [-5, 1.9, -250, -250, 45, 90, 40, -1*(Math.sqrt(5)), 120]));
mydinoKFFlipobj.add(new Keyframe('rest pose',3.0, [-10, 1.8, -270, -210, 45, 90, 40, -1*(Math.sqrt(10)), 0]));

var mydinoKFWalkobj= new KFobj(mydinoSetMatrices);

function createWalkingAvars(){
    mydinoKFWalkobj= new KFobj(mydinoSetMatrices);
    mydinoKFWalkobj.add(new Keyframe('rest pose',0.0, [walkingAvars[0], walkingAvars[1], -270, -210, 45, 90, 40, walkingAvars[2], 720]));
    mydinoKFWalkobj.add(new Keyframe('rest pose',0.5, [walkingAvars[0], walkingAvars[1], -260, -220, 45, 90, 40, walkingAvars[2], 600]));
    mydinoKFWalkobj.add(new Keyframe('rest pose',1.0, [walkingAvars[0], walkingAvars[1], -220, -260, 45, 90, 40, walkingAvars[2], 480]));
    mydinoKFWalkobj.add(new Keyframe('rest pose',1.5, [walkingAvars[0], walkingAvars[1], -210, -270, 45, 90, 40, walkingAvars[2], 360]));
    mydinoKFWalkobj.add(new Keyframe('rest pose',2.0, [walkingAvars[0], walkingAvars[1], -190, -290, 45, 90, 40, walkingAvars[2], 240]));
    mydinoKFWalkobj.add(new Keyframe('rest pose',2.5, [walkingAvars[0], walkingAvars[1], -250, -250, 45, 90, 40, walkingAvars[2], 120]));
    mydinoKFWalkobj.add(new Keyframe('rest pose',3.0, [walkingAvars[0], walkingAvars[1], -270, -210, 45, 90, 40, walkingAvars[2], 0]));
}

function orbitRight(thisObj) {
    var x = thisObj.position.x;
    var z = thisObj.position.z;
    thisObj.position.x = x * Math.cos(.02) - z * Math.sin(.02);
    thisObj.position.z = z * Math.cos(.02) + x * Math.sin(.02);
}

createWalkingAvars();

  // optional:   allow avar indexing by name
  // i.e., instead of   avar[1]    one can also use:    avar[ trexIndex["y"]]
var trexIndex = {"x":0, "y":1, "z":2};   Object.freeze(trexIndex);

/////////////////////////////////////////////////////////////////////////////////////
// MATERIALS:  global scope within this file
/////////////////////////////////////////////////////////////////////////////////////

var diffuseMaterial;
var diffuseMaterialB;
var diffuseMaterial2;
var basicMaterial;
var normalShaderMaterial;
var dinoMaterial;
var floorMaterial;
var shaderFiles;

dinoGreenMaterial = new THREE.MeshLambertMaterial( {color: 0x228B22});//4fff4f} );
dinoEyeMaterial = new THREE.MeshLambertMaterial( {color: 0xff0000});
laserLineMaterial = new THREE.LineBasicMaterial( {color: 0xff0000} );
diffuseMaterial = new THREE.MeshLambertMaterial( {color: 0x7f7fff} );
diffuseMaterialB = new THREE.MeshLambertMaterial( {color: 0xffffff, side: THREE.BackSide} );
diffuseMaterial2 = new THREE.MeshLambertMaterial( {color: 0xffffff, side: THREE.DoubleSide } );
basicMaterial = new THREE.MeshBasicMaterial( {color: 0xff0000} );

floorTexture = new THREE.ImageUtils.loadTexture('images/grass.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(1, 1);
floorMaterial = new THREE.MeshBasicMaterial({ map: floorTexture, side: THREE.DoubleSide });

// CUSTOM SHADERS
shaderFiles = [	'glsl/armadillo.vs.glsl', 'glsl/armadillo.fs.glsl' ];
normalShaderMaterial = new THREE.ShaderMaterial();
normalShaderMaterial.side = THREE.BackSide;      // dino has the vertex normals pointing inwards!

new THREE.SourceLoader().load( shaderFiles, function(shaders) {
	normalShaderMaterial.vertexShader = shaders['glsl/armadillo.vs.glsl'];
	normalShaderMaterial.fragmentShader = shaders['glsl/armadillo.fs.glsl'];
})

var meshes = {};   // Meshes index

////////////////////////////////////////////////////////////////////////
// init():  setup up scene
////////////////////////////////////////////////////////////////////////

function init() {
    console.log('init called');

    initCamera();
    initLights();
    initObjects();
    initFileObjects();
};

//////////////////////////////////////////////////////////
//  initCamera():   SETUP CAMERA
//////////////////////////////////////////////////////////

function initCamera() {

    // set up M_proj    (internally:  camera.projectionMatrix )
    camera = new THREE.PerspectiveCamera(cameraFov,1,0.1,1000); // view angle, aspect ratio, near, far

    // set up M_view:   (internally:  camera.matrixWorldInverse )
    camera.position.set(0,12,20);
    camera.up = new THREE.Vector3(0,1,0);
    camera.lookAt(0,0,0);
    scene.add(camera);

      // SETUP ORBIT CONTROLS OF THE CAMERA
    var controls = new THREE.OrbitControls(camera);
    controls.damping = 0.2;
    controls.autoRotate = false;
};

////////////////////////////////////////////////////////////////////////
// initLights():  SETUP LIGHTS
////////////////////////////////////////////////////////////////////////

function initLights() {
    light = new THREE.PointLight(0xffffff);
    light.position.set(0,4,20);
    light2 = new THREE.PointLight(0xffffff);
    light.position.set(0,4,-20);
    scene.add(light);
    scene.add(light2);
    ambientLight = new THREE.AmbientLight(0x606060);
    scene.add(ambientLight);
};

////////////////////////////////////////////////////////////////////////
// initObjects():  setup up scene
////////////////////////////////////////////////////////////////////////
var objectKeys = [];
function initObjects() {

      // torus
    torusGeometry = new THREE.TorusGeometry( 1, 0.4, 10, 20 );
    torus = new THREE.Mesh( torusGeometry, basicMaterial);
    torus.position.set(6, 1.2, -8);   // translation
    torus.rotation.set(0,0,0);     // rotation about x,y,z axes
    scene.add( torus );

      // sphere representing light source
    sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);    // radius, segments, segments
    sphereMaterial = new THREE.MeshLambertMaterial({color: 0xffd700});
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0,4,2);
    sphere.position.set(light.position.x, light.position.y, light.position.z);
    scene.add(sphere);

      // world-frame axes
    worldFrame = new THREE.AxisHelper(5) ;
    scene.add(worldFrame);

      // box
    boxGeometry = new THREE.BoxGeometry( 1, 1, 1 );    // width, height, depth
    box = new THREE.Mesh( boxGeometry, dinoGreenMaterial );
    box.position.set(-6, 0.5, -8);
    scene.add( box );

      // floor
    floorGeometry = new THREE.PlaneBufferGeometry(20,20);
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

      // cylinder
    cylinderGeometry = new THREE.CylinderGeometry( 0.30, 0.30, 1, 20, 4 );
    cylinder = new THREE.Mesh( cylinderGeometry, dinoEyeMaterial);
    scene.add( cylinder );
    cylinder.matrixAutoUpdate = true;
    cylinder.position.set(2, 0.5, -8);

      //  mcc:  multi-colour cube     [https://stemkoski.github.io/Three.js/HelloWorld.html]
    var cubeMaterialArray = [];    // one material for each side of cube;  order: x+,x-,y+,y-,z+,z-
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xff3333 } ) );
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xff8800 } ) );
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0xffff33 } ) );
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x33ff33 } ) );
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x3333ff } ) );
    cubeMaterialArray.push( new THREE.MeshBasicMaterial( { color: 0x8833ff } ) );
    var mccMaterials = new THREE.MeshFaceMaterial( cubeMaterialArray );
    var mccGeometry = new THREE.BoxGeometry( 1,1,1, 1, 1, 1 );   // xyzz size,  xyz # segs
    mcc = new THREE.Mesh( mccGeometry, laserLineMaterial );   //
    mcc.position.set(-4,0.5,-8);
    scene.add( mcc );

      // cone
    coneGeometry = new THREE.CylinderGeometry( 0.0, 0.50, 4, 20, 4 ); // rTop, rBot, h, #rsegs, #hsegs
    cone = new THREE.Mesh( coneGeometry, floorMaterial);
    cone.position.set(-2,2,-8)
    scene.add( cone);

    cone1 = new THREE.Mesh( coneGeometry, floorMaterial);
    cone1.position.set(-7,2,-3)
    scene.add( cone1);

    //  CUSTOM OBJECT
    var geom = new THREE.Geometry();
    var v0 = new THREE.Vector3(0,0,0);
    var v1 = new THREE.Vector3(3,0,0);
    var v2 = new THREE.Vector3(0,3,0);
    var v3 = new THREE.Vector3(3,3,0);
    geom.vertices.push(v0);
    geom.vertices.push(v1);
    geom.vertices.push(v2);
    geom.vertices.push(v3);
    geom.faces.push( new THREE.Face3( 0, 1, 2 ) );
    geom.faces.push( new THREE.Face3( 1, 3, 2 ) );
    geom.computeFaceNormals();
    customObject = new THREE.Mesh( geom, diffuseMaterial2 );
    customObject.position.set(0, 0, -10);
    scene.add(customObject);

      // laser line
    var geom = new THREE.Geometry();
    var vL0 = new THREE.Vector3(0,0,0);
    var vL1 = new THREE.Vector3(5,5,5);
      // use three line segments to give it thickness
    geom.vertices.push( new THREE.Vector3(0+0.00, 0+0.00, 0+0.00));
    geom.vertices.push( new THREE.Vector3(5+0.00, 5+0.00, 5+0.00));
    geom.vertices.push( new THREE.Vector3(0+0.02, 0+0.00, 0+0.00));
    geom.vertices.push( new THREE.Vector3(5+0.02, 5+0.00, 5+0.00));
    geom.vertices.push( new THREE.Vector3(0+0.00, 0+0.02, 0+0.00));
    geom.vertices.push( new THREE.Vector3(5+0.00, 5+0.02, 5+0.00));
    laserLine = new THREE.Line( geom, laserLineMaterial );
    scene.add(laserLine);

    // geometries
    bodyGeometry = new THREE.CylinderGeometry( 0.25, 0.7, 1.5, 32, 8, false, Math.PI/8, 2*Math.PI );    // width, height, depth
    legGeometry = new THREE.CylinderGeometry( 0.25, 0.1, 1.0 , 32);    // width, height, depth
    lowerLegGeometry = new THREE.CylinderGeometry( 0.1, 0.05, 0.4, 32 );
    backGeometry = new THREE.CylinderGeometry(0.15, 0.245, 1.3, 32);
    lowerBackGeometry = new THREE.CylinderGeometry( 0.67, 0.20, 1.9, 32, 8, false, Math.PI/8, 2*Math.PI );
    tailGeometry1 = new THREE.CylinderGeometry( 0.20, 0.15, 0.3, 32, 8, false, Math.PI/8, 2*Math.PI );
    tailGeometry2 = new THREE.CylinderGeometry( 0.15, 0.1, 0.3, 32, 8, false, Math.PI/8, 2*Math.PI );
    tailGeometry3 = new THREE.CylinderGeometry( 0.1, 0.05, 0.3, 32, 8, false, Math.PI/8, 2*Math.PI );
    tailGeometry4 = new THREE.CylinderGeometry( 0.05, 0.01, 0.3, 32, 8, false, Math.PI/8, 2*Math.PI );
    guideGeometry = new THREE.CylinderGeometry(0.00015, 0.00012, 1.3, 32);
    headGeometry = new THREE.SphereGeometry(0.25, 32, 32);
    eyeGeometry = new THREE.SphereGeometry(0.05, 32, 32);
    mouthGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.2);
    footGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.2);
    upperArmGeometry = new THREE.CylinderGeometry( 0.14, 0.1, 0.3 , 32);
    lowerArmGeometry = new THREE.CylinderGeometry( 0.09, 0.03, 0.5 , 32);
    smallHornGeometry = new THREE.CylinderGeometry( 0.01, 0.15, 0.2 , 32);
    bigHornGeometry = new THREE.CylinderGeometry( 0.01, 0.25, 0.3 , 32);

    //Mesh initializations
    body = new THREE.Mesh( bodyGeometry, dinoGreenMaterial );
    leftLeg = new THREE.Mesh( legGeometry, dinoGreenMaterial );
    leftLowerLeg = new THREE.Mesh( lowerLegGeometry, dinoGreenMaterial );
    rightLowerLeg = new THREE.Mesh( lowerLegGeometry, dinoGreenMaterial );
    rightLeg = new THREE.Mesh( legGeometry, dinoGreenMaterial );
    back = new THREE.Mesh( backGeometry, dinoGreenMaterial );
    lowerBack = new THREE.Mesh( lowerBackGeometry, dinoGreenMaterial);
    guide = new THREE.Mesh( guideGeometry, dinoGreenMaterial);
    tailSection1 = new THREE.Mesh( tailGeometry1, dinoGreenMaterial);
    tailSection2 = new THREE.Mesh( tailGeometry2, dinoGreenMaterial);
    tailSection3 = new THREE.Mesh( tailGeometry3, dinoGreenMaterial);
    tailSection4 = new THREE.Mesh( tailGeometry4, dinoGreenMaterial);
    head = new THREE.Mesh( headGeometry, dinoGreenMaterial);
    leftEye = new THREE.Mesh( eyeGeometry, dinoEyeMaterial);
    rightEye = new THREE.Mesh( eyeGeometry, dinoEyeMaterial);
    mouthUp = new THREE.Mesh( mouthGeometry, dinoGreenMaterial);
    mouthDown = new THREE.Mesh( mouthGeometry, dinoGreenMaterial);
    leftArm = new THREE.Mesh( upperArmGeometry, dinoGreenMaterial);
    rightArm = new THREE.Mesh( upperArmGeometry, dinoGreenMaterial);
    rightLowerArm = new THREE.Mesh( lowerArmGeometry, dinoGreenMaterial);
    leftLowerArm = new THREE.Mesh( lowerArmGeometry, dinoGreenMaterial);
    leftFoot = new THREE.Mesh( footGeometry, dinoEyeMaterial);
    rightFoot = new THREE.Mesh( footGeometry, dinoEyeMaterial);
    upperSmallHorn = new THREE.Mesh( smallHornGeometry, dinoEyeMaterial);
    lowerSmallHorn = new THREE.Mesh( smallHornGeometry, dinoEyeMaterial);
    bigHorn = new THREE.Mesh( bigHornGeometry, dinoEyeMaterial);

    //Add 3D objects to scene
    scene.add( guide );
    scene.add( leftLeg );
    scene.add(leftLowerLeg);
    scene.add(rightLowerLeg);
    scene.add( rightLeg );
    scene.add(back);
    scene.add(lowerBack);
    scene.add(guide);
    scene.add(tailSection1);
    scene.add(tailSection2);
    scene.add(tailSection3);
    scene.add(tailSection4);
    scene.add(body);
    scene.add(head);
    scene.add(leftEye);
    scene.add(rightEye);
    scene.add(mouthUp);
    scene.add(mouthDown);
    scene.add(leftFoot);
    scene.add(rightFoot);
    scene.add(rightArm);
    scene.add(leftArm);
    scene.add(rightLowerArm);
    scene.add(leftLowerArm);
    scene.add(upperSmallHorn);
    scene.add(lowerSmallHorn);
    scene.add(bigHorn);
}

////////////////////////////////////////////////////////////////////////
// initFileObjects():    read object data from OBJ files;  see onResourcesLoaded() for instances
////////////////////////////////////////////////////////////////////////

function initFileObjects() {

    // Models index
    models = {
	bunny: {obj:"obj/bunny.obj", mtl: diffuseMaterial, mesh: null},
	teapot: {obj:"obj/teapot.obj", mtl: diffuseMaterial, mesh: null	},
	armadillo: {obj:"obj/armadillo.obj", mtl: diffuseMaterial, mesh: null },
//	horse: {obj:"obj/horse.obj", mtl: diffuseMaterial, mesh: null },
	minicooper: {obj:"obj/minicooper.obj", mtl: diffuseMaterial, mesh: null },
	trex: { obj:"obj/trex.obj", mtl: normalShaderMaterial, mesh: null },
//	dragon: {obj:"obj/dragon.obj", mtl: diffuseMaterial, mesh: null }
    };

      // Object loader
    loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = function(item, loaded, total){
	console.log(item, loaded, total);
    };
    loadingManager.onLoad = function(){
	console.log("loaded all resources");
	RESOURCES_LOADED = true;
	onResourcesLoaded();
    };

    // Load models;  asynchronous in JS, so wrap code in a fn and pass it the index
    for( var _key in models ){
    objectKeys.push(_key);
	console.log('Key:', _key);
	(function(key){
		var objLoader = new THREE.OBJLoader(loadingManager);
		objLoader.load(models[key].obj, function(mesh){
		    mesh.traverse(function(node){
			if( node instanceof THREE.Mesh ){
			    node.material = models[key].mtl;
			    node.material.shading = THREE.SmoothShading;
			}
		    });
		    models[key].mesh = mesh;
		});

	})(_key);
    }
}

var keyIndex = 0;
function keyNext(keys){
    if(keyIndex === (keys.length - 1)){
        keyIndex = 0;
    }
    else{
        keyIndex+=1;
    }
}

var currentObjectName = "armadillo1";

///////////////////////////////////////////////////////////////////////////////////////
// LISTEN TO KEYBOARD
///////////////////////////////////////////////////////////////////////////////////////
var animateMyDino = false;
var flipDino = false;
var laserOff = false;
var reverseAnimation = false;
var walkingAnimation = false;
var keyboard = new THREEx.KeyboardState();
function checkKeyboard() {
  if (keyboard.pressed(" ")) {
      animation = !animation;           // toggle animation on or off
  } else if (keyboard.pressed("r")) {
      console.log('Reset!');
      trexKFobj.reset();
      mydinoKFobj.reset();
  } else if (keyboard.pressed("o")) {
      camera.fov += 0.5;
      camera.updateProjectionMatrix();  // get three.js to recopute   M_proj
  } else if (keyboard.pressed("p")) {
      camera.fov -= 0.5;
      camera.updateProjectionMatrix();  // get three.js to recompute  M_proj
  } else if (keyboard.pressed("l+k")) {
      if(laserOff === false){
        laserOff = true;
        scene.remove(laserLine);
      }
      else{
        laserOff = false;
        scene.add(laserLine);
      }
  } else if (keyboard.pressed("c+f")) {
      if(cooperFollow === false){
        cooperFollow = true;
      }
      else{
        cooperFollow = false;
      }
  } else if (keyboard.pressed("u")) {
      if(animateMyDino === false){
        animateMyDino = true;
      }
      else{
        animateMyDino = false;
      }
  } else if (keyboard.pressed("j")) {
      flipDino = true;
  } else if (keyboard.pressed("v")) {
      if(reverseAnimation === false){
        reverseAnimation = true;
      }
      else{
        reverseAnimation = false;
      }
    }
    else if (keyboard.pressed("t")) {
        if(meshes1.length > 0){
        scene.remove(meshes1[keyIndex]);
        keyNext(meshes1);
        console.log("rrrrr"+currentObjectName) ;
        console.log(meshes1[keyIndex].position.x+"pp");
        console.log(meshes1.length+"jj");
        meshes1[keyIndex].position.x = laserPosx.x+10;
        meshes1[keyIndex].position.z = laserPosx.z+10;
        scene.add(meshes1[keyIndex]);
    }
} else if (keyboard.pressed("z")) {
        if(walkingAnimation === false){
            walkingAnimation = true;
        }
        else{
            walkingAnimation = false;
        }
    }
    else if (keyboard.pressed("w")) {
        if(walkingAnimation){
            walkingAvars[0]-=0.1;
            createWalkingAvars();
        }
    } else if (keyboard.pressed("s")) {
        if(walkingAnimation){
            walkingAvars[0]+=0.1;
            createWalkingAvars();
        }
    } else if (keyboard.pressed("a")) {
        if(walkingAnimation){
            walkingAvars[2]+=0.1;
            createWalkingAvars();
        }
    } else if (keyboard.pressed("d")) {
        if(walkingAnimation){
            walkingAvars[2]-=0.1;
            createWalkingAvars();
        }
    } else if (keyboard.pressed("q")) {
        if(walkingAnimation){
            walkingAvars[1]+=0.1;
            createWalkingAvars();
        }
    } else if (keyboard.pressed("h")) {
        if(walkingAnimation){
            walkingAvars[1]-=0.1;
            createWalkingAvars();
        }
    }
}

var meshes1 = [];

///////////////////////////////////////////////////////////////////////////////////////
// UPDATE CALLBACK
///////////////////////////////////////////////////////////////////////////////////////
var cooperFollow = false;
function update() {
    checkKeyboard();

    if (!RESOURCES_LOADED) {       // wait until all OBJs are loaded
	requestAnimationFrame(update);
	return;
    }

    /////////// animated objects ////////////////

    if (animation) {       //   update the current time of objects if  animation = true
	trexKFobj.timestep(0.02);               // the big dino
	mydinoKFobj.timestep(0.02);
    mydinoKFFlipobj.timestep(0.02);
    mydinoKFWalkobj.timestep(0.02);            // the blocky walking figure, your hierarchy
	aniTime += 0.02;                        // update global time
    }

    var trexAvars = trexKFobj.getAvars();       // interpolate avars
    trexKFobj.setMatricesFunc(trexAvars);

    var mydinoAvars;       // compute object-to-world matrices

    if(!walkingAnimation){          //Different animation states
        if(!reverseAnimation){
            mydinoAvars = mydinoKFobj.getAvars();   // interpolate avars
            mydinoKFobj.setMatricesFunc(mydinoAvars);   // compute object-to-world matrices
        }
        else{
            mydinoAvars = mydinoKFFlipobj.getAvars();
            mydinoKFFlipobj.setMatricesFunc(mydinoAvars);
        }
    }
    else{
        mydinoAvars = mydinoKFWalkobj.getAvars();
        mydinoKFWalkobj.setMatricesFunc(mydinoAvars);
    }

    laserUpdate();

    if(cooperFollow === true){
      meshes1[keyIndex].position.x = laserPosx.x+10;
    //meshes["minicooper2"].position.y = laserPosx.y-3;
      meshes1[keyIndex].position.z = laserPosx.z+10;
    }

    requestAnimationFrame(update);
    renderer.autoClear = false;
    renderer.clear();
    renderer.render(backgroundScene , backgroundCamera );
    renderer.render(scene, camera);

    orbitRight(light);
    orbitRight(sphere);
    torus.rotation.y += 0.1;
    torus.rotation.x += 0.1;
    orbitRight(torus);
}

///////////////////////////////////////////////////////////////////////////////////////
//  laserUpdate()
///////////////////////////////////////////////////////////////////////////////////////

function laserUpdate() {

    var trexEyeLocal = new THREE.Vector3(0,1.2,-1.9);
    var trex2 = meshes1[keyIndex];     //   reference to the Object
    if(!(trex2 == undefined)){
    var trexEyeWorld = trexEyeLocal.applyMatrix4(trex2.matrix);    // this computes  trex2.matrix * trexEyeLocal (with h=1)
    var mydinoWorld = laserPosx;

  var offset = [ new THREE.Vector3(0,0,0), new THREE.Vector3(0.02,0,0), new THREE.Vector3(0,0.02,0)];
  for (var n=0; n<3; n++) {            // laserLine consists of three line segements, slightly offset (more visible)
	laserLine.geometry.vertices[n*2].x = trexEyeWorld.x + offset[n].x;
	laserLine.geometry.vertices[n*2].y = trexEyeWorld.y + offset[n].y;
	laserLine.geometry.vertices[n*2].z = trexEyeWorld.z + offset[n].z;

	laserLine.geometry.vertices[n*2+1].x = mydinoWorld.x + offset[n].x;
	laserLine.geometry.vertices[n*2+1].y = mydinoWorld.y + offset[n].y;
	laserLine.geometry.vertices[n*2+1].z = mydinoWorld.z + offset[n].z;
    }
    laserLine.geometry.verticesNeedUpdate = true;
}
}

///////////////////////////////////////////////////////////////////////////////////////
// trexSetMatrices(avars)
///////////////////////////////////////////////////////////////////////////////////////

function trexSetMatrices(avars) {
    var trex2 = meshes["trex2"];     //   reference to the Object

    trex2.matrixAutoUpdate = false;     // tell three.js not to over-write our updates
    trex2.matrix.identity();
    trex2.matrix.multiply(new THREE.Matrix4().makeTranslation(avars[0], avars[1], avars[2]));
    trex2.matrix.multiply(new THREE.Matrix4().makeRotationY(-Math.PI/2));
    trex2.matrix.multiply(new THREE.Matrix4().makeScale(1.5,1.5,1.5));
    trex2.updateMatrixWorld();
}

///////////////////////////////////////////////////////////////////////////////////////
// mydinoSetMatrices(avars)
///////////////////////////////////////////////////////////////////////////////////////

var cooperTwisted = false;

function mydinoSetMatrices(avars) {
  if(animateMyDino){
    guide.matrixAutoUpdate = false;
    guide.matrix.identity();                // root of the hierarchy
    guide.matrix.multiply(new THREE.Matrix4().makeTranslation(avars[0]-4,avars[1],avars[7]));
    if(flipDino === true){
      if(avars[8] >= 300){
        flipDino = false;
      }
      guide.matrix.multiply(new THREE.Matrix4().makeRotationZ((avars[8])*Math.PI/180));
    }
    laserPosx.x = avars[0]-4;
    laserPosx.y = avars[1]+2.4;
    laserPosx.z = avars[7];
    guide.updateMatrixWorld();

    if(cooperTwisted === false){
      meshes["minicooper2"].rotation.z += Math.PI;
      cooperTwisted = true;
    }

    head.matrixAutoUpdate = false;
    head.matrix.copy(guide.matrix);
    head.matrix.multiply(new THREE.Matrix4().makeTranslation(0,avars[1]+0.7,0));
    head.updateMatrixWorld();

    leftEye.matrixAutoUpdate = false;
    leftEye.matrix.copy(guide.matrix);
    leftEye.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.2,avars[1]+0.8,-0.2));
    leftEye.updateMatrixWorld();

    rightEye.matrixAutoUpdate = false;
    rightEye.matrix.copy(guide.matrix);
    rightEye.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.2,avars[1]+0.8,0.2));
    rightEye.updateMatrixWorld();

    mouthUp.matrixAutoUpdate = false;
    mouthUp.matrix.copy(guide.matrix);
    mouthUp.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.25,avars[1]+0.6,0.03));
    mouthUp.matrix.multiply(new THREE.Matrix4().makeRotationZ((avars[3]*8)*Math.PI/1100));
    mouthUp.updateMatrixWorld();

    mouthDown.matrixAutoUpdate = false;
    mouthDown.matrix.copy(guide.matrix);
    mouthDown.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.3,avars[1]+0.7,0.03));
    mouthDown.updateMatrixWorld();

    back.matrixAutoUpdate = false;
    back.matrix.copy(guide.matrix);
    back.matrix.multiply(new THREE.Matrix4().makeTranslation(0,avars[1],0));
    back.updateMatrixWorld();

    body.matrixAutoUpdate = false;
    body.matrix.copy(back.matrix);
    body.matrix.multiply(new THREE.Matrix4().makeTranslation(0.5,-1,0));
    body.matrix.multiply(new THREE.Matrix4().makeRotationZ(avars[4]*Math.PI/180));
    body.updateMatrixWorld();

    upperSmallHorn.matrixAutoUpdate = false;
    upperSmallHorn.matrix.copy(body.matrix);
    upperSmallHorn.matrix.multiply(new THREE.Matrix4().makeTranslation(0.4,0.5,0));
    upperSmallHorn.matrix.multiply(new THREE.Matrix4().makeRotationZ(293*Math.PI/180));
    upperSmallHorn.updateMatrixWorld();

    lowerSmallHorn.matrixAutoUpdate = false;
    lowerSmallHorn.matrix.copy(body.matrix);
    lowerSmallHorn.matrix.multiply(new THREE.Matrix4().makeTranslation(0.57,-0.2,0));
    lowerSmallHorn.matrix.multiply(new THREE.Matrix4().makeRotationZ(293*Math.PI/180));
    lowerSmallHorn.updateMatrixWorld();

    bigHorn.matrixAutoUpdate = false;
    bigHorn.matrix.copy(body.matrix);
    bigHorn.matrix.multiply(new THREE.Matrix4().makeTranslation(0.55,0.2,0));
    bigHorn.matrix.multiply(new THREE.Matrix4().makeRotationZ(293*Math.PI/180));
    bigHorn.updateMatrixWorld();

    lowerBack.matrixAutoUpdate = false;
    lowerBack.matrix.copy(body.matrix);
    lowerBack.matrix.multiply(new THREE.Matrix4().makeTranslation(0.75,-1.5,0));
    lowerBack.matrix.multiply(new THREE.Matrix4().makeRotationZ(avars[6]*Math.PI/180));
    lowerBack.matrix.multiply(new THREE.Matrix4().makeTranslation(0,0.5,0));
    lowerBack.updateMatrixWorld();

    tailSection1.matrixAutoUpdate = false;
    tailSection1.matrix.copy(lowerBack.matrix);
    tailSection1.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.015,-1.015,0));
    tailSection1.matrix.multiply(new THREE.Matrix4().makeRotationZ((avars[2]/7)*Math.PI/950));
    tailSection1.updateMatrixWorld();

    tailSection2.matrixAutoUpdate = false;
    tailSection2.matrix.copy(tailSection1.matrix);
    tailSection2.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.05,-0.27,0));
    tailSection2.matrix.multiply(new THREE.Matrix4().makeRotationZ((avars[2]/5)*Math.PI/480));
    tailSection2.updateMatrixWorld();

    tailSection3.matrixAutoUpdate = false;
    tailSection3.matrix.copy(tailSection2.matrix);
    tailSection3.matrix.multiply(new THREE.Matrix4().makeTranslation(0.015,-0.2,0));
    tailSection3.matrix.multiply(new THREE.Matrix4().makeRotationZ((avars[2]/5)*Math.PI/950));
    tailSection3.updateMatrixWorld();

    tailSection4.matrixAutoUpdate = false;
    tailSection4.matrix.copy(tailSection3.matrix);
    tailSection4.matrix.multiply(new THREE.Matrix4().makeTranslation(0,-0.3,0));
    tailSection4.matrix.multiply(new THREE.Matrix4().makeRotationZ((avars[2]/5)*Math.PI/950));
    tailSection4.updateMatrixWorld();

    leftLeg.matrixAutoUpdate = false;
    leftLeg.matrix.copy(lowerBack.matrix);
    leftLeg.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.2,0.7,-0.35));
    leftLeg.matrix.multiply(new THREE.Matrix4().makeRotationZ(avars[2]*Math.PI/480));
    leftLeg.matrix.multiply(new THREE.Matrix4().makeTranslation(0.5,-0.5, 0));
    leftLeg.updateMatrixWorld();


    rightLeg.matrixAutoUpdate = false;
    rightLeg.matrix.copy(lowerBack.matrix);
    rightLeg.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.2,0.3, 0.25));
    rightLeg.matrix.multiply(new THREE.Matrix4().makeRotationZ(avars[3]*Math.PI/480));
    rightLeg.matrix.multiply(new THREE.Matrix4().makeTranslation(0,-0.5,0));
    rightLeg.updateMatrixWorld();

    leftLowerLeg.matrixAutoUpdate = false;
    leftLowerLeg.matrix.copy(leftLeg.matrix);
    leftLowerLeg.matrix.multiply(new THREE.Matrix4().makeTranslation(0.32, 0.05, -0.25));
    leftLowerLeg.matrix.multiply(new THREE.Matrix4().makeRotationZ((avars[3]/-10)*Math.PI/180));
    leftLowerLeg.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.5,-0.5, 0.25));
    leftLowerLeg.updateMatrixWorld();

    rightLowerLeg.matrixAutoUpdate = false;
    rightLowerLeg.matrix.copy(rightLeg.matrix);
    rightLowerLeg.matrix.multiply(new THREE.Matrix4().makeTranslation(0.32, 0.05, -0.25));
    rightLowerLeg.matrix.multiply(new THREE.Matrix4().makeRotationZ((avars[3]/-10)*Math.PI/180));
    rightLowerLeg.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.5,-0.5, 0.25));
    rightLowerLeg.updateMatrixWorld();

    rightFoot.matrixAutoUpdate = false;
    rightFoot.matrix.copy(rightLowerLeg.matrix);
    rightFoot.matrix.multiply(new THREE.Matrix4().makeTranslation(0.4, 0.25, -0.25));
    rightFoot.matrix.multiply(new THREE.Matrix4().makeRotationZ(0));
    rightFoot.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.5,-0.5, 0.25));
    rightFoot.updateMatrixWorld();

    leftFoot.matrixAutoUpdate = false;
    leftFoot.matrix.copy(leftLowerLeg.matrix);
    leftFoot.matrix.multiply(new THREE.Matrix4().makeTranslation(0.4, 0.25, -0.25));
    leftFoot.matrix.multiply(new THREE.Matrix4().makeRotationZ(0));
    leftFoot.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.5,-0.5, 0.25));

    leftArm.matrixAutoUpdate = false;
    leftArm.matrix.copy(body.matrix);
    leftArm.matrix.multiply(new THREE.Matrix4().makeTranslation(0.2,0.7,-0.35));
    leftArm.matrix.multiply(new THREE.Matrix4().makeRotationZ(avars[3]*Math.PI/480));
    leftArm.matrix.multiply(new THREE.Matrix4().makeTranslation(0.5,-0.5, 0));
    leftArm.updateMatrixWorld();

    rightArm.matrixAutoUpdate = false;
    rightArm.matrix.copy(body.matrix);
    rightArm.matrix.multiply(new THREE.Matrix4().makeTranslation(0.2,0.3, 0.25));
    rightArm.matrix.multiply(new THREE.Matrix4().makeRotationZ(avars[2]*Math.PI/480));
    rightArm.matrix.multiply(new THREE.Matrix4().makeTranslation(0,-0.5,0));
    rightArm.updateMatrixWorld();

    leftLowerArm.matrixAutoUpdate = false;
    leftLowerArm.matrix.copy(leftArm.matrix);
    leftLowerArm.matrix.multiply(new THREE.Matrix4().makeTranslation(0.6, -0.1, -0.25));
    leftLowerArm.matrix.multiply(new THREE.Matrix4().makeRotationZ((avars[3]/10)*Math.PI/180));
    leftLowerArm.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.5,-0.5, 0.25));
    leftLowerArm.updateMatrixWorld();

    rightLowerArm.matrixAutoUpdate = false;
    rightLowerArm.matrix.copy(rightArm.matrix);
    rightLowerArm.matrix.multiply(new THREE.Matrix4().makeTranslation(0.6, -0.1, -0.25));     
    rightLowerArm.matrix.multiply(new THREE.Matrix4().makeRotationZ((avars[3]/10)*Math.PI/180));
    rightLowerArm.matrix.multiply(new THREE.Matrix4().makeTranslation(-0.5,-0.5, 0.25));
  }
}

/////////////////////////////////////////////////////////////////////////////////////
// runs when all resources are loaded
/////////////////////////////////////////////////////////////////////////////////////

function onResourcesLoaded(){

 // Clone models into meshes;   [Michiel:  AFAIK this makes a "shallow" copy of the model,
 //                             i.e., creates references to the geometry, and not full copies ]
    meshes["armadillo1"] = models.armadillo.mesh.clone();
    meshes1.push(meshes["armadillo1"]);
    meshes["bunny1"] = models.bunny.mesh.clone();
    meshes1.push(meshes["bunny1"]);
    meshes["teapot1"] = models.teapot.mesh.clone();
    meshes1.push(meshes["teapot1"]);
    meshes["minicooper1"] = models.minicooper.mesh.clone();
    meshes["minicooper2"] = models.minicooper.mesh.clone();
    meshes1.push(meshes["minicooper2"]);
    meshes["trex1"] = models.trex.mesh.clone();
    meshes1.push(meshes["trex1"]);
    meshes["trex2"] = models.trex.mesh.clone();
    meshes1.push(meshes["trex2"]);

    // Reposition individual meshes, then add meshes to scene

    meshes["armadillo1"].position.set(-7, 1.5, 2);
    meshes["armadillo1"].rotation.set(0,-Math.PI/2,0);
    meshes["armadillo1"].scale.set(1.5,1.5,1.5);
    scene.add(meshes["armadillo1"]);

    //meshes["bunny1"].position.set(-5, 0.2, 8);
    meshes["bunny1"].rotation.set(0, Math.PI, 0);
    meshes["bunny1"].scale.set(0.8,0.8,0.8);
    scene.add(meshes["bunny1"]);
    scene.remove(meshes["bunny1"]);

    //meshes["teapot1"].position.set(3, 0, -6);
    meshes["teapot1"].scale.set(0.5, 0.5, 0.5);
    scene.add(meshes["teapot1"]);
    scene.remove(meshes["teapot1"]);

    //meshes["minicooper1"].position.set(-2, 0, 3);
    meshes["minicooper1"].scale.set(0.025, 0.025, 0.025);
    meshes["minicooper1"].rotation.set(-Math.PI/2, 0, Math.PI/2);
    scene.add(meshes["minicooper1"]);
    scene.remove(meshes["minicooper1"]);

    //meshes["minicooper2"].position.set(6, 0, 6);
    meshes["minicooper2"].scale.set(0.025, 0.025, 0.025);
    meshes["minicooper2"].rotation.set(-Math.PI/2, 0, Math.PI/2);
    scene.add(meshes["minicooper2"]);
    scene.remove(meshes["minicooper2"]);

    //meshes["trex1"].position.set(-4, 1.90, -2);
    meshes["trex1"].scale.set(1.5,1.5,1.5);
    meshes["trex1"].rotation.set(0,-Math.PI/2, 0);
    scene.add(meshes["trex1"]);
    scene.remove(meshes["trex1"]);

      // note:  we will be animating trex2, so these transformations will be overwritten anyhow
    //meshes["trex2"].position.set(0, 1.9, 3);
    meshes["trex2"].scale.set(1.5,1.5,1.5);
    meshes["trex2"].rotation.set(0,-Math.PI/2, 0);
    scene.add(meshes["trex2"]);
    scene.remove(meshes["trex2"]);
}

// window.onload = init;
init();

window.addEventListener('resize',resize);   // EVENT LISTENER RESIZE
resize();

update();
