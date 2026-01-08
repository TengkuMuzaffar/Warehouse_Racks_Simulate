import { scale_meter_px, scene } from "./configurations.js";
import Container from "./container.js";
import Pack from "./pack.js";
import Packer from "./packer.js";
import { loadResult, loadPacksInstanced, boxInstances, breakPoints, generatePDF } from "./result_drawer.js";
import Logger from "./logger.js";
// routes feature removed; keep module if needed elsewhere
import DragSurface from "./dragAndDrop/dragSurface.js";
import { deleteAllPacks } from "./dragAndDrop/dragDropMenu.js";

// routes removed
var containerCreated = false;
var lastNum;
var index = 0;

//removes the container and the loadedBoxes
function updateScene(type) {
    if (type == "loadedPacks")
        scene.remove(scene.getObjectByName("All_Packs"))

    if (type == "all") {
        scene.remove(scene.getObjectByName("All_Packs"))
        scene.remove(scene.getObjectByName("Full_Container"))
    }

    $("#result").empty();

    $("#result").append(`
    <div class="empty-result">
      Not solved yet
    </div>`)

    $("#files").empty();

    $("#files").append(`
    <div class="empty-result">
      Not solved yet
    </div>`)
}

// take the api url and return the data
async function loadApi(url = "") {
    if (url != "") {
        await fetch(url)
            .then(res => {
                if (res.ok)
                    return res.json()
            })
            .then(data => {
                loadDataFromAPI(data)
            })
            .catch(err => console.log(err));
    }

}

//load the data from the csv file into the container and the packages
function loadDataFromAPI(data) {
    let container = data.container;
    let packages = data.items || data.colis || [];

    // use shelves value from API if provided, otherwise read UI value
    const shelvesVal = (container && container.shelves) ? container.shelves : (parseInt($("#containerShelves").val()) || 4);

    new Container(container.w, container.h, container.l, container.capacity, shelvesVal);
    containerCreated = true;

    packages.map(pack => {
        new Pack(pack.label, pack.w, pack.h, pack.l, pack.q, pack.stackingCapacity, pack.rotations, 0).add();
    });

    let logger = new Logger("Load Data", 0.01);
    logger.dispatchMessage();
}

// from  = api || from = localstorage
// routes removed

//read the csv file
//check if the extention if .csv
function readCsv(e, ext) {
    if ($.inArray(ext, ["csv"]) == -1) {
        showErrorMessage("Please upload a CSV file")
        return false;
    }
    if (e.target.files != undefined) {
        $("#file-chosen").html(e.target.files[0].name)
        var reader = new FileReader();
        reader.onload = function (e) {
            var lines = e.target.result.split('\r\n');
            loadDataFromCsv(lines);
        };
        reader.readAsText(e.target.files.item(0));
    }
    return false;
}

//load the data from the csv file into the container and the packages
function loadDataFromCsv(data) {
    let arrayOfRoutes = [];
    for (let i = 5; i < data.length; i++) {
        if (data[i].length > 0) {
            let line = data[i].split(",");

            if (line[0] == "container") {
                const shelvesVal = parseInt($("#containerShelves").val()) || 4;
                new Container(line[1], line[2], line[3], line[4], shelvesVal);
                containerCreated = true;
            }
            if (line[0] == "colis" || line[0] == "item") {
                let rotations = [];
                for (let j = 8; j <= 10; j++) {
                    console.log(line[j])
                    if (line[j] != undefined)
                        rotations.push(line[j].replace("\"", ''));
                }

                new Pack(line[1], line[2], line[3], line[4], line[5], line[6], [...rotations], line[7]).add();
            }
            // routes ignored when importing CSV
        }
    }
}


// show the error message in the application
function showErrorMessage(msg) {
    $(".error-container").toggleClass("error-container--hidden")
    $("#errorMsg").html(msg)

    setTimeout(() => {
        $(".error-container").toggleClass("error-container--hidden")
    }, 1500)
}

