function begin(objData,image1,image2){
    var canvas;
    var gl;
    var program;
    var verts;
    var pointsArray = [];
    var colorsArray = [];
    var normalsArray = [];
    var ambientProduct;
    var diffuseProduct;
    var specularProduct;
    var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
    var lightAmbient = vec4(0.5, 0.5, 0.5, 1.0 );
    var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
    var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
    var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
    var materialDiffuse = vec4( 0.5, 0.5, 0.5, 1.0);
    var materialSpecular = vec4( 0.5, 0.5, 0.5, 1.0 );
    var materialShininess = 100.0;
    var texCoordsArray = [];
    var texture;
    var texture1;
    var groupData = [];
    var vertexGroupMap = [];
    var currentFloor = 4;

    var quaternion;
    var quaternionLoc;

    var tracking = false;
    var moved = false;

    var lastPosition = [0, 0, 0];
    var axis = [0, 0, 1];
    var currentPos = [];

    var texCoord = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    var near 	= 	-4;
    var far 	=	1;
    var theta  	= 	0.0;
    var left 	= -1;
    var right 	= 1;
    var ytop 	= 1;
    var bottom 	= -1;

    var eyeDir;

    var modelViewMatrix, projectionMatrix;
    var modelViewMatrixLoc, projectionMatrixLoc;
    var eye;
    var at = vec3(0.0, 0.0, 0.0);
    var up = vec3(0.0, -1.0, 0.0);

    window.onload = function init() {
        canvas = document.getElementById( "gl-canvas" );

        gl = WebGLUtils.setupWebGL( canvas );
        if ( !gl ) { alert( "WebGL isn't available" ); }

        gl.viewport( 0, 0, canvas.width, canvas.height );

        gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

        gl.enable(gl.DEPTH_TEST);
        var objStr = objData;
        data = loadMeshDataTriangle(objStr);                // loading obj data
        program = initShaders( gl, "vertex-shader", "fragment-shader" );
        gl.useProgram( program );

        attachTexture();

        ambientProduct = mult(lightAmbient, materialAmbient);
        diffuseProduct = mult(lightDiffuse, materialDiffuse);
        specularProduct = mult(lightSpecular, materialSpecular);


        var nBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

        var vNormal = gl.getAttribLocation( program, "vNormal" );
        gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vNormal );

        var tBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

        var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
        gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vTexCoord );

        var vBufferId = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW )
        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );
        modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
        projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

        gl.activeTexture( gl.TEXTURE0 );
        gl.bindTexture( gl.TEXTURE_2D, texture1 );
        gl.uniform1i(gl.getUniformLocation( program, "texture"), 0);

        window.onkeydown = function( event ) {
            var Dir = subtract(at,eye);

            if(event.key == 'ArrowUp'){
                Dir = scale(0.2,normalize(Dir));
                eye = add(eye,vec3(Dir[0],0,Dir[2]));
                at = add(at,vec3(Dir[0],0,Dir[2]));
                lightPosition = at;
            }
            if(event.key == 'ArrowDown'){
                Dir = scale(-0.2,normalize(Dir));
                eye = add(eye,vec3(Dir[0],0,Dir[2]));
                at = add(at,vec3(Dir[0],0,Dir[2]));
            }
            if(event.key == "ArrowLeft"){
                theta += 2;
                theta = radians(theta);
                var rotation = mat4(
                    vec4(Math.cos(theta), 0, Math.sin(theta),0),
                    vec4(0,1,0,0),
                    vec4(-Math.sin(theta), 0, Math.cos(theta),0),
                    vec4(0,0,0,1)
                );
                var translate = mat4(
                    vec4(1,0,0,-eye[0]),
                    vec4(0,1,0,-eye[1]),
                    vec4(0,0,1,-eye[2]),
                    vec4(0,0,0,1)
                );
                var translateBack = mat4(
                    vec4(1,0,0,eye[0]),
                    vec4(0,1,0,eye[1]),
                    vec4(0,0,1,eye[2]),
                    vec4(0,0,0,1)
                );
                var transform = mult(translateBack,mult(rotation,translate));
                var at4 = vec4(at[0],at[1],at[2],1);
                var newat = vec4();
                for ( var i =0; i < transform.length; i++){
                    newat[i] = dot(transform[i],at4);
                }
                at=vec3(newat[0],newat[1],newat[2]);
            }
            if(event.key == "ArrowRight"){
                theta -= 2;
                theta = radians(theta);
                var rotation = mat4(
                    vec4(Math.cos(theta), 0, Math.sin(theta),0),
                    vec4(0,1,0,0),
                    vec4(-Math.sin(theta), 0, Math.cos(theta),0),
                    vec4(0,0,0,1)
                );
                var translate = mat4(
                    vec4(1,0,0,-eye[0]),
                    vec4(0,1,0,-eye[1]),
                    vec4(0,0,1,-eye[2]),
                    vec4(0,0,0,1)
                );
                var translateBack = mat4(
                    vec4(1,0,0,eye[0]),
                    vec4(0,1,0,eye[1]),
                    vec4(0,0,1,eye[2]),
                    vec4(0,0,0,1)
                );
                var transform = mult(translateBack,mult(rotation,translate));
                var at4 = vec4(at[0],at[1],at[2],1);
                var newat = vec4();
                for ( var i =0; i < transform.length; i++){
                    newat[i] = dot(transform[i],at4);
                }
                at=vec3(newat[0],newat[1],newat[2]);
            }
            if(event.key=="3"){
                if(currentFloor == 4){
                    eye = add(eye,vec3(0,-1.4,0));
                    at = add(at, vec3(0,-1.4,0));
                    currentFloor = 3;
                }
            }
            if(event.key=="4"){
                if(currentFloor == 3){
                    eye = add(eye,vec3(0,1.4,0));
                    at = add(at, vec3(0,1.4,0));
                    currentFloor = 4;
                }
            }
            render();
        }
        eye = vec3(-22.5868, 0.7486, -1.0166);
        at = vec3(-22.6714, 0.7486, 8.9332);

        canvas.addEventListener("mousedown", function(event){
          var x = 2*event.clientX/canvas.width-1;
          var y = 2*(canvas.height-event.clientY)/canvas.height-1;
          console.log(x,y)

          tracking = true;
          changeRot(x, y);
        });


        canvas.addEventListener("mouseup", function(event){
          var x = 2*event.clientX/canvas.width-1;
          var y = 2*(canvas.height-event.clientY)/canvas.height-1;
          tracking = false;
        });

        render();
    };

    var render = function() {

        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if(moved) {
          axis = normalize(axis);
          var c = Math.cos(angle/2.0);
          var s = Math.sin(angle/2.0);

          modelViewMatrix = LookAt1(eye, at , up);
          projectionMatrix = Perspective1(left, right, bottom, ytop, near, far);

          gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
          gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
          gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );
          gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );

          gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);

          gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
          gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

        }else{

          modelViewMatrix = LookAt1(eye, at , up);
          projectionMatrix = Perspective1(left, right, bottom, ytop, near, far);

          gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
          gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct) );
          gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct) );
          gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition) );

          gl.uniform1f(gl.getUniformLocation(program, "shininess"),materialShininess);

          gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
          gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

        }
        var start = 0;
        for (var i =0; i < groupData.length; i++){
            if (["2_Floor","3_Floor"].indexOf(groupData[i]["name"]) !== -1) {
                gl.activeTexture( gl.TEXTURE0 );
                gl.bindTexture( gl.TEXTURE_2D, texture );
                gl.uniform1i(gl.getUniformLocation( program, "texture"), 0);
            } else {
                gl.activeTexture( gl.TEXTURE0 );
                gl.bindTexture( gl.TEXTURE_2D, texture1 );
                gl.uniform1i(gl.getUniformLocation( program, "texture"), 0);
            }
            var end = start + groupData[i]["vertices"].length;
            gl.drawArrays( gl.TRIANGLES, 0, end);
            start = end ;
        }
    }

    function attachTexture(){
        texture1 = gl.createTexture();
        gl.activeTexture( gl.TEXTURE1 );
        gl.bindTexture( gl.TEXTURE_2D, texture1 );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image2 );
        gl.generateMipmap( gl.TEXTURE_2D );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

        texture = gl.createTexture();
        gl.activeTexture( gl.TEXTURE0 );
        gl.bindTexture( gl.TEXTURE_2D, texture );
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1 );
        gl.generateMipmap( gl.TEXTURE_2D );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    }

    function multq( a,  b){
       // vec4(a.x*b.x - dot(a.yzw, b.yzw), a.x*b.yzw+b.x*a.yzw+cross(b.yzw, a.yzw))
       var s = vec3(a[1], a[2], a[3]);
       var t = vec3(b[1], b[2], b[3]);
       return(vec4(a[0]*b[0] - dot(s,t), add(cross(t, s), add(scale(a[0],t), scale(b[0],s)))));
    }

    var changeRot = function(x, y){
      if(tracking == true){
        if (x > 0.5 ){
          theta += 5;
          theta = radians(theta);
          var rotation = mat4(
              vec4(Math.cos(theta), 0, -Math.sin(theta),0),
              vec4(0,1,0,0),
              vec4(Math.sin(theta), 0, Math.cos(theta),0),
              vec4(0,0,0,1)
            );
            var translate = mat4(
              vec4(1,0,0,-eye[0]),
              vec4(0,1,0,-eye[1]),
              vec4(0,0,1,-eye[2]),
              vec4(0,0,0,1)
            );
            var translateBack = mat4(
              vec4(1,0,0,eye[0]),
              vec4(0,1,0,eye[1]),
              vec4(0,0,1,eye[2]),
              vec4(0,0,0,1)
            );
            var transform = mult(translateBack,mult(rotation,translate));
            var at4 = vec4(at[0],at[1],at[2],1);
            var newat = vec4();
            for ( var i =0; i < transform.length; i++){
              newat[i] = dot(transform[i],at4);
            }
            at= vec3(newat[0],newat[1],newat[2]);
            render();
          }
          if (x < -0.5 ){
            theta += 5;
            theta = radians(theta);
            var rotation = mat4(
                vec4(Math.cos(theta), 0, Math.sin(theta),0),
                vec4(0,1,0,0),
                vec4(-Math.sin(theta), 0, Math.cos(theta),0),
                vec4(0,0,0,1)
              );
              var translate = mat4(
                vec4(1,0,0,-eye[0]),
                vec4(0,1,0,-eye[1]),
                vec4(0,0,1,-eye[2]),
                vec4(0,0,0,1)
              );
              var translateBack = mat4(
                vec4(1,0,0,eye[0]),
                vec4(0,1,0,eye[1]),
                vec4(0,0,1,eye[2]),
                vec4(0,0,0,1)
              );
              var transform = mult(translateBack,mult(rotation,translate));
              var at4 = vec4(at[0],at[1],at[2],1);
              var newat = vec4();
              for ( var i =0; i < transform.length; i++){
                newat[i] = dot(transform[i],at4);
              }
              at= vec3(newat[0],newat[1],newat[2]);
              render();
            }
            if (x > -0.5 && x < 0.5 ){
              var eyeDir = subtract(at,eye);

              eyeDir = scale(0.2,normalize(eyeDir));
              eye = add(eye,vec3(eyeDir[0],0,eyeDir[2]));

              at = add(at,vec3(eyeDir[0],0,eyeDir[2]));
              lightPosition = at;
                render();
              }
        }else{
          return;
        }
    }

    function LookAt1(eye,at,up){
        var v = normalize( subtract(at, eye) );  // view direction vector
        var n = normalize( cross(v, up) );       // perpendicular vector
        var u = normalize( cross(n, v) );        // "new" up vector

        v = negate( v );
        var result = mat4(
            vec4( n, -dot(n, eye) ),
            vec4( u, -dot(u, eye) ),
            vec4( v, -dot(v, eye) ),
            vec4()
        );
        return result;
    }

    function Perspective1(left,right,bottom,top,near,far){

        if ( left == right ) { throw "ortho(): left and right are equal"; }
        if ( bottom == top ) { throw "ortho(): bottom and top are equal"; }
        if ( near == far )   { throw "ortho(): near and far are equal"; }

        var w = right - left;
        var h = top - bottom;
        var d = far - near;

        var a = mat4();
        a[0][0] = 2*near/w;
        a[1][1] = 2*near/h;
        a[2][2] = 1;
        a[3][3] = 1;

        var b = mat4();
        b[0][0] = 1;
        b[1][1] = 1;
        b[2][2] = (near+far)/d;
        b[3][2] = -1;
        b[2][3] = (2*near*far)/d;

        return mult(a,b);
    }

    function loadMeshDataTriangle(string) {
        var lines = string.split("\n");
        var positions = [];
        var normals = [];
        var vertices = [];
        verts = [];
        var activeGroup = "";
        var groupNo = 0;
        var f = 0;

        for ( var i = 0 ; i < lines.length ; i++ ) {
            var parts = lines[i].trimRight().split(' ');
            if ( parts.length > 0 ) {
                switch(parts[0]) {
                    case 'v':
                        var temp = vec3(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                        positions.push(temp);
                        verts.push(temp);
                        break;
                    case 'vn':
                        var temp = vec3(parseFloat(parts[1]), parseFloat(parts[2]), parseFloat(parts[3]));
                        normals.push(temp);
                        break;
                    case "g":
                        activeGroup = parts[1];
                        groupNo +=1;
                        groupData.push({"name":activeGroup,vertices:[]});
                        break;
                    case 'f': {
                        if (parts.length==4){
                            var f1 = parts[1].split('/');
                            var f2 = parts[2].split('/');
                            var f3 = parts[3].split('/');
                            var t1 = subtract(positions[+f1[0] - 1], positions[+f2[0] - 1]);
                            var t2 = subtract(positions[+f3[0] - 1], positions[+f2[0] - 1]);
                            var normal = cross(t2,t1);
                            normal = vec3(normal);
                            normal = normalize(normal);
                            vertices.push(positions[+f1[0] - 1]);
                            groupData[groupNo-1]["vertices"].push(positions[+f1[0] - 1]);
                            normalsArray.push(normal);
                            texCoordsArray.push(texCoord[0]);
                            colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));
                            vertices.push(positions[+f2[0] - 1]);
                            groupData[groupNo-1]["vertices"].push(positions[+f2[0] - 1]);
                            texCoordsArray.push(texCoord[1]);
                            normalsArray.push(normal);
                            colorsArray.push(vec4(1.0, 0.0, 0.0, 1.0 ));
                            vertices.push(positions[+f3[0] - 1]);
                            groupData[groupNo-1]["vertices"].push(positions[+f3[0] - 1]);
                            normalsArray.push(normal);
                            texCoordsArray.push(texCoord[2]);
                            colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));
                        } else if (parts.length==5){
                            var f1 = parts[1].split('/');
                            var f2 = parts[2].split('/');
                            var f3 = parts[3].split('/');
                            var f4 = parts[4].split('/');
                            var t1 = subtract(positions[+f1[0] - 1], positions[+f2[0] - 1]);
                            var t2 = subtract(positions[+f3[0] - 1], positions[+f2[0] - 1]);
                            var normal = cross(t2,t1);
                            normal = vec3(normal);
                            normal = normalize(normal);
                            vertices.push(positions[+f1[0] - 1]);
                            groupData[groupNo-1]["vertices"].push(positions[+f1[0] - 1]);
                            normalsArray.push(normal);
                            texCoordsArray.push(texCoord[0]);
                            colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));
                            vertices.push(positions[+f2[0] - 1]);
                            groupData[groupNo-1]["vertices"].push(positions[+f2[0] - 1]);
                            texCoordsArray.push(texCoord[1]);
                            normalsArray.push(normal);
                            colorsArray.push(vec4(1.0, 0.0, 0.0, 1.0 ));
                            vertices.push(positions[+f3[0] - 1]);
                            groupData[groupNo-1]["vertices"].push(positions[+f3[0] - 1]);
                            normalsArray.push(normal);
                            texCoordsArray.push(texCoord[2]);
                            colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));


                            vertices.push(positions[+f1[0] - 1]);
                            groupData[groupNo-1]["vertices"].push(positions[+f1[0] - 1]);
                            normalsArray.push(normal);
                            texCoordsArray.push(texCoord[0]);
                            colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));
                            vertices.push(positions[+f3[0] - 1]);
                            groupData[groupNo-1]["vertices"].push(positions[+f3[0] - 1]);
                            texCoordsArray.push(texCoord[2]);
                            normalsArray.push(normal);
                            colorsArray.push(vec4(1.0, 0.0, 0.0, 1.0 ));
                            vertices.push(positions[+f4[0] - 1]);
                            groupData[groupNo-1]["vertices"].push(positions[+f4[0] - 1]);
                            normalsArray.push(normal);
                            texCoordsArray.push(texCoord[3]);
                            colorsArray.push(vec4( 1.0, 0.0, 0.0, 1.0 ));
                        }
                        f++;
                        break;
                    }
                }
            }
        }
        var xExtent = d3.extent(verts,function(d){return d[0]});
        var xScale = d3.scaleLinear().domain(xExtent).range([-25,25]);
        var yExtent = d3.extent(verts,function(d){return d[1]});
        var zExtent = d3.extent(verts,function(d){return d[2]});
        vertices.forEach(function(vertex){
            var yS = 3;
            var xS = 1;
            var zS = 1;
            if (vertex !== undefined) {
                var xNormalized = xScale(vertex[0]);
                var yNormalized = ((vertex[1] - yExtent[0]) / (yExtent[1] - yExtent[0])) * yS - yS/2;
                var zNormalized = xScale(vertex[2]);
                var normalVert = vec4(xNormalized, yNormalized , zNormalized,1.0);
                pointsArray.push(normalVert);
            }
        });
        var groupVertCount = 1;
        var vertexCount = vertices.length / 6;
    }
}
