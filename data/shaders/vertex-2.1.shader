// CONSTANTS
// Could also be defined in original app, and passed as uniform variable
const vec3 lightPosition = vec3(6, 4, -7); // Light position

// Uniform variables set by THREE.js
// uniform mat4 modelMatrix;
// uniform mat4 projectionMatrix;
// uniform mat4 viewMatrix;
// attribute vec3 normal;

// Define intensity used in Fragment shader
varying vec3 vNormal;
varying vec3 vLight;
varying vec4 vPosition;
varying vec2 vUv;

void main()
{
    // Calculate transformation
    mat4 MVP = projectionMatrix * viewMatrix * modelMatrix;

    // Transform vertex normal
    vNormal = (MVP * vec4(normal, 1.0)).xyz;
    vLight = lightPosition;
    vPosition = MVP * vec4(position, 1.0);
    vUv = uv;

    // transform vertex position
	gl_Position = vPosition;
}
