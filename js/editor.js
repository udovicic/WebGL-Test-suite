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
        var width   = this.preview_el.width();
        var height  = this.preview_el.height();

        // Create GL Context
        this.gl_renderer = new THREE.WebGLRenderer({ antialias: true });
        this.gl_renderer.setSize(width, height);
        this.preview_el.append(this.gl_renderer.domElement);

        // Create GL scene
        this.gl_scene = new THREE.Scene();
        this.gl_scene_plane = new THREE.Scene();

        // Create texture for multi-pass rendering
        this.gl_texture_normal = new THREE.WebGLRenderTarget(width, height);
        this.gl_texture_toon = new THREE.WebGLRenderTarget(width, height);
        this.gl_texture_dummy = new THREE.WebGLRenderTarget(1, 1);

        // Init camera object
        this.initCamera();

        this.compileProgram();

        // Plane scene setup
        var geometry = new THREE.PlaneGeometry(width, height);
        //var material = new THREE.MeshLambertMaterial({ map : this.gl_texture_normal });
        var plane = new THREE.Mesh( geometry, this.gl_shader_material );
        this.gl_scene_plane.add( plane );
        this.gl_camera_plane.lookAt(plane);

        var lights;
        lights = new THREE.PointLight( 0xffffff, 1, 0 );

        lights.position.set( 0, 0, 300 );

        this.gl_scene_plane.add( lights );


        return this;
    };

    // Initialize camera
    this.initCamera = function() {
        // Element dimensions
        var width       = this.preview_el.width();
        var height      = this.preview_el.height();
        this.gl_camera  = new THREE.PerspectiveCamera(45, width/height, 1, 10000);

        // Camera starts at 0,0,0 - pull it back
        this.gl_camera.position.set(0, 1, 2.5);

        this.gl_camera.name = "gl_camera";

        this.gl_scene.add(this.gl_camera);

        this.gl_camera_plane = new THREE.OrthographicCamera(width/-2, width/2, height/2, height/- 2, 1, 10000);
        this.gl_camera_plane.position.set(0, 0, 1);
        this.gl_scene_plane.add(this.gl_camera_plane);

        return this;
    };

    this.compileProgram = function() {
        this.gl_shader_material = new THREE.ShaderMaterial({
            uniforms: {
                pass:   { type: "i", value: 1 },
                tNormal:{ type: "t", value: this.gl_texture_dummy },
                tToon:  { type: "t", value: this.gl_texture_dummy },
                aspect: { type: "v2", value: new THREE.Vector2(this.preview_el.width(), this.preview_el.height()) }
            },
            vertexShader:   this.vertex_el.getValue(),
            fragmentShader: this.fragment_el.getValue()
        });

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
            this.gl_object = new THREE.Mesh(mesh.geometry, this.gl_shader_material);
            this.gl_renderer.setClearColor(0xeeeefa);
        } catch (err) {
            displayMessage('Init object error', 'Unable to create object: ' + err);
            return this;
        }

        this.gl_object.name = "gl_object";

        // Adjust camera direction
        this.gl_camera.lookAt(this.gl_object.position);

        return this;
    };

    // Render single frame
    this.render = function() {
        return this
            .compileProgram()
            ._render();
    };

    this._render = function() {
        if (typeof(this.gl_object) == 'undefined')
            throw 'Unable to render: Object not initialized';

        this.gl_scene.remove(this.gl_scene.getObjectByName('gl_object'));
        this.gl_scene.add(this.gl_object);

        // Render scene
        try {

            // First pass - normals
            this.gl_object.material.uniforms.pass.value = 1;
            this.gl_object.material.uniforms.tNormal.value = this.gl_texture_dummy;
            this.gl_object.material.uniforms.tToon.value = this.gl_texture_dummy;
            this.gl_renderer.render(this.gl_scene, this.gl_camera, this.gl_texture_normal, true);

            // Second pass - toon shading
            this.gl_object.material.uniforms.pass.value = 2;
            this.gl_renderer.render(this.gl_scene, this.gl_camera, this.gl_texture_toon, true);

            // Third pass - merging
            this.gl_object.material.uniforms.pass.value = 3;
            this.gl_object.material.uniforms.tNormal.value = this.gl_texture_normal;
            this.gl_object.material.uniforms.tToon.value = this.gl_texture_toon;
            this.gl_renderer.render(this.gl_scene_plane, this.gl_camera_plane);
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
            .compileProgram()
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
        this._render();

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
