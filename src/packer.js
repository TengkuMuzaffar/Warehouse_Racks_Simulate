import Pack from './pack.js';

class Packer {

    constructor(algorithm) {
        this.algorithm = algorithm;
        this.packagesLoaded = [];
        this.openPoints = [{ x: 0, y: 0, z: 0 }];
        this.boxes = {};
        this.layerBaseY = 0;
    }

    /*initialise the packagesToLoad array from the array given from the user*/
    initialisePackagesToLoad() {
        var newPack;
        var packagesToLoad = [];

        // expand packs into individual items (ignore priority)
        Pack.allInstances.forEach((pack) => {
            if (pack.multiplePrio) {
                let count = 0;
                for (let i = 0; i < pack.subQuantities.length; i++) {
                    let sub = pack.subQuantities[i];
                    for (let j = 0; j < sub.n; j++) {
                        newPack = {
                            ...pack,
                            w: pack.rotations[0].w,
                            h: pack.rotations[0].h,
                            l: pack.rotations[0].l,
                            id: pack.id + "-" + count++,
                            parent_id: pack.id
                        };

                        delete newPack.q;
                        packagesToLoad.push(newPack);
                    }
                }
            }
            else {
                for (var i = 0; i < pack.q; i++) {
                    newPack = {
                        ...pack,
                        w: pack.rotations[0].w,
                        h: pack.rotations[0].h,
                        l: pack.rotations[0].l,
                        id: pack.id + "-" + i,
                        parent_id: pack.id
                    };

                    delete newPack.q;
                    packagesToLoad.push(newPack);
                }
            }
        });

        // sort all items according to chosen algorithm
        // default: First Fit Decreasing (ffd) by volume
        if (this.algorithm && this.algorithm.toString().toLowerCase() === "worst") {
            // Worst fit: smallest-first (ascending volume)
            packagesToLoad.sort((a, b) => a.v - b.v);
        } else if (this.algorithm && this.algorithm.toString().toLowerCase() === "best") {
            // Best fit heuristic (try to place by largest base surface first)
            packagesToLoad.sort((a, b) => (b.w * b.l) - (a.w * a.l));
        } else {
            // FFD / default: largest volume first
            packagesToLoad.sort((a, b) => b.v - a.v);
        }

        // return a single priority group (legacy interface)
        let prioritesedPackagesToLoad = { 0: packagesToLoad };
        let priorities = [0];

        return [prioritesedPackagesToLoad, priorities];
    }

    //recursive method that runs unltil it find the last element with same id on top of each other
    getDownPack(downPack, count, id) {
        if (downPack == -1 || downPack.parent_id != id) return count;
        else {
            downPack = this.getPackByTopCoords({ x: downPack.x, y: downPack.y, z: downPack.z });
            count++;
            return this.getDownPack(downPack, count, id);
        }
    }

    getPackByTopCoords(coords) {
        //find the open point
        // for (let i = this.packagesLoaded.length - 1; i > 0; i--) {
        //     let packLoaded = this.packagesLoaded[i];

        //     if (packLoaded.openPoint.T.x == coords.x && packLoaded.openPoint.T.y == coords.y && packLoaded.openPoint.T.z == coords.z)
        //         return packLoaded;
        // }

        // return -1;
        let pack = this.packagesLoaded.filter((packLoaded) => {
            return packLoaded.openPoint.T.x == coords.x && packLoaded.openPoint.T.y == coords.y && packLoaded.openPoint.T.z == coords.z
        });
        return pack[0] || -1;
    }

    //check if the box can be stacked on top of another one 
    // ( condition the same pack not different one)
    canBeStacked(pack, openPoint) {
        let downPack = this.getPackByOpenPoint(openPoint);
        console.log(pack, downPack)
        if (downPack.parent_id == pack.parent_id) {
            let countOfStacks = this.getDownPack(downPack, 0, pack.parent_id);
            console.log(countOfStacks)
            if (countOfStacks <= pack.stackC) return true;
            else return false
        }
        return true;
    }

