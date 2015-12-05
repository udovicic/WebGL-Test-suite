// CONSTANTS
const vec3 color = vec3(1, 0.35, 0.15); // Object color

// Define intensity used in Fragment shader
varying vec3 vNormal;
varying vec3 vLight;

void main()
{
	float modifier;
    
    float intensity = dot(
        normalize(vNormal),
        normalize(vLight)
    );

	if (intensity > 0.96)
		modifier = 3.0;
	else if (intensity > 0.1)
		modifier = 1.0;
    else if (intensity > -0.6)
		modifier = 0.7;
	else
		modifier = 0.5;
    
    vec3 fragColor  = color * modifier;
  
  gl_FragColor = vec4(
      clamp(fragColor.x, 0.0, 1.0), // Red
      clamp(fragColor.y, 0.0, 1.0), // Green
      clamp(fragColor.z, 0.0, 1.0), // Blue
      1.0 // Alpha
  );

}