$(document).ready(function () {
    const worker = new Worker('src/worker.js', { type: "module" });

    var container = JSON.parse(localStorage.getItem("container"));
    if (container !== null) {
        $("#containerWidth").val(container.w)
        $("#containerHeight").val(container.h)
        $("#containerLenght").val(container.l)
        $("#containerUnloading").val(container.unloading)
        if (container.shelves !== undefined) $("#containerShelves").val(container.shelves)
    }

    // routes functionality removed from UI

    //submit the container form to create the container
    $("#containerForm").submit(function (event) {

        event.preventDefault();
        var containerDimensions = {};

        //read variables from container form
        containerDimensions.w = $("#containerWidth").val();
        containerDimensions.h = $("#containerHeight").val();
        containerDimensions.l = $("#containerLenght").val();
        containerDimensions.capacity = 0;

        //remove all the truck and the packs added
        updateScene("all");

        //create the container (read shelves from UI)
        const shelvesVal = parseInt($("#containerShelves").val()) || 4;
        new Container(containerDimensions.w, containerDimensions.h, containerDimensions.l, containerDimensions.capacity, shelvesVal);
        new DragSurface(containerDimensions.w, containerDimensions.h, containerDimensions.l);
        containerCreated = true;
    });

    //submit the packages form to add the packs
    $("#packForm").submit(function (event) {
        event.preventDefault();

        if (!containerCreated) {
            showErrorMessage("please create the container")
            return;
        }

        var packDetails = {};
        var pack;

        packDetails.label = $("#packLabel").val();
        packDetails.w = $("#packWidth").val();
        packDetails.h = $("#packHeight").val();
        packDetails.l = $("#packLenght").val();
        packDetails.q = $("#packQuantity").val();
        // stacking capacity removed from UI; solver will compute it
        // rotations are auto-detected by the solver; provide all orientations
        packDetails.r = ["base", "right-side", "front-side"];

        pack = new Pack(packDetails.label, packDetails.w, packDetails.h, packDetails.l, packDetails.q, -1, packDetails.r, 0, [])
        pack.add()

        // var packDim = packDetails.w + " , " + packDetails.h + " , " + packDetails.l + " ( " + packDetails.q + " ) ";
        // $("#packageDetails").append('<div class="packInfo"><div>' + packDetails.label + '</div><div class="packInfo-numbers">' + packDim + ' </div></div>');
    });

    //push the packages into the container
    $("#solve").click(function () {

        if (!containerCreated) {
            showErrorMessage("Please create the container")
            return;
        }

        if (Pack.allInstances.length == 0) {
            showErrorMessage("Please add some packages")
            return;
        }

        $(".menu").toggleClass("openMenu closeMenu");
        $(".menuIcon").toggleClass("openMenuIcon closeMenu");
        deleteAllPacks();
        Pack.removePacksFromTheScene();
        scene.remove(scene.getObjectByName("sphere"));

        var packer = new Packer("cub");
        var packagesToLoad = packer.initialisePackagesToLoad();
        console.log(packagesToLoad)
        new Logger("Loading", 0.01).dispatchMessage();

        worker.postMessage([Container.instances, packagesToLoad]);
        $(".packer-loader").toggleClass("packer-loader--hide packer-loader--show")

        worker.onmessage = (msg) => {

            new Logger("Loaded (Algorithme)", msg.data.executionTime).dispatchMessage();
            $(".packer-loader").toggleClass("packer-loader--hide packer-loader--show")
            loadResult(Pack.allInstances, msg.data.packer[1]);


            // if ($("#loadBoxes").is(":checked")) {
                loadPacksInstanced(msg.data.packer[0], msg.data.packer[1])
                // loadPacks(msg.data.packer[0], msg.data.packer[1]);
                new Logger("Loaded (3D models)", msg.data.executionTime).dispatchMessage();
            // }

            $("#numberBox").attr("max", msg.data.packer[1].length);
            $("#numberBox").val(msg.data.packer[1].length);

            console.log(breakPoints)
            // ensure index points to the last pair (linesGeometry at last index, mesh at index-1)
            index = Math.max(1, boxInstances.length - 1);
            if (boxInstances.length >= 2) {
                if (breakPoints.length == 0) {
                    lastNum = (boxInstances[index - 1] && boxInstances[index - 1].count) || 0;
                } else {
                    lastNum = breakPoints.reduce((partialSum, a) => partialSum + (a || 0), 0) + 1;
                }
            } else if (boxInstances.length === 1) {
                lastNum = (boxInstances[0] && boxInstances[0].count) || 0;
                index = 0;
            } else {
                lastNum = 0;
            }

            $(".scene-player").removeClass("hidden")
        }
    })

    //change to the manuelle mode
    let stat = false;
    $("#switchManuelleMode").click(function () {
        if (!containerCreated) {
            showErrorMessage("Please create the container")
            return;
        }

        if (Pack.allInstances.length == 0) {
            showErrorMessage("Please add some packages")
            return;
        }

        updateScene("loadedPacks");
        $(".menu").toggleClass("openMenu closeMenu");
        $(".menuIcon").toggleClass("openMenuIcon closeMenu");
        $(".dragDrop-container").toggleClass("hidden");
        $(".scene-player").addClass("hidden")

        Pack.reloadShowPacker();

        stat = !stat;
        $("#solve").toggleClass("disabled")
        //change the mode of app from auto fill to manuelle fill
        DragSurface.switch(stat)

    });

    //load the packages from the localstorage if not empty
    Pack.loadPacksFromLocalStorage();

    //click event on the update button to update a specific pack
    $("#updatePack").click(function (event) {
        event.preventDefault();

        var packDetails = {};
        packDetails.id = $("#pack_Detail_Id").val();
        packDetails.label = $("#pack_Detail_Label").val();
        packDetails.w = $("#pack_Detail_Width").val() * scale_meter_px;
        packDetails.h = $("#pack_Detail_Height").val() * scale_meter_px;
        packDetails.l = $("#pack_Detail_Lenght").val() * scale_meter_px;
        packDetails.q = $("#pack_Detail_Quantity").val();
        // stacking capacity and rotation controls removed from UI
        packDetails.r = ["base", "right-side", "front-side"];

        // priorities removed: no sub-quantities
        packDetails.subQuantities = [];

        Pack.update(packDetails, packDetails.id);
        Pack.removeBoxesFromTheScene();
        Pack.loadPacks();

    });

    //get the array of values inserted by the user
    function getMultipleInputValues(className) {
        let inputs = $(className);
        let values = [];

        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            values.push(parseInt(input.value));
        }

        return values;
    }

    //click event on the delete button to remove a specific pack
    $("#deletePack").click(function (event) {
        event.preventDefault();

        let id = $("#pack_Detail_Id").val();
        Pack.remove(id);
        Pack.removeBoxesFromTheScene();
        Pack.loadPacks();
    });

    // csv section
    // load data from csv file
    $("#actual-btn").change((e) => readCsv(e, $("#actual-btn").val().split(".").pop().toLowerCase()));


    $("#numberBox").on("input", function (e) {

        if (e.target.value != null && boxInstances.length > 1) {
            // ensure index is within bounds
            index = Math.min(index, boxInstances.length - 1);
            let boxes = boxInstances[index - 1]
            let linesGeometry = boxInstances[index]

            if (lastNum < e.target.value) {
                console.log("increasing");

                boxes.count = ++boxes.count
                linesGeometry.instanceCount = boxes.count

                if (breakPoints.includes(parseInt(e.target.value))) index += 2;
            }
            else {
                console.log("decreasing");
                boxes.count = --boxes.count
                linesGeometry.instanceCount = boxes.count

                if (breakPoints.includes(parseInt(e.target.value))) index -= 2;
            }

            lastNum = e.target.value;
        }
    });

    // load data from api
    $("#loadApi").click(() => loadApi($("#apiUrl").val()));

    //fill the form with random numbers to make the things fast and easy
    $("#random").click(function () {
        $("#packLabel").val("item " + Math.floor((Math.random() * 100)));
        $("#packWidth").val(Math.floor((Math.random() * (2 - 0.1 + 1) + 0.1) * 100) / 100);
        $("#packHeight").val(Math.floor((Math.random() * (2 - 0.1 + 1) + 0.1) * 100) / 100);
        $("#packLenght").val(Math.floor((Math.random() * (2 - 0.1 + 1) + 0.1) * 100) / 100);
        $("#packQuantity").val(Math.floor((Math.random() * 20) + 1));
    });
});

