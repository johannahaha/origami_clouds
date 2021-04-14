"use strict";

import * as THREE from "three";

class OrigamiCloud{

    constructor(pos){
        //GEOMETRY
        this.t = 0;
        this.vertices = [];
        let pos_opposite = new THREE.Vector3();
        pos_opposite.copy(pos);
        pos_opposite.add(new THREE.Vector3(2,2,2));

        //standard shape is a cube between 0,0,0 and 2,2,2
        this.vertices.push(
            //0 0 2
            new THREE.Vector3(pos.x, pos.y, pos_opposite.z),
            // 2 0 2
            new THREE.Vector3(pos_opposite.x, pos.y, pos_opposite.z),
            // 2 2 2
            new THREE.Vector3(pos_opposite.x, pos_opposite.y,  pos_opposite.z),
            // 0 2 2
            new THREE.Vector3( pos.x, pos_opposite.y,  pos_opposite.z),
    
            // 0 0 0
            new THREE.Vector3(pos.x, pos.y, pos.z),
            // 2 0 0
            new THREE.Vector3(pos_opposite.x, pos.y,  pos.z),
            // 2 2 0
            new THREE.Vector3(pos_opposite.x, pos_opposite.y,  pos.z),
            // 0 2 0
            new THREE.Vector3(pos.x, pos_opposite.y,  pos.z));
        
        //faces of the cube
        this.faces = [];
        this.faces.push(

            new THREE.Face3(0, 1, 2),
            new THREE.Face3(3, 0, 2),
            new THREE.Face3(4, 6, 5),
            new THREE.Face3(7, 6, 4),
    
            new THREE.Face3(0, 4, 1),
            new THREE.Face3(4, 5, 1),
            new THREE.Face3(2, 7, 3),
            new THREE.Face3(7, 2, 6),

            new THREE.Face3(4, 3, 7),
            new THREE.Face3(3, 4, 0),
            new THREE.Face3(2, 5, 6),
            new THREE.Face3(5, 2, 1));

        this.geometry = this.createGeometry(this.vertices,this.faces);
        this.cubeGeometry = this.geometry.clone();

        //MATERIAL
        this.material = new THREE.MeshPhongMaterial({
            color: 0x4F717A,
            side:2,
            morphTargets:true
        });
        this.materialWire = new THREE.MeshBasicMaterial({
            color: 0x024959,
            wireframe: true,
            morphTargets:true
        });

        //VARIABLES FOR MORPHING
        this.currentTarget = 0;
        this.lastTarget = 0;
        this.extrusionLimit = 0.5;
        this.frame = 0;
        this.undoAll = false;

    
    }
    //initializiation
    //subdivide triangles of the original cube with different extrusion paramters
    init(scene){
        for (let i=0; i < 20; i++){
            if (i%2 == 0){
                this.geometry = this.subdiveTriangles(this.geometry,i*5%this.faces.length, "B", true);
                this.cubeGeometry = this.subdiveTriangles(this.cubeGeometry,i*5%this.cubeGeometry.faces.length, "B", false);
            }
            else if (i%4 == 1){
                this.geometry = this.subdiveTriangles(this.geometry,i*5%this.faces.length, "C", true);
                this.cubeGeometry = this.subdiveTriangles(this.cubeGeometry,i*5%this.cubeGeometry.faces.length, "C", false);
            }
            else if (i%5 == 0){
                this.geometry = this.subdiveTriangles(this.geometry,i*5%this.faces.length, "A", true);
                this.cubeGeometry = this.subdiveTriangles(this.cubeGeometry,i*5%this.cubeGeometry.faces.length, "A", false);
            }
            else{
                this.geometry = this.subdiveTriangles(this.geometry,i*5%this.faces.length, "B", true);
                this.cubeGeometry = this.subdiveTriangles(this.cubeGeometry,i*5%this.cubeGeometry.faces.length, "B", false);
            }
        }
        this.geometryTri = this.geometry;

        //MESH
        this.constructBlendShapes();
        this.cloud = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry( this.geometry ), this.material );
        this.cloudWire = new THREE.Mesh( new THREE.BufferGeometry().fromGeometry( this.geometry ), this.materialWire );

