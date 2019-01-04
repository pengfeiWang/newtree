const hasOwn = Object.prototype.hasOwnProperty,
    toStr = Object.prototype.toString;
const isArray = function isArray(arr) {
  if (typeof Array.isArray === 'function') {
    return Array.isArray(arr);
  }
  return toStr.call(arr) === '[object Array]';
};
const rect2path = function rect2path(x, y, width, height, rx, ry) {
  /* 
  * rx 和 ry 的规则是： 
  * 1. 如果其中一个设置为 0 则圆角不生效 
  * 2. 如果有一个没有设置则取值为另一个 
  */ 
  rx = rx || ry || 0; ry = ry || rx || 0; 
  //非数值单位计算，如当宽度像100%则移除 
  if (isNaN(x - y + width - height + rx - ry)) return;
  rx = rx > width / 2 ? width / 2 : rx; 
  ry = ry > height / 2 ? height / 2 : ry; 
  //如果其中一个设置为 0 则圆角不生效 
  if (0 == rx || 0 == ry){
  // var path = 
    // 'M' + x + ' ' + y + 
    // 'H' + (x + width) + 不推荐用绝对路径，相对路径节省代码量 
    // 'V' + (y + height) + 
    // 'H' + x + // 'z'; 
    var path = 'M' + x + ' ' + y + 'h' + width + 'v' + height + 'h' + -width + 'z'; 
  } else { 
    var path = 'M' + x + ' ' + (y+ry) + 'a' + rx + ' ' + ry + ' 0 0 1 ' + rx + ' ' + (-ry) + 'h' + (width - rx - rx) + 'a' + rx + ' ' + ry + ' 0 0 1 ' + rx + ' ' + ry + 'v' + (height - ry -ry) + 'a' + rx + ' ' + ry + ' 0 0 1 ' + (-rx) + ' ' + ry + 'h' + (rx + rx -width) + 'a' + rx + ' ' + ry + ' 0 0 1 ' + (-rx) + ' ' + (-ry) + 'z';
  } 
  return path;
};
const isEmptyObject = function(obj) {
  let name;
  for (name in obj) {
    return false;
  }
  return true;
};
const isObject = function isObject (o) {
  return o != null 
    && typeof o === 'object' && toStr.call(o) === '[object Object]';
};
const isPlainObject = function isPlainObject(obj) {
  if (!obj || toStr.call(obj) !== '[object Object]') {
    return false;
  }

  const hasOwnConstructor = hasOwn.call(obj, 'constructor');
  const hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
  if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
    return false;
  }

  let key;
  for (key in obj) { /**/ }
  return typeof key === 'undefined' || hasOwn.call(obj, key);
};
const sumArraySize = function (arr, sArr) {
  let tmpArr = sArr || [];
  var i = 0;
  for (; i < arr.length; i++) {
    if (isArray(arr[i])) {
      sumArraySize(arr[i], tmpArr);
    } else {
      tmpArr.push(1);
    }
  }
  return tmpArr.length;
};
const cDetection = function (o1, o2, w, h) {
  const bl = Math.abs(o1.l - o2.l) <= w;
  const bt = Math.abs(o1.t - o2.t) <= h;
  const br = Math.abs(o1.r - o2.r) <= w;
  const bb = Math.abs(o1.b - o2.b) <= h;

  const L = bl;
  const T = bt;
  const R = br;
  const B = bb;

  if ((L && T)
      || (R && B)
      || (L && B)
      || (R && T)) {
    return true;
  }

  return false;
};
const deepChildren = function (depth, d) {
  let arr = d.children;
  for (let i = 0, len = arr.length; i < len; i++) {
    if (arr[i].children) {
      arr[i].depth = depth;
      deepChildren(depth + 1, arr[i]);
    } else {
      arr[i].depth = depth;
    }
  }
  return d;
};
function extend() {

  var options, name, src, copy, copyIsArray, clone;
  var target = arguments[0];
  var i = 1;
  var length = arguments.length;
  var deep = false;

  if (typeof target === 'boolean') {
    deep = target;
    target = arguments[1] || {};
    i = 2;
  }
  if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
    target = {};
  }

  for (; i < length; ++i) {
    options = arguments[i];
    if (options != null) {
      for (name in options) {
        src = target[name];
        copy = options[name];

        if (target !== copy) {
          if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
            if (copyIsArray) {
              copyIsArray = false;
              clone = src && isArray(src) ? src : [];
            } else {
              clone = src && isPlainObject(src) ? src : {};
            }

            target[name] = extend(deep, clone, copy);

          } else if (typeof copy !== 'undefined') {
            target[name] = copy;
          }
        }
      }
    }
  }
  return target;
}
function readMultiStageObject(o, key) {
  if (!o || !key) return '';
  var tmp = [];
  var val = hasOwn.call(o, key) ? o[key] : '';
  if (typeof key === 'string' && /\./.test(key)) {
    key = key.replace(/^\./, '').replace(/\.$/, '');
    tmp = key.split('.');
    val = o;
    for (var i = 0, len = tmp.length; i < len; i++) {
      if (val && val.hasOwnProperty(tmp[i])) {
        val = val[tmp[i]];
      } else {
        val = null;
      }
    }
  }
  return val;
}
function computedStyle (obj) {
  return '.organiztion .node text  {'+
    'font-size:' + obj.fontSize + 'px;' +
    'font-family: "微软雅黑", "sans-serif";'+
    'fill: ' + obj.color + ';'+
  '}';
}
function getTextWidth (text, fontSize) {
  var tmpSpan = document.createElement('span');    
  tmpSpan.style.position = 'absolute';
  tmpSpan.style.top = 0;
  tmpSpan.style.left = '-99999px';
  tmpSpan.style.fontSize = (fontSize || 14) + 'px';
  tmpSpan.style.fontFamily = 'sans-serif';
  tmpSpan.innerHTML = text;
  document.body.appendChild(tmpSpan);
  return tmpSpan;
}
function realityTxt (txt, opsComputedWidth, fontSize) {
  var tmp = [];
  var span = getTextWidth(txt, fontSize);
  var size = span.getBoundingClientRect();
  // var start = txt.substring(0, 6);
  if (parseInt(size.width) >= opsComputedWidth) {
    for (let i = 0, len = txt.length; i < len; i++) {
      tmp.push(txt[i]);
      span.innerHTML = tmp.join('');

      var s = span.getBoundingClientRect();
      if (parseInt(s.width) + fontSize * 3  >= opsComputedWidth) {
        tmp.pop();
        tmp.push('...');
        txt = tmp.join('');
        span.parentNode.removeChild(span);
        break;
      }
    }
  }
  if (span && span.parentNode) {
    span.parentNode.removeChild(span);
  }
  return txt;
}
const o = {
  hasOwn,
  toStr,
  isArray,
  isEmptyObject,
  isObject,
  isPlainObject,
  sumArraySize,
  cDetection,
  deepChildren,
  extend,
  readMultiStageObject,
  computedStyle,
  getTextWidth,
  realityTxt
};
export {
  hasOwn,
  toStr,
  isArray,
  isEmptyObject,
  isObject,
  isPlainObject,
  sumArraySize,
  cDetection,
  deepChildren,
  extend,
  readMultiStageObject,
  computedStyle,
  getTextWidth,
  realityTxt,
  rect2path
};