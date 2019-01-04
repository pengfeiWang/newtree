import { renderSerchTxt } from './template-string';
import {
  isArray,
  isEmptyObject
} from './utils';
function search () {

  let htmlNode = this.htmlNode,
      ops = this.ops;

  const cls = 'search-wraper';
  let sCls = ops.searchContainerClass || '';
  let container = document.createElement('div');

  // 搜索容器
  container.className = `${cls} ${sCls}`;

  container.innerHTML = renderSerchTxt({
    searchPlaceHolder: ops.searchPlaceHolder
  });
  this._searchContainer = container;
  htmlNode.appendChild(container);

  this._searchPrebtn = container.querySelector('.search-button-pre');
  this._searchNextBtn = container.querySelector('.search-button-down');
  this._searchInput = container.querySelector('.search-input');


  this._searchInputClearBtn = container.querySelector('.input-clear-btn');

  this._searchCurDom = container.querySelector('.curNum');
  this._searchResultDom = container.querySelector('.resultNum');
  // 前进 后退
  this._searchPrebtn.addEventListener('click', () => {
    _searchStep(-1);
  });

  this._searchNextBtn.addEventListener('click', () => {
    _searchStep(1);
  });

  // 清除
  this._searchInputClearBtn.addEventListener('click', () => {
    this._searchResult = {};
    this._searchInput.value = '';
    this._searchCur = null;
  });

  // 回车
  this._searchInput.addEventListener('keyup', (e) => {
    if (e.keyCode === 13) {
      _searchStep(1);
    } else {
      this._searchCur = null;
    }
  });
  // 防抖
  // this._searchInput.addEventListener(
  //   'input',
  //   debounce(this._searchInputEvent.bind(this), 300)
  // );


  let _searchInputEv = () => {
    let val = this._searchInput.value;
    let ops = this.ops;
    let { searchKeys } = ops;
    if (!val) {
      this._searchCur = null;
      this._searchResult = {};
      return;
    }
    if (!searchKeys || !searchKeys.length) {
      return;
    }
    let onlyKey = this.ops.onlyKey;
    let reg = new RegExp(val, 'i');
    this._searchResult = {};
    this.dataNodes.forEach((it) => {
      if (isArray(searchKeys)) {
        searchKeys.forEach((key) => {
          if (reg.test(it.data[key])) {
            this._searchResult[it[onlyKey]] = it;
          }
        });
      }
    });
  };

    /**
     * 移动画布条件
     * svg 可视区域 svgW, svgH
     * vis 画布
     * vis 尺寸大于画布尺寸, 则会移动画布, 选定的节点移入可视区, 否则不移动画布
     * 
     * 移动距离
     * 
     * 当前画布的位置, 节点 x, y, 宽 高
     * 匹配的节点所处于画布的位置, nodeX, nodeY, nodeW, nodeH
     * 
     * x = x + nodeX <= 0 ? Math.abs(x)+ nodeGapWidth 移动匹配元素至画布左侧边缘
     * x + nodeX + nodeW > svgW ? x - (x + nodeX + nodeW - svgW)
     */
  let _searchStep = (type) => {
    _searchInputEv();
    if (this.isLock()) return;

    if (isEmptyObject(this._searchResult)) {
      return;
    }

    _searchMatching(type);
  };

  /**
   * 匹配节点
   * @param { -+ 1 } type 
   */
  let _searchMatching = (type) => {
    
    let ops = this.ops;
    let svgDom = this.svg.node();
    let t = d3.zoomTransform(this.svg.node());
    let nW = ops.nodeWidth, nH = ops.nodeHeight;

    let svgSize = svgDom.getBoundingClientRect();

    let curX = t.x,
        curY = t.y;
    let scale = t.k;

    let nodeGapWidth = ops.nodeGapWidth;

    let sW = svgSize.width, sH = svgSize.height;

    let pos = (o) => {
      let x = curX, y = curY;
      let cupNodeGap = (nodeGapWidth * scale);

      
      let rel_l, rel_r, rel_t, rel_b;

      rel_l = curX + o.x * scale;
      rel_r = rel_l + nW * scale;

      rel_t = curY + o.y * scale;
      rel_b = rel_t + nH * scale;

      if (o.x === 0) {
        x = (sW - (ops.nodeWidth * scale)) / 2;
      } else if (rel_l < 0) {
        x = curX + (Math.abs(rel_l)) + cupNodeGap;
      } else if (rel_r >= sW){
        x = curX - Math.abs(sW - (rel_r + cupNodeGap));
      }
      if (o.y === 0) {
        y = cupNodeGap;
      } else if (rel_t < 0) {
        y = curY + (Math.abs(rel_t)) + cupNodeGap;
      } else if (rel_b > sH) {
        y = curY - (rel_b - sH + cupNodeGap * 2);
      }

      return {
        x, y
      };
    };
    let posCenter = (o) => {
      let x = curX, y = curY;
      let sW = svgSize.width, sH = svgSize.height;
      
      let centerX = (sW - (nW) * scale) / 2, centerY = (sH - (nH + 12.5) * scale) / 2;

      let computedX = Math.abs(o.x * scale);
      let computedY = Math.abs(o.y * scale);
      if (o.x < 0) {
        x = centerX + computedX;
      } else {
        x = centerX - computedX;
      }
      if (o.y < 0) {
        y = centerY + computedY;
      } else {
        y = centerY - computedY;
      }
      return {
        x, y
      };
    };
    let keys = Object.keys(this._searchResult);
    this._searchResultDom.innerHTML = isEmptyObject(this._searchResult) ? 0 : keys.length;
    if (this._searchCur === null) {
      this._searchCur = 0;
    } else {
      this._searchCur = this._searchCur + type;
    }

    if (this._searchCur > keys.length - 1) {
      this._searchCur = 0;
    }
    if (this._searchCur < 0) {
      this._searchCur = keys.length - 1;
    }

    let o = this._searchResult[keys[this._searchCur || 0]];

    this._searchCurDom.innerHTML = this._searchCur + 1;
    if (!o) return;

    _setSearchMatchStatus(o);
    if (o.x === 0 && curX === (sW - nW) / 2) {
      return;
    }

    this._translate(ops.searchFocusingCenter ? posCenter(o) : pos(o));
    if (ops.searchCallback) {
      _searchCallbackHandler(o.data);
    }
  };
  let _searchCallbackHandler = (oData) => {
    let ops = this.ops, _that = this;
    ops.searchCallback.call(this, oData);
  };
  /**
   * 给匹配到的节点增加样式
   * @param {*} o 
   */
  let _setSearchMatchStatus = (o) => {

    let d3Node = this.svg.selectAll('g.node');
    let removeAllCls = () => {
      d3Node.nodes().forEach((domNode, i) => {
        let curCls = d3.select(domNode).attr('class');

        curCls = curCls.replace(/search-selected/g, '');

        d3.select(domNode).attr('class', curCls);
      });
    };
    let addCls = (i) => {
      let curDom = d3.select(d3Node.nodes()[i]);
      let cls = curDom.attr('class');

      cls = cls.trim() + ' search-selected';

      d3.select(d3Node.nodes()[i]).attr('class', cls);
    };

    d3Node.filter((dataNode, i) => {
      if (dataNode === o) {
        removeAllCls();
        addCls(i);
      }
    });

  };

}

export default search;