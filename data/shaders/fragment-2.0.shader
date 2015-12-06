// CONSTANTS
const vec3 color = vec3(1, 0.6, 0.5); // Object color

uniform int pass;
uniform sampler2D tNormal;
uniform sampler2D tToon;
uniform vec2 aspect;

// Define intensity used in Fragment shader
varying vec3 vNormal;
varying vec3 vLight;
varying vec2 vUv;

void paintNormals()
{
    float color = (vNormal.x + vNormal.y + vNormal.z) * 0.3;
	gl_FragColor = vec4(color);
}

void toonShade()
{
	float modifier;

    float intensity = dot(
        normalize(vNormal),
        normalize(vLight)
    );

	if (intensity > 0.97)
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

bool extractEdges()
{
    float sample, thr,
    	sx = 0.0,
    	sy = 0.0;
    vec2 texel=vec2(1.0/aspect.x, 1.0/aspect.y);
    mat3 I;

	mat3 Sx=mat3(
        1.0, 0.0, -1.0,
        2.0, 0.0, -2.0,
        1.0, 0.0, -1.0
    );
    mat3 Sy=mat3(
        1.0, 2.0, 1.0,
        0.0, 0.0, 0.0,
        -1.0, -2.0, -1.0
    );


    for (float i=0.0; i<3.0; i++) {
    	for (float j=0.0; j<3.0; j++) {
    		sample = texture2D(tNormal, vUv+(texel*vec2(i-1.0, j-1.0))).x;
            sx += Sx[int(i)][int(j)]*sample;
            sy += Sy[int(i)][int(j)]*sample;
        }
    }

    thr = sqrt(sx*sx + sy*sy);

    if (thr > 0.2) {
        gl_FragColor = vec4(0.0);
        return true;
    }

    return false;
}

void main()
{
 	if (pass == 1) {
        paintNormals();
        return;
    }

    if (pass == 2) {
        toonShade();
        return;
    }

    if (!extractEdges()) {
     	gl_FragColor = texture2D(tToon, vUv);
    }
}