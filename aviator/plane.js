var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0
};

//在window发生load event时，使用init作为事件处理句柄处理load事件
//false的意义不明
window.addEventListener('load', init, false);

function init() {
    // 创建场景，相机和渲染器
    createScene();
    // 添加光源
    createLights();
    // 添加对象
    createPlane();
    createSea();
    createSky();
    // 调用循环函数，在每帧更新对象的位置和渲染场景
    loop();
}

var scene, camera, fieldOfView, aspectRatio, nearPlane,
    farPlane, HEIGHT, WIDTH, renderer, container;

function createScene() {
    // 获得屏幕的宽和高，
    // 用它们设置相机的纵横比
    // 还有渲染器的大小
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // 创建场景
    scene = new THREE.Scene();

    // 在场景中添加雾的效果；样式上使用和背景一样的颜色
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    // 创建相机
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    /**
     * PerspectiveCamera 透视相机
     * @param fieldOfView 视角
     * @param aspectRatio 纵横比
     * @param nearPlane 近平面
     * @param farPlane 远平面
     */
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );

    // 设置相机的位置
    camera.position.x = 0;
    camera.position.z = 200;
    camera.position.y = 100;

    // 创建渲染器
    // 不用传入canvas，此时THREE会为自己创建一个canvas即domElement
    renderer = new THREE.WebGLRenderer({
        // 在 css 中设置背景色透明显示渐变色、
        // 不设置的话，canvas的背景色就是黑色，不是css中指定的渐变色
        alpha: true,
        // 开启抗锯齿，但这样会降低性能。
        // 哪种抗锯齿方法？MSAA？
        antialias: true //确实有效果，飞机的边缘变得平滑了
        
    });

    // 定义渲染器的尺寸；在这里它会填满整个屏幕
    renderer.setSize(WIDTH, HEIGHT);

    // 打开渲染器的阴影地图
    renderer.shadowMap.enabled = true;

    // 在 HTML 创建的容器中添加THREE自己创建的 canvas
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // 监听屏幕，缩放屏幕更新相机和渲染器的尺寸
    window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize() {
    // 更新渲染器的高度和宽度以及相机的纵横比
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}

var hemisphereLight, shadowLight;

function createLights() {
    // 半球光就是渐变的光；
    // 第一个参数是天空的颜色，第二个参数是地上的颜色，第三个参数是光源的强度
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);

    // 方向光是从一个特定的方向的照射
    // 类似太阳，即所有光源是平行的
    // 第一个参数是关系颜色，第二个参数是光源强度
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    // 设置光源的方向。
    // 位置不同，方向光作用于物体的面也不同，看到的颜色也不同
    shadowLight.position.set(150, 350, 350);

    // 开启光源投影
    shadowLight.castShadow = true;

    // 定义可见域的投射阴影
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // 定义阴影的分辨率；虽然分辨率越高越好，但是需要付出更加昂贵的代价维持高性能的表现。
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    // 为了使这些光源呈现效果，只需要将它们添加到场景中
    scene.add(hemisphereLight);
    scene.add(shadowLight);
}

//首先定义一个大海对象
Sea_old = function() {

    // 创建一个圆柱几何体
    // 参数为：顶面半径，底面半径，高度，半径分段，高度分段
    var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

    // 在 x 轴旋转几何体
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    // 创建材质
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.blue,
        transparent: true,
        opacity: .6,
        shading: THREE.FlatShading
    });

    // 为了在 Three.js 创建一个物体，我们必须创建网格用来组合几何体和一些材质
    this.mesh = new THREE.Mesh(geom, mat);

    // 允许大海对象接收阴影
    this.mesh.receiveShadow = true;
}

