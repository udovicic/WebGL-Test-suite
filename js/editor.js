// Editor/IDE object
function Editor(vertex, fragment, model, preview) {
    // Store elements upon object creation
    this.vertex_el      = vertex;
    this.fragment_el    = fragment;
    this.model_el       = model;
    this.preview_el     = preview.first();

    // Load source code from local storage
    this.load = function(profile) {
        vertex      = localStorage.getItem("vertex" + profile);
        fragment    = localStorage.getItem("fragment" + profile);
        model       = localStorage.getItem("model" + profile);

        if (vertex)     this.vertex_el.setValue(vertex);
        if (fragment)   this.fragment_el.setValue(fragment);
        if (model)      this.model_el.setValue(model);

        return this;
    };

    // Save source code to local storage
    this.save = function(profile) {
        localStorage.setItem("vertex" + profile, this.vertex_el.getValue());
        localStorage.setItem("fragment" + profile, this.fragment_el.getValue());
        localStorage.setItem("model" + profile, this.model_el.getValue());

        return this;
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

        return this;
    };

    // Create object
    this.initObject = function() {
        try {
            var loader      = new THREE.JSONLoader;
            var code        = JSON.parse(this.model_el.getValue());
            var mesh        = loader.parse(code);
        } catch (err) {
            displayMessage('Init object error', 'Unable to parse JSON: ' + err);
            return this;
        }

        try {
            var material = new THREE.ShaderMaterial({
                vertexShader:   this.vertex_el.getValue(),
                fragmentShader: this.fragment_el.getValue()
            });
        } catch (err) {
            displayMessage('Init object error', 'Unable to compile shaders: ' + err);
            return this;
        }

        try {
            this.gl_object = new THREE.Mesh(mesh.geometry, material);
            this.gl_renderer.setClearColor(0xeeeefa);
        } catch (err) {
            displayMessage('Init object error', 'Unable to create object: ' + err);
            return this;
        }

        this.gl_object.name = "gl_object";

        return this;
    };

    // Initialize camera
    this.initCamera = function() {
        // Element dimensions
        var height      = this.preview_el.height();
        var width       = this.preview_el.width();
        this.gl_camera  = new THREE.PerspectiveCamera(45, width/height, 1, 10000);

        // Camera starts at 0,0,0 - pull it back
        this.gl_camera.position.set(0, 1, 2.5);

        // Adjust camera direction
        this.gl_camera.lookAt(this.gl_object.position);

        // Adjust view matrix if necessary
        //this.gl_camera.position.y += 0.5;

        this.gl_camera.name = "gl_camera";

        this.gl_scene.add(this.gl_camera);

        return this;
    };

    // Render single frame
    this.render = function() {
        if (typeof(this.gl_object) == 'undefined')
            throw 'Unable to render: Object not initialized';

        // Initialize other object
        this.initCamera();

        this.gl_scene.remove(this.gl_scene.getObjectByName('gl_object'));
        this.gl_scene.add(this.gl_object);

        // Render scene
        try {
            this.gl_renderer.render(this.gl_scene, this.gl_camera);
        } catch (err) {
            displayMessage('Rendering error', 'Unable to render frame: ' + err);
            return;
        }

        return this;
    };

    // Animate object (rotation around Y-axis)
    this.animate = function() {
        // Create GL Clock for controlling fps
        this.gl_clock = new THREE.Clock();
        
        this
            .render()
            ._render_callback();

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
        this.gl_object.rotateY(this.gl_clock.getDelta());

        // Loop animation
        this.gl_animation = requestAnimationFrame(this._render_callback.bind(this));
    };

    // Hack for gui glitch
    this._el_refresh = function() {
        this.vertex_el.refresh();
        this.fragment_el.refresh();
        this.model_el.refresh();
    };

    return this;
}
