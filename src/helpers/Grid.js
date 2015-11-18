/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  'use strict';

  var tempVector = new THREE.Vector3();
  var alignVector = new THREE.Vector3();
  var tempMatrix = new THREE.Matrix4();
  var unitx = new THREE.Vector3(1, 0, 0);
  var unity = new THREE.Vector3(0, 1, 0);
  var unitz = new THREE.Vector3(0, 0, 1);

  REE.GridHelper = function(config) {

    REE.Helper.call(this, config);

    this.registerProperties({
      showAxis: {
        value: true,
        type: Boolean
      },
      axisSize: {
        value: 10,
        type: Number
      },
      showGrid: {
        value: true,
        type: Boolean
      },
      gridSize: {
        value: 10,
        type: Number,
        observer: 'updateGrid'
      },
      gridWidth: {
        value: 10,
        type: Number,
        observer: 'updateGrid'
      },
      gridColor1: {
        value: 'white',
        type: String,
        observer: 'updateGrid'
      },
      gridColor2: {
        value: '#222',
        type: String,
        observer: 'updateGrid'
      },
    });

    this._grid = new THREE.GridHelper(this.gridSize * this.gridWidth, this.gridSize);
    this._grid.setColors(this.gridColor1, this.gridColor2);
    this._grid.material.transparent = true;
    this._grid.material.opacity = 0.5;
    this._grid.material.depthWrite = false;
    this.add(this._grid);

    this._axis = new THREE.AxisHelper();
    this._axis.material.depthTest = false;
    this.add(this._axis);
    this.update();
  };

  REE.GridHelper.prototype = Object.create(REE.Helper.prototype);
  REE.GridHelper.prototype.constructor = REE.GridHelper;

  REE.GridHelper.prototype.updateGrid = function() {
    var gridhelper = new THREE.GridHelper(this.gridSize * this.gridWidth, this.gridSize);
    gridhelper.setColors(this.gridColor1, this.gridColor2);
    this._grid.geometry = gridhelper.geometry;
  };

  REE.GridHelper.prototype.update = function(camera) {

    this._grid.visible = this.showGrid === true;
    this._axis.visible = this.showAxis === true;
    this._axis.scale.set(this.axisSize, this.axisSize, this.axisSize);

    if (camera) {

      tempMatrix.extractRotation(camera.matrixWorld.clone());
      tempVector.copy(unitz.multiplyScalar(1)).applyMatrix4(tempMatrix);
      alignVector.set(tempVector.dot(unitx),tempVector.dot(unity),tempVector.dot(unitz));

      if (camera instanceof THREE.PerspectiveCamera) {
        alignVector.treshold = 0.999;
      } else {
        alignVector.treshold = 0.7071;
      }

      if (Math.abs(alignVector.z) > alignVector.treshold) {
        this._grid.rotation.set(Math.PI / 2, 0, 0);
      } else if (Math.abs(alignVector.x) > alignVector.treshold) {
        this._grid.rotation.set(0, 0, Math.PI / 2);
      } else {
        this._grid.rotation.set(0, 0, 0);
      }

    }

  };

}());