Sea = function() {
    var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    // 重点：通过合并顶点，我们确保海浪的连续性
    geom.mergeVertices();

    // 获得顶点
    var l = geom.vertices.length;

    // 创建一个新的数组存储与每个顶点关联的值：
    this.waves = [];

    for (var i = 0; i < l; i++) {
        // 获取每个顶点
        var v = geom.vertices[i];

        // 存储一些关联的数值
        this.waves.push({
            y: v.y,
            x: v.x,
            z: v.z,
            // 随机角度
            ang: Math.random() * Math.PI * 2,
            // 随机距离
            amp: 5 + Math.random() * 15,
            // 在0.016至0.048度/帧之间的随机速度
            speed: 0.016 + Math.random() * 0.032
        });
    };
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.blue,
        transparent: true,
        opacity: .8,
        shading: THREE.FlatShading,
    });

    this.mesh = new THREE.Mesh(geom, mat);
    this.mesh.receiveShadow = true;
}

// 现在我们创建一个在每帧可以调用的函数，用于更新顶点的位置来模拟海浪。

Sea.prototype.moveWaves = function() {

    // 获取顶点
    var verts = this.mesh.geometry.vertices;
    var l = verts.length;

    for (var i = 0; i < l; i++) {
        var v = verts[i];

        // 获取关联的值
        var vprops = this.waves[i];

        // 更新顶点的位置
        v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
        v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;

        // 下一帧自增一个角度
        vprops.ang += vprops.speed;
    }

    // 告诉渲染器代表大海的几何体发生改变
    // 事实上，为了维持最好的性能
    // Three.js会缓存几何体和忽略一些修改
    // 除非加上这句
    this.mesh.geometry.verticesNeedUpdate = true;

    sea.mesh.rotation.z += .005;
}

//实例化大海对象，并添加至场景
var sea;

function createSea() {
    sea = new Sea();

    // 在场景底部，稍微推挤一下
    sea.mesh.position.y = -600;

    // 添加大海的网格至场景
    scene.add(sea.mesh);
}

Cloud = function() {
    // 创建一个空的容器放置不同形状的云
    this.mesh = new THREE.Object3D();

    // 创建一个正方体
    // 这个形状会被复制创建云
    var geom = new THREE.BoxGeometry(20, 20, 20);

    // 创建材质；一个简单的白色材质就可以达到效果
    var mat = new THREE.MeshPhongMaterial({
        color: Colors.white,
    });

    // 随机多次复制几何体
    var nBlocs = 3 + Math.floor(Math.random() * 3);
    for (var i = 0; i < nBlocs; i++) {

        // 通过复制几何体创建网格
        var m = new THREE.Mesh(geom, mat);

        // 随机设置每个正方体的位置和旋转角度
        m.position.x = i * 15;
        m.position.y = Math.random() * 10;
        m.position.z = Math.random() * 10;
        m.rotation.z = Math.random() * Math.PI * 2;
        m.rotation.y = Math.random() * Math.PI * 2;

        // 随机设置正方体的大小
        var s = .1 + Math.random() * .9;
        m.scale.set(s, s, s);

        // 允许每个正方体生成投影和接收阴影
        m.castShadow = true;
        m.receiveShadow = true;

        // 将正方体添加至开始时我们创建的容器中
        this.mesh.add(m);
    }
}

// 定义一个天空对象
Sky = function() {
    // 创建一个空的容器
    this.mesh = new THREE.Object3D();

    // 选取若干朵云散布在天空中
    this.nClouds = 20;

    // 把云均匀地散布
    // 我们需要根据统一的角度放置它们
    var stepAngle = Math.PI * 2 / this.nClouds;

    // 创建云对象
    for (var i = 0; i < this.nClouds; i++) {
        var c = new Cloud();

        // 设置每朵云的旋转角度和位置
        // 因此我们使用了一点三角函数
        var a = stepAngle * i; //这是云的最终角度
        var h = 750 + Math.random() * 200; // 这是轴的中心和云本身之间的距离

        // 三角函数！！！希望你还记得数学学过的东西 :)
        // 假如你不记得:
        // 我们简单地把极坐标转换成笛卡坐标
        c.mesh.position.y = Math.sin(a) * h;
        c.mesh.position.x = Math.cos(a) * h;

        // 根据云的位置旋转它
        c.mesh.rotation.z = a + Math.PI / 2;

        // 为了有更好的效果，我们把云放置在场景中的随机深度位置
        c.mesh.position.z = -400 - Math.random() * 400;

        // 而且我们为每朵云设置一个随机大小
        var s = 1 + Math.random() * 2;
        c.mesh.scale.set(s, s, s);

        // 不要忘记将每朵云的网格添加到场景中
        this.mesh.add(c.mesh);
    }
}

