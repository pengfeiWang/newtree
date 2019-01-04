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
import {
  FLOAT_TOP,
  LINE_CENTER,
  PHOTO_LINE_TEXT_OFFSET_TOP,
  ICON_WIDTH
} from './vars';

let PHOTO_TOP_BOTTOM_GAP = FLOAT_TOP * 3;

export default class Draw {
  constructor(opts) {
    this.ops = { ...opts.ops };
    this.vis = opts.vis;
    this.svg = opts.svg;
    this.treeData = opts.treeData;
    this.dataNodes = opts.dataNodes;
    this._isVertical = opts._isVertical;
    this._allNodeLinks = opts._allNodeLinks;
    this._dataSource = opts._dataSource;
    this._diagonal = opts._diagonal;
    this._allDataNodes = opts._allDataNodes;
    this._isTherePicture = opts._isTherePicture;
    this._photoIndex = opts._photoIndex;
  }
  ops = null;
  vis = null;
  svg = null;
  treeData = null;
  dataNodes = null;
  _isVertical = null;
  _allNodeLinks = null;
  _dataSource = null;
  _diagonal = null;
  _allDataNodes = null
  _isTherePicture = null;
  _photoIndex = null;

  _draw (source) {
    const ops = this.ops;
    
    this._drawNode(source);
    this._drawLine(source);
    this._drawBackground();
    if (ops.customDrawNode && typeof ops.customDrawNode === 'function') {
      ops.customDrawNode.call(this);
    } else {
      this._drawDetail();
    }

    if (ops.mode !== 'simple') {
      this._drawButtons();
      this._drawLastGroup();
    }
    
    this._drawExpandButton();


    // this._buttonEvent();
    // this._nodeEvent();

    // this._expandButtonEvent();
    // this._dragInitial();

    // if (this.ops.nodeHeight <= 100 || !this.ops.groups || this.ops.groups.length <= 1) {
    //   this._allDataNodes.selectAll('.button-wrap').remove();
    // }
  }
  /**
   * 绘制节点, 不包含节点内的内容
   * @param  {[type]} source [description]
   * @return {[type]}        [description]
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
      .attr('transform', function(d) { 
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
      .attr('transform', function() {
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
   * @param  {[type]} source [description]
   * @return {[type]}        [description]
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
      .attr('d', function () {
        let o = {
          x: source.x0 || _that._dataSource.x0 || 0,
          y: source.y0 || _that._dataSource.y0 || 0
        };
        return _that._diagonal(_that._reComputPath({
          source: o,
          target: o
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
      .attr('d', function() {
        let o = {
          source: { x: source.x, y: source.y },
          target: { x: source.x, y: source.y }
        };
        return _that._diagonal(_that._reComputPath(o));
      })
      .remove(function (){}); 
  }

  _drawBackground () {

    this.svg.selectAll('.node-wrap').remove();

    this.svg.selectAll('.node').insert('use', ':first-child')
      .attr('xlink:href', function () {
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
   * @param  {[type]} source [description]
   * @return {[type]}        [description]
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
    // if (ops.mode === 'simple') {
    //   this._simpleMode();
    //   return;
    // }

    groups.forEach((v, i) => {

      if (v.key === 'photo') {
        _that._isTherePicture = true;
        let info = v.info;
        let tY = ((LINE_CENTER * i) + PHOTO_TOP_BOTTOM_GAP + borderW);
        if (photoLeftGap === 20 && i === 0) {
          tY = padding;
        }
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
        let node = allNode.append('g')
          .attr('class', 'groups groups-' + i + ' groups-' + v.key + ' ' + v.className)
          .attr('transform', 'translate(' + tX + ', ' + tY + ')');

        _that._drawSingleLineText(node, v);
      }
    });
  }
  /**
   * 绘制单行文本
   * @param  {[type]} node [description]
   * @param  {[type]} v    [description]
   * @return {[type]}      [description]
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
    let txtNode = node.append('text')
      .attr('text-anchor', (!textAlign ? 'start' : textAlign))
      .attr('x', tx)
      .attr('style', 'font-size: ' + fontSize + 'px');

    detailTxt(txtNode, tx);
  }
  /**
   * 绘制图片行
   * @param  {[type]} node [description]
   * @param  {[type]} v    [description]
   * @return {[type]}      [description]
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
   * @param  {[type]} node [description]
   * @param  {[type]} v    [description]
   * @return {[type]}      [description]
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
    let cls = 'collapse-expand', getCls = '.' + cls;
    let btnW = 24, half = btnW / 2, bg = btnW + 1, bgHalf = bg / 2;
    let bgP = (btnW - bg) / 2;

    // this._reComputNodeHeight();
    let translateX = this._isVertical
      ?
        (this.ops.nodeWidth / 2 - half)
      : 
        (this.ops.nodeWidth - half),
      translateY = this._isVertical
      ?
        (this.ops.nodeHeight - half)
      :
        (this.ops.nodeHeight / 2 - half);

    let gNode = this.svg.selectAll('g.node');
    gNode.selectAll(getCls).remove();

    let btn = gNode.append('g')
      // .attr('class', cls)
      .attr('transform', 'translate(' + translateX + ',' + translateY + ')')
      .attr('style', 'cursor: pointer;')
      .attr('class', function (d) {
        if (d.data.hasOwnProperty('hasChildren')) {
          if (d.data.hasChildren) {
            return cls + ' button';
          } else {
            return cls + ' button disable';
          }
        } else if ((!d._children || !d._children.length)  && (!d.children || !d.children.length)) {
          return cls + ' button disable';
        }
        return cls + ' button';
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

  // 重新计算路径
  _reComputPath (d) {
    let _that = this;   
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
    var kx = mps[booleanNum].x, ky = mps[booleanNum].y;

    o.source.x = source.x + _that.ops[kx] / 2;
    o.target.x = target.x + _that.ops[kx] / 2;
    
    o.source.y = source.y + _that.ops[ky];
    o.target.y = target.y;


    return o;
  }
  // 获取图片的 src
  getPhotoPath (d) {
    let _that = this, ops = this.ops;

    let val = readMultiStageObject(d.data, _that.ops.photoKeyName || 'photo');
    if (val && _that.ops.customRenderPhoto 
      && typeof _that.ops.customRenderPhoto === 'function') {
      val = _that.ops.customRenderPhoto.call(_that, d.data, val);
    }
    return (val || '');
  }
}