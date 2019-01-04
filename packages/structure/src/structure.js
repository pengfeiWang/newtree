import * as d3 from 'd3';
// import debounce from 'lodash.debounce';
import {
  // xmlns,
  // xlink,
  // doctype,
  svgNameSpace
} from './svg-doc';
import {
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
} from './utils';
import './global-svg';
import {
  FLOAT_TOP,
  LINE_CENTER,
  PHOTO_LINE_TEXT_OFFSET_TOP,
  ICON_WIDTH,
} from './vars';
import Base from './class-base';
import {
  _inlineStyle,
  _inlineHtmlStyle
} from './func-inlineStyles';
import {
  _defsTemplate,
  _defsTemplateSizeChange
} from './func-template';
import search from './func-search';
import {
  levelsRender
} from './func-level';

import raf from 'raf';

import './save';

let PHOTO_TOP_BOTTOM_GAP = FLOAT_TOP * 3,
    clickTime = 200,
    clickStart = 0,
    clickEnd = 0;

const userAgent = navigator.userAgent;
const isIE9 = /MSIE\s9.0/.test(userAgent);
const isEdge = userAgent.indexOf("Edge") > -1;
const isIE = userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1;
const isIE11 = /trident\/\d+/i.test(userAgent);
const noop = function () {};

const levelinkVertical = function () {};
const levelinkHorizontal = function () {};

class OrganiztionStructure extends Base {
  constructor(ops){
    super(ops);
    this.init();
  }
  initTree () {

  }
  /**
   * 初始化
   * @return {[type]} [description]
   */
  init () {
    const _that = this, ops = this.ops;
    // 已经初始化
    if (this._initialed) return;
    this.initial();

    this._inlineStyle();
    this._inlineHtmlStyle();
    this._reComputNodeHeight();
    this._defsTemplate();
    this._defsTemplateSizeChange();

    // 初始树
    this.tree = d3.tree()
    .separation(function (a, b) {
      return a.parent == b.parent ? 1 : 2;
    })
      .size(
        (
          this._isVertical
            ? [ops.canvasWidth, ops.canvasHeight]
            : [ops.canvasHeight, ops.canvasWidth]
        )
      )
      .nodeSize(
        this._isVertical
          ?
            [
              ops.nodeWidth + ops.nodeGapWidth,
              ops.nodeHeight + ops.nodeGapWidth
            ]
          :
            [
              ops.nodeHeight + ops.nodeGapWidth,
              ops.nodeWidth + ops.nodeGapWidth
            ]
      );
    this._dataSource = d3.hierarchy(ops.root, function(d) {
      return d.children || []; 
    });
    // this._dataSource.children.reverse();
    // this._dataSource.children.sort(function (a, b) { console.log(a, b);return b - a});

    this.zoomListener = d3.zoom()
      .scaleExtent([ this.ops.canvasMin, this.ops.canvasMax ])
      .on('zoom', function () {
        _that._zoom();
      });
    this.svg.call(this.zoomListener).on('dblclick.zoom', null);
    this._dataSource.x0 = 0;
    this._dataSource.y0 = 0;
    if (this._dataSource.children /*&& !ops.defaultExpandLevel*/) {
    // 未设置默认展开层级, 只展开一层
    this._dataSource.children.forEach(function (d) {
      _that.toggleAll(d);
    });
    }

    if (ops.openSearch) {
      this._initSearch();
    }
    // this._transition.on('end', function () {
    //   console.log('end')
    // });
    if (!ops.isReadOnly) {
      this._createDropdownMenuContainer();
      this._documentStopEventDefault();
    }


    this._isInitialUpdate = true;
    this._initialed = true;
    this.ops.olDuration = this.ops.duration;
    this.ops.duration = 0;
    /**
    临时注释
    this.watchOps();
    this.watchInsProperty();
    */
    this.start();
  }

  _inlineStyle (ops) {
    _inlineStyle.call(this, ops);
  }
  _inlineHtmlStyle () {
    _inlineHtmlStyle.call(this);
  }
  /**
   *  无变化模板
   * @return {[type]} [description]
   */
  _defsTemplate () {
    _defsTemplate.call(this);
  }
  /**
   * 变化模板
   * 众多元件要重置尺寸等
   */
  _defsTemplateSizeChange () {
    _defsTemplateSizeChange.call(this);
  }



  _createDropdownMenuContainer () {
    const container = document.createElement('div');
    container.className = 'drop-down-menu-container';
    container.style.position = 'fixed';
    container.style.display = 'none';

    const ops = this.ops, dropDownMenu = ops.dropDownMenu;
    const dropMenuList = dropDownMenu && dropDownMenu.menuList ? dropDownMenu.menuList : [];
    const menuClassName = dropDownMenu && dropDownMenu.menuClassName ? dropDownMenu.menuClassName : '';
    const menuWrap = document.createElement('ul');
    const menuItem = document.createElement('li');
    menuWrap.className = 'dropDownMenu ' + menuClassName;

    if (dropDownMenu && dropDownMenu.menuList && typeof dropDownMenu.menuList !== 'function') {
      if (dropMenuList && dropMenuList.length) {
        for (let i = 0, len = dropMenuList.length; i < len; i++) {
          const cloneItem = menuItem.cloneNode(true);
          // cloneItem.setAttribute('key', dropMenuList[i].key);
          cloneItem.dataset.key = dropMenuList[i].key;
          cloneItem.innerHTML = dropMenuList[i].name;
          menuWrap.appendChild(cloneItem);
        }
      }
    }


    container.appendChild(menuWrap);
    this._dropdownMenuContainer = container;
    this._dropMenuListContainer = menuWrap;
    this._dropdownMenuListEvent();
    document.body.appendChild(container);
  }


  start () {
    const ops = this.ops;
    if (ops.lineType === 'bezier' || ops.lineType === 'straight') {
      this['_' + ops.lineType + 'Path']();
    } else {
      this._bezierPath();
    }
    if (ops.openDrag) {
      this.sortBorder.append('svg:use')
        .attr('xlink:href', '#sort-border-tmp')
        .attr('fill', 'rgba(203, 212, 211, 0.5)');
    }

    this.insertSvgSmybol();
    if (ops.zoomBar) {
      this._drawZoomBar();
    }
    /**
     * 临时注释
    
    this.watchInsProperty();
     */
    if (ops.defaultExpandLevel) {
      this.expandAll();
    }
    this.update(this._dataSource);
  }


  update (source) {

    let { ops, _isVertical, _levelSize } = this;
    let { nodeGapWidth } = ops;
    let nW =  ops.nodeWidth,
        nH =  ops.nodeHeight;

    this.sizeNum = [];


      if (source && !source.hasOwnProperty('x0')) {
        source.x0 = 0;
      }
      if (source && !source.hasOwnProperty('y0')) {
        source.y0 = 0;
      }
      if (!source) {
        source = this._dataSource;
      }
      let treeData = this.tree(this._dataSource);
      let nodes = treeData.descendants();

      
      if (isEmptyObject(source.data)) {
        this.clearData();
        return;
      }
      
      let computesNum = nH - nW;
      // 简单模式, 并翻转根节点
      let iSimple = ops.mode === 'simple' && ops.flipRoot;
      /**
       * 按层级显示节点
       * 
       */
      if (ops.levelRender) {
        nodes.forEach((d, i) => {
          if (i === 0) {
            d.computeDepth = 0;
          } else if (d.data.level) {
            d.computeDepth = d.data.level;
          } else {
            d.computeDepth = (d.parent.computeDepth || d.parent.depth) + 1;
          }
        });
      }


      nodes.forEach((d) => {
        let curX = d.x;
        let h = (_isVertical ? nH  : nW);
        let node_Y_Size = h;
        // 简单模式翻转根
        // 需要处理子节点与根节点的 x, y, h
        if (iSimple && !this.isRoot(d)) {
          if (d.depth === 1) {
            h = (_isVertical ? nW : nH);
          } else {
            if (!_isVertical) {
              computesNum = nW - nH;
            }
            h = (_isVertical ? nH  : nW);
          }
          d.x = (curX + (nH + nodeGapWidth) / 2);
          if (!_isVertical) {
            d.x = (curX + (nW + nodeGapWidth) / 2);
          }
        }

        h = h <= 0 ? 80 : h;
        node_Y_Size = (h + nodeGapWidth * 2);
        d.y = (d.computeDepth || d.depth) * node_Y_Size;
        if (iSimple && d.depth > 1 && !this.isRoot(d)) {
          d.y = (d.computeDepth || d.depth) * node_Y_Size - computesNum;
        }

      });

      // if (ops.levelRender) {
        levelsRender.call(this, nodes);
      // }
      this.treeData = treeData;
      this.dataNodes = nodes;
      this._draw(source);

      // 绘制完保存下坐标
      nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      /**
       * 节点, 连线的绘制有延时动画, 结束后需要延时处理其他逻辑
       */
    return new Promise((resolve) => {
      this._transitionEnd(resolve);
    });
  }

  _draw (source) {
    const ops = this.ops;
    this._drawNode(source);
    this._drawLine(source);
    this._drawBackground();
    if (this.ops.customDrawNode && typeof this.ops.customDrawNode === 'function') {
      this.ops.customDrawNode.call(this);
    } else {
      this._drawDetail();
    }
    if (ops.mode !== 'simple' && !ops.isReadOnly) {
      this._drawButtons();
    }
    if (ops.mode !== 'simple') {
      this._drawLastGroup();
    }
    this._drawExpandButton();
    if (!ops.isReadOnly) {
      this._buttonEvent();
      this._nodeEvent();
      this._dragInitial();
    }


    this._expandButtonEvent();
    

    if (this.ops.nodeHeight <= 100 || !this.ops.groups || this.ops.groups.length <= 1) {
      this._allDataNodes.selectAll('.button-wrap').remove();
    }
  }
  /**
   * 绘制节点, 不包含节点内的内容
   * 
   */
  _drawNode (source) {
    const _that = this, ops = this.ops, onlyKey = ops.onlyKey;

    const node = this.vis.selectAll('g.node')
      .data(this.dataNodes, function(d) {
        // eslint-disable-next-line
        let id = onlyKey ? (d[onlyKey] || (d[onlyKey] = ++_that.ops.i)) : d.id = ++_that.ops.i;

        return id; 
      });

    const nodeEnter = node.enter()
      .insert('g', '.node')
      .attr('class', 'node')
      .attr('transform', function() {
        let pos = [source.y0, source.x0];
        if (_that._isVertical) {
          pos = [source.x0, source.y0];
        }
        return 'translate(' + pos + ')';
      });

    const nodeUpdate = nodeEnter.merge(node);
    this._allDataNodes = nodeUpdate;

    nodeUpdate
      .transition()
      .duration(ops.duration)
      .ease(d3.easePoly)
      .attr('transform', function(d, i) {
       
          let pos = [d.y, d.x];
          if (_that._isVertical) {
            pos = [d.x, d.y];
          }
          return 'translate(' + pos + ')';
       });

    node.exit()
      .transition()
      .duration(ops.duration)
      .ease(d3.easePoly)
      .attr('transform', function(d) {
        var pos = [source.y, source.x];
        if (_that._isVertical) {
          pos = [source.x, source.y];
        }

        return 'translate(' + pos + ')';; 
      })
      .remove();
  }
  /**
   * 绘制连线
   * 
   */
  _drawLine (source) {

    const _that = this, ops = this.ops, onlyKey = ops.onlyKey;
    const link = this.vis.selectAll('path.link')
      .data(this.treeData.links(), function (d) {
        return d.target[onlyKey];
      });
    this._allNodeLinks = link;
    const linkEnter = link
      .enter()
      .insert('path', '.node')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke-width', this.ops.lineWidth)
      .attr('stroke', this.ops.lineColor)
      .attr('d', function (d) {
        let { depth, oldY } = d.source;
        let { depth: tDepth, oldY: told } = d.target;

        let o = {
          x: source.x0 || _that._dataSource.x0 || 0,
          y: source.y0 || _that._dataSource.y0 || 0,
          depth
        };
        let to = extend(o, {
          depth: tDepth
        });
        return _that._diagonal(_that._reComputPath({
          source: o,
          target: to,
        }));
      });

    // UPDATE
    const linkUpdate = linkEnter.merge(link);
    linkUpdate
      .transition()
      .duration(ops.duration)
      .ease(d3.easePoly)
      .attr('d', function(d){
        return _that._diagonal(_that._reComputPath(d));
      });

    link.exit()
      .transition()
      .duration(ops.duration)
      .ease(d3.easePoly)
      .attr('d', function(d) {
        let { source: SS, target: TT } = d;
        // 收起时, 目标位置设置为 source 坐标, 让连线消失的过程看起来更舒服
        let { depth: sD } = SS;
        let { depth: tD } = TT;
        console.log('d:', d);
        
        let o = {
          source: { x: source.x, y: source.y, depth: sD },
          target: { x: source.x, y: source.y, depth: tD }
        };
        return _that._diagonal(_that._reComputPath(o));
      })
      .remove(function (){});
  }