// 现在我们实例化天空对象，而且将它放置在屏幕中间稍微偏下的位置。

var sky;

function createSky() {
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}

var AirPlane = function() {

    this.mesh = new THREE.Object3D();

    // // 创建机舱
    // var geomCockpit = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
    // var matCockpit = new THREE.MeshPhongMaterial({
    //     color: Colors.red,
    //     shading: THREE.FlatShading
    // });
    // var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    // cockpit.castShadow = true;
    // cockpit.receiveShadow = true;
    // this.mesh.add(cockpit);

    // 驾驶舱
    var geomCockpit = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
    var matCockpit = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });

    // 我们可以通过访问形状中顶点数组中一组特定的顶点
    // 然后移动它的 x, y, z 属性:
    geomCockpit.vertices[4].y -= 10;
    geomCockpit.vertices[4].z += 20;
    geomCockpit.vertices[5].y -= 10;
    geomCockpit.vertices[5].z -= 20;
    geomCockpit.vertices[6].y += 30;
    geomCockpit.vertices[6].z += 20;
    geomCockpit.vertices[7].y += 30;
    geomCockpit.vertices[7].z -= 20;

    var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);

    // 创建引擎
    var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
    var matEngine = new THREE.MeshPhongMaterial({
        color: Colors.white,
        shading: THREE.FlatShading
    });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);

    // 创建机尾
    var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
    var matTailPlane = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35, 25, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);

    // 创建机翼
    var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
    var matSideWing = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);

    // 创建螺旋桨
    var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    var matPropeller = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // 创建螺旋桨的桨叶
    var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
    var matBlade = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        shading: THREE.FlatShading
    });

    var blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(50, 0, 0);
    this.mesh.add(this.propeller);

};

var Pilot = function() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "pilot";

    // angleHairs是用于后面头发的动画的属性
    this.angleHairs = 0;

    // 飞行员的身体
    var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
    var bodyMat = new THREE.MeshPhongMaterial({
        color: Colors.brown,
        shading: THREE.FlatShading
    });
    var body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(2, -12, 0);
    this.mesh.add(body);

    // 飞行员的脸部
    var faceGeom = new THREE.BoxGeometry(10, 10, 10);
    var faceMat = new THREE.MeshLambertMaterial({
        color: Colors.pink
    });
    var face = new THREE.Mesh(faceGeom, faceMat);
    this.mesh.add(face);

    // 飞行员的头发
    var hairGeom = new THREE.BoxGeometry(4, 4, 4);
    var hairMat = new THREE.MeshLambertMaterial({
        color: Colors.brown
    });
    var hair = new THREE.Mesh(hairGeom, hairMat);
    // 调整头发的形状至底部的边界，这将使它更容易扩展。
    hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));

    // 创建一个头发的容器
    var hairs = new THREE.Object3D();

    // 创建一个头发顶部的容器（这会有动画效果）
    this.hairsTop = new THREE.Object3D();

    // 创建头顶的头发并放置他们在一个3*4的网格中
    for (var i = 0; i < 12; i++) {
        var h = hair.clone();
        var col = i % 3;
        var row = Math.floor(i / 3);
        var startPosZ = -4;
        var startPosX = -4;
        h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
        this.hairsTop.add(h);
    }
    hairs.add(this.hairsTop);

    // 创建脸庞的头发
    var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
    hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
    var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
    var hairSideL = hairSideR.clone();
    hairSideR.position.set(8, -2, 6);
    hairSideL.position.set(8, -2, -6);
    hairs.add(hairSideR);
    hairs.add(hairSideL);

    // 创建后脑勺的头发
    var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
    var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1, -4, 0)
    hairs.add(hairBack);
    hairs.position.set(-5, 5, 0);

    this.mesh.add(hairs);

    var glassGeom = new THREE.BoxGeometry(5, 5, 5);
    var glassMat = new THREE.MeshLambertMaterial({
        color: Colors.brown
    });
    var glassR = new THREE.Mesh(glassGeom, glassMat);
    glassR.position.set(6, 0, 3);
    var glassL = glassR.clone();
    glassL.position.z = -glassR.position.z;

    var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
    var glassA = new THREE.Mesh(glassAGeom, glassMat);
    this.mesh.add(glassR);
    this.mesh.add(glassL);
    this.mesh.add(glassA);

    var earGeom = new THREE.BoxGeometry(2, 3, 2);
    var earL = new THREE.Mesh(earGeom, faceMat);
    earL.position.set(0, 0, -6);
    var earR = earL.clone();
    earR.position.set(0, 0, 6);
    this.mesh.add(earL);
    this.mesh.add(earR);
}

