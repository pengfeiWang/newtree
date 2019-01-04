import fontSymbol from './ops-symbol';
const noop = function () {};
const winWidth = window.innerWidth;
const winHeight = window.innerHeight;
const defaultOps = {
  id: 'body',
  canvasWidth: winWidth,
  canvasHeight: winHeight,
  canvasWrapClass: '',
  canvasMin: 0.2,
  canvasMax: 3,
  defaultZoom: .5,
  canvasBackground: '#fff',
  // cssPrefix: 'structure',
  fontSymbol: fontSymbol,
  fontSize: 14,
  htmlStyle: [],
  // 默认展开层级
  // 为 0 则显示 2 层
  defaultExpandLevel: 0,
  // 节点宽
  nodeWidth: 220,
  // 节点高
  nodeHeight: 160,
  // 图像高宽
  photoWidth: 48,
  // 图像高宽
  photoHeight: 48,

  // 是否只读
  isReadOnly: !true,
  // 开启拖拽
  openDrag: false,
  dragPreChange: false,
  // 唯一 key
  onlyKey: 'id',
  // 是否显示 基本信息图标
  // isShowBaseTxtIco: false,
  // 节点间距
  nodeGapWidth: 20,
  // 线框内边距
  padding: 10,
  // 线框圆角
  radius: 4,
  // 连线类型
  lineType: 'bezier', // ['bezier', 'straight']
  // 方向
  direction: 'vertical', // ['horizontal', 'vertical']
  // lineColor: ''
  lineColor: '#ccc',
  lineWidth: 1.5,
  // 字体颜色
  textColor: '#555',
  // 节点 线框 颜色
  color: '#555',
  // 节点边框
  nodeBorderWidth: 1.5,
  nodeBorderColor: '#ddd',
  nodeBorderActiveColor: '#b2d5dc',
  // 节点背景
  nodeBgColor: '#fff',
  // 激活的节点背景
  // nodeBgActiveColor: 'red',
  
  // 图像背景
  // photoBgColor: 'none',
  // 无图像是替代的图像颜色
  nullPhotoColor: '#c1e8f7',
  
  // 按钮颜色
  buttonColor: '#b2d5dc',
  buttonActiveColor: '#46b5cc',
  buttonDisableColor: '#ddd',


  
  // 缩放 bar
  zoomBar: true,
  zoomBarBackground: '#b2d5dc',
  zoomBarFontColor: '#fff',
  zoomBarActiveFontColor: '#2196F3',
  progress: true,

  // 模式
  mode: 'standard', // ['standard', 'simple']
  simpleModeSize: [40, 150],
  simpleModeKey: 'name',
  flipRoot: true, // 只在 simple 模式时有效
  // 缩放刻度
  

  // 动画时长
  duration: 750,
  olDuration: 0,
  // 树根
  root: {},
  i: 0,

  // 全局 label 
  labelColor: '#999',
  // 图片左间距
  photoLeftGap: 28,
  groups: [
    // {
    //   label: 'title1',
    //   key: 'name',
    //   icon: '&#xe601;',
    //   textAlign: 'start', // [start, middle]
    //   className: 'aaa bbb'
    // },
    // {
    //   key: 'photo',
    //   label: 'user',
    //   icon: '',
    //   info: [
    //     {
    //       key: 'jobClass',
    //       label: '职级',
    //       icon: ''
    //     },
    //     {
    //       key: 'jobGrade',
    //       label: '职等',
    //       icon: ''
    //     }
    //   ]
    // },
    // {
    //   label: '',
    //   key: 'title',
    //   icon: '&#xe601;',
    //   textAlign: 'start', // [start, middle]
    //   className: ''
    // },
    //  {
    //   label: 'title3',
    //   key: 'title',
    //   icon: '&#xe601;',
    //   textAlign: 'start', // [start, middle]
    //   className: ''
    // }
  ],
 
  lastGroups: [
    // {
    //   key: 'workForceNum',
    //   label: '编制',
    //   color: '#1372b0'
    // }, {
    //   key: 'curEmpForceNum',
    //   label: '在编',
    //   color: '#d1992e'
    // }, {
    //   key: 'actualNum',
    //   label: '实际',
    //   color: '#549e9d'
    // }
  ],
  lastGroupsColor: ['#1372b0', '#d1992e', '#549e9d'],
  lastGroupInnerLineColor: '#ddd',
  lastGroupInnerLineWidth: 1,
  otherButtons: [
    {
      key: 'dropMenu',
      iconId: 'icon-down'
    },
    {
      key: 'detailInfo',
      iconId: 'icon-summary'
    }
    // 'icon-down',
    // 'icon-summary',
  ],
  // 数据中 图像的 key 名
  photoKeyName: 'photo',

  collapse: noop,
  expand: noop,
  selected: noop,
  selectedNodeForRoot: noop,

  // 开启搜索
  openSearch: true,
  // 匹配内容的字段
  searchKeys: ['name'],
  // 输入框的占位文字
  searchPlaceHolder: '搜索',
  // 选中节点的边框颜色
  searchSelectedBorderColor: '#58a0af',
  // 选中节点的背景颜色, 只有在搜索和选中同时命中时使用
  searchSelectedBgColor: '#fafbf2',
  // 中心聚焦, 匹配到搜索结果 焦点元素移动到中心
  searchFocusingCenter: true,
  searchCallback: noop,
  // dragStart: noop,
  // dragged: noop,
  
  customRenderPhoto: null,
  customDrawNode: null,
  dropDownMenu: null,

  // 按层次显示
  // levelRender: 1,
  // addNodeCallBack: null,
  // detailNodeCallBack: null,
  // deleteNodeCallBack: null,

  // 排序
  sortNode: null, // { preChange: true, fn: function () {}}
  // 转移
  transferNode: null // { preChange: true, fn: function () {}}

};

export default defaultOps;