/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  'use strict';

  // shared variables

  REE.LineControl = function(parameters) {

    REE.Control.call(this, parameters);

    var lineArray = [];

    var indexBuffer = new Uint16Array();
    var positionBuffer = new Float32Array();
    var geometry = new THREE.BufferGeometry();
    var indexAttributes = new THREE.BufferAttribute(indexBuffer, 1);
    var positionAttributes = new THREE.BufferAttribute(positionBuffer, 3);

    geometry.setIndex(indexAttributes);
    geometry.addAttribute('position', positionAttributes);

    var material = new THREE.LineBasicMaterial({
      linewidth: 1
    });
    material.depthTest = false;

    var lineHelper = new THREE.Line(geometry, material);
    lineHelper.frustumCulled = false;

    function addPoint(position) {
      lineArray.push(position.x);
      lineArray.push(position.y);
      lineArray.push(position.z);
      // TODO: only do this when dragging
      if (lineArray.length === 3) {
        lineArray.push(position.x);
        lineArray.push(position.y);
        lineArray.push(position.z);
      }
      updateLineMesh();
    }

    function moveEndPoint(position) {
      lineArray[lineArray.length - 3] = position.x;
      lineArray[lineArray.length - 2] = position.y;
      lineArray[lineArray.length - 1] = position.z;
      updateLineMesh();
    }

    function updateLineMesh() {
      if (lineArray.length) {
        geometry.removeAttribute('position');

        indexBuffer = new Uint32Array(lineArray.length / 3);
        geometry.setIndex(new THREE.BufferAttribute(indexBuffer, 1));

        positionBuffer = new Float32Array(lineArray.length);
        geometry.addAttribute('position', new THREE.BufferAttribute(positionBuffer, 3));

        for (var i = 0; i < lineArray.length / 3; i++) {
          positionBuffer[i * 3 + 0] = lineArray[i * 3 + 0];
          positionBuffer[i * 3 + 1] = lineArray[i * 3 + 1];
          positionBuffer[i * 3 + 2] = lineArray[i * 3 + 2];
          indexBuffer[i] = i;
        }

        geometry.needsUpdate = true;
        // geometry.computeBoundingSphere();
      }
    }

    // internal variables

    var startPoint;
    var point;

    // event handlers

    this.onTrackstart = function(event, pointers) {

      if (event.altKey) {
        return;
      }

      this.helper.add(lineHelper);

      startPoint = this.getPointOnPlane(pointers[0].position, event.shiftKey);

      if (startPoint) {
        this.active = true;
        addPoint(startPoint);
        this.dispatchEvent({type: 'render', bubble: true});
      }

    };

    this.onTrack = function(event, pointers) {

      if (event.altKey) {
        return;
      }

      point = this.getPointOnPlane(pointers[0].position, event.shiftKey);

      // this.fire('io-help-message', {message: 'Line Tool: Hold <b>Shift</b> to snap.'});

      if (point) {
        if (lineArray.length >= 6) {
          moveEndPoint(point);
          this.dispatchEvent({type: 'render', bubble: true});
        }
      }

    };

    this.onTrackend = function(event) {

      if (event.altKey) {
        return;
      }

      this.active = false;

      this.dispatchEvent({type: 'render', renderAll: true, bubble: true});

    };

    var scope = this;

    function end() {

      if (lineHelper.parent) {
        lineHelper.parent.remove(lineHelper);
      }

      if (lineArray.length <= 6) {
        return;
      }

      lineArray.length = 0;

      geometry.computeBoundingSphere();

      var mesh = new THREE.Line(
        geometry.clone(),
        material.clone()
      );

      mesh.name = 'line';

      scope.scene.add(mesh);
      scope.selection.clear();
      scope.selection.add(mesh);

    }

    function removeLastPoint() {
      if (lineArray.length) {
        lineArray.splice(lineArray.length - 3, 3);
      }
      updateLineMesh();
      scope.dispatchEvent({type: 'render', bubble: true});
    }

    this.onKeyup = function(event) {
      switch (event.which) {
        case 13: // enter
          end();
          break;
        case 8: // backspace
          removeLastPoint();
          break;
      }
    };

  };

  REE.LineControl.prototype = Object.create(REE.Control.prototype);
  REE.LineControl.prototype.constructor = REE.LineControl;

}());
