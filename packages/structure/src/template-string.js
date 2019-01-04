let searchTemplate = `
  <div class="search-container">
    <div class="search-input-wrap">
      <input class="search-input" type="text" placeholder="">
      <svg class="input-clear-btn" viewBox="0 0 20 20" width="20" height="20"><use xlink:href="#icon-plus" fill="#555" transform="rotate(45, 10 10)"></svg>
    </div>
    <div class="search-result-num">
      <span class="curNum">0</span>
      /
      <span class="resultNum">0</span>
    </div>
    <button class="search-button search-button-pre">
      <svg viewBox="0 0 20 20" width="20" height="20"><use xlink:href="#icon-up" fill="#fff"></svg>
    </button>
    <button class="search-button search-button-down">
    <svg viewBox="0 0 20 20" width="20" height="20"><use xlink:href="#icon-down" fill="#fff"></svg>
    </button>
  </div>
`;
function renderSerchTxt (ts) {
  return searchTemplate.replace('placeholder=""', `placeholder="${ts.searchPlaceHolder}"`);
}
export {
  searchTemplate,
  renderSerchTxt
};