    //create a 2d space on top of boxes
    create2dSpace(coords, pack, type = "down") {
        //find the boxes that will create our 2d space
        // let packs = this.packagesLoaded.filter(p => {
        //     let upperPoint = coords.y > 0 ? p.y + p.h : p.y;
        //     // console.log(upperPoint)
        //     // let upperPoint = p.y;
        //     return upperPoint == coords.y
        // });

        let packs = [];
        // coords.y is expected to be absolute scene Y (createOpenPoints receives absolute coords),
        // so use it directly for comparisons.
        const absoluteCoordY = coords.y;

        if (type == "top") {
            for (let i = 0; i < this.packagesLoaded.length; i++) {
                let p = this.packagesLoaded[i];

                let upperPoint = p.y;

                if (upperPoint == absoluteCoordY
                    && p.x < coords.x && p.x + p.w > coords.x
                    && p.z < coords.z && p.z + p.l > coords.z
                ) packs.push(p)

                if (upperPoint == absoluteCoordY
                    && p.x < coords.x + pack.w && p.x + p.w > coords.x + pack.w
                    && p.z < coords.z && p.z + p.l > coords.z
                ) packs.push(p)

                if (upperPoint == absoluteCoordY
                    && p.x < coords.x && p.x + p.w > coords.x
                    && p.z < coords.z + pack.l && p.z + p.l > coords.z + pack.l
                ) packs.push(p)

                if (upperPoint == absoluteCoordY
                    && p.x < coords.x + pack.w && p.x + p.w > coords.x + pack.w
                    && p.z < coords.z + pack.l && p.z + p.l > coords.z + pack.l
                ) packs.push(p)
            }

        }

        else {
            for (let i = 0; i < this.packagesLoaded.length; i++) {
                let p = this.packagesLoaded[i];

                let upperPoint = coords.y > 0 ? p.y + p.h : p.y

                if (upperPoint == absoluteCoordY
                    && p.x <= coords.x && p.x + p.w > coords.x
                    && p.z <= coords.z && p.z + p.l > coords.z
                ) packs.push(p)

                if (upperPoint == absoluteCoordY
                    && p.x <= coords.x + pack.w && p.x + p.w > coords.x + pack.w
                    && p.z <= coords.z && p.z + p.l > coords.z
                ) packs.push(p)

                if (upperPoint == absoluteCoordY
                    && p.x <= coords.x && p.x + p.w > coords.x
                    && p.z <= coords.z + pack.l && p.z + p.l > coords.z + pack.l
                ) packs.push(p)

                if (upperPoint == absoluteCoordY
                    && p.x <= coords.x + pack.w && p.x + p.w > coords.x + pack.w
                    && p.z <= coords.z + pack.l && p.z + p.l > coords.z + pack.l
                ) packs.push(p)
            }
        }


        // console.log(packs)
        // console.log(packs);

        //fill the space with the coordinates of each box
        let space = [];
        for (let i = 0; i < packs.length; i++) {
            let p = packs[i];
            if (space[p.id] == null) space[p.id] = [];
            space[p.id].push(
                {
                    x: p.x,
                    z: p.z
                },
                {
                    x: p.x + p.w,
                    z: p.z
                },
                {
                    x: p.x,
                    z: p.z + p.l
                },
                {
                    x: p.x + p.w,
                    z: p.z + p.l
                }
            );
        }

        return [packs, space];
    }

    // Each box have 4 point in his base face
    // I check if the 4 points are contained inside that surface
    // Return true or false
    canFitAboveTheBoxNewVersion(pack, coords) {

        //create the four point of our pack
        let packPoints = [
            // 1
            {
                x: coords.x,
                z: coords.z,
            },
            {
                x: (3 * coords.x + (coords.x + pack.w)) / 4,
                z: coords.z,
            },
            {
                x: (coords.x + (coords.x + pack.w)) / 2,
                z: coords.z,
            },
            {
                x: (coords.x + 3 * (coords.x + pack.w)) / 4,
                z: coords.z,
            },
            {
                x: coords.x + pack.w,
                z: coords.z,
            },

            // 2
            {
                x: coords.x,
                z: (coords.z + 3 * (coords.z + pack.l)) / 4,
            },
            {
                x: coords.x,
                z: (coords.z + (coords.z + pack.l)) / 2,
            },
            {
                x: coords.x,
                z: (3 * coords.z + (coords.z + pack.l)) / 4,
            },
            {
                x: coords.x,
                z: coords.z + pack.l,
            },


            // 3
            {
                x: (coords.x + 3 * (coords.x + pack.w)) / 4,
                z: coords.z + pack.l,
            },
            {
                x: (coords.x + (coords.x + pack.w)) / 2,
                z: coords.z + pack.l,
            },
            {
                x: (3 * coords.x + (coords.x + pack.w)) / 4,
                z: coords.z + pack.l,
            },
            {
                x: coords.x + pack.w,
                z: coords.z + pack.l,
            },

            // 4
            {
                x: coords.x + pack.w,
                z: (coords.z + 3 * (coords.z + pack.l)) / 4,
            },
            {
                x: coords.x + pack.w,
                z: (coords.z + (coords.z + pack.l)) / 2,
            },
            {
                x: coords.x + pack.w,
                z: (3 * coords.z + (coords.z + pack.l)) / 4,
            },
        ];

        //create the 2d space using the packs that have the same height from a certain coords
        let twoDimensionSpace = this.create2dSpace(coords, pack);
        let packs = twoDimensionSpace[0];
        let space = twoDimensionSpace[1];

        //check if the four point of the pack are contained inside our 2D space
        let check = 0;
        for (let i = 0; i < packPoints.length; i++) {
            for (let j = 0; j < packs.length; j++) {
                let p = packs[j];
                let pointToTrait = packPoints[i];
                let packSpace = space[p.id];

                if (this.isPointContainedInSpace(packSpace, pointToTrait, false)) {
                    check++;
                    break;
                }
            }
        }

        return check == 16;
    }

    //checks if the points is contained in a certain space
    isPointContainedInSpace = (packSpace, point, restrected) => {
        // console.log(point.x, point.z, packSpace[0], packSpace[3])
        return restrected ?
            point.x > packSpace[0].x && point.x <= packSpace[3].x && point.z > packSpace[0].z && point.z <= packSpace[3].z
            :
            point.x >= packSpace[0].x && point.x <= packSpace[3].x && point.z >= packSpace[0].z && point.z <= packSpace[3].z;
    }

