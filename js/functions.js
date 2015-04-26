// initi function
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

    // Init preview
    previewInit();
});

/**
 * Displays message in modal box
 */
function displayMessage(title, msg) {
    jQuery("#msgTitle").html(title);
    jQuery("#msgText").html(msg);
    jQuery('#message').modal();
}

function previewInit() {
    // Element dimensions
    var canvasHolder = jQuery("#preview").first();
    var height = canvasHolder.height();
    var width = canvasHolder.width();

    // Create GL Context
    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    canvasHolder.append(renderer.domElement);
    var scene = new THREE.Scene;

    // Test objects
    var cubeGeometry = new THREE.BoxGeometry(100, 100, 100);
    var cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x1ec876 });
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.rotation.y = Math.PI * 45 /  180;

    // Dome
    var skyboxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
    var skyboxMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide });
    var skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);

    // Light
    var pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(0, 300, 200);

    // Camera :: FOV, aspect, near, far
    var camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 10000);
    camera.position.y = 160;
    camera.position.z = 400;
    camera.lookAt(cube.position);

    // Add all to sceen
    scene.add(cube);
    scene.add(skybox);
    scene.add(camera);
    scene.add(pointLight);

    // Let the games begin
    function render() {
        renderer.render(scene, camera);

        cube.rotation.y -= clock.getDelta();
        requestAnimationFrame(render);
    }
    var clock = new THREE.Clock;
    render();


}