function playScene(value) {

    // console.log(value)
    if (value != null && boxInstances.length > 1) {
    index = Math.min(index, boxInstances.length - 1);
    let boxes = boxInstances[index - 1]
    let linesGeometry = boxInstances[index]

        console.log(lastNum, value)
        if (lastNum < value) {
            console.log("increasing");

            boxes.count = ++boxes.count
            linesGeometry.instanceCount = boxes.count

            if (breakPoints.includes(parseInt(value))) index += 2;
        }
        else {
            console.log("decreasing");
            boxes.count = --boxes.count
            linesGeometry.instanceCount = boxes.count

            console.log(boxes.count)
            if (breakPoints.includes(parseInt(value))) index -= 2;
        }

        lastNum = value;
    }
}

var speed = 200;
var myInterval;
var direction = "backward";

function play() {

    let numberBox = $("#numberBox");
    let numberBoxValue = parseInt(numberBox.val());
    let numberBoxMax = parseInt(numberBox.attr("max"));

    // console.log(numberBoxValue, numberBoxMax)
    myInterval = setInterval(() => {

        // console.log("hello")
        if (direction == "backward" && numberBoxValue >= 1) {
            $(`#play-forward`).removeClass("disabled")
            numberBox.val(--numberBoxValue)
            playScene(numberBoxValue)
        }

        if (direction == "forward" && numberBoxValue < numberBoxMax) {
            $(`#play-backward`).removeClass("disabled")
            numberBox.val(++numberBoxValue)
            playScene(numberBoxValue)
        }

        if (direction == "backward" && numberBoxValue < 1) {
            $("#play-pause").attr("role", "pause")
            $("#play-pause").toggleClass("fa-circle-play fa-circle-pause")

            $(`#play-${direction}`).toggleClass("disabled", true)
            $(`#play-${direction}`).toggleClass("scene-player--active")

            direction = "forward"
            numberBox.val(0)
            lastNum = -1
            $(`#play-${direction}`).toggleClass("scene-player--active", true)

            pause()
        }

        if (direction == "forward" && numberBoxValue >= numberBoxMax) {
            $("#play-pause").attr("role", "pause")
            $("#play-pause").toggleClass("fa-circle-play fa-circle-pause")

            $(`#play-${direction}`).toggleClass("disabled", true)
            $(`#play-${direction}`).toggleClass("scene-player--active")

            direction = "backward"
            $(`#play-${direction}`).toggleClass("scene-player--active", true)
            pause()
        }

    }, speed);
}

