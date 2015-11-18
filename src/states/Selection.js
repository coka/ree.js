/**
 * @author arodic / http://akirodic.com/
 */

(function() {

  // shared variables

  var tempBox = new THREE.Box3();
  var object;

  REE.SelectionState = function(parameters) {

    REE.Element.call(this, parameters);

    this.registerProperties({

      objects: {
        value: [],
        type: Array,
        writable: false
      },
      center: {
        value: new THREE.Vector3(),
        type: THREE.Vector3,
        writable: false
      },
      box: {
        value: new THREE.Box3(),
        type: THREE.Box3,
        writable: false
      },
      sphere: {
        value: new THREE.Sphere(),
        type: THREE.Sphere,
        writable: false
      }
    });
  };

  REE.SelectionState.prototype = Object.create(REE.Element.prototype);
  REE.SelectionState.prototype.constructor = REE.SelectionState;

  REE.SelectionState.prototype.clear = function() {

    this.remove([].concat(this.objects));

    this.update();

  };

  REE.SelectionState.prototype.add = function(items) {

    if (items instanceof THREE.Object3D) {
      items = [items];
    }

    for (var i = 0; i < items.length; i++) {
      if (this.objects.indexOf(items[i]) === -1) {
        this.objects.push(items[i]);
      }
    }

    this.update();

  };

  REE.SelectionState.prototype.remove = function(items) {

    if (items instanceof THREE.Object3D) {
      items = [items];
    }

    for (var i = items.length; i--;) {
      if (this.objects.indexOf(items[i]) !== -1) {
        this.objects.splice(this.objects.indexOf(items[i]), 1);
      }
    }

    this.update();

  };

  REE.SelectionState.prototype.toggle = function(items) {

    if (items instanceof THREE.Object3D) {
      items = [items];
    }

    for (var i = items.length; i--;) {
      if (this.objects.indexOf(items[i]) !== -1) {
        this.objects.splice(this.objects.indexOf(items[i]), 1);
      } else {
        this.objects.push(items[i]);
      }
    }

    this.update();

  };

  REE.SelectionState.prototype.selectParents = function() {

    var parents = [];

    for (var i = 0; i < this.objects.length; i++) {
      if (this.objects[i].parent) {
        parents.push(this.objects[i].parent);
      }
    }

    this.clear();
    this.add(parents);

  };

  REE.SelectionState.prototype.selectChildren = function() {

    var children = [];

    for (var i = 0; i < this.objects.length; i++) {
      if (this.objects[i].children.length) {
        children.push(this.objects[i].children[0]);
      }
    }

    this.clear();
    this.add(children);

  };

  REE.SelectionState.prototype.selectNext = function() {

    var siblings = [];

    for (var i = 0; i < this.objects.length; i++) {
      if (this.objects[i].parent) {
        var index = this.objects[i].parent.children.indexOf(this.objects[i]);
        index = (index + 1) % this.objects[i].parent.children.length;
        siblings.push(this.objects[i].parent.children[index]);
      }
    }

    this.clear();
    this.add(siblings);

  };

  REE.SelectionState.prototype.selectPrevious = function() {

    var siblings = [];

    for (var i = 0; i < this.objects.length; i++) {
      if (this.objects[i].parent) {
        var index = this.objects[i].parent.children.indexOf(this.objects[i]);
        index = (this.objects[i].parent.children.length + index - 1) % this.objects[i].parent.children.length;
        siblings.push(this.objects[i].parent.children[index]);
      }
    }

    this.clear();
    this.add(siblings);

  };

  REE.SelectionState.prototype.update = function() {

    this.debounce('update', function() {

      this.box.makeEmpty();
      this.sphere.empty();
      this.center.set(0, 0, 0);

      if (this.objects.length !== 0) {
        for (var i = 0; i < this.objects.length; i++) {
          object = this.objects[i];
          tempBox.setFromObject(object);
          this.box.expandByPoint(tempBox.min);
          this.box.expandByPoint(tempBox.max);
        }
        this.center.copy(this.box.min).add(this.box.max).multiplyScalar(0.5);
        this.box.getBoundingSphere(this.sphere);
      }

      this.dispatchEvent({type: 'selection-changed', bubble: true, value: this});

    }.bind(this));

  };

}());