  _drawBackground () {
    let _that = this;
    let ops = this.ops;
    this.svg.selectAll('.node-wrap').remove();

    this.svg.selectAll('.node').insert('use', ':first-child')
      .attr('xlink:href', function (d) {
        if (_that.isRoot(d) && ops.mode === 'simple' && ops.flipRoot) {
          return '#node-wrap-simple';
        }
        // if (i === 0 && ops.mode === 'simple') return '#node-wrap-simple-first';
        return '#node-wrap';
      })
      .attr('class', 'node-wrap')
      .attr('stroke', this.ops.nodeBorderColor)
      .attr('stroke-width', (this.ops.nodeBorderWidth || 1))
      .attr('fill', this.ops.nodeBgColor)
      .attr('opacity', '1');
  }
  /**
   * 绘制节点详细内容
   * 
   */
  _drawDetail () {
    let _that = this,
      ops = this.ops,
      padding = ops.padding,
      borderW = ops.nodeBorderWidth,
      photoLeftGap = ops.photoLeftGap,
      groups = ops.groups;

    let allNode = this._allDataNodes,
      photoH = ops.photoHeight;

    allNode.selectAll('.groups').remove();
    if (!groups || !groups.length) return;
    if (photoLeftGap < 20) {
      photoLeftGap = 20;
    }
    // var photoIdx;
    if (ops.mode === 'simple') {
      this._simpleMode();
      return;
    }

    groups.forEach((v, i) => {

      if (v.key === 'photo') {
        _that._isTherePicture = true;
        let info = v.info;
        let tY = ((LINE_CENTER * i) + PHOTO_TOP_BOTTOM_GAP + borderW);
        if (photoLeftGap === 20 && i === 0) {
          tY = padding;
        }
        _that.sizeNum.push(tY);
        let gp = allNode.append('g')
          .attr('class', 'groups groups-' + i + ' groups-' + v.key)
          .attr('transform', 'translate('+ (padding + borderW) +', ' + tY + ')');
        
        _that._drawImage(gp, v);
        if (info && info.length) {
          _that._drawImageText(gp, info);
        }
      } else {
        let top = 0;
        let tY = LINE_CENTER * (i + 1) + borderW;
        let tX = (padding + borderW);
        if (_that._photoIndex !== null && i > _that._photoIndex && _that._isTherePicture) {
          // 上一行是图片， 本行需要把图片高度加进去， 并减一行文本高
          top = photoH + PHOTO_TOP_BOTTOM_GAP - LINE_CENTER + PHOTO_LINE_TEXT_OFFSET_TOP;
          if (_that._photoIndex === 0 && photoLeftGap === 20) {
            top -= PHOTO_LINE_TEXT_OFFSET_TOP * 2;
          }
          tY += top;
        }
        _that.sizeNum.push(tY);
        let node = allNode.append('g')
          .attr('class', 'groups groups-' + i + ' groups-' + v.key + ' ' + v.className)
          .attr('transform', 'translate(' + tX + ', ' + tY + ')');

        _that._drawSingleLineText(node, v);
      }
    });
  }
  /**
   * 绘制单行文本
   * 
   */
  _drawSingleLineText (node, v) {
    let _that = this,
        ops = this.ops,
        padding = ops.padding,
        opsLabelColor = ops.labelColor;

    let icon = v.icon,
        textAlign = v.textAlign,
        label = v.label,
        fontSize = v.fontSize || ops.fontSize,
        iconColor = v.iconColor,
        labelColor = v.labelColor || opsLabelColor;



    // 图标宽度
    let tx = ICON_WIDTH,
        span = null,
        size = { width: 0 },
        // 父级已经设置过间距， 这里需要减掉， 与图片对其
        labelLeft = 0;

    let detailTxt = function (box, n) {
      box
        .text(function (d) {
          let computedTxt = readMultiStageObject(d.data, v.key) || '无';
          if (computedTxt.length > 6) {
            computedTxt = realityTxt (computedTxt, parseInt(_that.ops.nodeWidth - n, 10), fontSize);
            return computedTxt;
          }
          return computedTxt;
        });
    };
    if (icon) {
      labelLeft = 18;
      node.append('use')
        .attr('xlink:href', function (d) {
          return typeof icon === 'function' ? icon.call(_that, d) : icon;
        })
        .attr('width', 14).attr('height', 14)
        .attr('x', 0).attr('y', -12)
        .attr('fill', function (d) {
          if (iconColor && typeof iconColor === 'function') {
            return iconColor.call(_that, d);
          }
          return iconColor;
        });
    } else {
      tx -= ICON_WIDTH;
    }

    if (label) {
      span = getTextWidth(v.label + ':', fontSize);
      size = span.getBoundingClientRect();
      span.parentNode.removeChild(span);
      // 文字宽度 加 间距/2(留一个空格)
      tx += size.width + padding / 2;
      node.append('text')
        .attr('text-anchor', 'start')
        .attr('fill', function (d) {
          return (typeof labelColor === 'function' ? labelColor.call(_that, d) : labelColor);
        })
        .attr('style', ('fill: '+ (typeof labelColor === 'function' ? labelColor(d) : labelColor) + '; font-size: ' + fontSize + 'px'))
        .attr('x', labelLeft)
        .text(function (d) {
          return (typeof v.label === 'function' ? v.label.call(_that, d) + ':' : v.label + ':');
        });
    }
    var txtNode = node.append('text')
      .attr('text-anchor', (!textAlign ? 'start' : textAlign))
      .attr('x', tx)
      .attr('style', 'font-size: ' + fontSize + 'px');

    detailTxt(txtNode, tx);
  }
  /**
   * 绘制图片行
   * 
   */
  _drawImage (node, v) {
    let _that = this,
        ops = this.ops,
        padding = ops.padding,
        photoLeftGap = ops.photoLeftGap;


        let photoW = ops.photoWidth,
      photoH = ops.photoHeight;


      // 图片左距离 = 图片间距 + 全局间距
    let photoLeft = photoLeftGap - padding;

    let photoBox = node.append('g')
      .attr('transform', 'translate('+ photoLeft +', 0)')
      .attr('class', 'phpto-box');

    photoBox.append('use').attr('class', 'null-photo')
      .attr('xlink:href', '#nullPhoto')
      .attr('width', photoW)
      .attr('height', photoH)
      .attr('fill', ops.nullPhotoColor)
      // .attr('x', 0)
      // .attr('y', 0)
      .attr('style', function (d, index) {
        var val = _that.getPhotoPath(d, index);
        return (val ? 'display: none;' : '');
      });

    photoBox.append('image')
      .attr('width', photoW)
      .attr('height', photoH)
      // .attr('x', 0)
      // .attr('y', 0)
      .attr('xlink:href', function (d, index) {
        var val = _that.getPhotoPath(d, index);
        return (val || '');
      })
      .attr('style', function (d, index) {
        var val = _that.getPhotoPath(d, index);
        return (!val ? 'display: none;' : '');
      })
      .attr('clip-path', 'url(#clip)');
  }
  /**
   * 绘制图片同一行文本
   * 
   */
  _drawImageText (node, info) {
    let _that = this, ops = this.ops, photoLeftGap = ops.photoLeftGap;
    // 图片的上下间距
    let photoTopBottomGap =  FLOAT_TOP * 3;
    let photoW = ops.photoWidth,
        photoH = ops.photoHeight;
    let photoLeft = photoLeftGap + photoW;

    info.forEach((val, index) => {
      // 与图片一行的文本, 左侧距离等于 图片left间距 + 图片 w, 在减去 padding, 因父级设置过 padding

      let x = photoLeft,
          // 与图片同行的文本向上偏移3
          y = LINE_CENTER * index + photoTopBottomGap - PHOTO_LINE_TEXT_OFFSET_TOP;
      if (photoH > 48) {
        y += FLOAT_TOP;
      }


      if (index === 0) {
        val.fontSize = 14;
      } else {
        val.fontSize = 12;
        if (index == 1) {
          y -= 5;
        } else if (index > 1) {
          y -= 14;
        }
      }

      // 图片同一行的文本
      var infoBox =  node.append('g').attr('class', 'photo-info')
            .attr('transform', 'translate('+ x +', ' + y + ')');

      _that._drawSingleLineText(infoBox, val);
    });
  }
  /**
   * 绘制最后一个分组, 比较特殊的分组
   */
  _drawLastGroup () {
    let _that = this,
        ops = this.ops,
        padding = ops.padding, photoLeftGap = ops.photoLeftGap;

    let lastGroupsColor = ops.lastGroupsColor;
    let lastGroups = ops.lastGroups;
    if (!lastGroups || !lastGroups.length) return;

    let groups = ops.groups, borderW = ops.nodeBorderWidth,
        lastGroupInnerLineColor = ops.lastGroupInnerLineColor,
        lastGroupInnerLineWidth = ops.lastGroupInnerLineWidth,
        _isTherePicture = this._isTherePicture,
        photoH = ops.photoHeight, nodeW = ops.nodeWidth;


    let allNode = this._allDataNodes;
    let computedBorderWidth = borderW / 2,
        lineLeft = computedBorderWidth,
        lineRight = nodeW - computedBorderWidth;

    let computedTop = padding;
    if (groups && groups.length) {
      computedTop += (groups.length * LINE_CENTER) + padding;
    }

    // 计算后的顶部距离, 文字下边的横线需要偏移点, 具体多少...? 偏移 10 
    // var computedTop = groups.length * LINE_CENTER + (groups && groups.length ? PHOTO_TOP_BOTTOM_GAP : 0);

    if (_isTherePicture) {
      computedTop += (photoH - FLOAT_TOP * 2);
    } else {
      computedTop -= PHOTO_LINE_TEXT_OFFSET_TOP;
    }


    if (!groups || !groups.length) {
      computedTop = 0;
    }


    if (photoLeftGap <= 20 && this._photoIndex === 0 && _isTherePicture) {
      computedTop -= padding;
    }


    _that.sizeNum.push(computedTop);
    let lastGroupNode = allNode.append('g')
        .attr('class', 'groups last-group')
        .attr('transform', 'translate(0, ' + computedTop + ')');

    if (groups.length) {
      lastGroupNode.append('line')
        .attr('x1', lineLeft).attr('y1', 0)
        .attr('x2', lineRight).attr('y2', 0)
        .attr('stroke', lastGroupInnerLineColor)
        .attr('stroke-width', lastGroupInnerLineWidth);
    }



    let colBox = lastGroupNode.append('g').attr('class', 'last-group-col-box' );


    lastGroups.forEach((v, i) => {
      let numColumn = colBox.append('g').attr('class', 'num-column');
      let txtColumn = colBox.append('g')
        .attr('class', 'txt-column')
        .attr('transform', 'translate(0, 24)');

      numColumn.append('text')
        .attr('text-anchor', 'middle')
        .append('textPath')
        .attr('xlink:href', '#three-column-path-' + i)
        .attr('startOffset', '50%')
        .attr('fill', lastGroupsColor[i])
        .text(function(d) {
          return readMultiStageObject(d.data, v.key) || '0';
        });

      txtColumn.append('text').attr('text-anchor', 'middle')
        .append('textPath')
        .attr('xlink:href', '#three-column-path-' + i)
        .attr('startOffset', '50%')
        .attr('fill', lastGroupsColor[i])
        .text(function() {

          return v.label;
        });

    });
  }

  _drawExpandButton () {
    let _that = this;
    let cls = 'collapse-expand', getCls = '.' + cls;
    let ops = this.ops;
    let btnW = 24, half = btnW / 2, bg = btnW + 1, bgHalf = bg / 2;
    let bgP = (btnW - bg) / 2;
    let _isVertical = this._isVertical;

    let nodeW = ops.nodeWidth, nodeH = ops.nodeHeight;
    // this._reComputNodeHeight();
    let translateX = _isVertical
      ?
        (nodeW / 2 - half)
      : 
        (nodeW - half),
      translateY = _isVertical
      ?
        (nodeH - half)
      :
        (nodeH / 2 - half);

    let gNode = this.svg.selectAll('g.node');
    gNode.selectAll(getCls).remove();

    let btn = gNode.append('g')
      // .attr('class', cls)
      .attr('transform', function (d) {

        if (_that.isRoot(d) && ops.mode === 'simple' && ops.flipRoot) {

          if (_isVertical) {
            return 'translate(' + (nodeH  / 2 - half) + ',' + (nodeW - half) + ')';
          }
          return 'translate(' + (nodeH - half) + ',' + (nodeW / 2 - half) + ')';
        }
        return 'translate(' + translateX + ',' + translateY + ')';
      })
      .attr('style', 'cursor: pointer;')
      .attr('class', function (d) {
        let hasChildren = _that.nodeHasChildren(d);

        return `${cls} button${hasChildren ? '' : ' disable'}`;
      });

    btn.append('rect')
      // .attr('xlink:href', '#opacityCircle')
      .attr('fill', '#fff')
      // .attr('fill-opacity', .8)
      .attr('rx', bgHalf)
      .attr('ry', bgHalf)
      .attr('x', bgP)
      .attr('y', bgP)
      .attr('width', bg)
      .attr('height', bg);

    btn.append('use')
      .attr('xlink:href', function (d) {
        return d.children ? '#icon-expand-' : '#icon-expand';
      })
      .attr('class', 'button-inner')
      .attr('width', btnW)
      .attr('height', btnW);
  }