    okRotation(container, pack) {
        for (let i = 0; i < this.openPoints.length; i++) {
            let point = this.openPoints[i];
            let newPack = { ...pack }

            if (point.y > 0 && point.type == "T" && pack.stackC != -1 && !this.canBeStacked(pack, point)) continue;

            for (let j = 0; j < pack.rotations.length; j++) {
                let p = pack.rotations[j];
                // When packing per-layer, `container.h` is the available height for the layer
                // while `point.y` is absolute scene Y. Convert point.y to layer-relative
                // before comparing to `container.h`.
                const layerBase = this.layerBaseY || 0;
                const pointRelY = point.y - layerBase;
                if (p.l + point.z <= container.l && p.h + pointRelY <= container.h && p.w + point.x <= container.w) {
                    let isThereCollision = this.checkCollisionNewVersion(point, pack)

                    if (isThereCollision) continue;
                    if (point.y > 0 && !this.canFitAboveTheBoxNewVersion(p, point)) continue;

                    newPack.w = p.w;
                    newPack.l = p.l;
                    newPack.h = p.h;
                    newPack.validRotation = p.type;
                    return [point, i, newPack];
                }
            }

            if (i == this.openPoints.length - 1) return false;
        }

        return false
    }

    //remove non eligible points
    //fixes two axes and searching for the smallest one on each axe
    //storing the new elligible points
    removeNonWorkingOpenPoints(container) {

        let pack = this.packagesLoaded[this.packagesLoaded.length - 1];

        //remove the point on the edges
        for (let i = this.openPoints.length - 1; i >= 0; i--) {
            let point = this.openPoints[i];

            if (container.w == point.x || container.h == point.y || container.l == point.z)
                this.openPoints.splice(i, 1)
        }


        // console.log(pack)
        //remove the points dont have acces
        //that mean the point that i pass on them while positioning the boxes
        let idPointToRemove = [];
        for (let i = 0; i < this.openPoints.length; i++) {
            let p = this.openPoints[i];

            if (p.x + 1 >= pack.x && p.x + 1 <= pack.x + pack.w
                && p.z + 1 >= pack.z && p.z + 1 <= pack.z + pack.l
                // && p.y > 0 
                && p.y == pack.y
                && p.pointOwner != pack.id
            ) {
                idPointToRemove.push(i);
            }
        }

        // this.openPoints.map((p, index) => {
        //     if (p.x + 1 >= pack.x && p.x + 1 <= pack.x + pack.w
        //         && p.z + 1 >= pack.z && p.z + 1 <= pack.z + pack.l
        //         // && p.y > 0 
        //         && p.y == pack.y
        //         && p.pointOwner != pack.id
        //     ) {
        //         idPointToRemove.push(index);
        //     }
        // });

        idPointToRemove.sort((a, b) => {
            return b - a;
        });

        for (let i = 0; i < idPointToRemove.length; i++) {
            // console.log(this.openPoints[idPointToRemove[i]])
            this.openPoints.splice(idPointToRemove[i], 1);
        }

        //remove the points that are on the same line
        for (let i = 0; i < this.openPoints.length; i++) {
            let point1 = this.openPoints[i];
            let pack1 = point1.pointOwner.split("-")[0];

            for (let j = i + 1; j < this.openPoints.length; j++) {
                let point2 = this.openPoints[j];
                let pack2 = point2.pointOwner.split("-")[0];

                //delete the z point on the same axe
                //check if the points cover the same space
                //remove only the point that cover the same space
                //keep the points that have a different surface to cover
                if (point1.x == point2.x && point1.y == point2.y && point1.type != "S" && pack1 == pack2) {
                    // console.log(point1.y)
                    // let check = this.packagesLoaded.filter(pack => {
                    //     if (point1.y == 0) {
                    //         return pack.y == point1.y
                    //             && pack.x > point1.x
                    //             && pack.z <= point1.z
                    //             && pack.z + pack.l >= point1.z;
                    //     } else {
                    //         // console.log(pack, point1)
                    //         return pack.y + pack.h == point1.y
                    //             && pack.x <= point1.x + 1
                    //             && pack.x + pack.w >= point1.x + 1
                    //             && pack.z <= point1.z + 1
                    //             && pack.z + pack.l >= point1.z + 1;
                    //     }
                    // });

                    let check = [];
                    let check1 = [];

                    for (let i = 0; i < this.packagesLoaded.length; i++) {
                        let pack = this.packagesLoaded[i];
                        if (point1.y == 0) {
                            if (pack.y == point1.y
                                && pack.x > point1.x
                                && pack.z <= point1.z
                                && pack.z + pack.l >= point1.z)
                                check.push(pack)
                        } else {
                            if (pack.y + pack.h == point1.y
                                && pack.x <= point1.x + 1
                                && pack.x + pack.w >= point1.x + 1
                                && pack.z <= point1.z + 1
                                && pack.z + pack.l >= point1.z + 1)
                                check.push(pack)
                        }

                        if (point2.y == 0) {
                            if (pack.y == point2.y
                                && pack.x > point2.x
                                && pack.z <= point2.z
                                && pack.z + pack.l >= point2.z)
                                check1.push(pack)
                        } else {
                            if (pack.y + pack.h == point2.y
                                && pack.x <= point2.x + 1
                                && pack.x + pack.w >= point2.x + 1
                                && pack.z <= point2.z + 1
                                && pack.z + pack.l >= point2.z + 1)
                                check1.push(pack)
                        }
                    }

                    // let check1 = this.packagesLoaded.filter(pack => {
                    //     if (point2.y == 0) {
                    //         return pack.y == point2.y
                    //             && pack.x > point2.x
                    //             && pack.z <= point2.z
                    //             && pack.z + pack.l >= point2.z;
                    //     } else {
                    //         // console.log(pack, point2)
                    //         return pack.y + pack.h == point2.y
                    //             && pack.x <= point2.x + 1
                    //             && pack.x + pack.w >= point2.x + 1
                    //             && pack.z <= point2.z + 1
                    //             && pack.z + pack.l >= point2.z + 1;
                    //     }
                    // });

                    // console.log(pack1, check, check1);

                    if (check.length != 0 && check1.length != 0) {
                        // console.log(Math.abs(check[0].x - point1.x), Math.abs(check1[0].x - point2.x), point1.x, point2.x);
                        if (Math.abs(check[0].x - point1.x) == Math.abs(check1[0].x - point2.x)) {
                            // console.log(this.openPoints[j])
                            this.openPoints.splice(j, 1);
                        }
                    }
                    if (check.length == 0 && check1.length == 0) {
                        // console.log(this.openPoints[j])
                        this.openPoints.splice(j, 1);
                    }
                }

                //delete the y point on the same axe
                if (point1.x == point2.x && point1.z == point2.z && pack1 == pack2) {
                    // console.log(this.openPoints[j])
                    this.openPoints.splice(j, 1);
                }

                //delete the z point on the same axe
                if (point1.y == point2.y && point1.z == point2.z && !point1.ignored && pack1 == pack2) {
                    if (point2.type != "S") {
                        // console.log(this.openPoints[j])
                        this.openPoints.splice(j, 1);
                    }
                }
            }
        }
    }

