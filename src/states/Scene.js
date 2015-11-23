/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  REE.SceneState = function(parameters) {

    THREE.Scene.call(this);
    REE.Element.call(this, parameters);

    this.registerProperties({
      _helpers: {
        value: new THREE.Scene(),
        type: THREE.Scene,
        writable: false
      }
    });

  };

  REE.SceneState.prototype = Object.create(THREE.Scene.prototype);
  REE.SceneState.prototype.constructor = REE.SceneState;

  REE.SceneState.prototype.registerProperty = REE.Element.prototype.registerProperty;
  REE.SceneState.prototype.registerProperties = REE.Element.prototype.registerProperties;
  REE.SceneState.prototype.bindProperty = REE.Element.prototype.bindProperty;
  REE.SceneState.prototype.dispose = REE.Element.prototype.dispose;
  REE.SceneState.prototype.debounce = REE.Element.prototype.debounce;
  REE.SceneState.prototype.addEventListener = REE.Element.prototype.addEventListener;
  REE.SceneState.prototype.removeEventListener = REE.Element.prototype.removeEventListener;
  REE.SceneState.prototype.dispatchEvent = REE.Element.prototype.dispatchEvent;
  REE.SceneState.prototype._setPersistedValue = REE.Element.prototype._setPersistedValue;
  REE.SceneState.prototype._getPersistedValue = REE.Element.prototype._getPersistedValue;
  REE.SceneState.prototype._uuidChanged = REE.Element.prototype._uuidChanged;

}());