  _drawButtons () {
    let ops = this.ops, 
        x = ops.nodeWidth - 25;
    let w = 20, h = 20, lineHeight = 25;
    let node = this.svg.selectAll('g.node');
    let arr = ops.otherButtons;
    // icon-department,
    // icon-company,
    // icon-position,
    // icon-expand,
    // icon-down-,
    // icon-expand-,
    // icon-down,
    // icon-summary
    let buttonWrap = node.select('.button-wrap'); 
    buttonWrap.remove();
    if (ops.mode === 'simple') {
      return;
    }
    buttonWrap = node.append('g')
      .attr('class', 'button-wrap')
      .attr('transform', 'translate(' + x + ', ' + 8 + ')');
  

    arr.forEach((v, i) => {
      let b =  buttonWrap.append('g')
        .attr('class', 'button ' + (v.className || '')).attr('transform', 'translate(0, ' + (i * lineHeight) +')')
        .attr('data-key', v.key);
      
      b.append('use')
        .attr('xlink:href', '#opacityRect')
        .attr('opacity', 0)
        .attr('width', w).attr('height', h);
        
      b.append('use')
        .attr('xlink:href', ('#' + v.iconId))
        .attr('class', (v + ' button-inner'))
        .attr('width', w).attr('height', h)
       
        .attr('fill', (v.buttonColor || ops.buttonColor));
    });
  }


  _drawZoomBar () {
    let _that = this;
    let ops = this.ops;
    let arrs = [
      '#icon-plus',
      '#icon-minus',
      '#icon-locate'
    ];
    let evts = [
      '_zoomIn',
      '_zoomOut',
      '_center'
    ];
    this.zoomBar = this.htmlNode.querySelector('.zoomBar');

    if (!this.zoomBar) {
      this.zoomBar = document.createElement('div');
      this.zoomBar.className = 'zoomBar';
    }
    this.zoomBar.style.background = ops.zoomBarBackground;
    var mp = [
        '<span class="btn" data-evt="_zoomIn">' +
          '<svg viewBox="0 0 20 20" width="20" height="20"><use xlink:href="#icon-plus" fill="#fff"></svg>' +
        '</span>',
        (ops.progress ? '<span class="progress-box"><span class="progress"></span></span>' : ''),
        '<span class="btn" data-evt="_center">'+
          '<svg viewBox="0 0 20 20" width="20" height="20"><use xlink:href="#icon-locate" fill="#fff"></svg>' +
        '</span>',
        '<span class="btn" data-evt="_zoomOut">'+
          '<svg viewBox="0 0 20 20" width="20" height="20"><use xlink:href="#icon-minus" fill="#fff"></svg>' +
        '</span>',
    ];
    this.zoomBar.innerHTML = mp.join('');
    this.htmlNode.appendChild(this.zoomBar);

    var dom = d3.select(_that.zoomBar).selectAll('.btn');
        
    dom.on('click', function () {
      d3.event.stopPropagation();
      d3.event.preventDefault();
      if (_that.isLock()) return;
      var k = this.getAttribute('data-evt');
      _that[k + 'Lock'] = true;
      _that[k](!0);
    });
  }


  _simpleMode () {
    let _that = this;
    let ops = this.ops,
        key = ops.simpleModeKey,
        fontSize = ops.fontSize;
    let { nodeWidth: oW, nodeHeight: oH, flipRoot, mode } = ops;

    // oW = ops.nodeWidth, oH = ops.nodeHeight, flipRoot = ops.flipRoot;

    let allNode = this._allDataNodes;
    let _isVertical = this._isVertical;
    let x = _isVertical ? oW / 2  : oH / 2 + FLOAT_TOP;
    let sz = _isVertical ? oH : oW;
    let isSimpleFlipRoot = (mode === 'simple' && flipRoot);
    allNode.selectAll('.button-wrap').remove(); 
    allNode.append('g')
      .attr('transform', function (d) {
        if (_that.isRoot(d) && isSimpleFlipRoot) {
          return _isVertical ? 'translate(' + x + ', 25)' : 'translate(20, ' + 20 + ')';
        }
        return _isVertical ? 'translate(' + x + ', 10)' : 'translate(10, ' + x + ')';
      })
      .attr('class', 'groups').append('text')
      .attr('writing-mode', function (d) {
        if (_that.isRoot(d) && isSimpleFlipRoot) {
          return _isVertical ? 'lr' : 'tb';
        }
        return _isVertical ? 'tb' : 'lr';
      })
      .text(function (d) {
        let computedTxt = readMultiStageObject(d.data, key) || '无';
        if (computedTxt.length > 10) {
          computedTxt = realityTxt (computedTxt, sz, fontSize);
          return computedTxt;
        }
        return computedTxt;
      }).attr('class', 'writing-mode-txt');

    if (isIE || isIE9 || isEdge || isIE11){
      allNode.selectAll('.writing-mode-txt')
        .attr('dx', '-.5em');
    } 
  }
 
  _moveToPth (x, y) {
    return `M${x} ${y}`;
  }
  _bezierCurveToPth (x1, y1, x2, y2, x, y) {
    return `C${x1} ${y1} ${x2} ${y2} ${x} ${y}`;
  }
  _lineToPth (x, y) {
    return `L${x} ${y}`;
  }
  // 曲线
  _bezierPath () {
    let _that = this, ops = this.ops;
    let { nodeWidth: nW, nodeHeight: nH, flipRoot } = ops;
    let _isVertical = this._isVertical;
    if (this.ops.levelRender) {
      this._diagonal = function (d) {

        let sourceX = d.source.x, 
            sourceY = d.source.y;
        let targetX = d.target.x,
            targetY = d.target.y;

        let m = this._moveToPth(sourceX, sourceY),
            c;

        c = this._bezierCurveToPth(targetX, sourceY + 10, targetX, sourceY + 20, targetX, targetY);

        return m+c;
      };
      return;
    }
    let cupX = (d) => {
      let sourceX = d.x;
      if (ops.mode === 'simple' && d.depth === 0 && flipRoot) {
        sourceX = nH / 2;
        if (!_isVertical) {
          sourceX = nH;
        }
      }
      return sourceX;
    };

    let cupY = (d) => {
      let sourceY = d.y;
      if (ops.mode === 'simple' && d.depth === 0 && flipRoot) {
        sourceY = nW;
        if (!_isVertical) {
          sourceY = nW / 2;
        }
      }
      return sourceY;
    };

    this._diagonal = this._isVertical
        ? d3.linkVertical()
          .x(function(d) { return cupX(d); })
          .y(function(d) { return cupY(d); })
        : d3.linkHorizontal()
          .x(function(d) { return cupY(d); })
          .y(function(d) { return cupX(d);});
  }


  // 直线
  _straightPath () {
    let _that = this, ops = this.ops;
    let { nodeWidth: nW, nodeHeight: nH, flipRoot } = ops;
    this._diagonal = function (d) {
      let sourceX = d.source.x, 
          sourceY = d.source.y;
      let targetX = d.target.x,
          targetY = d.target.y;

      if (ops.mode === 'simple' && d.source.depth === 0 && flipRoot) {
        sourceX = nH / 2;
        sourceY = nW;
      }

      let controllerY = sourceY + ((targetY - sourceY) / 2);
      // if (this.ops.levelRender) {

      //     let m = this._moveToPth(sourceX, sourceY);
  
      //     // c = this._bezierCurveToPth(targetX, sourceY + 10, targetX, sourceY + 20, targetX, targetY);
  
      //     return m +
      //       this._lineToPth(sourceX, sourceY + 20) +
      //       this._lineToPth(targetX, sourceY + 20) +
      //       this._lineToPth(targetX, targetY);
   
      // }
      if (!_that._isVertical) {

        sourceX = d.source.y, 
        sourceY = d.source.x;
        targetX = d.target.y,
        targetY = d.target.x;

        if (ops.mode === 'simple' && d.source.depth === 0 && flipRoot) {
          sourceX = nH;
          sourceY = nW / 2;
        }
        controllerY = sourceX + ((targetX - sourceX) / 2);
        if (this.ops.levelRender) {
          controllerY = targetX + 20;
        }
        return 'M' + sourceX + ' ' + sourceY +
               'L' + controllerY + ' ' + sourceY   +
               'L' + controllerY + ' ' + targetY +
               'L' + targetX + ' ' + targetY;
      }
      return this._moveToPth(sourceX,  sourceY) +
             this._lineToPth(sourceX, controllerY) +
             this._lineToPth(targetX, controllerY) +
             this._lineToPth(targetX, targetY);
    };
  }


  // 重新计算路径
  _reComputPath (d) {

    let _that = this; // , ops = this.ops;
    let target = d.target, source = d.source;
    let o = {
      target: {
        x: 0, y: 0
      },
      source: {
        x: 0, y: 0
      }
    };

    let booleanNum = +(this._isVertical);
    let mps = [
      {
        x: 'nodeHeight',
        y: 'nodeWidth'
      },
      {
        x: 'nodeWidth',
        y: 'nodeHeight'
      }
    ];
    let kx = mps[booleanNum].x, ky = mps[booleanNum].y;

    o.source.x = source.x + _that.ops[kx] / 2;
    o.target.x = target.x + _that.ops[kx] / 2;
    
    o.source.y = source.y + _that.ops[ky];
    o.target.y = target.y;

    o.source.depth = source.depth;
    o.target.depth = target.depth;

    return o;
  }
  // 计算节点高度
  _reComputNodeHeight () {
    let _that = this;
    this.sizeNum = [];
    let ops = this.ops, photoLeftGap = ops.photoLeftGap,
      groups = ops.groups,
      photoW = ops.photoWidth;

    let lastGroups = ops.lastGroups;

    this._isTherePicture = false;
    this._photoIndex = null;

    if (ops.mode == 'simple') {
      return;
    }
    // LINE_CENTER 单行高度
    // PHOTO_TOP_BOTTOM_GAP 图片商家间距
    if (ops.groups && ops.groups.length) {
      ops.groups.forEach((v, i) => {
        if (v.key === 'photo') {
          if (i === 0 && photoLeftGap < 20) {
            PHOTO_TOP_BOTTOM_GAP = 10;
          } else {
            PHOTO_TOP_BOTTOM_GAP = 15;
          };
          _that._photoIndex = i;
          _that._isTherePicture = true;
        }
      });
    }
    let h = 0;
    let isLastGroup = (lastGroups && lastGroups.length);
    let isGroup = (groups && groups.length);
    //  最后一组存在
    if (isLastGroup) {
      h = 60 ;
    }


    if (isGroup) {
      h += (groups.length * LINE_CENTER);
      if (this._isTherePicture) {
        h += PHOTO_TOP_BOTTOM_GAP + photoW;
      } else {
        h += LINE_CENTER;
      }
      if (!isLastGroup) {
        h -= FLOAT_TOP;
      }
    }
    if (!groups || !groups.length) {
      h += FLOAT_TOP;
    }
    if (this._isTherePicture && this._photoIndex === 0 && photoLeftGap <= 20) {
      h -= (PHOTO_LINE_TEXT_OFFSET_TOP * 2);
    }

    this.ops.nodeHeight = h;
    return h;
  }


  // 设置 node Size
  _reSetNodeSize () {
    this.tree.nodeSize(
      this._isVertical
        ?
          [
            this.ops.nodeWidth + this.ops.nodeGapWidth,
            this.ops.nodeHeight + this.ops.nodeGapWidth
          ]
        :
          [
            this.ops.nodeHeight + this.ops.nodeGapWidth,
            this.ops.nodeWidth + this.ops.nodeGapWidth,
          ]
    );
  }

  /**
   * 缩放
   * num 是从 _progressBar 调用的 num, 分别为 (+ | -).1
   */
  _zoom (num) {
    this._showDropdownMenu = false;
    let transform, _that = this;
    let scaleExtent = this.zoomListener.scaleExtent();
    let rt = function (ts) {
      let pos = [ts.x, ts.y];
      let scale = ts.k;
      _that._progressBar(scale);
      return 'translate(' + pos + ')scale(' + scale + ')';
    };
    if (num !== undefined) {
      transform = d3.zoomTransform(this.svg.node());
      let n = transform.k + num;
      if (n > 0 && n >= scaleExtent[1]) {
        transform.k = scaleExtent[1];
      } else if (n < 0 && n <= scaleExtent[0]) {
        transform.k = scaleExtent[0];
      } else {
        transform.k += num;
      }

      this.vis
        .transition()
        .attr('transform', rt(transform)).on('end', function () {
          _that[num > 0 ? '_zoomInLock' : '_zoomOutLock'] = false;
        });
    } else {
      transform = d3.event.transform;
      this.vis
        .attr('transform', rt(transform));
    } 
  }
  /**
   * _progressBar 的放大做小
   */
  _zoomIn () {
    this._zoom(.1);
  }
  _zoomOut () {
    this._zoom(-.1);
  }
  /**
   * 比例尺
   */
  _progressBar (n) {
    let ops = this.ops;

    if (ops.zoomBar && ops.progress) {
      let min = ops.canvasMin, max = ops.canvasMax;
      let calibration = 1 - (n <= 1 ? (n - min) / (1 - min) * .5 : (n - 1) / (max - 1) * .5 + .5);
      this.zoomBar.querySelector('.progress').style.top = calibration * 100 + '%';
    }
  }
  /**
   * 画布居中
   * 初始化时尽快的显示并定位不使用动画
   * 其他阶段的控制画布居中, 会有的动画, 让画面看起来更流程顺滑
   * 
   * type 为真会有动画效果
   */
  _center (type) {
    let _that = this;
    let t = d3.zoomTransform(this.svg.node());
    let size = this._allDataNodes 
          ? this._allDataNodes.node().getBoundingClientRect()
          : { width: this.ops.nodeWidth, height: this.ops.nodeHeight };
    let ops = this.ops,
        w = ops.canvasWidth,
        h = ops.canvasHeight,
        nodeW = size.width,
        nodeH = size.height;
    let center = (h - nodeH) / 2;
    let mode = ops.mode;
    let y = FLOAT_TOP;
    if (mode === 'simple') {
      center = (w - nodeH) / 2;
      if (!this._isVertical) {
        center = (h - nodeH) / 2;
      }
    }

    if (this._isVertical) {
      center = (w - nodeW) / 2;
      t.y = y;
      t.x = center;
      t.applyX(center);
    } else {
      t.y = center;
      t.applyY(center);
      t.x = y;
    }

    this.vis
      .transition()
      .duration(type ? ops.duration : 0)
      .attr('transform', t)
      .on('end', function () {
        if (type) { _that._centerLock = false; }
      });
  }

