// routes and priority UI removed

$(document).ready(function () {

    $(".menuIcon").click(function () {
        $(".menu").toggleClass("openMenu closeMenu");
        $(".menuIcon").toggleClass("openMenuIcon closeMenu");
    });

    $("#closeMenuIcon").click(function () {
        $(".menu").toggleClass("openMenu closeMenu");
        $(".menuIcon").toggleClass("openMenuIcon closeMenu");
    });

    $("#reset").click(function () {
        localStorage.removeItem("container");
        localStorage.removeItem("packages");
        location.reload();
    });

    $("#openCSV").click(function () {
        $("#openCSV").toggleClass("fa-circle-plus fa-circle-minus")
        $("#csv").toggleClass("formContainerContentOpen formContainerContentClose");
    });

    $("#openApi").click(function () {
        $("#openApi").toggleClass("fa-circle-plus fa-circle-minus")
        $("#api").toggleClass("formContainerContentOpen formContainerContentClose");
    });

    // Routes UI removed

    $("#openPackages").click(function () {
        $("#openPackages").toggleClass("fa-circle-plus fa-circle-minus")
        $("#packages").toggleClass("formContainerContentOpen formContainerContentClose");
    });

    $("#openRacks").click(function () {
        $("#openRacks").toggleClass("fa-circle-plus fa-circle-minus")
        $("#racks").toggleClass("formContainerContentOpen formContainerContentClose");
    });

    $("#openResult").click(function () {
        $("#openResult").toggleClass("fa-circle-plus fa-circle-minus")
        $("#result").toggleClass("formContainerContentOpen formContainerContentClose");
    });

    $("#openExport").click(function () {
        $("#openExport").toggleClass("fa-circle-plus fa-circle-minus")
        $("#files").toggleClass("formContainerContentOpen formContainerContentClose");
    });

    $("#openPackDetail").click(function () {
        $("#openPackDetail").toggleClass("fa-circle-plus fa-circle-minus")
        $("#packDetail").toggleClass("pack-detail-close pack-detail-open");
    });

    var container = JSON.parse(localStorage.getItem("container"));
    if (container !== null) {
        var packDim = container.w + " , " + container.h + " , " + container.l;
        if (container.shelves !== undefined) packDim += " , shelves: " + container.shelves;
        $("#containerDetails").append('<span>' + packDim + '</span>');
    }

    //open the advanced parameters
    $("#toggleAdvParam").click(function () {
        $(".sub-container").toggleClass("sub-container--close sub-container--open");
        $("#toggleAdvParam").toggleClass("toggleAdvParam--close toggleAdvParam--open")
    });

    // priority controls removed

    //activate manuelle mode drag and drop

})

