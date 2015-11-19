/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  'use strict';

  REE.Property = function(parent, key, def) {

    this.key        = key;
    this.parent     = parent;
    this.default    = def.value;
    this.type       = def.type;
    this.observer   = undefined;
    this.notify     = false;
    this.writable   = true;
    this.persist    = false;
    this.enumerable = true;

    this._path = key.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

    if (def) {
      this.define(def);
    }

  };

  REE.Property.prototype.define = function(def) {

    if (def.value !== undefined) {
      this.default = def.value;
    }
    if (def.type !== undefined) {
      this.type = def.type;
    }
    if (def.observer !== undefined) {
      this.observer = def.observer;
    }
    if (def.notify !== undefined) {
      this.notify = def.notify;
    }
    if (def.writable !== undefined) {
      this.writable = def.writable;
    }
    if (def.persist !== undefined) {
      this.persist = def.persist;
    }
    if (def.enumerable !== undefined) {
      this.enumerable = def.enumerable;
    }

  };

  REE.Property.prototype.setValue = function(value) {

    if (this.writable === false && this.value !== undefined) {
      console.warn('REE.Element: ' + this.key + ' is read only.');
      return;
    }

    if (this.type && value !== undefined) {
      if (this.type === String) {
        if (typeof value !== 'string') {
          console.warn('REE.Element: ' + this.key + ' is incorrect type.');
          return;
        }
      } else if (this.type === Boolean) {
        if (typeof value !== 'boolean') {
          console.warn('REE.Element: ' + this.key + ' is incorrect type.');
          return;
        }
      } else if (this.type === Number) {
        if (typeof value !== 'number') {
          console.warn('REE.Element: ' + this.key + ' is incorrect type.');
          return;
        }
      } else if (typeof this.type === 'function' && !(value instanceof this.type)) {
        console.warn('REE.Element: ' + this.key + ' is incorrect type.');
        return;
      }
    }

    this.value = value;

    if (this.persist === true) {
      // TODO: debounce/throttle?
      this.setPersistedValue();
    }

  };

  REE.Property.prototype.setPersistedValue = function() {

    // TODO: implement better serialization
    localStorage.setItem(this.parent.uuid + '_' + this.key, JSON.stringify(this.value));

  };

  REE.Property.prototype.getPersistedValue = function() {

    var _persistedValue = localStorage.getItem(this.parent.uuid + '_' + this.key);
    var Type = this.type;

    if (_persistedValue !== null) {
      if (Type === Number || Type === String || Type === Boolean) {
        _persistedValue = JSON.parse(_persistedValue);
      } else if (typeof Type === 'function') {
        // TODO: implement better serialization
        var _tempObject = JSON.parse(_persistedValue);
        _persistedValue = new Type();
        for (var i in _tempObject) {
          _persistedValue[i] = _tempObject[i];
        }
      }
      return _persistedValue;
    }

    return this.default;

  };

}());
