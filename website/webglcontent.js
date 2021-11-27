window.onload = () => {
  main();
}

const {
  vec2,
  vec3,
  mat3,
  mat4,
  quat,
  quat2
} = glMatrix;
var xpos = 0,
  ypos = 30,
  zpos = -3;
var xtarget = 0,
  ytarget = 0,
  ztarget = 0;
var finalVel = 0;
const GRAVITY = -0.1;
var onGround = false;
var lX = 0,
  lY = 0,
  lZ = 0;
const model = mat4.create();
var objCollStates = new Array(2);
const view = mat4.create();
const perspective = mat4.create();
var deltaX, deltaY;
var Yaw = 90,
  Pitch = 0;
var target = vec3.create();
var position = vec3.create();
var canvas = 0;
var pause = false;
var done = false;
var deltaTime = 0;
var lastTime = 0;
var currentTime = 0;
var a = 10;
var touchDragging = false;
const shaderVS = `


attribute vec3 v_position;
attribute vec3 color_position;
attribute vec3 normal_position;
varying lowp vec3 colors;
varying lowp vec3 normals;
uniform mat4 perspective;
uniform mat4 view;
uniform mat4 model;

void main(){
    gl_Position =perspective*view*model*vec4(v_position, 1);
    colors = color_position;
    normals = normal_position;
}
    `
const shaderFS = `

varying lowp vec3 colors;
varying lowp vec3 normals;
precision highp float;

uniform vec3 light_pos;
void main(){

    float  ambientStrength = 0.1;
    vec3 colorLight = vec3(1, 1, 1);
    vec3 ambience = ambientStrength * colorLight;
    vec3 lightDir = light_pos;
    float diff = max(dot(normalize(normals), normalize(lightDir)), 0.0);
    vec3 diffuse = diff * colorLight;
    vec3 result = (ambience+diffuse)*colors;
    gl_FragColor = vec4(colors, 1);
}
`
var regKeys = 0;

function loadProgram(vertexShaderSource, fragmentShaderSource, gl) {
  const vsShader = loadShader(gl.VERTEX_SHADER, gl, vertexShaderSource);

  const fsShader = loadShader(gl.FRAGMENT_SHADER, gl, fragmentShaderSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vsShader);
  gl.attachShader(shaderProgram, fsShader);
  gl.linkProgram(shaderProgram);


  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  return shaderProgram;

}

function loadShader(shaderType, gl, shaderSource) {
  const result = gl.createShader(shaderType);

  gl.shaderSource(result, shaderSource);
  compileShader(result, gl);

  return result;
}

function compileShader(shader, gl) {
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
}

function resizeCheckerTask(gl, canvas) {
  const clientWidth = document.documentElement.clientWidth;
  const clientHeight = document.documentElement.clientHeight;


  const needResize = canvas.width !== clientWidth ||
    canvas.height !== clientHeight;

  if (needResize) {

    canvas.width = clientWidth;
    canvas.height = clientHeight - 25;
    gl.viewport(0, 0, clientWidth, clientHeight);
    mat4.perspective(perspective, glMatrix.glMatrix.toRadian(70), document.documentElement.clientWidth / document.documentElement.clientHeight, 0.01, 100);
  }

  return needResize;
}


function updateLook(e) {
  updateTarget(e.movementX, e.movementY);
}

function pointerLockChange(e) {
  var canvas = document.querySelector("#glCanvas");

  if (canvas === document.pointerLockElement || canvas === document.mozPointerLockElement) {

    canvas.addEventListener("mousemove", updateLook, false);
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);

  } else {

    canvas.removeEventListener("mousemove", updateLook, false);

    document.removeEventListener("keydown", keyDownHandler, false);
    document.removeEventListener("keyup", keyUpHandler, false);
  }
}

function updateTarget(deltaX, deltaY) {
  Yaw += deltaX * 0.25;
  Pitch -= deltaY * 0.25;

  if (Pitch > 89)
    Pitch = 89;
  if (Pitch < -89)
    Pitch = -89;



  setLook(Yaw, Pitch);
}