  /**
   * 移动画布
   * o = {x, y}
   */
  _translate (o) {
    let t = d3.zoomTransform(this.svg.node());
    let ops = this.ops;
    let _that = this;
    t.y = o.y;
    t.x = o.x;
    t.applyX(o.x);
    t.applyY(o.y);
    this._centerLock = true;
    this.vis
      .transition()
      .duration(ops.duration)
      .attr('transform', t)
      .on('end', function () {
        _that._centerLock = false; 
      });
  }

  /**
   * 初始化搜索
   * 创建搜索 dom, 事件绑定
   */
  _initSearch () {
    search.call(this);
  }

  /**
   * 浏览器的事件处理,  在冒泡过程中做一些逻辑处理
   * 点击文档的任意位置, 都要隐藏下拉菜单, 点击范围在下拉菜单内除外
   * 如果点击的是下拉菜单范围之外, 隐藏菜单, 并把选中的数据清空
   * 
   */
  _documentStopEventDefault = function () {
    let _that = this, ops = this.ops;

    let fn = function (e) {
      let event = e || d3.event;
      if (!_that.ops.dropDownMenu || _that._dropdownMenuContainer.contains(event.target))  return;
      /**
       * _that._showDropdownMenu 下拉菜单显示状态
       * 要隐藏掉, 并清空 _that._selectDataNode 的数据
       */
      if (_that._showDropdownMenu) {
        _that._dropDownLock = false;
        _that._showDropdownMenu = false;
        _that._selectDataNode = null;
      }
    };
    document.addEventListener('mousedown', fn);
    window.addEventListener('scroll', fn);
    this.svg.on('click', fn);
  }


