/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  // Element to be added to body during a drag gesturee.
  // It prevents other elements from recieving events and stopping propagaion.
  var clickmask = document.createElement('div');
  clickmask.className = 'three-control';
  clickmask.style.position = 'fixed';
  clickmask.style.top = 0;
  clickmask.style.left = 0;
  clickmask.style.bottom = 0;
  clickmask.style.right = 0;
  clickmask.style.zIndex = 10000000;
  clickmask.style.cursor = 'move';
  // clickmask.style.background = 'rgba(0,255,255,0.2)';

  var raycaster = new THREE.Raycaster();
  var intersect;

  var tempVector = new THREE.Vector3();
  var alignVector = new THREE.Vector3();
  var tempMatrix = new THREE.Matrix4();
  var unitx = new THREE.Vector3(1, 0, 0);
  var unity = new THREE.Vector3(0, 1, 0);
  var unitz = new THREE.Vector3(0, 0, 1);

  // Monostates.
  var selection = new REE.SelectionState();

  REE.Control = function(config) {

    REE.Element.call(this, config);

    Object.defineProperties(this, {
      'helper': {
        value: new THREE.Object3D(),
        writable: false,
        enumerable: true
      },
      'plane': {
        value: new REE.PlaneHelper(),
        writable: false,
        enumerable: true
      },
      '_viewports': {value: []}
    });

    this.helper.add(this.plane);
    this.helper.update = function() {};
    this.plane.update = this.updatePlane.bind(this);

    this.registerProperties({
      camera: {
        type: THREE.Camera,
        notify: true
      },
      domElement: {
        type: HTMLElement,
        notify: true // TODO: remove?
      },
      scene: {
        type: THREE.Scene
      },
      selection: {
        value: selection,
        type: REE.Selection,
        writable: false // TODO: consider making writable / non-monostate
      },
      active: {
        value: false,
        type: Boolean,
        notify: true
      },
      mode: {
        value: '',
        type: String,
        notify: true
      },
      snapDistance: {
        value: 0,
        type: Number
      },
      snapAngle: {
        value: 0,
        type: Number
      },
      enabled: {
        value: true,
        type: Boolean,
        notify: true
      }
    });

    var scope = this;
    var rect;
    var touches;
    var pointer;
    var pointers;
    var positions;
    var delta;
    var positionsStart;
    var positionsOld;
    var positionDeltas;
    var closestPointer;
    var positionOffsets;
    var preventTouchmove = false;
    var viewport;

    // helper functions

    var getPointerVector = function(x, y) {
      rect = scope.domElement.getBoundingClientRect();
      return new THREE.Vector2(
        (x - rect.left) / rect.width * 2 - 1,
        1 - (y - rect.top) / rect.height * 2
    );
    };

    var getClosestPointer = function(point, array) {
      closestPointer = array[0];
      for (var i = 1; i < array.length; i++) {
        if (array[i].distanceTo(point) < closestPointer.distanceTo(point)) {
          closestPointer = array[i];
        }
      }
      return closestPointer;
    };

    var getPointersFromEvent = function(event, reset) {

      touches = event.touches ? event.touches : [event];

      positionsOld = reset ? [] : positions || [];
      positionsStart = reset ? [] : positionsStart || [];
      positions = [];
      positionDeltas = [];
      positionOffsets = [];

      for (var i = 0; i < touches.length; i++) {

        if (touches[i].target === event.path[0] || event.touches === undefined) {

          pointer = getPointerVector(touches[i].clientX, touches[i].clientY);
          positions.push(pointer);

          if (positionsOld[positions.length - 1] === undefined) {
            positionsOld.push(pointer.clone());
          }

          if (positionsStart[positions.length - 1] === undefined) {
            positionsStart.push(pointer.clone());
          }

        }

      }

      var data = [];

      for (i = 0; i < positions.length; i++) {

        positionDeltas[i] = positions[i].clone().sub(getClosestPointer(positions[i], positionsOld));
        positionOffsets[i] = positions[i].clone().sub(getClosestPointer(positions[i], positionsStart));
        data[i] = {
          position: positions[i],
          previous: positionsOld[i], // TODO: remove
          delta: positionDeltas[i],
          offset: positionOffsets[i]
        };

      }

      return data;

    };

    function onMousedown(event) {

      if (scope.enabled === false) {
        return;
      }

      viewport = getViewport(event.path[0]);

      if (!viewport) {
        return;
      }

      scope.domElement = event.path[0];
      scope.camera = getViewport(event.path[0]).camera;

      pointers = getPointersFromEvent(event, true);

      if (typeof scope.onTrackstart === 'function') {
        scope.onTrackstart(event, pointers);
      }

      window.addEventListener('mousemove', onMousemove);
      window.addEventListener('mouseup', onMouseup);

    }

    function onMousemove(event) {

      if (scope.enabled === false) {

        window.removeEventListener('mousemove', onMousemove);
        window.removeEventListener('mouseup', onMouseup);
        if (clickmask.parentNode === document.body) {
          document.body.removeChild(clickmask);
        }
        return;
      }

      pointers = getPointersFromEvent(event);

      if (typeof scope.onTrack === 'function') {
        scope.onTrack(event, pointers);
      }

      if (clickmask.parentNode !== document.body) {
        document.body.appendChild(clickmask);
      }

    }

    function onMouseup(event) {

      window.removeEventListener('mousemove', onMousemove);
      window.removeEventListener('mouseup', onMouseup);

      if (clickmask.parentNode === document.body) {
        document.body.removeChild(clickmask);
      }

      if (scope.enabled === false) {
        return;
      }

      pointers = getPointersFromEvent(event);

      if (typeof scope.onTrackend === 'function') {
        scope.onTrackend(event, pointers);
      }

    }

    function onHover(event) {

      if (scope.enabled === false) {
        return;
      }

      viewport = getViewport(event.path[0]);

      if (!viewport) {
        return;
      }

      scope.domElement = viewport.domElement;
      scope.camera = viewport.camera;

      pointers = getPointersFromEvent(event);

      if (typeof scope.onHover === 'function') {
        scope.onHover(event, pointers);
      }

    }

    function onTouchstart(event) {

      event.preventDefault();

      event.path[0].focus();

      if (scope.enabled === false) {
        return;
      }

      viewport = getViewport(event.path[0]);

      if (!viewport) {
        return;
      }
      scope.domElement = viewport.domElement;
      scope.camera = viewport.camera;

      preventTouchmove = true;

      setTimeout(function() {
        preventTouchmove = false;
      });

      pointers = getPointersFromEvent(event, true);

      if (typeof scope.onHover === 'function') {
        scope.onHover(event, pointers);
      }

      if (typeof scope.onTrackstart === 'function') {
        scope.onTrackstart(event, pointers);
      }

      event.path[0].addEventListener('touchmove', onTouchmove);
      event.path[0].addEventListener('touchend', onTouchend);

    }

    function onTouchmove(event) {

      event.preventDefault();

      if (scope.enabled === false) {
        event.path[0].removeEventListener('touchmove', onTouchmove);
        event.path[0].removeEventListener('touchend', onTouchend);
        return;
      }

      if (preventTouchmove === true) {
        return;
      }

      pointers = getPointersFromEvent(event);

      if (typeof scope.onTrack === 'function') {
        scope.onTrack(event, pointers);
      }

      if (clickmask.parentNode !== document.body) {
        document.body.appendChild(clickmask);
      }

    }

    function onTouchend(event) {

      event.preventDefault();

      event.path[0].removeEventListener('touchmove', onTouchmove);
      event.path[0].removeEventListener('touchend', onTouchend);

      if (clickmask.parentNode === document.body) {

        document.body.removeChild(clickmask);

      }

      if (scope.enabled === false) {
        return;
      }

      if (typeof scope.onTrackend === 'function') {
        scope.onTrackend(event, pointers);
      }

    }

    function onMousewheel(event) {

      viewport = getViewport(event.path[0]);

      if (!viewport) {
        return;
      }

      event.preventDefault();

      if (scope.enabled === false) {
        return;
      }

      delta = 0;

      if (event.wheelDelta) {
        delta = -event.wheelDelta;
      } else if (event.detail) {
        delta = event.detail * 10;
      }

      if (typeof scope.onMousewheel === 'function') {
        scope.onMousewheel(event, delta);
      }

    }

    function onKeydown(event) {

      viewport = getViewport(event.path[0]);

      if (!viewport) {
        return;
      }

      if (scope.enabled === false) {
        return;
      }

      if (event.which === 8) {
        event.preventDefault();
      }

      if (typeof scope.onKeydown === 'function') {
        scope.onKeydown(event, event.which);
      }

    }

    function onKeyup(event) {

      viewport = getViewport(event.path[0]);

      if (!viewport) {
        return;
      }

      if (scope.enabled === false) {
        return;
      }

      if (typeof scope.onKeyup === 'function') {
        scope.onKeyup(event, event.which);
      }

      if (event.which === 27) {
        scope.cancel();
      }

    }

    function onContextmenu(event) {

      viewport = getViewport(event.path[0]);

      if (!viewport) {
        return;
      }

      event.preventDefault();

      if (scope.enabled === false) {
        return;
      }

      if (typeof scope.onContextmenu === 'function') {
        scope.onContextmenu(event);
      }

    }

    function getViewport(domElement) {

      return scope._viewports.find(function(e) {
        return e.domElement === domElement;
      });

    }

    // this.onKeyup = function(event, key) {console.log('onKeyup'); };
    // this.onKeydown = function(event, key) {console.log('onKeydown'); };
    // this.onContextmenu = function(event, pointers) {console.log('onContextmenu'); };
    // this.onTrackstart = function(event, pointers) {console.log('onTrackstart'); };
    // this.onMousewheel = function(event, delta) {console.log('onMousewheel'); };
    // this.onTrack = function(event, pointers) {console.log('onTrack'); };
    // this.onTrackend = function(event, pointers) {console.log('onTrackend'); };
    // this.onHover = function(event, pointers) {console.log('onHover'); };

    // this.onBegin = function(event, pointers) {console.log('onBegin'); };
    // this.onCancel = function(event, pointers) {console.log('onCancel'); };
    // this.onEnd = function(event, pointers) {console.log('onEnd'); };

    this.registerViewport = function(domElement, camera) {

      viewport = getViewport(domElement);

      if (!viewport) {

        viewport = {
          domElement: domElement,
          camera: camera
        };

        scope._viewports.push(viewport);

        domElement.addEventListener('mousedown', onMousedown);
        domElement.addEventListener('touchstart', onTouchstart);
        domElement.addEventListener('mousewheel', onMousewheel);
        domElement.addEventListener('DOMMouseScroll', onMousewheel); // firefox
        domElement.addEventListener('mousemove', onHover);
        domElement.addEventListener('keydown', onKeydown);
        domElement.addEventListener('keyup', onKeyup);
        domElement.addEventListener('contextmenu', onContextmenu);

      } else if (camera) {

        viewport.camera = camera;

      }

    };

    this.unregisterViewport = function(domElement) {

      viewport = getViewport(domElement);

      if (viewport) {

        domElement.removeEventListener('mousedown', onMousedown);
        domElement.removeEventListener('touchstart', onTouchstart);
        domElement.removeEventListener('mousewheel', onMousewheel);
        domElement.removeEventListener('DOMMouseScroll', onMousewheel); // firefox
        domElement.removeEventListener('mousemove', onHover);
        domElement.removeEventListener('keydown', onKeydown);
        domElement.removeEventListener('keyup', onKeyup);
        domElement.removeEventListener('contextmenu', onContextmenu);

        scope._viewports.splice(scope._viewports.indexOf(viewport), 1);

      }

    };

  };

  REE.Control.prototype = Object.create(REE.Element.prototype);
  REE.Control.prototype.constructor = REE.Control;

  REE.Control.prototype.begin = function() {

    this.scene._helpers.add(this.helper);
    if (typeof this.onBegin === 'function') {
      this.onBegin();
    }
    this.dispatchEvent({type: 'begin'});

    return this;

  };

  REE.Control.prototype.cancel = function() {

    if (this.helper.parent) {
      this.helper.parent.remove(this.helper);
    }
    if (typeof this.onCancel === 'function') {
      this.onCancel();
    }
    this.dispatchEvent({type: 'cancel'});

    return this;

  };

  REE.Control.prototype.end = function() {

    if (this.helper.parent) {
      this.helper.parent.remove(this.helper);
    }
    if (typeof this.onEnd === 'function') {
      this.onEnd();
    }
    this.dispatchEvent({type: 'end'});

    return this;

  };

  REE.Control.prototype.dispose = function() {

    REE.Element.prototype.dispose.call(this);

    this.enabled = false;
    this.active = false;

    for (var i = this._viewports.length; i--;) {
      this.unregisterViewport(this._viewports[i].domElement);
    }

    if (this.helper.parent) {
      this.helper.parent.remove(this.helper);
    }

  };

  REE.Control.prototype.updatePlane = function(camera) {

    if (camera === undefined) {
      return;
    }

    tempMatrix.extractRotation(camera.matrixWorld.clone());
    tempVector.copy(unitz.multiplyScalar(1)).applyMatrix4(tempMatrix);
    alignVector.set(tempVector.dot(unitx),tempVector.dot(unity),tempVector.dot(unitz));

    if (camera instanceof THREE.PerspectiveCamera) {
      alignVector.treshold = 0.999;
    } else {
      alignVector.treshold = 0.65;
    }

    if (Math.abs(alignVector.z) > alignVector.treshold) {
      this.plane.lookAt(unitz);
    } else if (Math.abs(alignVector.x) > alignVector.treshold) {
      this.plane.lookAt(unitx);
    } else {
      this.plane.lookAt(unity);
    }

    this.plane.updateMatrixWorld();

  };

  REE.Control.prototype.getPointOnPlane = function(pointer, snap) {

    this.plane.update(this.camera);

    raycaster.setFromCamera(pointer, this.camera);
    intersect = raycaster.intersectObjects([this.plane], true)[0];

    if (intersect) {
      if (snap === true && this.snapDistance) {
        intersect.point.x = Math.round(intersect.point.x / this.snapDistance) * this.snapDistance;
        intersect.point.y = Math.round(intersect.point.y / this.snapDistance) * this.snapDistance;
        intersect.point.z = Math.round(intersect.point.z / this.snapDistance) * this.snapDistance;
      }
      return intersect.point;
    }

  };

}());
