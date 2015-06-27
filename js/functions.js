/**
 * Initialize editor
 */

var preview;

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

    // iinitialize preview object
    preview = new editor(
        $('#vertex-shader'),
        $('#fragment-shader'),
        $('#json-model'),
        jQuery("#preview")
    );
    preview
        .load()
        .initContext()
        .fakeObject()
        .initLight()
        .initCamera()
        .render();



});

/**
 * Save editor state
 */
jQuery('#btnApply').on('click', function() {
    localStorage.setItem("vertex", vertex_el.val());
    localStorage.setItem("fragment", ragment_el.val());
    localStorage.setItem("model", modmodel_el.val());
});

/**
 * Displays message in modal box
 */
function displayMessage(title, msg) {
    jQuery("#msgTitle").html(title);
    jQuery("#msgText").html(msg);
    jQuery('#message').modal();
}

/**
 * Editor class
 */
function editor(vertex, fragment, model, preview) {
    this.vertex_el      = vertex;
    this.fragment_el    = fragment;
    this.model_el       = model;
    this.preview_el     = preview.first();

    // Load source code from localstorage
    this.load = function () {
        vertex = localStorage.vertex;
        fragment = localStorage.fragment;
        model = localStorage.model;

        if (vertex)     this.vertex_el.val(vertex);
        if (fragment)   this.fragment_el.val(fragment);
        if (model)      this.model_el.val(model);

        return this;
    }

    // Initialize WebGL context
    this.initContext = function() {
        // Element dimensions
        var height = this.preview_el.height();
        var width = this.preview_el.width();

        // Create GL Context
        this.gl_renderer = new THREE.WebGLRenderer({ antialias: true });
        this.gl_renderer.setSize(width, height);
        this.preview_el.append(this.gl_renderer.domElement);

        // Create GL scene
        this.gl_scene = new THREE.Scene;

        // Cretae GL Clock for controling fps
        this.gl_clock = new THREE.Clock;

        return this;
    }

    this.fakeObject = function() {
        var cubeGeometry = new THREE.BoxGeometry(100, 100, 100);
        var cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x1ec876 });
        this.gl_object = new THREE.Mesh(cubeGeometry, cubeMaterial);
        this.gl_object.rotation.y = Math.PI * 45 /  180;

        this.gl_scene.add(this.gl_object);

        return this;
    }

    this.initLight = function() {
        this.gl_point_light = new THREE.PointLight(0xffffff);
        this.gl_point_light.position.set(0, 300, 200);

        this.gl_scene.add(this.gl_point_light);

        return this;
    }

    this.initCamera = function() {
        // Element dimensions
        var height = this.preview_el.height();
        var width = this.preview_el.width();

        this.gl_camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 10000);
        this.gl_camera.position.y = 160;
        this.gl_camera.position.z = 400;
        this.gl_camera.lookAt(this.gl_object.position);

        this.gl_scene.add(this.gl_camera);

        return this;
    }

    this.render = function() {
        this.gl_renderer.render(this.gl_scene, this.gl_camera);

        this.gl_object.rotation.y -= this.gl_clock.getDelta();
        requestAnimationFrame(this.render.bind(this));
    }

    return this;
}
