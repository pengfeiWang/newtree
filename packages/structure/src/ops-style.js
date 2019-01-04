const baseStyle = `
.organiztion .node-rect {}
.button { cursor: pointer }
.button.active .button-inner {
  transform: rotate(180deg); 
  transform-origin: 10px 10px;
}
text {
  user-select: none;
}
.organiztion .node-wrap {
  
}
`;
let htmlStyle = ''+
  '.dropDownMenu {'+
  '  background: #fff;'+
  '  border: 1px solid #ddd;'+
  '  border-radius: 3px;'+
  '  box-shadow: 0 0 3px #ddd;'+
  '  padding: 0px;'+
  '}'+
  '.dropDownMenu li{'+
  '  width: 120px;'+
  '  height: 30px;'+
  '  line-height: 30px;'+
  '  list-style: none;'+
  '  font-size: 14px;'+
  '  user-select: none;'+
  '  cursor: pointer;'+
  '  padding: 0 5px;'+
  '}'+
  '.dropDownMenu li:hover{'+
  '  background-color: #b2d5dc;'+
  '}'+
  '.zoomBar {'+
  '  width: 30px;'+
  '  height: 130px;'+
  '  position: absolute;'+
  '  left: 20px;'+
  '  bottom: 20px;'+
  '  border-radius: 5px;'+
  '  background-color: zoomBarBackground;'+
  '  text-align: center;'+
  '  padding: 5px 0;'+
  '  color: zoomBarFontColor; font-size: 0;'+
  '}'+
  '.zoomBar span{'+
  '  display: inline-block;'+
  '}'+
  '.zoomBar .btn {'+
  '  width: 20px;'+
  '  height: 20px;'+
  '  line-height: 20px;'+
  '  margin-bottom: 4px;'+
  '  cursor: pointer;'+
  '  position: relative;'+
  '}'+
  '.zoomBar span svg{'+ 
  '  position: absolute;'+
  '  top: 0; left: 0; right: 0; bottom: auto; margin: auto;'+
  '}'+
  '.zoomBar .btn:hover{'+
  '  color: zoomBarActiveFontColor'+
  '}'+
  '.zoomBar .btn:hover use{'+
  '  fill: zoomBarActiveFontColor'+
  '}'+
  '.zoomBar .btn:last-child{'+
  '  margin-bottom: 0;'+
  '}'+
  '.zoomBar .progress-box{'+
  '   width: 30px;'+
  '   height: 50px;'+
  '   position: relative;'+
  '   margin-bottom: 4px;'+
  '}'+
  '.zoomBar .progress-box:before,'+
  '.zoomBar .progress-box:after{'+
  '  content: " ";'+
  '  position: absolute;'+
  '  z-index: 1;'+
  '}'+
  '.zoomBar .progress-box:after{'+
  '  width: 8px;'+
  '  height: 2px;'+
  '  position: absolute;'+
  '  top: 50%;'+
  '  left: 50%;'+
  '  margin: -1px 0 0 -4px;'+
  '  z-index: 2;'+
  '  background: #fff;'+
  '}'+
  '.zoomBar .progress-box:before{'+
  '  top: 0;'+
  '  left: 0;'+
  '  bottom: 0;'+
  '  right: 0;'+
  '  width: 2px;'+
  '  margin: auto;'+
  '  background-color: #fff;'+
  '  border-radius: 5px;'+
  '}'+
  '.zoomBar .progress-box .progress{'+
  '  background-color: #fff;'+
  '   position: absolute;'+
  '  width: 6px;'+
  '  height: 6px;'+
  '  border-radius: 4px;'+
  '  left: 50%;'+
  '  top: 50%;'+
  '  margin: -3px 0 0 -3px;'+
  '  z-index: 3;'+
  '  box-shadow: 0 0 5px #999;'+
  '}'+
  '.zoomBar span:hover svg { }';
const searchStyle = `.search-wraper {
  position: absolute;
  top: 0;
  right: 0;
}
.search-container {
  padding: 5px 10px;
  line-height: 0px;
  border: 1px solid #ddd;
  font-size: 0;
  background: rgba(255,255,255,.8);
  border-top: 0;
  border-bottom-left-radius: 5px;
}
.search-input-wrap {
  display: inline-block;
  float: left;
  position: relative;
}
.search-input-wrap svg{
  position: absolute;
  top: 4px;
  right: 8px;
  background: #dcdcdc;
  border-radius: 9px 9px 9px 0;
  cursor: pointer
}
.search-input-wrap svg:hover{
  background: #eaeaea;
}
.search-input {
  height: 28px;
  line-height: 28px;
  font-size: 14px;
  float: left;
  margin-right: 5px;
  border-radius: 4px;
  padding: 3px 6px;
  border: 1px solid #ccc;
  -webkit-box-shadow: inset 0 1px 1px rgba(0,0,0,.075);
  box-shadow: inset 0 1px 1px rgba(0,0,0,.075);
  -webkit-transition: border-color ease-in-out .15s,-webkit-box-shadow ease-in-out .15s;

  transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s;
}
.search-input::-moz-placeholder { color: #b9b9b9; }
.search-input::-webkit-input-placeholder { color:#b9b9b9; }
.search-input:-ms-input-placeholder { color:#b9b9b9; }
.search-input:focus{
  border-color: #66afe9;
  outline: 0;
  -webkit-box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
  box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
}
.search-button {
  width: 30px;
  height: 28px;
  border: 1px solid #DE8;
  display: inline-block;
  font-size: 14px;


  display: inline-block;
  padding: 6px 12px;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  -ms-touch-action: manipulation;
  touch-action: manipulation;
  cursor: pointer;
  user-select: none;

  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 4px;
  border-top-left-radius: 4px;

  color: #333;
  background-color: #fff;
  border:1px solid #ccc;
  position: relative;
  transition: border-color ease-in-out .15s, box-shadow ease-in-out .15s;
}
.search-button-down{
  border-left: 0;
  border-bottom-left-radius: 0;
  border-top-left-radius: 0;

  border-bottom-right-radius: 4px;
  border-top-right-radius: 4px;
  
}
.search-button:hover{
  color: #333;
  border-color: #66afe9;
  box-shadow: inset 0 1px 1px rgba(0,0,0,.075), 0 0 8px rgba(102,175,233,.6);
}
.search-button:focus{
  outline: 0;
}
.search-button svg use{
  fill: #333;
}
.search-button:hover svg use {
  fill: #777;
}
.search-result-num{
  height: 28px;
  float: left;
  line-height: 28px;
  color: #ddd;
  font-size: 14px;
  padding-right: 10px;
  padding-left: 5px;
}
.search-button svg{
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
}
.search-button:active,
.search-input-wrap svg:active {
  box-shadow: inset 0 3px 5px rgba(0, 0, 0, .125);
}
`;
function baseStyleHandler(colors) {
  let str = `
  .active use.node-wrap{
    stroke: ${colors.nodeBorderActiveColor};
  }

  .search-selected use.node-wrap{
    stroke: ${colors.searchSelectedBorderColor};
  }
  .active.search-selected use.node-wrap {
    stroke: ${colors.searchSelectedBorderColor};
    fill: ${colors.searchSelectedBgColor};
  }
  `;
  return baseStyle + str;
}
htmlStyle = `${htmlStyle} ${searchStyle}`;
export {
  baseStyle,
  htmlStyle,
  baseStyleHandler
};