/**
 * @author arodic / http://akirodic.com/
 */

(function() {

REE.Helper = function(parameters) {

  THREE.Object3D.call(this);
  REE.Element.call(this, parameters);

};

REE.Helper.prototype = Object.create(THREE.Object3D.prototype);
REE.Helper.prototype.constructor = REE.Helper;

REE.Helper.prototype.registerProperty = REE.Element.prototype.registerProperty;
REE.Helper.prototype.registerProperties = REE.Element.prototype.registerProperties;
REE.Helper.prototype.bindProperty = REE.Element.prototype.bindProperty;
REE.Helper.prototype.bindProperties = REE.Element.prototype.bindProperties;
REE.Helper.prototype.dispose = REE.Element.prototype.dispose;
REE.Helper.prototype.debounce = REE.Element.prototype.debounce;
REE.Helper.prototype.addEventListener = REE.Element.prototype.addEventListener;
REE.Helper.prototype.removeEventListener = REE.Element.prototype.removeEventListener;
REE.Helper.prototype.dispatchEvent = REE.Element.prototype.dispatchEvent;
REE.Helper.prototype._setPersistedValue = REE.Element.prototype._setPersistedValue;
REE.Helper.prototype._getPersistedValue = REE.Element.prototype._getPersistedValue;
REE.Helper.prototype._uuidChanged = REE.Element.prototype._uuidChanged;

REE.Helper.prototype.update = function() {};

}());
