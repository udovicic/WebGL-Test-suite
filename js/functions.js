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
            mode: "text/x-c++src"
        }),
        CodeMirror.fromTextArea(jQuery('#fragment-shader')[0],{
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true,
            mode: "text/x-c++src"
        }),
        CodeMirror.fromTextArea(jQuery('#json-model')[0],{
            lineNumbers: true,
            matchBrackets: true,
            styleActiveLine: true
        }),
        jQuery("#preview")
    );

    // Hack for gui glitch
    $('ul.nav').children('li').on('click', function() {
        setTimeout(function() {
            preview._el_refresh()
        }, 10);
    });

    // Trigger rendering
    try {
        preview
            .load()
            .initContext()
            .initObject()
            .render();
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

// Save editor state
jQuery('#btnLoad').on('click', function() {
    preview.load();
});
jQuery('#btnSave').on('click', function() {
    preview.save();
    displayMessage("Success", "Code has been save to your browser");
});
jQuery('#btnApply').on('click', function() {
    preview
        .stop()
        .initObject()
        .render();
});

// Editor object
function Editor(vertex, fragment, model, preview) {
    // Store elements upon object creation
    this.vertex_el      = vertex;
    this.fragment_el    = fragment;
    this.model_el       = model;
    this.preview_el     = preview.first();

    // Load source code from local storage
    this.load = function() {
        vertex      = localStorage.vertex;
        fragment    = localStorage.fragment;
        model       = localStorage.model;

        if (vertex)     this.vertex_el.setValue(vertex);
        if (fragment)   this.fragment_el.setValue(fragment);
        if (model)      this.model_el.setValue(model);

        return this;
    };

    // Save source code to local storage
    this.save = function() {
        localStorage.setItem("vertex", this.vertex_el.getValue());
        localStorage.setItem("fragment", this.fragment_el.getValue());
        localStorage.setItem("model", this.model_el.getValue());
    };

    // Initialize WebGL context
    this.initContext = function() {
        // Element dimensions
        var height  = this.preview_el.height();
        var width   = this.preview_el.width();

        // Create GL Context
        this.gl_renderer = new THREE.WebGLRenderer({ antialias: true });
        this.gl_renderer.setSize(width, height);
        this.preview_el.append(this.gl_renderer.domElement);

        // Create GL scene
        this.gl_scene = new THREE.Scene();

        // Create GL Clock for controlling fps
        this.gl_clock = new THREE.Clock();

        return this;
    };

    // Create object
    this.initObject = function() {
        try {
            var loader      = new THREE.JSONLoader;
            var code        = JSON.parse(this.model_el.getValue());
            var mesh        = loader.parse(code);
        } catch (err) {
            console.log(err);
            displayMessage('Init object error', 'Unable to parse JSON: ' + err);
            return this;
        }

        try {
            var material = new THREE.ShaderMaterial({
                vertexShader:   this.vertex_el.getValue(),
                fragmentShader: this.fragment_el.getValue()
            });
        } catch (err) {
            console.log(2);
            displayMessage('Init object error', 'Unable to compile shaders: ' + err);
            return this;
        }

        try {
            this.gl_object = new THREE.Mesh(mesh.geometry, material);
        } catch (err) {
            console.log(3);
            displayMessage('Init object error', 'Unable to create object: ' + err);
            return this;
        }

        this.gl_scene.add(this.gl_object);

        return this;
    };

    // Initialize camera
    this.initCamera = function() {
        // Element dimensions
        var height      = this.preview_el.height();
        var width       = this.preview_el.width();
        this.gl_camera  = new THREE.PerspectiveCamera(45, width/height, 0.1, 10000);

        // camera starts at 0,0,0 - pull it back
        this.gl_camera.position.z = 400;
        this.gl_camera.lookAt(this.gl_object.position);

        this.gl_scene.add(this.gl_camera);

        return this;
    };

    // Render single frame
    this.render = function() {
        if (typeof(this.gl_object) == 'undefined')
            throw 'Unable to render: Object not initialized';

        // Initialize other object
        this.initCamera();

        // Render scene
        try {
            this.gl_renderer.render(this.gl_scene, this.gl_camera);
        } catch (err) {
            displayMessage('Rendering error', 'Unable to render frame: ' + err);
            return;
        }

        return this;
    };

    // Stop animation
    this.stop = function() {
        if (typeof(this.gl_animation) == 'undefined')
            return this;

        cancelAnimationFrame(this.gl_animation);
        delete this.gl_animation;

        return this;
    };

    // Callback function for rendering
    this._render_callback = function() {
        // Render scene
        this.gl_renderer.render(this.gl_scene, this.gl_camera);

        // Perform object rotation
        this.gl_object.rotation.y -= this.gl_clock.getDelta();

        // Loop animation
        this.gl_animation = requestAnimationFrame(this._render_callback.bind(this));
    };

    this._el_refresh = function() {
        this.vertex_el.refresh();
        this.fragment_el.refresh();
        this.model_el.refresh();
    };

    return this;
}