function setLook(Yaw, Pitch) {
  lX = Math.cos(glMatrix.glMatrix.toRadian(Yaw)) * Math.cos(glMatrix.glMatrix.toRadian(Pitch));
  lY = Math.sin(glMatrix.glMatrix.toRadian(Pitch));
  lZ = Math.sin(glMatrix.glMatrix.toRadian(Yaw)) * Math.cos(glMatrix.glMatrix.toRadian(Pitch));
  var mag = Math.sqrt(Math.pow(lX, 2) + Math.pow(lY, 2) + Math.pow(lZ, 2));

  lX = lX / mag;

  lY = lY / mag;
  lZ = lZ / mag;


}

function regKey(keyDownCode) {
  regKeys.set(keyDownCode, false);


}

function keyDownHandler(e) {
  if (e.repeat) return;

  regKeys.set(e.code, true);
}

function keyUpHandler(e) {
  regKeys.set(e.code, false);
}

function crossProduct(x, y, z, x1, y1, z1) {
  var res = {

    x: (y * z1 - z * y1),
    y: (z * x1 - x * z1),
    z: (x * y1 - y * x1)
  }
  return res;

}

function crossProductVecArr(vecAr, vecAr1) {
  var x = vecAr.x;
  var y = vecAr.y;
  var z = vecAr.z;
  var x1 = vecAr1.x;
  var y1 = vecAr1.y;
  var z1 = vecAr1.z;
  var res = {

    x: (y * z1 - z * y1),
    y: (z * x1 - x * z1),
    z: (x * y1 - y * x1)
  }
  return res;
}

function normalizeVecArr(vecAr) {
  var x = vecAr.x;
  var y = vecAr.y;
  var z = vecAr.z;

  var mag = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));

  var res = {
    x: x * (1 / mag),
    y: y * (1 / mag),
    z: z * (1 / mag)
  }

  return (mag <= 0.01) ? {
    x: 0,
    y: 0,
    z: 0
  } : res;
}

function mulVecArr(vecAr, mFactor) {
  var x = vecAr.x;
  var y = vecAr.y;
  var z = vecAr.z;

  var res = {
    x: x * mFactor,
    y: y * mFactor,
    z: z * mFactor
  }
  return res;
}

function addVecArr(vecAr, vecAr1) {
  var x = vecAr.x;
  var y = vecAr.y;
  var z = vecAr.z;
  var x1 = vecAr1.x;
  var y1 = vecAr1.y;
  var z1 = vecAr1.z;

  var res = {
    x: x + x1,
    y: y + y1,
    z: z + z1
  };
  return res;

}