function pause() {
    clearInterval(myInterval)
}

function changeSceneDirection(dir) {
    $(`#play-${dir}`).toggleClass("scene-player--active", true)
    $(`#play-${direction}`).toggleClass("scene-player--active", false)

    direction = dir
}

$("#increase-speed").click(function () {
    console.log(speed)
    if (speed <= 500)
        speed += 50
})

$("#decrease-speed").click(function () {
    console.log(speed)

    if (speed >= 1)
        speed -= 50
})

$("#play-backward").click(function () {
    changeSceneDirection("backward")
})

$("#play-forward").click(function () {
    changeSceneDirection("forward")
})

//play with the scene using the controlls
//like video controlls
$("#play-pause").on("click", function () {
    $(this).toggleClass("fa-circle-play fa-circle-pause")
    let role = $(this).attr("role");

    if (role == "play") {
        $(this).attr("role", "pause")
        role = "pause"
    }
    else {
        $(this).attr("role", "play")
        role = "play"
    }

    if (role == "play") play();
    else pause();
})

//generate the pdf file
$(document).on('click', '#exportPdf', function () {
    generatePDF()
})

// $("#exportPdf").on('click', 'b', function () {
//     console.log("generate the pdf")
//     generatePDF();
// })

//this export is used for testing 
export { loadApi, readCsv }

