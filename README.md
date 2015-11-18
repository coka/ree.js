ree.js
======

#### Framework for building 3D application architecture ####

The goal of this project is to provide a framework for building complex 3D applications such as CAD and 3D animation tools. It relies on [three.js](https://github.com/mrdoob/three.js/) and it is heavily inspired by [Polymer.js](https://github.com/Polymer/polymer/).

---

### Motivation ###

Building complex software such as computer graphics tools has always been a challenge with web technology. Libraries such as [three.js](https://github.com/mrdoob/three.js/) solve some of the big problems around the complexity of [WebGL](https://www.khronos.org/webgl/) API. However, building complex and articulated applications is still an unsolved problem. This framework is an attempt to solve it.

### Origin ###

The core ideas in this framework originate from attempts to build complex 3D applications using [Polymer.js](https://github.com/Polymer/polymer/) and [custom elements](http://w3c.github.io/webcomponents/spec/custom/). Hierarchical DOM-based application model works great for the UI and promotes good practices such as modularization and reusability. On the other hand, application logic very often needs to break out from the DOM structure and imposing this structure on logic often results in higher complexity. This framework takes some concepts from custom elements and mixes it with common JavaScript techniques. The resulting architecture pattern sits somewhere between object oriented, DOM-based and component-entity-systems and provides a simple data binding interface to DOM-based UI.

### Core Concepts ###

The core concept of this framework is embodied in [REE.Element](https://github.com/arodic/ree.js/blob/master/src/core/Element.js) class. It is essentially a JavaScript object/entity with data binding, event system, and type checking for it's properties. Additionally, if `uuid` property is set, the objects have the ability to persist property values between browsing sessions. Data binding can be expressed both imperatively and declaratively. Events propagate through complex element hierarchies the same way they propagate in DOM. Property persistence is currently only supported with localStorage and basic data types.