    //remove the point where the box is added then sort the other points into the right order
    refreshOpenPoints(idItemToRemove, container) {
        //remove the filled points
        this.openPoints.splice(idItemToRemove, 1);

        //remove duplicates points
        this.openPoints = this.removeDuplicatesObjectFromArray(this.openPoints);

        //sort the points by the closets to the origins
        this.sortOpenPoints();

        //remove non eligible points
        this.removeNonWorkingOpenPoints(container);
    }

    //removes the duplicates objects or points exist in a certain array
    removeDuplicatesObjectFromArray(array) {
        return array.filter((elem, index, self) =>
            self.findIndex(
                (t) => {
                    return (t.x === elem.x && t.y === elem.y && t.z === elem.z)
                }) === index
        )
    }

    removePointsNextPriority() {
        this.openPoints = this.openPoints.filter(p => {
            return p.y == 0
        });
    }

    //get the indexes of the packs that meet certain condition
    getIndexes(packGroup) {
        let pointAndIndex = [];

        this.openPoints.map((p, index) => {
            if (parseInt(p.type != undefined && p.type == "T" && p.pointOwner.split("-")[0]) == packGroup.parent_id) {
                pointAndIndex.push({
                    index: index,
                    data: p
                });
            }
        });

        return pointAndIndex;
    }

    //remove the diagonal points on top of a loaded pack
    removeDiagonalPoints(packGroup) {

        let pointAndIndex = this.getIndexes(packGroup);
        let remove = [];

        if (pointAndIndex.length >= 2) {

            for (let i = 0; i < pointAndIndex.length; i++) {
                let p = pointAndIndex[i];

                for (let j = i + 1; j < pointAndIndex.length; j++) {
                    let p1 = pointAndIndex[j];
                    let cdt =
                        Math.abs(p1.data.z - p.data.z) % packGroup.l == 0
                        && Math.abs(p1.data.x - p.data.x) % packGroup.w == 0
                        && p.data.y == p1.data.y
                        && p1.data.z > p.data.z
                        && p1.data.x > p.data.x;

                    if (cdt)
                        remove.push(p1.index);
                }
            }

            let uniqIds = [...new Set(remove)];
            uniqIds.sort((a, b) => {
                return b - a;
            })

            uniqIds.map(id => {
                // console.log(this.openPoints[id])
                this.openPoints.splice(id, 1);
            });
        }
    }

    //sort the open points
    sortOpenPoints() {
        this.openPoints.sort((a, b) => {
            return ((a.x - b.x || a.z - b.z) || a.y - b.y);
        });
    }

