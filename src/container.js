import * as THREE from "../threeJsLib/three.js.r122.js"
import { scale_meter_px, scene } from "./configurations.js";
import { truck_wheels, truck_support } from "./ThreeD_container";
import Logger from './logger.js';

class Container {

    static instances;

    constructor(width, height, lenght, capacity, shelves = 4) {
        this.w = parseInt(width * scale_meter_px);
        this.h = parseInt(height * scale_meter_px);
        this.l = parseInt(lenght * scale_meter_px);
        this.capacity = this.w * this.h * this.l;
        this.shelves = parseInt(shelves) || 4;

        this.loadContainer();

        //push the created container into the instances
        Container.instances = this.getContainer;
    }

    //the container data that will be used in the whole application
    get getContainer() {
        return {
            w: this.w,
            h: this.h,
            l: this.l,
            capacity: this.capacity,
        }
    }

    //the container data that will be stored in the localstorage
    get getContainerLocalStorage() {
        return {
            w: this.w / scale_meter_px,
            h: this.h / scale_meter_px,
            l: this.l / scale_meter_px,
            capacity: this.capacity,
        }
    }

    loadContainer() {
        // Material for structural elements (posts, beams)
        var structureMaterial = new THREE.MeshLambertMaterial(
            {
                color: 0x2c3e50,
                side: THREE.DoubleSide,
            });

        // Material for shelves
        var shelfMaterial = new THREE.MeshLambertMaterial(
            {
                color: 0xff6b35,
                side: THREE.DoubleSide,
            });

        var container = new THREE.Group();
        container.name = "Full_Container";

        const postSize = 15; // Vertical post thickness
        const beamSize = 10; // Horizontal beam thickness
        const shelfThickness = 8;
        const numShelves = this.shelves; // Number of horizontal shelves
        const floorLevel = -110; // Floor position in scene (matches scene floor)
        const casterHeight = 25; // Total height of caster + base plate
        const rackBaseHeight = floorLevel + casterHeight; // Rack sits on top of casters

        // Create vertical corner posts
        const postGeometry = new THREE.BoxGeometry(postSize, this.h, postSize);
        
        // Front left post
        const post1 = new THREE.Mesh(postGeometry, structureMaterial);
        post1.position.set(0, this.h / 2 + rackBaseHeight, 0);
        post1.castShadow = true;
        post1.receiveShadow = true;
        container.add(post1);

        // Front right post
        const post2 = new THREE.Mesh(postGeometry, structureMaterial);
        post2.position.set(this.w, this.h / 2 + rackBaseHeight, 0);
        post2.castShadow = true;
        post2.receiveShadow = true;
        container.add(post2);

        // Back left post
        const post3 = new THREE.Mesh(postGeometry, structureMaterial);
        post3.position.set(0, this.h / 2 + rackBaseHeight, this.l);
        post3.castShadow = true;
        post3.receiveShadow = true;
        container.add(post3);

        // Back right post
        const post4 = new THREE.Mesh(postGeometry, structureMaterial);
        post4.position.set(this.w, this.h / 2 + rackBaseHeight, this.l);
        post4.castShadow = true;
        post4.receiveShadow = true;
        container.add(post4);

        // Create horizontal shelves at different levels
        for (let i = 0; i < numShelves; i++) {
            const shelfHeight = (this.h / (numShelves - 1)) * i + rackBaseHeight;
            const shelfGeometry = new THREE.BoxGeometry(this.w, shelfThickness, this.l);
            const shelf = new THREE.Mesh(shelfGeometry, i === 0 ? structureMaterial : shelfMaterial);
            shelf.position.set(this.w / 2, shelfHeight, this.l / 2);
            shelf.name = i === 0 ? "base" : `shelf_${i}`;
            shelf.castShadow = true;
            shelf.receiveShadow = true;
            container.add(shelf);
        }

        // Add horizontal support beams along the length (front and back)
        const lengthBeamGeometry = new THREE.BoxGeometry(beamSize, beamSize, this.l);
        
        // Front bottom beam
        const frontBeam = new THREE.Mesh(lengthBeamGeometry, structureMaterial);
        frontBeam.position.set(this.w / 2, rackBaseHeight, this.l / 2);
        frontBeam.castShadow = true;
        container.add(frontBeam);

        // Add cross beams along width (left and right)
        const widthBeamGeometry = new THREE.BoxGeometry(this.w, beamSize, beamSize);
        
        // Back bottom beam
        const backBeam = new THREE.Mesh(widthBeamGeometry, structureMaterial);
        backBeam.position.set(this.w / 2, rackBaseHeight, this.l);
        backBeam.castShadow = true;
        container.add(backBeam);

        // Left bottom beam
        const leftBeam = new THREE.Mesh(widthBeamGeometry, structureMaterial);
        leftBeam.position.set(this.w / 2, rackBaseHeight, 0);
        leftBeam.castShadow = true;
        container.add(leftBeam)

        //load the rack support system
        this.loadRackSupport(this.w, this.l, container)

        //load the container data into the UI
        var packDim = this.w / scale_meter_px + " , " + this.h / scale_meter_px + " , " + this.l / scale_meter_px;
        $("#containerDetails").html('<span>' + packDim + '</span>');
        $("#containerWidth").val(this.w / scale_meter_px)
        $("#containerHeight").val(this.h / scale_meter_px)
        $("#containerLenght").val(this.l / scale_meter_px)
        $("#containerUnloading").val(this.unloading)

        //update the container size to the localstorage
        localStorage.setItem("container", JSON.stringify(this.getContainerLocalStorage));

        let logger = new Logger("Loading container", 0.01);
        logger.dispatchMessage();
    }

    loadRackSupport(width, lenght, container) {
        // Material for rack supports and casters
        const supportMaterial = new THREE.MeshLambertMaterial({
            color: 0x34495e,
            side: THREE.DoubleSide,
        });

        const casterMaterial = new THREE.MeshLambertMaterial({
            color: 0x1a1a1a,
            side: THREE.DoubleSide,
        });

        const casterRadius = 25;
        const casterHeight = 15;
        const basePlateSize = 40;
        const basePlateHeight = 5;
        const floorLevel = -90; // Floor position in scene

        // Create casters (wheels) at each corner - positioned to sit on floor
        const casterPositions = [
            { x: 0, z: 0 },           // Front left
            { x: width, z: 0 },       // Front right
            { x: 0, z: lenght },      // Back left
            { x: width, z: lenght }   // Back right
        ];

        casterPositions.forEach((pos, index) => {
            // Caster wheel - positioned with bottom touching floor at y=-110
            const wheelGeometry = new THREE.CylinderGeometry(casterRadius, casterRadius, casterHeight, 16);
            wheelGeometry.rotateX(Math.PI / 2);
            const wheel = new THREE.Mesh(wheelGeometry, casterMaterial);
            wheel.position.set(pos.x, floorLevel + casterHeight / 2, pos.z);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            wheel.name = `caster_${index}`;
            container.add(wheel);

            // Base plate for caster mounting - sits on top of wheel
            const basePlateGeometry = new THREE.BoxGeometry(basePlateSize, basePlateHeight, basePlateSize);
            const basePlate = new THREE.Mesh(basePlateGeometry, supportMaterial);
            basePlate.position.set(pos.x, floorLevel + casterHeight + basePlateHeight / 2, pos.z);
            basePlate.castShadow = true;
            basePlate.receiveShadow = true;
            container.add(basePlate);
        });

        scene.add(container);
    }
}

export default Container;