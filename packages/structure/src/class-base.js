import { extend, readMultiStageObject } from './utils';
import defaultOps from './ops-default';
import fontSymbol from './ops-symbol';
import { xlink } from './svg-doc';
import { FLOAT_TOP } from './vars';
export default class Base {
  constructor(ops){
    const dftOps = extend(true, {}, defaultOps);
    const opsFontSymbol = ops.fontSymbol;
    delete ops.fontSymbol;
    this.ops = extend(true, dftOps, ops);
    this.ops.fontSymbol = fontSymbol.concat(opsFontSymbol);
  }
  // static extend = (deep, target, source) => extend(deep, target, source);
  // static readMultiStageObject = (o, key) => readMultiStageObject(o, key);
  htmlNode = null;
  svg = null;
  zoomListener = null;
  tree = null;

  _levelSize = {};

  _searchResult = {};
  _searchInput = null;
  _searchInputClearBtn = null;
  // _searchInputValue = null;
  _searchContainer = null;
  _searchPrebtn = null;
  _searchNextBtn = null;
  _searchCur = null;
  _searchCurDom = null;
  _searchCurNum = 0;
  _searchResultDom = null;
  _searchResultNum = 0;

  _selectForRootHistory = [];
  // _expandLock = false;
  _isInitialUpdate = false;
  _isVertical = false;
  _isTherePicture = false;
  _photoIndex = null;
  _showDropdownMenu = false;
  _initialed = null;
  _vis = null;

  // 选择的数据与节点
  _selectDataNode = null;
  _selectNode = null;
  _setTimeouter = null;
  _dataSource = null;

  _diagonal = null;
  _draging = false;
  _moveTimer = null;
  _oldDragObj = null;
  
  // _initialedLock = null;
  // _dragLock = null;
  _dragLock = null;
  _nodeClickLock = null;
  _upLock = null;
  _dropDownLock = null;
  _expandLock = null;
  _foRootLock = null;
  _viewChangeLock = null;
  _zoomInLock = null;
  _zoomOutLock = null;
  _centerLock = null;

  _transition = null;
  _allDataNodes = null;
  _allNodeLinks = null;
  _oldLineType = null;
  _dropdownMenuContainer = null;
  _dropMenuListContainer = null;
  watchNoUpdateProperty = [
    'canvasBackground',
    'nodeBorderColor',
    'lineColor',
    'nullPhotoColor'
  ];
  locks = [
    '_dragLock',
    '_nodeClickLock',
    '_upLock',
    '_dropDownLock',
    '_expandLock',
    '_foRootLock',
    '_viewChangeLock',
    '_zoomInLock',
    '_zoomOutLock',
    '_centerLock'
  ];
  // static extend () {
  //   return extend(arguments[0], arguments[1], arguments[2]);
  // }
  static extend = extend;
  static readMultiStageObject = readMultiStageObject;
  initial () {
    const ops = this.ops;
    const isSimple = ops.mode === 'simple';
    
    this._oldNodeSize = [this.ops.nodeWidth, this.ops.nodeHeight];
    if (isSimple) {
      ops.nodeWidth = ops.simpleModeSize[0];
      ops.nodeHeight = ops.simpleModeSize[1];
    }
    this._isVertical = (ops.direction === 'vertical');
    // this._transition = d3.transition().duration(0);
    let docRoot = d3.select('#' + ops.id);
    let svg = docRoot.select('svg');
    let centerX = FLOAT_TOP;
    let centerY = (ops.canvasHeight - ops.nodeHeight) / 2;
    if (this._isVertical) {
      centerX = (ops.canvasWidth - ops.nodeWidth) / 2;
      centerY =  FLOAT_TOP;
    }
    this.htmlNode = docRoot.node();
    this.docRoot = docRoot;
    this.svg = (svg.empty() ? docRoot.insert('svg:svg', ':first-child') : svg)
      .attr('class', 'organiztion')
      .attr('width', ops.canvasWidth)
      .attr('height', ops.canvasHeight)
      .attr('style', 'background:'+ ops.canvasBackground)
      .attr(
        'viewBox',
        '0 0 '+ ops.canvasWidth +' '+ ops.canvasHeight
      );
    let defs = this.svg.select('defs');
    this.defs = (defs.empty() ? this.svg.insert('svg:defs', ':first-child')  : defs);
    let vis = this.svg.select('g');
    this.svg.attr('xmlns:xlink', xlink);
    this.vis = (vis.empty() ? this.svg.append('svg:g') : vis).attr('transform', 'translate(' + centerX + ', ' + centerY + ')scale(1)')
      .attr('class', 'animate-root').attr('style', 'transform-origin: 0 0;-ms-transform-origin: 0 0;transform-box: view-box;-ms-transform-box: view-box;');;

    if (ops.openDrag) {
      this.sortBorder = this.vis.append('g')
        .attr('id', 'sort-border')
        .attr('display', 'none');
    }
    
    this._oldLineType = this.ops.lineType;
  }
  
}