// Main object
var preview;

// Initialization
jQuery(function() {
    // Browser support test
    if (Modernizr.canvas !== true) {
        displayMessage('Browser not supported!', 'Your browser does not support canvas. Unable to continue.');
        return;
    }
    if (Modernizr.webgl !== true) {
        displayMessage('Browser not supported!', 'Your browser does not support WebGL. Unable to continue.');
        return;
    }
    if (Modernizr.localstorage !== true) {
        displayMessage('Browser not supported!', 'Your broser does not support local storage. Changes will not be saved.');
    }

    // Creating editor object
    preview = new Editor(
        CodeMirror.fromTextArea(jQuery('#vertex-shader')[0],{
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true,
            mode: "text/x-c++src",
            indentUnit: 4
        }),
        CodeMirror.fromTextArea(jQuery('#fragment-shader')[0],{
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true,
            mode: "text/x-c++src",
            indentUnit: 4
        }),
        CodeMirror.fromTextArea(jQuery('#json-model')[0],{
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true,
            indentUnit: 4
        }),
        jQuery("#preview")
    );

    // Trigger rendering
    try {
        preview
            .load(1)
            .initContext()
            .initObject()
            .animate();
    } catch(err) {
        // TODO: Display error line or more descriptive errors
        displayMessage('Runtime error', err);
    }

});

// Display message in modal box
function displayMessage(title, msg) {
    jQuery("#msgTitle").html(title);
    jQuery("#msgText").html(msg);
    jQuery('#message').modal();
}

// Hack for gui glitch
$('ul.nav').children('li').on('click', function() {
    setTimeout(function() {
        preview._el_refresh()
    }, 10);
});

// Load from local storage
jQuery('#selProfile').on('change', function() {
    preview.load(jQuery('#selProfile').val())
        .stop()
        .initObject()
        .render();
});

// Save to local storage
jQuery('#btnSave').on('click', function() {
    preview.save(jQuery('#selProfile').val());
    displayMessage("Success", "Code has been save to your browser");
});

// Render single frame
jQuery('#btnRender').on('click', function() {
    preview
        .stop()
        .initObject()
        .render();
});

// Render and rotate object
jQuery('#btnAnimate').on('click', function() {
    preview
        .stop()
        .initObject()
        .animate();
});