// 移动头发
Pilot.prototype.updateHairs = function() {

    // 获得头发
    var hairs = this.hairsTop.children;

    // 根据 angleHairs 的角度更新头发
    var l = hairs.length;
    for (var i = 0; i < l; i++) {
        var h = hairs[i];
        // 每根头发将周期性的基础上原始大小的75%至100%之间作调整。
        h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
    }
    // 在下一帧增加角度
    this.angleHairs += 0.16;
}


var airplane, airperson;

function createPlane() {
    airplane = new AirPlane();
    airperson = new Pilot();
    airplane.mesh.scale.set(.25, .25, .25);
    airplane.mesh.position.y = 100;
    airperson.mesh.scale.set(1, 1, 1);
    airperson.mesh.position.y = 30;
    scene.add(airplane.mesh.add(airperson.mesh));
}

//renderer.render(scene, camera);

function loop() {
    // 使螺旋桨旋转并转动大海和云
    airplane.propeller.rotation.x += 0.3;
    sea.mesh.rotation.z += .005;
    sky.mesh.rotation.z += .01;
    airplane.mesh.add(airperson.mesh).rotation.y += 0.008;

    airperson.updateHairs();
    sea.moveWaves();
    updatePlane();

    // 渲染场景
    renderer.render(scene, camera);

    // 重新调用 render() 函数
    requestAnimationFrame(loop);
}

function init(event) {
    createScene();
    createLights();
    createPlane();
    createSea();
    createSky();

    //添加监听器
    document.addEventListener('mousemove', handleMouseMove, false);

    loop();
}

var mousePos = {
    x: 0,
    y: 0
};

// mousemove 事件处理函数

function handleMouseMove(event) {

    // 这里我把接收到的鼠标位置的值转换成归一化值，在-1与1之间变化
    // 这是x轴的公式:

    var tx = -1 + (event.clientX / WIDTH) * 2;

    // 对于 y 轴，我们需要一个逆公式
    // 因为 2D 的 y 轴与 3D 的 y 轴方向相反

    var ty = 1 - (event.clientY / HEIGHT) * 2;
    mousePos = {
        x: tx,
        y: ty
    };
}



function updatePlane() {

    // 让我们在x轴上-100至100之间和y轴25至175之间移动飞机
    // 根据鼠标的位置在-1与1之间的范围，我们使用的 normalize 函数实现（如下）

    var targetX = normalize(mousePos.x, -1, 1, -100, 100);
    var targetY = normalize(mousePos.y, -1, 1, 25, 175);

    // 更新飞机的位置
    airplane.mesh.position.y = targetY;
    airplane.mesh.position.x = targetX;
    airplane.propeller.rotation.x += 0.3;
}

function normalize(v, vmin, vmax, tmin, tmax) {

    var nv = Math.max(Math.min(v, vmax), vmin);
    var dv = vmax - vmin;
    var pc = (nv - vmin) / dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc * dt);
    return tv;
}