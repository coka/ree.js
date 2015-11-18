/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  'use strict';

  REE.ControlsState = function(config) {

    REE.Element.call(this, config);

    this.registerProperties({
      scene: {
        type: REE.SceneState,
      },
      selectionControl: {
        value: new REE.SelectionControl(),
        type: REE.SelectionControl,
        vritable: false
      },
      viewportControl: {
        value: new REE.ViewportControl(),
        type: REE.ViewportControl,
        vritable: false
      },
      control: {
        type: REE.Control,
        notify: true
      },
      selector: {
        value: 'transform:translate',
        type: String,
        observer: '_selectorChanged',
        notify: true
      },
      mode: {
        type: String,
        observer: '_modeChanged',
        notify: true
      },
      snapDistance: {
        type: Number
      },
      snapAngle: {
        type: Number
      }
    });

    this.selectionControl.scene = this.scene;

  };

  REE.ControlsState.prototype = Object.create(REE.Element.prototype);
  REE.ControlsState.prototype.constructor = REE.ControlsState;

  REE.ControlsState.prototype._selectorChanged = function() {
    var name = this.selector.split(':')[0];
    var mode = this.selector.split(':')[1] || '';

    if (this._name !== name) {

      var constructor = name.charAt(0).toUpperCase() + name.slice(1) + 'Control';
      if (this.control) {
        this.control.dispose();
      }
      this.mode = mode;
      this.control = new REE[constructor]();
      this.bindProperty(this.control, 'scene', 'scene');
      this.bindProperty(this.control, 'mode', 'mode');
      this.bindProperty(this.control, 'snapDistance', 'snapDistance');
      this.bindProperty(this.control, 'snapAngle', 'snapAngle');

      this.control.addEventListener('active-changed', function() {
        if (this.control.active) {
          this.viewportControl.enabled = false;
          this.selectionControl.enabled = false;
          this.selectionControl.helper.visible = false;
        } else {
          this.viewportControl.enabled = true;
          this.selectionControl.enabled = true;
          this.selectionControl.helper.visible = true;
        }
      }.bind(this));

      this._name = name;
    }

    this.mode = mode;
  };

  REE.ControlsState.prototype._modeChanged = function() {
    this.debounce('mode-changed', function() {
      if (this.mode) {
        this.selector = this._name + ':' + this.mode;
      } else {
        this.selector = this._name;
      }
    }.bind(this));
  };

}());
