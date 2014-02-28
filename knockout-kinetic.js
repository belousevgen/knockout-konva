﻿
/*
Knockout Kinetic plugin version 0.1.4
Copyright 2014 Christopher Currie - https://github.com/christophercurrie
License: MIT (http://www.opensource.org/licenses/mit-license.php)
*/

(function() {
  var __hasProp = {}.hasOwnProperty;



  (function(factory) {
    if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') {
      return factory(require('knockout'), exports);
    } else if (typeof define === 'function' && define['amd']) {
      return define(['knockout', 'exports'], factory);
    } else {
      return factory(ko, ko.kinetic = {});
    }
  })(function(ko, exports) {
    var applyAnimations, applyEvents, applyInteractivityEventsCallback, ctor, expandConfig, getKineticContainerIndex, makeBindingHandler, nodeFactory, nodeType, redraw, register;
    expandConfig = function(config) {
      var key, realValue, result, value, _ref;
      result = {};
      _ref = ko.utils.unwrapObservable(config);
      for (key in _ref) {
        value = _ref[key];
        realValue = ko.utils.unwrapObservable(value);
        if (typeof realValue !== 'undefined') {
          result[key] = realValue;
        }
      }
      return result;
    };
    applyAnimations = function(node, animations) {
      var key, value, _fn;
      _fn = function(key, value) {
        var fn, trans;
        trans = null;
        if (typeof node[key] === 'function') {
          fn = function(value) {
            var error;
            try {
              return node[key](value);
            } catch (_error) {
              error = _error;
            }
          };
          if (ko.isSubscribable(value)) {
            return value.subscribe(function(newValue) {
              if (trans) {
                trans.stop();
              }
              if (newValue) {
                return trans = fn(newValue);
              }
            });
          } else {
            if (value != null) {
              return fn(value);
            }
          }
        }
      };
      for (key in animations) {
        if (!__hasProp.call(animations, key)) continue;
        value = animations[key];
        _fn(key, value);
      }
    };
    applyEvents = function(node, element, events) {
      var baseName, key, listener, listeners, name, removeEvents, value, _fn, _i, _j, _len, _len1, _ref;
      removeEvents = [];
      _ref = node.eventListeners;
      for (baseName in _ref) {
        if (!__hasProp.call(_ref, baseName)) continue;
        listeners = _ref[baseName];
        for (_i = 0, _len = listeners.length; _i < _len; _i++) {
          listener = listeners[_i];
          if (listener.name === 'knockout') {
            removeEvents.push(baseName);
          }
        }
      }
      for (_j = 0, _len1 = removeEvents.length; _j < _len1; _j++) {
        name = removeEvents[_j];
        node.off("" + name + ".knockout");
      }
      _fn = function(key, value) {
        return node.on("" + key + ".knockout", function(evt) {
          return value(element, evt);
        });
      };
      for (key in events) {
        if (!__hasProp.call(events, key)) continue;
        value = events[key];
        _fn(key, value);
      }
    };
    redraw = function(node) {
      var drawTarget, layer;
      if (node.getStage()) {
        drawTarget = (function() {
          var _i, _len, _ref;
          if (node.nodeType === 'Stage') {
            _ref = node.children;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              layer = _ref[_i];
              clearTimeout(layer._kktimeout);
            }
            return node;
          } else {
            return node.getLayer();
          }
        })();
        drawTarget = typeof node.draw === 'function' ? node : node.getLayer();
        clearTimeout(drawTarget._kktimeout);
        return drawTarget._kktimeout = setTimeout((function(drawTarget) {
          return function() {
            return drawTarget.draw();
          };
        })(drawTarget), 1);
      }
    };
    getKineticContainerIndex = function(ancestor, element, state) {
      var child, isKineticBinding, result;
      if (state == null) {
        state = {
          index: 0
        };
      }
      isKineticBinding = function(e) {
        return e._kk != null;
      };
      child = ko.virtualElements.firstChild(ancestor);
      while (child != null) {
        if (child._kk === element._kk) {
          return state.index;
        }
        if (isKineticBinding(child)) {
          state.index += 1;
        } else {
          result = getKineticContainerIndex(child, element, state);
          if (result >= 0) {
            return result;
          }
        }
        child = ko.virtualElements.nextSibling(child);
      }
      return -1;
    };
    applyInteractivityEventsCallback = function(node, valueAccessor) {
      return node.on("pointerup mouseup dragend mouseout", function() {
        var attr, attributes, values;
        attributes = node.getAttrs();
        values = valueAccessor();
        for (attr in attributes) {
          if (!attributes.hasOwnProperty(attr)) {
            continue;
          }
          if (values.hasOwnProperty(attr)) {
            values[attr](attributes[attr]);
          }
        }
        return null;
      });
    };
    makeBindingHandler = function(nodeFactory) {
      return {
        init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
          var config, index, innerContext, kk, node, params;
          params = expandConfig(valueAccessor());
          config = params.config || params.animate || params.events ? params.config : params;
          node = nodeFactory(config, element.parentNode);
          element._kk = node;
          innerContext = bindingContext.createChildContext(viewModel);
          ko.utils.extend(innerContext, {
            'knockout-kinetic': {
              parentElement: element,
              parentNode: node
            }
          });
          ko.applyBindingsToDescendants(innerContext, element);
          applyInteractivityEventsCallback(node, valueAccessor);
          kk = bindingContext['knockout-kinetic'] || {};
          if (kk.parentNode) {
            kk.parentNode.add(node);
            index = getKineticContainerIndex(kk.parentElement, element);
            if (index < 0) {
              throw new Error("element not contained within parent");
            }
            node.setZIndex(index);
          }
          ko.utils.domNodeDisposal.addDisposeCallback(element, (function(node) {
            return function() {
              var child, parent, _i, _len, _ref, _results;
              parent = node.getParent();
              if (!parent) {
                return;
              }
              _ref = parent.children;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                child = _ref[_i];
                if (!(child === node)) {
                  continue;
                }
                node.remove();
                redraw(parent);
                break;
              }
              return _results;
            };
          })(node));
          if (element.style) {
            element.style.display = 'none';
          }
          applyAnimations(node, params.animate);
          applyEvents(node, element, params.events);
          return {
            controlsDescendantBindings: true
          };
        },
        update: function(element, valueAccessor) {
          var config, node, params, parent;
          node = element._kk;
          parent = node.getParent() || null;
          params = expandConfig(valueAccessor());
          config = params.config || params.events || params.animate ? params.config : params;
          node.setAttrs(config);
          applyAnimations(node, params.animate);
          applyEvents(node, element, params.events);
          if (parent) {
            redraw(parent);
          }
          return redraw(node);
        }
      };
    };
    register = function(name, factory) {
      ko.bindingHandlers[name] = makeBindingHandler(factory);
      return ko.virtualElements.allowedBindings[name] = true;
    };
    exports['register'] = register;
    for (nodeType in Kinetic) {
      ctor = Kinetic[nodeType];
      if (!(typeof ctor === 'function')) {
        continue;
      }
      nodeFactory = (function(nodeType, ctor) {
        if (nodeType === 'Stage') {
          return function(config, parent) {
            config['container'] = parent;
            return new ctor(config);
          };
        } else {
          return function(config) {
            return new ctor(config);
          };
        }
      })(nodeType, ctor);
      register("Kinetic." + nodeType, nodeFactory);
    }
  });

}).call(this);
