function getVertices(){
    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
      
        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,
      
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
      
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
      
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
      
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
      ];

    for(let i = 0; i < positions.length; i++){
        positions[i] *= 0.1;
    }
    return positions;
}
function getColors(){
    const colors = [
        [1.0,  1.0,  1.0,  1.0],    // Front face: white
        [1.0,  0.0,  0.0,  1.0],    // Back face: red
        [0.0,  1.0,  0.0,  1.0],    // Top face: green
        [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
        [1.0,  1.0,  0.0,  1.0],    // Right face: yellow
        [1.0,  0.0,  1.0,  1.0]     // Left face: purple
    ];
    let generatedColors = [];
    for(const c of colors){
        for(let i = 0; i < 4; i++){
            generatedColors = generatedColors.concat(c); //不能用push，push是2维数组
        }
    }
    return generatedColors;
}
function getElementIndex(){
    // This array defines each face as two triangles, using the
      // indices into the vertex array to specify each triangle's
      // position.

    let cubeVertexIndices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23    // left
        ];
        return cubeVertexIndices;
}

async function loadGLSLFiles() {
    let vertexShader = await getShaderString("../shaders/vertex.glsl");
    let fragmentShader = await getShaderString("../shaders/fragment.glsl");
    let ret = {
        "vertex": vertexShader,
        "fragment": fragmentShader
    };
    return ret;
}


function randomFloat(){
    return Math.random() * 4 - 1.5;
}

function getRandomTranslate(){
    const ret = [];
    for(let i = 0; i < 10; ++i){
        ret.push([randomFloat(), randomFloat()]);
    }
    console.log(ret);
    return ret;
    
}