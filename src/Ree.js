/**
 * @author arodic / http://akirodic.com/
 */

var REE = {};

REE.Revision = '0.0.1';

(function() {

  'use strict';

  REE.Register = function(data) {

    var properties = data.properties || {};
    var constructor = data.is;

    REE[constructor] = function(config) {

      REE.Element.call(this, config);

      for (var key in properties) {

        this.registerProperty(key, properties[key], config[key]);

      }

    };

    REE[constructor].prototype = Object.create(REE.Element.prototype);
    REE[constructor].prototype.constructor = REE[constructor];
    Object.defineProperty(REE[constructor], 'name', {value: constructor});
    REE[constructor].prototype.toString = function() {
      return 'REE.' + constructor;
    };

    for (var key in data) {

      if (typeof data[key] === 'function') {

        REE[constructor].prototype[key] = data[key];

      }

    }

  };

}());