    //take of the part of fitting the first box
    //make only one logic to treat all the packages
    //trait the case if the pack is bigger than the container then it should be ignored
    solve(container, packages, priorities) {

        // If container defines shelves, pack layer-by-layer from bottom to top
            if (container.shelves && container.shelves > 1) {
                // compute shelf spacing using user-specified formula: (height / shelves) - shelfThickness
                const shelves = container.shelves;
                const shelfThickness = container.shelfThickness || 0;
                const perDivision = container.h / shelves;
                // compute gap between shelves using formula and ensure it's positive
                let shelfSpacing = Math.floor(perDivision - shelfThickness);
                if (shelfSpacing < 1) shelfSpacing = 1;

                console.log('Packer: shelves=', shelves, 'perDivision=', perDivision, 'shelfThickness=', shelfThickness, 'shelfSpacing=', shelfSpacing);

                // flatten packages into a single array (legacy single-priority group expected)
                let packagesArray = [];
                priorities.forEach(prio => {
                    if (packages[prio]) packagesArray.push(...packages[prio]);
                });

                console.log('Packer: flattened packages count=', packagesArray.length, 'sample=', packagesArray.slice(0,3));

                // compute stacking capacity per pack based on per-division height (safer for bottom layer)
                packagesArray.forEach(p => {
                    const fitCount = Math.floor(perDivision / p.h) || 0;
                    p.stackC = Math.max(0, fitCount - 1);
                });

                // place per layer (divide container height into `shelves` divisions)
                for (let layerIndex = 0; layerIndex < shelves; layerIndex++) {
                    // reset open points for this layer (y=0 inside layer)
                    this.openPoints = [{ x: 0, y: 0, z: 0 }];

                    // base offset uses equal divisions of the container height
                    this.layerBaseY = Math.floor(layerIndex * perDivision);
                    // available vertical clearance for this layer: bottom layer can use full division height
                    const availableHeight = (layerIndex === 0) ? Math.floor(perDivision) : shelfSpacing;
                    console.log(`Packer: layer=${layerIndex} baseY=${this.layerBaseY} availableHeight=${availableHeight}`);

                    // try to place as many packages as possible in this layer
                    let placedThisLayer = 0;
                    for (let i = 0; i < packagesArray.length; i++) {
                        let pack = packagesArray[i];
                        console.log(`Packer: trying pack id=${pack.id} parent=${pack.parent_id} dims=${pack.w}x${pack.h}x${pack.l}`);
                        let layerContainer = { w: container.w, h: availableHeight, l: container.l };

                        // try normal rotations first
                        let space = this.okRotation(layerContainer, pack);

                        // if it didn't fit because of height, try alternative rotations that may reduce height
                        if (space === false && pack.h > availableHeight) {
                            console.log(`Packer: pack ${pack.id} too tall for layer (${pack.h} > ${availableHeight}), trying alternate rotations`);

                            // iterate through defined rotations and try each orientation explicitly
                            outerTry:
                            for (let r = 0; r < (pack.rotations || []).length; r++) {
                                let p = pack.rotations[r];
                                // try the rotation as defined if it reduces height
                                if (p.h <= availableHeight) {
                                    let tempPack = { ...pack, w: p.w, h: p.h, l: p.l, rotations: [p] };
                                    let s = this.okRotation(layerContainer, tempPack);
                                    if (s !== false) {
                                        // adjust stacking capacity for this orientation
                                        s[2].stackC = Math.max(0, Math.floor(perDivision / s[2].h) - 1);
                                        space = s;
                                        console.log(`Packer: rotation from pack.rotations succeeded for ${pack.id}`, p.type || p);
                                        break outerTry;
                                    }
                                }

                                // derived swaps: swap height with width (rotate on Z), or height with length (rotate on X)
                                // swap h <-> w
                                let swapHW = { w: p.h, h: p.w, l: p.l, type: ['derived-swapHW', 90] };
                                if (swapHW.h <= availableHeight) {
                                    let tempPack = { ...pack, w: swapHW.w, h: swapHW.h, l: swapHW.l, rotations: [swapHW] };
                                    let s = this.okRotation(layerContainer, tempPack);
                                    if (s !== false) {
                                        s[2].stackC = Math.max(0, Math.floor(perDivision / s[2].h) - 1);
                                        space = s;
                                        console.log(`Packer: derived swapHW succeeded for ${pack.id}`);
                                        break outerTry;
                                    }
                                }

                                // swap h <-> l
                                let swapHL = { w: p.w, h: p.l, l: p.h, type: ['derived-swapHL', 90] };
                                if (swapHL.h <= availableHeight) {
                                    let tempPack = { ...pack, w: swapHL.w, h: swapHL.h, l: swapHL.l, rotations: [swapHL] };
                                    let s = this.okRotation(layerContainer, tempPack);
                                    if (s !== false) {
                                        s[2].stackC = Math.max(0, Math.floor(perDivision / s[2].h) - 1);
                                        space = s;
                                        console.log(`Packer: derived swapHL succeeded for ${pack.id}`);
                                        break outerTry;
                                    }
                                }
                            }
                        }

                        if (space !== false) {
                            console.log(`✓ Placed pack ${pack.id} at (${space[0].x},${space[0].y},${space[0].z}) dims ${space[2].w}x${space[2].h}x${space[2].l}`);
                            // createPack will place with this.layerBaseY applied
                            this.createPack(space[2], space[0]);
                            this.refreshOpenPoints(space[1], layerContainer);
                            this.openPoints.push(...this.createSidePoints());
                            this.sortOpenPoints();

                            if (this.packagesLoaded.length >= 2
                                && this.packagesLoaded[this.packagesLoaded.length - 1].parent_id != this.packagesLoaded[this.packagesLoaded.length - 2].parent_id)
                                this.removeDiagonalPoints(this.packagesLoaded[this.packagesLoaded.length - 2]);

                            // remove placed pack from remaining list
                            packagesArray.splice(i, 1);
                            i--;
                            placedThisLayer++;
                        }
                    }
                    console.log(`Packer: layer ${layerIndex} placed ${placedThisLayer} packs, remaining ${packagesArray.length}`);
                    // continue to next layer with remaining packages
                }

                    // If some packages remain that couldn't fit in any single shelf division,
                    // attempt a fallback pass that ignores shelves and uses the full container height.
                    if (packagesArray.length > 0) {
                        console.log(`Packer: ${packagesArray.length} packages remain after shelf passes — trying fallback in full container height`);
                        // reset open points to start from base of full container
                        this.openPoints = [{ x: 0, y: 0, z: 0 }];
                        this.layerBaseY = 0; // place with absolute Y

                        // try to place remaining packages in the full container
                        for (let i = 0; i < packagesArray.length; i++) {
                            let pack = packagesArray[i];
                            console.log(`Packer(fallback): trying pack id=${pack.id} dims=${pack.w}x${pack.h}x${pack.l}`);
                            let space = this.okRotation(container, pack);
                            if (space !== false) {
                                this.createPack(space[2], space[0]);
                                this.refreshOpenPoints(space[1], container);
                                this.openPoints.push(...this.createSidePoints());
                                this.sortOpenPoints();

                                packagesArray.splice(i, 1);
                                i--;
                            }
                        }
                    }

                    return [this.openPoints, this.packagesLoaded];
        }

        // fallback: previous behaviour without shelves (single container volume)
        // compute stacking capacity per pack based on full container height
        priorities.forEach(prio => {
            if (packages[prio]) {
                packages[prio].forEach(p => {
                    const fitCount = Math.floor(container.h / p.h);
                    p.stackC = Math.max(0, fitCount - 1);
                })
            }
        })

        for (let priorityIndex = 0; priorityIndex < priorities.length; priorityIndex++) {
            let packs = packages[priorities[priorityIndex]];

            for (let packIndex = 0; packIndex < packs.length; packIndex++) {

                let pack = packs[packIndex];
                let space = this.okRotation(container, pack);

                if (space !== false) {
                    this.createPack(space[2], space[0]);
                    this.refreshOpenPoints(space[1], container);
                    this.openPoints.push(...this.createSidePoints());
                    this.sortOpenPoints();

                    if (this.packagesLoaded.length >= 2
                        && this.packagesLoaded[this.packagesLoaded.length - 1].parent_id != this.packagesLoaded[this.packagesLoaded.length - 2].parent_id)
                        this.removeDiagonalPoints(this.packagesLoaded[this.packagesLoaded.length - 2]);
                }
            }

            this.removePointsNextPriority();
        }

        return [this.openPoints, this.packagesLoaded];
    }

