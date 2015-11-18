/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  var _tempObject;
  var _persistedValue;

  REE.Element = function(config) {

    Object.defineProperties(this, {
      '_config': {value: config || {}},
      '_properties': {value: {}},
      '_effects': {value: {}},
      '_targetEffects': {value: {}},
      '_debouncers': {value: {}},
      '_listeners': {value: {}},
      '_parents': {value: []},
      '_children': {value: {}}
    });

    this.registerProperties({
      uuid: {
        value: THREE.Math.generateUUID(),
        type: String,
        observer: '_uuidChanged'
      }
    });

  };

  REE.Element.prototype.registerProperty = function(key, property, config) {

    var prop = this._properties[key] = this._properties[key] || {};

    prop.default    = property.value;
    prop.type       = property.type;
    prop.observer   = property.observer   !== undefined ? property.observer   : undefined;
    prop.notify     = property.notify     !== undefined ? property.notify     : false;
    prop.writable   = property.writable   !== undefined ? property.writable   : true;
    prop.persist    = property.persist    !== undefined ? property.persist    : false;
    prop.enumerable = property.enumerable !== undefined ? property.enumerable : true;

    if (config instanceof Array && config[0] instanceof REE.Element && typeof config[1] === 'string') {
      prop.default = config[0][config[1]];
    } else if (config) {
      prop.default = config;
    }

    var _changeEvent = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() + '-changed';
    var _oldValue;

    if (!this.hasOwnProperty(key)) {

      var parentRef = {key: key, entity: this};

      Object.defineProperty(this, key, {

        get: function() {

          return prop.value;

        },

        set: function(value) {

          if (prop.value === value) {
            return;
          }

          if (prop.writable === false && prop.value !== undefined) {
            console.warn('REE.Element: ' + key + ' is read only.');
          }

          if (prop.type && value !== undefined) {
            if (prop.type === String) {
              if (typeof value !== 'string') {
                console.warn('REE.Element: ' + key + ' is incorrect type.');
                return;
              }
            } else if (prop.type === Boolean) {
              if (typeof value !== 'boolean') {
                console.warn('REE.Element: ' + key + ' is incorrect type.');
                return;
              }
            } else if (prop.type === Number) {
              if (typeof value !== 'number') {
                console.warn('REE.Element: ' + key + ' is incorrect type.');
                return;
              }
            } else if (typeof prop.type === 'function' && !(value instanceof prop.type)) {
              console.warn('REE.Element: ' + key + ' is incorrect type.');
              return;
            }
          }

          _oldValue = prop.value;
          prop.value = value;

          if (_oldValue instanceof REE.Element) {
            _oldValue._parents.splice(_oldValue._parents.indexOf(parentRef), 1);
            delete this._children[key];
          }

          if (value instanceof REE.Element) {
            value._parents.push(parentRef);
            this._children[key] = value;
          }

          this.debounce(_changeEvent, function() {

            if (prop.observer !== undefined) {
              this[prop.observer].call(this, {value: value, oldValue: _oldValue});
            }

            if (prop.notify === true) {
              this.dispatchEvent({type: _changeEvent, key: key, value: value, oldValue: _oldValue});
            }

            if (prop.persist === true) {
              this._setPersistedValue(key, value);
            }

          }.bind(this));

        },

        enumerable: prop.enumerable

      });

    }

    if (config instanceof Array && config[0] instanceof REE.Element && typeof config[1] === 'string') {
      config[0].bindProperty(this, config[1], key);
    }

    if (prop.persist) {
      this[key] = this._getPersistedValue(key, prop.type);
    } else {
      this[key] = prop.default;
    }

  };

  REE.Element.prototype.registerProperties = function(properties) {

    for (var key in properties) {
      var property = properties[key];
      var config = this._config[key];
      this.registerProperty(key, property, config);
    }

  };

  REE.Element.prototype.bindProperty = function(target, key, targetkey) {

    var _changeEvent = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() + '-changed';
    var _targetChangeEvent = targetkey.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() + '-changed';

    this._properties[key].notify = true;

    if (target._properties && target._properties[targetkey]) {
      target._properties[targetkey].notify = true;
    }

    this._effects[_changeEvent] =  function() {
      target[targetkey] = this[key];
    }.bind(this);

    this._targetEffects[_targetChangeEvent] = function() {
      this[key] = target[targetkey];
    }.bind(this);

    this._targetEffects[_targetChangeEvent].target = target;

    this.addEventListener(_changeEvent, this._effects[_changeEvent]);
    target.addEventListener(_targetChangeEvent, this._targetEffects[_targetChangeEvent]);

    if (this[key] !== undefined) {
      target[targetkey] = this[key];
    } else if (target[targetkey] !== undefined) {
      this[key] = target[targetkey];
    }

  };

  REE.Element.prototype.bindProperties = function(target, bindings) {

    for (var key in bindings) {
      this.bindProperty(target, key, bindings[key]);
    }

  };

  REE.Element.prototype.dispose = function() {

    var i;
    var j;

    for (i in this._properties) {
      delete this._properties[i];
    }

    // TODO: verify
    for (i in this._effects) {
      this.removeEventListener(i, this._effects[i]);
      delete this._effects[i];
    }
    delete this._effects;

    for (i in this._targetEffects) {
      this._targetEffects[i].target.removeEventListener(i, this._targetEffects[i]);
      delete this._targetEffects[i];
    }
    delete this._targetEffects;

    for (i in this._debouncers) {
      window.clearTimeout(this._debouncers[i]);
      delete this._debouncers[i];
    }
    delete this._debouncers;

    for (i in this._listeners) {
      for (j = this._listeners[i].length; j--;) {
        this.removeEventListener(i, this._listeners[i][j]);
      }
      delete this._listeners[i];
    }
    delete this._listeners;

    this._parents.length = 0;
    delete this._parents;

    for (i in this._children) {
      delete this._children[i];
    }
    delete this._children;

  };

  REE.Element.prototype.debounce = function(id, callback, timeout) {

    window.clearTimeout(this._debouncers[id]);
    this._debouncers[id] = setTimeout(function() {
      callback();
      delete this._debouncers[id];
    }.bind(this), timeout);

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
      }
    }

  };

  REE.Element.prototype.dispatchEvent = function(event) {

    /**
     * Inspired by https://github.com/mrdoob/eventdispatcher.js/
     */

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
        this._parents[j].entity.dispatchEvent(event);
      }
    }

  };

  REE.Element.prototype._setPersistedValue = function(key, value) {

    // TODO: implement better serialization

    _persistedValue =  JSON.stringify(value);
    localStorage.setItem(this.uuid + '_' + key, _persistedValue);

  };

  REE.Element.prototype._getPersistedValue = function(key, type) {

    _persistedValue = localStorage.getItem(this.uuid + '_' + key);

    if (_persistedValue !== null) {
      if (type === Number || type === String || type === Boolean) {
        _persistedValue = JSON.parse(_persistedValue);
      } else if (typeof type === 'function') {
        // TODO: implement better serialization
        var Type = type;
        _tempObject = JSON.parse(_persistedValue);
        _persistedValue = new Type();
        for (var i in _tempObject) {
          _persistedValue[i] = _tempObject[i];
        }
      }
      return _persistedValue;
    }

    return this._propertes[key].default;

  };

  REE.Element.prototype._uuidChanged = function(event) {

    if (event.oldValue) {
      for (var i in this._properties) {
        if (this._propertes[i].persist) {
          this[i] = this._getPersistedValue(i, this._properties[i].type);
        }
      }
    }

  };

}());
