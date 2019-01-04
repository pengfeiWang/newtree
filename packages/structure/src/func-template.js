import { LINE_CENTER } from './vars';

function _defsTemplate () {
  let defs = this.svg.select('defs');
  if (!defs || defs.empty()) {
    defs = this.svg.insert('svg:defs', ':first-child');
  }
  defs.append('clipPath').attr('id', 'clip').append('use').attr('xlink:href', '#photo-radius');

  // 透明矩形, 为按钮增加点击范围
  defs
    .append('rect').attr('id', 'opacityRect')
    .attr('fill', '#fff')
    .attr('width', 20).attr('height', 20)
    .attr('ry', 5);
  // 透明矩形, 为按钮增加点击范围
  defs
    .append('circle').attr('id', 'opacityCircle').attr('width', 20).attr('height', 20).attr('r', 10);
}
function _defsTemplateSizeChange () {
  const _that = this;
  const ops = this.ops;
  let nodeWrap = this.svg.select('#node-wrap');
  let nodeWrapSimple = this.svg.select('#node-wrap-simple');
  let nodeWrapSimpleFirst = this.svg.select('#node-wrap-simple-first');
  let photoRadius = this.svg.select('#photo-radius');
  let txtCenterPath  = this.svg.select('#txt-center-path');
  let threeColumnPath = this.svg.selectAll('.three-column');
  let sortBorde = this.svg.select('#sort-border-tmp');
  let defs = this.svg.select('defs');
  let simpleModeSize = ops.simpleModeSize;
  let simpleW = simpleModeSize[1], simpleH = simpleModeSize[0];
  if (!this._isVertical) {
    simpleW = simpleModeSize[0];
    simpleH = simpleModeSize[1];
  }
  if (!defs || defs.empty()) {
    defs = this.svg.insert('svg:defs', ':first-child');
  }

  (nodeWrap && !nodeWrap.empty() ? nodeWrap : defs.append('rect'))
    .attr('class', 'node-rect')
    .attr('id', 'node-wrap')
    .attr('rx', this.ops.radius)
    .attr('ry', this.ops.radius)
    .attr('width', ops.nodeWidth).attr('height', ops.nodeHeight);

  (nodeWrapSimple && !nodeWrapSimple.empty() ? nodeWrapSimple : defs.append('rect'))
    .attr('class', 'node-rect')
    .attr('id', 'node-wrap-simple')
    .attr('rx', this.ops.radius)
    .attr('ry', this.ops.radius)
    .attr('width', simpleW).attr('height', simpleH);


  (nodeWrapSimpleFirst && !nodeWrapSimpleFirst.empty() ? nodeWrapSimpleFirst : defs.append('rect'))
    .attr('class', 'node-rect-simple-first')
    .attr('id', 'node-wrap-simple-first')
    .attr('rx', this.ops.radius)
    .attr('ry', this.ops.radius)
    .attr('width', ops.nodeWidth)
    .attr('height', ops.nodeHeight);

  (photoRadius && !photoRadius.empty() ? photoRadius : defs.append('rect'))
    .attr('id', 'photo-radius')
    .attr('width', ops.photoWidth)
    .attr('height', ops.photoHeight)
    .attr('rx', ops.radius)
    .attr('ry', ops.radius);
  (sortBorde && !sortBorde.empty() ? sortBorde : defs.append('rect'))
    .attr('class', 'sort-border-tmp')
    .attr('id', 'sort-border-tmp')
    .attr('width', this._isVertical ? (ops.nodeGapWidth / 2) : ops.nodeWidth)
    .attr('height', this._isVertical ? ops.nodeHeight : (ops.nodeGapWidth / 2));

  (txtCenterPath && !txtCenterPath.empty() ? txtCenterPath : defs.append('path'))
    .attr('id', 'txt-center-path')
    .attr('d', 'M'+ (ops.padding * 2) +' '+ LINE_CENTER +'L'+ (ops.nodeWidth - ops.padding * 2) +' '+ LINE_CENTER);
  if (ops.lastGroups && ops.lastGroups.length) {
    // return;
    threeColumnPath.remove();

    ops.lastGroups.forEach(function () {
      defs.append('path')
        .attr('class', 'three-column');
    });
    const stepSize = ops.nodeWidth / ops.lastGroups.length;
    threeColumnPath = _that.svg.selectAll('.three-column');
    threeColumnPath
      .attr('d', function (d, idx) {
        return 'M'+ (stepSize * idx) +' '+ LINE_CENTER +'L'+ (stepSize * idx + stepSize) +' '+ LINE_CENTER;
      })
      .attr('id', function (d, idx) {
        return 'three-column-path-'+ idx;
      });
  }
}

export {
  _defsTemplate,
  _defsTemplateSizeChange
};
