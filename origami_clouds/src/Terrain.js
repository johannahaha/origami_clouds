//followed tutorial by
//https://medium.com/@joshmarinacci/low-poly-style-terrain-generation-8a017ab02e7b

"use strict";

import * as THREE from "three";
import * as SimplexNoise from "simplex-noise";

class Terrain{
    constructor(){
        this.simplex = new SimplexNoise(4);
    }

    init(scene){
        let data = this.generateTexture();
        this.geo = new THREE.PlaneGeometry(data.width,data.height,data.width,data.height+1)
        //assign vert data from the canvas
        for(let j=0; j<data.height; j++) {
            for (let i = 0; i < data.width; i++) {
                const n =  (j*(data.height)  +i)
                const nn = (j*(data.height+1)+i)
                const col = data.data[n*4] // the red channel
                const v1 = this.geo.vertices[nn]
                v1.z = this.map(col,0,255,-10,10) //map from 0:255 to -10:10
            if(v1.z > 2.5) v1.z *= 1.3 //exaggerate the peaks
            // v1.x += map(Math.random(),0,1,-0.5,0.5) //jitter x
            // v1.y += map(Math.random(),0,1,-0.5,0.5) //jitter y
            }
        }

        this.assignColors();

        this.geo.colorsNeedUpdate = true
        this.geo.verticesNeedUpdate = true
        //required for flat shading
        this.geo.computeFlatVertexNormals()
        this.terrain = new THREE.Mesh(this.geo, new THREE.MeshLambertMaterial({
            // wireframe:true,
            vertexColors: THREE.VertexColors,
            //required for flat shading
            flatShading:true,
        }))
        this.terrain.position.z = 40;
        this.terrain.position.y = -5;
        this.terrain.rotation.x = -Math.PI / 2;
        scene.add(this.terrain);
    }

    map(val, smin, smax, emin, emax) {
        const t =  (val-smin)/(smax-smin)
        return (emax-emin)*t + emin
    }
    noise(nx, ny) {
        // Re-map from -1.0:+1.0 to 0.0:1.0
        return this.map(this.simplex.noise2D(nx,ny),-1,1,0,1)
    }
    //stack some noisefields together
    octave(nx,ny,octaves) {
        let val = 0;
        let freq = 1;
        let max = 0;
        let amp = 1;
        for(let i=0; i<octaves; i++) {
            val += this.noise(nx*freq,ny*freq)*amp;
            max += amp;
            amp /= 2;
            freq  *= 2;
        }
        return val/max;
    }
    
    //generate grayscale image of noise
    generateTexture() {
        const canvas = document.getElementById('debugcanvas');
        const c = canvas.getContext('2d');
        c.fillStyle = 'black';
        c.fillRect(0,0,canvas.width, canvas.height);
    
        for(let i=0; i<canvas.width; i++) {
            for(let j=0; j<canvas.height; j++) {
                let v =  this.octave(i/canvas.width,j/canvas.height,16);
                const per = (100*v).toFixed(2)+'%';
                c.fillStyle = `rgb(${per},${per},${per})`;
                c.fillRect(i,j,1,1);
            }
        }
        return c.getImageData(0,0,canvas.width,canvas.height);
    }

    assignColors(){
        //for every face
        this.geo.faces.forEach(f=>{
            //get three verts for the face
            const a = this.geo.vertices[f.a];
            const b = this.geo.vertices[f.b];
            const c = this.geo.vertices[f.c];

            //if average is below water, set to 0
            //alt: color transparent to show the underwater landscape
            const avgz = (a.z+b.z+c.z)/3;
            if(avgz < 0) {
                a.z = 0;
                b.z = 0;
                c.z = 0;
            }


            //assign colors based on the highest point of the face
            const max = Math.max(a.z,Math.max(b.z,c.z))
            if(max <=0)   return f.color.set(0x010E26)
            if(max <=1.5) return f.color.set(0x021D40)
            if(max <=3.5)   return f.color.set(0x024959)
            if(max <=5)   return f.color.set(0x026873)

            //otherwise, return white
            f.color.set(0x808C89)
        })
    }



}

export {Terrain};