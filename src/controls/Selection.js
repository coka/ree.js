/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  'use strict';

  // shared variables

  var raycaster = new THREE.Raycaster();
  var scale;

  REE.SelectionControl = function(config) {

    REE.Control.call(this, config);

    this.helper.add(new REE.BoxHelper());
    this.helper.scale.set(Infinity, Infinity, Infinity);

    this.addEventListener('selection.selection-changed', function() {
      scale = this.selection.box.max.clone().sub(this.selection.box.min);
      this.helper.position.copy(this.selection.center);
      this.helper.scale.copy(scale);
      this.dispatchEvent({type: 'render', renderAll: true, bubble: true});
    }.bind(this));

    // internal variables

    var scope = this;

    var intersect;
    var object;

    // helper functions

    function selectWithPointer(pointer, additive) {

      raycaster.setFromCamera(pointer, scope.camera);
      intersect = raycaster.intersectObjects([scope.scene], true)[0];

      if (intersect) {
        object = intersect.object;
        if (additive) {
          scope.selection.toggle(object);
        } else {
          scope.selection.clear();
          scope.selection.add(object);
        }
      } else {
        if (!additive) {
          scope.selection.clear();
        }
      }

    }

    // event handlers

    this.onTrackend = function(event, pointers) {

      if (pointers[0].offset.length() < 0.01) {
        selectWithPointer(pointers[0].position, event.shiftKey);
      }

    };

    this.onKeyup = function(event, key) {

      switch (key) {

        case 38:
          scope.selection.selectParents(object);
          break;

        case 40:
          scope.selection.selectChildren(object);
          break;

        case 39:
          scope.selection.selectNext(object);
          break;

        case 37:
          scope.selection.selectPrevious(object);
          break;

      }

    };

  };

  REE.SelectionControl.prototype = Object.create(REE.Control.prototype);
  REE.SelectionControl.prototype.constructor = REE.SelectionControl;

}());
