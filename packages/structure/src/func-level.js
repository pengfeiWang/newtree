import {
  extend
} from './utils';
import { WSAEMSGSIZE } from 'constants';
let splitArr = (arr) => {
  let num = arr.length;
  let remainder = num%2;
  let centerNum = num / 2;
  let arrL = [], arrR = [], arrC = [];
  let integer = parseInt(centerNum, 10);
  let upinteger = Math.ceil(centerNum);
  
  arrL = arr.slice(0, integer);
  arrR = arr.slice(integer);

  if (remainder) {
    arrR = arr.slice(upinteger);
    arrC = arr.slice(integer, 1);
  };

  return {
    arrL,
    arrR,
    arrC
  };
};

const position = (n) => {
  return (n - 1) / 2;
};
function nextLeft(v) {
  var children = v.children;
  return children ? children[0] : v;
}

function nextRight(v) {
  var children = v.children;
  return children ? children[children.length - 1] : v;
}
function subTree (sd) {
  let children = sd.children;
  if (!children) return;
  let len = children.length;
  let Z = sd.z;
  let sZ = position(len);

  while (--len >= 0) {
    console.log(Z);
  }

}
const eachAfter = (arr, cb) => {
  if (!cb) return;
  for (let i = arr.length - 1; i >= 0; i--) {
    cb(arr[i], i);
  }
};
const eachLeft = (node, cb) => {
  if (!cb) return;
  let i = node.idx - 1;
  let siblings = node.parent.children;

  for (;i >= 0; --i) {
    console.log(siblings[i]);
    // cb(siblings[i], i, node)
  }
  
};

const eachRight = (node, cb) => {
  if (!cb) return;
  let i = node.idx + 1;
  let siblings = node.parent.children;
  let len = siblings.length;
  for (;i < len; i++) {
    console.log(siblings[i]);
    cb(siblings[i], i, node)
  }
};
const leftMove = () => {};
const rightMove = () => {};
const echUp = (pt, v) => {
  let ptNode = pt.parent;
  if (!ptNode) {
    pt[v || 'z'] = 0;
    return;
  }
  if (v) {
    ptNode.children.forEach((it, i) => {
      it[v] = 0;
    });

  } else {
    ptNode.children.forEach((it, i) => {
      it.z= i;
    });
  }
};
const initIndex = (node) => {
  if (node.children) {
    echUp(node);
    node.children.forEach((it, i) => {
      it.i = i;
    });
  } else {
    echUp(node);
  }
};
const initProperty = (node) => {
  let arr = ['m', 'p'];
  let hd = () => {
    arr.forEach((v) => {
      echUp(node, v);
    });
  };
  hd(node);
  if (node.children) {
    node.children.forEach((it, i) => {
      arr.forEach((v) => {
        it[v] = 0;
      });
    });
  }
};
// 移动子树
// 并使用变量记录移动值
const moveSubtree = (node) => {

};
// 计算移动值
const executeShifts = () => {};


function levelsRender(nodes) {
  let { ops } = this;
  let { nodeWidth: nW, nodeGapWidth } = ops;

  console.log(nodes)
  const handlerTree = () => {
    console.group('======= start ========');
    // var midpoint = position(this._dataSource.children.length);
    // this._dataSource.z = -midpoint;
    this._dataSource.m = 0;
    
    // 初始化 idx
    this._dataSource.eachAfter(initIndex);
    // // 初始化 其他属性
    this._dataSource.eachAfter(initProperty);

    this._dataSource.eachAfter(firstWalk);
    // this._dataSource.p = -this._dataSource.z;
    // this._dataSource.eachBefore(secondWalk);
    
    nodes.forEach((it, i) => {
      it.x =  it.m * 240;
    });



    console.groupEnd('======= start ========');
  };
  const secondWalk = (node) => {
    let chd = this._dataSource.children;
    let mid = 0;
    if (chd) {
      mid = (chd.length - 1) / 2;
    }
  
    // n = 1;
    // i = 0;
    // p = 1;
    // node.m;
  };
  const firstWalk = (v) => {
    var { children, parent } = v,
      siblings = parent ? parent.children : null,
      w = siblings ? siblings[v.i - 1] : null;
    console.group('====== nodeHandler ========');
    if (children) {
      let midpotin =( children.length - 1) / 2;
      v.m = midpotin;
    }
    console.groupEnd('====== nodeHandler ========');
  };

  handlerTree();
}


export {
  levelsRender
};