// SPCD3 version 1.0.0 ESM
var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

function namespace(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
}

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

function creator(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
}

function none() {}

function selector(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}

function selection_select(select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

// Given something array like (or null), returns something that is strictly an
// array. This is used to ensure that array-like objects passed to d3.selectAll
// or selection.selectAll are converted into proper arrays when creating a
// selection; we don’t ever want to create a selection backed by a live
// HTMLCollection or NodeList. However, note that selection.selectAll will use a
// static NodeList as a group, since it safely derived from querySelectorAll.
function array$1(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}

function empty() {
  return [];
}

function selectorAll(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}

function arrayAll(select) {
  return function() {
    return array$1(select.apply(this, arguments));
  };
}

function selection_selectAll(select) {
  if (typeof select === "function") select = arrayAll(select);
  else select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$1(subgroups, parents);
}

function matcher(selector) {
  return function() {
    return this.matches(selector);
  };
}

function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}

var find = Array.prototype.find;

function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}

function childFirst() {
  return this.firstElementChild;
}

function selection_selectChild(match) {
  return this.select(match == null ? childFirst
      : childFind(typeof match === "function" ? match : childMatcher(match)));
}

var filter$1 = Array.prototype.filter;

function children() {
  return Array.from(this.children);
}

function childrenFilter(match) {
  return function() {
    return filter$1.call(this.children, match);
  };
}

function selection_selectChildren(match) {
  return this.selectAll(match == null ? children
      : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}

function selection_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

function sparse(update) {
  return new Array(update.length);
}

function selection_enter() {
  return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
}

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

function constant$3(x) {
  return function() {
    return x;
  };
}

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = new Map,
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
      exit[i] = node;
    }
  }
}

function datum(node) {
  return node.__data__;
}

function selection_data(value, key) {
  if (!arguments.length) return Array.from(this, datum);

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$3(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection$1(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

// Given some data, this returns an array-like view of it: an object that
// exposes a length property and allows numeric indexing. Note that unlike
// selectAll, this isn’t worried about “live” collections because the resulting
// array will only be used briefly while data is being bound. (It is possible to
// cause the data to change while iterating by using a key function, but please
// don’t; we’d rather avoid a gratuitous copy.)
function arraylike(data) {
  return typeof data === "object" && "length" in data
    ? data // Array, TypedArray, NodeList, array-like
    : Array.from(data); // Map, Set, iterable, string, or anything else
}

function selection_exit() {
  return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
}

function selection_join(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove(); else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

function selection_merge(context) {
  var selection = context.selection ? context.selection() : context;

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$1(merges, this._parents);
}

function selection_order() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
}

function selection_sort(compare) {
  if (!compare) compare = ascending$1;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$1(sortgroups, this._parents).order();
}

function ascending$1(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function selection_call() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

function selection_nodes() {
  return Array.from(this);
}

function selection_node() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
}

function selection_size() {
  let size = 0;
  for (const node of this) ++size; // eslint-disable-line no-unused-vars
  return size;
}

function selection_empty() {
  return !this.node();
}

function selection_each(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
}

function attrRemove$1(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$1(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$1(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS$1(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

function selection_attr(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
      : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
}

function defaultView(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
}

function styleRemove$1(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant$1(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$1(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

function selection_style(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove$1 : typeof value === "function"
            ? styleFunction$1
            : styleConstant$1)(name, value, priority == null ? "" : priority))
      : styleValue(this.node(), name);
}

function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

function selection_property(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
}

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

function selection_classed(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
}

function textRemove() {
  this.textContent = "";
}

function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

function selection_text(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction$1
          : textConstant$1)(value))
      : this.node().textContent;
}

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

function selection_html(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
}

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

function selection_raise() {
  return this.each(raise);
}

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

function selection_lower() {
  return this.each(lower);
}

function selection_append(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}

function constantNull() {
  return null;
}

function selection_insert(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

function selection_remove() {
  return this.each(remove);
}

function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_clone(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

function selection_datum(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
}

function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}

function parseTypenames$1(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

function selection_on(typename, value, options) {
  var typenames = parseTypenames$1(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

function selection_dispatch(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
}

function* selection_iterator() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) yield node;
    }
  }
}

var root = [null];

function Selection$1(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection$1([[document.documentElement]], root);
}

function selection_selection() {
  return this;
}

Selection$1.prototype = selection.prototype = {
  constructor: Selection$1,
  select: selection_select,
  selectAll: selection_selectAll,
  selectChild: selection_selectChild,
  selectChildren: selection_selectChildren,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  join: selection_join,
  merge: selection_merge,
  selection: selection_selection,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  clone: selection_clone,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch,
  [Symbol.iterator]: selection_iterator
};

function select(selector) {
  return typeof selector === "string"
      ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
      : new Selection$1([[selector]], root);
}

function create$1(name) {
  return select(creator(name).call(document.documentElement));
}

function sourceEvent(event) {
  let sourceEvent;
  while (sourceEvent = event.sourceEvent) event = sourceEvent;
  return event;
}

function pointer(event, node) {
  event = sourceEvent(event);
  if (node === undefined) node = event.currentTarget;
  if (node) {
    var svg = node.ownerSVGElement || node;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}

function selectAll(selector) {
  return typeof selector === "string"
      ? new Selection$1([document.querySelectorAll(selector)], [document.documentElement])
      : new Selection$1([array$1(selector)], root);
}

var noop = {value: () => {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get$1(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$1(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

var frame = 0, // is an animation frame pending?
    timeout$1 = 0, // is a timeout pending?
    interval = 0, // are any timers active?
    pokeDelay = 1000, // how frequently we check for clock skew
    taskHead,
    taskTail,
    clockLast = 0,
    clockNow = 0,
    clockSkew = 0,
    clock = typeof performance === "object" && performance.now ? performance : Date,
    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer$1.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer$1(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout$1 = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout$1) timeout$1 = clearTimeout(timeout$1);
  var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
  if (delay > 24) {
    if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

function timeout(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart(elapsed => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}

var emptyOn = dispatch("start", "end", "cancel", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

function schedule(node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id in schedules) return;
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}

function init(node, id) {
  var schedule = get(node, id);
  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
  return schedule;
}

function set(node, id) {
  var schedule = get(node, id);
  if (schedule.state > STARTED) throw new Error("too late; already running");
  return schedule;
}

function get(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
  return schedule;
}

function create(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer$1(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout(start);

      // Interrupt the active transition, if any.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions.
      else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(node, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) return; // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

function interrupt(node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
}

function selection_interrupt(name) {
  return this.each(function() {
    interrupt(this, name);
  });
}

function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*",
    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex, // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});

function color_formatHex() {
  return this.rgb().formatHex();
}

function color_formatHex8() {
  return this.rgb().formatHex8();
}

function color_formatHsl() {
  return hslConvert(this).formatHsl();
}

function color_formatRgb() {
  return this.rgb().formatRgb();
}

function color(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
      : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
      : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
      : null) // invalid hex
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));

function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}

function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}

function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}

function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}

function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}

function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));

function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}

function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var constant$2 = x => () => x;

function linear$1(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear$1(a, d) : constant$2(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color = gamma(y);

  function rgb$1(start, end) {
    var r = color((start = rgb(start)).r, (end = rgb(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$1.gamma = rgbGamma;

  return rgb$1;
})(1);

function numberArray(a, b) {
  if (!b) b = [];
  var n = a ? Math.min(b.length, a.length) : 0,
      c = b.slice(),
      i;
  return function(t) {
    for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
    return c;
  };
}

function isNumberArray(x) {
  return ArrayBuffer.isView(x) && !(x instanceof DataView);
}

function genericArray(a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(na),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) x[i] = interpolate$1(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];

  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
}

function date(a, b) {
  var d = new Date;
  return a = +a, b = +b, function(t) {
    return d.setTime(a * (1 - t) + b * t), d;
  };
}

function interpolateNumber(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

function object(a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolate$1(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    reB = new RegExp(reA.source, "g");

function zero$1(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

function interpolateString(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero$1(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

function interpolate$1(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant$2(b)
      : (t === "number" ? interpolateNumber
      : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
      : b instanceof color ? interpolateRgb
      : b instanceof Date ? date
      : isNumberArray(b) ? numberArray
      : Array.isArray(b) ? genericArray
      : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
      : interpolateNumber)(a, b);
}

function interpolateRound(a, b) {
  return a = +a, b = +b, function(t) {
    return Math.round(a * (1 - t) + b * t);
  };
}

var degrees = 180 / Math.PI;

var identity$3 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

function decompose(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
}

var svgNode;

/* eslint-disable no-undef */
function parseCss(value) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m.isIdentity ? identity$3 : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
}

function parseSvg(value) {
  if (value == null) return identity$3;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$3;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function(a, b) {
    var s = [], // string constants and placeholders
        q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

function transition_tween(name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
}

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function() {
    var schedule = set(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function(node) {
    return get(node, id).value[name];
  };
}

function interpolate(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber
      : b instanceof color ? interpolateRgb
      : (c = color(b)) ? (b = c, interpolateRgb)
      : interpolateString)(a, b);
}

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrConstantNS(fullname, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function attrFunctionNS(fullname, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function transition_attr(name, value) {
  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
  return this.attrTween(name, typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
      : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
      : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
}

function attrInterpolate(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}

function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}

function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_attrTween(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}

function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}

function transition_delay(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? delayFunction
          : delayConstant)(id, value))
      : get(this.node(), id).delay;
}

function durationFunction(id, value) {
  return function() {
    set(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function() {
    set(this, id).duration = value;
  };
}

function transition_duration(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? durationFunction
          : durationConstant)(id, value))
      : get(this.node(), id).duration;
}

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error;
  return function() {
    set(this, id).ease = value;
  };
}

function transition_ease(value) {
  var id = this._id;

  return arguments.length
      ? this.each(easeConstant(id, value))
      : get(this.node(), id).ease;
}

function easeVarying(id, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function") throw new Error;
    set(this, id).ease = v;
  };
}

function transition_easeVarying(value) {
  if (typeof value !== "function") throw new Error;
  return this.each(easeVarying(this._id, value));
}

function transition_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
}

function transition_merge(transition) {
  if (transition._id !== this._id) throw new Error;

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
}

function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0, on1, sit = start(name) ? init : set;
  return function() {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

function transition_on(name, listener) {
  var id = this._id;

  return arguments.length < 2
      ? get(this.node(), id).on.on(name)
      : this.each(onFunction(id, name, listener));
}

function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id) return;
    if (parent) parent.removeChild(this);
  };
}

function transition_remove() {
  return this.on("end.remove", removeFunction(this._id));
}

function transition_select(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
}

function transition_selectAll(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
}

var Selection = selection.prototype.constructor;

function transition_selection() {
  return new Selection(this._groups, this._parents);
}

function styleNull(name, interpolate) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, string10 = string1);
  };
}

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function styleFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        value1 = value(this),
        string1 = value1 + "";
    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function styleMaybeRemove(id, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
  return function() {
    var schedule = set(this, id),
        on = schedule.on,
        listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

    schedule.on = on1;
  };
}

function transition_style(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
  return value == null ? this
      .styleTween(name, styleNull(name, i))
      .on("end.style." + name, styleRemove(name))
    : typeof value === "function" ? this
      .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
      .each(styleMaybeRemove(this._id, name))
    : this
      .styleTween(name, styleConstant(name, i, value), priority)
      .on("end.style." + name, null);
}

function styleInterpolate(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}

function styleTween(name, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}

function transition_styleTween(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

function transition_text(value) {
  return this.tween("text", typeof value === "function"
      ? textFunction(tweenValue(this, "text", value))
      : textConstant(value == null ? "" : value + ""));
}

function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}

function textTween(value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_textTween(value) {
  var key = "text";
  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, textTween(value));
}

function transition_transition() {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
}

function transition_end() {
  var on0, on1, that = this, id = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = {value: reject},
        end = {value: function() { if (--size === 0) resolve(); }};

    that.each(function() {
      var schedule = set(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }

      schedule.on = on1;
    });

    // The selection was empty, resolve end immediately
    if (size === 0) resolve();
  });
}

var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  textTween: transition_textTween,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease,
  easeVarying: transition_easeVarying,
  end: transition_end,
  [Symbol.iterator]: selection_prototype[Symbol.iterator]
};

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      throw new Error(`transition ${id} not found`);
    }
  }
  return timing;
}

function selection_transition(name) {
  var id,
      timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
}

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

// These are typically used in conjunction with noevent to ensure that we can
// preventDefault on the event.
const nonpassive = {passive: false};
const nonpassivecapture = {capture: true, passive: false};

function nopropagation(event) {
  event.stopImmediatePropagation();
}

function noevent(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

function nodrag(view) {
  var root = view.document.documentElement,
      selection = select(view).on("dragstart.drag", noevent, nonpassivecapture);
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", noevent, nonpassivecapture);
  } else {
    root.__noselect = root.style.MozUserSelect;
    root.style.MozUserSelect = "none";
  }
}

function yesdrag(view, noclick) {
  var root = view.document.documentElement,
      selection = select(view).on("dragstart.drag", null);
  if (noclick) {
    selection.on("click.drag", noevent, nonpassivecapture);
    setTimeout(function() { selection.on("click.drag", null); }, 0);
  }
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", null);
  } else {
    root.style.MozUserSelect = root.__noselect;
    delete root.__noselect;
  }
}

var constant$1 = x => () => x;

function DragEvent(type, {
  sourceEvent,
  subject,
  target,
  identifier,
  active,
  x, y, dx, dy,
  dispatch
}) {
  Object.defineProperties(this, {
    type: {value: type, enumerable: true, configurable: true},
    sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
    subject: {value: subject, enumerable: true, configurable: true},
    target: {value: target, enumerable: true, configurable: true},
    identifier: {value: identifier, enumerable: true, configurable: true},
    active: {value: active, enumerable: true, configurable: true},
    x: {value: x, enumerable: true, configurable: true},
    y: {value: y, enumerable: true, configurable: true},
    dx: {value: dx, enumerable: true, configurable: true},
    dy: {value: dy, enumerable: true, configurable: true},
    _: {value: dispatch}
  });
}

DragEvent.prototype.on = function() {
  var value = this._.on.apply(this._, arguments);
  return value === this._ ? this : value;
};

// Ignore right-click, since that should open the context menu.
function defaultFilter(event) {
  return !event.ctrlKey && !event.button;
}

function defaultContainer() {
  return this.parentNode;
}

function defaultSubject(event, d) {
  return d == null ? {x: event.x, y: event.y} : d;
}

function defaultTouchable() {
  return navigator.maxTouchPoints || ("ontouchstart" in this);
}

function drag() {
  var filter = defaultFilter,
      container = defaultContainer,
      subject = defaultSubject,
      touchable = defaultTouchable,
      gestures = {},
      listeners = dispatch("start", "drag", "end"),
      active = 0,
      mousedownx,
      mousedowny,
      mousemoving,
      touchending,
      clickDistance2 = 0;

  function drag(selection) {
    selection
        .on("mousedown.drag", mousedowned)
      .filter(touchable)
        .on("touchstart.drag", touchstarted)
        .on("touchmove.drag", touchmoved, nonpassive)
        .on("touchend.drag touchcancel.drag", touchended)
        .style("touch-action", "none")
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }

  function mousedowned(event, d) {
    if (touchending || !filter.call(this, event, d)) return;
    var gesture = beforestart(this, container.call(this, event, d), event, d, "mouse");
    if (!gesture) return;
    select(event.view)
      .on("mousemove.drag", mousemoved, nonpassivecapture)
      .on("mouseup.drag", mouseupped, nonpassivecapture);
    nodrag(event.view);
    nopropagation(event);
    mousemoving = false;
    mousedownx = event.clientX;
    mousedowny = event.clientY;
    gesture("start", event);
  }

  function mousemoved(event) {
    noevent(event);
    if (!mousemoving) {
      var dx = event.clientX - mousedownx, dy = event.clientY - mousedowny;
      mousemoving = dx * dx + dy * dy > clickDistance2;
    }
    gestures.mouse("drag", event);
  }

  function mouseupped(event) {
    select(event.view).on("mousemove.drag mouseup.drag", null);
    yesdrag(event.view, mousemoving);
    noevent(event);
    gestures.mouse("end", event);
  }

  function touchstarted(event, d) {
    if (!filter.call(this, event, d)) return;
    var touches = event.changedTouches,
        c = container.call(this, event, d),
        n = touches.length, i, gesture;

    for (i = 0; i < n; ++i) {
      if (gesture = beforestart(this, c, event, d, touches[i].identifier, touches[i])) {
        nopropagation(event);
        gesture("start", event, touches[i]);
      }
    }
  }

  function touchmoved(event) {
    var touches = event.changedTouches,
        n = touches.length, i, gesture;

    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        noevent(event);
        gesture("drag", event, touches[i]);
      }
    }
  }

  function touchended(event) {
    var touches = event.changedTouches,
        n = touches.length, i, gesture;

    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() { touchending = null; }, 500); // Ghost clicks are delayed!
    for (i = 0; i < n; ++i) {
      if (gesture = gestures[touches[i].identifier]) {
        nopropagation(event);
        gesture("end", event, touches[i]);
      }
    }
  }

  function beforestart(that, container, event, d, identifier, touch) {
    var dispatch = listeners.copy(),
        p = pointer(touch || event, container), dx, dy,
        s;

    if ((s = subject.call(that, new DragEvent("beforestart", {
        sourceEvent: event,
        target: drag,
        identifier,
        active,
        x: p[0],
        y: p[1],
        dx: 0,
        dy: 0,
        dispatch
      }), d)) == null) return;

    dx = s.x - p[0] || 0;
    dy = s.y - p[1] || 0;

    return function gesture(type, event, touch) {
      var p0 = p, n;
      switch (type) {
        case "start": gestures[identifier] = gesture, n = active++; break;
        case "end": delete gestures[identifier], --active; // falls through
        case "drag": p = pointer(touch || event, container), n = active; break;
      }
      dispatch.call(
        type,
        that,
        new DragEvent(type, {
          sourceEvent: event,
          subject: s,
          target: drag,
          identifier,
          active: n,
          x: p[0] + dx,
          y: p[1] + dy,
          dx: p[0] - p0[0],
          dy: p[1] - p0[1],
          dispatch
        }),
        d
      );
    };
  }

  drag.filter = function(_) {
    return arguments.length ? (filter = typeof _ === "function" ? _ : constant$1(!!_), drag) : filter;
  };

  drag.container = function(_) {
    return arguments.length ? (container = typeof _ === "function" ? _ : constant$1(_), drag) : container;
  };

  drag.subject = function(_) {
    return arguments.length ? (subject = typeof _ === "function" ? _ : constant$1(_), drag) : subject;
  };

  drag.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant$1(!!_), drag) : touchable;
  };

  drag.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? drag : value;
  };

  drag.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, drag) : Math.sqrt(clickDistance2);
  };

  return drag;
}

// This file is auto-generated by `gulp icons`.
// To change the icons, edit the SVG files in `src/lib/icons/svg`.
function getArrowBottomCursor() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 86\">\n  <path fill=\"white\" fill-opacity=\"0.5\" stroke=\"black\" stroke-width=\"7\" d=\"M 7 7 L 93 7 L 50 79 z\"/>\n</svg>";
}
function getArrowBottomCursorMeta() {
    return { "hotspotX": 50, "hotspotY": 86, "viewBoxMinX": 0, "viewBoxMinY": 0, "viewBoxWidth": 100, "viewBoxHeight": 86 };
}
function getArrowBottom() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 86\">\n  <path fill=\"rgb(242, 242, 76)\" fill-opacity=\"1\" stroke=\"black\" stroke-width=\"7\" d=\"M 7 7 L 93 7 L 50 79 z\"/>\n</svg>";
}
function getArrowBottomActive() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 86\">\n  <path fill=\"rgb(255, 255, 0)\" fill-opacity=\"1\" stroke=\"black\" stroke-width=\"7\" d=\"M 7 7 L 93 7 L 50 79 z\"/>\n</svg>";
}
function getArrowDown() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 6 10\">\n  <path fill=\"currentColor\" d=\"M 0 6 L 2 6 L 2 0 L 4 0 L 4 6 L 6 6 L 3 10 z\"/>\n</svg>";
}
function getArrowDownCursor() {
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"#f9f9f9\" stroke=\"#000\" viewBox=\"0 0 3.9687499 3.96875\">\n  <path stroke-width=\"0.318611\" d=\"m 1.1578161,0.21695335 c -0.061702,-0.0329161 -0.81488983,-0.0133494 -0.81488983,-0.0133494 0,0 0.54265514,0.55608717 0.93827003,0.96284295 0.4433991,0.4558857 0.4777944,0.8151048 0.4777944,0.8151048 H 0.5130859 l 1.6505985,1.7274342 1.434036,-1.7247007 c -0.534692,-0.00674 -0.7326378,0.00633 -1.0334189,0.013349 0,0 -0.1208928,-1.09485632 -1.4064854,-1.78068085 z\" />\n</svg>";
}
function getArrowDownCursorMeta() {
    return { "hotspotX": 2.1636844, "hotspotY": 3.70982115, "viewBoxMinX": 0, "viewBoxMinY": 0, "viewBoxWidth": 3.9687499, "viewBoxHeight": 3.96875 };
}
function getArrowLeftAndRight() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 61\">\n  <path fill=\"white\" stroke=\"black\" stroke-width=\"6\" d=\"M 7 30 L 30 7 L 30 20 L 70 20 L 70 7 L 93 30 L 70 54 L 70 40 L 30 40 L 30 54 z\"/>\n</svg>";
}
function getArrowLeftAndRightMeta() {
    return { "hotspotX": 50, "hotspotY": 33.5, "viewBoxMinX": 0, "viewBoxMinY": 0, "viewBoxWidth": 100, "viewBoxHeight": 61 };
}
function getArrowLeft() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 61\">\n  <path fill=\"white\" stroke=\"black\" stroke-width=\"6\" d=\"M 7 20 L 60 20 L 60 7 L 93 30 L 60 55 L 60 40 L 7 40 z\" />\n</svg>";
}
function getArrowLeftMeta() {
    return { "hotspotX": 100, "hotspotY": 30.5, "viewBoxMinX": 0, "viewBoxMinY": 0, "viewBoxWidth": 100, "viewBoxHeight": 61 };
}
function getArrowRight() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 61\">\n  <path fill=\"white\" stroke=\"black\" stroke-width=\"6\" d=\"M 7 30 L 40 7 L 40 20 L 93 20 L 93 40 L 40 40 L 40 54 z\"/>\n</svg>";
}
function getArrowRightMeta() {
    return { "hotspotX": 0, "hotspotY": 30.5, "viewBoxMinX": 0, "viewBoxMinY": 0, "viewBoxWidth": 100, "viewBoxHeight": 61 };
}
function getArrowTopAndBottom() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 90 110\">\n  <path fill=\"white\" stroke=\"black\" stroke-width=\"6\" d=\"M 7 50 L 45 7 L 83 50 z\"/>\n  <path fill=\"white\" stroke=\"black\" stroke-width=\"6\" d=\"M 7 60 L 45 103 L 83 60 z\"/>\n</svg>";
}
function getArrowTopAndBottomMeta() {
    return { "hotspotX": 45, "hotspotY": 55, "viewBoxMinX": 0, "viewBoxMinY": 0, "viewBoxWidth": 90, "viewBoxHeight": 110 };
}
function getArrowTopCursor() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 86\">\n  <path fill=\"white\" fill-opacity=\"0.7\" stroke=\"black\" stroke-width=\"7\" d=\"M 7 79 L 50 7 L 93 79 z\"/>\n</svg>";
}
function getArrowTopCursorMeta() {
    return { "hotspotX": 50, "hotspotY": 0, "viewBoxMinX": 0, "viewBoxMinY": 0, "viewBoxWidth": 100, "viewBoxHeight": 86 };
}
function getArrowTop() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 86\">\n  <path fill=\"rgb(242, 242, 76)\" fill-opacity=\"1\" stroke=\"black\" stroke-width=\"7\" d=\"M 7 79 L 50 7 L 93 79 z\"/>\n</svg>";
}
function getArrowTopActive() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 86\">\n  <path fill=\"rgb(255, 255, 0)\" fill-opacity=\"1\" stroke=\"black\" stroke-width=\"7\" d=\"M 7 79 L 50 7 L 93 79 z\"/>\n</svg>";
}
function getArrowUp() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 6 10\">\n  <path fill=\"currentColor\" d=\"M 0 4 L 3 0 L 6 4 L 4 4 L 4 10 L 2 10 L 2 4 z\"/>\n</svg>";
}
function getArrowUpCursor() {
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"#f9f9f9\" stroke=\"#000\" viewBox=\"0 0 3.9687499 3.96875\">\n  <path stroke-width=\"0.318611\" d=\"m 2.7893699,3.7809852 c 0.061702,0.032916 0.8148899,0.013349 0.8148899,0.013349 0,0 -0.5426551,-0.5560871 -0.9382701,-0.9628429 C 2.2225906,2.375606 2.1881953,2.0163869 2.1881953,2.0163869 H 3.4341002 L 1.7835016,0.28895256 0.34946563,2.0136534 c 0.534692,0.00674 0.73263777,-0.00633 1.03341887,-0.013349 0,0 0.1208928,1.0948563 1.4064854,1.7806808 z\" />\n</svg>";
}
function getArrowUpCursorMeta() {
    return { "hotspotX": 1.7835016, "hotspotY": 0.28895256, "viewBoxMinX": 0, "viewBoxMinY": 0, "viewBoxWidth": 3.9687499, "viewBoxHeight": 3.96875 };
}
function getRefreshIcon() {
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\">\n  <polyline points=\"6.5 4 8.5 4 8.5 2\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n  <path d=\"M8.5 4 L 7 2.5 A 3 3 0 0 0 2.5 2.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n  <polyline points=\"3.5 6 1.5 6 1.5 8\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n  <path d=\"M1.5 6 L 2.5 7 A 3 3 0 0 0 7 7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n</svg>";
}
function getTableIcon() {
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\">\n  <rect x=\"0.5\" y=\"0.5\" width=\"9\" height=\"9\" rx=\"1\" ry=\"1\" stroke=\"currentColor\" stroke-width=\"0.5\" fill=\"none\" />\n  <line x1=\"0.5\" y1=\"3.3\" x2=\"9.5\" y2=\"3.3\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n  <line x1=\"0.5\" y1=\"6.6\" x2=\"9.5\" y2=\"6.6\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n  <line x1=\"3.3\" y1=\"0.5\" x2=\"3.3\" y2=\"9.5\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n  <line x1=\"6.6\" y1=\"0.5\" x2=\"6.6\" y2=\"9.5\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n</svg>";
}
function getExpandToolbarIcon() {
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -0.5 6 6\">\n  <polyline points=\"1 0.75 3 2.75 1 4.75\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.25\"/>\n  <polyline points=\"3 0.75 5 2.75 3 4.75\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.25\"/>\n</svg>";
}
function getCollapseToolbarIcon() {
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 -0.5 6 6\">\n  <polyline points=\"3 0.75 1 2.75 3 4.75\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.25\"/>\n  <polyline points=\"5 0.75 3 2.75 5 4.75\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.25\"/>\n</svg>";
}
function getResetIcon() {
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\">\n  <g transform=\"scale(1,0.833) translate(0,1.2)\">\n    <path d=\"M8 4 A4 3.5 0 1 1 2 4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n    <polyline points=\"3 5.5 2 4 0 4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n    <path d=\"M5 1 L 5 6.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n  </g>\n</svg>";
}
function getDownloadButton() {
    return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\">\n  <path fill=\"currentColor\" d=\"M 4.65 7 L 4.65 1.4 L 5.25 1.4 L 5.25 7 z\"/>\n  <polyline points=\"2.07 5.00 4.93 7.14 7.79 5.00\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"0.5\"/>\n  <path fill=\"currentColor\" d=\"M 2 8.5 L 8 8.5 L 8 9 L 2 9 z\"/>\n</svg>";
}

