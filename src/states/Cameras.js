/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  'use strict';

  var cameras = {
    persp: new THREE.PerspectiveCamera(30, 1, 0.1, 10000),
    top: new THREE.OrthographicCamera(25, -25, 25, -25, -1000, 1000),
    bottom: new THREE.OrthographicCamera(25, -25, 25, -25, -1000, 1000),
    front: new THREE.OrthographicCamera(25, -25, 25, -25, -1000, 1000),
    back: new THREE.OrthographicCamera(25, -25, 25, -25, -1000, 1000),
    left: new THREE.OrthographicCamera(25, -25, 25, -25, -1000, 1000),
    right: new THREE.OrthographicCamera(25, -25, 25, -25, -1000, 1000)
  };

  cameras.persp.position.set(300, 300, 300);
  cameras.persp.lookAt(new THREE.Vector3());
  cameras.top.rotation.set(-Math.PI / 2, 0, -Math.PI / 2);
  cameras.top.position.set(0, 100, 0);
  cameras.bottom.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  cameras.bottom.position.set(0, -100, 0);
  cameras.front.position.set(0, 0, 100);
  cameras.back.rotation.set(0, Math.PI, 0);
  cameras.back.position.set(0, 0, -100);
  cameras.left.rotation.set(0, Math.PI / 2, 0);
  cameras.left.position.set(100, 0, 0);
  cameras.right.rotation.set(0, -Math.PI / 2, 0);
  cameras.right.position.set(-100, 0, 0);

  for (var i = 0; i < cameras.length; i++) {
    cameras[i]._target = new THREE.Vector3();
  }

  var options = [
    {label: 'persp', value: cameras.persp},
    {label: 'top', value: cameras.top},
    {label: 'bottom', value: cameras.bottom},
    {label: 'front', value: cameras.front},
    {label: 'back', value: cameras.back},
    {label: 'left', value: cameras.left},
    {label: 'right', value: cameras.right}
  ];

  REE.CamerasState = function(config) {

    REE.Element.call(this, config);

    this.registerProperties({
      persp: {
        value: cameras.persp,
        type: THREE.Camera
      },
      top: {
        value: cameras.top,
        type: THREE.Camera
      },
      bottom: {
        value: cameras.bottom,
        type: THREE.Camera
      },
      front: {
        value: cameras.front,
        type: THREE.Camera
      },
      back: {
        value: cameras.back,
        type: THREE.Camera
      },
      right: {
        value: cameras.right,
        type: THREE.Camera
      },
      left: {
        value: cameras.left,
        type: THREE.Camera
      },
      options: {
        value: options,
        type: Array
      }
    });

  };

  REE.CamerasState.prototype = Object.create(REE.Element.prototype);
  REE.CamerasState.prototype.constructor = REE.CamerasState;

  REE.CamerasState.prototype.update = function() {};

}());
