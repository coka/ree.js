/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  'use strict';

  REE.Element = function(config) {

    Object.defineProperties(this, {
      '_config': {value: config || {}},
      '_properties': {value: {}},
      '_bindings': {value: {}},
      '_debouncers': {value: {}},
      '_listeners': {value: {}},
      '_parents': {value: []},
      '_children': {value: {}},
      '_ready': {value: false, writable: true},
    });

    this.registerProperties({
      uuid: {
        value: THREE.Math.generateUUID(),
        type: String,
        observer: '_uuidChanged'
      }
    });

    setTimeout(function () {
      if (this.ready) {
        this.ready();
      }
      this._ready = true;
    }.bind(this));

  };

  REE.Element.prototype.registerProperty = function(key, def, config) {

    if (this._properties[key] === undefined) {
      this._properties[key] = new REE.Property(this, key, def);
    } else {
      this._properties[key].define(def);
    }
    var prop = this._properties[key];

    // TODO: improve
    // Declerative binding is hacky atm.
    // It will break if the source element has declerative binding in config.
    if (config instanceof Array && config[0] instanceof REE.Element && typeof config[1] === 'string') {
      if (!config[0]._ready) {
        prop.default = config[0]._config[config[1]];
      } else {
        prop.default = config[0][config[1]];
      }
    } else if (config) {
      prop.default = config;
    }

    var _oldValue;

    if (!this.hasOwnProperty(key)) {

      var parentRef = {key: key, element: this};

      Object.defineProperty(this, key, {

        get: function() {

          return prop.value;

        },

        set: function(value) {

          if (prop.value === value) {
            return;
          }

          _oldValue = prop.value;

          prop.setValue(value);

          if (_oldValue instanceof REE.Element) {
            _oldValue._parents.splice(_oldValue._parents.indexOf(parentRef), 1);
            delete this._children[key];
          }

          if (value instanceof REE.Element) {
            value._parents.push(parentRef);
            this._children[key] = value;
          }

          if (prop.observer !== undefined) {
            if (this._ready) {
              this[prop.observer].call(this, {value: value, oldValue: _oldValue});
            } else {
              // debounce initial observer functions.
              this.debounce(prop._path + '-init', function() {
                this[prop.observer].call(this, {value: value, oldValue: _oldValue});
              }.bind(this));
            }
          }

          if (prop.notify === true) {
            this.dispatchEvent({type: prop._path + '-changed', key: key, value: value, oldValue: _oldValue});
          }

        },

        enumerable: prop.enumerable

      });

    }

    if (config instanceof Array && config[0] instanceof REE.Element && typeof config[1] === 'string') {

      if (!config[0]._ready) {
        this.debounce('bind-property' + key, function () {
          config[0].bindProperty(config[1], this, key);
        }.bind(this));
      } else {
        config[0].bindProperty(config[1], this, key);
      }

    }

    if (prop.persist) {
      this[key] = prop.getPersistedValue();
    } else {
      this[key] = prop.default;
    }

  };

  REE.Element.prototype.registerProperties = function(properties) {

    for (var key in properties) {
      var def = properties[key];
      var config = this._config[key];
      this.registerProperty(key, def, config);
    }

  };

  // TODO: consider on-way binding option.
  REE.Element.prototype.bindProperty = function(key, target, targetkey) {

    // For compatibility with polymer elements.
    // TODO: HACK! `target._property[targetkey]` makes code simpler.
    if (target instanceof HTMLElement) {
      target._properties = target._properties || {};
      target._properties[targetkey] = new REE.Property(target, targetkey, {});
    }

    var source = this;

    var srcPath = this._properties[key]._path;

    this._properties[key].notify = true;
    target._properties[targetkey].notify = true;

    this._bindings[srcPath] = {
      source: source,
      target: target,
      sourcePath: source._properties[key]._path,
      targetPath: target._properties[targetkey]._path,
      sourceObserver: function() {
        target[targetkey] = source[key];
      },
      targetObserver: function() {
        source[key] = target[targetkey];
      }
    };

    source.addEventListener(this._bindings[srcPath].sourcePath + '-changed', this._bindings[srcPath].sourceObserver);
    target.addEventListener(this._bindings[srcPath].targetPath + '-changed', this._bindings[srcPath].targetObserver);

    if (source[key] !== undefined) {
      target[targetkey] = source[key];
    } else if (target[targetkey] !== undefined) {
      source[key] = target[targetkey];
    }

  };

  REE.Element.prototype.addEventListener = function(type, listener) {

    if (this._listeners[type] === undefined) {
      this._listeners[type] = [];
      this._listeners[type].regExp =
          new RegExp('^' + type.replace(/[*]/g, '.*').toLowerCase().trim() + '$');
    }

    if (this._listeners[type].indexOf(listener) === -1) {
      this._listeners[type].push(listener);
    }

  };

  REE.Element.prototype.removeEventListener = function(type, listener) {

    if (this._listeners[type] !== undefined) {
      var index = this._listeners[type].indexOf(listener);
      if (index !== -1) {
        this._listeners[type].splice(index, 1);
        return;
      }
    }

    console.warn('REE.Element: Could not find listener', type);

  };

  REE.Element.prototype.removeEventListeners = function(listener) {

    if (typeof listener === 'string') {
      if (this._listeners[listener] !== undefined) {
        this._listeners[listener].length = 0;
      }
    }

    if (typeof listener === 'function') {
      for (var i in this._listeners) {
        var index = this._listeners[i].indexOf(listener);
        if (index !== -1) {
          this._listeners[i].splice(index, 1);
        }
      }
    }
  };

  REE.Element.prototype.dispatchEvent = function(event) {

    // Inspired by https://github.com/mrdoob/eventdispatcher.js/

    var eventType = event.type;

    var listenerArray = [];
    for (var l in this._listeners) {
      if (this._listeners[l].regExp.test(eventType)) {
        listenerArray = listenerArray.concat(this._listeners[l]);
      }
    }

    event.target = event.target || this;

    if (listenerArray !== undefined) {
      for (var i = 0; i < listenerArray.length; i ++) {
        listenerArray[i].call(this, event);
      }
    }

    if (event.bubble === true) {
      for (var j = 0; j < this._parents.length; j ++) {
        event.type = this._parents[j].key + '.' + eventType;
        this._parents[j].element.dispatchEvent(event);
      }
    }

  };

  REE.Element.prototype.debounce = function(id, callback, timeout) {

    window.clearTimeout(this._debouncers[id]);
    this._debouncers[id] = setTimeout(function() {
      callback();
      delete this._debouncers[id];
    }.bind(this), timeout);

  };

  REE.Element.prototype._uuidChanged = function(event) {

    if (event.oldValue) {
      for (var i in this._properties) {
        if (this._properties[i].persist) {
          this[i] = this._properties[i].getPersistedValue();
        }
      }
    }

  };

  REE.Element.prototype.dispose = function() {

    for (var i in this._config) {
      delete this._config[i];
    }

    for (i in this._properties) {
      delete this._properties[i];
    }

    for (i in this._bindings) {
      this._bindings[i].source.removeEventListener(this._bindings[i].sourcePath + '-changed', this._bindings[i].sourceObserver);
      this._bindings[i].target.removeEventListener(this._bindings[i].targetPath + '-changed', this._bindings[i].targetObserver);
      delete this._bindings[i];
    }

    for (i in this._debouncers) {
      window.clearTimeout(this._debouncers[i]);
      delete this._debouncers[i];
    }

    for (i in this._listeners) {
      for (var j = this._listeners[i].length; j--;) {
        this.removeEventListener(i, this._listeners[i][j]);
      }
      delete this._listeners[i];
    }

    this._parents.length = 0;

    for (i in this._children) {
      delete this._children[i];
    }

  };

}());
