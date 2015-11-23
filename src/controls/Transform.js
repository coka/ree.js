/**
 * @author arodic / https://github.com/arodic
 */

(function() {

  'use strict';

  // shared variables

  var scale;
  var snapRadian;

  var tempVector = new THREE.Vector3();
  var tempQuaternion = new THREE.Quaternion();
  var tempMatrix = new THREE.Matrix4();

  var unitX = new THREE.Vector3(1, 0, 0);
  var unitY = new THREE.Vector3(0, 1, 0);
  var unitZ = new THREE.Vector3(0, 0, 1);
  var unit0 = new THREE.Vector3(0, 0, 0);

  var intersect;
  var ray = new THREE.Raycaster();

  REE.TransformControl = function(parameters) {

    // TODO: Make non-uniform scale and rotate play nice in hierarchies

    REE.Control.call(this, parameters);

    var scope = this;

    this.registerProperties({
      target: {
        type: THREE.Object3D,
        notify: true
      },
      mode: {
        value: 'translate',
        observer: 'modeChanged',
      },
      size: {
        value: 1,
        type: Number,
        notify: true
      },
      axis: {
        value: '',
        type: String,
        observer: 'axisChanged',
        notify: true
      },
      space: {
        value: 'local',
        type: String,
        notify: true
      }
    });

    this.helper.visible = false;
    this.plane.update = this.updatePlane.bind(this);

    this.gnomon = new THREE.Object3D();
    this.helper.add(this.gnomon);
    this.helper.update = function(camera) {
      this.updateTransform(camera);
      this.updateVisibility();
    }.bind(this);

    this.handles = new THREE.Object3D();
    this.pickers = new THREE.Object3D();
    this.gnomon.add(this.handles);
    this.gnomon.add(this.pickers);

    this._handleModes = {
      translate: this.makeGizmoTranslate(),
      rotate: this.makeGizmoRotate(),
      scale: this.makeGizmoScale()
    };

    this._pickerModes = {
      translate: this.makePickerTranslate(),
      rotate: this.makePickerRotate(),
      scale: this.makePickerScale()
    };

    // transformations

    this.position = new THREE.Vector3();
    this.scale  = new THREE.Vector3();
    this.quaternion  = new THREE.Quaternion();
    this.eye = new THREE.Vector3();
    this.alignVector = new THREE.Vector3();

    ///

    this.addEventListener('selection.selection-changed', this.setTargetFromSelection.bind(this));

    this.setTargetFromSelection();

    // internal variables

    var point;

    var worldMatrixStart = new THREE.Matrix4();
    var worldMatrixRotationStart = new THREE.Matrix4();
    var worldPositionStart = new THREE.Vector3();

    var worldPoint = new THREE.Vector3();
    var worldPointStart = new THREE.Vector3();
    var worldShift = new THREE.Vector3();
    var worldCross = new THREE.Vector3();
    var worldQuaternion = new THREE.Quaternion();
    var localPoint = new THREE.Vector3();
    var localPointStart = new THREE.Vector3();
    var localShift = new THREE.Vector3();
    var localCross = new THREE.Vector3();
    var localQuaternion = new THREE.Quaternion();
    var localScale = new THREE.Vector3();

    var tempMatrix = new THREE.Matrix4();
    var tempVector = new THREE.Vector3();

    // hepler functions

    function selectionTransformInit() {

      var objects = scope.selection.objects;

      for (var i = 0; i < objects.length; i++) {

        if (!objects[i].hasOwnProperty('_positionStart')) {
          Object.defineProperties(objects[i], {
            '_positionStart': {
              value: new THREE.Vector3()
            },
            '_quaternionStart': {
              value: new THREE.Quaternion()
            },
            '_scaleStart': {
              value: new THREE.Vector3()
            }
          });
        }

        objects[i]._positionStart.copy(objects[i].position);
        objects[i]._quaternionStart.copy(objects[i].quaternion);
        objects[i]._scaleStart.copy(objects[i].scale);

      }

    }

    function selectionTranslate(snap) {

      var objects = scope.selection.objects;
      var axis = scope.axis;
      var space = scope.space;

      for (var i = 0; i < objects.length; i++) {

        if (space === 'local') {
          objects[i].position.copy(localShift).applyQuaternion(objects[i]._quaternionStart);
        } else {
          objects[i].position.copy(worldShift);
        }

        objects[i].position.add(objects[i]._positionStart);

        if (snap && scope.snapDistance) {

          if (space === 'local') {

            objects[i].position.applyQuaternion(tempQuaternion.copy(objects[i]._quaternionStart).inverse());

            if (axis.search('X') !== -1) {
              objects[i].position.x = Math.round(objects[i].position.x / scope.snapDistance) * scope.snapDistance;
            }

            if (axis.search('Y') !== -1) {
              objects[i].position.y = Math.round(objects[i].position.y / scope.snapDistance) * scope.snapDistance;
            }

            if (axis.search('Z') !== -1) {
              objects[i].position.z = Math.round(objects[i].position.z / scope.snapDistance) * scope.snapDistance;
            }

            objects[i].position.applyQuaternion(objects[i]._quaternionStart);

          }

          if (space === 'world') {

            if (objects[i].parent) {
              objects[i].position.add(tempVector.setFromMatrixPosition(objects[i].parent.matrixWorld));
            }

            if (axis.search('X') !== -1) {
              objects[i].position.x = Math.round(objects[i].position.x / scope.snapDistance) * scope.snapDistance;
            }

            if (axis.search('Y') !== -1) {
              objects[i].position.y = Math.round(objects[i].position.y / scope.snapDistance) * scope.snapDistance;
            }

            if (axis.search('Z') !== -1) {
              objects[i].position.z = Math.round(objects[i].position.z / scope.snapDistance) * scope.snapDistance;
            }

            if (objects[i].parent) {
              objects[i].position.sub(tempVector.setFromMatrixPosition(objects[i].parent.matrixWorld));
            }

          }

        }

      }

    }

    function selectionScale() {

      var objects = scope.selection.objects;
      for (var i = 0; i < objects.length; i++) {
        objects[i].scale.copy(objects[i]._scaleStart).multiply(localScale);
      }

    }

    function selectionRotate(snap) {

      var objects = scope.selection.objects;
      var axis = scope.axis;
      var space = scope.space;

      if (axis === 'E' ||  axis === 'XYZE') {
        space = 'world';
      }

      for (var i = 0; i < objects.length; i++) {

        if (space === 'local') {
          objects[i].quaternion.copy(objects[i]._quaternionStart);
          objects[i].quaternion.multiply(localQuaternion);
        } else {
          objects[i].quaternion.copy(worldQuaternion);
          objects[i].quaternion.multiply(objects[i]._quaternionStart);
        }

        if (snap && scope.snapAngle) {
          snapRadian = scope.snapAngle / 180 * Math.PI;
          // TODO: implement rotation snap
        }

      }

    }

    function transformStart(point) {

      if (!point) {
        return;
      }

      selectionTransformInit();

      scope.target.updateMatrixWorld();

      worldMatrixStart = scope.target.matrixWorld.clone();
      worldMatrixRotationStart.extractRotation(worldMatrixStart);
      worldPositionStart.setFromMatrixPosition(worldMatrixStart);

      worldPointStart.copy(point).sub(worldPositionStart);
      localPointStart.copy(worldPointStart);

      localPointStart.applyMatrix4(tempMatrix.getInverse(worldMatrixRotationStart));

      scope.dispatchEvent({type: 'transformstart'});

    }

    function transform(point, snap, offset) {

      if (!point) {
        return;
      }

      var axis = scope.axis;
      var direction;

      worldPoint.copy(point).sub(worldPositionStart);
      worldShift.subVectors(worldPoint, worldPointStart);

      localPoint.copy(worldPoint);
      localPoint.applyMatrix4(tempMatrix.getInverse(worldMatrixRotationStart));
      localShift.subVectors(localPoint, localPointStart);
      worldCross.copy(worldPoint).cross(worldPointStart);
      localCross.copy(localPoint).cross(localPointStart);

      if (scope.mode === 'translate') {

        if (axis.search('X') === -1) {
          worldShift.x = 0;
          localShift.x = 0;
        }
        if (axis.search('Y') === -1) {
          worldShift.y = 0;
          localShift.y = 0;
        }
        if (axis.search('Z') === -1) {
          worldShift.z = 0;
          localShift.z = 0;
        }

        selectionTranslate(snap);

      } else if (scope.mode === 'scale') {

        if (axis === 'XYZ') {

          localScale.set(worldShift.y / 50, worldShift.y / 50, worldShift.y / 50).addScalar(1);

        } else {

          localScale.set(
            axis === 'X' ? localShift.x / 50 : 0,
            axis === 'Y' ? localShift.y / 50 : 0,
            axis === 'Z' ? localShift.z / 50 : 0
          ).addScalar(1);

        }

        selectionScale();

      } else if (scope.mode === 'rotate') {

        if (axis === 'E') {

          localCross.applyMatrix4(worldMatrixRotationStart).normalize();
          direction = localCross.dot(scope.eye) < 0 ? 1 : -1;
          worldQuaternion.setFromAxisAngle(scope.eye, localPoint.angleTo(localPointStart) * direction);

        } else if (axis === 'XYZE') {

          tempVector.copy(worldShift).cross(scope.eye).normalize();
          worldQuaternion.setFromAxisAngle(tempVector, -2 * offset.length());

        } else {

          if (axis === 'X') {

            localQuaternion.setFromAxisAngle(unitX, localPoint.angleTo(localPointStart) * (localCross.x > 0 ? -1 : 1));
            worldQuaternion.setFromAxisAngle(unitX, worldPoint.angleTo(worldPointStart) * (worldCross.x > 0 ? -1 : 1));

          } else if (axis === 'Y') {

            localQuaternion.setFromAxisAngle(unitY, localPoint.angleTo(localPointStart) * (localCross.y > 0 ? -1 : 1));
            worldQuaternion.setFromAxisAngle(unitY, worldPoint.angleTo(worldPointStart) * (worldCross.y > 0 ? -1 : 1));

          } else if (axis === 'Z') {

            localQuaternion.setFromAxisAngle(unitZ, localPoint.angleTo(localPointStart) * (localCross.z > 0 ? -1 : 1));
            worldQuaternion.setFromAxisAngle(unitZ, worldPoint.angleTo(worldPointStart) * (worldCross.z > 0 ? -1 : 1));

          }

        }

        selectionRotate(snap);

      }

      scope.dispatchEvent({type: 'transform'});
      scope.dispatchEvent({type: 'render', bubble: true});

    }

    function transformEnd() {

      scope.selection.update();

      scope.dispatchEvent({type: 'transformend'});
      scope.dispatchEvent({type: 'render', renderAll: true, bubble: true});

    }

    // event handlers

    this.onHover = function(event, pointers) {

      this.setAxis(pointers[0]);
      this.plane.position.copy(this.gnomon.position);
      // this.plane.updateMatrixWorld();

    };

    this.onTrackstart = function(event, pointers) {

      if (!this.target) {
        return;
      }

      this.setAxis(pointers[0]);
      point = this.getPointOnPlane(pointers[0].position);

      this.active = this.axis !== '';

      transformStart(point, event.shiftKey);

    };

    this.onTrack = function(event, pointers) {

      if (!this.target) {
        return;
      }

      point = this.getPointOnPlane(pointers[0].position);

      var offset = pointers[0].offset;

      if (point && this.active) {
        transform(point, event.shiftKey, offset);
      }

    };

    this.onTrackend = function() {

      transformEnd();

      this.axis = '';
      this.active = false;

    };

    this.onKeyup = function(event, key) {

      switch (key) {

        case 87:
          this.mode = 'translate';
          break;

        case 69:
          this.mode = 'rotate';
          break;

        case 82:
          this.mode = 'scale';
          break;

        case 81:
          this.space = this.space === 'local' ? 'world' : 'local';
          break;

      }

      if (this.mode === 'scale') {
        this.space = 'local';
      }

    };

  };

  REE.TransformControl.prototype = Object.create(REE.Control.prototype);
  REE.TransformControl.prototype.constructor = REE.TransformControl;

  REE.TransformControl.prototype.updateTransform = function(camera) {

    if (!this.target) {

      return;

    }

    camera = camera || this.camera;

    camera.updateMatrixWorld();

    this.target.updateMatrixWorld();

    this.position.setFromMatrixPosition(this.target.matrixWorld);
    this.scale.setFromMatrixScale(this.target.matrixWorld);
    this.quaternion.set(0, 0, 0, 1);

    if (this.space === 'local') {
      tempMatrix.extractRotation(this.target.matrixWorld);
      this.quaternion.setFromRotationMatrix(tempMatrix);
    }

    if (camera instanceof THREE.OrthographicCamera) {
      scale = (camera.top - camera.bottom) / 3 * this.size;
      this.eye.copy(unitZ).applyMatrix4(tempMatrix.extractRotation(camera.matrixWorld)).normalize();
    } else {
      tempVector.setFromMatrixPosition(camera.matrixWorld).sub(this.position);
      scale = tempVector.length() / 6 * this.size;
      this.eye.copy(tempVector).normalize();
    }

    this.gnomon.position.copy(this.position);
    this.gnomon.scale.set(scale, scale, scale);

    // TODO: check math
    this.alignVector.copy(this.eye).applyQuaternion(tempQuaternion.copy(this.quaternion).inverse());

    this.gnomon.traverse(function(child) {

      if (child.name.search('E') !== -1) {
        tempMatrix.lookAt(this.eye, unit0, unitY);
        child.quaternion.setFromRotationMatrix(tempMatrix);
      } else if (child.name !== '') {
        child.quaternion.copy(this.quaternion);
      }

      if (this.mode === 'rotate') {

        if (child.name === 'X') {
          tempQuaternion.setFromAxisAngle(unitX, Math.atan2(-this.alignVector.y, this.alignVector.z));
          tempQuaternion.multiplyQuaternions(this.quaternion, tempQuaternion);
          child.quaternion.copy(tempQuaternion);
        }

        if (child.name === 'Y') {
          tempQuaternion.setFromAxisAngle(unitY, Math.atan2(this.alignVector.x, this.alignVector.z));
          tempQuaternion.multiplyQuaternions(this.quaternion, tempQuaternion);
          child.quaternion.copy(tempQuaternion);
        }

        if (child.name === 'Z') {
          tempQuaternion.setFromAxisAngle(unitZ, Math.atan2(this.alignVector.y, this.alignVector.x));
          tempQuaternion.multiplyQuaternions(this.quaternion, tempQuaternion);
          child.quaternion.copy(tempQuaternion);
        }

      }

    }.bind(this));

    this.gnomon.updateMatrixWorld();

  };

  REE.TransformControl.prototype.updateVisibility = function() {

    if (!this.target || !this.enabled) {
      this.helper.visible = false;
      return;
    }

    this.helper.visible = true;

    this.gnomon.traverse(function(child) {

      child.visible = true;

      // hide aligned to camera

      if (this.mode === 'translate' || this.mode === 'scale') {

        if (Math.abs(this.alignVector.x) > 0.99) {
          if (child.name === 'X' || child.name === 'XY' || child.name === 'XZ') {
            child.visible = false;
          }
        } else if (Math.abs(this.alignVector.y) > 0.99) {
          if (child.name === 'Y' || child.name === 'XY' || child.name === 'YZ') {
            child.visible = false;
          }
        } else if (Math.abs(this.alignVector.z) > 0.99) {
          if (child.name === 'Z' || child.name === 'XZ' || child.name === 'YZ') {
            child.visible = false;
          }
        }

      } else if (this.mode === 'rotate') {

        if (Math.abs(this.alignVector.x) < 0.1) {
          if (child.name === 'X') {
            child.visible = false;
          }
        }

        if (Math.abs(this.alignVector.y) < 0.1) {
          if (child.name === 'Y') {
            child.visible = false;
          }
        }

        if (Math.abs(this.alignVector.z) < 0.1) {
          if (child.name === 'Z') {
            child.visible = false;
          }
        }

      }

    }.bind(this));

  };

  REE.TransformControl.prototype.updatePlane = function(camera) {

    if (!camera || this.axis === '') {
      return;
    }

    switch (this.axis) {
      case 'X':
        this.plane.lookAt(unitX);
        break;

      case 'Y':
        this.plane.lookAt(unitY);
        break;

      case 'Z':
        this.plane.lookAt(unitZ);
        break;

      case 'XY':
        this.plane.lookAt(unitZ);
        break;

      case 'YZ':
        this.plane.lookAt(unitX);
        break;

      case 'XZ':
        this.plane.lookAt(unitY);
        break;

      case 'XYZ':
        this.plane.lookAt(this.eye);
        break;
    }

    if (this.mode === 'translate' || this.mode === 'scale') {

      if (this.axis === 'X') {
        this.plane.lookAt(unitY);
        if (Math.abs(this.alignVector.z) > Math.abs(this.alignVector.y)) {
          this.plane.lookAt(unitZ);
        }
      }

      if (this.axis === 'Y') {
        this.plane.lookAt(unitZ);
        if (Math.abs(this.alignVector.x) > Math.abs(this.alignVector.z)) {
          this.plane.lookAt(unitX);
        }
      }

      if (this.axis === 'Z') {
        this.plane.lookAt(unitY);
        if (Math.abs(this.alignVector.x) > Math.abs(this.alignVector.y)) {
          this.plane.lookAt(unitX);
        }
      }

    }

    if (this.axis === 'E' || this.mode === 'rotate') {
      this.plane.lookAt(this.eye);
    } else if (this.space === 'local') {
      tempQuaternion.copy(this.plane.quaternion);
      this.plane.quaternion.copy(this.quaternion).multiply(tempQuaternion);
    }

    this.plane.updateMatrixWorld();
  };

  REE.TransformControl.prototype.axisChanged = function() {

    this.handles.traverse(function(child) {

      if (child.material) {

        child.material.oldColor = child.material.oldColor || child.material.color.clone();
        child.material.oldOpacity = child.material.oldOpacity || child.material.opacity;

        if (child.name === this.axis) {
          child.material.color.setRGB(1, 1, 0);
          child.material.opacity = 1;
        } else {
          child.material.color.copy(child.material.oldColor);
          child.material.opacity = child.material.oldOpacity;
        }

      }

    }.bind(this));

  };

  REE.TransformControl.prototype.modeChanged = function() {

    for (var i = this.gnomon.children.length; i--;) {
      this.gnomon.remove(this.gnomon.children[i]);
    }

    if (!this.mode) {
      return;
    }

    this.handles = this._handleModes[this.mode];
    this.pickers = this._pickerModes[this.mode];

    this.gnomon.add(this.handles);
    this.gnomon.add(this.pickers);

    this.dispatchEvent({type: 'render', renderAll: true, bubble: true});

  };

  REE.TransformControl.prototype.setAxis = function(pointer) {

    this.helper.update(this.camera);

    ray.setFromCamera(pointer.position, this.camera);
    intersect = ray.intersectObjects([this.pickers], true)[0];

    if (intersect && intersect.object.name) {
      if (intersect.object.name !== this.axis) {
        this.axis = intersect.object.name;
      }
    } else {
      this.axis = '';
    }

    this.dispatchEvent({type: 'render', bubble: true});

  };

  REE.TransformControl.prototype.setTargetFromSelection = function() {

    if (this.selection.objects.length) {
      this.target = this.selection.objects[this.selection.objects.length - 1];
    } else {
      this.target = undefined;
    }

  };

}());
