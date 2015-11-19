/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  'use strict';

  // shared variables

  REE.SphereControl = function(parameters) {

    REE.Control.call(this, parameters);

    var sphereHelper = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true})
    );

    // internal variables

    var startPoint;
    var point;
    var distance;

    // event handlers

    this.onTrackstart = function(event, pointers) {


      if (event.altKey) {
        return;
      }

      startPoint = this.getPointOnPlane(pointers[0].position, event.shiftKey);

      if (startPoint) {
        this.helper.add(sphereHelper);
        sphereHelper.visible = false;
        sphereHelper.position.copy(startPoint);
        this.active = true;
      }

    };

    this.onTrack = function(event, pointers) {

      if (event.altKey) {
        return;
      }

      point = this.getPointOnPlane(pointers[0].position, event.shiftKey);

      if (point) {
        distance = startPoint.distanceTo(point);
        if (distance > 0) {
          sphereHelper.scale.set(distance, distance, distance);
          sphereHelper.visible = true;
          this.dispatchEvent({type: 'render', bubble: true});
        }
      }

    };

    this.onTrackend = function(event) {

      if (event.altKey) {
        return;
      }

      this.helper.remove(sphereHelper);

      if (distance > 0) {

        var mesh = new THREE.Mesh(
          new THREE.SphereGeometry(distance, 32, 32),
          new THREE.MeshNormalMaterial({color: 0xffffff})
        );

        mesh.position.copy(startPoint);

        this.scene.add(mesh);

        this.selection.clear();
        this.selection.add(mesh);

      }

      this.active = false;
      distance = 0;

      this.dispatchEvent({type: 'render', renderAll: true, bubble: true});

    };

  };

  REE.SphereControl.prototype = Object.create(REE.Control.prototype);
  REE.SphereControl.prototype.constructor = REE.SphereControl;

}());
