/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  REE.BoxHelper = function(config) {

    REE.Helper.call(this, config);

    Object.defineProperties(this, {
      '_bboxHelper': {value: new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)))}
    });

    this._bboxHelper.material.depthTest = false;
    this.add(this._bboxHelper);

  };

  REE.BoxHelper.prototype = Object.create(REE.Helper.prototype);
  REE.BoxHelper.prototype.constructor = REE.BoxHelper;

}());