    checkCollisionNewVersion(point, currentPack) {
        let twoDimensionSpace = this.create2dSpace(point, currentPack, "top");
        let packs = twoDimensionSpace[0];

        if (packs.length > 0) {
            console.log(`Collision detected at point (${point.x},${point.y},${point.z}) for pack dims ${currentPack.w}x${currentPack.h}x${currentPack.l}`);
            return true;
        }
        return false;
    }

    // checkCollision(point, box) {
    //     box.geometry.computeBoundingBox();
    //     box.updateMatrixWorld();

    //     let newBox = box.geometry.boundingBox.clone();
    //     newBox.applyMatrix4(box.matrixWorld);

    //     newBox.max.x = newBox.max.x - 1;
    //     newBox.max.y = newBox.max.y - 1;
    //     newBox.max.z = newBox.max.z - 1;

    //     newBox.min.x = newBox.min.x + 1;
    //     newBox.min.y = newBox.min.y + 1;
    //     newBox.min.z = newBox.min.z + 1;

    //     let loadedBox = "";
    //     for (let i = 0; i < this.packagesLoaded.length; i++) {
    //         let pack = this.packagesLoaded[i];
    //         if ((pack.y == point.y || pack.y < point.y && pack.y + pack.h > point.y)
    //             && pack.x <= point.x && pack.x + pack.w > point.x
    //             && pack.z > point.z
    //         ) {
    //             console.log("yes", pack.id)
    //             loadedBox = pack.id
    //             break;
    //         }
    //     }

    //     if (loadedBox == "") return false;
    //     console.log(loadedBox, this.boxes[`tmpBox_${loadedBox}`])

    //     loadedBox = this.boxes[`tmpBox_${loadedBox}`]
    //     loadedBox.geometry.computeBoundingBox();
    //     loadedBox.updateMatrixWorld();

    //     let newBox1 = loadedBox.geometry.boundingBox.clone();
    //     newBox1.applyMatrix4(loadedBox.matrixWorld);

    //     newBox1.max.x = newBox1.max.x - 1;
    //     newBox1.max.y = newBox1.max.y - 1;
    //     newBox1.max.z = newBox1.max.z - 1;

    //     newBox1.min.x = newBox1.min.x + 1;
    //     newBox1.min.y = newBox1.min.y + 1;
    //     newBox1.min.z = newBox1.min.z + 1;

    //     if (newBox.intersectsBox(newBox1)) {
    //         return newBox.intersectsBox(newBox1);
    //     }


    //     // for (let i = 0; i < this.boxes.length; i++) {
    //     //     let loadedBox = this.boxes[i];
    //     //     loadedBox.geometry.computeBoundingBox();
    //     //     loadedBox.updateMatrixWorld();

    //     //     let newBox1 = loadedBox.geometry.boundingBox.clone();
    //     //     newBox1.applyMatrix4(loadedBox.matrixWorld);

