import {
  computedStyle
} from './utils';
import {
  baseStyle,
  htmlStyle,
  baseStyleHandler
} from './ops-style';
function _inlineStyle (ops) {
  let strStyle = '';
  if (ops) {
    strStyle = ops.style;
  }
  let styleNode = this.defs.select('style');
  let insOps = this.ops;
  this.styleNode = (
    styleNode.empty() 
      ? this.defs.insert('style', ':first-child') 
      : styleNode
  );
  let colors = {
    nodeBorderActiveColor: this.ops.nodeBorderActiveColor,
    searchSelectedBorderColor: this.ops.searchSelectedBorderColor,
    searchSelectedBgColor: this.ops.searchSelectedBgColor
  };
  let c = baseStyleHandler(colors) + computedStyle(this.ops) + strStyle;

  let buttonColorStyle = '.button .button-inner {fill: ' + insOps.buttonColor + '}.button:hover .button-inner{fill: ' + insOps.buttonActiveColor + '}.button.disable .button-inner,.button.disable:hover .button-inner{fill: ' + insOps.buttonDisableColor + '}';

  c = c + buttonColorStyle;
  this.styleNode
    .attr('type', 'text/css')
    .text(c);
}
function _inlineHtmlStyle () {
  const ops = this.ops, opsHtmlStyle = ops.htmlStyle.join('');

  let styleStr = htmlStyle + opsHtmlStyle;
  if (!this.styleDomNode) {
    this.styleDomNode = document.createElement('style');
  }

  styleStr = styleStr.replace(/zoomBarBackground/g, ops.zoomBarBackground)
                      .replace(/zoomBarFontColor/g, ops.zoomBarFontColor)
                      .replace(/zoomBarActiveFontColor/g, ops.zoomBarActiveFontColor);

  this.styleDomNode.tyle = 'text/css';
  this.styleDomNode.innerHTML = styleStr;
  document.getElementsByTagName('head')[0].appendChild(this.styleDomNode);
}

export {
  _inlineStyle,
  _inlineHtmlStyle
};
