"use strict";

//const THREE = require('three');
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js';

import { OrigamiCloud } from "./OrigamiCloud.js";
import { Terrain } from "./Terrain.js";

let scene, camera, renderer, controls, cloud, parameters, clouds, cameraLight; 
let frame;



function init(){
    //SCENE
    scene = new THREE.Scene();
    //scene.background = new THREE.Color(0x5E9ABF);
    scene.background = new THREE.Color (0x021D40);
    scene.fog = new THREE.FogExp2(scene.background, 0.01);

    //CAMERA
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 0.01;//2;

    //RENDERER
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //CONTROLS
    controls = new OrbitControls(camera, renderer.domElement);

    //disable everything except rotation
    controls.enableZoom = false;
	controls.enablePan = false;
	controls.enableDamping = true;
	controls.rotateSpeed = - 0.25;

    //LIGHT
    const light = new THREE.DirectionalLight( 0xffffff, 0.7 );
    light.position.set( 1, 1, 0 ).normalize();
    scene.add( light );

    const light2 = new THREE.DirectionalLight( 0xffffff, 0.4 );
    light2.position.set( -3, -1, 0 ).normalize();
    scene.add( light2 );

    cameraLight = new THREE.PointLight( 0xffffff, 0.5 );
    cameraLight.position.set( 0, 0, 0 ).normalize();
    scene.add( cameraLight );

    scene.add(new THREE.AmbientLight(0xffffff,0.3)) 

    //CLOUDS
     clouds = [];
    for (let i = 0; i < 30; i++){

        //random position
        let position = new THREE.Vector3();
        position.x = getRandomArbitrary(i-50,i+50);
        position.y = getRandomArbitrary(i+5,i+15);
        position.z = getRandomArbitrary(i-50,i+50);

        //create cloud at position
        let cloud = new OrigamiCloud(position);
        cloud.init(scene);
        clouds.push(cloud);
    }


    //TERRAIN
    let terrain = new Terrain();
    terrain.init(scene);

    //RESIZE
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        render();
    }, false);

    //GUI
    let gui = new GUI({ width: 300 });
    gui.open();
    parameters = {
        color: 0x00fbfff,
        selfgrowing:false
    };
    gui.addColor(parameters, 'color').onChange(function (val) {
        for (let i=0; i<clouds.length; i++){
            clouds[i].colorChange(val);  
        } 
    });
    
}    


//ANIMATION LOOP
function animate() {
    try {
        frame = requestAnimationFrame(animate);

        clouds.forEach(cloud => {
            cloud.grow();
        });

        render();
    }

    catch(err){
            cancelAnimationFrame(frame);
            throw new MorphingException(err);
        }
}

function render() {
    renderer.render(scene, camera);
}

function MorphingException(message) {
    this.message = message;
    this.name = "MorphingException";
}

function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

init();
animate();