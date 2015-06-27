// main object
var preview;

// Initialization
jQuery(function() {
    // Broser support test
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
    preview = new editor(
        $('#vertex-shader'),
        $('#fragment-shader'),
        $('#json-model'),
        jQuery("#preview")
    );

    // Trigger rendering
    try {
        preview
            .load()
            .initContext()
            .dummyObject2()
            .render();
    } catch(err) {
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
jQuery('#btnApply').on('click', function() {
    preview.save();

    // TODO: Apply changes to preview object
});

// Editor object
function editor(vertex, fragment, model, preview) {
    // Store elements uopn object creation
    this.vertex_el      = vertex;
    this.fragment_el    = fragment;
    this.model_el       = model;
    this.preview_el     = preview.first();

    // Load source code from localstorage
    this.load = function() {
        vertex      = localStorage.vertex;
        fragment    = localStorage.fragment;
        model       = localStorage.model;

        if (vertex)     this.vertex_el.val(vertex);
        if (fragment)   this.fragment_el.val(fragment);
        if (model)      this.model_el.val(model);

        return this;
    }

    // Save source code to localstorage
    this.save = function() {
        localStorage.setItem("vertex", this.vertex_el.val());
        localStorage.setItem("fragment", this.fragment_el.val());
        localStorage.setItem("model", this.model_el.val());
    }

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

        // Cretae GL Clock for controling fps
        this.gl_clock = new THREE.Clock();

        return this;
    }

    // Create dummy object
    this.dummyObject = function() {
        var cubeGeometry = new THREE.BoxGeometry(100, 100, 100);
        var cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x1ec876 });
        this.gl_object   = new THREE.Mesh(cubeGeometry, cubeMaterial);

        this.gl_scene.add(this.gl_object);

        return this;
    }

    this.dummyObject2 = function()
    {
        var radius = 50,
            segments = 16,
            rings = 16;
        var sphereGeometry  = new THREE.SphereGeometry(radius, segments, rings);
        // var sphereMaterial  = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
        var sphereMaterial  = new THREE.ShaderMaterial({
            vertexShader:   this.vertex_el.val(),
            fragmentShader: this.fragment_el.val()
        });

        this.gl_object      = new THREE.Mesh(sphereGeometry, sphereMaterial);

        this.gl_scene.add(this.gl_object);

        return this;
    }

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
    }

    // Animate object (rotation around Y-axis)
    this.animate = function() {
        this
            .render()
            ._render_callback();

        return this;
    }

    // Render single frame
    this.render = function() {
        if (typeof(this.gl_object) == 'undefined')
            throw 'Unable to render: Object not initialized';

        // Initialize other object
        this.initCamera();

        // Render scene
        this.gl_renderer.render(this.gl_scene, this.gl_camera);

        return this;
    }

    // Stop animation
    this.stop = function() {
        cancelAnimationFrame(this.gl_animation);
    }

    // Callback function for rendering
    this._render_callback = function() {
        // Render scene
        this.gl_renderer.render(this.gl_scene, this.gl_camera);

        // Perform object rotation
        this.gl_object.rotation.y -= this.gl_clock.getDelta();

        // Loop animation
        this.gl_animation = requestAnimationFrame(this._render_callback.bind(this));
    }

    return this;
}