function magVecArr(vecAr) {
  return Math.sqrt(Math.pow(vecAr.x, 2) + Math.pow(vecAr.y, 2) + Math.pow(vecAr.z, 2))
}
/*
struct BBOX {
int minX,
int minY,
int minZ
}

*/
function collisionAABB(bbox, bboxCol, velArr) {

  var bboxNew = {
    minX: bbox.minX + velArr.x,
    minY: bbox.minY + velArr.y,
    minZ: bbox.minZ + velArr.z,
    maxX: bbox.maxX + velArr.x,
    maxY: bbox.maxY + velArr.y,
    maxZ: bbox.maxZ + velArr.z
  }
  var bboxCenter = {
    x: (bbox.minX + bbox.maxX) / 2,
    y: (bbox.minY + bbox.maxY) / 2,
    z: (bbox.minZ + bbox.maxZ) / 2
  }
  var bboxNewCenter = {
    x: (bboxNew.minX + bboxNew.maxX) / 2,
    y: (bboxNew.minY + bboxNew.maxY) / 2,
    z: (bboxNew.minZ + bboxNew.maxZ) / 2
  }

  var bboxColCenter = {
    x: (bboxCol.minX + bboxCol.maxX) / 2,
    y: (bboxCol.minY + bboxCol.maxY) / 2,
    z: (bboxCol.minZ + bboxCol.maxZ) / 2
  }
  var bboxIntersectionRes = {
    bbox: 0,
    collision: false,
    updatedCenter: 0
  }

  var distX0 = bboxCol.minX - bbox.maxX;
  var distX1 = bbox.minX - bboxCol.maxX;

  var distY0 = bboxCol.minY - bbox.maxY;
  var distY1 = bbox.minY - bboxCol.maxY;

  var distZ0 = bboxCol.minZ - bbox.maxZ;
  var distZ1 = bbox.minZ - bboxCol.maxZ;



  var mininumX = (distX0 > distX1) ? distX0 : distX1;
  var mininumY = (distY0 > distY1) ? distY0 : distY1;
  var mininumZ = (distZ0 > distZ1) ? distZ0 : distZ1;
  //At least one axis should intersect
  if (mininumX > 0 || mininumY > 0 || mininumZ > 0) {

    bboxIntersectionRes.collision = false;
    bboxIntersectionRes.bbox = bboxNew;
    bboxIntersectionRes.updatedCenter = bboxNewCenter;
    return bboxIntersectionRes;
  }
  var minX = (distX0 > distX1) ? distX0 : -distX1;
  var minY = (distY0 > distY1) ? distY0 : -distY1;
  var minZ = (distZ0 > distZ1) ? distZ0 : -distZ1;
  // Find the most max distance

  let arrayMins = [Math.abs(minX), Math.abs(minY), Math.abs(minZ)];

  let minDist = Math.min.apply(Math, arrayMins);

  let idxOfMinDist = arrayMins.indexOf(minDist);

  let updatedCenter = {
    x: 0,
    y: 0,
    z: 0
  };
  switch (idxOfMinDist) {
    case 0:
      bbox.minX = bbox.minX + (minX * 1.000);
      bbox.maxX = bbox.maxX + (minX * 1.000);
      velArr.x = 0;

      break;
    case 1:
      bbox.minY = bbox.minY + (minY * 1.000);
      bbox.maxY = bbox.maxY + (minY * 1.000);
      if (Math.sign(minY) === 1) {
        onGround = true;
      }
      velArr.y = 0;
      break;
    case 2:
      bbox.minZ = bbox.minZ + (minZ * 1.000);
      bbox.maxZ = bbox.maxZ + (minZ * 1.000);
      velArr.z = 0;

      break;


  }

  updatedCenter.x = (bboxNew.minX + bboxNew.maxX) / 2;
  updatedCenter.y = (bboxNew.minY + bboxNew.maxY) / 2;
  updatedCenter.z = (bboxNew.minZ + bboxNew.maxZ) / 2;


  var result = {
    bbox: bbox,
    collision: true,
    updatedCenter: updatedCenter
  };

  return result;

}

function lerpVecArr(vecAr, vecArTarget, a) {
  var x = vecAr.x,
    y = vecAr.y,
    z = vecAr.z;

  var xtarget = vecArTarget.x,
    ytarget = vecArTarget.y,
    ztarget = vecArTarget.z;

  var result = {
    x: (xtarget - x) * a + x,
    y: (ytarget - y) * a + y,
    z: (ztarget - z) * a + z
  };
  return result;

}