    //     //     newBox1.max.x = newBox1.max.x - 1;
    //     //     newBox1.max.y = newBox1.max.y - 1;
    //     //     newBox1.max.z = newBox1.max.z - 1;

    //     //     newBox1.min.x = newBox1.min.x + 1;
    //     //     newBox1.min.y = newBox1.min.y + 1;
    //     //     newBox1.min.z = newBox1.min.z + 1;

    //     //     if (newBox.intersectsBox(newBox1)) {
    //     //         return newBox.intersectsBox(newBox1);
    //     //     }
    //     // }

    //     return false
    // }

    //create a temperory box to detect collisions
    // createTemperoryBox(pack, packId, coords) {
    //     let normalMateriel = new THREE.MeshLambertMaterial({ color: pack.color * 0xFF0FFF, side: THREE.DoubleSide })

    //     let boxGeometry = new THREE.BoxGeometry(pack.w, pack.h, pack.l);
    //     let box = new THREE.Mesh(boxGeometry, normalMateriel);
    //     let vec3 = new THREE.Vector3(coords.x, coords.y, coords.z);

    //     box.name = `tmpBox_${packId}`;
    //     box.position.copy(vec3);
    //     boxGeometry.translate(pack.w / 2, pack.h / 2, pack.l / 2);
    //     return box;
    // }

    //find the box or the pack that have the specific open point
    getPackByOpenPoint(coords) {
        //find the open point
        let pack = this.packagesLoaded.filter((packLoaded) => {
            return packLoaded.id === coords.pointOwner
        });
        return pack[0];
    }

    //find the box or the pack that have the specific id
    // getPackById(id) {
    //     //find the open point
    //     let pack = this.packagesLoaded.filter((packLoaded) => {
    //         return packLoaded.parent_id === id
    //     });
    //     return pack[0];
    // }

    //create the side point when some spaces cant anything be fit inside of it
    //optimise the space inside the container by creating other point to ignore
    //the spaces that cant hold boxes inside it
    createSidePoints() {
        let pack = this.packagesLoaded[this.packagesLoaded.length - 1];

        let sideOpenPoint = [];

        let sidePoint = this.openPoints.filter(point => {
            return point.y == pack.y
                && point.x < pack.x + pack.w
                && point.pointOwner != pack.id
                && point.type != "S"
                && !point.ignored;
        });

        sidePoint.sort((a, b) => {
            return a.z - b.z;
        });

        // console.log(pack, sidePoint);

        var index = null;
        if (sidePoint.length > 0) {
            let p1 = pack.openPoint.F;
            let p2 = sidePoint[0];

            //first conditions
            let isTherePack = [];
            let check = [];
            let isPointInPack = [];

            //second conditions
            let isTherePack1 = [];
            let check1 = [];
            let isPointInPack1 = [];

            for (let i = 0; i < this.packagesLoaded.length; i++) {
                let currentPack = this.packagesLoaded[i];

                if (currentPack.x > p1.x && currentPack.x <= p2.x && currentPack.z > p1.z && currentPack.z <= p2.z && currentPack.y == p1.y) isTherePack.push(currentPack)
                if (pack.y > 0
                    && currentPack.y + currentPack.h == pack.y
                    && currentPack.x <= pack.x + pack.w + 1
                    && currentPack.x + currentPack.w >= pack.x + pack.w + 1
                    && currentPack.z <= sidePoint[0].z + 1
                    && currentPack.z + currentPack.l >= sidePoint[0].z + 1) check.push(currentPack)

                if (currentPack.x <= pack.x
                    && currentPack.x + currentPack.w >= pack.x
                    && currentPack.z <= sidePoint[0].z
                    && currentPack.z + currentPack.l >= sidePoint[0].z) isPointInPack.push(currentPack)


                //second
                if (currentPack.x >= p2.x && currentPack.x <= p1.x && currentPack.z + 1 > p1.z && currentPack.z + 1 <= p2.z && currentPack.y == p1.y) isTherePack1.push(currentPack)
                if (pack.y > 0
                    && currentPack.y + currentPack.h == pack.y
                    && currentPack.x <= sidePoint[0].x + 1
                    && currentPack.x + currentPack.w >= sidePoint[0].x + 1
                    && currentPack.z <= pack.z + 1
                    && currentPack.z + currentPack.l >= pack.z + 1) check1.push(currentPack)
                if (currentPack.x <= sidePoint[0].x
                    && currentPack.x + currentPack.w >= sidePoint[0].x
                    && currentPack.z <= pack.z
                    && currentPack.z + currentPack.l >= pack.z) isPointInPack1.push(currentPack)
            }

            if (pack.z + pack.l - sidePoint[0].z > 0) {

                if (isTherePack.length == 0) {
                    let tmpSidePoint = {
                        pointOwner: pack.id,
                        x: pack.x + pack.w,
                        y: pack.y,
                        z: sidePoint[0].z,
                        type: "S",
                        ignored: false,
                        prio: pack.priority
                    }

                    if (pack.y == 0) {
 
                        if (tmpSidePoint.z == 0 || isPointInPack.length != 0) {
                            sideOpenPoint.push(tmpSidePoint);

                            index = this.openPoints.findIndex(p => {
                                return p.x == sidePoint[0].x && p.y == pack.y && p.z == sidePoint[0].z;
                            });
                        }

                    }
                    else {
                        if (check.length > 0) {
                            sideOpenPoint.push(tmpSidePoint);

                            index = this.openPoints.findIndex(p => {
                                return p.x == sidePoint[0].x && p.y == pack.y && p.z == sidePoint[0].z;
                            });
                        }
                    }


                }
            }

            if (pack.z + pack.l - sidePoint[0].z < 0) {

                if (isTherePack1.length == 0) {
                    let tmpSidePoint = {
                        pointOwner: pack.id,
                        x: sidePoint[0].x,
                        y: pack.y,
                        z: pack.z + pack.l,
                        type: "S",
                        ignored: false,
                        prio: pack.priority
                    };

                    if (pack.y == 0) {
                        if (tmpSidePoint.z == 0 || isPointInPack1.length != 0) {
                            sideOpenPoint.push(tmpSidePoint);

                            index = this.openPoints.findIndex(p => {
                                return p.x == pack.x && p.y == pack.y && p.z == pack.z + pack.l;
                            });
                        }
                    }

                    else {
                        if (check1.length > 0) {
                            sideOpenPoint.push(tmpSidePoint);

                            index = this.openPoints.findIndex(p => {
                                return p.x == pack.x && p.y == pack.y && p.z == pack.z + pack.l;
                            });
                        }
                    }
                }
            }

            if (index != -1 && index != null) {
                this.openPoints[index].ignored = true;
            }
        }

        return sideOpenPoint;
    }

