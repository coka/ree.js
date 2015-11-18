/**
 * @author arodic / https://github.com/arodic
 */

(function() {

  'use strict';

  // shared materials

  var gizmoMaterial = new THREE.MeshBasicMaterial();
  gizmoMaterial.depthTest = false;
  gizmoMaterial.depthWrite = false;
  gizmoMaterial.transparent = true;
  gizmoMaterial.side = THREE.FrontSide;

  var gizmoLineMaterial = new THREE.LineBasicMaterial();
  gizmoLineMaterial.depthTest = false;
  gizmoLineMaterial.depthWrite = false;
  gizmoLineMaterial.transparent = true;

  var materialInvisible = gizmoMaterial.clone();
  materialInvisible.visible = false;
  materialInvisible.transparent = false;
  materialInvisible.opacity = 0.5;

  var matRed = gizmoMaterial.clone();
  matRed.color.set(0xff0000);

  var matGreen = gizmoMaterial.clone();
  matGreen.color.set(0x00ff00);

  var materialBlue = gizmoMaterial.clone();
  materialBlue.color.set(0x0000ff);

  var matWhiteTransperent = gizmoMaterial.clone();
  matWhiteTransperent.opacity = 0.25;

  var matYellowTransparent = matWhiteTransperent.clone();
  matYellowTransparent.color.set(0xffff00);

  var matCyanTransparent = matWhiteTransperent.clone();
  matCyanTransparent.color.set(0x00ffff);

  var matMagentaTransparent = matWhiteTransperent.clone();
  matMagentaTransparent.color.set(0xff00ff);

  var matYellow = gizmoMaterial.clone();
  matYellow.color.set(0xffff00);

  var matLineRed = gizmoLineMaterial.clone();
  matLineRed.color.set(0xff0000);

  var matLineGreen = gizmoLineMaterial.clone();
  matLineGreen.color.set(0x00ff00);

  var matLineBlue = gizmoLineMaterial.clone();
  matLineBlue.color.set(0x0000ff);

  var matLineYellow = gizmoLineMaterial.clone();
  matLineYellow.color.set(0xffff00);

  var matLineGray = gizmoLineMaterial.clone();
  matLineGray.color.set(0x787878);

  var matLineYellowTransparent = matLineYellow.clone();
  matLineYellowTransparent.opacity = 0.25;

  // shared objects

  var arrowGeometry = new THREE.Geometry();
  var arrowMesh = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.05, 0.2, 12, 1, false));
  arrowMesh.position.y = 0.5;
  arrowMesh.updateMatrix();
  arrowGeometry.merge(arrowMesh.geometry, arrowMesh.matrix);

  var scaleHandleGeometry = new THREE.Geometry();
  var scaleHandleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.125, 0.125));
  scaleHandleMesh.position.y = 0.5;
  scaleHandleMesh.updateMatrix();
  scaleHandleGeometry.merge(scaleHandleMesh.geometry, scaleHandleMesh.matrix);

  var lineXGeometry = new THREE.BufferGeometry();
  lineXGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0,  1, 0, 0], 3));

  var lineYGeometry = new THREE.BufferGeometry();
  lineYGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0,  0, 1, 0], 3));

  var lineZGeometry = new THREE.BufferGeometry();
  lineZGeometry.addAttribute('position', new THREE.Float32Attribute([0, 0, 0,  0, 0, 1], 3));

  var CircleGeometry = function(radius, facing, arc) {
    var geometry = new THREE.BufferGeometry();
    var vertices = [];
    arc = arc ? arc : 1;
    for (var i = 0; i <= 64 * arc; ++i) {
      if (facing === 'x') {
        vertices.push(0, Math.cos(i / 32 * Math.PI) * radius, Math.sin(i / 32 * Math.PI) * radius);
      }
      if (facing === 'y') {
        vertices.push(Math.cos(i / 32 * Math.PI) * radius, 0, Math.sin(i / 32 * Math.PI) * radius);
      }
      if (facing === 'z') {
        vertices.push(Math.sin(i / 32 * Math.PI) * radius, Math.cos(i / 32 * Math.PI) * radius, 0);
      }
    }
    geometry.addAttribute('position', new THREE.Float32Attribute(vertices, 3));
    return geometry;
  };

  // gizmos

  var handlesTranslate = {
    X: [
      [new THREE.Mesh(arrowGeometry, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
      [new THREE.Line(lineXGeometry, matLineRed)]
    ],
    Y: [
      [new THREE.Mesh(arrowGeometry, matGreen), [0, 0.5, 0]],
      [new THREE.Line(lineYGeometry, matLineGreen)]
    ],
    Z: [
      [new THREE.Mesh(arrowGeometry, materialBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
      [new THREE.Line(lineZGeometry, matLineBlue)]
    ],
    XYZ: [
      [new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), matWhiteTransperent), [0, 0, 0], [0, 0, 0]]
    ],
    XY: [
      [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.29, 0.29), matYellowTransparent), [0.15, 0.15, 0]]
    ],
    YZ: [
      [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.29, 0.29), matCyanTransparent), [0, 0.15, 0.15], [0, Math.PI / 2, 0]]
    ],
    XZ: [
      [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.29, 0.29),matMagentaTransparent), [0.15, 0, 0.15], [-Math.PI / 2, 0, 0]]
  ]
  };

  var pickersTranslate = {
    X: [
      [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), materialInvisible), [0.6, 0, 0], [0, 0, -Math.PI / 2]]
    ],
    Y: [
      [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), materialInvisible), [0, 0.6, 0]]
    ],
    Z: [
      [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), materialInvisible), [0, 0, 0.6], [Math.PI / 2, 0, 0]]
    ],
    XYZ: [
      [new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), materialInvisible)]
    ],
    XY: [
      [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), materialInvisible), [0.2, 0.2, 0]]
    ],
    YZ: [
      [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), materialInvisible), [0, 0.2, 0.2], [0, Math.PI / 2, 0]]
    ],
    XZ: [
      [new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), materialInvisible), [0.2, 0, 0.2], [-Math.PI / 2, 0, 0]]
  ]
  };

  var handlesRotate = {
    X: [
      [new THREE.Line(new CircleGeometry(1, 'x', 0.5), matLineRed)]
    ],
    Y: [
      [new THREE.Line(new CircleGeometry(1, 'y', 0.5), matLineGreen)]
    ],
    Z: [
      [new THREE.Line(new CircleGeometry(1, 'z', 0.5), matLineBlue)]
    ],
    E: [
      [new THREE.Line(new CircleGeometry(1.25, 'z', 1), matLineYellowTransparent)]
    ],
    XYZE: [
      [new THREE.Line(new CircleGeometry(1, 'z', 1), matLineGray)]
  ]
  };

  var pickersRotate = {
    X: [
      [new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 4, 12, Math.PI), materialInvisible), [0, 0, 0], [0, -Math.PI / 2, -Math.PI / 2]]
    ],
    Y: [
      [new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 4, 12, Math.PI), materialInvisible), [0, 0, 0], [Math.PI / 2, 0, 0]]
    ],
    Z: [
      [new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 4, 12, Math.PI), materialInvisible), [0, 0, 0], [0, 0, -Math.PI / 2]]
    ],
    E: [
      [new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.12, 2, 24), materialInvisible)]
    ],
    XYZE: [
      [new THREE.Mesh(new THREE.SphereGeometry(0.95, 8, 8), materialInvisible)]
  ]
  };

  var handlesScale = {
    X: [
      [new THREE.Mesh(scaleHandleGeometry, matRed), [0.5, 0, 0], [0, 0, -Math.PI / 2]],
      [new THREE.Line(lineXGeometry, matLineRed)]
    ],
    Y: [
      [new THREE.Mesh(scaleHandleGeometry, matGreen), [0, 0.5, 0]],
      [new THREE.Line(lineYGeometry, matLineGreen)]
    ],
    Z: [
      [new THREE.Mesh(scaleHandleGeometry, materialBlue), [0, 0, 0.5], [Math.PI / 2, 0, 0]],
      [new THREE.Line(lineZGeometry, matLineBlue)]
    ],
    XYZ: [
      [new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.125, 0.125), matWhiteTransperent)]
  ]
  };

  var pickersScale = {
    X: [
      [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), materialInvisible), [0.6, 0, 0], [0, 0, -Math.PI / 2]]
    ],
    Y: [
      [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), materialInvisible), [0, 0.6, 0]]
    ],
    Z: [
      [new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), materialInvisible), [0, 0, 0.6], [Math.PI / 2, 0, 0]]
    ],
    XYZ: [
      [new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), materialInvisible)]
  ]
  };

  var setupGizmos = function(gizmoMap) {

    var gizmo = new THREE.Object3D();

    for (var name in gizmoMap) {

      var group = new THREE.Object3D();
      gizmo.add(group);
      gizmo[name] = group;

      for (var i = gizmoMap[name].length; i --;) {

        var object = gizmoMap[name][i][0].clone();
        var position = gizmoMap[name][i][1];
        var rotation = gizmoMap[name][i][2];

        object.name = name;

        if (position) {
          object.position.set(position[0], position[1], position[2]);
        }
        if (rotation) {
          object.rotation.set(rotation[0], rotation[1], rotation[2]);
        }

        object.updateMatrix();

        var tempGeometry = object.geometry.clone();
        tempGeometry.applyMatrix(object.matrix);
        object.geometry = tempGeometry;

        object.position.set(0, 0, 0);
        object.rotation.set(0, 0, 0);
        object.scale.set(1, 1, 1);

        group.add(object);

      }

    }

    return gizmo;

  };

  REE.TransformControl.prototype.makeGizmoTranslate = function() {
    return setupGizmos(handlesTranslate);
  };

  REE.TransformControl.prototype.makeGizmoRotate = function() {
    return setupGizmos(handlesRotate);
  };

  REE.TransformControl.prototype.makeGizmoScale = function() {
    return setupGizmos(handlesScale);
  };

  REE.TransformControl.prototype.makePickerTranslate = function() {
    return setupGizmos(pickersTranslate);
  };

  REE.TransformControl.prototype.makePickerRotate = function() {
    return setupGizmos(pickersRotate);
  };

  REE.TransformControl.prototype.makePickerScale = function() {
    return setupGizmos(pickersScale);
  };

}());