function cleanString(stringValue) {
    let value = stringValue
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    if (/^[0-9]/.test(value)) {
        value = "x-" + value;
    }
    return value;
}
function setSize(stringValue, size) {
    return stringValue.replace("viewBox", `width="${size}" height="${size}" viewBox`);
}
const BRUSH_IDLE_FILL = "rgb(242, 242, 76)";
const BRUSH_ACTIVE_FILL = "rgb(255, 255, 0)";
const ARROW_UP_PATH = "M 0 4 L 3 0 L 6 4 L 4 4 L 4 10 L 2 10 L 2 4 z";
const ARROW_DOWN_PATH = "M 0 6 L 2 6 L 2 0 L 4 0 L 4 6 L 6 6 L 3 10 z";
function getInactiveLineStroke() {
    const isDark = typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    return isDark ? "rgba(177, 188, 199, 0.18)" : "rgba(211, 211, 211, 0.4)";
}
function applyThemeToSvg(svg) {
    const isDark = typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    const textColor = isDark ? "#eef3f7" : "#000000";
    const surfaceColor = isDark ? "#1b2126" : "#dbe3ea";
    const cursorSurfaceColor = isDark ? "#1b2126" : "#e7edf3";
    const handleColor = BRUSH_IDLE_FILL;
    const handleActiveColor = BRUSH_ACTIVE_FILL;
    return svg
        .replaceAll("currentColor", textColor)
        .replaceAll('stroke="black"', `stroke="${textColor}"`)
        .replaceAll('stroke="#000"', `stroke="${textColor}"`)
        .replaceAll('fill="black"', `fill="${textColor}"`)
        .replaceAll('fill="#000"', `fill="${textColor}"`)
        .replaceAll('stroke="white"', `stroke="${surfaceColor}"`)
        .replaceAll('fill="white"', `fill="${surfaceColor}"`)
        .replaceAll('fill="#fff"', `fill="${surfaceColor}"`)
        .replaceAll('fill="#ffffff"', `fill="${surfaceColor}"`)
        .replaceAll('fill="rgb(242, 242, 76)"', `fill="${handleColor}"`)
        .replaceAll('fill="rgb(255, 255, 0)"', `fill="${handleActiveColor}"`)
        .replaceAll('fill="rgb(214, 176, 28)"', `fill="${handleColor}"`)
        .replaceAll('fill="rgb(235, 196, 44)"', `fill="${handleActiveColor}"`)
        .replaceAll('fill="#f9f9f9"', `fill="${cursorSurfaceColor}"`);
}
function applyThemeToBrushSvg(svg) {
    const isDark = typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    const strokeColor = isDark ? "#10233a" : "black";
    const handleColor = BRUSH_IDLE_FILL;
    const handleActiveColor = BRUSH_ACTIVE_FILL;
    const surfaceColor = isDark ? "#1b2126" : "#dbe3ea";
    let themed = svg
        .replaceAll('stroke="#000000"', `stroke="${strokeColor}"`)
        .replaceAll('stroke="#000"', `stroke="${strokeColor}"`)
        .replaceAll('stroke="black"', `stroke="${strokeColor}"`)
        .replaceAll('fill="rgb(242, 242, 76)"', `fill="${handleColor}"`)
        .replaceAll('fill="rgb(255, 255, 0)"', `fill="${handleActiveColor}"`)
        .replaceAll('fill="rgb(214, 176, 28)"', `fill="${handleColor}"`)
        .replaceAll('fill="rgb(235, 196, 44)"', `fill="${handleActiveColor}"`)
        .replaceAll('fill="white"', `fill="${surfaceColor}"`)
        .replaceAll('fill="#fff"', `fill="${surfaceColor}"`)
        .replaceAll('fill="#ffffff"', `fill="${surfaceColor}"`);
    if (isDark) {
        themed = themed
            .replaceAll('stroke-width="0.4"', 'stroke-width="0.22"')
            .replaceAll('stroke-width="0.400000"', 'stroke-width="0.22"');
    }
    return themed;
}
function getCursorHotspot(meta, size) {
    const x = Math.round(((meta.hotspotX - meta.viewBoxMinX) / meta.viewBoxWidth) * size);
    const y = Math.round(((meta.hotspotY - meta.viewBoxMinY) / meta.viewBoxHeight) * size);
    return [x, y];
}
function throttle(func, delay) {
    let lastExecTime = 0;
    return function (...args) {
        const context = this;
        const currentTime = Date.now();
        if (currentTime - lastExecTime >= delay) {
            func.apply(context, args);
            lastExecTime = currentTime;
        }
    };
}
function digits(value) {
    return value.toString().length;
}
function addNumberOfDigs(number, currentPosOfDims, dimensionName, key) {
    const newObject = {};
    newObject[key] = number;
    const target = currentPosOfDims.find((obj) => obj.key == dimensionName);
    Object.assign(target, newObject);
}
function getMouseCoords(event, targetContainer = document.body) {
    if (targetContainer === document.body) {
        return [event.clientX + window.scrollX, event.clientY + window.scrollY];
    }
    else {
        const rect = targetContainer.getBoundingClientRect();
        return [event.clientX - rect.left, event.clientY - rect.top];
    }
}

let paddingXaxis;
let width;
let height;
let yAxis;
let parcoords = {
    xScales: {},
    yScales: {},
    dragging: {},
    dragPosStart: {},
    currentPosOfDims: [],
    newFeatures: null,
    features: [],
    newDataset: null,
    data: null,
};
let active;
let key;
let svg;
let hoverlabel;
let columns;
let initDimension;
let thickness;
let numberOfRecords;
let numberOfDimensions;
let resetContentData;
let dimensionSpacingVar = null;
function setContent(contentdata) {
    resetContentData = contentdata;
}
function setHoverLabel(label) {
    hoverlabel = label;
}
function setYaxis(axis) {
    yAxis = axis;
}
function setColumns(cols) {
    columns = cols;
}
function setSvg(svgData) {
    svg = svgData;
}
function setWidth(value) {
    width = value;
}
function setHeight(value) {
    height = value;
}
function setPaddingXaxis(value) {
    paddingXaxis = value;
}
function setInitDimension(dimensions) {
    initDimension = Array.isArray(dimensions) ? [...dimensions] : dimensions;
}
function setActive(paths) {
    active = paths;
}
function setXScales(value) {
    parcoords.xScales = value;
}
function setYScales(value) {
    parcoords.yScales = value;
}
function setNewFeatures(value) {
    parcoords.newFeatures = value;
}
function setFeatures(value) {
    parcoords.features = value;
}
function setNewDataset(value) {
    parcoords.newDataset = value;
}
function setData(value) {
    parcoords.data = value;
}
function setKey(value) {
    key = value;
}
function setLineThickness(value) {
    thickness = value;
}
function getLineThickness() {
    return thickness;
}
function setNumberOfRecords(value) {
    numberOfRecords = value;
}
function setNumberOfDimensions(value) {
    numberOfDimensions = value;
}
function setDimensionSpacingVar(value) {
    dimensionSpacingVar = value;
}

function ascending(a, b) {
  return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function descending(a, b) {
  return a == null || b == null ? NaN
    : b < a ? -1
    : b > a ? 1
    : b >= a ? 0
    : NaN;
}

function bisector(f) {
  let compare1, compare2, delta;

  // If an accessor is specified, promote it to a comparator. In this case we
  // can test whether the search value is (self-) comparable. We can’t do this
  // for a comparator (except for specific, known comparators) because we can’t
  // tell if the comparator is symmetric, and an asymmetric comparator can’t be
  // used to test whether a single value is comparable.
  if (f.length !== 2) {
    compare1 = ascending;
    compare2 = (d, x) => ascending(f(d), x);
    delta = (d, x) => f(d) - x;
  } else {
    compare1 = f === ascending || f === descending ? f : zero;
    compare2 = f;
    delta = f;
  }

  function left(a, x, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        const mid = (lo + hi) >>> 1;
        if (compare2(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }

  function right(a, x, lo = 0, hi = a.length) {
    if (lo < hi) {
      if (compare1(x, x) !== 0) return hi;
      do {
        const mid = (lo + hi) >>> 1;
        if (compare2(a[mid], x) <= 0) lo = mid + 1;
        else hi = mid;
      } while (lo < hi);
    }
    return lo;
  }

  function center(a, x, lo = 0, hi = a.length) {
    const i = left(a, x, lo, hi - 1);
    return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
  }

  return {left, center, right};
}

function zero() {
  return 0;
}

function number$2(x) {
  return x === null ? NaN : +x;
}

const ascendingBisect = bisector(ascending);
const bisectRight = ascendingBisect.right;
bisector(number$2).center;

class InternMap extends Map {
  constructor(entries, key = keyof) {
    super();
    Object.defineProperties(this, {_intern: {value: new Map()}, _key: {value: key}});
    if (entries != null) for (const [key, value] of entries) this.set(key, value);
  }
  get(key) {
    return super.get(intern_get(this, key));
  }
  has(key) {
    return super.has(intern_get(this, key));
  }
  set(key, value) {
    return super.set(intern_set(this, key), value);
  }
  delete(key) {
    return super.delete(intern_delete(this, key));
  }
}

function intern_get({_intern, _key}, value) {
  const key = _key(value);
  return _intern.has(key) ? _intern.get(key) : value;
}

function intern_set({_intern, _key}, value) {
  const key = _key(value);
  if (_intern.has(key)) return _intern.get(key);
  _intern.set(key, value);
  return value;
}

function intern_delete({_intern, _key}, value) {
  const key = _key(value);
  if (_intern.has(key)) {
    value = _intern.get(key);
    _intern.delete(key);
  }
  return value;
}

function keyof(value) {
  return value !== null && typeof value === "object" ? value.valueOf() : value;
}

const e10 = Math.sqrt(50),
    e5 = Math.sqrt(10),
    e2 = Math.sqrt(2);

function tickSpec(start, stop, count) {
  const step = (stop - start) / Math.max(0, count),
      power = Math.floor(Math.log10(step)),
      error = step / Math.pow(10, power),
      factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
  let i1, i2, inc;
  if (power < 0) {
    inc = Math.pow(10, -power) / factor;
    i1 = Math.round(start * inc);
    i2 = Math.round(stop * inc);
    if (i1 / inc < start) ++i1;
    if (i2 / inc > stop) --i2;
    inc = -inc;
  } else {
    inc = Math.pow(10, power) * factor;
    i1 = Math.round(start / inc);
    i2 = Math.round(stop / inc);
    if (i1 * inc < start) ++i1;
    if (i2 * inc > stop) --i2;
  }
  if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start, stop, count * 2);
  return [i1, i2, inc];
}

function ticks(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  if (!(count > 0)) return [];
  if (start === stop) return [start];
  const reverse = stop < start, [i1, i2, inc] = reverse ? tickSpec(stop, start, count) : tickSpec(start, stop, count);
  if (!(i2 >= i1)) return [];
  const n = i2 - i1 + 1, ticks = new Array(n);
  if (reverse) {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) / -inc;
    else for (let i = 0; i < n; ++i) ticks[i] = (i2 - i) * inc;
  } else {
    if (inc < 0) for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) / -inc;
    else for (let i = 0; i < n; ++i) ticks[i] = (i1 + i) * inc;
  }
  return ticks;
}

function tickIncrement(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  return tickSpec(start, stop, count)[2];
}

function tickStep(start, stop, count) {
  stop = +stop, start = +start, count = +count;
  const reverse = stop < start, inc = reverse ? tickIncrement(stop, start, count) : tickIncrement(start, stop, count);
  return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
}

function range(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
}

function initRange(domain, range) {
  switch (arguments.length) {
    case 0: break;
    case 1: this.range(domain); break;
    default: this.range(range).domain(domain); break;
  }
  return this;
}

const implicit = Symbol("implicit");

function ordinal() {
  var index = new InternMap(),
      domain = [],
      range = [],
      unknown = implicit;

  function scale(d) {
    let i = index.get(d);
    if (i === undefined) {
      if (unknown !== implicit) return unknown;
      index.set(d, i = domain.push(d) - 1);
    }
    return range[i % range.length];
  }

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = new InternMap();
    for (const value of _) {
      if (index.has(value)) continue;
      index.set(value, domain.push(value) - 1);
    }
    return scale;
  };

  scale.range = function(_) {
    return arguments.length ? (range = Array.from(_), scale) : range.slice();
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function() {
    return ordinal(domain, range).unknown(unknown);
  };

  initRange.apply(scale, arguments);

  return scale;
}

function band() {
  var scale = ordinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      r0 = 0,
      r1 = 1,
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;

  function rescale() {
    var n = domain().length,
        reverse = r1 < r0,
        start = reverse ? r1 : r0,
        stop = reverse ? r0 : r1;
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = range(n).map(function(i) { return start + step * i; });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function(_) {
    return arguments.length ? ([r0, r1] = _, r0 = +r0, r1 = +r1, rescale()) : [r0, r1];
  };

  scale.rangeRound = function(_) {
    return [r0, r1] = _, r0 = +r0, r1 = +r1, round = true, rescale();
  };

  scale.bandwidth = function() {
    return bandwidth;
  };

  scale.step = function() {
    return step;
  };

  scale.round = function(_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function(_) {
    return arguments.length ? (paddingInner = Math.min(1, paddingOuter = +_), rescale()) : paddingInner;
  };

  scale.paddingInner = function(_) {
    return arguments.length ? (paddingInner = Math.min(1, _), rescale()) : paddingInner;
  };

  scale.paddingOuter = function(_) {
    return arguments.length ? (paddingOuter = +_, rescale()) : paddingOuter;
  };

  scale.align = function(_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };

  scale.copy = function() {
    return band(domain(), [r0, r1])
        .round(round)
        .paddingInner(paddingInner)
        .paddingOuter(paddingOuter)
        .align(align);
  };

  return initRange.apply(rescale(), arguments);
}

function pointish(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;

  scale.copy = function() {
    return pointish(copy());
  };

  return scale;
}

function point() {
  return pointish(band.apply(null, arguments).paddingInner(1));
}

function constants(x) {
  return function() {
    return x;
  };
}

function number$1(x) {
  return +x;
}

var unit = [0, 1];

function identity$2(x) {
  return x;
}

function normalize(a, b) {
  return (b -= (a = +a))
      ? function(x) { return (x - a) / b; }
      : constants(isNaN(b) ? NaN : 0.5);
}

function clamper(a, b) {
  var t;
  if (a > b) t = a, a = b, b = t;
  return function(x) { return Math.max(a, Math.min(b, x)); };
}

// normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
function bimap(domain, range, interpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
  else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
  return function(x) { return r0(d0(x)); };
}

function polymap(domain, range, interpolate) {
  var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++i < j) {
    d[i] = normalize(domain[i], domain[i + 1]);
    r[i] = interpolate(range[i], range[i + 1]);
  }

  return function(x) {
    var i = bisectRight(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy(source, target) {
  return target
      .domain(source.domain())
      .range(source.range())
      .interpolate(source.interpolate())
      .clamp(source.clamp())
      .unknown(source.unknown());
}

function transformer() {
  var domain = unit,
      range = unit,
      interpolate = interpolate$1,
      transform,
      untransform,
      unknown,
      clamp = identity$2,
      piecewise,
      output,
      input;

  function rescale() {
    var n = Math.min(domain.length, range.length);
    if (clamp !== identity$2) clamp = clamper(domain[0], domain[n - 1]);
    piecewise = n > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
  }

  scale.invert = function(y) {
    return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
  };

  scale.domain = function(_) {
    return arguments.length ? (domain = Array.from(_, number$1), rescale()) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = Array.from(_), interpolate = interpolateRound, rescale();
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = _ ? true : identity$2, rescale()) : clamp !== identity$2;
  };

  scale.interpolate = function(_) {
    return arguments.length ? (interpolate = _, rescale()) : interpolate;
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  return function(t, u) {
    transform = t, untransform = u;
    return rescale();
  };
}

function continuous() {
  return transformer()(identity$2, identity$2);
}

function formatDecimal(x) {
  return Math.abs(x = Math.round(x)) >= 1e21
      ? x.toLocaleString("en").replace(/,/g, "")
      : x.toString(10);
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimalParts(1.23) returns ["123", 0].
function formatDecimalParts(x, p) {
  if (!isFinite(x) || x === 0) return null; // NaN, ±Infinity, ±0
  var i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e"), coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
}

function exponent(x) {
  return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
}

function formatGroup(grouping, thousands) {
  return function(value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
}

function formatNumerals(numerals) {
  return function(value) {
    return value.replace(/[0-9]/g, function(i) {
      return numerals[+i];
    });
  };
}

// [[fill]align][sign][symbol][0][width][,][.precision][~][type]
var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

function formatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
  var match;
  return new FormatSpecifier({
    fill: match[1],
    align: match[2],
    sign: match[3],
    symbol: match[4],
    zero: match[5],
    width: match[6],
    comma: match[7],
    precision: match[8] && match[8].slice(1),
    trim: match[9],
    type: match[10]
  });
}

formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

function FormatSpecifier(specifier) {
  this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
  this.align = specifier.align === undefined ? ">" : specifier.align + "";
  this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
  this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
  this.zero = !!specifier.zero;
  this.width = specifier.width === undefined ? undefined : +specifier.width;
  this.comma = !!specifier.comma;
  this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
  this.trim = !!specifier.trim;
  this.type = specifier.type === undefined ? "" : specifier.type + "";
}

FormatSpecifier.prototype.toString = function() {
  return this.fill
      + this.align
      + this.sign
      + this.symbol
      + (this.zero ? "0" : "")
      + (this.width === undefined ? "" : Math.max(1, this.width | 0))
      + (this.comma ? "," : "")
      + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
      + (this.trim ? "~" : "")
      + this.type;
};

// Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
function formatTrim(s) {
  out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (s[i]) {
      case ".": i0 = i1 = i; break;
      case "0": if (i0 === 0) i0 = i; i1 = i; break;
      default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
    }
  }
  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
}

var prefixExponent;

function formatPrefixAuto(x, p) {
  var d = formatDecimalParts(x, p);
  if (!d) return prefixExponent = undefined, x.toPrecision(p);
  var coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
      n = coefficient.length;
  return i === n ? coefficient
      : i > n ? coefficient + new Array(i - n + 1).join("0")
      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
}

function formatRounded(x, p) {
  var d = formatDecimalParts(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

var formatTypes = {
  "%": (x, p) => (x * 100).toFixed(p),
  "b": (x) => Math.round(x).toString(2),
  "c": (x) => x + "",
  "d": formatDecimal,
  "e": (x, p) => x.toExponential(p),
  "f": (x, p) => x.toFixed(p),
  "g": (x, p) => x.toPrecision(p),
  "o": (x) => Math.round(x).toString(8),
  "p": (x, p) => formatRounded(x * 100, p),
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": (x) => Math.round(x).toString(16).toUpperCase(),
  "x": (x) => Math.round(x).toString(16)
};

function identity$1(x) {
  return x;
}

var map = Array.prototype.map,
    prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

function formatLocale(locale) {
  var group = locale.grouping === undefined || locale.thousands === undefined ? identity$1 : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
      currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
      currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
      decimal = locale.decimal === undefined ? "." : locale.decimal + "",
      numerals = locale.numerals === undefined ? identity$1 : formatNumerals(map.call(locale.numerals, String)),
      percent = locale.percent === undefined ? "%" : locale.percent + "",
      minus = locale.minus === undefined ? "−" : locale.minus + "",
      nan = locale.nan === undefined ? "NaN" : locale.nan + "";

  function newFormat(specifier, options) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        trim = specifier.trim,
        type = specifier.type;

    // The "n" type is an alias for ",g".
    if (type === "n") comma = true, type = "g";

    // The "" type, and any invalid type, is an alias for ".12~g".
    else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

    // If zero fill is specified, padding goes after sign and before digits.
    if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = (options && options.prefix !== undefined ? options.prefix : "") + (symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : ""),
        suffix = (symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "") + (options && options.suffix !== undefined ? options.suffix : "");

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision === undefined ? 6
        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i, n, c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Determine the sign. -0 is not less than 0, but 1 / -0 is!
        var valueNegative = value < 0 || 1 / value < 0;

        // Perform the initial formatting.
        value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

        // Trim insignificant zeros.
        if (trim) value = formatTrim(value);

        // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
        if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = (type === "s" && !isNaN(value) && prefixExponent !== undefined ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<": value = valuePrefix + value + valueSuffix + padding; break;
        case "=": value = valuePrefix + padding + value + valueSuffix; break;
        case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
        default: value = padding + valuePrefix + value + valueSuffix; break;
      }

      return numerals(value);
    }

    format.toString = function() {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
        k = Math.pow(10, -e),
        f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier), {suffix: prefixes[8 + e / 3]});
    return function(value) {
      return f(k * value);
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
}

var locale;
var format;
var formatPrefix;

defaultLocale({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale(definition) {
  locale = formatLocale(definition);
  format = locale.format;
  formatPrefix = locale.formatPrefix;
  return locale;
}

function precisionFixed(step) {
  return Math.max(0, -exponent(Math.abs(step)));
}

function precisionPrefix(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
}

function precisionRound(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent(max) - exponent(step)) + 1;
}

function tickFormat(start, stop, count, specifier) {
  var step = tickStep(start, stop, count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function(count, specifier) {
    var d = domain();
    return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
  };

  scale.nice = function(count) {
    if (count == null) count = 10;

    var d = domain();
    var i0 = 0;
    var i1 = d.length - 1;
    var start = d[i0];
    var stop = d[i1];
    var prestep;
    var step;
    var maxIter = 10;

    if (stop < start) {
      step = start, start = stop, stop = step;
      step = i0, i0 = i1, i1 = step;
    }
    
    while (maxIter-- > 0) {
      step = tickIncrement(start, stop, count);
      if (step === prestep) {
        d[i0] = start;
        d[i1] = stop;
        return domain(d);
      } else if (step > 0) {
        start = Math.floor(start / step) * step;
        stop = Math.ceil(stop / step) * step;
      } else if (step < 0) {
        start = Math.ceil(start * step) / step;
        stop = Math.floor(stop * step) / step;
      } else {
        break;
      }
      prestep = step;
    }

    return scale;
  };

  return scale;
}

function linear() {
  var scale = continuous();

  scale.copy = function() {
    return copy(scale, linear());
  };

  initRange.apply(scale, arguments);

  return linearish(scale);
}

function identity(x) {
  return x;
}

var left = 4,
    epsilon$1 = 1e-6;

function translateY(y) {
  return "translate(0," + y + ")";
}

function number(scale) {
  return d => +scale(d);
}

function center(scale, offset) {
  offset = Math.max(0, scale.bandwidth() - offset * 2) / 2;
  if (scale.round()) offset = Math.round(offset);
  return d => +scale(d) + offset;
}

function entering() {
  return !this.__axis;
}

function axis(orient, scale) {
  var tickArguments = [],
      tickValues = null,
      tickFormat = null,
      tickSizeInner = 6,
      tickSizeOuter = 6,
      tickPadding = 3,
      offset = typeof window !== "undefined" && window.devicePixelRatio > 1 ? 0 : 0.5,
      k = -1 ,
      x = "x" ,
      transform = translateY;

  function axis(context) {
    var values = tickValues == null ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain()) : tickValues,
        format = tickFormat == null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : identity) : tickFormat,
        spacing = Math.max(tickSizeInner, 0) + tickPadding,
        range = scale.range(),
        range0 = +range[0] + offset,
        range1 = +range[range.length - 1] + offset,
        position = (scale.bandwidth ? center : number)(scale.copy(), offset),
        selection = context.selection ? context.selection() : context,
        path = selection.selectAll(".domain").data([null]),
        tick = selection.selectAll(".tick").data(values, scale).order(),
        tickExit = tick.exit(),
        tickEnter = tick.enter().append("g").attr("class", "tick"),
        line = tick.select("line"),
        text = tick.select("text");

    path = path.merge(path.enter().insert("path", ".tick")
        .attr("class", "domain")
        .attr("stroke", "currentColor"));

    tick = tick.merge(tickEnter);

    line = line.merge(tickEnter.append("line")
        .attr("stroke", "currentColor")
        .attr(x + "2", k * tickSizeInner));

    text = text.merge(tickEnter.append("text")
        .attr("fill", "currentColor")
        .attr(x, k * spacing)
        .attr("dy", "0.32em"));

    if (context !== selection) {
      path = path.transition(context);
      tick = tick.transition(context);
      line = line.transition(context);
      text = text.transition(context);

      tickExit = tickExit.transition(context)
          .attr("opacity", epsilon$1)
          .attr("transform", function(d) { return isFinite(d = position(d)) ? transform(d + offset) : this.getAttribute("transform"); });

      tickEnter
          .attr("opacity", epsilon$1)
          .attr("transform", function(d) { var p = this.parentNode.__axis; return transform((p && isFinite(p = p(d)) ? p : position(d)) + offset); });
    }

    tickExit.remove();

    path
        .attr("d", (tickSizeOuter ? "M" + k * tickSizeOuter + "," + range0 + "H" + offset + "V" + range1 + "H" + k * tickSizeOuter : "M" + offset + "," + range0 + "V" + range1)
            );

    tick
        .attr("opacity", 1)
        .attr("transform", function(d) { return transform(position(d) + offset); });

    line
        .attr(x + "2", k * tickSizeInner);

    text
        .attr(x, k * spacing)
        .text(format);

    selection.filter(entering)
        .attr("fill", "none")
        .attr("font-size", 10)
        .attr("font-family", "sans-serif")
        .attr("text-anchor", "end" );

    selection
        .each(function() { this.__axis = position; });
  }

  axis.scale = function(_) {
    return arguments.length ? (scale = _, axis) : scale;
  };

  axis.ticks = function() {
    return tickArguments = Array.from(arguments), axis;
  };

  axis.tickArguments = function(_) {
    return arguments.length ? (tickArguments = _ == null ? [] : Array.from(_), axis) : tickArguments.slice();
  };

  axis.tickValues = function(_) {
    return arguments.length ? (tickValues = _ == null ? null : Array.from(_), axis) : tickValues && tickValues.slice();
  };

  axis.tickFormat = function(_) {
    return arguments.length ? (tickFormat = _, axis) : tickFormat;
  };

  axis.tickSize = function(_) {
    return arguments.length ? (tickSizeInner = tickSizeOuter = +_, axis) : tickSizeInner;
  };

  axis.tickSizeInner = function(_) {
    return arguments.length ? (tickSizeInner = +_, axis) : tickSizeInner;
  };

  axis.tickSizeOuter = function(_) {
    return arguments.length ? (tickSizeOuter = +_, axis) : tickSizeOuter;
  };

  axis.tickPadding = function(_) {
    return arguments.length ? (tickPadding = +_, axis) : tickPadding;
  };

  axis.offset = function(_) {
    return arguments.length ? (offset = +_, axis) : offset;
  };

  return axis;
}

function axisLeft(scale) {
  return axis(left, scale);
}

function constant(x) {
  return function constant() {
    return x;
  };
}

const pi = Math.PI,
    tau = 2 * pi,
    epsilon = 1e-6,
    tauEpsilon = tau - epsilon;

function append(strings) {
  this._ += strings[0];
  for (let i = 1, n = strings.length; i < n; ++i) {
    this._ += arguments[i] + strings[i];
  }
}

function appendRound(digits) {
  let d = Math.floor(digits);
  if (!(d >= 0)) throw new Error(`invalid digits: ${digits}`);
  if (d > 15) return append;
  const k = 10 ** d;
  return function(strings) {
    this._ += strings[0];
    for (let i = 1, n = strings.length; i < n; ++i) {
      this._ += Math.round(arguments[i] * k) / k + strings[i];
    }
  };
}

class Path {
  constructor(digits) {
    this._x0 = this._y0 = // start of current subpath
    this._x1 = this._y1 = null; // end of current subpath
    this._ = "";
    this._append = digits == null ? append : appendRound(digits);
  }
  moveTo(x, y) {
    this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}`;
  }
  closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._append`Z`;
    }
  }
  lineTo(x, y) {
    this._append`L${this._x1 = +x},${this._y1 = +y}`;
  }
  quadraticCurveTo(x1, y1, x, y) {
    this._append`Q${+x1},${+y1},${this._x1 = +x},${this._y1 = +y}`;
  }
  bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._append`C${+x1},${+y1},${+x2},${+y2},${this._x1 = +x},${this._y1 = +y}`;
  }
  arcTo(x1, y1, x2, y2, r) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;

    // Is the radius negative? Error.
    if (r < 0) throw new Error(`negative radius: ${r}`);

    let x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._append`M${this._x1 = x1},${this._y1 = y1}`;
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon));

    // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
    // Equivalently, is (x1,y1) coincident with (x2,y2)?
    // Or, is the radius zero? Line to (x1,y1).
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
      this._append`L${this._x1 = x1},${this._y1 = y1}`;
    }

    // Otherwise, draw an arc!
    else {
      let x20 = x2 - x0,
          y20 = y2 - y0,
          l21_2 = x21 * x21 + y21 * y21,
          l20_2 = x20 * x20 + y20 * y20,
          l21 = Math.sqrt(l21_2),
          l01 = Math.sqrt(l01_2),
          l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
          t01 = l / l01,
          t21 = l / l21;

      // If the start tangent is not coincident with (x0,y0), line to.
      if (Math.abs(t01 - 1) > epsilon) {
        this._append`L${x1 + t01 * x01},${y1 + t01 * y01}`;
      }

      this._append`A${r},${r},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x1 + t21 * x21},${this._y1 = y1 + t21 * y21}`;
    }
  }
  arc(x, y, r, a0, a1, ccw) {
    x = +x, y = +y, r = +r, ccw = !!ccw;

    // Is the radius negative? Error.
    if (r < 0) throw new Error(`negative radius: ${r}`);

    let dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._append`M${x0},${y0}`;
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
      this._append`L${x0},${y0}`;
    }

    // Is this arc empty? We’re done.
    if (!r) return;

    // Does the angle go the wrong way? Flip the direction.
    if (da < 0) da = da % tau + tau;

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      this._append`A${r},${r},0,1,${cw},${x - dx},${y - dy}A${r},${r},0,1,${cw},${this._x1 = x0},${this._y1 = y0}`;
    }

    // Is this arc non-empty? Draw an arc!
    else if (da > epsilon) {
      this._append`A${r},${r},0,${+(da >= pi)},${cw},${this._x1 = x + r * Math.cos(a1)},${this._y1 = y + r * Math.sin(a1)}`;
    }
  }
  rect(x, y, w, h) {
    this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}h${w = +w}v${+h}h${-w}Z`;
  }
  toString() {
    return this._;
  }
}

function withPath(shape) {
  let digits = 3;

  shape.digits = function(_) {
    if (!arguments.length) return digits;
    if (_ == null) {
      digits = null;
    } else {
      const d = Math.floor(_);
      if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
      digits = d;
    }
    return shape;
  };

  return () => new Path(digits);
}

function array(x) {
  return typeof x === "object" && "length" in x
    ? x // Array, TypedArray, NodeList, array-like
    : Array.from(x); // Map, Set, iterable, string, or anything else
}

function Linear(context) {
  this._context = context;
}

Linear.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; // falls through
      default: this._context.lineTo(x, y); break;
    }
  }
};

