// Create shared variable. The value is given as the interpolation between normals computed in the vertex shader
varying vec3 interpolatedNormal;

void main() {
    // Set final rendered color according to the surface normal
  vec3 N = normalize(interpolatedNormal);
  gl_FragColor = vec4(N, 1.0);
}