    //create the open point
    createOpenPoints(coords, pack) {

        let validOpenPoint = [
            {
                pointOwner: pack.id,
                x: coords.x,
                y: coords.y + pack.h,
                z: coords.z,
                type: "T",
                ignored: false,
                prio: pack.priority
            },
        ];

        let openPoints = [
            {
                pointOwner: pack.id,
                x: coords.x,
                y: coords.y,
                z: coords.z + pack.l,
                type: "R",
                ignored: false,
                prio: pack.priority
            },
            {
                pointOwner: pack.id,
                x: coords.x + pack.w,
                y: coords.y,
                z: coords.z,
                type: "F",
                ignored: false,
                prio: pack.priority
            }
        ];

        if (coords.x == 0 && coords.y == 0 && coords.z == 0)
            return [...validOpenPoint, ...openPoints];

        let twoDimensionSpace = this.create2dSpace(coords, pack);
        let packs = twoDimensionSpace[0];
        let space = twoDimensionSpace[1];

        if (packs.length != 0 && Object.keys(space).length != 0) {

            for (let i = 0; i < openPoints.length; i++) {
                let point = openPoints[i];

                let check = 0;
                for (let j = 0; j < packs.length; j++) {
                    let p = packs[j];
                    let packSpace = space[p.id];

                    let testPoint = {
                        x: point.x + 1,
                        z: point.z + 1
                    }

                    if (point.y == 0) {
                        if (!this.isPointContainedInSpace(packSpace, testPoint, false))
                            check++;
                    }

                    else {
                        if (this.isPointContainedInSpace(packSpace, testPoint, false)) {
                            let loadedPackInSpace = this.packagesLoaded.filter(p => {
                                // console.log(p.id, point);
                                return p.x <= point.x + 1
                                    && p.x + p.w > point.x + 1
                                    && p.z <= point.z + 1
                                    && p.z + p.l > point.z + 1
                                    && p.y == coords.y
                                    && p.id != point.pointOwner
                            });

                            let dis;
                            if (point.type == "R") dis = packSpace[3].z - point.z;
                            if (point.type == "F") dis = packSpace[3].x - point.x;

                            // console.log(point.type, pack, pack.id, dis);

                            // console.log(loadedPackInSpace);
                            if (loadedPackInSpace.length == 0) {
                                if (point.type == "R")
                                    validOpenPoint.push(openPoints[0]);
                                if (point.type == "F")
                                    validOpenPoint.push(openPoints[1]);
                            }
                        }
                    }
                }

                if (check == packs.length) {
                    if (point.type == "R") {
                        validOpenPoint.push(openPoints[0]);
                    }

                    if (point.type == "F") {
                        validOpenPoint.push(openPoints[1]);
                    }
                }
            }
        }

        // console.log(validOpenPoint)
        return validOpenPoint;
    }

    //create the pack and added it to the scene
    createPack(pack, coords) {
        //add the box to the scene and to loadedPackages array
        const baseY = this.layerBaseY || 0;
        const absY = coords.y + baseY;

        this.packagesLoaded.push({
            ...pack,
            ...coords,
            y: absY,
            absOffset: 0,
            openPoint: {
                R: {
                    x: coords.x,
                    y: absY,
                    z: coords.z + pack.l,
                },
                T: {
                    x: coords.x,
                    y: absY + pack.h,
                    z: coords.z,
                },
                F: {
                    x: coords.x + pack.w,
                    y: absY,
                    z: coords.z,
                }
            }
        });

        // createOpenPoints expects absolute coordinates (scene Y). pass absolute coords
        // so other helpers that compare to placed packages (which store absolute Y) continue to work.
        const absoluteCoords = { x: coords.x, y: absY, z: coords.z };
        this.openPoints.push(...this.createOpenPoints(absoluteCoords, pack))

        //add the boxes to the list
        // this.boxes[`tmpBox_${pack.id}`] = this.createTemperoryBox(pack, pack.id, coords)
    }
}

export default Packer;