function keyPressHandler() {
  var lxyz = {
    x: lX,
    y: 0,
    z: lZ
  }
  lxyz = normalizeVecArr(lxyz);
  var lxyzPerp = normalizeVecArr(crossProductVecArr({
    x: 0,
    y: 1,
    z: 0
  }, lxyz));

  var velSide = {
    x: 0,
    y: 0,
    z: 0
  }
  var velFront = {
    x: 0,
    y: 0,
    z: 0
  }
  var velFrontMul = 0;
  var velSideMul = 0;
  if (regKeys.get("KeyW")) {
    velFrontMul += 1;

  }
  if (regKeys.get("KeyA")) {
    velSideMul += 1;
  }
  if (regKeys.get("KeyS")) {
    velFrontMul -= 1;
  }
  if (regKeys.get("KeyD")) {
    velSideMul -= 1;
  }



  velSide = normalizeVecArr(mulVecArr(lxyzPerp, velSideMul));
  velFront = normalizeVecArr(mulVecArr(lxyz, velFrontMul));






  finalVel = lerpVecArr(finalVel, mulVecArr(normalizeVecArr(addVecArr(velSide, velFront)), 5 * deltaTime), a * deltaTime);



  console.log(finalVel.y);
  if (regKeys.get("Space") && onGround) {
    finalVel.y = 0.2;
    onGround = false;
  }
  if (!onGround) finalVel.y += -0.75 * deltaTime;
  var curPosArr = {
    x: xpos,
    y: ypos,
    z: zpos
  };


  let bboxCol = {
    minX: -1,
    minY: -1,
    minZ: -1,
    maxX: 1,
    maxY: 1,
    maxZ: 1
  };

  //Recursive collision

  var arr = [{
    minX: -25,
    minY: -1,
    minZ: -25,
    maxX: 25,
    maxY: -1,
    maxZ: 25
  }, bboxCol];
  var done = false;

  //Recalc player BB


  var bbox = {
    minX: xpos - 0.3,
    minY: ypos - 2.0,
    minZ: zpos - 0.3,
    maxX: xpos + 0.3,
    maxY: ypos + 0.3,
    maxZ: zpos + 0.3
  };

  var bboxNew = {
    minX: bbox.minX + finalVel.x,
    minY: bbox.minY + finalVel.y,
    minZ: bbox.minZ + finalVel.z,
    maxX: bbox.maxX + finalVel.x,
    maxY: bbox.maxY + finalVel.y,
    maxZ: bbox.maxZ + finalVel.z

  }
  var ax = new Array(false, false);
  let collsionResult = 0;

  function loop(x) {

    if (x >= 10) return (false);


    var objectNoCollideCB = false;
    for (var f = 0; f < arr.length; f++) {


      collsionResult = collisionAABB(bboxNew, arr[f], finalVel);



      if (objCollStates[f] !== collsionResult.collision) {
        objectNoCollideCB = true;

      }
      objCollStates[f] = collsionResult.collision;

      if (objectNoCollideCB) {
        onGround = false;
        objectNoCollideCB = false;
      }
      if (collsionResult.collision && ax[f]) {

        ax[f] = true;
        bboxNew = collsionResult.bbox;
        return (true);
      }

    }

  };
  var x = 0;

  while (loop(x)) {
    x++;
  };
  xpos = (bboxNew.maxX + bboxNew.minX) / 2;
  ypos = (bboxNew.maxY + bboxNew.minY) / 2 + 0.85;
  zpos = (bboxNew.maxZ + bboxNew.minZ) / 2;
  if (!onGround) {
    a = 3;

  } else {
    a = 10;
  }

  console.log(onGround);


}


function recCollision(finalVel, arr, x) {

  if (x > 15) return;
  //recalc player position BB





}

