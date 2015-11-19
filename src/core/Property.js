/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  'use strict';

  REE.Property = function(def) {

    this.default    = def.value;
    this.type       = def.type;
    this.observer   = undefined;
    this.notify     = false;
    this.writable   = true;
    this.persist    = false;
    this.enumerable = true;

    if (def) {
      this.define(def);
    }

  };

  REE.Property.protptype.define = function(def) {

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

}());