        this.cube = new THREE.Mesh(new THREE.BufferGeometry().fromGeometry( this.cubeGeometry ), this.material );

        //ADD TO SCENE
        scene.add(this.cloud);
        //scene.add(this.cube);
        scene.add(this.cloudWire);
    }

    update(){
        //console.log(JSON.parse(JSON.stringify("old cloud",this.cloud.geometry.vertices)));

        this.cloud.geometry = this.geometry;
        this.cloud.material = this.material;
        //console.log("new cloud",this.cloud.geometry.vertices);
        
        this.cloudWire.geometry = this.geometry;
        this.cloudWire.material = this.materialWire;
    }

    //return geometry
    getGeometry(){
        return this.geometry;
    }

    //return subdivided geometry
    getTriangularGeometry(){
        return this.geometryTri;
    }

    //change color of the clouds
    colorChange(colorHex){
        this.material.color.setHex(colorHex);
        this.cloud.material = this.material;
    }

    //create new Geometry of the Vertices and the Faces
    createGeometry(pVertices,pFaces){
        let geometry = new THREE.Geometry();
 
        geometry.vertices = pVertices;
        geometry.faces = pFaces;

        // compute Normals
        geometry.computeVertexNormals();
        geometry.computeFaceNormals();

        return geometry;
    }

    //subdivide triangles according to the vertex
    subdiveTriangles(geometry, faceId,vertex = "A",toExtrude = false){
        let subGeom = geometry.clone();
        let face = subGeom.faces[faceId];

        let vertexA = new THREE.Vector3();
        let vertexB = new THREE.Vector3();
        let vertexC = new THREE.Vector3();
 
        vertexA.copy(subGeom.vertices[face.a]);
        vertexB.copy(subGeom.vertices[face.b]);
        vertexC.copy(subGeom.vertices[face.c]);

        //console.log(JSON.parse(JSON.stringify(subGeom.vertices)));

        let thisId, thisVertex, leftId, leftVertex, rightId, rightVertex;

        //for A
        if (vertex === "A"){
            thisId = face.a;
            thisVertex = vertexA;

            rightId = face.b;
            rightVertex = vertexB;

            leftId = face.c;
            leftVertex = vertexC;
        }
        else if (vertex === "B"){
            thisId = face.b;
            thisVertex = vertexB;

            rightId = face.c;
            rightVertex = vertexC;

            leftId = face.a;
            leftVertex = vertexA;
        }
        else if (vertex === "C"){
            thisId = face.c;
            thisVertex = vertexC;

            rightId = face.a;
            rightVertex = vertexA;

            leftId = face.b;
            leftVertex = vertexB;
        }
        else{
            return null;
        }

        //calculate middle that will be the new vertex
        let middle = rightVertex.add(leftVertex.sub(rightVertex).divideScalar(2));
        

        let tVertices = subGeom.vertices;
        tVertices.push(
            new THREE.Vector3(middle.x,middle.y,middle.z));

        //set new faces so that middle is connected to its neighbors    
        let tFaces = [];
        for (let i = 0; i < subGeom.faces.length; i++) {
            if ( i===faceId ) {
                    tFaces.push(
                        new THREE.Face3(thisId,rightId,tVertices.length-1),
                        new THREE.Face3(thisId,tVertices.length-1,leftId));               
            }
            else{
                tFaces.push(subGeom.faces[i]);
            }
        }

        if (toExtrude){
            return this.extrudeTriangle(faceId,this.createGeometry(tVertices,tFaces));

        }
        else{
            //console.log(faceId, "vertices: ",tVertices);
            //console.log(faceId, "faces: ",tFaces);
            return this.createGeometry(tVertices,tFaces)
        }   
    }

    //extrude the face and the vertex to its normal with a specific scale
    extrudeTriangle(faceId,pExGeom,pExtrusion,vertex = "C"){
        let exGeom = pExGeom;
        let face = exGeom.faces[faceId];

        let normal = face.normal;

        let extrusion = pExtrusion;
        if (extrusion === null || extrusion === undefined){
            extrusion = this.getRandomArbitrary(0.01,0.1);
        }
        normal = normal.addScalar(extrusion);

        if (vertex === "C"){
            exGeom.vertices[face.c].add(normal);
        }
        else if (vertex === "B"){
            exGeom.vertices[face.b].add(normal);
        }
        else if (vertex === "A"){
            exGeom.vertices[face.a].add(normal);
        }
        return exGeom;
    }

    //extrude all specified vertices
    extrudeAll(extrusion){
        let extrudedGeom = this.createGeometry(this.geometry.vertices, this.geometry.faces);
        for (let i = 0; i < extrudedGeom.faces.length; i++){
            
            extrudedGeom = this.extrudeTriangle(i,extrudedGeom,extrusion,"C");
        }
        
        this.geometry = this.createGeometry(extrudedGeom.vertices,extrudedGeom.faces);
        this.update();
    }

    //construct morph targets with different extrusion values
    constructBlendShapes(){
        this.geometry.morphTargets.push( { name: "cube", vertices: this.cubeGeometry.vertices } );
        let t = 0;
        let vertices = ["A","B","C"];
        for ( let i = 0; i < 2; i ++ ) {
            let blendGeom = this.geometry.clone();

            for (let f = 0; f < blendGeom.faces.length;f++){

                blendGeom = this.extrudeTriangle(f,blendGeom,t,vertices[i%3]);
            }

            this.geometry.morphTargets.push( { name: "target" + i, vertices: blendGeom.vertices } );
            t += 0.001;
        }
        this.geometry.morphTargets = this.shuffleArray(this.geometry.morphTargets);
        this.geometry.computeMorphNormals();
        //console.log("constructed shapes");
        //console.log(JSON.parse(JSON.stringify(this.geometry.morphTargets)));

    }

    //helper function to get random float
    getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }

    // helper funciton to shuffle array
    //https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    //set morph target influence to specific value
    setMorphTargetInfluence(index,val){
        this.cloud.morphTargetInfluences[index] = val;
        this.cloudWire.morphTargetInfluences[index] = val;
    }  

    //return morph target influences
    getMorphTargetInfluences(){
        return this.cloud.morphTargetInfluences;
    }

    //set one morph target influence after another to 0.5
    grow(){
        let targets = this.geometry.morphTargets;

        //if last Target is done, undo all Target Influences so that they are zero
        if(this.cloud.morphTargetInfluences[this.cloud.morphTargetInfluences.length-1] >= this.extrusionLimit ){
            this.undoAll = true;
            console.log("it is the last target");
            this.setMorphTargetInfluence(this.lastTarget,(this.extrusionLimit-this.frame));
        }    
        if(this.undoAll){    
            this.setMorphTargetInfluence(this.lastTarget,(this.extrusionLimit-this.frame));
            if(this.cloud.morphTargetInfluences[this.cloud.morphTargetInfluences.length-1] <= 0 ){
                console.log("Target Influences: ", this.cloud.morphTargetInfluences);
                this.undoAll = false;
                this.currentTarget = 0;
                this.lastTarget = 0;
                this.frame = 0;
            }    
        }

    
        else if (!this.undoAll){
            //set current target to += frame
            this.setMorphTargetInfluence(this.currentTarget,this.frame);

            //set last target to 0.5 -= frame
            if(this.currentTarget >= 1){
                this.setMorphTargetInfluence(this.lastTarget,(this.extrusionLimit-this.frame));
            }

            //if currentTarget done, rest and do next target
            if (this.frame>=this.extrusionLimit){
                this.lastTarget = this.currentTarget;
                this.currentTarget++
                this.currentTarget = this.currentTarget%(this.geometry.morphTargets.length);
                this.frame = 0;
            }
        }

        this.frame = this.frame + 0.002;
        //this.geometry.position.z += 0.001;
    }
  
}
export {OrigamiCloud};