  /**
   * 按钮事件的处理
   * 
   */
  _buttonEvent () {
    let _that = this;
    let node = this._allDataNodes;
    node.selectAll('.button')
      .on('click', function (selectNodeData) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        if (_that.isLock()) return;
        let d3Node = d3.select(this);
        let dataKey = d3Node.attr('data-key');
        if (dataKey === 'dropMenu') {
          _that._dropdownMenuEvent(this, selectNodeData);
        } else if (dataKey === 'detailInfo') {
          _that.selectedNodeForRoot(selectNodeData);
        }
      });
  }


  /**
   * 节点的事件, 不包括各个按钮的事件
   * 
   */
  _nodeEvent () {
    let _that = this;
    let node = this._allDataNodes;
    node
      .on('mousedown', function () {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        if (_that.isLock()) return;
        _that._draging = false;
        clickStart = (+new Date);
      })
      .on('mouseup', function () {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        if (_that.isLock()) return;
        _that._draging = false;
        clickEnd = (+new Date);
      })
      .on('click', function (d) {
        d3.event.stopPropagation();
        d3.event.preventDefault();
        if (_that.isLock()) return;
        _that._nodeClickLock = true;
        if (clickEnd - clickStart > clickTime) return;
        clickEnd = 0;
        clickStart = 0;
        _that._nodeClickHandle(this, d);
      });
  }


  /**
   * 收起展开按钮的点击事件
   *
   */
  _expandButtonEvent () {
    let _that = this;
    let ops = this.ops;
    let cb = ops.expand;
    let resHandle = function (d) {
      // 传递了回调
      var promiseCb = cb.call(_that, d.data);
      // 有返回值, 认为是异步
      if (promiseCb) {
        _that.callBackTryError('expand', promiseCb, '_expandLock');
        promiseCb.then(function (result) {
          if (result && result.data) {
            var newData = result.data;
            // js 对象或数组, 转换成适用程序结构的对象或数组
            // 传递什么类型的数据, 返回的也是相同类型
            // [] -> []
            // {} -> {}
            var data = _that.transformTreeData(d, newData);
            if (Array.isArray(data)) {
              data.forEach(function (v) {
                _that.collapseAll(v);
              });
              d._children = data;
              d.data.children = newData;
            } else {
              _that.collapseAll(data);
              d.data.children = [newData];
              d._children = [data];
            }
            _that._loadDataEventHandle(d);
          }
        }).catch(function (e) {
          _that._expandLock = false;
          throw e;
        });
        return;
      }
      _that._loadDataEventHandle(d);
    };
    this.vis.selectAll('.collapse-expand').on('click', function (d) {
      d3.event.stopPropagation();
      d3.event.preventDefault();

      // 控制下拉菜单显示隐藏的属性, 隐藏下拉
      _that._showDropdownMenu = false;
      
      if (!_that.nodeHasChildren(d)) return;
      if (_that.isLock()) return;
      /**
       * [_expandLock description]
       * @type {Boolean}
       * 点击展开时, _expandLock 设置为 true, 防止快速频繁的点击
       * 避免在展开的过程中, 展开动作还未结束, 又点击展开按钮
       * 展开结束, 重置为 false
       * 在 this.update 中结束后 设置为 false
       */
      _that._expandLock = true;
      if (cb) {
        if (d.data.hasChildren !== undefined) {
          if (!d.data.hasChildren) return;
          // 当前为展开状态, 执行收起
          // _that._loadDataEventHandle(d);
          resHandle(d);
          return;
        }

        if (d.children) {
          // 当前为展开状态, 执行收起
          _that._loadDataEventHandle(d);
          return;
        };
        resHandle(d);
      } else {
        // 业务层未传回调函数, 并且无 children 
        if ((!d._children || !d._children.length)  && (!d.children || !d.children.length)) {
          /**
           * 重置锁定属性
           * 单个属性直接赋值
           */
          _that._expandLock = false;
          return;
        }
        // 直接展开
        _that._loadDataEventHandle(d);
      }
    });
  }

  /**
   * 收起展开后对数据的处理
   * 
   */
  _loadDataEventHandle (d, noBack) {
    if (!d._children && !d.children) {
      this.status = '';
      return;
    }

    // 无 子节点
    // if(!d._children && !d.children) return;

    this.toggle(d);
    this.update(d).then(() => {}).catch(() => {});
    if (!d.children && noBack === undefined) {
      this.ops.collapse.call(this, d.data);
    }
    this.status = '';
  }

  /**
   * 自定义菜单事件处理
   * 
   */
  _dropdownMenuListEvent () {
    let _that = this;
    let ops = this.ops, dropDownMenu = ops.dropDownMenu;
    let dropMenuList;
    if (dropDownMenu && dropDownMenu.menuList) {
      dropMenuList = dropDownMenu.menuList;
    };
    let isArr = isArray(dropMenuList);
    let cb = _that.isCb('dropDownMenu');
    let dropMenuListContainer = this._dropMenuListContainer;
    let customRenderList = noop;

    if (dropDownMenu && dropMenuList && typeof dropMenuList === 'function') {
      dropMenuList = this._customRenderDropList(this._selectDataNode);
      isArr = isArray(dropMenuList);
    }


    /**
     * 事件代理
     * 冒泡下拉菜单容器
     * 
     */
    dropMenuListContainer.addEventListener('click', function (e) {
      e.preventDefault();
      if (_that.isLock()) return;
      let target = e.target;
      let selectData = _that._selectDataNode;
      let item = target;
      if (target.tagName === 'SPAN') {
        item = target.parentNode;
      }
      /**
       * cb 下拉菜单的回调函数
       * 下拉菜单项的要求下拉必须有回调, 需要业务层提供对业务处理的返回结果
       * 结构图本身不处理下拉菜单业务
       * @return {[type]}    [description]
       */
      if (cb && isArr && dropMenuList.length && selectData) {
        _that._dropDownLock = true;
        let promiseCb = cb.call(_that, item.dataset.key, selectData.data, item);
        if (promiseCb) {
          if (!promiseCb.then) {
            _that._showDropdownMenu = false;
            _that.callBackTryError(
              'dropDownMenu',
              promiseCb,
              '_dropDownLock'
            );
          }
          promiseCb.then(function (result) {
            let data = result ? result.data : {};
            let parent = selectData.parent;
            let newData, deleteIdx;
            _that._dropDownLock = false;
            _that._showDropdownMenu = false;
            if (result.data === null) {
              selectData.parent.children.find(function (v, i) {
                if (v === selectData) {
                  deleteIdx = i;
                  return;
                }
              });
              if (deleteIdx !== undefined) {
                selectData.parent.children.splice(deleteIdx, 1);
                if (!selectData.parent.children.length) {
                  selectData.parent.children = null;
                  selectData.parent._children = null;
                }
              }
              _that.update(selectData.parent);
              return;
            }
            if (selectData === _that._dataSource) {
              if (result.data === null) {
                _that._dataSource = d3.hierarchy({});
                _that.update();
                _that.clearData();
                return;
              }
              _that._dataSource = d3.hierarchy(data, function(d) { 
                return d.children || []; 
              });
              _that._dataSource.x0 = 0;
              _that._dataSource.y0 = 0;
              if (_that._dataSource.children) {
                _that._dataSource.children.forEach(function (d) {
                  _that.toggleAll(d);
                });
              }
              _that.update(parent);
              return;
            }
            newData = _that.transformTreeData(parent, data);
            
            let m = ['x', 'y', 'x0', 'y0'];
            m.forEach(function (v) {
              newData[v] = selectData[v];
            });
            if (selectData._children) {
              _that.collapse(newData);
            };
            let chd = (parent._children || parent.children);
            let idx;

            chd.find(function(v, i) {
              if (v === selectData) {
                idx = i;
                v = newData;
                chd.splice(i, 1, newData);
                return;
              }
            });
            _that.update(selectData);
           
          }).catch(function () {
            _that._dropDownLock = false;
            _that._showDropdownMenu = false;
          });
        } else {
          _that._dropDownLock = false;
          _that._showDropdownMenu = false;
        }
      } else {
        // 未确定是否需要在这里重置住属性
        this._dropDownLock = false;
        _that._dropDownLock = false;
        _that._showDropdownMenu = false;
      }
    });
  }


  /**
   * 菜单按钮的上下翻转以及菜单的显示隐藏
   * 
   */
  _dropdownMenuEvent (dom, selectNodeData) {
    let _that = this;
    let d3Node = d3.select(dom);
    let cls = d3Node.attr('class');
    let ops = this.ops;
    let activeNodesSelection = this.svg.selectAll('.button.active');
    let activeNodes = activeNodesSelection.nodes();
    let isActive = /\bactive\b/.test(cls);
    let cb = this.isCb('dropDownMenu');
    let customRenderList = noop;
    let dropDownMenu = ops.dropDownMenu;
    let menuList = dropDownMenu && dropDownMenu.menuList ? dropDownMenu.menuList: [];
    let isMenu = isArray(menuList);
    if (dropDownMenu && dropDownMenu.menuList && typeof dropDownMenu.menuList === 'function') {
      menuList = this._customRenderDropList(selectNodeData, true);
      isMenu = isArray(menuList);
    }
    // 菜单按钮的上下翻转以及菜单的显示隐藏
    if (cb && isMenu && menuList.length) {
      if (activeNodesSelection.empty()) {
          d3Node.attr('class', cls + ' active');
          this._showDropdownMenu = true;
          this._selectDataNode = selectNodeData;
      } else {
        if (isActive) {
          this._showDropdownMenu = false;
          this._selectDataNode = null;
        } else {
          cls = cls.replace(/active/g, '').replace(/\s+/g, ' ');
          d3Node.attr('class', cls + ' active');
          this._showDropdownMenu = true;
          this._selectDataNode = selectNodeData;
        }
      }

      this._dropdownMenuContainer.style.top = '0px';
      this._dropdownMenuContainer.style.left = '0px';
      this._dropdownMenuContainer.style.zIndex = '-1';

      let s = dom/*.parentNode.parentNode*/.getBoundingClientRect();
      let menuSize = _that._dropdownMenuContainer.getBoundingClientRect();
      let docSize = _that.htmlNode.getBoundingClientRect();
      let left = 0, top = 0;
      if (s.left < 0) {
        left  = 0;
      }
      if (s.top < 0) {
        top = 0;
      }
      if (s.left + s.width + menuSize.width > docSize.width) {
        left = docSize.width - s.width - menuSize.width;
      } else {
        left = s.left + s.width;
      }
      if (s.top + menuSize.height > docSize.height) {
        top = docSize.height - menuSize.height;
      } else {
        top = s.top;
      }
      _that._dropdownMenuContainer.style.left = left + 'px';
      _that._dropdownMenuContainer.style.top = top + 'px';
      _that._dropdownMenuContainer.style.zIndex = '';
    }
  }

  _customRenderDropList (selectNodeData, render) {
    let _that = this, ops = this.ops;
    let menuList = [];
    let customRenderList = ops.dropDownMenu.menuList;

      menuList = customRenderList(selectNodeData) || [];
      let isMenu = isArray(menuList);
      if (isMenu && menuList.length && render) {
        this._dropMenuListContainer.innerHTML = '';
        let menuItem = document.createElement('li');
        for (let i = 0, len = menuList.length; i < len; i++) {
          let cloneItem = menuItem.cloneNode(true);
          cloneItem.dataset.key = menuList[i].key;
          cloneItem.innerHTML = menuList[i].name;
          this._dropMenuListContainer.appendChild(cloneItem);
        }
      }
    
    return menuList;
  }

  /**
   * 节点的点击处理
   * 
   */
  _nodeClickHandle (node, d) {
    let _that = this, ops = this.ops;
    let selectNode = d3.select(node);
    let wrap = selectNode.select('.node-wrap');
    // 激活(选中)的节点
    let activeNode = _that.svg.selectAll('g.active');
    let activeNodeWrap = activeNode.selectAll('.node-wrap');

    let classStr = selectNode.attr('class');
    let cb = ops.selected;

    _that._showDropdownMenu = false;

    let isSelect = (/\bactive\b/.test(classStr));
    d3.event.stopPropagation();
    d3.event.preventDefault();
    if (isSelect) {
      selectNode.attr('class', classStr.replace('active', ''));
      wrap.attr('stroke', _that.ops.nodeBorderColor);

      _that._selectNode = null;
      _that._selectDataNode = null;
      _that._nodeClickLock = false;
      if (cb) {
        let promiseCb = cb.call(_that, d.data, false);
        if (promiseCb) {
          promiseCb.then(noop).catch(noop);
        }
      }
      return;
    };
    let cls = activeNode.empty() ? '' : activeNode.attr('class');
    // 清除所有(已选中)节点的 active 样式
    activeNode.attr('class', cls.replace('active', ''));
    activeNodeWrap
      .attr('stroke', _that.ops.nodeBorderColor);

    _that._selectNode = node;
    _that._selectDataNode = d;

    selectNode
      .attr('class', classStr + ' active');
    wrap.attr('stroke', _that.ops.nodeBorderActiveColor)
      .attr('stroke-width', (_that.ops.nodeBorderWidth || 1));

    if (cb) {
      let promiseCb = cb.call(_that, d, true);
      if (promiseCb) {
        _that.callBackTryError('selected', promiseCb, '_nodeClickLock');
        promiseCb.then(function () {
          _that._nodeClickLock = false;
        }).catch(function (e) {
          _that._nodeClickLock = false;
          // if (e) throw e;
        });
        return;
      }
      _that._nodeClickLock = false;
    } else {
      _that._nodeClickLock = false;
    }
  }

  /**
   * 拖拽的初始化
   * 
   */
  _dragInitial () {
    let _that = this;
    let node = this._allDataNodes;
    let dragHandle = d3.drag()
      .on('start', function (d, index, group) {

        d3.event.sourceEvent.stopPropagation();
        _that._nodeDragStart(this, d, index, group);
      })
      .on('drag', function (d, index, group) {
        /**
         * 某些操作处于锁定, 处于锁定状态时, 说明有数据交互, 或试图同步, 可能是异步, 停止
         * 判断是否锁定, 设置拖拽锁定状态必须在拖拽结束时
         * 因为拖拽需要连续性的操作, 在过程中锁定, 会终止拖拽程序
         * 并且拖拽过程中不会修改数据, 只会做视图上的相应
         */
        if (_that.isLock()) return;
        /**
         * 标记拖拽
         * 拖拽中, 只有通过拖拽执行的程序, 才能在 鼠标抬起时生效
         */
        _that._draging = true;

        _that._nodeDragIng(this, d, index, group);
      })
      .on('end', function (d, index, group) {
        clickEnd = (+new Date);
        /**
         * 某些操作处于锁定, 停止
         */
        if (_that.isLock()) return;
        /**
         * 拖拽标记, 在拖拽时做了标记
         * 在结束时, 判断是否经过拖拽, 只有经过拖拽才能执行
         */
        if (_that._draging) {
          _that._dragLock = true;
          _that._draging = false;
          _that._nodeDragEnd(this, d, index, group);
        } 
      });

    if (this.ops.openDrag) {
      node.call(dragHandle);
    }
  }
  _nodeDragStart (domNode, d) {
    // 拖拽, 碰撞的元素 idx
    // 转移的idx, 排序的 idx
    // 拖拽的节点信息, 以及目标节点, 旧的信息, 便于未发生变化复原
    
    this._oldDragObj = {
      // oldDragDom: domNode.cloneNode(true),
      oldDragNode_ParentData: extend(true, {}, d.parent),
      oldDragNode_CurrentData: extend(true, {}, d),
      // oldDragParentData: d.parent ? extend(true, {}, d.parent.data) : null,
      oldTargetNode_CurrentData: null,
      oldTargetNode_ParentData: null,
      // 拖拽元素绑定的数据
      // dragNodeData: d,
      // 拖拽元素
      // dragDomNode: domNode,
      isDragCurrentStatusExpand: !!d.children,

      // 目标元素
      targetNodeDom: null,
      // 目标元素绑定的数据
      targetDataNode: null,
      // 操作类型 (转移, 排序)
      actionType: '',
      // 转移的 dom idx 用于查找元素
      transferDomIdx: null,
      // 排序 dom idx
      sortDomIdx: null,
      // 方向, 排序在元素的左或右
      targetDir: ''
    };
  }


  _nodeDragIng (domNode, data, index, group) {
    if (data === this._dataSource) return;
    let _that = this,
        ops = this.ops,
        // nodeW = ops.nodeWidth,
        onlyKey = ops.onlyKey;


    clearTimeout(_that._moveTimer);
    
    let allDomNode = this.svg.selectAll('g.node');
    let allLink = this.svg.selectAll('path.link');
    let arrNodes = allDomNode.nodes();


    let dragNodeData = data;
    let dragLinkIds = [];
    let dragNodeIds = [];

    // 选中的元素放到最后, 保证所选dom节点显示在最前, 以免被遮盖
    if (domNode !== arrNodes[arrNodes.length - 1]) {
      allDomNode.sort(function(a) {
        if (a[onlyKey] != data[onlyKey]) {
          return -1;
        } else {
          return 1;
        }
      });
    }

    let getLinkIds = function (da) {
      let fd = da || dragNodeData;
      if (fd.children) {
        fd.children.forEach((v) => {
          if (v.children) {
            getLinkIds(v);
          }
          dragLinkIds.push(v[onlyKey]);
        });
        dragLinkIds.push(fd[onlyKey]);
      }
    };
    let getNodeIds = function (da) {
      let fd = da || dragNodeData;
      if (fd.children) {
        fd.children.forEach(function (v) {
          if (v.children) {
            getNodeIds(v);
          }
          if (v.parent && v.parent[onlyKey] === fd[onlyKey]) {
            dragNodeIds.push(v[onlyKey]);
          }
        });
      }
    };
    getLinkIds();
    getNodeIds();
    allLink.filter(function (dv) {
      if (dv.target[onlyKey] === dragNodeData[onlyKey]) return true;
      if (dragLinkIds.indexOf(dv.target[onlyKey]) > -1) {
        return true;
      }
      return false;
    }).remove();
    allDomNode.filter(function(dv) {
      if (dragNodeIds.indexOf(dv[onlyKey]) > -1) {
        return true;
      }
      return false;
    }).remove();

    var x0 = d3.event.dx, y0 = d3.event.dy;
    if (!this._isVertical) {
      x0 = d3.event.dy;
      y0 = d3.event.dx;
    }
    let pos = [];
    let ts = d3.zoomTransform(this.svg.node());
    // 原声 Root Size
    // let rootNodeSize = this.htmlNode.getBoundingClientRect();
    // 原声 svg Size
    let svgDomSize = this.svg.node().getBoundingClientRect();

    let autoMove = function (dir) {
      clearTimeout(_that.moveTimer);
      _that._moveTimer = setTimeout(function () {
        ts = d3.zoomTransform(_that.svg.node());
        if (dir === 'left') {
          ts.x = ts.applyX(2);
        } else if (dir === 'right') {
          ts.x = ts.applyX(-2);
        } else if (dir === 'top') {
          ts.y = ts.applyY(2);
        } else {
          ts.y = ts.applyY(-2);
        }
        _that.vis.attr('transform', ts);
        autoMove(dir);
      }, 0);
    };

    data.x0 += x0;
    data.y0 += y0;
    pos = [data.x0, data.y0];
    if (!this._isVertical) {
      pos = [data.y0, data.x0];
    }
    // var svgSize = this.svg.node().getBBox();


    let domNodeSize = domNode.getBoundingClientRect();

    // 变换后的 节点间距   
    let gapW = (ops.nodeGapWidth * ts.k);
    let nodeGapSumW = (domNodeSize.width + gapW),
        nodeGapSumH = (domNodeSize.height + gapW);



    let startPointX = (domNodeSize.x - svgDomSize.x);
    let startPointY = (domNodeSize.y - svgDomSize.y);

    if (startPointX <= gapW) {
      autoMove('left');
    }
    if (startPointX + nodeGapSumW >= svgDomSize.width) {
      autoMove('right');
    }
    if (startPointY <= gapW) {
      autoMove('top');
    }
    if (startPointY + nodeGapSumH >= svgDomSize.height) {
      autoMove('bottom');
    }

    this._collisionDetection(domNode, data, index, group);

    let transferDomIdx = this._oldDragObj.transferDomIdx;
    let sortDomIdx = this._oldDragObj.sortDomIdx;

    arrNodes.forEach(function (v) {
      d3.select(v)
        .attr('opacity', 1)
        .select('.node-wrap').attr('stroke-dasharray', 0);
    });
    this.sortBorder.attr('display', 'none');

    if (transferDomIdx !== null && transferDomIdx >= 0) {
      this._oldDragObj.actionType = 'transfer';
      this._transferOrSort(arrNodes[transferDomIdx], domNode);
    } else if (sortDomIdx !== null && sortDomIdx >= 0) {
      this._oldDragObj.actionType = 'sort';
      this._transferOrSort(arrNodes[sortDomIdx], domNode);
    } else {
      this._oldDragObj.actionType = '';
      this.sortBorder.attr('display', 'none');
    }

    d3.select(domNode)
      .attr('opacity', .5)
      .attr('transform', 'translate(' + pos + ')');
  }


  // 拖拽结束
  _nodeDragEnd (domNode, data) {
    let _that = this;
    if (data === this._dataSource) {
      this._dragLock = false;
      this._draging = false;
      return;
    }
    clearTimeout(_that._moveTimer);
    let obj = this._oldDragObj;
    let dragDomNode = d3.select(domNode);
    let dragNodeData = dragDomNode.data()[0];
    // 拖拽结束
    this._draging = false;
    d3.select(domNode).attr('opacity', 1);
    this.sortBorder.attr('display', 'none');

    // 目标节点 绑定的 data
    let targetDataNode = obj.targetDataNode,
        // 目标 dom 节点
        targetNodeDom = obj.targetNodeDom;

    let timer = null;
    let removeTargetActiveStatus = function () {
      d3.select(targetNodeDom)
        .attr('opacity', 1)
        .select('.node-wrap').attr('stroke-dasharray', 0);
    };
    clearTimeout(timer);

    // 目标节点为空是, 重绘拖拽节点
    // 
    if (!targetDataNode) {
      this._sortNodeErr(dragNodeData, '', null);
      return;
    }
    // 目标 与 拖拽节点的 parent
    let targetParent = targetDataNode.parent,
        dragParent = dragNodeData.parent;

    let targetSourceData = targetDataNode.data,
        dragSourceData = dragNodeData.data;
    if (dragParent === targetDataNode) {
      // removeTargetActiveStatus();
      // _that.update(dragParent);
      // return;
    }
    let idx = -1, dragIdx = -1;
    if (targetParent) {
      targetParent.children.find(function (v, i) {
        if (v === targetDataNode) {
          idx = i;
          return true;
        }
      });
    } else {
      idx = 0;
    }
    dragParent.children.find(function (v, i) {
      if (v === dragNodeData) {
        dragIdx = i;
        return true;
      }
    });
    let options = {
      targetData: targetSourceData,
      targetIdx: null,
      targetParent: targetParent ? targetParent.data : null,
      dragData: extend(true, {}, dragSourceData),
      dragIdx: dragIdx,
      dragParent: dragParent ? dragParent.data: null
    };
    /**
     * 鼠标抬起时, 程序会分析出三种动作类型
     * sort, transfer, none
     * 分别执行对应的程序
     */
    if (obj.actionType === 'sort') {
      // 在同一个父级下需要判断 所要插入的位置是否与拖拽元素的位置相同
      if (targetParent === dragParent && dragNodeData.depth === targetDataNode.depth) {
        let computeIdx = obj.targetDir === 'left' ? idx : idx + 1;
        if (computeIdx > dragIdx) {
          computeIdx -= 1;
        }
        if (dragIdx !== computeIdx) {
          options.targetIdx = computeIdx;
          this._sortAction(targetDataNode, dragNodeData, options);
          return;
        }
        _that._sortNodeErr(dragNodeData, '', null);
        return;
      } 
      _that._sortNodeErr(dragNodeData, '', null);
    } else if (obj.actionType === 'transfer') {
      _that._transferAction(targetDataNode, dragNodeData, options);
    } else {
      this._oldDragObj = {
        transferDomIdx: null,
        sortDomIdx: null
      };
      _that._sortNodeErr(dragNodeData, '', null);
    }
  }

  // 碰撞检测
  _collisionDetection (domNode, data) {
    let domNodeSize = domNode.getBoundingClientRect();
    let w = domNodeSize.width, h = domNodeSize.height;
    let o = {
      l: data.x0,
      t: data.y0,
      r: data.x0 + w,
      b: data.y0 + h
    };
    let dom = this._findNearest(o, w, h, domNode);
    return dom;
  }

  // 获取相交面积值
  _getDis (o1, o2, w, h) {
    let a = Math.abs(o1.l - o2.l);
    let b = Math.abs(o1.t - o2.t);

    let width = Math.abs(w - a);
    let height = Math.abs(h - b);
    return width * height;
  }


  /**
   * 查找最近的
   * 
   */
  _findNearest (obj, w, h, domNode) {
    let iMin = 0, transferIdx = null, sortIdx = null;
    let allDomNode = this.svg.selectAll('g.node');
    let arrNodes = allDomNode.nodes();
    for (let i = 0, len = arrNodes.length; i < len; i++) {
      if (arrNodes[i] === domNode) continue;
      let data = d3.select(arrNodes[i]).data()[0];
      let o = {
        l: data.x0,
        t: data.y0,
        r: data.x0 + w,
        b: data.y0 + h
      };
      if (cDetection(obj, o, w, h)) {
        let dis = this._getDis(obj, o, w, h);
        if (iMin < dis) {
          iMin = dis;
          if (dis > w * h / 2) {
            transferIdx = i;
            sortIdx = null;
          } else {
            transferIdx = null;
            sortIdx = i;
          }
        }
      }
    }
    this._oldDragObj.transferDomIdx = (transferIdx !== null && transferIdx >= 0)
      ? transferIdx
      : null;
    this._oldDragObj.sortDomIdx = (sortIdx !== null && sortIdx >= 0)
      ? sortIdx
      : null;
  }

  /**
   * 排序 或 转移的 类型标记
   * 
   */
  _transferOrSort (targetNode, domNode) {
    // section
    let d3TargetNode = d3.select(targetNode);
    let d3DragNode = d3.select(domNode);
    // data
    let targetDataNode = d3TargetNode.data()[0];
    let dataNode = d3DragNode.data()[0];
    let ops = this.ops, nodeWidth = ops.nodeWidth, nodeHeight = ops.nodeHeight;

    let targetDir = 'right';
    this._oldDragObj.targetNodeDom = targetNode;
    this._oldDragObj.oldTargetNode_CurrentData = extend(true, {}, targetDataNode);
    this._oldDragObj.oldTargetNode_ParentData = extend(true, {}, targetDataNode.parent);

    this._oldDragObj.targetDataNode = targetDataNode;

    if (this._oldDragObj.actionType === 'sort' && targetDataNode.depth === dataNode.depth) {
      // 活动节点 在 目标节点左半侧
      if (dataNode.x0 <= targetDataNode.x) {
        targetDir = 'left';
        // 拖拽节点处于目标节点左半侧, 则在目标节点的前一个节点后显示提示
        // 判断 目标节点之前的 节点 是否与 拖拽的节点相同
      } else {
        targetDir = 'right';
        // 拖拽节点 在 目标节点右半侧
        // 判断 目标节点之后的节点是否与 拖拽的节点相同
      }
      this._oldDragObj.targetDir = targetDir;
      let sX = targetDataNode.x;
      let sY = targetDataNode.y;
      // 垂直 left = top
      let nodeSize = this._isVertical ? nodeWidth : nodeHeight;
      if (targetDir === 'left') {

        sX = sX < 0 ? sX - (ops.nodeGapWidth / 2 + 2) : sX - (ops.nodeGapWidth / 2 + 2);
      } else {

        sX = sX < 0 ? sX + nodeSize + 2 : sX + nodeSize + 2;
      }

      let pos2 =[sX, sY];
      if (!this._isVertical) {
        pos2 =[pos2[1], pos2[0]];
      }
      if (targetDataNode.parent === d3.select(domNode).data()[0].parent) {
        this.sortBorder
          .attr('transform', 'translate(' + pos2 + ')')
          .attr('display', '');
      }
    } else if (this._oldDragObj.actionType === 'transfer') {
      this._oldDragObj.targetDir = '';
      d3TargetNode
        .select('.node-wrap').attr('stroke-dasharray', 4);
    } else {
      this._oldDragObj.targetDir = '';
    }
  }


  /**
   * 排序动作
   * 
   */
  _sortAction (targetDataNode,dragNodeData, options) {
    let _that = this;
    let fn = _that.isCb('sortNode');
    // 操作类型
    // 起始
    // 结束
    // 操作后的回调

    if (fn) { // 有回调, 需要走回调函数, 等待回调结果
      let isPreChange = _that.isPreChange('sortNode');
      if (isPreChange) {
        _that._sortNode(targetDataNode, dragNodeData, options);
      }
      let sortCallBack = fn.call(this, targetDataNode.data, dragNodeData.data, options);
      // 回调有返回值, 认为是异步操作, 等待异步完成
      // 无返回值 ?  要在数据操作完成后调用回调, 并且在 isPreChange false 时
      if (sortCallBack) {
        _that.callBackTryError(
          'sortNode',
          sortCallBack,
          null,
          function () {
            _that._sortNodeErr(dragNodeData);
        });
        sortCallBack.then(function () {
          if (!isPreChange) {
            _that._sortNode(targetDataNode, dragNodeData, options);
          }
        })
        .catch(function (e) {
          _that._sortNodeErr(dragNodeData, e);
        });
        return;
      }
    } else {  // 无回调, 直接排序, 无需其他逻辑
      _that._sortNode(targetDataNode, dragNodeData, options);
    }
  }

  /**
   * 排序数据以及节点处理
   * 
   */
  _sortNode (targetDataNode,dragNodeData, options) {
    let _that = this;
    return new Promise(function (resolve) {

      // 目标 与 拖拽节点的 parent
      let targetParent = targetDataNode.parent,
          dragParent = dragNodeData.parent;

      

      let dragIdx = options.dragIdx, computeIdx = options.targetIdx;

      dragParent.data.children.splice(dragIdx, 1); // 删除
      targetParent.data.children.splice(computeIdx, 0, options.dragData); // 添加
      (dragParent.children || dragParent._children).splice(dragIdx, 1);
      (targetParent.children || targetParent._children).splice(computeIdx, 0, dragNodeData);
      
      let old_Children = dragNodeData.children;
      if (old_Children) {
        _that.toggle(dragNodeData);
      }
      _that.update(targetParent).then(function () {
        if (old_Children) {
          _that.toggle(dragNodeData);
          d3.transition().duration(_that.ops.duration).on('end', function () {
            _that.update(dragNodeData);
          });
        }
        resolve();
      });
    });
  }

  // 排序失败的后退, 或 无动作的重置, 重置节点
  _sortNodeErr (dragNodeData, message, action) {
    let _that = this;
    let old, _chd, chd, data;

    if (action !== null) {
      old = _that._oldDragObj.oldDragNode_ParentData;
      _chd = old._children;
      chd = old.children;
      data = old.data;

      dragNodeData.parent._children = _chd;
      dragNodeData.parent.children = chd;
      dragNodeData.parent.data = data;
    }
    let old_Children = dragNodeData.children;
    if (old_Children) {
      this.toggle(dragNodeData);
    }
    this.update(dragNodeData).then(function () {
      if (old_Children) {
        _that.toggle(dragNodeData);
        d3.transition().duration(_that.ops.duration).on('end', function () {
          _that.update(dragNodeData);
        });
      }
    });
  }

  /**
   * 转移动作处理
   * 
   */
  _transferAction (targetDataNode,dragNodeData, options) {
    let _that = this;
    let fn = this.isCb('transferNode');
    let ops = this.ops, _oldDragObj = this._oldDragObj;
    let isPreChange;
    let _old_A = _oldDragObj.oldDragNode_CurrentData,
        _old_B = _oldDragObj.oldTargetNode_CurrentData;
    
    let _old_A_P = _oldDragObj.oldDragNode_ParentData || _old_A,
        _old_B_P = _oldDragObj.oldTargetNode_ParentData || _old_B;

    let cloneTarget = extend(true, {}, _old_B.data),
        cloneDrag = extend(true, {}, _old_A.data);

    let parentA = _old_A.parent || _old_A,
        parentB = _old_B.parent || _old_B;

    let parentA_data = !_old_A.parent ? _old_A.data : parentA.data,
        parentB_data = !_old_B.parent ? _old_B.data : parentB.data;

    let a_pt_ch = parentA_data.children,
        b_pt_ch = parentB_data.children;

    let bPtChd = (parentB.children || parentB._children);
    let aPtPch = (parentA._children || parentA.children);
    let m = [
      'x',
      'x0',
      'y',
      'y0',
      '_children'
    ];
    bPtChd.forEach(function (v, i) {
      if (v === targetDataNode) {
        options.targetIdx = i;
      }
    });
    let dataNodeHandle = function () {

      let transferCallback = fn.call(this, cloneTarget, cloneDrag, options);
      if (transferCallback) {
        _that.callBackTryError(
          'transferNode',
          transferCallback,
          null,
          function () {
            _that._transferNodeErr(targetDataNode, dragNodeData);
        });
        transferCallback.then(function (result) {
          try {
            // A 拖拽节点, B 目标节点
            let A, B, aNewData, bNewData;
            if (result) {
              B = result.B;
              A = result.A;
            }
            // 节点 children 数组变化后之前保留的 index 不准确, 需要从
            // old 中取回原来的数据后在做修改
            let _old_A_P_CHI = (_old_A_P._children || _old_A_P.children),
                _old_A_P_DATA = _old_A_P.data;
            if (A) { // A 为假则删除, 否则更新A
              aNewData = _that.transformTreeData(parentA, A);
              if (!_that._oldDragObj.oldDragNode_ParentData._children) {
                _that.toggle(aNewData);
              }
              
              _old_A_P_CHI.forEach(function (v, i) {
                if (i === options.dragIdx) {
                   aPtPch.splice(i, 1, aNewData);
                   a_pt_ch.splice(i, 1, A);
                } else {
                  aPtPch.splice(i, 1, v);
                  a_pt_ch.splice(i, 1, _old_A_P_DATA.children[i]);
                }
              });
            } else {
              _old_A_P_CHI.forEach(function (v, i) {
                aPtPch[i] = v;
                a_pt_ch[i] = _old_A_P_DATA.children[i];
              });
             
              aPtPch.splice(options.dragIdx, 1);
              a_pt_ch.splice(options.dragIdx, 1);
            
            }
           
            /**
             * 操作分析:
             *   转移, 复制到, 并转
             * 节点:
             *   目标节点 (target)
             *   拖拽节点 (drag)
             */


            /**
             * 具体操作:
             *   转移:  
             *     A to B
             *     A to B.children
             *     A.parent.children remove A
             *     
             *     drag.parent.children remove drag
             *     target.children push drag
             *
             *     return A B;
             *   复制到:
             *     A to B
             *     A+
             *     A+ to B.children
             *     
             *     drag to target.children
             *
             *     return A B;
             *   并转:
             */
              _that.update(dragNodeData).then(function () {
                if (B) {
                  bNewData = _that.transformTreeData(parentB, B);
                  m.forEach(function (v) {
                    bNewData[v] = targetDataNode[v];
                  });
                  _that.toggleAll(bNewData);
                  if (targetDataNode.children) {
                    _that.toggle(bNewData);
                  }
                  _that._oldDragObj.targetNodeDom.__data__.data = B;
                  targetDataNode.parent.children.splice(options.targetIdx, 1, bNewData);
                }
                _that.update(bNewData);
              });
          } catch (e) {
            console.log(e);
          };
        })
        .catch(function (e) {
          _that._transferNodeErr(targetDataNode, dragNodeData, options);
        });
      }
    };
    // var rawA = extend(true, {}, dragNodeData.parent.data);
    // 有回调, 需要走回调函数, 等待回调结果
    if (fn) {
      isPreChange = this.isPreChange('transferNode');
      if (isPreChange) {
        this._transferNode(targetDataNode, dragNodeData, options, function () {
          dataNodeHandle();
        });
        return;
      }
      dataNodeHandle();
    } else {  // 无回调, 无需其他逻辑
      _that._transferNode(targetDataNode, dragNodeData, options);
    }
  }

  /**
   * 转移的数据与节点处理
   * 
   */
  _transferNode (targetDataNode,dragNodeData, options, cb) {
    let _that = this;
    let dragIdx = options.dragIdx;
    // 目标 与 拖拽节点的 parent
    let dragParent = dragNodeData.parent;
    let targetParent = targetDataNode.parent;

    let _oldDragObj = _that._oldDragObj;
    // try {
   
    // 转移动作, 当目标节点 是 拖拽节点父级, 不需要做数据的处理
    // 保持原样
    if (targetDataNode !== dragParent) {
      // 删除, 从父节点的children中删除自己
      dragParent.data.children.splice(dragIdx, 1);
      // (dragParent.children || dragParent._children).splice(dragIdx, 1);
      if (dragParent.children) {
        if (dragParent.children.length === 1) {
          dragParent.children = null;
        } else {
          dragParent.children.splice(dragIdx, 1);
        }
      } else if (dragParent._children) {
        if (dragParent._children.length === 1) {
          dragParent._children = null;
        } else {
          dragParent._children.splice(dragIdx, 1);
        }
      }
      // 目标节点的 data
      if (targetDataNode.data.children) {
        targetDataNode.data.children.push(dragNodeData.data);
      } else {
        targetDataNode.data.children = [dragNodeData.data];
      }
      // var newDataType = dragNodeData.children ? 'expand' : 'collapse';


      dragNodeData.parent = targetDataNode;
      dragNodeData.depth = targetDataNode.depth + 1;

      this.deepChildrenDepth(dragNodeData, dragNodeData);

      // 目标节点的 children
      if (targetDataNode.children) {
        targetDataNode.children.push(dragNodeData);
      } else if (targetDataNode._children) {
        targetDataNode._children.push(dragNodeData);
      } else {
        targetDataNode.children = null;
        targetDataNode._children = [dragNodeData];
      }
    }
    return this.update(targetDataNode).then(function () {
      if (_that._oldDragObj.targetNodeDom) {
        d3.select(_that._oldDragObj.targetNodeDom)
          .attr('opacity', 1)
          .select('.node-wrap').attr('stroke-dasharray', 0);
      }
      cb&&cb();
    });
  }


  /**
   * 转移失败的后退, 或 标记动作类型为转移, 数据节点的重置
   * 
   */
  _transferNodeErr (targetDataNode, dragNodeData) {
    let _that = this;
    let obj = this._oldDragObj;
    let cur = obj.oldDragNode_CurrentData,
        curParent = obj.oldDragNode_ParentData,
        target = obj.oldTargetNode_CurrentData;
        // ,targetParent = obj.oldTargetNode_ParentData;


    let cur___$parent = cur.parent,
        cur___$depth = cur.depth,

        curParent___$_chd = curParent._children,
        curParent___$chd = curParent.children,
        curParent___$data = curParent.data,

        target___$_chd = target._children,
        target___$chd = target.children,
        target___$data = target.data;

      dragNodeData.parent = cur___$parent;
      dragNodeData.depth = cur___$depth;

      dragNodeData.parent._children = curParent___$_chd;
      dragNodeData.parent.children = curParent___$chd;
      dragNodeData.parent.data = curParent___$data;

      dragNodeData = this.deepChildrenDepth(dragNodeData, dragNodeData);

      targetDataNode._children = target___$_chd;
      targetDataNode.children = target___$chd;
      targetDataNode.data = target___$data;

      let old_Children = dragNodeData.children;


      if (old_Children) {
        _that.toggle(dragNodeData);
      }

      _that.update(dragNodeData.parent).then(function () {
        if (_that._oldDragObj.targetNodeDom) {
          d3.select(_that._oldDragObj.targetNodeDom)
            .attr('opacity', 1)
            .select('.node-wrap').attr('stroke-dasharray', 0);      
        }
        if (old_Children) {
          d3.transition().duration(_that.ops.duration).on('end', function () {
            _that.toggle(dragNodeData);
             _that.update(dragNodeData);
          });
        }
      });
  }

  _transitionEnd (cb) {
    let _that = this;
    let ops = this.ops;
    // let { _isInitialUpdate } = this;
    let { olDuration, defaultZoom } = ops;
    clearTimeout(this._setTimeouter);
    /**
     * [_expandLock description]
     * @type {Boolean}
     * 点击展开时, _expandLock 设置为 true, 防止快速频繁的点击
     * 避免在展开的过程中, 展开动作还未结束, 又点击展开按钮
     * 展开结束, 重置为 false
     */
    // _that._expandLock = false;
    /**
     * [_dragLock description]
     * @type {Boolean}
     * 拖拽, 或者改数有修改据时 _dragLock 设置为 true
     * 以避免频繁重复的操作
     */
    // _that._dragLock = false;
    // 是否初始化进入的 update
    this._setTimeouter = setTimeout(function () {
      _that.resetLock();
      /**
       * 是否从初始化进入的 update, 可以通过这个变量来判断是否需要向下执行
       * 在其他地方执行 update, 
       */
      if (_that._isInitialUpdate/* || _that.isViewChange*/) {
        _that._isInitialUpdate = false;
        _that.ops.duration = olDuration;
        _that._center();
        _that.zoomListener.duration(_that.ops.duration).scaleBy(_that.svg, defaultZoom);
        let transform = d3.zoomTransform(_that.svg.node());
        let k = transform.k;
        _that._progressBar(k);
        // _that.svg.selectAll('.node').sort(function (a, b) {return b  a})
      }
      cb&&cb();
    }, this.ops.duration);
  }
  /**
   * 显示下拉菜单
   * 
   */
  _showDropMenu (){
    this._dropdownMenuContainer.style.display = 'block';
  }
  /**
   * 隐藏下拉菜单
   * 
   */
  _hideDropMenu (){
    this._dropdownMenuContainer.style.display = 'none';
  }
  /**
   * svg dom元素的转换, 在导出时使用
   * @return {[type]} [description]
   */
  transformSvg () {
    // 源 svg 第一个 g
    // var sourceSvgGNode = sourceSvgNode.getElementsByTagName('g')[0];
    // clone node
    let cloneSvg = this.svg.node().cloneNode(true);
    let cloneG = cloneSvg.getElementsByTagName('g')[0];

    let bbx = this.vis.node().getBBox();

    let minX = 0;
    let tmp = [];
    this._allDataNodes.each(function (v) {
      tmp.push((v.x));
    });
    minX = Math.min.apply(Math, tmp);
    // 上下左右边距 20
    let pos = [(Math.abs(minX)  + 20), 20];
    if (!this._isVertical) {
      pos = [20, (Math.abs(minX) + 20)];
    }

    let translateStr = 'translate(' + pos + ')scale(1)';
    
    cloneSvg.setAttribute('viewBox', '0 0 ' + (bbx.width + 40) + ' '+(bbx.height + 40));
    cloneSvg.setAttribute('width', bbx.width + 40);
    cloneSvg.setAttribute('height', bbx.height + 40);

    cloneG.setAttribute('transform', translateStr);

    return cloneSvg;
  }
  /**
   * 数据转换, 原声对象或数组 转换成tree相同结构的数据
   * 
   */
  transformTreeData (node, newData) {
    let chd;

    if (isArray(newData)) {
      chd = d3.hierarchy({ children: newData }, function (d) { return d.children || []; });
      chd = this.deepChildrenDepth(node, chd);

      chd.children = this.deepChildrenParent(node, chd.children);
      return chd.children;
    }
    if (isObject(newData)) {
      chd = d3.hierarchy(newData);
      // chd.parent = treeDataItem;
      chd.depth = (node.depth + 1);
      // 处理所有后代节点 depth
      if (newData.children) {
        chd = this.deepChildrenDepth(chd, chd);
      }
    }
    chd = this.deepChildrenParent(node, chd);
    return chd;
  }
  // 深度处理节点的 depth
  deepChildrenDepth (node, d) {
    let key = d.children ? 'children' : '_children';
    let arr = d[key];
    let startNum = node.depth + 1;
    if (arr) {
      for (let i = 0, len = arr.length; i < len; i++) {
        arr[i].depth = startNum;
        if (arr[i][key]) {
          // arr[i].depth = startNum;
          this.deepChildrenDepth(arr[i], arr[i]);
        } 
        // else {
        //   arr[i].depth = startNum;
        // }
      }
    }
    return d;
  }
  // 深度处理节点 父级指向
  deepChildrenParent (parent, d) {
    if (isArray(d)) {
      d.forEach(function (v) {
        v.parent = parent;
      });
    }
    if (isObject(d)) {
      d.parent = parent;
    }
    return d;
  }
  // 切换
  toggleAll (d) {
    let _that = this;
    if (d.children) {
      d.children.forEach(function (dd) {
        _that.toggleAll(dd);
      });
      this.toggle(d);
    }
    return d;
  }

  /**
   * 切换
   * 
   */
  toggle (d) {
    if (d.children) {
      this.status = 'collapse';
      d._children = d.children;
      d.children = null;
    } else {
      this.status = 'expand';
      d.children = d._children;
      d._children = null;
    }
    this.status = '';
    return d;
  }
  collapseAll (d) {
    let _that = this;
    if (d.children) {
      d.children.forEach(function (dd) {
        _that.collapseAll(dd);
      });
      this.collapse(d);
    }
    return d;
  }
  /**
   * 收起
   * 
   */
  collapse (d) {
    let _that = this;
    if (d.children && d.children.length != 0) {
      d._children = d.children;
      d._children.forEach(function (dd) {_that.collapse(dd);});
      d.children = null;
    }
    return d;
  }
  /**
   * 展开
   * 
   */
  expand (d) {
    let _that = this;
    if (d._children) {
      d.children = d._children;
      d.children.forEach(function (dd) {_that.expand(dd);});
      d._children = null;
    }
  }
  // 指定展开层级, 展开所有性能太差
  expandAll (d, n) {
    let _that = this, ops = this.ops;
    if (arguments.length && n === undefined && !isObject(d)) {
      n = d;
      d = this._dataSource;
    }
    if (!arguments.length) {
      d = this._dataSource;
      n = ops.defaultExpandLevel;
    }
    n = n <= 1 ? 2 : n;
    
    let defaultExpandLevel = n - 1;
    let _dataSource = this._dataSource;
    if (n === 0 && ops.expandAll) {
      let cb = ops.expandAll.call(this);
      _that.callBackTryError(
        'expandAll',
        cb,
        null
      );
      cb.then(function (result) {
        if (!isObject(result) || !isObject(result.data) ) return;
        ops.root = result.data;
        _that._dataSource = d3.hierarchy(ops.root, function(d) { 
          return d.children || []; 
        });
        _that._dataSource.x0 = 0;
        _that._dataSource.y0 = 0;
        _that._isInitialUpdate = true;
        _that.start();
      });
      return;
    }
    let show = function (data) {
      if (!data) return;
      if (isArray(data)) {
        data.forEach(function (dd) {
          show(dd);
        });
        return;
      }
      data = data || _dataSource;
      if (!data.parent) {
        show(data.children);
        return;
      }
      let chd = data._children;
      if (data.depth < defaultExpandLevel && chd) {
        _that.toggle(data);
        show(chd);
        if (data.parent.children || data.children) return;
        _that._loadDataEventHandle(data.parent, true);
      }
    };
    show(d);
  }

  expandLocalAll() {
    let d = this._dataSource;
    let t = null;
    clearTimeout(t);
    let show = (d) => {
      clearTimeout(t);
      if (d._children) {
        raf(() => {
          d.children = d._children;

          this.update(d).then(() => {
            d.children.forEach(function (dd) {show(dd);});
            d._children = null;
          });
         
        });
      }
    };
    if (d.children) {
      d.children.forEach(function (dd) {
        raf(() => {
          show(dd);
        });
      });
      return;
    }
    show(d);
  }
  selectedForBack (id) {
    if (this.isLock()) return;
    let _that = this, ops = this.ops, onlyKey = ops.onlyKey;
    let idx, 
        len = this._selectForRootHistory.length,
        data;
    if (id !== undefined) {
      data = this._selectForRootHistory.find(function (v, i) {
        if (v[onlyKey] === id) {
          idx = i;
          return v;
        }
      });
      if (data && idx !== undefined) {
        this._selectForRootHistory.splice(idx, len - 1);
      }
    } else {
      data = this._selectForRootHistory.pop();
    }
    if (data) {
      this.selectedNodeForRoot(data.data, true);
    }
  }
  /**
   * 选择节点为根
   * 
   */
  selectedNodeForRoot (data, type) {
    let _that = this, ops = this.ops;
    if (data === this._dataSource) {
      return;
    };
    this._foRootLock = true;
    // 前进
    if (!type) {
      this._selectForRootHistory.push({
        key: data[ops.onlyKey || 'id'],
        data: this._dataSource
      });
    }

    let cb = ops.selectedNodeForRoot;
    let toggleChildren = function () {
      if (_that._dataSource.data.children) {
        d3.transition().duration(_that.ops.duration).on('end', function () {
          _that.toggle(_that._dataSource);
          _that.update(_that._dataSource);
        });
      }
    };
    this._dataSource = d3.hierarchy(data.data, function(d) { 
      return d.children || []; 
    });
    this._dataSource.x0 = 0;
    this._dataSource.y0 = 0;
    this.collapseAll(this._dataSource);
    this._isInitialUpdate = true;
    this._selectDataNode = null;
    this._selectNode = null;

    this.update(this._dataSource).then(function () {
      let promiseCb;
      if (cb) {
        promiseCb = cb.call(_that, data.data);
        // 如果返回的是 promise 对象, 则认为发起了异步请求
        // 加载当前节点的 children
        if (promiseCb) {
          _that.callBackTryError('selectedNodeForRoot', 
            promiseCb,
            '_foRootLock'
            /*,
              function () {
                // _that._sortNodeErr(dragNodeData);
            }*/
          );
          promiseCb.then(function (result) {
            if (!result || !result.data) {
              return;
            };
            let newData = result.data;
            let d = _that._dataSource;
            // js 对象或数组, 转换成适用程序结构的对象或数组
            // 传递什么类型的数据, 返回的也是相同类型
            // [] -> []
            // {} -> {}
            let data = _that.transformTreeData(d, newData);
            if (Array.isArray(data)) {
              data.forEach(function (v) {
                _that.collapseAll(v);
              });
              d._children = data;
              d.data.children = newData;
            } else {
              _that.collapseAll(data);
              d.data.children = [newData];
              d._children = [data];
            }
            d3.transition().duration(_that.ops.duration)
              .on('end', function () {
                _that._loadDataEventHandle(d);
            });
          }).catch(function (e) {
            _that._foRootLock = false;
            if (e) {
              throw e;
            }
          });
        } else {
          toggleChildren();
        }
        return;
      }
      toggleChildren();
    });
  }
  // 获取图片的 src
  getPhotoPath (d) {
    var _that = this, ops = this.ops;

    var val = readMultiStageObject(d.data, _that.ops.photoKeyName || 'photo');
    if (val && _that.ops.customRenderPhoto 
      && typeof _that.ops.customRenderPhoto === 'function') {
      val = _that.ops.customRenderPhoto.call(_that, d.data, val);
    }
    return (val || '');
  }
  // 转b64
  getB64 (cb) {
    var ops = this.ops;
    var cloneSvg = this.transformSvg(this.svg.node());
    var result = svgAsDataUri(cloneSvg, {
      backgroundColor: ops.canvasBackground
    });
    if (cb && typeof cb === 'function') {
      return result.then(cb);
    }
    return result;
  }
  getHtml (cb) {
    var ops = this.ops;
    var result = this.getB64();
    if (cb && typeof cb === 'function') {
      result.then(function (uri) {
        cb(b64DecodeUnicode(uri.slice(26)));
      });
    }
    return result;
  }

  // 重绘
  reDraw_all (isCenter) {
    this._isVertical = (this.ops.direction === 'vertical');

    if (this.ops.lineType === 'bezier' || this.ops.lineType === 'straight') {
      this['_' + this.ops.lineType + 'Path']();
    } else {
      this._bezierPath();
    }
    this._reComputNodeHeight();
    this._reSetNodeSize();
    this._defsTemplateSizeChange();
    this.update(this._dataSource).then(() => {
      if (isCenter) this._center(1);
    });
  }
  reDraw_dropmenu (newValue) {
    if (this.ops.isReadOnly || !this.ops.dropDownMenu) return;
    if (newValue) {
      if (this.isCb('dropDownMenu')) {
        this._showDropMenu();
      }
    } else {
      this._hideDropMenu();
      this.svg.selectAll('.button.active')
        .attr('class', 'button');
    }
  }
  reDraw_canvasWidth () {
    let ops = this.ops;
    this.svg//.attr('class', 'organiztion')
      .attr('width', ops.canvasWidth)
      .attr('height', ops.canvasHeight)
      .attr('style', 'background:'+ ops.canvasBackground)
      .attr(
        'viewBox',
        '0 0 '+ ops.canvasWidth +' '+ ops.canvasHeight
      );
    this._isInitialUpdate = true;
    this.update(this._dataSource);
  }
  reDraw_canvasHeight () {
    let ops = this.ops; 
    this.svg.attr('class', 'organiztion')
      .attr('width', ops.canvasWidth)
      .attr('height', ops.canvasHeight)
      .attr('style', 'background:'+ ops.canvasBackground)
      .attr(
        'viewBox',
        '0 0 '+ ops.canvasWidth +' '+ ops.canvasHeight
      );
    this._isInitialUpdate = true;
    this.update(this._dataSource);
  }
  reDraw_canvas () {
    let ops = this.ops; 
    this.svg.attr('class', 'organiztion')
      .attr('width', ops.canvasWidth)
      .attr('height', ops.canvasHeight)
      .attr('style', 'background:'+ ops.canvasBackground)
      .attr(
        'viewBox',
        '0 0 '+ ops.canvasWidth +' '+ ops.canvasHeight
      );
    this._isInitialUpdate = true;
    this.update(this._dataSource);
  }
  reDraw_lineType (newValue) {
    if (newValue === 'bezier' || newValue === 'straight') {
      this['_' + newValue + 'Path']();
    } else {
      this._bezierPath();
    }  
    this.update(this._dataSource);
  }
  reDraw_direction (newValue) {
    this._isVertical = (newValue === 'vertical');
    if (this.ops.mode === 'simple') {
      this.reDraw_mode();
    } else {
      this.reDraw_all(1);
    }
  }
  reDraw_canvasBackground (newValue) {

    this.svg.attr('style', 'background:'+ newValue);
  }
  reDraw_nodeBorderColor (newValue) {
    this._inlineStyle({
      style: '.organiztion .node-wrap {stroke: '+ newValue + '}'
    });
  }
  reDraw_lineColor (newValue) {
    this._inlineStyle({
      style: '.organiztion path.link {stroke: '+ newValue + '}'
    });
  }
  reDraw_nullPhotoColor (newValue) {
    this.svg.selectAll('g.node').select('use.null-photo')
      .attr('fill', newValue);
  }
  reDraw_mode (newValue) {
    newValue = newValue || this.ops.mode;
    this._isVertical = (this.ops.direction === 'vertical');
    if (newValue == 'simple') {

      this.ops.nodeWidth = this.ops.simpleModeSize[0];
      this.ops.nodeHeight = this.ops.simpleModeSize[1];

      if (!this._isVertical) {
        this.ops.nodeWidth = this.ops.simpleModeSize[1];
        this.ops.nodeHeight = this.ops.simpleModeSize[0];
      }
      
      this.ops.lineType = 'straight';
    } else {
      this.ops.lineType = this._oldLineType;
      this.ops.nodeWidth = this._oldNodeSize[0];
      this.ops.nodeHeight = this._oldNodeSize[1];
    }
    if (this.ops.lineType === 'bezier' || this.ops.lineType === 'straight') {
      this['_' + this.ops.lineType + 'Path']();
    } else {
      this._bezierPath();
    }

    this._reComputNodeHeight();
    this._reSetNodeSize();
    this._defsTemplateSizeChange();

    this._simpleMode();
    this.update(this._dataSource).then(() => {
      this._center(1);
    });
  }
  reDraw_flipRoot () {
    if (this.ops.mode === 'simple') {
      this.reDraw_mode();
    }
  }
  callBackTryError (name, cb, property, fn) {
    if (!cb 
      || !cb.then 
      || typeof cb.then !== 'function') {
      if (property) this[property] = false;
      fn && fn();
      throw `The ${name} callback did not return properly`;
    }
  }
  nodeHasChildren (d) {
    if (d.data.hasOwnProperty('hasChildren')) {
      if (d.data.hasChildren) {
        return true;
      } else {
        return false;
      }
    } else if ((!d._children || !d._children.length)  && (!d.children || !d.children.length)) {
      return false;
    }
    return true;
  }
  isCb (name) {
    if (!name) return false;
    var ops = this.ops, obj = ops[name], fn = obj ? obj.fn : null;
    return (fn && typeof fn === 'function' ? fn : null);
  }
  isRoot (d) {
    return d === this._dataSource;
  }
  isPreChange (name) {
    if (!name) return false;
    let ops = this.ops, obj = ops[name];
    return (obj && obj.preChange);
  }
  isAsync (name) {
    if (!name) return false;
    let ops = this.ops, obj = ops[name];
    return (obj && obj.anync);
  }
  isLock () {
    let locks = this.locks;
    let isLock = [], reg = /1/;
    for (let i = 0, len = locks.length; i < len; i++) {
      isLock.push(this[locks[i]] ? 1 : 0);
    }
    return reg.test(isLock.join(''));
  }
  resetLock () {
    let locks = this.locks;
    for (let i = 0, len = locks.length; i < len; i++) {
      if (this[locks[i]] !== undefined) {
        this[locks[i]] = null;
      }
    }
  }
  // 自定义svg图标
  insertSvgSmybol (str) {
    str = str || this.ops.fontSymbol.join('');
    let iconDefs = this.svg.select('defs');
    let svgStr = `<svg xmlns="${svgNameSpace}"> ${str} </svg>`;
    let doc = new DOMParser().parseFromString(svgStr, 'application/xml');
    let chd = doc.documentElement.childNodes;
    for (let i = 0, len = chd.length; i < len; i++) {
      iconDefs.node().appendChild(chd[i].cloneNode(true));
    }
  }
  destroy () {
    let _that = this;
    this.htmlNode.removeChild(this.htmlNode.children[0]);
    [
      'htmlNode',
      'svg',
      'zoomListener',
      'tree',
      '_selectForRootHistory',
      '_isInitialUpdate',
      '_isVertical',
      '_isTherePicture',
      '_photoIndex',
      '_showDropdownMenu',
      '_initialed',
      '_vis',
      '_selectDataNode',
      '_selectNode',
      '_setTimeouter',
      '_dataSource',
      '_diagonal',
      '_draging',
      '_moveTimer',
      '_oldDragObj',
      '_dragLock',
      '_nodeClickLock',
      '_upLock',
      '_dropDownLock',
      '_expandLock',
      '_foRootLock',
      '_viewChangeLock',
      '_zoomInLock',
      '_zoomOutLock',
      '_centerLock',
      '_transition',
      '_allNodeLinks',
      '_dropdownMenuContainer',
      '_dropMenuListContainer'
    ].forEach(function (name) {
      _that[name] = null;
    });
  }

  // 
  watchInsProperty () {
    let _that = this;
    let arr = [
      '_showDropdownMenu'
    ];
    let o = {};
    let keyMaps = {
      _showDropdownMenu: 'dropmenu'
    };
    for (let i = 0, len = arr.length; i < len; i++) {
      o[arr[i]] = _that[arr[i]];
    };
    for (let i = 0, len = arr.length; i < len; i++) {
      ;(function (v) {
        Object.defineProperty(_that, v, {
          get: function () {
            return o[v];
          },
          set: function (newValue) {
            o[v] = newValue;
            _that['reDraw_' + (keyMaps[v] || v)](newValue);
          }
        });
      }(arr[i]));
    }
  }
  // ops 监听
  watchOps () {
    let _that = this;
    let arr = [
      'canvasWidth',
      'canvasHeight',
      'canvasBackground',
      'nodeBorderColor',
      'lineColor',
      'nullPhotoColor',
      'lineType',
      'direction',
      'groups',
      'lastGroups',
      'mode',
      'flipRoot'
    ];
    let o = {
    };
    let keyMaps = {
      canvasWidth: 'canvas',
      canvasHeight: 'canvas'
      // 'photo': 'isShowPhoto'
    };
    let allMaps = [
      'groups',
      'lastGroups',
      'photoLeftGap'
    ];
    for (let i = 0, len = arr.length; i < len; i++) {
      o[arr[i]] = _that.ops[arr[i]];
    }
    for (let i = 0, len = arr.length; i < len; i++) {
      ;(function (v) {
        Object.defineProperty(_that.ops, v, {
          get: function () {
            return o[v];
          },
          set: function (newValue) {
            o[v] = newValue;
            if (allMaps.indexOf(v) >= 0) {
              _that.reDraw_all(newValue);
            } else {
              _that['reDraw_' + (keyMaps[v] || v)](newValue);
            }
          }
        });
      }(arr[i]));
    }
  }
  clearData () {
    this.vis.selectAll('g.node').remove();
    this.vis.selectAll('path.link').remove();
  }
  reStart (ops) {
    // var ops = this.ops, 
    let _that = this;
    this.ops = extend(this.ops, ops || {});
    this._dataSource = d3.hierarchy(this.ops.root, function(d) { 
      return d.children || []; 
    });
    this._dataSource.x0 = 0;
    this._dataSource.y0 = 0;
    if (this._dataSource.children) {
      this._dataSource.children.forEach(function (d) {
        _that.toggleAll(d);
      });
    }
    this._isInitialUpdate = true;
    if (this.ops.defaultExpandLevel > 2) {
      this.expandAll();
    }
    this.update();
  }
}
// console.log(d3);
const Structure = OrganiztionStructure;
export default Structure;