function curveLinear(context) {
  return new Linear(context);
}

function x(p) {
  return p[0];
}

function y(p) {
  return p[1];
}

function line(x$1, y$1) {
  var defined = constant(true),
      context = null,
      curve = curveLinear,
      output = null,
      path = withPath(line);

  x$1 = typeof x$1 === "function" ? x$1 : (x$1 === undefined) ? x : constant(x$1);
  y$1 = typeof y$1 === "function" ? y$1 : (y$1 === undefined) ? y : constant(y$1);

  function line(data) {
    var i,
        n = (data = array(data)).length,
        d,
        defined0 = false,
        buffer;

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();
        else output.lineEnd();
      }
      if (defined0) output.point(+x$1(d, i, data), +y$1(d, i, data));
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  line.x = function(_) {
    return arguments.length ? (x$1 = typeof _ === "function" ? _ : constant(+_), line) : x$1;
  };

  line.y = function(_) {
    return arguments.length ? (y$1 = typeof _ === "function" ? _ : constant(+_), line) : y$1;
  };

  line.defined = function(_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant(!!_), line) : defined;
  };

  line.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };

  line.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };

  return line;
}

const PADDING = 50;
function prepareData(data, dimensions) {
    const dataset = [];
    data.forEach((item) => {
        const row = {};
        dimensions.forEach((dimension) => {
            row[dimension] = item[dimension];
        });
        dataset.push(row);
    });
    const header = [];
    Object.keys(dataset[0]).forEach((element) => header.push({ name: element }));
    return [header, dataset];
}
function setupYScales(header, dataset) {
    const yScales = {};
    header.map((x) => {
        const values = dataset.map((o) => o[x.name]);
        const labels = [];
        const numericValues = values.every((v) => !isNaN(Number(v)));
        if (!numericValues) {
            values.forEach(function (element) {
                const label = String(element ?? "");
                labels.push(label.length > 10 ? label.substr(0, 10) + "..." : label);
            });
            yScales[x.name] = point()
                .domain(labels)
                .range([PADDING, height - PADDING]);
        }
        else {
            const max = Math.max(...dataset.map((o) => o[x.name]));
            const min = Math.min(...dataset.map((o) => o[x.name]));
            if (min === max) {
                const epsilon = min === 0 ? 1 : Math.abs(min) * 0.01;
                yScales[x.name] = linear()
                    .domain([min - epsilon, max + epsilon])
                    .range([height - PADDING, PADDING]);
            }
            else {
                yScales[x.name] = linear()
                    .domain([min, max])
                    .range([height - PADDING, PADDING]);
            }
        }
    });
    return yScales;
}
function getTextWidthSVG(text, font) {
    const temp = select("body")
        .append("svg")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .append("text")
        .style("font", font)
        .text(text);
    const textNode = temp.node();
    if (!textNode) {
        temp.remove();
        return 0;
    }
    const width = textNode.getBBox().width;
    temp.remove();
    return width;
}
function shortenAxisLabel(value) {
    const label = String(value ?? "");
    return label.length > 10 ? label.substr(0, 10) + "..." : label;
}
function getLongestVisibleTickLabel(data, header) {
    return header.reduce((longest, column) => {
        const values = data.map((d) => d[column.name]);
        const numericValues = values.every((v) => !isNaN(Number(v)));
        const labels = numericValues
            ? values.map((value) => String(value ?? ""))
            : values.map(shortenAxisLabel);
        return labels.reduce((currentLongest, label) => label.length > currentLongest.length ? label : currentLongest, longest);
    }, "");
}
function calculateChartLayout(header, dataset) {
    const n = header.length;
    const longestDimensionLabel = header.reduce((longest, column) => {
        const label = shortenAxisLabel(column.name);
        return label.length > longest.length ? label : longest;
    }, "");
    const longestTickLabel = getLongestVisibleTickLabel(dataset, header);
    const dimensionLabelWidth = getTextWidthSVG(longestDimensionLabel, "0.7rem Verdana");
    const tickLabelWidth = getTextWidthSVG(longestTickLabel, "0.75rem Verdana");
    const axisGap = dimensionSpacingVar ?? Math.max(96, Math.ceil(dimensionLabelWidth + 56));
    const leftPadding = Math.max(72, Math.ceil(tickLabelWidth + 44));
    const rightPadding = Math.max(48, Math.ceil(dimensionLabelWidth / 2 + 36));
    const chartWidth = Math.ceil(leftPadding + rightPadding + Math.max(0, n - 1) * axisGap);
    return { axisGap, chartWidth, leftPadding, rightPadding };
}
function setupXScales(header, dataset) {
    const { leftPadding, rightPadding } = calculateChartLayout(header, dataset);
    return point()
        .domain(header.map((x) => x.name))
        .range([width - rightPadding, leftPadding])
        .padding(0)
        .align(0.5);
}
function isLinearScale(scale) {
    return typeof scale.ticks === "function";
}
function setupYAxis(yScales, dataset, hiddenDims) {
    const limit = 30;
    const yAxis = {};
    Object.entries(yScales).forEach(([key, scale]) => {
        if (hiddenDims.includes(key))
            return;
        if (!isLinearScale(scale)) {
            const rawLabels = dataset.map((d) => d[key]);
            const shortenedLabels = rawLabels.map((val) => typeof val === "string" && val.length > 10
                ? val.substr(0, 10) + "..."
                : val);
            const uniqueLabels = Array.from(new Set(shortenedLabels));
            const ticks = uniqueLabels.length > limit
                ? uniqueLabels.filter((_, i) => i % 6 === 0)
                : uniqueLabels;
            yAxis[key] = axisLeft(scale)
                .tickValues(ticks)
                .tickFormat((d) => d);
        }
        else if (isLinearScale(scale)) {
            const linearScale = scale;
            const ticks = linearScale.ticks(5).concat(linearScale.domain());
            const sorted = Array.from(new Set(ticks)).sort((a, b) => a - b);
            if (sorted.length >= 2) {
                const diffStart = sorted[1] - sorted[0];
                if (diffStart < 5) {
                    sorted.splice(1, 1);
                }
                const len = sorted.length;
                const last = sorted[len - 1];
                const secondLast = sorted[len - 2];
                const diffEnd = last - secondLast;
                if (diffEnd < 5) {
                    sorted.splice(len - 2, 1);
                }
            }
            yAxis[key] = axisLeft(scale)
                .tickValues(sorted)
                .tickFormat((d) => d);
        }
    });
    return yAxis;
}
function linePath(d, newFeatures) {
    const lineGenerator = line();
    const tempdata = Object.entries(d).filter((x) => x[0]);
    const points = [];
    newFeatures.forEach((newFeature) => {
        const valueEntry = tempdata.find((x) => x[0] === newFeature);
        if (valueEntry) {
            const name = newFeature;
            const value = String(valueEntry[1]);
            const x = parcoords.dragging[name] !== undefined
                ? parcoords.dragging[name]
                : parcoords.xScales(name);
            const cleanedValue = value.length > 10 ? value.substr(0, 10) + "..." : value;
            const y = parcoords.yScales[name](cleanedValue);
            points.push([x, y]);
        }
    });
    return lineGenerator(points);
}
function isInverted(dimension) {
    const invertId = "#dimension_invert_" + cleanString(dimension);
    const element = select(invertId);
    const arrowStatus = element.text();
    return arrowStatus == "down" ? true : false;
}
function getAllVisibleDimensionNames$1() {
    let listOfDimensions = parcoords.newFeatures.slice();
    return listOfDimensions.reverse();
}
function recordIdOf(rec) {
    return rec.id ?? rec._id ?? rec.key;
}
function createToolTipForValues(records, isSelect) {
    const dimensions = getAllVisibleDimensionNames$1();
    const svg = select("#spcd3-pc_svg").node();
    if (!svg)
        return;
    const plotG = document.querySelector("#spcd3-pc_svg g.plot") ?? svg;
    const ctm = plotG.getScreenCTM();
    if (!ctm)
        return;
    const recordId = recordIdOf(records);
    const wrapper = document.querySelector("#spcd3-parallelcoords .spcd3-chartWrapper");
    if (!wrapper)
        return;
    const layer = select(wrapper)
        .selectAll(`div.tip-layer[data-record="${recordId}"]`)
        .data([recordId])
        .join("div")
        .attr("class", "spcd3-tip-layer")
        .attr("data-record", recordId);
    const wrapperRect = wrapper.getBoundingClientRect();
    const data = dimensions.map((dim) => {
        const yScale = parcoords.yScales[dim];
        const x = parcoords.xScales(dim);
        const record = records[dim];
        const recordText = String(record ?? "");
        const cleanRecord = recordText.length > 10 ? recordText.substr(0, 10) + "..." : recordText;
        const y = yScale(cleanRecord);
        const pt = svg.createSVGPoint();
        pt.x = x;
        pt.y = y;
        const sp = pt.matrixTransform(ctm);
        return {
            dim,
            pageX: sp.x - wrapperRect.left + wrapper.scrollLeft,
            pageY: sp.y - wrapperRect.top + wrapper.scrollTop,
            text: String(records[dim]),
        };
    });
    if (isSelect) {
        const tips = layer
            .selectAll("div.spcd3-tooltip-record-select")
            .data(data, (d) => d.dim);
        tips.join((enter) => enter
            .append("div")
            .attr("id", `tooltip-record-select-${cleanString(String(records[hoverlabel] ?? ""))}`)
            .attr("class", "spcd3-tooltip-record-select")
            .style("left", (d) => `${d.pageX / 16}rem`)
            .style("top", (d) => `${d.pageY / 16}rem`)
            .text((d) => d.text), (update) => update
            .style("left", (d) => `${d.pageX / 16}rem`)
            .style("top", (d) => `${d.pageY / 16}rem`)
            .text((d) => d.text), (exit) => exit.remove());
    }
    else {
        const tips = layer
            .selectAll("div.spcd3-tooltip-record")
            .data(data, (d) => dimensions);
        tips.join((enter) => enter
            .append("div")
            .attr("class", "spcd3-tooltip-record")
            .style("left", (d) => `${d.pageX / 16}rem`)
            .style("top", (d) => `${d.pageY / 16}rem`)
            .text((d) => d.text), (update) => update
            .style("left", (d) => `${d.pageX / 16}rem`)
            .style("top", (d) => `${d.pageY / 16}rem`)
            .text((d) => d.text), (exit) => exit.remove());
    }
}
function getAllPointerEventsData(event) {
    const selection = selectAll(document.elementsFromPoint(event.clientX, event.clientY)).filter("path");
    if (selection == null)
        return [];
    const object = selection._groups;
    const data = [];
    for (let i = 0; i < object[0].length; i++) {
        const items = object.map((item) => item[i]);
        const itemsdata = items[0].__data__;
        if (!itemsdata || !itemsdata[hoverlabel])
            continue;
        const text = itemsdata[hoverlabel];
        data.push(text);
    }
    return data;
}
function createTooltipForLabel(tooltipText, tooltipLabel, event) {
    if (!tooltipText || tooltipText.length === 0)
        return;
    const x = event.clientX / 16;
    const y = event.clientY / 16;
    let tempText = tooltipText.toString();
    tempText = tempText.split(",").join("\r\n");
    tooltipLabel
        .text(tempText)
        .style("visibility", "visible")
        .style("position", "fixed")
        .style("top", `${y}rem`)
        .style("left", `${x}rem`);
    return tooltipLabel;
}
function trans(g) {
    return g.transition().duration(50);
}
function position(dimension, dragging, xScales) {
    const value = dragging[dimension];
    return value == null ? xScales(dimension) : value;
}
function cleanTooltip() {
    selectAll(".spcd3-tooltip-record").remove();
}
function cleanTooltipSelect() {
    selectAll(".spcd3-tooltip-record-select").remove();
}

