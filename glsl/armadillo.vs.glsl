// Create shared variable for the vertex and fragment shaders
varying vec3 interpolatedNormal;
// varying vec3 interpolatedLight;
// uniform vec3 lightPosition;

/* HINT: YOU WILL NEED MORE SHARED/UNIFORM VARIABLES TO COLOR ACCORDING TO COS(ANGLE) */

void main() {
    // Set shared variable to vertex normal
    interpolatedNormal = normal;
   
//    interpolatedLightDirection = lightPosition

    // Multiply each vertex by the model-view matrix and the projection matrix to get final vertex position
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
