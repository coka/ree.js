/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  'use strict';

  REE.Register({
    is: 'ConfigState',
    properties: {
      clearColor: {
        value: '#222222',
        type: String,
        notify: true,
        persist: true
      },
      showHelpers: {
        value: true,
        type: Boolean,
        notify: true,
        persist: true
      },
      showAxis: {
        value: true,
        type: Boolean,
        notify: true,
        persist: true
      },
      axisSize: {
        value: 10,
        type: Number,
        notify: true,
        persist: true
      },
      showGrid: {
        value: true,
        type: Boolean,
        notify: true,
        persist: true
      },
      gridSize: {
        value: 10,
        type: Number,
        notify: true,
        persist: true
      },
      gridWidth: {
        value: 10,
        type: Number,
        notify: true,
        persist: true
      },
      gridColor1: {
        value: 'white',
        type: String,
        notify: true,
        persist: true
      },
      gridColor2: {
        value: '#222',
        type: String,
        notify: true,
        persist: true
      },
      snapAngle: {
        value: 45,
        type: Number,
        notify: true,
        persist: true
      },
      showCompass: {
        value: true,
        type: Boolean,
        notify: true,
        persist: true
      },
      compassSize: {
        value: 0.125,
        type: Number,
        notify: true,
        persist: true
      }
    },
    ready: function() {
      console.log('' + this, 'ready');
    }
  });

}());