const BRUSH_STATE_EPSILON$1 = 0.75;
const AXIS_VISIBILITY_DURATION = 1500;
function isNear(value, target) {
    return Math.abs(value - target) < BRUSH_STATE_EPSILON$1;
}
function remToPixels(value) {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const baseFontSize = Number.isFinite(rootFontSize) && rootFontSize > 0 ? rootFontSize : 16;
    return value * baseFontSize;
}
function pixelsToRem(value) {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const baseFontSize = Number.isFinite(rootFontSize) && rootFontSize > 0 ? rootFontSize : 16;
    return `${value / baseFontSize}rem`;
}
function realignToolbarAfterSpacingChange() {
    window.requestAnimationFrame(() => {
        const toolbarRow = document.querySelector("#spcd3-toolbarRow");
        const svgNode = document.querySelector("#spcd3-pc_svg");
        const axisNodes = Array.from(document.querySelectorAll("#spcd3-pc_svg .dimensions"));
        if (!toolbarRow || !svgNode || axisNodes.length === 0) {
            return;
        }
        const leftmostAxis = axisNodes.reduce((leftmost, axis) => axis.getBoundingClientRect().left < leftmost.getBoundingClientRect().left
            ? axis
            : leftmost);
        const toolbarRect = toolbarRow.getBoundingClientRect();
        const svgRect = svgNode.getBoundingClientRect();
        const axisRect = leftmostAxis.getBoundingClientRect();
        const leftEdge = axisRect.left - svgRect.left + toolbarRect.left;
        toolbarRow.style.paddingLeft = `${Math.max(0, leftEdge - toolbarRect.left) / 16}rem`;
    });
}
function getDimensionOrderIndex(dimension) {
    const index = initDimension.indexOf(dimension);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
function restoreVisibleDimensionOrder() {
    parcoords.newFeatures = [...parcoords.newFeatures].sort((a, b) => getDimensionOrderIndex(a) - getDimensionOrderIndex(b));
    parcoords.features = [...parcoords.features].sort((a, b) => getDimensionOrderIndex(a.name) - getDimensionOrderIndex(b.name));
}
function syncFeatureObjectsToVisibleOrder() {
    parcoords.features = parcoords.newFeatures.map((dimension) => {
        const existingFeature = parcoords.features.find((feature) => feature.name === dimension);
        return existingFeature ?? { name: dimension };
    });
}
function syncDimensionOrderWithVisible() {
    if (!Array.isArray(initDimension) || !Array.isArray(parcoords.newFeatures)) {
        return;
    }
    const visibleDimensions = [...parcoords.newFeatures];
    let visibleIndex = 0;
    setInitDimension(initDimension.map((dimension) => visibleDimensions.includes(dimension)
        ? visibleDimensions[visibleIndex++]
        : dimension));
    syncFeatureObjectsToVisibleOrder();
}
function refreshChartLayoutForVisibleDimensions() {
    if (!parcoords.features.length || !parcoords.newDataset) {
        return;
    }
    const layout = calculateChartLayout(parcoords.features, parcoords.newDataset);
    setWidth(layout.chartWidth);
    parcoords.xScales = setupXScales(parcoords.features, parcoords.newDataset);
    select("#spcd3-pc_svg")
        .attr("width", layout.chartWidth)
        .attr("viewBox", [0, 0, layout.chartWidth, height])
        .style("inline-size", pixelsToRem(layout.chartWidth));
    select(".spcd3-chartWrapper").style("inline-size", pixelsToRem(layout.chartWidth));
    select(".spcd3-brush-overlay").attr("width", layout.chartWidth);
}
function refreshRecordPathsForVisibleDimensions() {
    select("g.active")
        .selectAll("path")
        .interrupt()
        .attr("d", (d) => linePath(d, parcoords.newFeatures))
        .style("opacity", 1);
}
//---------- Show and Hide Functions ----------
function hide(dimension) {
    parcoords.newFeatures = parcoords.newFeatures.filter((d) => d !== dimension);
    parcoords.features = parcoords.features.filter((d) => d.name !== dimension);
    restoreVisibleDimensionOrder();
    refreshChartLayoutForVisibleDimensions();
    selectAll(".dimensions")
        .filter((d) => parcoords.newFeatures.includes(d.name || d))
        .transition()
        .duration(AXIS_VISIBILITY_DURATION)
        .attr("transform", (d) => "translate(" +
        position(d.name || d, parcoords.dragging, parcoords.xScales) +
        ")");
    selectAll(".dimensions")
        .filter((d) => d.name === dimension)
        .transition()
        .duration(AXIS_VISIBILITY_DURATION)
        .style("opacity", 0)
        .on("end", function () {
        select(this).attr("visibility", "hidden");
    });
    refreshRecordPathsForVisibleDimensions();
    cleanTooltipSelect();
    var selectedRecords = getSelected();
    selectedRecords.forEach((record) => {
        const path = parcoords.newDataset.find((d) => d[hoverlabel] === record);
        createToolTipForValues(path, true);
    });
    realignToolbarAfterSpacingChange();
}
function show(dimension) {
    if (parcoords.newFeatures.includes(dimension))
        return;
    if (initDimension.includes(dimension)) {
        parcoords.newFeatures.push(dimension);
        parcoords.features.push({ name: dimension });
        restoreVisibleDimensionOrder();
    }
    refreshChartLayoutForVisibleDimensions();
    selectAll(".dimensions")
        .filter((d) => (typeof d === "object" ? d.name : d) === dimension)
        .style("opacity", 0)
        .transition()
        .attr("visibility", "visible")
        .duration(AXIS_VISIBILITY_DURATION)
        .style("opacity", 1);
    selectAll(".dimensions")
        .filter((d) => parcoords.newFeatures.includes(typeof d === "object" ? d.name : d))
        .transition()
        .duration(AXIS_VISIBILITY_DURATION)
        .attr("transform", (d) => "translate(" +
        position(d.name || d, parcoords.dragging, parcoords.xScales) +
        ")")
        .style("opacity", 1);
    refreshRecordPathsForVisibleDimensions();
    cleanTooltipSelect();
    var selectedRecords = getSelected();
    selectedRecords.forEach((record) => {
        const path = parcoords.newDataset.find((d) => d[hoverlabel] === record);
        createToolTipForValues(path, true);
    });
    realignToolbarAfterSpacingChange();
}
function getHiddenStatus(dimension) {
    const index = parcoords.newFeatures.indexOf(dimension);
    if (index != -1) {
        return "shown";
    }
    else {
        return "hidden";
    }
}
//---------- Move Functions ----------
function moveByOne(dimension, direction) {
    const indexOfDimension = parcoords.newFeatures.indexOf(dimension);
    const indexOfNeighbor = direction == "right" ? indexOfDimension - 1 : indexOfDimension + 1;
    const neighbour = parcoords.newFeatures[indexOfNeighbor];
    const pos = parcoords.xScales(dimension);
    const posNeighbour = parcoords.xScales(neighbour);
    const distance = parcoords.xScales.step();
    parcoords.dragging[dimension] =
        direction == "right" ? pos + distance : pos - distance;
    parcoords.dragging[neighbour] =
        direction == "right" ? posNeighbour - distance : posNeighbour + distance;
    if (direction == "right") {
        [
            parcoords.newFeatures[indexOfDimension],
            parcoords.newFeatures[indexOfDimension - 1],
        ] = [
            parcoords.newFeatures[indexOfDimension - 1],
            parcoords.newFeatures[indexOfDimension],
        ];
    }
    else {
        [
            parcoords.newFeatures[indexOfDimension + 1],
            parcoords.newFeatures[indexOfDimension],
        ] = [
            parcoords.newFeatures[indexOfDimension],
            parcoords.newFeatures[indexOfDimension + 1],
        ];
    }
    syncDimensionOrderWithVisible();
    parcoords.xScales.domain(parcoords.newFeatures);
    let active_all = select("g.active").selectAll("path");
    let featureAxis = selectAll(".dimensions");
    active_all
        .transition()
        .duration(1000)
        .attr("d", function (d) {
        return linePath(d, parcoords.newFeatures);
    })
        .ease(cubicInOut);
    featureAxis
        .transition()
        .duration(1000)
        .attr("transform", function (d) {
        return ("translate(" +
            position(d.name, parcoords.dragging, parcoords.xScales) +
            ")");
    })
        .ease(cubicInOut);
    delete parcoords.dragging[dimension];
    delete parcoords.dragging[neighbour];
    cleanTooltipSelect();
    var selectedRecords = getSelected();
    selectedRecords.forEach((record) => {
        const path = parcoords.newDataset.find((d) => d[hoverlabel] === record);
        if (!isRecordInactive(record)) {
            createToolTipForValues(path, true);
        }
    });
}
function move(dimensionA, toRightOf, dimensionB) {
    const indexOfDimensionA = getDimensionPosition(dimensionA);
    const indexOfDimensionB = getDimensionPosition(dimensionB);
    if (toRightOf) {
        if (indexOfDimensionA > indexOfDimensionB) {
            for (let i = indexOfDimensionA; i > indexOfDimensionB; i--) {
                if (i != indexOfDimensionB - 1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i - 1]);
                }
            }
        }
        else {
            for (let i = indexOfDimensionA; i < indexOfDimensionB; i++) {
                if (i != indexOfDimensionB - 1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i + 1]);
                }
            }
        }
    }
    else {
        if (indexOfDimensionA > indexOfDimensionB) {
            for (let i = indexOfDimensionA; i > indexOfDimensionB; i--) {
                if (i != indexOfDimensionB + 1) {
                    swap(parcoords.newFeatures[i], parcoords.newFeatures[i - 1]);
                }
            }
        }
        else {
            for (let i = indexOfDimensionA; i < indexOfDimensionB; i++) {
                swap(parcoords.newFeatures[i], parcoords.newFeatures[i + 1]);
            }
        }
    }
}
function swap(dimensionA, dimensionB) {
    const positionA = parcoords.xScales(dimensionA);
    const positionB = parcoords.xScales(dimensionB);
    parcoords.dragging[dimensionA] = positionB;
    parcoords.dragging[dimensionB] = positionA;
    const indexOfDimensionA = parcoords.newFeatures.indexOf(dimensionA);
    const indexOfDimensionB = parcoords.newFeatures.indexOf(dimensionB);
    [
        parcoords.newFeatures[indexOfDimensionA],
        parcoords.newFeatures[indexOfDimensionB],
    ] = [
        parcoords.newFeatures[indexOfDimensionB],
        parcoords.newFeatures[indexOfDimensionA],
    ];
    syncDimensionOrderWithVisible();
    parcoords.xScales.domain(parcoords.newFeatures);
    let active_all = select("g.active").selectAll("path");
    let featureAxis = selectAll(".dimensions");
    active_all
        .transition()
        .duration(1000)
        .attr("d", (d) => {
        return linePath(d, parcoords.newFeatures);
    });
    featureAxis
        .transition()
        .duration(1000)
        .attr("transform", (d) => {
        return ("translate(" +
            position(d.name, parcoords.dragging, parcoords.xScales) +
            ")");
    })
        .ease(cubicInOut);
    delete parcoords.dragging[dimensionA];
    delete parcoords.dragging[dimensionB];
    cleanTooltipSelect();
    var selectedRecords = getSelected();
    selectedRecords.forEach((record) => {
        const path = parcoords.newDataset.find((d) => d[hoverlabel] === record);
        if (!isRecordInactive(record)) {
            createToolTipForValues(path, true);
        }
    });
}
//---------- Filter Functions ----------
function getFilter(dimension) {
    const yScale = parcoords.yScales[dimension];
    const dimensionSettings = parcoords.currentPosOfDims.find((d) => d.key === dimension);
    if (!dimensionSettings || !yScale || typeof yScale.invert !== "function")
        return [0, 0];
    const valueTop = Math.round(yScale.invert(dimensionSettings.top));
    const valueBottom = Math.round(yScale.invert(dimensionSettings.bottom));
    const min = Math.min(valueTop, valueBottom);
    const max = Math.max(valueTop, valueBottom);
    return [min, max];
}
function setFilter(dimension, min, max) {
    const filterTop = Math.max(min, max);
    const filterBottom = Math.min(min, max);
    addRange$1(filterBottom, parcoords.currentPosOfDims, dimension, "currentFilterBottom");
    addRange$1(filterTop, parcoords.currentPosOfDims, dimension, "currentFilterTop");
    filter(dimension, min, max);
}
//---------- Range Functions ----------
function getDimensionRange(dimension) {
    return parcoords.yScales[dimension].domain();
}
function setDimensionRange(dimension, min, max) {
    const inverted = isInverted(dimension);
    const hiddenDims = getAllHiddenDimensionNames();
    if (inverted) {
        parcoords.yScales[dimension].domain([max, min]);
        setYaxis(setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims));
    }
    else {
        parcoords.yScales[dimension].domain([min, max]);
        setYaxis(setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims));
    }
    addRange$1(min, parcoords.currentPosOfDims, dimension, "currentRangeBottom");
    addRange$1(max, parcoords.currentPosOfDims, dimension, "currentRangeTop");
    select("#dimension_axis_" + cleanString(dimension))
        .call(yAxis[dimension])
        .transition()
        .duration(1000)
        .ease(cubicInOut);
    let active_all = select("g.active")
        .selectAll("path")
        .transition()
        .duration(1000)
        .attr("d", (d) => {
        return linePath(d, parcoords.newFeatures);
    })
        .ease(cubicInOut);
    active_all.each(function (d) {
        select(this)
            .transition()
            .duration(1000)
            .attr("d", linePath(d, parcoords.newFeatures))
            .ease(cubicInOut);
    });
    setFilterAfterSettingRanges(dimension, inverted);
}
function setFilterAfterSettingRanges(dimension, inverted) {
    const cleanDimensionName = cleanString(dimension);
    const rect = select("#rect_" + cleanDimensionName);
    const triDown = select("#triangle_down_" + cleanDimensionName);
    const triDownHit = select("#triangle_down_hit" + cleanDimensionName);
    const triUp = select("#triangle_up_" + cleanDimensionName);
    const triUpHit = select("#triangle_up_hit" + cleanDimensionName);
    const dimensionSettings = parcoords.currentPosOfDims.find((d) => d.key === dimension);
    const yScale = parcoords.yScales[dimension];
    const newMin = Math.max(dimensionSettings.currentRangeBottom, dimensionSettings.currentFilterBottom);
    const newMax = Math.min(dimensionSettings.currentRangeTop, dimensionSettings.currentFilterTop);
    let top = yScale(newMax);
    let bottom = yScale(newMin);
    if (inverted) {
        [top, bottom] = [bottom, top];
    }
    const rectY = Math.min(top, bottom);
    const rectH = Math.abs(bottom - top);
    const storeBottom = Math.min(newMin, newMax);
    const storeTop = Math.max(newMin, newMax);
    addRange$1(storeBottom, parcoords.currentPosOfDims, dimension, "currentFilterBottom");
    addRange$1(storeTop, parcoords.currentPosOfDims, dimension, "currentFilterTop");
    rect.transition().duration(300).attr("y", rectY).attr("height", rectH);
    triDown
        .transition()
        .duration(300)
        .attr("y", rectY - 10);
    triDownHit.attr("y", rectY - 10);
    triUp
        .transition()
        .duration(300)
        .attr("y", rectY + rectH);
    triUpHit.attr("y", rectY + rectH);
    if (isNear(rectY, 50)) {
        select("#triangle_down_" + cleanDimensionName).attr("href", "#brush_image_bottom");
    }
    else {
        select("#triangle_down_" + cleanDimensionName).attr("href", "#brush_image_bottom_active");
    }
    if (isNear(rectY + rectH, 350)) {
        select("#triangle_up_" + cleanDimensionName).attr("href", "#brush_image_top");
    }
    else {
        select("#triangle_up_" + cleanDimensionName).attr("href", "#brush_image_top_active");
    }
    if (!(isNear(rectY, 50) && isNear(rectY + rectH, 350))) {
        select("#rect_" + cleanDimensionName)
            .attr("fill", BRUSH_ACTIVE_FILL)
            .attr("opacity", "0.7");
    }
    else {
        select("#rect_" + cleanDimensionName)
            .attr("fill", BRUSH_IDLE_FILL)
            .attr("opacity", "0.5");
    }
}
function setDimensionRangeRounded(dimension, min, max) {
    const inverted = isInverted(dimension);
    const hiddenDims = getAllHiddenDimensionNames();
    if (inverted) {
        parcoords.yScales[dimension].domain([max, min]).nice();
        setYaxis(setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims));
    }
    else {
        parcoords.yScales[dimension].domain([min, max]).nice();
        setYaxis(setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims));
    }
    const roundedRanges = parcoords.yScales[dimension].domain();
    if (inverted) {
        addRange$1(roundedRanges[1], parcoords.currentPosOfDims, dimension, "currentRangeBottom");
        addRange$1(roundedRanges[0], parcoords.currentPosOfDims, dimension, "currentRangeTop");
    }
    else {
        addRange$1(roundedRanges[0], parcoords.currentPosOfDims, dimension, "currentRangeBottom");
        addRange$1(roundedRanges[1], parcoords.currentPosOfDims, dimension, "currentRangeTop");
    }
    select("#dimension_axis_" + cleanString(dimension))
        .call(yAxis[dimension])
        .transition()
        .duration(1000)
        .ease(cubicInOut);
    let active = select("g.active")
        .selectAll("path")
        .transition()
        .duration(1000)
        .attr("d", (d) => {
        return linePath(d, parcoords.newFeatures);
    })
        .ease(cubicInOut);
    active.each(function (d) {
        select(this)
            .transition()
            .duration(1000)
            .attr("d", linePath(d, parcoords.newFeatures))
            .ease(cubicInOut);
    });
    setFilterAfterSettingRanges(dimension, inverted);
}
function addRange$1(value, currentPosOfDims, dimension, key) {
    const newObject = {};
    newObject[key] = Number(value);
    const target = currentPosOfDims.find((obj) => obj.key == dimension);
    Object.assign(target, newObject);
}
function getMinValue(dimension) {
    const item = parcoords.currentPosOfDims.find((object) => object.key == dimension);
    return item.min;
}
function getMaxValue(dimension) {
    const item = parcoords.currentPosOfDims.find((object) => object.key == dimension);
    return item.max;
}
function getCurrentMinRange(dimension) {
    const item = parcoords.currentPosOfDims.find((object) => object.key == dimension);
    return item.currentRangeBottom;
}
function getCurrentMaxRange(dimension) {
    const item = parcoords.currentPosOfDims.find((object) => object.key == dimension);
    return item.currentRangeTop;
}
function isSelected(record) {
    return select("#" + cleanString(record)).classed("selected");
}
function setDimensionForHovering(dimension) {
    setHoverLabel(dimension);
}
//---------- Invert Functions ----------
function invertWoTransition(dimension) {
    const cleanDimensionName = cleanString(dimension);
    const invertId = "#dimension_invert_" + cleanDimensionName;
    const dimensionId = "#dimension_axis_" + cleanDimensionName;
    const textElement = select(invertId);
    const currentArrowStatus = textElement.text();
    const arrow = currentArrowStatus === "down" ? ARROW_UP_PATH : ARROW_DOWN_PATH;
    const arrowSvg = currentArrowStatus === "down"
        ? applyThemeToSvg(setSize(getArrowDownCursor(), 12))
        : applyThemeToSvg(setSize(getArrowUpCursor(), 12));
    const [hotspotX, hotspotY] = currentArrowStatus === "down"
        ? getCursorHotspot(getArrowDownCursorMeta(), 12)
        : getCursorHotspot(getArrowUpCursorMeta(), 12);
    textElement.text(currentArrowStatus === "down" ? "up" : "down");
    textElement.attr("d", arrow);
    textElement.style("cursor", `url('data:image/svg+xml,${encodeURIComponent(arrowSvg)}') ${hotspotX} ${hotspotY}, auto`);
    select("#invert_hitbox_" + cleanDimensionName).style("cursor", `url('data:image/svg+xml,${encodeURIComponent(arrowSvg)}') ${hotspotX} ${hotspotY}, auto`);
    select(dimensionId).call(yAxis[dimension].scale(parcoords.yScales[dimension].domain(parcoords.yScales[dimension].domain().reverse())));
    trans(active).each(function (d) {
        select(this).attr("d", (d) => {
            return linePath(d, parcoords.newFeatures);
        });
    });
    trans(selectAll("path.hitarea")).each(function (d) {
        select(this).attr("d", (d) => {
            return linePath(d, parcoords.newFeatures);
        });
    });
    addSettingsForBrushing(dimension, isInverted(dimension));
    if (isInverted(dimension)) {
        addInvertStatus(true, dimension, "isInverted");
    }
    else {
        addInvertStatus(false, dimension, "isInverted");
    }
    cleanTooltipSelect();
    var selectedRecords = getSelected();
    selectedRecords.forEach((record) => {
        const path = parcoords.newDataset.find((d) => d[hoverlabel] === record);
        if (!isRecordInactive(record)) {
            createToolTipForValues(path, true);
        }
    });
}
function setInversionStatus(dimension, status) {
    const cleanDimensionName = cleanString(dimension);
    const invertId = "#dimension_invert_" + cleanDimensionName;
    const dimensionId = "#dimension_axis_" + cleanDimensionName;
    const textElement = select(invertId);
    const arrow = status === "ascending" ? ARROW_UP_PATH : ARROW_DOWN_PATH;
    const arrowSvg = status === "ascending"
        ? applyThemeToSvg(setSize(getArrowDownCursor(), 12))
        : applyThemeToSvg(setSize(getArrowUpCursor(), 12));
    const [hotspotX, hotspotY] = status === "ascending"
        ? getCursorHotspot(getArrowDownCursorMeta(), 12)
        : getCursorHotspot(getArrowUpCursorMeta(), 12);
    textElement.text(status === "ascending" ? "up" : "down");
    textElement.attr("d", arrow);
    textElement.style("cursor", `url('data:image/svg+xml,${encodeURIComponent(arrowSvg)}') ${hotspotX} ${hotspotY}, auto`);
    select("#invert_hitbox_" + cleanDimensionName).style("cursor", `url('data:image/svg+xml,${encodeURIComponent(arrowSvg)}') ${hotspotX} ${hotspotY}, auto`);
    select(dimensionId)
        .transition()
        .duration(1000)
        .call(yAxis[dimension].scale(parcoords.yScales[dimension].domain(parcoords.yScales[dimension].domain().reverse())))
        .ease(cubicInOut);
    trans(active).each(function (d) {
        select(this)
            .transition()
            .duration(1000)
            .attr("d", (d) => {
            return linePath(d, parcoords.newFeatures);
        })
            .ease(cubicInOut);
    });
    trans(selectAll("path.hitarea")).each(function (d) {
        select(this).attr("d", (d) => {
            return linePath(d, parcoords.newFeatures);
        });
    });
    getFilter(dimension);
    addSettingsForBrushing(dimension, isInverted(dimension));
    if (isInverted(dimension)) {
        addInvertStatus(true, dimension, "isInverted");
    }
    else {
        addInvertStatus(false, dimension, "isInverted");
    }
    cleanTooltipSelect();
    var selectedRecords = getSelected();
    selectedRecords.forEach((record) => {
        const path = parcoords.newDataset.find((d) => d[hoverlabel] === record);
        if (!isRecordInactive(record)) {
            createToolTipForValues(path, true);
        }
    });
}
function invert(dimension) {
    const cleanDimensionName = cleanString(dimension);
    const invertId = "#dimension_invert_" + cleanDimensionName;
    const dimensionId = "#dimension_axis_" + cleanDimensionName;
    const textElement = select(invertId);
    const currentArrowStatus = textElement.text();
    const arrow = currentArrowStatus === "down" ? ARROW_UP_PATH : ARROW_DOWN_PATH;
    const arrowSvg = currentArrowStatus === "down"
        ? applyThemeToSvg(setSize(getArrowDownCursor(), 12))
        : applyThemeToSvg(setSize(getArrowUpCursor(), 12));
    const [hotspotX, hotspotY] = currentArrowStatus === "down"
        ? getCursorHotspot(getArrowDownCursorMeta(), 12)
        : getCursorHotspot(getArrowUpCursorMeta(), 12);
    textElement.text(currentArrowStatus === "down" ? "up" : "down");
    textElement.attr("d", arrow);
    textElement.style("cursor", `url('data:image/svg+xml,${encodeURIComponent(arrowSvg)}') ${hotspotX} ${hotspotY}, auto`);
    select("#invert_hitbox_" + cleanDimensionName).style("cursor", `url('data:image/svg+xml,${encodeURIComponent(arrowSvg)}') ${hotspotX} ${hotspotY}, auto`);
    select(dimensionId)
        .transition()
        .duration(1000)
        .call(yAxis[dimension].scale(parcoords.yScales[dimension].domain(parcoords.yScales[dimension].domain().reverse())))
        .ease(cubicInOut);
    trans(active).each(function (d) {
        select(this)
            .transition()
            .duration(1000)
            .attr("d", (d) => {
            return linePath(d, parcoords.newFeatures);
        })
            .ease(cubicInOut);
    });
    trans(selectAll("path.hitarea")).each(function (d) {
        select(this).attr("d", (d) => {
            return linePath(d, parcoords.newFeatures);
        });
    });
    cleanTooltipSelect();
    var selectedRecords = getSelected();
    selectedRecords.forEach((record) => {
        const path = parcoords.newDataset.find((d) => cleanString(d[hoverlabel]) === record);
        if (!isRecordInactive(record)) {
            createToolTipForValues(path, true);
        }
    });
    getFilter(dimension);
    addSettingsForBrushing(dimension, isInverted(dimension));
    if (isInverted(dimension)) {
        addInvertStatus(true, dimension, "isInverted");
    }
    else {
        addInvertStatus(false, dimension, "isInverted");
    }
}
//---------- Selection Functions ----------
function getSelected() {
    let selected = [];
    const records = getAllRecords();
    for (let i = 0; i < records.length; i++) {
        let isselected = isSelected(records[i]);
        if (isselected) {
            selected.push(records[i]);
        }
    }
    return selected;
}
function setSelection(records) {
    for (let i = 0; i < records.length; i++) {
        let stroke = select("#" + cleanString(records[i])).style("stroke");
        if (stroke !== "lightgrey") {
            select("#" + cleanString(records[i]))
                .classed("selected", true)
                .transition()
                .style("stroke", "rgba(255, 165, 0, 1)");
            records.forEach((record) => {
                const path = parcoords.newDataset.find((d) => cleanString(d[hoverlabel]) === record);
                createToolTipForValues(path, true);
            });
        }
    }
}
function clearSelection() {
    const selectedRecords = getSelected();
    selectedRecords.forEach((element) => {
        select("#" + cleanString(element))
            .classed("selected", false)
            .transition()
            .style("stroke", "var(--spcd3-active-records)");
    });
    cleanTooltipSelect();
}
function toggleSelection(record) {
    const selected = isSelected(record);
    if (selected) {
        setUnselected(record);
    }
    else {
        setSelected(record);
    }
}
function setSelected(record) {
    let selectableLines = [];
    selectableLines.push(record);
    setSelection(selectableLines);
}
function setUnselected(record) {
    selectAll("#" + cleanString(record))
        .classed("selected", false)
        .style("stroke", "var(--spcd3-active-records)");
    selectAll(`#tooltip-record-select-${record}`).style("display", "none");
}
function isRecordInactive(record) {
    const stroke = select("#" + cleanString(record));
    let node = stroke.node();
    let style = node.style.stroke;
    return style === getInactiveLineStroke();
}
//---------- Selection Functions With IDs ----------
function setSelectionWithId(recordIds) {
    let records = [];
    for (let i = 0; i < recordIds.length; i++) {
        let record = getRecordWithId(recordIds[i]);
        records.push(record);
    }
    setSelection(records);
}
function isSelectedWithRecordId(recordId) {
    let record = getRecordWithId(recordId);
    return isSelected(record);
}
function getRecordWithId(recordId) {
    const item = parcoords.currentPosOfDims.find((object) => object.recordId == recordId);
    return item.key;
}
function toggleSelectionWithId(recordId) {
    const record = getRecordWithId(recordId);
    toggleSelection(record);
}
function setSelectedWithId(recordId) {
    const record = getRecordWithId(recordId);
    setSelected(record);
}
function setUnselectedWithId(recordId) {
    const record = getRecordWithId(recordId);
    setUnselected(record);
}
//---------- Color Records ----------
function colorRecord(record, color) {
    const path = selectAll("#" + cleanString(record));
    path.classed("colored", true).property("clusterColor", color);
    path.transition().style("stroke", color);
}
function uncolorRecord(record) {
    const path = selectAll("#" + cleanString(record));
    path
        .classed("colored", false)
        .property("clusterColor", "var(--spcd3-active-records)");
    path.transition().style("stroke", "var(--spcd3-active-records)");
}
//---------- Helper Functions ----------
function getAllRecords() {
    if (!active || typeof active.nodes !== "function") {
        return [];
    }
    return active
        .nodes()
        .map((node) => node.id)
        .filter((id) => id.length > 0);
}
function getAllVisibleDimensionNames() {
    let listOfDimensions = parcoords.newFeatures.slice();
    return listOfDimensions.reverse();
}
function getAllDimensionNames() {
    return Array.isArray(initDimension) ? initDimension : columns;
}
function getAllHiddenDimensionNames() {
    const dimensions = getAllDimensionNames();
    const hiddenDimensions = [];
    for (let i = 0; i < dimensions.length; i++) {
        if (getHiddenStatus(dimensions[i]) == "hidden") {
            hiddenDimensions.push(dimensions[i]);
        }
    }
    return hiddenDimensions;
}
function getInversionStatus(dimension) {
    const invertId = "#dimension_invert_" + cleanString(dimension);
    const element = select(invertId);
    const arrowStatus = element.text();
    return arrowStatus == "up" ? "ascending" : "descending";
}
function getNumberOfDimensions() {
    return parcoords.newFeatures.length;
}
function getDimensionPosition(dimension) {
    return parcoords.newFeatures.indexOf(dimension);
}
function isDimensionCategorical(dimension) {
    const values = parcoords.newDataset.map((o) => o[dimension]);
    const isAllNumeric = values.every((v) => !isNaN(Number(v)));
    return !isAllNumeric;
}
function showMarker(dimension) {
    const cleanDimensionName = cleanString(dimension);
    select("#marker_" + cleanDimensionName).classed("visible", true);
}
function hideMarker(dimension) {
    const cleanDimensionName = cleanString(dimension);
    select("#marker_" + cleanDimensionName).classed("visible", false);
}
function setClassColoredFalse(record) {
    const path = selectAll("#" + cleanString(record));
    path.classed("colored", false);
}
function disableInteractivity() {
    select("#spcd3-toolbarRow")
        .style("pointer-events", "none")
        .style("opacity", "0.45")
        .style("filter", "grayscale(1)")
        .style("cursor", "not-allowed");
    selectAll("#spcd3-toolbarRow *").style("cursor", "not-allowed");
    select("#spcd3-parallelcoords").style("pointer-events", "none");
    select("#spcd3-parallelcoords")
        .style("background", "var(--spcd3-chart-disabled-bg)")
        .style("z-index", 1);
    selectAll(".hitarea").style("pointer-events", "none");
    selectAll(".spcd3-handle-hitbox").style("pointer-events", "none");
    selectAll(".hitbox").style("pointer-events", "none");
}
function enableInteractivity() {
    select("#spcd3-toolbarRow")
        .style("pointer-events", "auto")
        .style("opacity", "1")
        .style("filter", "none")
        .style("cursor", "auto");
    selectAll("#spcd3-toolbarRow *").style("cursor", null);
    select("#spcd3-parallelcoords").style("pointer-events", "auto");
    select("#spcd3-parallelcoords").style("background", "var(--spcd3-bg)");
    selectAll(".hitarea").style("pointer-events", "stroke");
    selectAll(".spcd3-handle-hitbox").style("pointer-events", "auto");
    selectAll(".hitbox").style("pointer-events", "auto");
}
function setSelectableWidth(width) {
    setLineThickness(width);
    let hitarea_active = selectAll("path.hitarea");
    hitarea_active.each(function (d) {
        const value = width;
        select(this).style("stroke-width", value);
    });
}
function getSelectableWith() {
    return getLineThickness();
}
function setDimensionSpacing(spacingRem) {
    setDimensionSpacingVar(remToPixels(spacingRem));
    if (!parcoords.features.length || !parcoords.newDataset) {
        return;
    }
    const layout = calculateChartLayout(parcoords.features, parcoords.newDataset);
    setWidth(layout.chartWidth);
    parcoords.xScales = setupXScales(parcoords.features, parcoords.newDataset);
    select("#spcd3-pc_svg")
        .attr("width", layout.chartWidth)
        .attr("viewBox", [0, 0, layout.chartWidth, height])
        .style("inline-size", pixelsToRem(layout.chartWidth));
    select(".spcd3-chartWrapper").style("inline-size", pixelsToRem(layout.chartWidth));
    select("#spcd3-pc_svg .plot > rect").attr("width", layout.chartWidth);
    selectAll(".dimensions")
        .transition()
        .duration(300)
        .attr("transform", (d) => "translate(" +
        position(d.name || d, parcoords.dragging, parcoords.xScales) +
        ")");
    select("g.active")
        .selectAll("path")
        .transition()
        .duration(300)
        .attr("d", function (d) {
        return linePath(d, parcoords.newFeatures);
    });
    cleanTooltipSelect();
    getSelected().forEach((record) => {
        const path = parcoords.newDataset.find((d) => d[hoverlabel] === record);
        if (path && !isRecordInactive(record)) {
            createToolTipForValues(path, true);
        }
    });
    realignToolbarAfterSpacingChange();
}

