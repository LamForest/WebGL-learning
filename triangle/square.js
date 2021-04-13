main();
//  链接
let cur_angle = 0.0;
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // 创建着色器程序

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // 创建失败， alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

//
// 编译
//
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function initBuffers(gl, programInfo) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        -1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW);   
     
    const VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);
    //链接vertex.glsl中的aVertexPosition
    {
        //shader中的attribute是vec4
        //这里是2，少的部分会由GPU补齐
        //Note that size​ does not have to exactly match the size used by the vertex shader. 
        // If the vertex shader has fewer components than the attribute provides, then the extras are ignored. 
        // If the vertex shader has more components than the array provides, 
        // the extras are given values from the vector (0, 0, 0, 1) for the missing XYZW components.
        const numComponents = 2;  // pull out 2 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        // gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position); ?要吗
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        //顶点属性默认是禁用的， 需要启用
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }



    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    const colors = [
        0.0,  0.0,  0.0,  0.0,    // 白
        1.0,  0.2,  0.5,  1.0,    // 红
        0.5,  1.0,  0.3,  1.0,    // 绿
        0.4,  0.8,  1.0,  1.0,    // 蓝
    ];
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(colors),
        gl.STATIC_DRAW);

    //顶点属性color链接
    {
        //shader中的attribute是vec4
        const numComponents = 4;  // pull out 4 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        // gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
    }

    
    gl.bindVertexArray(null)

    return VAO;


}

function getMVPMatrix(gl, angle) {
    let rotateMatrix = mat4.create();
    mat4.rotate(rotateMatrix, rotateMatrix,
        angle,
        [0, 0, 1]
    );
    


    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    modelMatrix = mat4.create();

    mat4.translate(modelMatrix,     // destination matrix
        rotateMatrix,     // matrix to translate
        [-0.0, 0.0, -6.0]);  // amount to translate

    let MVP = mat4.create();

    mat4.multiply(MVP, projectionMatrix, modelMatrix);

    return MVP;

}

function drawScene(gl, programInfo, VAO, angle) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let MVP = getMVPMatrix(gl, angle);
    
    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // 讲Uniform变量传送进GPU
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        MVP);
    
    gl.bindVertexArray(VAO);

    {
        const offset = 0;
        const vertexCount = 4;
        //从顶点buffer中第0个开始，画4个顶点
        gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    }
    
    gl.bindVertexArray(null)
}

async function loadGLSLFiles() {
    let vertexShader = await getShaderString("./shaders/vertex.glsl");
    let fragmentShader = await getShaderString("./shaders/fragment.glsl");
    let ret = {
        "vertex": vertexShader,
        "fragment": fragmentShader
    };
    return ret;
}

function main() {
    //第一步获取context
    const canvas = document.querySelector('#square_canvas');
    const gl = canvas.getContext('webgl2');

    // If we don't have a GL context, give up now
    if (!gl) {
        alert('Unable to initialize WebGL. Your browser or machine may not support it.');
        return;
    }



    let shaders = loadGLSLFiles();

    //promise执行成功会进入shaders.then
    //此时
    shaders.then((data) => {
        const shaderProgram = initShaderProgram(gl, data["vertex"], data["fragment"]);

        //一个匿名类的对象
        //使用 const 声明的对象是可以被修改的，只是不能再对programInfo赋值了
        const programInfo = {
            program: shaderProgram,
            //opengl中的layout location
            
            attribLocations: {
                vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
                vertexColor : gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            },
        };

        const VAO = initBuffers(gl, programInfo);

        let then = 0;
        // Draw the scene repeatedly
        function render(now) {
          now *= 0.001;  // convert to seconds
          const deltaTime = now - then;
          cur_angle = (Math.PI / 180) * 10 * deltaTime + cur_angle;
          console.log(cur_angle);
          then = now;
      
          drawScene(gl, programInfo, VAO, cur_angle);
      
          requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    });

    shaders.catch((reason) => {
        alert("加载shader失败： " + reason);
    });
}