function main() {
  regKeys = new Map();
  finalVel = {
    x: 0,
    y: 0,
    z: 0
  };
  //Register all keys
  regKey("KeyW");
  regKey("KeyA");
  regKey("KeyS");
  regKey("KeyD");
  canvas = document.querySelector("#glCanvas");

  canvas.width = document.documentElement.clientWidth;
  canvas.height = document.documentElement.clientHeight - 25;
  var gl = canvas.getContext("webgl");
  // canvas.onresize=()=>{
  //     gl.viewport(0, 0, this.innerWidth, this.innerHeight);
  // }
  const options = {
    get passive() { // This function will be called when the browser
      //   attempts to access the passive property.

      return false;
    }
  };
  const program = loadProgram(shaderVS, shaderFS, gl);
  canvas.addEventListener("ontouchmove", EvtHandlerTouchMOVE, options);
  canvas.addEventListener("ontouchstart", EvtHandlerTouchSTART, options);
  var ongoing = [];
function touchCopy({identifier, clientX, clientY}){
  return {identifier, clientX, clientY};
}
  function EvtHandlerTouchSTART(e) {
    e.preventDefault();
    var touches = e.changedTouches[0];
    for(var x = 0; x < touches.length; x++){
      ongoing.push(touches[x]);
    }
  }
  function findMatchingID(id){
    for (var x = 0; x < ongoing.length; x++){
      if (ongoing[x] == id){
        return x;
      }
    }
    return -1;
  }
  function EvtHandlerTouchMOVE(e) {
    e.preventDefault();
    var newTouches = e.changedTouches;

    for (var x = 0; x < e.length; x++) {

      if (x >= 0) {
      
      } else {
        return;
      }
    }

  }
  const progInfo = {
    program: program,
    attribLocations: {
      v_position: gl.getAttribLocation(program, 'v_position'),
      color_position: gl.getAttribLocation(program, 'color_position'),
      normal_positon: gl.getAttribLocation(program, "normal_position")
    },
    uniformLocations: {
      camera: gl.getUniformLocation(program, "view"),
      perspective: gl.getUniformLocation(program, "perspective"),
      model: gl.getUniformLocation(program, "model"),
      ambience: gl.getUniformLocation(program, "ambience"),
      diffuse: gl.getUniformLocation(program, "diffuseColor"),
      ambience: gl.getUniformLocation(program, "ambienceColor"),
      lightPos: gl.getUniformLocation(program, "light_pos")

    }
  };

  gl.useProgram(program);

  const lightPos_prog = vec3.fromValues(0, 3, 0);
  var lightPos_z = 0;


  var buff = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buff);




  mat4.lookAt(view, vec3.fromValues(xpos, ypos, zpos), vec3.fromValues(xpos, ypos, zpos + 1), vec3.fromValues(0, 1, 0));


  mat4.perspective(perspective, glMatrix.glMatrix.toRadian(70), document.documentElement.clientWidth / document.documentElement.clientHeight, 0.01, 100);
  canvas.requestPointerLock = canvas.requestPointerLock ||
    canvas.mozRequestPointerLock;

  document.exitPointerLock = document.exitPointerLock ||
    document.mozExitPointerLock;


  document.onpointerlockchange = pointerLockChange;
  canvas.onclick = () => {
    canvas.requestPointerLock();
  }

  const square = [
    //Front Face
    -1, 1, 1, 0, 0, 1, 0, 0, 1,
    1, 1, 1, 0, 0, 1, 0, 0, 1,
    1, -1, 1, 0, 0, 1, 0, 0, 1,
    -1, 1, 1, 0, 0, 1, 0, 0, 1,
    1, -1, 1, 0, 0, 1, 0, 0, 1,
    -1, -1, 1, 0, 0, 1, 0, 0, 1,

    //Back Face
    -1, 1, -1, 0, 1, 0, 0, 0, -1,
    1, 1, -1, 0, 1, 0, 0, 0, -1,
    1, -1, -1, 0, 1, 0, 0, 0, -1,
    -1, 1, -1, 0, 1, 0, 0, 0, -1,
    1, -1, -1, 0, 1, 0, 0, 0, -1,
    -1, -1, -1, 0, 1, 0, 0, 0, -1,

    //Left Face

    -1, 1, -1, 1, 0, 0, -1, 0, 0,
    -1, 1, 1, 1, 0, 0, -1, 0, 0,
    -1, -1, 1, 1, 0, 0, -1, 0, 0,
    -1, 1, -1, 1, 0, 0, -1, 0, 0,
    -1, -1, 1, 1, 0, 0, -1, 0, 0,
    -1, -1, -1, 1, 0, 0, -1, 0, 0,

    //bottom face
    -1, -1, 1, 1, 1, 0, 0, -1, 0,
    1, -1, -1, 1, 1, 0, 0, -1, 0,
    -1, -1, -1, 1, 1, 0, 0, -1, 0,
    -1, -1, 1, 1, 1, 0, 0, -1, 0,
    1, -1, 1, 1, 1, 0, 0, -1, 0,
    1, -1, -1, 1, 1, 0, 0, -1, 0,
    //right face

    1, 1, -1, 0.5, 0, 0.5, 1, 0, 0,
    1, 1, 1, 0.5, 0, 0.5, 1, 0, 0,
    1, -1, 1, 0.5, 0, 0.5, 1, 0, 0,
    1, 1, -1, 0.5, 0, 0.5, 1, 0, 0,
    1, -1, 1, 0.5, 0, 0.5, 1, 0, 0,
    1, -1, -1, 0.5, 0, 0.5, 1, 0, 0,
    //Top face
    -1, 1, 1, 1, 1, 1, 0, 1, 0,
    1, 1, -1, 1, 1, 1, 0, 1, 0,
    -1, 1, -1, 1, 1, 1, 0, 1, 0,
    -1, 1, 1, 1, 1, 1, 0, 1, 0,
    1, 1, 1, 1, 1, 1, 0, 1, 0,
    1, 1, -1, 1, 1, 1, 0, 1, 0,
  ]

  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array(square),
    gl.STATIC_DRAW);
  gl.vertexAttribPointer(progInfo.attribLocations.v_position, 3, gl.FLOAT, false, 36, 0);
  gl.enableVertexAttribArray(
    progInfo.attribLocations.v_position);
  gl.vertexAttribPointer(progInfo.attribLocations.color_position, 3, gl.FLOAT, false, 36, 12);
  gl.enableVertexAttribArray(
    progInfo.attribLocations.color_position);
  gl.vertexAttribPointer(progInfo.attribLocations.normal_positon, 3, gl.FLOAT, false, 36, 24);
  gl.enableVertexAttribArray(
    progInfo.attribLocations.normal_positon);
  var rotationIncrement = 0;
  var rotationIncrementY = 0;
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LESS);


  var lightPos_animation_sinewave = 0;
  var lightPos_y = 0;


  function animation(aTime) {


    //Get Framespeed

    document.d
    resizeCheckerTask(gl, canvas);
    currentTime = aTime * 0.001;
    deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    keyPressHandler();

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    lightPos_animation_sinewave += deltaTime * 25;
    rotationIncrement += deltaTime * 72;
    rotationIncrementY += deltaTime * 25;
    lightPos_z = Math.sin(glMatrix.glMatrix.toRadian(lightPos_animation_sinewave)) * 3;
    lightPos_y = Math.cos(glMatrix.glMatrix.toRadian(lightPos_animation_sinewave)) * 3;
    gl.uniform3fv(progInfo.uniformLocations.lightPos, vec3.fromValues(0, lightPos_y, lightPos_z));
    xtarget = xpos + lX;
    ytarget = ypos + lY;
    ztarget = zpos + lZ;
    mat4.lookAt(view, vec3.fromValues(xpos, ypos, zpos), vec3.fromValues(xtarget, ytarget, ztarget), vec3.fromValues(0, 1, 0));
    gl.useProgram(program);
    gl.uniformMatrix4fv(progInfo.uniformLocations.camera, false, view);
    gl.uniformMatrix4fv(progInfo.uniformLocations.model, false, model);
    gl.uniformMatrix4fv(progInfo.uniformLocations.perspective, false, perspective);

    gl.drawArrays(gl.TRIANGLES, 0, 36);

    requestAnimationFrame(animation);
  }
  requestAnimationFrame(animation);
}

//Sections: GJK
class GJK {
  static proccessMesh(vtxMesh) {
    return [...new Set(vtxMesh)];
  }
  static support(vtxPoints, ) {

  }
  static GJK(vtxMesh1, vtxMesh2) {


  }
}