// globals
const TOP_AXIS_LOW_VALUE = 40;
const TOP_AXIS_VALUE = 50;
const BOTTOM_AXIS_VALUE = 350;
const RECT_VALUE = 300;
const BRUSH_STATE_EPSILON = 0.75;
function toNumber(value) {
    return typeof value === "number" ? value : Number(value);
}
function isAtTopHandle(value) {
    return Math.abs(toNumber(value) - TOP_AXIS_LOW_VALUE) < BRUSH_STATE_EPSILON;
}
function isAtTopRect(value) {
    return Math.abs(toNumber(value) - TOP_AXIS_VALUE) < BRUSH_STATE_EPSILON;
}
function isAtBottom(value) {
    return Math.abs(toNumber(value) - BOTTOM_AXIS_VALUE) < BRUSH_STATE_EPSILON;
}
// Brushing
function setRectToDrag(featureAxis, tooltipValuesDown, tooltipValuesTop) {
    let delta;
    featureAxis.each(function (d) {
        const processedDimensionName = cleanString(d.name);
        select(this)
            .append("g")
            .attr("class", "spcd3-rect")
            .append("rect")
            .attr("id", "rect_" + processedDimensionName)
            .attr("width", 12)
            .attr("height", RECT_VALUE)
            .attr("x", -6)
            .attr("y", 50)
            .attr("fill", BRUSH_IDLE_FILL)
            .attr("opacity", "0.5")
            .call(drag()
            .on("drag", (event, d) => {
            selectAll("path.hitarea").style("pointer-events", "none");
            if (parcoords.newFeatures.length > 25) {
                throttleDragAndBrush(processedDimensionName, d, event, delta, tooltipValuesTop, tooltipValuesDown, window);
            }
            else {
                dragAndBrush(processedDimensionName, d, event, delta, tooltipValuesTop, tooltipValuesDown, window);
            }
        })
            .on("start", (event, d) => {
            let current = select("#rect_" + processedDimensionName);
            delta = current.attr("y") - event.y;
        })
            .on("end", () => {
            tooltipValuesTop.style("visibility", "hidden");
            tooltipValuesDown.style("visibility", "hidden");
            let active = select("g.active").selectAll("path");
            let hitarea = selectAll("path.hitarea");
            active.each(function (d) {
                const isActive = select(this).style("stroke");
                if (isActive === "var(--spcd3-active-records)") {
                    hitarea
                        .filter((d) => d[hoverlabel] === this.id)
                        .style("pointer-events", "stroke");
                }
            });
        }));
    });
}
function setBrushUp(featureAxis, brushOverlay, tooltipValues) {
    featureAxis.each(function (d) {
        const processedDimensionName = cleanString(d.name);
        const [arrowTopHotspotX, arrowTopHotspotY] = getCursorHotspot(getArrowTopCursorMeta(), 12);
        const g = select(this)
            .append("g")
            .attr("class", "brush_" + processedDimensionName);
        g.append("use")
            .attr("id", "triangle_up_" + processedDimensionName)
            .attr("x", -7)
            .attr("y", BOTTOM_AXIS_VALUE)
            .attr("width", 14)
            .attr("height", 10)
            .attr("href", "#brush_image_top")
            .attr("pointer-events", "none")
            .style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowTopCursor(), 12)))}') ${arrowTopHotspotX} ${arrowTopHotspotY}, auto`);
        const hit = g
            .append("rect")
            .attr("class", "spcd3-handle-hitbox")
            .attr("id", "triangle_up_hit" + processedDimensionName)
            .attr("x", -15)
            .attr("y", BOTTOM_AXIS_VALUE)
            .attr("width", 30)
            .attr("height", 30)
            .style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowTopCursor(), 12)))}') ${arrowTopHotspotX} ${arrowTopHotspotY}, auto`);
        const makeDrag = () => drag()
            .container(function () {
            return this.ownerSVGElement || this;
        })
            .on("start", () => {
            brushOverlay.raise().style("pointer-events", "all");
            g.select("#triangle_up_" + processedDimensionName).raise();
            g.selectAll(".spcd3-handle-hitbox").raise();
        })
            .on("drag", (event, dd) => {
            if (parcoords.newFeatures.length > 25) {
                throttleBrushUp(processedDimensionName, event, dd, tooltipValues, window);
            }
            else {
                brushUp(processedDimensionName, event, dd, tooltipValues, window);
            }
            const yNow = g
                .select("#triangle_up_" + processedDimensionName)
                .attr("y");
            if (yNow != null) {
                hit.attr("y", +yNow);
            }
            g.selectAll(".spcd3-handle-hitbox").raise();
        })
            .on("end", () => {
            cleanup(brushOverlay, tooltipValues);
            requestAnimationFrame(() => {
                const newHit = g.select(".spcd3-handle-hitbox");
                if (!newHit.empty()) {
                    newHit.call(makeDrag());
                }
            });
        });
        hit.call(makeDrag());
    });
}
function setBrushDown(featureAxis, brushOverlay, tooltipValues) {
    featureAxis.each(function (d) {
        const processedDimensionName = cleanString(d.name);
        const [arrowBottomHotspotX, arrowBottomHotspotY] = getCursorHotspot(getArrowBottomCursorMeta(), 12);
        const g = select(this)
            .append("g")
            .attr("class", "brush_" + processedDimensionName);
        g.append("use")
            .attr("id", "triangle_down_" + processedDimensionName)
            .attr("x", -7)
            .attr("y", TOP_AXIS_LOW_VALUE)
            .attr("width", 14)
            .attr("height", 10)
            .attr("href", "#brush_image_bottom")
            .attr("pointer-events", "none")
            .style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowBottomCursor(), 12)))}') ${arrowBottomHotspotX} ${arrowBottomHotspotY}, auto`);
        const hit = g
            .append("rect")
            .attr("class", "spcd3-handle-hitbox")
            .attr("id", "triangle_down_hit" + processedDimensionName)
            .attr("x", -15)
            .attr("y", TOP_AXIS_LOW_VALUE)
            .attr("width", 30)
            .attr("height", 30)
            .style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowBottomCursor(), 12)))}') ${arrowBottomHotspotX} ${arrowBottomHotspotY}, auto`);
        const makeDrag = () => drag()
            .container(function () {
            return this.ownerSVGElement || this;
        })
            .on("start", () => {
            brushOverlay.raise().style("pointer-events", "all");
            g.select("#triangle_down_" + processedDimensionName).raise();
            g.selectAll(".spcd3-handle-hitbox").raise();
        })
            .on("drag", (event, dd) => {
            if (parcoords.newFeatures.length > 25) {
                throttleBrushDown(processedDimensionName, event, dd, tooltipValues, window);
            }
            else {
                brushDown(processedDimensionName, event, dd, tooltipValues, window);
            }
            const yNow = g
                .select("#triangle_down_" + processedDimensionName)
                .attr("y");
            if (yNow != null) {
                hit.attr("y", +yNow);
            }
            g.selectAll(".spcd3-handle-hitbox").raise();
        })
            .on("end", () => {
            cleanup(brushOverlay, tooltipValues);
            requestAnimationFrame(() => {
                const newHit = g.select(".spcd3-handle-hitbox");
                if (!newHit.empty()) {
                    newHit.call(makeDrag());
                }
            });
        });
        hit.call(makeDrag());
    });
}
function cleanup(brushOverlay, tooltipValues) {
    brushOverlay.style("pointer-events", "none").lower();
    tooltipValues.style("visibility", "hidden");
}
function brushDown(cleanDimensionName, event, d, tooltipValues, window) {
    const [arrowTopAndBottomHotspotX, arrowTopAndBottomHotspotY] = getCursorHotspot(getArrowTopAndBottomMeta(), 20);
    const yPosBottom = Number(select("#triangle_up_" + cleanDimensionName).attr("y"));
    let yPosTop;
    let yPosRect;
    if (event.y < TOP_AXIS_LOW_VALUE) {
        yPosTop = TOP_AXIS_LOW_VALUE;
        yPosRect = TOP_AXIS_VALUE;
    }
    else if (event.y > yPosBottom - 10) {
        yPosTop = yPosBottom - 10;
        yPosRect = BOTTOM_AXIS_VALUE;
    }
    else if (event.y == yPosBottom - 10) {
        yPosTop = yPosBottom - 10;
        yPosRect = yPosTop + 10;
    }
    else {
        yPosTop = event.y;
        event.y;
        yPosRect = event.y + 10;
    }
    addPosition(yPosRect, d.name, "top");
    if (isAtTopHandle(yPosTop) && isAtBottom(yPosBottom)) {
        select("#rect_" + cleanDimensionName).style("cursor", "default");
    }
    else {
        select("#rect_" + cleanDimensionName).style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowTopAndBottom(), 20)))}') ${arrowTopAndBottomHotspotX} ${arrowTopAndBottomHotspotY}, auto`);
    }
    if (isAtTopHandle(yPosTop)) {
        select("#triangle_down_" + cleanDimensionName).attr("href", "#brush_image_bottom");
        select("#rect_" + cleanDimensionName)
            .attr("fill", BRUSH_IDLE_FILL)
            .attr("opacity", "0.5");
    }
    else {
        select("#triangle_down_" + cleanDimensionName).attr("href", "#brush_image_bottom_active");
        select("#rect_" + cleanDimensionName)
            .attr("fill", BRUSH_ACTIVE_FILL)
            .attr("opacity", "0.7");
    }
    select("#triangle_down_" + cleanDimensionName).attr("y", yPosTop);
    select("#triangle_down_hit" + cleanDimensionName).attr("y", yPosTop);
    const heightTopRect = yPosRect - TOP_AXIS_VALUE;
    const heightBottomRect = BOTTOM_AXIS_VALUE - yPosBottom;
    select("#rect_" + cleanDimensionName)
        .attr("y", yPosRect)
        .attr("height", RECT_VALUE - heightTopRect - heightBottomRect);
    if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
        setToolTipBrush(tooltipValues, d, event, window, true);
    }
    updateLines(d.name, cleanDimensionName);
}
function brushUp(cleanDimensionName, event, d, tooltipValues, window) {
    const [arrowTopAndBottomHotspotX, arrowTopAndBottomHotspotY] = getCursorHotspot(getArrowTopAndBottomMeta(), 20);
    const yPosTop = Number(select("#triangle_down_" + cleanDimensionName).attr("y"));
    let yPosBottom;
    if (event.y < yPosTop + 10) {
        yPosBottom = yPosTop + 10;
    }
    else if (event.y > BOTTOM_AXIS_VALUE) {
        yPosBottom = BOTTOM_AXIS_VALUE;
    }
    else if (event.y == yPosTop + 10) {
        yPosBottom = yPosTop;
    }
    else {
        yPosBottom = event.y;
    }
    addPosition(yPosBottom, d.name, "bottom");
    if (isAtTopHandle(yPosTop) && isAtBottom(yPosBottom)) {
        select("#rect_" + cleanDimensionName)
            .attr("href", "#brush_image_top_active")
            .style("cursor", "default")
            .style("fill", BRUSH_IDLE_FILL)
            .style("opacity", "0.5");
    }
    else {
        select("#rect_" + cleanDimensionName)
            .attr("href", "#brush_image_top_active")
            .style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowTopAndBottom(), 20)))}') ${arrowTopAndBottomHotspotX} ${arrowTopAndBottomHotspotY}, auto`)
            .style("fill", BRUSH_ACTIVE_FILL)
            .style("opacity", "0.7");
    }
    if (isAtBottom(yPosBottom)) {
        select("#triangle_up_" + cleanDimensionName).attr("href", "#brush_image_top");
    }
    else {
        select("#triangle_up_" + cleanDimensionName).attr("href", "#brush_image_top_active");
    }
    select("#triangle_up_" + cleanDimensionName).attr("y", yPosBottom);
    select("#triangle_up_hit" + cleanDimensionName).attr("y", yPosBottom);
    const heightTopRect = yPosTop - TOP_AXIS_LOW_VALUE;
    const heightBottomRect = BOTTOM_AXIS_VALUE - yPosBottom;
    select("#rect_" + cleanDimensionName).attr("height", RECT_VALUE - heightTopRect - heightBottomRect);
    if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
        setToolTipBrush(tooltipValues, d, event, window, false);
    }
    updateLines(d.name, cleanDimensionName);
}
function dragAndBrush(cleanDimensionName, d, event, delta, tooltipValuesTop, tooltipValuesDown, window) {
    let yPosTop;
    let yPosRect;
    const yPosBottom = select("#triangle_up_" + cleanDimensionName).attr("y");
    const yPosTopNew = select("#triangle_down_" + cleanDimensionName).attr("y");
    const heightTopRect = yPosTopNew - TOP_AXIS_LOW_VALUE;
    const heightBottomRect = BOTTOM_AXIS_VALUE - yPosBottom;
    const rectHeight = RECT_VALUE - heightTopRect - heightBottomRect;
    if (event.y + delta - 10 <= TOP_AXIS_LOW_VALUE) {
        yPosTop = TOP_AXIS_LOW_VALUE;
        yPosRect = TOP_AXIS_VALUE;
    }
    else if (event.y + delta + rectHeight >= BOTTOM_AXIS_VALUE) {
        yPosTop = BOTTOM_AXIS_VALUE - rectHeight - 10;
        yPosRect = BOTTOM_AXIS_VALUE - rectHeight;
    }
    else {
        yPosTop = event.y + delta - 10;
        event.y + delta - 10;
        yPosRect = yPosTop + 10;
    }
    addPosition(yPosRect, d.name, "top");
    addPosition(yPosRect + rectHeight, d.name, "bottom");
    if (isAtTopHandle(yPosTop)) {
        select("#triangle_down_" + cleanDimensionName).attr("href", "#brush_image_bottom");
    }
    else {
        select("#triangle_down_" + cleanDimensionName).attr("href", "#brush_image_bottom_active");
    }
    if (isAtBottom(yPosBottom)) {
        select("#triangle_up_" + cleanDimensionName).attr("href", "#brush_image_top");
    }
    else {
        select("#triangle_up_" + cleanDimensionName).attr("href", "#brush_image_top_active");
    }
    if (rectHeight < RECT_VALUE) {
        select("#rect_" + cleanDimensionName).attr("y", yPosRect);
        select("#triangle_down_" + cleanDimensionName).attr("y", yPosTop);
        select("#triangle_up_" + cleanDimensionName).attr("y", yPosRect + rectHeight);
        select("#triangle_up_hit" + cleanDimensionName).attr("y", yPosRect + rectHeight);
        select("#triangle_down_hit" + cleanDimensionName).attr("y", yPosTop);
        if (!isNaN(parcoords.yScales[d.name].domain()[0])) {
            setToolTipDragAndBrush(tooltipValuesTop, tooltipValuesDown, d, window, true, yPosTop, yPosRect + rectHeight);
        }
        updateLines(d.name, cleanDimensionName);
    }
}
function filter(dimensionName, min, max) {
    const cleanDimensionName = cleanString(dimensionName);
    const invertStatus = getInvertStatus(dimensionName);
    const yScale = parcoords.yScales[dimensionName];
    let topPosition = yScale(min);
    let bottomPosition = yScale(max);
    if (invertStatus) {
        [topPosition, bottomPosition] = [bottomPosition, topPosition];
    }
    const rectY = Math.min(topPosition, bottomPosition);
    const rectHeight = Math.abs(bottomPosition - topPosition);
    addPosition(topPosition, dimensionName, "top");
    addPosition(bottomPosition, dimensionName, "bottom");
    select("#rect_" + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr("y", rectY)
        .attr("height", rectHeight);
    select("#triangle_down_" + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr("y", rectY - 10);
    select("#triangle_down_hit" + cleanDimensionName).attr("y", rectY - 10);
    select("#triangle_up_" + cleanDimensionName)
        .transition()
        .duration(1000)
        .attr("y", rectY + rectHeight);
    select("#triangle_up_hit" + cleanDimensionName).attr("y", rectY + rectHeight);
    if (isAtTopRect(topPosition)) {
        select("#triangle_down_" + cleanDimensionName).attr("href", "#brush_image_bottom");
    }
    else {
        select("#triangle_down_" + cleanDimensionName).attr("href", "#brush_image_bottom_active");
    }
    if (isAtBottom(bottomPosition)) {
        select("#triangle_up_" + cleanDimensionName).attr("href", "#brush_image_top");
    }
    else {
        select("#triangle_up_" + cleanDimensionName).attr("href", "#brush_image_top_active");
    }
    if (!(isAtTopRect(topPosition) && isAtBottom(bottomPosition))) {
        select("#rect_" + cleanDimensionName)
            .attr("fill", BRUSH_ACTIVE_FILL)
            .attr("opacity", "0.7");
    }
    else {
        select("#rect_" + cleanDimensionName)
            .attr("fill", BRUSH_IDLE_FILL)
            .attr("opacity", "0.5");
    }
    let active = select("g.active").selectAll("path");
    const rectTop = Math.min(topPosition, bottomPosition);
    const rectBottom = Math.max(topPosition, bottomPosition);
    if (isDimensionCategorical(dimensionName)) {
        const selectedCategories = yScale.domain().filter((cat) => {
            const pos = yScale(cat);
            return pos >= rectTop && pos <= rectBottom;
        });
        addRange(selectedCategories, parcoords.currentPosOfDims, dimensionName, "currentFilterCategories");
    }
    else {
        addRange(yScale.invert(rectBottom), parcoords.currentPosOfDims, dimensionName, "currentFilterBottom");
        addRange(yScale.invert(rectTop), parcoords.currentPosOfDims, dimensionName, "currentFilterTop");
    }
    active.each(function (d) {
        const value = yScale(d[dimensionName]);
        const currentLine = getLineName(d);
        const dimNameToCheck = select("." + currentLine).text();
        const emptyString = "";
        if (value < rectTop || value > rectBottom) {
            if (dimNameToCheck === emptyString) {
                makeInactive(currentLine, dimensionName, 1000);
            }
        }
        else if (dimNameToCheck === dimensionName &&
            dimNameToCheck !== emptyString) {
            let checkedLines = [];
            parcoords.currentPosOfDims.forEach(function (item) {
                if (item.top != yScale.range()[1] || item.bottom != yScale.range()[0]) {
                    checkAllPositionsTop(item, dimensionName, d, checkedLines, currentLine);
                    checkAllPositionsBottom(item, dimensionName, d, checkedLines, currentLine);
                }
            });
            if (!checkedLines.includes(currentLine)) {
                makeActive(currentLine, d, 1000);
            }
        }
    });
}
function getLineName(d) {
    const keys = Object.keys(d);
    const key = keys[0];
    return cleanString(d[key]);
}
function addPosition(yPosTop, dimension, key) {
    const newObject = {};
    newObject[key] = yPosTop;
    const target = parcoords.currentPosOfDims.find((obj) => obj.key == dimension);
    Object.assign(target, newObject);
}
function setToolTipBrush(tooltipValues, d, event, window, direction) {
    const range = parcoords.yScales[d.name].domain();
    const invertStatus = getInvertStatus(d.name);
    const maxValue = invertStatus == false ? range[1] : range[0];
    const minValue = invertStatus == false ? range[0] : range[1];
    const scale = maxValue - minValue;
    let tooltipValue;
    if (invertStatus) {
        tooltipValue =
            direction == true
                ? (event.y - TOP_AXIS_LOW_VALUE) / (RECT_VALUE / scale) + minValue
                : (event.y - TOP_AXIS_VALUE) / (RECT_VALUE / scale) + minValue;
    }
    else {
        tooltipValue =
            direction == true
                ? maxValue - (event.y - TOP_AXIS_LOW_VALUE) / (RECT_VALUE / scale)
                : maxValue - (event.y - TOP_AXIS_VALUE) / (RECT_VALUE / scale);
    }
    if (!invertStatus) {
        if (tooltipValue > range[1]) {
            tooltipValue = range[1];
        }
        if (tooltipValue < range[0]) {
            tooltipValue = range[0];
        }
    }
    else {
        if (tooltipValue > range[0]) {
            tooltipValue = range[0];
        }
        if (tooltipValue < range[1]) {
            tooltipValue = range[1];
        }
    }
    const digs = getSigDig(d.name);
    tooltipValues.text(Math.round(tooltipValue.toPrecision(digs).toLocaleString("en-GB") * 10) /
        10);
    tooltipValues.style("visibility", "visible");
    tooltipValues
        .style("top", window.event.pageY / 16 + "rem")
        .style("left", window.event.pageX / 16 + "rem");
}
function setToolTipDragAndBrush(tooltipValuesTop, tooltipValuesDown, d, window, direction, yPosTop, yPosBottom) {
    const range = parcoords.yScales[d.name].domain();
    const invertStatus = getInvertStatus(d.name);
    const maxValue = invertStatus == false ? range[1] : range[0];
    const minValue = invertStatus == false ? range[0] : range[1];
    const scale = maxValue - minValue;
    let tooltipValueTop;
    let tooltipValueBottom;
    if (invertStatus) {
        tooltipValueTop =
            (yPosTop - TOP_AXIS_LOW_VALUE) / (RECT_VALUE / scale) + minValue
                ;
        tooltipValueBottom =
            (yPosBottom - TOP_AXIS_VALUE) / (RECT_VALUE / scale) + minValue
                ;
    }
    else {
        tooltipValueTop =
            maxValue - (yPosTop - TOP_AXIS_LOW_VALUE) / (RECT_VALUE / scale)
                ;
        tooltipValueBottom =
            maxValue - (yPosBottom - TOP_AXIS_VALUE) / (RECT_VALUE / scale)
                ;
    }
    if ((!invertStatus && tooltipValueTop == maxValue) ||
        (invertStatus && tooltipValueTop == minValue)) {
        tooltipValuesTop.style("visibility", "hidden");
    }
    else {
        tooltipValuesTop.text(Math.round(tooltipValueTop));
        tooltipValuesTop.style("visibility", "visible");
        tooltipValuesTop
            .style("top", Number(yPosTop + 180) / 16 + "rem")
            .style("left", window.event.pageX / 16 + "rem");
    }
    if ((!invertStatus && tooltipValueBottom == minValue) ||
        (invertStatus && tooltipValueBottom == maxValue)) {
        tooltipValuesDown.style("visibility", "hidden");
    }
    else {
        tooltipValuesDown.text(Math.round(tooltipValueBottom));
        tooltipValuesDown.style("visibility", "visible");
        tooltipValuesDown
            .style("top", Number(yPosBottom + 180) / 16 + "rem")
            .style("left", window.event.pageX / 16 + "rem");
    }
}
function updateLines(dimension, cleanDimensionName) {
    const rangeTop = Number(select("#triangle_down_" + cleanDimensionName).attr("y"));
    const rangeBottom = Number(select("#triangle_up_" + cleanDimensionName).attr("y"));
    const invertStatus = getInvertStatus(dimension);
    const maxValue = invertStatus == false
        ? parcoords.yScales[dimension].domain()[1]
        : parcoords.yScales[dimension].domain()[0];
    const minValue = invertStatus == false
        ? parcoords.yScales[dimension].domain()[0]
        : parcoords.yScales[dimension].domain()[1];
    const range = maxValue - minValue;
    let currentFilters = getFilter(dimension);
    if (isDimensionCategorical(dimension)) {
        const selectedCategories = parcoords.yScales[dimension]
            .domain()
            .filter((cat) => {
            const pos = parcoords.yScales[dimension](cat);
            return pos >= rangeTop && pos <= rangeBottom;
        });
        addRange(selectedCategories, parcoords.currentPosOfDims, dimension, "currentFilterCategories");
    }
    else {
        addRange(currentFilters[0], parcoords.currentPosOfDims, dimension, "currentFilterBottom");
        addRange(currentFilters[1], parcoords.currentPosOfDims, dimension, "currentFilterTop");
    }
    let active = select("g.active").selectAll("path");
    active.each(function (d) {
        let value;
        if (invertStatus) {
            value = isNaN(maxValue)
                ? parcoords.yScales[dimension](d[dimension])
                : (RECT_VALUE / range) * (d[dimension] - minValue) + TOP_AXIS_VALUE;
        }
        else {
            value = isNaN(maxValue)
                ? parcoords.yScales[dimension](d[dimension])
                : (RECT_VALUE / range) * (maxValue - d[dimension]) + TOP_AXIS_VALUE;
        }
        const currentLine = getLineName(d);
        const dimNameToCheck = select("." + currentLine).text();
        const emptyString = "";
        if (value < rangeTop + 10 || value > rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimension, 100);
            }
        }
        else if (value == BOTTOM_AXIS_VALUE &&
            value == rangeTop + 10 &&
            value == rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimension, 100);
            }
        }
        else if (value == TOP_AXIS_VALUE &&
            value == rangeTop + 10 &&
            value == rangeBottom) {
            if (dimNameToCheck == emptyString) {
                makeInactive(currentLine, dimension, 100);
            }
        }
        else if (dimNameToCheck == dimension && dimNameToCheck != emptyString) {
            let checkedLines = [];
            parcoords.currentPosOfDims.forEach(function (item) {
                if (item.top != TOP_AXIS_VALUE || item.bottom != BOTTOM_AXIS_VALUE) {
                    checkAllPositionsTop(item, dimension, d, checkedLines, currentLine);
                    checkAllPositionsBottom(item, dimension, d, checkedLines, currentLine);
                }
            });
            if (!checkedLines.includes(currentLine)) {
                makeActive(currentLine, d, RECT_VALUE);
            }
        }
        else ;
    });
}
function addRange(value, dims, dimension, property) {
    const dimSettings = dims.find((d) => d.key === dimension);
    if (!dimSettings)
        return;
    const yScale = parcoords.yScales[dimension];
    const domain = yScale.domain();
    if (typeof domain[0] === "number") {
        dimSettings.type = "numeric";
        if (property === "currentFilterTop" || property === "currentFilterBottom") {
            dimSettings[property] = value;
        }
    }
    else {
        dimSettings.type = "categorical";
        if (property === "currentFilterCategories") {
            dimSettings.currentFilterCategories = value;
        }
    }
}
function checkAllPositionsTop(positionItem, dimension, d, checkedLines, currentLine) {
    if (positionItem.key != dimension && positionItem.top != TOP_AXIS_LOW_VALUE) {
        const invertStatus = getInvertStatus(positionItem.key);
        const maxValue = invertStatus == false
            ? parcoords.yScales[positionItem.key].domain()[1]
            : parcoords.yScales[positionItem.key].domain()[0];
        const minValue = invertStatus == false
            ? parcoords.yScales[positionItem.key].domain()[0]
            : parcoords.yScales[positionItem.key].domain()[1];
        const scale = maxValue - minValue;
        let value;
        if (!isNaN(maxValue)) {
            value =
                invertStatus == false
                    ? (RECT_VALUE / scale) * (maxValue - d[positionItem.key]) +
                        TOP_AXIS_VALUE
                    : (RECT_VALUE / scale) * (d[positionItem.key] - minValue) +
                        TOP_AXIS_VALUE;
        }
        else {
            value = parcoords.yScales[positionItem.key](d[positionItem.key]);
        }
        if (value < positionItem.top) {
            checkedLines.push(currentLine);
            select("." + currentLine).text(positionItem.key);
        }
    }
}
function checkAllPositionsBottom(positionItem, dimension, d, checkedLines, currentLine) {
    if (positionItem.key != dimension &&
        positionItem.bottom != BOTTOM_AXIS_VALUE) {
        const invertStatus = getInvertStatus(positionItem.key);
        const maxValue = invertStatus == false
            ? parcoords.yScales[positionItem.key].domain()[1]
            : parcoords.yScales[positionItem.key].domain()[0];
        const minValue = invertStatus == false
            ? parcoords.yScales[positionItem.key].domain()[0]
            : parcoords.yScales[positionItem.key].domain()[1];
        const scale = maxValue - minValue;
        let value;
        if (!isNaN(maxValue)) {
            value =
                invertStatus == false
                    ? (RECT_VALUE / scale) * (maxValue - d[positionItem.key]) +
                        TOP_AXIS_VALUE
                    : (RECT_VALUE / scale) * (d[positionItem.key] - minValue) +
                        TOP_AXIS_VALUE;
        }
        else {
            value = parcoords.yScales[positionItem.key](d[positionItem.key]);
        }
        if (value >= positionItem.bottom) {
            checkedLines.push(currentLine);
            select("." + currentLine).text(positionItem.key);
        }
    }
}
function makeActive(currentLineName, record, duration) {
    if (select("." + currentLineName).classed("selected")) {
        select("." + currentLineName)
            .text("")
            .transition()
            .duration(duration)
            .style("stroke", "rgba(255, 165, 0, 1)");
        select("#area_" + currentLineName)
            .style("pointer-events", "stroke")
            .style("stroke", "transparent")
            .style("stroke-width", getLineThickness() + "rem")
            .text("");
        createToolTipForValues(record, true);
    }
    else if (select("." + currentLineName).classed("colored")) {
        let color = select("." + currentLineName).property("clusterColor");
        select("." + currentLineName)
            .text("")
            .transition()
            .duration(duration)
            .style("stroke", color);
        select("#area_" + currentLineName)
            .style("pointer-events", "stroke")
            .style("stroke", "transparent")
            .style("stroke-width", getLineThickness() + "rem")
            .text("");
    }
    else {
        select("." + currentLineName)
            .text("")
            .transition()
            .duration(duration)
            .style("stroke", "var(--spcd3-active-records)");
        select("#area_" + currentLineName)
            .style("pointer-events", "stroke")
            .style("stroke", "transparent")
            .style("stroke-width", getLineThickness() + "rem")
            .text("");
    }
}
function makeInactive(currentLineName, dimension, duration) {
    const line = select("." + currentLineName);
    const hitline = select("#area_" + currentLineName);
    line
        .text(dimension)
        .transition()
        .duration(duration)
        .style("stroke", getInactiveLineStroke())
        .style("pointer-events", "none");
    selectAll(`#tooltip-record-select-${currentLineName}`).style("display", "none");
    hitline
        .text(dimension)
        .transition()
        .duration(duration)
        .style("stroke", "transparent")
        .style("stroke-width", getLineThickness() + "rem")
        .on("end", function () {
        select(this).style("pointer-events", "none");
    });
}
function addSettingsForBrushing(dimension, invertStatus) {
    const processedName = cleanString(dimension);
    const yScale = parcoords.yScales[dimension];
    const dimensionSettings = parcoords.currentPosOfDims.find((d) => d.key === dimension);
    let top, bottom;
    if (isDimensionCategorical(dimension)) {
        const domain = yScale.domain();
        const filteredCategories = dimensionSettings.currentFilterCategories;
        const hasActiveCategoryFilter = Array.isArray(filteredCategories) &&
            filteredCategories.length > 0 &&
            filteredCategories.length < domain.length;
        if (!hasActiveCategoryFilter) {
            top = TOP_AXIS_VALUE;
            bottom = BOTTOM_AXIS_VALUE;
        }
        else {
            const sorted = filteredCategories
                .slice()
                .sort((a, b) => yScale(a) - yScale(b));
            const topCategory = sorted[0];
            const bottomCategory = sorted[sorted.length - 1];
            top = yScale(topCategory);
            bottom = yScale(bottomCategory);
        }
    }
    else {
        top = yScale(dimensionSettings.currentFilterTop);
        bottom = yScale(dimensionSettings.currentFilterBottom);
    }
    if (invertStatus) {
        [top, bottom] = [bottom, top];
    }
    const rectY = Math.min(top, bottom);
    const rectH = Math.abs(bottom - top);
    const rect = select("#rect_" + processedName);
    const triDown = select("#triangle_down_" + processedName);
    const triUp = select("#triangle_up_" + processedName);
    const hitTriDown = select("#triangle_down_hit" + processedName);
    const hitTriUp = select("#triangle_up_hit" + processedName);
    rect.transition().duration(RECT_VALUE).attr("y", rectY).attr("height", rectH);
    triDown
        .transition()
        .duration(RECT_VALUE)
        .attr("y", rectY - 10);
    triUp
        .transition()
        .duration(RECT_VALUE)
        .attr("y", rectY + rectH);
    hitTriDown.attr("y", rectY - 10);
    hitTriUp.attr("y", rectY + rectH);
    if (isAtTopHandle(rectY - 10)) {
        select("#triangle_down_" + processedName).attr("href", "#brush_image_bottom");
    }
    else {
        select("#triangle_down_" + processedName).attr("href", "#brush_image_bottom_active");
    }
    if (isAtBottom(rectY + rectH)) {
        select("#triangle_up_" + processedName).attr("href", "#brush_image_top");
    }
    else {
        select("#triangle_up_" + processedName).attr("href", "#brush_image_top_active");
    }
    if (isDimensionCategorical(dimension)) {
        addPosition(bottom, dimension, "top");
        addPosition(top, dimension, "bottom");
    }
    else {
        addPosition(top, dimension, "top");
        addPosition(bottom, dimension, "bottom");
    }
}
function getInvertStatus(key) {
    const item = parcoords.currentPosOfDims.find((object) => object.key == key);
    return item.isInverted;
}
function getSigDig(key) {
    const item = parcoords.currentPosOfDims.find((object) => object.key == key);
    return item.sigDig;
}
function addInvertStatus(status, dimensionName, key) {
    const newObject = {};
    newObject[key] = status;
    const target = parcoords.currentPosOfDims.find((obj) => obj.key == dimensionName);
    Object.assign(target, newObject);
}
const delay = 50;
const throttleBrushDown = throttle(brushDown, delay);
const throttleBrushUp = throttle(brushUp, delay);
const throttleDragAndBrush = throttle(dragAndBrush, delay);

