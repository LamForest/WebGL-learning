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


    const VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);

    //1. 链接vertex.glsl中的aVertexPosition
    {
        const positions = getVertices();

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions),
            gl.STATIC_DRAW);
        //shader中的attribute是vec4
        //这里是2，少的部分会由GPU补齐
        //Note that size​ does not have to exactly match the size used by the vertex shader. 
        // If the vertex shader has fewer components than the attribute provides, then the extras are ignored. 
        // If the vertex shader has more components than the array provides, 
        // the extras are given values from the vector (0, 0, 0, 1) for the missing XYZW components.
        const numComponents = 3;  // pull out 2 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        const offset = 0;         // how many bytes inside the buffer to start from

        //VAO记录
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        //顶点属性默认是禁用的， 需要启用
        //VAO记录
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }




    //2. 顶点attribute aVertexColor链接
    {
        const generatedColors = getColors();

        const colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);


        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(generatedColors), //第二个参数必须是一个1维数组
            gl.STATIC_DRAW);

        //shader中的attribute是vec4
        const numComponents = 4;  // pull out 4 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        const offset = 0;         // how many bytes inside the buffer to start from

        //VAO记录
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        //VAO记录
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
    }


    {
        const cubeVertexIndices = getElementIndex();

        //VAO记录
        const cubeVerticesIndexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);


        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    }

    //停止VAO记录
    gl.bindVertexArray(null);

    return VAO;


}
function randomInt(range) {
    return Math.random() * range;
}

function getMVPMatrix(gl, angle, randomxy) {
    let rotateMatrix = mat4.create();
    //复杂旋转分解成绕y轴旋转和z轴旋转
    mat4.rotate(rotateMatrix, rotateMatrix,
        angle,
        [0, 1, 0]
    );
    mat4.rotate(rotateMatrix, rotateMatrix,
        2 * angle,
        [0, 0, 1]
    );
    mat4.rotate(rotateMatrix, rotateMatrix,
        angle,
        [1, 0, 0]
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
        modelMatrix,     // matrix to translate
        [randomxy[0], randomxy[1], -6.0]);  // amount to translate

    mat4.multiply(modelMatrix, modelMatrix, rotateMatrix);

    let MVP = mat4.create();

    mat4.multiply(MVP, projectionMatrix, modelMatrix);

    return MVP;

}

function drawScene(gl, programInfo, VAO, angle, randomXY) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    
    

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // 讲Uniform变量传送进GPU


    gl.bindVertexArray(VAO); //隐含了bind elementArray


    {
        for (let i = 0; i < 10; i++) {
            let MVP = getMVPMatrix(gl, angle, randomXY[i]);
            gl.uniformMatrix4fv(
                programInfo.uniformLocations.projectionMatrix,
                false,
                MVP);

            const offset = 0;
            const vertexCount = 36;

            //从顶点buffer中第0个开始，画4个顶点
            gl.drawElements(gl.TRIANGLES, vertexCount, gl.UNSIGNED_SHORT, offset);
        }


    }

    gl.bindVertexArray(null);
}

function main() {
    //第一步获取context
    const canvas = document.querySelector('#cube_canvas');
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
                vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            },
        };

        const VAO = initBuffers(gl, programInfo);

        let then = 0;

        const randomXY = getRandomTranslate();
        // Draw the scene repeatedly
        function render(now) {
            now *= 0.001;  // convert to seconds
            const deltaTime = now - then;
            cur_angle = ((Math.PI / 180) * 60 * deltaTime + cur_angle) % (Math.PI * 2);
            //   console.log(cur_angle);
            then = now;

            drawScene(gl, programInfo, VAO, cur_angle, randomXY);

            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    });

    shaders.catch((reason) => {
        alert("加载shader失败： " + reason);
    });
}