let scrollXPos;
let timer = null;
function setContextMenu(featureAxis) {
    createContextMenu();
    createModalToSetRange();
    createModalToFilter();
    setToolTipsOnFeatureAxis(featureAxis);
    featureAxis.on("contextmenu", function (event, d) {
        const dimension = d.name;
        styleContextMenu(event);
        hideDimensionMenu(dimension);
        invertDimensionMenu(dimension);
        setRangeMenu(dimension);
        resetRangeMenu(dimension);
        resetRoundRangeMenu(dimension);
        filterMenu(dimension);
        resetFilterMenu(dimension);
        showAllMenu();
        copyDimensionName(dimension);
        select("#contextmenuRecords").style("display", "none");
        event.preventDefault();
    });
}
function setToolTipsOnFeatureAxis(featureAxis) {
    let tooltipFeatures = select("body")
        .append("div")
        .attr("id", "tooltip")
        .attr("class", "spcd3-tooltip-dimension");
    featureAxis
        .append("text")
        .attr("class", "dimension")
        .attr("text-anchor", "middle")
        .attr("y", 18)
        .text((d) => d.name.length > 10 ? d.name.substr(0, 10) + "..." : d.name)
        .style("font-size", "0.7rem")
        .call(drag()
        .on("start", onDragStartEventHandler())
        .on("drag", onDragEventHandler(featureAxis))
        .on("end", onDragEndEventHandler(featureAxis)))
        .on("mouseover", function () {
        return tooltipFeatures.style("visibility", "visible");
    })
        .on("mousemove", (event, d) => {
        setCursorForDimensions(d, featureAxis);
        const [x, y] = getMouseCoords(event);
        tooltipFeatures.text(d.name);
        tooltipFeatures
            .style("left", x / 16 + "rem")
            .style("top", y / 16 + "rem");
        return tooltipFeatures;
    })
        .on("mouseout", function () {
        return tooltipFeatures.style("visibility", "hidden");
    });
}
function copyDimensionName(dimension) {
    select("#copyDimensionName")
        .style("visibility", "visible")
        .on("click", async (event) => {
        await navigator.clipboard.writeText(dimension);
        select("#contextmenu").style("display", "none");
        event.stopPropagation();
    });
}
function showAllMenu() {
    select("#showAllMenu")
        .style("visibility", "visible")
        .style("border-top", "0.08rem solid var(--spcd3-border-subtle)")
        .on("click", (event) => {
        const hiddenDimensions = getAllHiddenDimensionNames();
        for (let i = 0; i < hiddenDimensions.length; i++) {
            show(hiddenDimensions[i]);
        }
        select("#contextmenu").style("display", "none");
        event.stopPropagation();
    });
}
function resetFilterMenu(dimension) {
    if (isDimensionCategorical(dimension)) {
        select("#resetfilterMenu").style("color", "var(--spcd3-text-disabled)");
        return;
    }
    select("#resetfilterMenu")
        .style("visibility", "visible")
        .style("color", "var(--spcd3-text)")
        .on("click", (event) => {
        const range = getDimensionRange(dimension);
        const inverted = isInverted(dimension);
        if (inverted) {
            setFilter(dimension, Number(range[0]), Number(range[1]));
        }
        else {
            setFilter(dimension, Number(range[1]), Number(range[0]));
        }
        select("#contextmenu").style("display", "none");
        event.stopPropagation();
    });
}
function filterMenu(dimension) {
    let filterMenu = select("#filterMenu");
    filterMenu.style("border-top", "0.08rem solid var(--spcd3-border-subtle)");
    if (isDimensionCategorical(dimension)) {
        filterMenu.style("color", "var(--spcd3-text-disabled)");
        return;
    }
    let currentFilters = getFilter(dimension);
    let minFilterValue = select("#minFilterValue");
    let maxFilterValue = select("#maxFilterValue");
    minFilterValue.property("value", currentFilters[0]);
    maxFilterValue.property("value", currentFilters[1]);
    minFilterValue.on("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("buttonFilter")?.click();
        }
    });
    maxFilterValue.on("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("buttonFilter")?.click();
        }
    });
    filterMenu.style("visibility", "visible").style("color", "var(--spcd3-text)");
    filterMenu.on("click", (event) => {
        select("#modalOverlayFilter").style("display", "block");
        select("#modalFilter").style("display", "block");
        select("#contextmenu").style("display", "none");
        const header = dimension.length > 25 ? dimension.substr(0, 25) + "..." : dimension;
        select("#headerDimensionFilter").text(header);
        select("#closeButtonFilter").on("click", () => {
            select("#errorFilter").style("display", "none");
            select("#modalFilter").style("display", "none");
            select("#modalOverlayFilter").style("display", "none");
        });
        select("#buttonFilter").on("click", () => {
            handleFilterButton(dimension);
            select("#contextmenu").style("display", "none");
            event.stopPropagation();
        });
    });
}
function handleFilterButton(dimension) {
    let isOk = false;
    let minFilterValue = select("#minFilterValue");
    let maxFilterValue = select("#maxFilterValue");
    let errorMessage = select("#errorFilter").style("display", "block");
    let min = Number(minFilterValue.node().value);
    let max = Number(maxFilterValue.node().value);
    const inverted = isInverted(dimension);
    const ranges = getDimensionRange(dimension);
    const minRange = Number(inverted ? ranges[1] : ranges[0]);
    const maxRange = Number(inverted ? ranges[0] : ranges[1]);
    select("#infoFilter").text(`Set a filter between ${minRange} and ${maxRange}.`);
    if (max < min) {
        max = maxRange;
        errorMessage.text(`Max value is smaller than min value, filter is set to 
      min.`);
    }
    else if (min < minRange) {
        min = minRange;
        errorMessage.text(`Min value is smaller than ${getMinValue(dimension)},
     filter is set to min.`);
    }
    else if (min > maxRange) {
        min = maxRange;
        errorMessage.text(`Min value is bigger than max range value, filter is set
      to max.`);
    }
    else if (max > maxRange) {
        max = maxRange;
        errorMessage.text(`Max value is bigger than ${getMaxValue(dimension)},
     filter is set to max.`);
    }
    else if (max < minRange) {
        max = minRange;
        errorMessage.text(`Max value is smaller than min range value, 
      filter is set to min.`);
    }
    else {
        isOk = true;
    }
    setFilter(dimension, max, min);
    if (isOk) {
        select("#errorFilter").style("display", "none");
        select("#modalFilter").style("display", "none");
        select("#modalOverlayFilter").style("display", "none");
    }
}
function resetRoundRangeMenu(dimension) {
    if (isDimensionCategorical(dimension)) {
        select("#resetRoundRangeMenu").style("color", "var(--spcd3-text-disabled)");
        return;
    }
    select("#resetRoundRangeMenu")
        .style("visibility", "visible")
        .style("color", "var(--spcd3-text)")
        .on("click", (event) => {
        setDimensionRangeRounded(dimension, getMinValue(dimension), getMaxValue(dimension));
        select("#contextmenu").style("display", "none");
        event.stopPropagation();
    });
}
function resetRangeMenu(dimension) {
    if (isDimensionCategorical(dimension)) {
        select("#resetRangeMenu")
            .style("display", "false")
            .style("color", "var(--spcd3-text-disabled)");
        return;
    }
    select("#resetRangeMenu")
        .style("visibility", "visible")
        .style("color", "var(--spcd3-text)")
        .on("click", (event) => {
        setDimensionRange(dimension, getMinValue(dimension), getMaxValue(dimension));
        select("#contextmenu").style("display", "none");
        event.stopPropagation();
    });
}
function setRangeMenu(dimension) {
    let rangeMenu = select("#rangeMenu");
    rangeMenu.style("border-top", "0.08rem solid var(--spcd3-border-subtle)");
    if (isDimensionCategorical(dimension)) {
        rangeMenu.style("color", "var(--spcd3-text-disabled)");
        return;
    }
    rangeMenu.style("visibility", "visible").style("color", "var(--spcd3-text)");
    rangeMenu.on("click", (event) => {
        handleRangeButton(dimension);
        select("#closeButtonRange").on("click", () => {
            select("#modalSetRange").style("display", "none");
            select("#errorRange").style("display", "none");
            select("#modalOverlaySetRange").style("display", "none");
        });
        select("#contextmenu").style("display", "none");
        event.stopPropagation();
    });
}
function handleRangeButton(dimension) {
    let minRange = getCurrentMinRange(dimension);
    let maxRange = getCurrentMaxRange(dimension);
    let resultMin = minRange - Math.floor(minRange) !== 0;
    let resultMax = maxRange - Math.floor(maxRange) !== 0;
    let minValue = String(minRange);
    let maxValue = String(maxRange);
    let errorMessage = select("#errorRange");
    if (resultMin && !resultMax) {
        const count = minValue.split(".")[1].length;
        maxValue = maxRange.toFixed(count);
    }
    else if (!resultMin && resultMax) {
        const count = maxValue.split(".")[1].length;
        minValue = minRange.toFixed(count);
    }
    select("#minRangeValue").property("value", minValue);
    select("#maxRangeValue").property("value", maxValue);
    select("#contextmenu").style("display", "none");
    select("#modalOverlaySetRange").style("display", "block");
    select("#modalSetRange").style("display", "block");
    const newText = dimension.length > 25 ? dimension.substr(0, 25) + "..." : dimension;
    select("#headerDimensionRange").text(newText);
    select("#infoRange3").text("Range values must be below the minimum and above the maximum data value.");
    select("#infoRange").text("The current range of " +
        dimension +
        " is between " +
        minValue +
        " and " +
        maxValue +
        ".");
    select("#infoRange2").text("The original range of " +
        dimension +
        " is between " +
        getMinValue(dimension) +
        " and " +
        getMaxValue(dimension) +
        ".");
    select("#buttonRange").on("click", () => {
        let min = select("#minRangeValue").node().value;
        let max = select("#maxRangeValue").node().value;
        const inverted = isInverted(dimension);
        let isOk = true;
        if (inverted) {
            if (max < getMinValue(dimension) ||
                min > getMaxValue(dimension)) {
                errorMessage.text(`The range has to be bigger than ${minValue} and smaller than ${maxValue}.`);
                isOk = false;
            }
        }
        else {
            if (min > getMinValue(dimension) ||
                max < getMaxValue(dimension)) {
                errorMessage.text(`The range has to be smaller than ${minValue} and bigger than ${maxValue}.`);
                isOk = false;
            }
        }
        if (isOk) {
            setDimensionRange(dimension, min, max);
            errorMessage.style("display", "none");
            select("#modalSetRange").style("display", "none");
            select("#modalOverlaySetRange").style("display", "none");
        }
        else {
            errorMessage.style("display", "block");
        }
    });
    select("#maxRangeValue").on("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("buttonRange")?.click();
        }
    });
    select("#minRangeValue").on("keypress", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            document.getElementById("buttonRange")?.click();
        }
    });
}
function invertDimensionMenu(dimension) {
    select("#invertMenu").on("click", (event) => {
        invert(dimension);
        select("#contextmenu").style("display", "none");
        event.stopPropagation();
    });
}
function hideDimensionMenu(dimension) {
    select("#hideMenu")
        .style("border-top", "0.08rem solid var(--spcd3-border-subtle)")
        .on("click", (event) => {
        hide(dimension);
        select("#contextmenu").style("display", "none");
        event.stopPropagation();
    });
}
function getContextMenuLeftPosition(container, menuElement, clickX) {
    const containerRect = container.getBoundingClientRect();
    const previousDisplay = menuElement.style.display;
    const previousVisibility = menuElement.style.visibility;
    if (getComputedStyle(menuElement).display === "none") {
        menuElement.style.visibility = "hidden";
        menuElement.style.display = "block";
    }
    const menuWidth = menuElement.getBoundingClientRect().width;
    menuElement.style.display = previousDisplay;
    menuElement.style.visibility = previousVisibility;
    const availableRightSpace = containerRect.width - clickX;
    if (menuWidth > availableRightSpace) {
        return Math.max(0, clickX - menuWidth);
    }
    return clickX;
}
function styleContextMenu(event) {
    const container = document.querySelector("#spcd3-parallelcoords");
    if (!container)
        return;
    const menuElement = document.querySelector("#contextmenu");
    if (!menuElement)
        return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const left = getContextMenuLeftPosition(container, menuElement, x);
    select("#contextmenu")
        .style("left", left + "px")
        .style("top", y + "px")
        .style("display", "block")
        .on("click", (event) => {
        event.stopPropagation();
    });
    selectAll(".contextmenu").style("padding", 0.35 + "rem");
}
function setCursorForDimensions(d, featureAxis) {
    if (getDimensionPosition(d.name) == 0) {
        const [hotspotX, hotspotY] = getCursorHotspot(getArrowRightMeta(), 14);
        featureAxis
            .select(".dimension")
            .style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowRight(), 14)))}') ${hotspotX} ${hotspotY}, auto`);
    }
    else if (getDimensionPosition(d.name) ==
        parcoords.newFeatures.length - 1) {
        const [hotspotX, hotspotY] = getCursorHotspot(getArrowLeftMeta(), 14);
        featureAxis
            .select(".dimension")
            .style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowLeft(), 14)))}') ${hotspotX} ${hotspotY}, auto`);
    }
    else {
        const [hotspotX, hotspotY] = getCursorHotspot(getArrowLeftAndRightMeta(), 14);
        featureAxis
            .select(".dimension")
            .style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowLeftAndRight(), 14)))}') ${hotspotX} ${hotspotY}, auto`);
    }
}
function onDragStartEventHandler() {
    {
        return function onDragStart(d) {
            this.__origin__ = parcoords.xScales(d.subject.name);
            parcoords.dragging[d.subject.name] = this.__origin__;
            parcoords.dragPosStart[d.subject.name] = this.__origin__;
            const element = document.getElementById("spcd3-parallelcoords");
            if (!element)
                return;
            scrollXPos = element.scrollLeft;
        };
    }
}
function onDragEventHandler(featureAxis) {
    {
        return function onDrag(d) {
            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
            timer = setInterval(() => {
                (scroll(d));
            });
            parcoords.dragging[d.subject.name] = Math.min(width - paddingXaxis, Math.max(paddingXaxis, (this.__origin__ += d.x)));
            active.each(function (d) {
                select(this).attr("d", linePath(d, parcoords.newFeatures));
            });
            let hitarea_active = selectAll("path.hitarea");
            hitarea_active.each(function (d) {
                select(this).attr("d", linePath(d, parcoords.newFeatures));
            });
            parcoords.newFeatures.sort((a, b) => {
                return (position(b, parcoords.dragging, parcoords.xScales) -
                    position(a, parcoords.dragging, parcoords.xScales) -
                    1);
            });
            parcoords.xScales.domain(parcoords.newFeatures);
            featureAxis.attr("transform", (d) => {
                return ("translate(" +
                    position(d.name, parcoords.dragging, parcoords.xScales) +
                    ")");
            });
        };
    }
}
function onDragEndEventHandler(featureAxis) {
    {
        return function onDragEnd(d) {
            const distance = (width - 80) / parcoords.newFeatures.length;
            const init = parcoords.dragPosStart[d.subject.name];
            if (parcoords.dragPosStart[d.subject.name] >
                parcoords.dragging[d.subject.name]) {
                featureAxis.attr("transform", (d) => {
                    return ("translate(" +
                        position(d.name, init - distance, parcoords.xScales) +
                        ")");
                });
            }
            else {
                featureAxis.attr("transform", (d) => {
                    return ("translate(" +
                        position(d.name, init - distance, parcoords.xScales) +
                        ")");
                });
            }
            delete this.__origin__;
            delete parcoords.dragging[d.subject.name];
            delete parcoords.dragPosStart[d.subject.name];
            syncDimensionOrderWithVisible();
            trans(active).each(function (d) {
                select(this).attr("d", linePath(d, parcoords.newFeatures));
            });
            cleanTooltipSelect();
            var selectedRecords = getSelected();
            selectedRecords.forEach((record) => {
                const path = parcoords.newDataset.find((d) => d[hoverlabel] === record);
                if (!isRecordInactive(record)) {
                    createToolTipForValues(path, true);
                }
            });
        };
    }
}
function scroll(d) {
    const element = document.getElementById("spcd3-parallelcoords");
    if (!element)
        return;
    if (parcoords.dragPosStart[d.subject.name] < parcoords.dragging[d.subject.name]) {
        element.scrollLeft += 5;
    }
    else if (scrollXPos + 20 > parcoords.dragging[d.subject.name]) {
        element.scrollLeft -= 5;
    }
}
function createContextMenu() {
    let contextMenu = select("#spcd3-parallelcoords")
        .append("g")
        .attr("class", "spcd3-contextmenu-dimensions")
        .attr("id", "contextmenu")
        .style("position", "absolute")
        .style("display", "none");
    contextMenu
        .append("div")
        .attr("id", "copyDimensionName")
        .attr("class", "contextmenu")
        .attr("title", "Copy name of dimension")
        .text("Copy Name");
    contextMenu
        .append("div")
        .attr("id", "hideMenu")
        .attr("class", "contextmenu")
        .attr("title", "Hide dimension")
        .text("Hide");
    contextMenu
        .append("div")
        .attr("id", "invertMenu")
        .attr("class", "contextmenu")
        .attr("title", "Invert dimension")
        .text("Invert");
    contextMenu
        .append("div")
        .attr("id", "rangeMenu")
        .attr("class", "contextmenu")
        .attr("title", "Set range on a dimension")
        .text("Set Range...");
    contextMenu
        .append("div")
        .attr("id", "resetRangeMenu")
        .attr("class", "contextmenu")
        .attr("title", "Set range on a dimension from data")
        .text("Set Range from Data");
    contextMenu
        .append("div")
        .attr("id", "resetRoundRangeMenu")
        .attr("class", "contextmenu")
        .attr("title", "Set rounded range on a dimension from data")
        .text("Set Rounded Range from Data");
    contextMenu
        .append("div")
        .attr("id", "filterMenu")
        .attr("class", "contextmenu")
        .attr("title", "Set filter on a dimension")
        .text("Set Filter...");
    contextMenu
        .append("div")
        .attr("id", "resetfilterMenu")
        .attr("class", "contextmenu")
        .attr("title", "Reset filter on a dimension")
        .text("Reset Filter");
    contextMenu
        .append("div")
        .attr("id", "showAllMenu")
        .attr("class", "contextmenu")
        .attr("title", "Show all dimensions")
        .text("Show All Dimensions");
}
function createModalToSetRange() {
    select("body")
        .append("div")
        .attr("class", "spcd3-modal-overlay")
        .attr("id", "modalOverlaySetRange");
    select("#modalOverlaySetRange").on("click", () => {
        select("#modalSetRange").style("display", "none");
        select("#modalOverlaySetRange").style("display", "none");
    });
    const modalSetRange = select("body")
        .append("div")
        .attr("class", "spcd3-modal")
        .attr("id", "modalSetRange")
        .style("display", "none");
    createModalTitle(modalSetRange, "Set Range for ");
    createCloseButton(modalSetRange, "closeButtonRange");
    createHeader(modalSetRange, "headerDimensionRange");
    createInfoMessage(modalSetRange, "infoRange3");
    createInfoMessage(modalSetRange, "infoRange");
    createInfoMessage(modalSetRange, "infoRange2");
    createInputFieldWithLabel(modalSetRange, "Min", "minRangeValue");
    createInputFieldWithLabel(modalSetRange, "Max", "maxRangeValue");
    createButton(modalSetRange, "buttonRange");
    createErrorMessage(modalSetRange, "errorRange");
}
function createModalToFilter() {
    select("body")
        .append("div")
        .attr("class", "spcd3-modal-overlay")
        .attr("id", "modalOverlayFilter");
    select("#modalOverlayFilter").on("click", () => {
        select("#modalFilter").style("display", "none");
        select("#modalOverlayFilter").style("display", "none");
    });
    const modalFilter = select("body")
        .append("div")
        .attr("class", "spcd3-modal")
        .attr("id", "modalFilter")
        .style("display", "none");
    createModalTitle(modalFilter, "Set Filter for ");
    createCloseButton(modalFilter, "closeButtonFilter");
    createHeader(modalFilter, "headerDimensionFilter");
    createInfoMessage(modalFilter, "infoFilter");
    createInputFieldWithLabel(modalFilter, "Min", "minFilterValue");
    createInputFieldWithLabel(modalFilter, "Max", "maxFilterValue");
    createButton(modalFilter, "buttonFilter");
    createErrorMessage(modalFilter, "errorFilter");
}
function createModalTitle(modal, modalTitel) {
    const title = document.createElement("div");
    title.className = "spcd3-modal-title";
    title.textContent = modalTitel;
    modal.append(() => title);
}
function createHeader(modal, id) {
    const header = document.createElement("div");
    header.id = id;
    header.className = "spcd3-modal-title";
    modal.append(() => header);
}
function createInfoMessage(modal, id) {
    const infoMessage = document.createElement("div");
    infoMessage.id = id;
    infoMessage.className = "spcd3-modal-notes";
    modal.append(() => infoMessage);
}
function createInputFieldWithLabel(modal, text, inputId) {
    const label = document.createElement("label");
    label.className = "spcd3-modal-label";
    label.textContent = text;
    modal.append(() => label);
    const input = document.createElement("input");
    input.className = "spcd3-modal-input";
    input.type = "number";
    input.id = inputId;
    modal.append(() => input);
}
function createButton(modal, id) {
    const button = document.createElement("button");
    button.className = "spcd3-button spcd3-save-button";
    button.id = id;
    button.textContent = "Save";
    modal.append(() => button);
}
function createCloseButton(modal, id) {
    const closeButton = document.createElement("span");
    closeButton.className = "spcd3-close-button";
    closeButton.id = id;
    closeButton.innerHTML = "&times;";
    modal.append(() => closeButton);
}
function createErrorMessage(modal, id) {
    const errorMessage = document.createElement("div");
    errorMessage.className = "spcd3-modal-errormessage";
    errorMessage.id = id;
    modal.append(() => errorMessage);
}
function createContextMenuForRecords() {
    let contextMenu = select("#spcd3-parallelcoords")
        .append("g")
        .attr("class", "spcd3-contextmenu-records")
        .attr("id", "contextmenuRecords")
        .style("position", "absolute")
        .style("display", "none");
    createContextMenuItem(contextMenu, "selectRecord", "contextmenu", "Select Record", "Select Record(s)");
    createContextMenuItem(contextMenu, "unSelectRecord", "contextmenu", "Unselect Record", "Unselect Record(s)");
    createContextMenuItem(contextMenu, "toggleRecord", "contextmenu", "Toggle Selection", "Toggle Selection");
    createContextMenuItem(contextMenu, "addSelection", "contextmenu", "Add to Selection", "Add to Selection");
    createContextMenuItem(contextMenu, "removeSelection", "contextmenu", "Remove from Selection", "Remove from Selection");
    return contextMenu;
}
function createContextMenuItem(contextMenu, id, className, text, title) {
    contextMenu
        .append("div")
        .attr("id", id)
        .attr("class", className)
        .attr("title", title)
        .text(text);
}
function handleRecordContextMenu(contextMenu, event, d) {
    const container = document.querySelector("#spcd3-parallelcoords");
    if (!container)
        return;
    const menuElement = contextMenu.node();
    if (!menuElement)
        return;
    const rect = container.getBoundingClientRect();
    const data = getAllPointerEventsData(event);
    const cleanedItems = data.map((item) => cleanString(item).replace(/[.,]/g, ""));
    if (cleanedItems.length > 1) {
        select("#selectRecord").text("Select Records");
        select("#unSelectRecord").text("Unselect Records");
        select("#toggleRecord").text("Toggle Selection");
    }
    else {
        select("#selectRecord").text("Select Record");
        select("#unSelectRecord").text("Unselect Record");
        select("#toggleRecord").text("Toggle Selection");
    }
    const x = event.clientX - rect.left;
    const y = (event.clientY - rect.top) / 16;
    const left = getContextMenuLeftPosition(container, menuElement, x) / 16;
    contextMenu
        .style("left", left + "rem")
        .style("top", y + "rem")
        .style("display", "block")
        .on("click", (event) => {
        event.stopPropagation();
    });
    select("#selectRecord").on("click", (event) => {
        setSelection(cleanedItems);
        event.stopPropagation();
        select("#contextmenuRecords").style("display", "none");
    });
    select("#unSelectRecord").on("click", (event) => {
        cleanedItems.forEach((item) => {
            setUnselected(item);
        });
        event.stopPropagation();
        select("#contextmenuRecords").style("display", "none");
    });
    select("#toggleRecord")
        .style("border-top", "0.08rem solid var(--spcd3-border-subtle)")
        .on("click", (event) => {
        cleanedItems.forEach((item) => {
            toggleSelection(item);
        });
        event.stopPropagation();
        select("#contextmenuRecords").style("display", "none");
    });
    select("#addSelection")
        .style("border-top", "0.08rem solid var(--spcd3-border-subtle)")
        .on("click", (event) => {
        let selectedRecords = [];
        selectedRecords = getSelected();
        const records = [...selectedRecords, ...cleanedItems];
        setSelection(records);
        event.stopPropagation();
        select("#contextmenuRecords").style("display", "none");
    });
    select("#removeSelection").on("click", (event) => {
        cleanedItems.forEach((item) => {
            setUnselected(item);
        });
        event.stopPropagation();
        select("#contextmenuRecords").style("display", "none");
    });
    selectAll(".contextmenu").style("padding", 0.35 + "rem");
    event.preventDefault();
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var cjs$2 = {exports: {}};

var cjs$1 = {exports: {}};

var hasRequiredCjs$1;

function requireCjs$1 () {
	if (hasRequiredCjs$1) return cjs$1.exports;
	hasRequiredCjs$1 = 1;
	(function (module, exports$1) {
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.ParsingError = void 0;
		class ParsingError extends Error {
		    constructor(message, cause) {
		        super(message);
		        this.cause = cause;
		    }
		}
		exports$1.ParsingError = ParsingError;
		let parsingState;
		function nextChild() {
		    return element(false) || text() || comment() || cdata() || processingInstruction();
		}
		function nextRootChild() {
		    match(/\s*/);
		    return element(true) || comment() || doctype() || processingInstruction();
		}
		function parseDocument() {
		    const declaration = processingInstruction();
		    const children = [];
		    let documentRootNode;
		    let child = nextRootChild();
		    while (child) {
		        if (child.node.type === 'Element') {
		            if (documentRootNode) {
		                throw new Error('Found multiple root nodes');
		            }
		            documentRootNode = child.node;
		        }
		        if (!child.excluded) {
		            children.push(child.node);
		        }
		        child = nextRootChild();
		    }
		    if (!documentRootNode) {
		        throw new ParsingError('Failed to parse XML', 'Root Element not found');
		    }
		    if (parsingState.xml.length !== 0) {
		        throw new ParsingError('Failed to parse XML', 'Not Well-Formed XML');
		    }
		    return {
		        declaration: declaration ? declaration.node : null,
		        root: documentRootNode,
		        children
		    };
		}
		function processingInstruction() {
		    const m = match(/^<\?([\w-:.]+)\s*/);
		    if (!m)
		        return;
		    // tag
		    const node = {
		        name: m[1],
		        type: 'ProcessingInstruction',
		        content: ''
		    };
		    const endMarkerIndex = parsingState.xml.indexOf('?>');
		    if (endMarkerIndex > -1) {
		        node.content = parsingState.xml.substring(0, endMarkerIndex).trim();
		        parsingState.xml = parsingState.xml.slice(endMarkerIndex);
		    }
		    else {
		        throw new ParsingError('Failed to parse XML', 'ProcessingInstruction closing tag not found');
		    }
		    match(/\?>/);
		    return {
		        excluded: parsingState.options.filter(node) === false,
		        node
		    };
		}
		function element(matchRoot) {
		    const m = match(/^<([^?!</>\s]+)\s*/);
		    if (!m)
		        return;
		    // name
		    const node = {
		        type: 'Element',
		        name: m[1],
		        attributes: {},
		        children: []
		    };
		    const excluded = matchRoot ? false : parsingState.options.filter(node) === false;
		    // attributes
		    while (!(eos() || is('>') || is('?>') || is('/>'))) {
		        const attr = attribute();
		        if (attr) {
		            node.attributes[attr.name] = attr.value;
		        }
		        else {
		            return;
		        }
		    }
		    // self closing tag
		    if (match(/^\s*\/>/)) {
		        node.children = null;
		        return {
		            excluded,
		            node
		        };
		    }
		    match(/\??>/);
		    // children
		    let child = nextChild();
		    while (child) {
		        if (!child.excluded) {
		            node.children.push(child.node);
		        }
		        child = nextChild();
		    }
		    // closing
		    if (parsingState.options.strictMode) {
		        const closingTag = `</${node.name}>`;
		        if (parsingState.xml.startsWith(closingTag)) {
		            parsingState.xml = parsingState.xml.slice(closingTag.length);
		        }
		        else {
		            throw new ParsingError('Failed to parse XML', `Closing tag not matching "${closingTag}"`);
		        }
		    }
		    else {
		        match(/^<\/[\w-:.\u00C0-\u00FF]+\s*>/);
		    }
		    return {
		        excluded,
		        node
		    };
		}
		function doctype() {
		    const m = match(/^<!DOCTYPE\s+\S+\s+SYSTEM[^>]*>/) ||
		        match(/^<!DOCTYPE\s+\S+\s+PUBLIC[^>]*>/) ||
		        match(/^<!DOCTYPE\s+\S+\s*\[[^\]]*]>/) ||
		        match(/^<!DOCTYPE\s+\S+\s*>/);
		    if (m) {
		        const node = {
		            type: 'DocumentType',
		            content: m[0]
		        };
		        return {
		            excluded: parsingState.options.filter(node) === false,
		            node
		        };
		    }
		}
		function cdata() {
		    if (parsingState.xml.startsWith('<![CDATA[')) {
		        const endPositionStart = parsingState.xml.indexOf(']]>');
		        if (endPositionStart > -1) {
		            const endPositionFinish = endPositionStart + 3;
		            const node = {
		                type: 'CDATA',
		                content: parsingState.xml.substring(0, endPositionFinish)
		            };
		            parsingState.xml = parsingState.xml.slice(endPositionFinish);
		            return {
		                excluded: parsingState.options.filter(node) === false,
		                node
		            };
		        }
		    }
		}
		function comment() {
		    const m = match(/^<!--[\s\S]*?-->/);
		    if (m) {
		        const node = {
		            type: 'Comment',
		            content: m[0]
		        };
		        return {
		            excluded: parsingState.options.filter(node) === false,
		            node
		        };
		    }
		}
		function text() {
		    const m = match(/^([^<]+)/);
		    if (m) {
		        const node = {
		            type: 'Text',
		            content: m[1]
		        };
		        return {
		            excluded: parsingState.options.filter(node) === false,
		            node
		        };
		    }
		}
		function attribute() {
		    const m = match(/([^=]+)\s*=\s*("[^"]*"|'[^']*'|[^>\s]+)\s*/);
		    if (m) {
		        return {
		            name: m[1].trim(),
		            value: stripQuotes(m[2].trim())
		        };
		    }
		}
		function stripQuotes(val) {
		    return val.replace(/^['"]|['"]$/g, '');
		}
		/**
		 * Match `re` and advance the string.
		 */
		function match(re) {
		    const m = parsingState.xml.match(re);
		    if (m) {
		        parsingState.xml = parsingState.xml.slice(m[0].length);
		        return m;
		    }
		}
		/**
		 * End-of-source.
		 */
		function eos() {
		    return 0 === parsingState.xml.length;
		}
		/**
		 * Check for `prefix`.
		 */
		function is(prefix) {
		    return 0 === parsingState.xml.indexOf(prefix);
		}
		/**
		 * Parse the given XML string into an object.
		 */
		function parseXml(xml, options = {}) {
		    xml = xml.trim();
		    const filter = options.filter || (() => true);
		    parsingState = {
		        xml,
		        options: Object.assign(Object.assign({}, options), { filter, strictMode: options.strictMode === true })
		    };
		    return parseDocument();
		}
		{
		    module.exports = parseXml;
		}
		exports$1.default = parseXml;
		
	} (cjs$1, cjs$1.exports));
	return cjs$1.exports;
}

var cjs = cjs$2.exports;

var hasRequiredCjs;

function requireCjs () {
	if (hasRequiredCjs) return cjs$2.exports;
	hasRequiredCjs = 1;
	(function (module, exports$1) {
		var __importDefault = (cjs && cjs.__importDefault) || function (mod) {
		    return (mod && mod.__esModule) ? mod : { "default": mod };
		};
		Object.defineProperty(exports$1, "__esModule", { value: true });
		const xml_parser_xo_1 = __importDefault(/*@__PURE__*/ requireCjs$1());
		function newLine(state) {
		    if (!state.options.indentation && !state.options.lineSeparator)
		        return;
		    state.content += state.options.lineSeparator;
		    let i;
		    for (i = 0; i < state.level; i++) {
		        state.content += state.options.indentation;
		    }
		}
		function indent(state) {
		    state.content = state.content.replace(/ +$/, '');
		    let i;
		    for (i = 0; i < state.level; i++) {
		        state.content += state.options.indentation;
		    }
		}
		function appendContent(state, content) {
		    state.content += content;
		}
		function processNode(node, state, preserveSpace) {
		    if (node.type === 'Element') {
		        processElementNode(node, state, preserveSpace);
		    }
		    else if (node.type === 'ProcessingInstruction') {
		        processProcessingIntruction(node, state);
		    }
		    else if (typeof node.content === 'string') {
		        processContent(node.content, state, preserveSpace);
		    }
		    else {
		        throw new Error('Unknown node type: ' + node.type);
		    }
		}
		function processContent(content, state, preserveSpace) {
		    if (!preserveSpace) {
		        const trimmedContent = content.trim();
		        if (state.options.lineSeparator) {
		            content = trimmedContent;
		        }
		        else if (trimmedContent.length === 0) {
		            content = trimmedContent;
		        }
		    }
		    if (content.length > 0) {
		        if (!preserveSpace && state.content.length > 0) {
		            newLine(state);
		        }
		        appendContent(state, content);
		    }
		}
		function isPathMatchingIgnoredPaths(path, ignoredPaths) {
		    const fullPath = '/' + path.join('/');
		    const pathLastPart = path[path.length - 1];
		    return ignoredPaths.includes(pathLastPart) || ignoredPaths.includes(fullPath);
		}
		function processElementNode(node, state, preserveSpace) {
		    state.path.push(node.name);
		    if (!preserveSpace && state.content.length > 0) {
		        newLine(state);
		    }
		    appendContent(state, '<' + node.name);
		    processAttributes(state, node.attributes);
		    if (node.children === null || (state.options.forceSelfClosingEmptyTag && node.children.length === 0)) {
		        const selfClosingNodeClosingTag = state.options.whiteSpaceAtEndOfSelfclosingTag ? ' />' : '/>';
		        // self-closing node
		        appendContent(state, selfClosingNodeClosingTag);
		    }
		    else if (node.children.length === 0) {
		        // empty node
		        appendContent(state, '></' + node.name + '>');
		    }
		    else {
		        const nodeChildren = node.children;
		        appendContent(state, '>');
		        state.level++;
		        let nodePreserveSpace = node.attributes['xml:space'] === 'preserve' || preserveSpace;
		        let ignoredPath = false;
		        if (!nodePreserveSpace && state.options.ignoredPaths) {
		            ignoredPath = isPathMatchingIgnoredPaths(state.path, state.options.ignoredPaths);
		            nodePreserveSpace = ignoredPath;
		        }
		        if (!nodePreserveSpace && state.options.collapseContent) {
		            let containsTextNodes = false;
		            let containsTextNodesWithLineBreaks = false;
		            let containsNonTextNodes = false;
		            nodeChildren.forEach(function (child, index) {
		                if (child.type === 'Text') {
		                    if (child.content.includes('\n')) {
		                        containsTextNodesWithLineBreaks = true;
		                        child.content = child.content.trim();
		                    }
		                    else if ((index === 0 || index === nodeChildren.length - 1) && !preserveSpace) {
		                        if (child.content.trim().length === 0) {
		                            // If the text node is at the start or end and is empty, it should be ignored when formatting
		                            child.content = '';
		                        }
		                    }
		                    // If there is some content or whitespaces have been removed and there is no other siblings
		                    if (child.content.trim().length > 0 || nodeChildren.length === 1) {
		                        containsTextNodes = true;
		                    }
		                }
		                else if (child.type === 'CDATA') {
		                    containsTextNodes = true;
		                }
		                else {
		                    containsNonTextNodes = true;
		                }
		            });
		            if (containsTextNodes && (!containsNonTextNodes || !containsTextNodesWithLineBreaks)) {
		                nodePreserveSpace = true;
		            }
		        }
		        nodeChildren.forEach(function (child) {
		            processNode(child, state, preserveSpace || nodePreserveSpace);
		        });
		        state.level--;
		        if (!preserveSpace && !nodePreserveSpace) {
		            newLine(state);
		        }
		        if (ignoredPath) {
		            indent(state);
		        }
		        appendContent(state, '</' + node.name + '>');
		    }
		    state.path.pop();
		}
		function processAttributes(state, attributes) {
		    Object.keys(attributes).forEach(function (attr) {
		        if (state.options.attributeQuotes === 'single') {
		            const escaped = attributes[attr].replace(/'/g, '&apos;');
		            appendContent(state, ' ' + attr + '=\'' + escaped + '\'');
		        }
		        else {
		            const escaped = attributes[attr].replace(/"/g, '&quot;');
		            appendContent(state, ' ' + attr + '="' + escaped + '"');
		        }
		    });
		}
		function processProcessingIntruction(node, state) {
		    if (state.content.length > 0) {
		        newLine(state);
		    }
		    appendContent(state, '<?' + node.name);
		    appendContent(state, ' ' + node.content.trim());
		    appendContent(state, '?>');
		}
		/**
		 * Converts the given XML into human readable format.
		 */
		function formatXml(xml, options = {}) {
		    options.indentation = 'indentation' in options ? options.indentation : '    ';
		    options.collapseContent = options.collapseContent === true;
		    options.lineSeparator = 'lineSeparator' in options ? options.lineSeparator : '\r\n';
		    options.whiteSpaceAtEndOfSelfclosingTag = options.whiteSpaceAtEndOfSelfclosingTag === true;
		    options.throwOnFailure = options.throwOnFailure !== false;
		    options.attributeQuotes = 'attributeQuotes' in options ? options.attributeQuotes : 'double';
		    try {
		        const parsedXml = (0, xml_parser_xo_1.default)(xml, { filter: options.filter, strictMode: options.strictMode });
		        const state = { content: '', level: 0, options: options, path: [] };
		        if (parsedXml.declaration) {
		            processProcessingIntruction(parsedXml.declaration, state);
		        }
		        parsedXml.children.forEach(function (child) {
		            processNode(child, state, false);
		        });
		        if (!options.lineSeparator) {
		            return state.content;
		        }
		        return state.content
		            .replace(/\r\n/g, '\n')
		            .replace(/\n/g, options.lineSeparator);
		    }
		    catch (err) {
		        if (options.throwOnFailure) {
		            throw err;
		        }
		        return xml;
		    }
		}
		formatXml.minify = (xml, options = {}) => {
		    return formatXml(xml, Object.assign(Object.assign({}, options), { indentation: '', lineSeparator: '' }));
		};
		{
		    module.exports = formatXml;
		}
		exports$1.default = formatXml;
		
	} (cjs$2, cjs$2.exports));
	return cjs$2.exports;
}

var cjsExports = /*@__PURE__*/ requireCjs();
var xmlFormat = /*@__PURE__*/getDefaultExportFromCjs(cjsExports);

function setActivePathLinesToDownload(svg) {
    svg
        .append("g")
        .attr("class", "records")
        .style("opacity", "0.5")
        .style("stroke", "rgb(0, 129, 175)")
        .style("opacity", "0.6")
        .style("stroke-width", "2")
        .style("fill", "none")
        .selectAll("path")
        .data(parcoords.data)
        .enter()
        .append("path")
        .attr("id", (d) => {
        return cleanString(d[key]);
    })
        .each(function (d) {
        select(this).attr("d", linePath(d, parcoords.newFeatures));
    });
    const records = getAllRecords();
    records.forEach((element) => {
        const cleanRecord = cleanString(element);
        const isSelected$1 = isSelected(cleanRecord);
        if (isSelected$1) {
            svg
                .select("#" + cleanRecord)
                .style("stroke", "rgb(255, 165, 0)")
                .style("opacity", "1");
        }
        const dimNameToCheck = select("#" + cleanRecord).text();
        if (dimNameToCheck != "") {
            svg
                .select("#" + cleanRecord)
                .style("stroke", "lightgrey")
                .style("stroke-opacity", "0.4");
        }
    });
}
function setFeatureAxisToDownload(svg, yAxis, yScales, xScales) {
    const orderedFeatures = parcoords.newFeatures.map((name) => ({
        name,
    }));
    const hiddenDims = getAllHiddenDimensionNames();
    let featureAxis = svg
        .selectAll("g.feature")
        .data(orderedFeatures)
        .enter()
        .append("g")
        .attr("transform", (d) => "translate(" + xScales(d.name) + ")");
    featureAxis.append("g").each(function (d) {
        const processedDimensionName = cleanString(d.name);
        const max = getCurrentMaxRange(d.name);
        const min = getCurrentMinRange(d.name);
        const inversionStatus = getInversionStatus(d.name);
        if (!isDimensionCategorical(d.name)) {
            if (inversionStatus === "ascending") {
                yScales[d.name].domain([min, max]);
                yAxis = setupYAxis(yScales, parcoords.newDataset, hiddenDims);
                select(this)
                    .attr("id", "dimension_axis_" + processedDimensionName)
                    .call(yAxis[d.name].scale(yScales[d.name].domain(yScales[d.name].domain())));
            }
            else {
                yScales[d.name].domain([min, max]);
                yAxis = setupYAxis(yScales, parcoords.newDataset, hiddenDims);
                select(this)
                    .attr("id", "dimension_axis_" + processedDimensionName)
                    .call(yAxis[d.name].scale(yScales[d.name].domain(yScales[d.name].domain().reverse())));
            }
        }
        else {
            if (inversionStatus === "ascending") {
                select(this)
                    .attr("id", "dimension_axis_" + processedDimensionName)
                    .call(yAxis[d.name]);
            }
            else {
                const scale = yScales[d.name];
                scale.domain([...scale.domain()].reverse());
                select(this)
                    .attr("id", "dimension_axis_" + processedDimensionName)
                    .call(yAxis[d.name]);
            }
        }
    });
    featureAxis
        .append("text")
        .attr("text-anchor", "middle")
        .attr("y", 18)
        .text((d) => d.name.length > 10 ? d.name.substr(0, 10) + "..." : d.name)
        .style("font-size", "12");
    featureAxis
        .selectAll(".tick text")
        .attr("dy", 0)
        .attr("dominant-baseline", "middle");
    setBrushDownToDownload(featureAxis);
    setBrushUpToDownload(featureAxis);
    setRectToDragToDownload(featureAxis);
    setInvertIconToDownload(featureAxis);
}
function setBrushDownToDownload(featureAxis) {
    featureAxis.each(function (d) {
        const processedDimensionName = cleanString(d.name);
        const item = parcoords.currentPosOfDims.find((object) => object.key == d.name);
        select(this)
            .append("g")
            .append("use")
            .attr("id", "triangle_down_" + processedDimensionName)
            .attr("y", item.top == 50 ? 40 : item.top - 10)
            .attr("x", -6)
            .attr("width", 14)
            .attr("height", 10)
            .attr("href", "#brush_image_bottom");
    });
}
function setBrushUpToDownload(featureAxis) {
    featureAxis.each(function (d) {
        const processedDimensionName = cleanString(d.name);
        const item = parcoords.currentPosOfDims.find((object) => object.key == d.name);
        select(this)
            .append("g")
            .append("use")
            .attr("id", "triangle_up_" + processedDimensionName)
            .attr("y", item.bottom)
            .attr("x", -6)
            .attr("width", 14)
            .attr("height", 10)
            .attr("href", "#brush_image_top");
    });
}
function setRectToDragToDownload(featureAxis) {
    featureAxis.each(function (d) {
        const processedDimensionName = cleanString(d.name);
        const item = parcoords.currentPosOfDims.find((object) => object.key == d.name);
        let height = item.bottom - item.top;
        const isIdle = item.top == 50 && item.bottom == 350;
        select(this)
            .append("g")
            .append("rect")
            .attr("id", "rect_" + processedDimensionName)
            .attr("width", 12)
            .attr("height", height)
            .attr("x", -6)
            .attr("y", item.top)
            .attr("fill", isIdle ? BRUSH_IDLE_FILL : BRUSH_ACTIVE_FILL)
            .attr("opacity", isIdle ? "0.5" : "0.7");
    });
}
function setInvertIconToDownload(featureAxis) {
    featureAxis
        .append("svg")
        .attr("y", 25)
        .attr("x", -6)
        .append("use")
        .attr("width", 12)
        .attr("height", 12)
        .attr("y", 0)
        .attr("x", 0)
        .each(function (d) {
        const processedDimensionName = cleanString(d.name);
        if (getInversionStatus(processedDimensionName) == "descending") {
            select(this).attr("href", "#arrow_image_down");
        }
        else {
            select(this).attr("href", "#arrow_image_up");
        }
    });
}

function createSvgString() {
    const orderedFeatures = parcoords.newFeatures.map((name) => ({
        name,
    }));
    const hiddenDims = getAllHiddenDimensionNames();
    let yScalesForDownload = setupYScales(parcoords.features, parcoords.newDataset);
    let yAxisForDownload = setupYAxis(yScalesForDownload, parcoords.newDataset, hiddenDims);
    let xScalesForDownload = setupXScales(orderedFeatures, parcoords.newDataset);
    let svg = create$1("svg")
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
        .attr("viewBox", [0, 0, width, height])
        .attr("font-family", "Verdana, sans-serif");
    let defs = svg.append("defs");
    appendSymbol(defs, "arrow_image_up", "0 0 6 10", [
        {
            fill: "black",
            d: "M 0 4 L 3 0 L 6 4 L 4 4 L 4 10 L 2 10 L 2 4 Z",
        },
    ]);
    appendSymbol(defs, "arrow_image_down", "0 0 6 10", [
        {
            fill: "black",
            d: "M 0 6 L 2 6 L 2 0 L 4 0 L 4 6 L 6 6 L 3 10 Z",
        },
    ]);
    appendSymbol(defs, "brush_image_top", "0 0 100 86", [
        {
            fill: "rgb(242, 242, 76)",
            stroke: "black",
            strokeWidth: "7",
            d: "M 7 79 L 50 7 L 93 79 Z",
        },
    ]);
    appendSymbol(defs, "brush_image_bottom", "0 0 100 86", [
        {
            fill: "rgb(242, 242, 76)",
            stroke: "black",
            strokeWidth: "7",
            d: "M 7 7 L 93 7 L 50 79 Z",
        },
    ]);
    setFeatureAxisToDownload(svg, yAxisForDownload, yScalesForDownload, xScalesForDownload);
    setActivePathLinesToDownload(svg);
    return svg.node().outerHTML;
}
function saveAsSvg() {
    let svgString = createSvgString();
    svgString = svgString.replaceAll("currentColor", "black");
    svgString = svgString.replaceAll('stroke="black"', "");
    svgString = svgString.replaceAll('fill="black"', "");
    svgString = svgString.replaceAll('dy="0"', "");
    svgString = svgString.replaceAll('fill="none" font-size="10" font-family="sans-serif" text-anchor="end"', 'fill="none" font-size="8" text-anchor="end" stroke="black"');
    svgString = svgString.replaceAll("domain", "dimension");
    svgString = svgString.replaceAll("12px", "12");
    svgString = svgString.replaceAll('class="tick" opacity="1"', 'class="tick" fill="black" stroke="none"');
    setOptionsAndDownload(svgString);
}
function setOptionsAndDownload(svgString) {
    let name = "parcoords.svg";
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "spcd3-modal-overlay";
    modalOverlay.style.display = "block";
    const modal = document.createElement("div");
    modal.className = "spcd3-modal";
    modal.style.display = "block";
    modal.style.width = "30vw";
    const header = document.createElement("div");
    header.className = "spcd3-modal-header";
    header.style.paddingLeft = "0";
    const title = document.createElement("div");
    title.textContent = "Download Chart (SVG)";
    title.className = "spcd3-modal-title";
    title.style.paddingLeft = "0";
    const closeButton = document.createElement("span");
    closeButton.innerHTML = "&times;";
    closeButton.className = "spcd3-close-button";
    modal.appendChild(title);
    modal.appendChild(closeButton);
    modal.appendChild(header);
    const form = document.createElement("div");
    form.className = "spcd3-form";
    const rowDecimals = document.createElement("div");
    rowDecimals.className = "spcd3-options-div";
    const label = document.createElement("label");
    label.className = "spcd3-label";
    label.textContent = "Decimals places (0-10): ";
    label.htmlFor = "decimalsInput";
    const input = document.createElement("input");
    input.className = "spcd3-input";
    input.type = "number";
    input.min = "0";
    input.max = "10";
    input.value = "2";
    input.id = "decimalsInput";
    rowDecimals.appendChild(label);
    rowDecimals.appendChild(input);
    const rowKeepClasses = document.createElement("div");
    rowKeepClasses.className = "spcd3-options-div";
    const labelKeepClasses = document.createElement("label");
    labelKeepClasses.className = "spcd3-label";
    labelKeepClasses.textContent = "Keep classes: ";
    const inputKeepClasses = document.createElement("input");
    inputKeepClasses.className = "spcd3-input";
    inputKeepClasses.type = "checkbox";
    inputKeepClasses.id = "keepClassesInput";
    inputKeepClasses.checked = true;
    rowKeepClasses.appendChild(labelKeepClasses);
    rowKeepClasses.appendChild(inputKeepClasses);
    const rowRemoveUiControls = document.createElement("div");
    rowRemoveUiControls.className = "spcd3-options-div";
    const labelRemoveUiControls = document.createElement("label");
    labelRemoveUiControls.className = "spcd3-label";
    labelRemoveUiControls.textContent = "Download without UI controls: ";
    const inputRemoveUiControls = document.createElement("input");
    inputRemoveUiControls.className = "spcd3-input";
    inputRemoveUiControls.type = "checkbox";
    inputRemoveUiControls.id = "removeUiControlsInput";
    inputRemoveUiControls.checked = true;
    rowRemoveUiControls.appendChild(labelRemoveUiControls);
    rowRemoveUiControls.appendChild(inputRemoveUiControls);
    const button = document.createElement("button");
    button.textContent = "Download";
    button.className = "spcd3-button spcd3-generic-button";
    form.appendChild(rowDecimals);
    form.appendChild(rowKeepClasses);
    form.appendChild(rowRemoveUiControls);
    form.appendChild(button);
    modal.appendChild(form);
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
    input.focus();
    button.addEventListener("click", () => {
        const decimals = parseInt(input.value);
        if (isNaN(decimals) || decimals < 0 || decimals > 10) {
            alert("Please enter a number between 2 and 10.");
            input.focus();
            return;
        }
        let updatedSVG = roundDecimals(svgString, decimals);
        updatedSVG = updatedSVG.replaceAll('class="records" style="opacity: 1; stroke: rgba(0, 129, 175, 1); stroke-width: 2; fill: none;"', 'class="records" style="opacity: 0.5; stroke: rgba(0, 129, 175, 0.8); stroke-width: 2; fill: none;"');
        if (!inputKeepClasses.checked) {
            updatedSVG = removeClasses(updatedSVG);
        }
        if (inputRemoveUiControls.checked) {
            updatedSVG = removeUiControls(updatedSVG);
            updatedSVG = updatedSVG.replaceAll('<svg y="25" x="-6"><use width="12" height="12" y="0" x="0" href="#arrow_image_up"></use></svg>', "");
        }
        let processedData = xmlFormat(updatedSVG, {
            indentation: "  ",
            collapseContent: true,
        });
        let preface = '<?xml version="1.0" standalone="no"?>\r\n';
        let svgBlob = new Blob([preface, processedData], {
            type: "image/svg+xml;charset=utf-8",
        });
        let svgUrl = URL.createObjectURL(svgBlob);
        let downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = name;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        document.body.removeChild(modalOverlay);
    });
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    });
    closeButton.addEventListener("click", () => {
        document.body.removeChild(modalOverlay);
    });
}
function appendSymbol(defs, id, viewBox, paths) {
    const symbol = defs.append("symbol").attr("id", id).attr("viewBox", viewBox);
    paths.forEach((pathDefinition) => {
        const path = symbol.append("path").attr("d", pathDefinition.d);
        if (pathDefinition.fill) {
            path.attr("fill", pathDefinition.fill);
        }
        if (pathDefinition.stroke) {
            path.attr("stroke", pathDefinition.stroke);
        }
        if (pathDefinition.strokeWidth) {
            path.attr("stroke-width", pathDefinition.strokeWidth);
        }
    });
}
function roundDecimals(svgString, decimals) {
    return svgString.replace(/(\d*\.\d+)/g, (match) => {
        return parseFloat(match).toFixed(decimals);
    });
}
function removeClasses(svgString) {
    return svgString.replace(/\sclass="[^"]*"/g, "");
}
function removeUiControls(svgString) {
    svgString = svgString.replace(/<defs[\s\S]*?<\/defs>/g, "");
    svgString = svgString.replace(/<g><use[\s\S]*?<\/use><\/g>/g, "");
    svgString = svgString.replace(/<g><rect[\s\S]*?<\/rect><\/g>/g, "");
    svgString = svgString.replace(/y\s*=\s*["']?18["']?/g, 'y="29"');
    return svgString;
}

function createToolbar(dataset) {
    const toolbarRow = select("#spcd3-toolbarRow");
    const { btn: toggleButton, tip: toggleTip } = makeIconButton(toolbarRow, {
        id: "toggleButton",
        iconHtml: getExpandToolbarIcon(),
        tipText: "Expand Toolbar",
    });
    const toolbar = toolbarRow
        .append("div")
        .attr("id", "spcd3-toolbar")
        .attr("class", "spcd3-toolbar");
    makeIconButton(toolbar, {
        iconHtml: getTableIcon(),
        tipText: "Show Table",
        onClick: () => showModalWithData(dataset),
    });
    makeIconButton(toolbar, {
        id: "downloadButton",
        iconHtml: getDownloadButton(),
        tipText: "Download Chart (SVG)",
        onClick: saveAsSvg,
    });
    makeIconButton(toolbar, {
        id: "refreshButton",
        iconHtml: getRefreshIcon(),
        tipText: "Refresh",
        onClick: refresh,
    });
    makeIconButton(toolbar, {
        id: "resetButton",
        iconHtml: getResetIcon(),
        tipText: "Reset",
        onClick: reset,
    });
    let isExpanded = false;
    toggleButton.on("click", () => {
        isExpanded = !isExpanded;
        toolbar
            .style("max-width", isExpanded ? "12.5rem" : "0")
            .style("opacity", isExpanded ? "1" : "0")
            .style("pointer-events", isExpanded ? "auto" : "none")
            .style("overflow", isExpanded ? "visible" : "hidden");
        toggleTip.text(isExpanded ? "Collapse Toolbar" : "Expand Toolbar");
        const currentIcon = isExpanded
            ? getCollapseToolbarIcon()
            : getExpandToolbarIcon();
        toggleButton.select("#toggleButtonicon").html(currentIcon);
    });
}
function makeIconButton(parent, opts) {
    const { id, iconHtml, tipText, onClick } = opts;
    const btn = parent
        .append("button")
        .attr("class", "spcd3-toolbar-button")
        .attr("type", "button")
        .attr("id", id ?? null);
    if (onClick)
        btn.on("click", onClick);
    btn
        .append("span")
        .attr("class", "spcd3-toolbar-buttonicon")
        .attr("id", `${id}icon`)
        .html(iconHtml);
    btn
        .select(".spcd3-toolbar-buttonicon")
        .selectAll("svg")
        .attr("class", "spcd3-toolbar-svg");
    const tip = parent
        .append("span")
        .attr("class", "spcd3-toolbar-buttontip")
        .attr("id", `${id}tip`)
        .attr("popover", "manual")
        .text(tipText ?? "");
    const btnNode = btn.node();
    const tipNode = tip.node();
    function show() {
        if (!tipNode)
            return;
        if (!tipNode.matches(":popover-open")) {
            tipNode.showPopover();
        }
        positionTip(btnNode, tipNode);
    }
    function hide() {
        if (!tipNode)
            return;
        if (tipNode.matches(":popover-open")) {
            tipNode.hidePopover();
        }
    }
    btn
        .on("mouseenter", show)
        .on("mouseleave", hide)
        .on("focus", show)
        .on("blur", hide);
    select(window).on(`resize.${id}`, () => {
        if (tipNode?.matches(":popover-open")) {
            positionTip(btnNode, tipNode);
        }
    });
    select(window).on(`scroll.${id}`, () => {
        if (tipNode?.matches(":popover-open")) {
            positionTip(btnNode, tipNode);
        }
    });
    return { btn, tip };
}
function positionTip(btnNode, tipNode) {
    if (!btnNode || !tipNode)
        return;
    const rect = btnNode.getBoundingClientRect();
    const gap = 8;
    tipNode.style.left = "0";
    tipNode.style.top = "0";
    const tipRect = tipNode.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    let top = rect.bottom + gap;
    const padding = 0.5;
    if (left < padding)
        left = padding;
    if (left + tipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tipRect.width - padding;
    }
    if (top + tipRect.height > window.innerHeight - padding) {
        top = rect.top - tipRect.height - gap;
    }
    if (top < padding)
        top = padding;
    tipNode.style.left = `${left / 16}rem`;
    tipNode.style.top = `${top / 16}rem`;
}
function showModalWithData(dataset) {
    const overlay = select("body")
        .append("div")
        .attr("class", "spcd3-modal-tableoverlay")
        .attr("id", "modalTableOverlay");
    overlay.on("click", () => {
        overlay.style("display", "none");
        modal.style("display", "none");
    });
    const modal = select("body")
        .append("div")
        .attr("class", "spcd3-modal-tabledata")
        .attr("id", "dataModal");
    const saveAsCSV = document.createElement("button");
    saveAsCSV.className = "spcd3-button spcd3-save-csv-button";
    saveAsCSV.id = "saveAsCsv";
    saveAsCSV.textContent = "Download as CSV";
    modal.append(() => saveAsCSV);
    saveAsCSV.addEventListener("click", () => {
        const reservedArray = dataset.map((entry) => {
            const entries = Object.entries(entry).reverse();
            return Object.fromEntries(entries);
        });
        downloadCSV(reservedArray);
    });
    const closeButton = document.createElement("span");
    closeButton.className = "spcd3-close-button";
    closeButton.innerHTML = "&times;";
    closeButton.style.marginBottom = "1rem";
    modal.append(() => closeButton);
    const dimensionsElement = document.createElement("div");
    dimensionsElement.textContent = `Dataset has ${numberOfDimensions} dimensions and ${numberOfRecords} records.`;
    dimensionsElement.style.marginBottom = "1rem";
    modal.append(() => dimensionsElement);
    const scrollWrapper = document.createElement("div");
    scrollWrapper.className = "spcd3-scroll-wrapper";
    const tableContainer = document.createElement("table");
    tableContainer.className = "spcd3-tablecontainer";
    scrollWrapper.appendChild(tableContainer);
    modal.append(() => scrollWrapper);
    generateTable(dataset, tableContainer);
    closeButton.addEventListener("click", () => {
        modal.style("display", "none");
        overlay.style("display", "none");
    });
}
function generateTable(dataset, table) {
    const reservedArray = dataset.map((entry) => {
        const entries = Object.entries(entry).reverse();
        return Object.fromEntries(entries);
    });
    const headers = Object.keys(reservedArray[0]);
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach((header) => {
        const th = document.createElement("th");
        th.innerText = header.charAt(0).toUpperCase() + header.slice(1);
        th.className = "spcd3-th";
        const isNumericCol = reservedArray.every((row) => {
            const val = row[header];
            return !isNaN(parseFloat(val)) && isFinite(val);
        });
        th.style.textAlign = isNumericCol ? "right" : "left";
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    reservedArray.forEach((obj) => {
        const row = document.createElement("tr");
        headers.forEach((key) => {
            const td = document.createElement("td");
            const value = obj[key];
            td.innerText = value;
            td.className = "spcd3-td";
            if (!isNaN(parseFloat(value)) && isFinite(value)) {
                td.style.textAlign = "right";
            }
            else {
                td.style.textAlign = "left";
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
}
function downloadCSV(dataset, filename = "data.csv") {
    if (!dataset || !dataset.length)
        return;
    const keys = Object.keys(dataset[0]);
    const csvRows = [];
    csvRows.push(keys.join(","));
    dataset.forEach((row) => {
        const values = keys.map((k) => {
            const value = row[k];
            return typeof value === "string" && value.includes(",")
                ? `"${value}"`
                : value;
        });
        csvRows.push(values.join(","));
    });
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

//---------- IO Functions ----------
function drawChart(content) {
    setContent(content);
    const chartContent = content;
    var columns = structuredClone(chartContent["columns"]).reverse();
    setColumns(columns);
    setNumberOfDimensions(columns.length);
    setNumberOfRecords(content.length);
    deleteChart();
    if (thickness === undefined) {
        setLineThickness("0.4rem");
    }
    setUpParcoordData(content, columns);
    let chart = select("#spcd3-parallelcoords");
    if (chart === null) {
        chart = select(document.body)
            .append("div")
            .attr("id", "spcd3-parallelcoords");
    }
    const chartWrapper = chart.append("div").attr("class", "spcd3-chartWrapper");
    chartWrapper.append("div").attr("id", "spcd3-toolbarRow");
    createToolbar(parcoords.newDataset);
    setSvg(chartWrapper
        .append("svg")
        .attr("id", "spcd3-pc_svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("preserveAspectRatio", "none"));
    const plot = svg.append("g").attr("class", "plot");
    setDefsForIcons();
    setActive(setActivePathLines(plot, content, parcoords));
    setFeatureAxis(plot, yAxis, parcoords, width);
    realignToolbar();
    svg
        .on("contextmenu", function (event) {
        event.stopPropagation();
        event.preventDefault();
    })
        .on("mouseenter", function () {
        cleanTooltip();
    })
        .on("click", function () {
        clearSelection();
    })
        .on("mousedown.selection", function (event) {
        event.preventDefault();
    })
        .on("mouseleave", function () {
    })
        .on("mousemove", function (event) {
        const chartBounds = svg.node().getBoundingClientRect();
        if (event.clientX < chartBounds.left ||
            event.clientX > chartBounds.right ||
            event.clientY < chartBounds.top ||
            event.clientY > chartBounds.bottom) {
            handlePointerLeaveOrOut();
        }
    });
    window.onclick = () => {
        select("#contextmenu").style("display", "none");
        select("#contextmenuRecords").style("display", "none");
    };
}
function reset() {
    drawChart(resetContentData);
}
function refresh() {
    const dimensions = getAllVisibleDimensionNames();
    for (let i = 0; i < dimensions.length; i++) {
        show(dimensions[i]);
    }
}
function deleteChart() {
    select("#spcd3-pc_svg").remove();
    select("#contextmenu").remove();
    select("#contextmenuRecords").remove();
    select("#modalFilter").remove();
    select("#modalRange").remove();
    select("#refreshButton").remove();
    select("#showData").remove();
    select("#spcd3-toolbarRow").remove();
    select(".spcd3-chartWrapper").remove();
    selectAll(".spcd3-tip-layer").remove();
    selectAll(".spcd3-tooltip-values").remove();
    cleanTooltip();
    cleanTooltipSelect();
    parcoords.currentPosOfDims.length = 0;
}
// ---------- Needed for Built-In Interactivity Functions ---------- //
function setUpParcoordData(data, newFeatures) {
    setPaddingXaxis(60);
    setInitDimension(newFeatures);
    setHeight(400);
    const label = newFeatures[newFeatures.length - 1];
    data.sort((a, b) => {
        const item1 = a[label];
        const item2 = b[label];
        if (item1 < item2) {
            return -1;
        }
        else if (item1 > item2) {
            return 1;
        }
        else {
            return 0;
        }
    });
    let dataset = prepareData(data, newFeatures);
    setWidth(calculateChartLayout(dataset[0], dataset[1]).chartWidth);
    setFeatures(dataset[0]);
    setNewDataset(dataset[1]);
    setXScales(setupXScales(dataset[0], dataset[1]));
    setYScales(setupYScales(dataset[0], dataset[1]));
    setNewFeatures(newFeatures);
    setData(data);
    for (let i = 0; i < newFeatures.length; i++) {
        let max;
        let min;
        if (isNaN(Math.max(...parcoords.newDataset.map((o) => o[newFeatures[i]])))) {
            const sorted = [
                ...parcoords.newDataset.map((o) => o[newFeatures[i]]),
            ].sort((a, b) => a.localeCompare(b));
            min = sorted[sorted.length - 1];
            max = sorted[0];
        }
        else {
            max = Math.max(...parcoords.newDataset.map((o) => o[newFeatures[i]]));
            min = Math.min(...parcoords.newDataset.map((o) => o[newFeatures[i]]));
        }
        const ranges = getDimensionRange(newFeatures[i]);
        parcoords.currentPosOfDims.push({
            key: newFeatures[i],
            top: 50,
            bottom: 350,
            isInverted: false,
            index: i,
            min: min,
            max: max,
            sigDig: 0,
            currentRangeTop: ranges[1],
            currentRangeBottom: ranges[0],
            currentFilterBottom: ranges[0],
            currentFilterTop: ranges[1],
        });
    }
    const hiddenDims = getAllHiddenDimensionNames();
    setYaxis(setupYAxis(parcoords.yScales, parcoords.newDataset, hiddenDims));
    let counter = 0;
    parcoords.features.map((x) => {
        let numberOfDigs = 0;
        let values = parcoords.newDataset.map((o) => o[x.name]);
        for (let i = 0; i < values.length; i++) {
            if (!isNaN(values[i])) {
                const tempNumberOfDigs = digits(Number(values[i]));
                if (tempNumberOfDigs > numberOfDigs) {
                    numberOfDigs = tempNumberOfDigs;
                }
            }
            else {
                continue;
            }
        }
        addNumberOfDigs(numberOfDigs, parcoords.currentPosOfDims, x.name, "sigDig");
        addNumberOfDigs(counter, parcoords.currentPosOfDims, x.name, "recordId");
        counter = counter + 1;
    });
    setHoverLabel(getAllVisibleDimensionNames()[0]);
}
function realignToolbar() {
    window.requestAnimationFrame(alignToolbarWithLeftmostAxisLabels);
}
function alignToolbarWithLeftmostAxisLabels() {
    const toolbarRow = document.querySelector("#spcd3-toolbarRow");
    const svgNode = document.querySelector("#spcd3-pc_svg");
    const axisNodes = Array.from(document.querySelectorAll("#spcd3-pc_svg .dimensions"));
    if (!toolbarRow || !svgNode || axisNodes.length === 0) {
        return;
    }
    const toolbarRect = toolbarRow.getBoundingClientRect();
    const leftmostAxis = axisNodes.reduce((leftmost, axis) => axis.getBoundingClientRect().left < leftmost.getBoundingClientRect().left
        ? axis
        : leftmost, axisNodes[0]);
    const labelNodes = Array.from(leftmostAxis.querySelectorAll(".tick text"));
    const leftEdge = labelNodes.reduce((minLeft, label) => Math.min(minLeft, label.getBoundingClientRect().left), leftmostAxis.getBoundingClientRect().left);
    toolbarRow.style.paddingLeft = `${Math.max(0, leftEdge - toolbarRect.left) / 16}rem`;
    toolbarRow.style.visibility = "visible";
}
function handlePointerEnter(event, d) {
    doNotHighlight();
    const data = getAllPointerEventsData(event);
    const tooltipLabel = selectAll(".spcd3-tooltip-label");
    highlight(data);
    createTooltipForLabel(data, tooltipLabel, event);
    const datasetMap = new Map();
    parcoords.newDataset.forEach((record) => {
        datasetMap.set(record[hoverlabel], record);
    });
    data.forEach((item, i) => {
        const rec = datasetMap.get(item);
        if (rec) {
            createToolTipForValues(rec, false);
        }
    });
}
function handlePointerLeaveOrOut() {
    doNotHighlight();
    selectAll(".spcd3-tooltip-label").style("visibility", "hidden");
    cleanTooltip();
}
function handleClick(event, d) {
    var data = getAllPointerEventsData(event);
    if (hoverSnapshot)
        data = hoverSnapshot;
    hoverSnapshot = null;
    const cleanedItems = data.map((item) => cleanString(item).replace(/[.,]/g, ""));
    const selectedRecords = getSelected();
    if (event.metaKey || event.shiftKey) {
        cleanedItems.forEach((record) => {
            if (selectedRecords.includes(record)) {
                setUnselected(record);
                selectAll(`#tooltip-record-select-${record}`).style("display", "none");
            }
            else {
                setSelected(record);
                const datasetMap = new Map();
                parcoords.newDataset.forEach((cleanedItems) => {
                    datasetMap.set(cleanedItems[hoverlabel], cleanedItems);
                });
                data.forEach((item, i) => {
                    const rec = datasetMap.get(item);
                    if (rec) {
                        createToolTipForValues(rec, true);
                    }
                });
            }
        });
    }
    else if (event.ctrlKey) {
        cleanedItems.forEach((record) => {
            if (selectedRecords.includes(record)) {
                setUnselected(record);
                select(`#tooltip-record-select-${record}`).remove();
            }
            else {
                setSelected(record);
                const datasetMap = new Map();
                parcoords.newDataset.forEach((cleanedItems) => {
                    datasetMap.set(cleanedItems[hoverlabel], cleanedItems);
                });
                data.forEach((item, i) => {
                    const rec = datasetMap.get(item);
                    if (rec) {
                        createToolTipForValues(rec, true);
                    }
                });
            }
        });
    }
    else {
        clearSelection();
        setSelection(cleanedItems);
        const datasetMap = new Map();
        parcoords.newDataset.forEach((cleanedItems) => {
            datasetMap.set(cleanedItems[hoverlabel], cleanedItems);
        });
        data.forEach((item, i) => {
            const rec = datasetMap.get(item);
            if (rec) {
                createToolTipForValues(rec, true);
            }
        });
    }
    event.stopPropagation();
}
function setActivePathLines(svg, content, parcoords) {
    const contextMenuRecords = createContextMenuForRecords();
    const g = svg.append("g").attr("class", "active");
    g.selectAll("path.hitarea")
        .data(content)
        .enter()
        .append("path")
        .attr("class", "hitarea")
        .attr("id", (d) => {
        const keys = Object.keys(d);
        setKey(keys[0]);
        const selected_value = cleanString(d[key]);
        return "area_" + selected_value;
    })
        .attr("d", (d) => linePath(d, parcoords.newFeatures))
        .style("stroke", "transparent")
        .style("fill", "none")
        .style("stroke-width", thickness)
        .style("pointer-events", "stroke")
        .on("pointerenter", handlePointerEnter)
        .on("pointerleave", handlePointerLeaveOrOut)
        .on("pointerout", handlePointerLeaveOrOut)
        .on("click", handleClick)
        .on("contextmenu", function (event, d) {
        handleRecordContextMenu(contextMenuRecords, event);
        select("#contextmenu").style("display", "none");
    });
    return g
        .selectAll("path.visible")
        .data(content)
        .enter()
        .append("path")
        .attr("class", (d) => {
        const keys = Object.keys(d);
        setKey(keys[0]);
        const selected_value = cleanString(d[key]);
        return "line " + selected_value;
    })
        .attr("id", (d) => cleanString(d[key]))
        .attr("d", (d) => linePath(d, parcoords.newFeatures))
        .style("pointer-events", "none")
        .style("stroke", "var(--spcd3-active-records)")
        .style("stroke-width", "0.12rem")
        .style("fill", "none");
}
const throttleShowValues = throttle(createToolTipForValues, 50);
function setFeatureAxis(svg, yAxis, parcoords, width) {
    let featureAxis = svg
        .selectAll("g.feature")
        .data(parcoords.features)
        .enter()
        .append("g")
        .attr("class", "dimensions")
        .attr("transform", (d) => "translate(" + parcoords.xScales(d.name) + ")");
    featureAxis.append("g").each(function (d) {
        const processedDimensionName = cleanString(d.name);
        select(this)
            .attr("class", "spcd3-dimensions-axis")
            .attr("id", "dimension_axis_" + processedDimensionName)
            .call(yAxis[d.name]);
    });
    select("body").append("div").attr("class", "spcd3-tooltip-label");
    const brushOverlay = svg
        .append("rect")
        .attr("class", "spcd3-brush-overlay")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .style("fill", "transparent")
        .style("pointer-events", "none");
    let tooltipValues = select("#spcd3-parallelcoords")
        .append("div")
        .attr("class", "spcd3-tooltip-values");
    let tooltipValuesTop = select("#spcd3-parallelcoords")
        .append("div")
        .attr("class", "spcd3-tooltip-values");
    let tooltipValuesDown = select("#spcd3-parallelcoords")
        .append("div")
        .attr("class", "spcd3-tooltip-values");
    setBrushDown(featureAxis, brushOverlay, tooltipValues);
    setBrushUp(featureAxis, brushOverlay, tooltipValues);
    setRectToDrag(featureAxis, tooltipValuesTop, tooltipValuesDown);
    setMarker(featureAxis);
    setContextMenu(featureAxis);
    setInvertIcon(featureAxis);
}
function setDefsForIcons() {
    const svgContainer = svg;
    let defs = svgContainer.select("defs");
    defs = svgContainer.append("defs");
    createImage(defs, "arrow_image_up", 12, 12, getArrowUp());
    createImage(defs, "arrow_image_down", 12, 12, getArrowDown());
    createImage(defs, "brush_image_top", 14, 10, getArrowTop());
    createImage(defs, "brush_image_bottom", 14, 10, getArrowBottom());
    createImage(defs, "brush_image_top_active", 14, 10, getArrowTopActive());
    createImage(defs, "brush_image_bottom_active", 14, 10, getArrowBottomActive());
}
function createImage(defs, id, width, height, image) {
    const themedImage = id === "arrow_image_up" || id === "arrow_image_down"
        ? applyThemeToSvg(image)
        : id.startsWith("brush_image_")
            ? applyThemeToBrushSvg(image)
            : applyThemeToSvg(image);
    defs
        .append("image")
        .attr("id", id)
        .attr("width", width)
        .attr("height", height)
        .attr("href", "data:image/svg+xml," + encodeURIComponent(themedImage));
}
function setInvertIcon(featureAxis) {
    let value = (50 / 1.3).toFixed(4);
    const invertIcon = featureAxis
        .append("svg")
        .attr("x", -6 - 22)
        .attr("y", Number(value) - 22)
        .attr("width", 44)
        .attr("height", 22)
        .attr("overflow", "visible");
    invertIcon
        .append("rect")
        .attr("id", "invert_hitbox")
        .attr("class", "hitbox")
        .attr("x", 6)
        .attr("y", Number(value) - 33)
        .attr("width", 44)
        .attr("height", 15)
        .attr("rx", 6)
        .attr("ry", 6)
        .attr("fill", "transparent")
        .style("pointer-events", "all")
        .each(function (d) {
        const processed = cleanString(d.name);
        const [hotspotX, hotspotY] = getCursorHotspot(getArrowDownCursorMeta(), 12);
        select(this)
            .attr("id", "invert_hitbox_" + processed)
            .style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowDownCursor(), 12)))}') ${hotspotX} ${hotspotY}, auto`);
    });
    invertIcon
        .append("svg")
        .attr("width", 12)
        .attr("height", 12)
        .attr("x", 22.5)
        .attr("y", Number(value) - 33)
        .attr("viewBox", "0 0 6 10")
        .append("path")
        .attr("d", ARROW_UP_PATH)
        .attr("fill", "currentColor")
        .each(function (d) {
        const processed = cleanString(d.name);
        const [hotspotX, hotspotY] = getCursorHotspot(getArrowDownCursorMeta(), 12);
        select(this)
            .attr("id", "dimension_invert_" + processed)
            .text("up")
            .style("cursor", `url('data:image/svg+xml,${encodeURIComponent(applyThemeToSvg(setSize(getArrowDownCursor(), 12)))}') ${hotspotX} ${hotspotY}, auto`);
    });
    invertIcon.on("click", (event, d) => {
        invert(d.name);
        event.stopPropagation();
    });
}
// Hovering
let currentlyHighlightedItems = [];
let hoverSnapshot = null;
function highlight(data) {
    hoverSnapshot = data;
    const cleanedItems = data.map((item) => cleanString(item).replace(/[.,]/g, ""));
    currentlyHighlightedItems = [...cleanedItems];
    cleanedItems.forEach((item) => {
        select("#" + item)
            .interrupt()
            .transition()
            .duration(40)
            .style("stroke", "rgba(200, 28, 38, 0.7)");
    });
}
function doNotHighlight() {
    if (!currentlyHighlightedItems.length)
        return;
    currentlyHighlightedItems.forEach((item) => {
        const line = select("#" + item);
        if (line.classed("selected")) {
            line.interrupt().style("stroke", "rgba(255, 165, 0, 1)");
        }
        else if (line.classed("colored")) {
            const color = line.property("clusterColor");
            line.interrupt().style("stroke", color);
        }
        else {
            line.interrupt().style("stroke", "var(--spcd3-active-records)");
        }
    });
    currentlyHighlightedItems = [];
}
function setMarker(featureAxis) {
    featureAxis.each(function (d) {
        const processedDimensionName = cleanString(d.name);
        select(this)
            .append("g")
            .append("rect")
            .attr("id", "marker_" + processedDimensionName)
            .attr("class", "spcd3-marker")
            .attr("width", 44)
            .attr("height", 330)
            .attr("x", -22)
            .attr("y", 30);
    });
}

var EOL = {},
    EOF = {},
    QUOTE = 34,
    NEWLINE = 10,
    RETURN = 13;

function objectConverter(columns) {
  return new Function("d", "return {" + columns.map(function(name, i) {
    return JSON.stringify(name) + ": d[" + i + "] || \"\"";
  }).join(",") + "}");
}

function customConverter(columns, f) {
  var object = objectConverter(columns);
  return function(row, i) {
    return f(object(row), i, columns);
  };
}

// Compute unique columns in order of discovery.
function inferColumns(rows) {
  var columnSet = Object.create(null),
      columns = [];

  rows.forEach(function(row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });

  return columns;
}

function pad(value, width) {
  var s = value + "", length = s.length;
  return length < width ? new Array(width - length + 1).join(0) + s : s;
}

function formatYear(year) {
  return year < 0 ? "-" + pad(-year, 6)
    : year > 9999 ? "+" + pad(year, 6)
    : pad(year, 4);
}

function formatDate(date) {
  var hours = date.getUTCHours(),
      minutes = date.getUTCMinutes(),
      seconds = date.getUTCSeconds(),
      milliseconds = date.getUTCMilliseconds();
  return isNaN(date) ? "Invalid Date"
      : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
      + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
      : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
      : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
      : "");
}

function dsv(delimiter) {
  var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
      DELIMITER = delimiter.charCodeAt(0);

  function parse(text, f) {
    var convert, columns, rows = parseRows(text, function(row, i) {
      if (convert) return convert(row, i - 1);
      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
    });
    rows.columns = columns || [];
    return rows;
  }

  function parseRows(text, f) {
    var rows = [], // output rows
        N = text.length,
        I = 0, // current character index
        n = 0, // current line number
        t, // current token
        eof = N <= 0, // current token followed by EOF?
        eol = false; // current token followed by EOL?

    // Strip the trailing newline.
    if (text.charCodeAt(N - 1) === NEWLINE) --N;
    if (text.charCodeAt(N - 1) === RETURN) --N;

    function token() {
      if (eof) return EOF;
      if (eol) return eol = false, EOL;

      // Unescape quotes.
      var i, j = I, c;
      if (text.charCodeAt(j) === QUOTE) {
        while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
        if ((i = I) >= N) eof = true;
        else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
        else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
        return text.slice(j + 1, i - 1).replace(/""/g, "\"");
      }

      // Find next delimiter or newline.
      while (I < N) {
        if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
        else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
        else if (c !== DELIMITER) continue;
        return text.slice(j, i);
      }

      // Return last token before EOF.
      return eof = true, text.slice(j, N);
    }

    while ((t = token()) !== EOF) {
      var row = [];
      while (t !== EOL && t !== EOF) row.push(t), t = token();
      if (f && (row = f(row, n++)) == null) continue;
      rows.push(row);
    }

    return rows;
  }

  function preformatBody(rows, columns) {
    return rows.map(function(row) {
      return columns.map(function(column) {
        return formatValue(row[column]);
      }).join(delimiter);
    });
  }

  function format(rows, columns) {
    if (columns == null) columns = inferColumns(rows);
    return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
  }

  function formatBody(rows, columns) {
    if (columns == null) columns = inferColumns(rows);
    return preformatBody(rows, columns).join("\n");
  }

  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }

  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }

  function formatValue(value) {
    return value == null ? ""
        : value instanceof Date ? formatDate(value)
        : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\""
        : value;
  }

  return {
    parse: parse,
    parseRows: parseRows,
    format: format,
    formatBody: formatBody,
    formatRows: formatRows,
    formatRow: formatRow,
    formatValue: formatValue
  };
}

var csv = dsv(",");

var csvParse = csv.parse;

function loadCSV(csv) {
    let completeArray = csv.split(/\r?\n/);
    if (checkIfDuplicatesExists(completeArray[0])) {
        csv = removeDuplicateColumnNames(csv);
    }
    let tempData = csvParse(csv);
    let data = validateParsedCsv(tempData);
    if (data.invalidRows.length !== 0) {
        showInvalidRowsMessage(data.invalidRows, tempData.columns, data.removedColumns);
    }
    return data.validData;
}
function showInvalidRowsMessage(invalidRows, columns, removedColumns) {
    const overlay = document.createElement("div");
    overlay.className = "spcd3-modal-overlay";
    overlay.style.display = "block";
    const modal = document.createElement("div");
    modal.className = "spcd3-modal";
    modal.style.display = "block";
    const header = document.createElement("div");
    header.className = "spcd3-modal-header";
    const closeButton = document.createElement("span");
    closeButton.className = "spcd3-close-button";
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", () => {
        document.body.removeChild(overlay);
    });
    header.appendChild(closeButton);
    modal.appendChild(header);
    const contentDiv = document.createElement("div");
    contentDiv.className = "spcd3-modal-content";
    contentDiv.addEventListener("click", (e) => e.stopPropagation());
    const importInfo = document.createElement("div");
    importInfo.className = "spcd3-modal-info";
    importInfo.textContent = `Dataset imported.`;
    contentDiv.appendChild(importInfo);
    const removedRowInfo = document.createElement("div");
    removedRowInfo.className = "spcd3-modal-info";
    removedRowInfo.textContent = `${invalidRows.length} invalid rows found.`;
    contentDiv.appendChild(removedRowInfo);
    if (removedColumns.length > 0) {
        const removedColumnInfo = document.createElement("div");
        removedColumnInfo.className = "spcd3-modal-info";
        if (removedColumns.length > 1) {
            removedColumnInfo.textContent = `${removedColumns.length} columns without data: ${removedColumns.join(", ") + "."}`;
            contentDiv.appendChild(removedColumnInfo);
        }
        else {
            removedColumnInfo.textContent = `${removedColumns.length} column without data: ${removedColumns.join(", ") + "."}`;
            contentDiv.appendChild(removedColumnInfo);
        }
    }
    const btn = document.createElement("button");
    btn.textContent = "View";
    btn.className = "spcd3-button spcd3-generic-button";
    btn.addEventListener("click", () => {
        document.body.removeChild(overlay);
        showInvalidRowsPopup(invalidRows, columns, removedColumns);
    });
    contentDiv.appendChild(btn);
    modal.appendChild(contentDiv);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}
function showInvalidRowsPopup(invalidRows, columns, removedColumns = []) {
    const overlay = document.createElement("div");
    overlay.className = "spcd3-modal-tableoverlay";
    overlay.addEventListener("click", () => document.body.removeChild(overlay));
    const dialog = document.createElement("div");
    dialog.className = "spcd3-modal-tabledata";
    dialog.addEventListener("click", (e) => e.stopPropagation());
    const headerRow = document.createElement("div");
    headerRow.className = "spcd3-header-row";
    const title = document.createElement("h2");
    title.textContent = `Invalid Rows (${invalidRows.length})`;
    title.style.margin = "0";
    const closeButton = document.createElement("span");
    closeButton.className = "spcd3-close-button";
    closeButton.innerHTML = "&times;";
    closeButton.addEventListener("click", () => {
        document.body.removeChild(overlay);
    });
    headerRow.appendChild(title);
    headerRow.appendChild(closeButton);
    const scrollWrapper = document.createElement("div");
    scrollWrapper.className = "spcd3-scroll-wrapper";
    const tableWrapper = document.createElement("div");
    tableWrapper.className = "spcd3-tablecontainer";
    const table = renderInvalidTable(invalidRows, columns, removedColumns);
    tableWrapper.appendChild(table);
    scrollWrapper.appendChild(tableWrapper);
    dialog.appendChild(headerRow);
    dialog.appendChild(scrollWrapper);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}
function renderInvalidTable(rows, columns, removedColumns = []) {
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    columns.forEach((c) => {
        const th = document.createElement("th");
        th.className = "spcd3-th";
        const isRemoved = removedColumns.includes(c);
        th.textContent = c;
        th.style.textAlign = "left";
        if (isRemoved) {
            th.classList.add("spcd3-invalid-cell");
        }
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    const tbody = document.createElement("tbody");
    rows.forEach((row) => {
        const tr = document.createElement("tr");
        columns.forEach((col) => {
            const td = document.createElement("td");
            td.className = "spcd3-td";
            const rawValue = row[col];
            const isEmptyOrNull = isEmptyCell(rawValue);
            const isInvalid = row.__invalidColumns?.includes(col) || removedColumns.includes(col);
            const isNumber = typeof rawValue === "number" ||
                (typeof rawValue === "string" &&
                    rawValue.trim() !== "" &&
                    !isNaN(Number(rawValue.replace(",", "."))));
            const align = isNumber ? "right" : "left";
            const displayValue = rawValue === null
                ? "(null)"
                : isEmptyOrNull
                    ? "null"
                    : rawValue;
            td.textContent = displayValue;
            if (isInvalid || isEmptyOrNull) {
                td.classList.add("spcd3-invalid-cell");
            }
            td.style.textAlign = align;
            td.style.fontSize = "0.85rem";
            td.style.padding = "4px 8px";
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    const table = document.createElement("table");
    table.appendChild(thead);
    table.appendChild(tbody);
    return table;
}
function isEmptyCell(value) {
    return value === undefined || value === null || String(value).trim() === "";
}
function validateParsedCsv(data) {
    const originalColumns = data.columns;
    const removedColumns = originalColumns.filter((col) => data.every((row) => isEmptyCell(row[col])));
    const columns = originalColumns.filter((col) => !removedColumns.includes(col));
    const validData = [];
    Object.defineProperty(validData, "columns", {
        value: columns,
        enumerable: false,
    });
    const invalidRows = [];
    Object.defineProperty(invalidRows, "columns", {
        value: columns,
        enumerable: false,
    });
    for (const row of data) {
        const emptyCols = [];
        for (const col of columns) {
            if (isEmptyCell(row[col])) {
                emptyCols.push(col);
            }
        }
        if (emptyCols.length > 0) {
            invalidRows.push({
                ...row,
                __invalidColumns: emptyCols,
            });
        }
        else {
            validData.push(row);
        }
    }
    return {
        validData,
        invalidRows,
        removedColumns,
    };
}
function removeDuplicateColumnNames(value) {
    const { headerLine, rest } = splitHeaderFromCsv(value);
    const columns = parseCsvHeaderLine(headerLine);
    const seen = new Map();
    const uniqueColumns = columns.map((column) => {
        const count = seen.get(column) ?? 0;
        seen.set(column, count + 1);
        return count === 0 ? column : `${column}(${count})`;
    });
    const rebuiltHeader = uniqueColumns.map(escapeCsvCell).join(",");
    return `${rebuiltHeader}${rest}`;
}
function checkIfDuplicatesExists(value) {
    const columns = parseCsvHeaderLine(value);
    return new Set(columns).size !== columns.length;
}
function splitHeaderFromCsv(csv) {
    let inQuotes = false;
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        const next = csv[i + 1];
        if (char === '"') {
            if (inQuotes && next === '"') {
                i += 1;
            }
            else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (!inQuotes && (char === "\n" || char === "\r")) {
            if (char === "\r" && next === "\n") {
                return {
                    headerLine: csv.slice(0, i),
                    rest: csv.slice(i),
                };
            }
            return {
                headerLine: csv.slice(0, i),
                rest: csv.slice(i),
            };
        }
    }
    return {
        headerLine: csv,
        rest: "",
    };
}
function parseCsvHeaderLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const next = line[i + 1];
        if (char === '"') {
            if (inQuotes && next === '"') {
                current += '"';
                i += 1;
            }
            else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (!inQuotes && char === ",") {
            values.push(current);
            current = "";
            continue;
        }
        current += char;
    }
    values.push(current);
    return values;
}
function escapeCsvCell(value) {
    if (/[",\r\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export { clearSelection, colorRecord, createSvgString, deleteChart, disableInteractivity, drawChart, enableInteractivity, getAllDimensionNames, getAllHiddenDimensionNames, getAllRecords, getAllVisibleDimensionNames, getCurrentMaxRange, getCurrentMinRange, getDimensionPosition, getDimensionRange, getFilter, getHiddenStatus, getInversionStatus, getMaxValue, getMinValue, getNumberOfDimensions, getRecordWithId, getSelectableWith, getSelected, hide, hideMarker, invert, invertWoTransition, isDimensionCategorical, isRecordInactive, isSelected, isSelectedWithRecordId, loadCSV, move, moveByOne, realignToolbar, refresh, renderInvalidTable, reset, saveAsSvg, setClassColoredFalse, setDimensionForHovering, setDimensionRange, setDimensionRangeRounded, setDimensionSpacing, setFilter, setInversionStatus, setSelectableWidth, setSelected, setSelectedWithId, setSelection, setSelectionWithId, setUnselected, setUnselectedWithId, show, showInvalidRowsMessage, showMarker, swap, syncDimensionOrderWithVisible, throttleShowValues, toggleSelection, toggleSelectionWithId, uncolorRecord };
//# sourceMappingURL=spcd3.js.map
