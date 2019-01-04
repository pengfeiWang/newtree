const { join, extname, resolve } = require('path');
const { existsSync, statSync, readdirSync } = require('fs');
const webpack = require('webpack');
const cwd = process.cwd();
const chalk = require('chalk');
const rimraf = require('rimraf');

let watching;
function build(dir, opts = {}) {
  const { watch } = opts;
  const pkgPath = join(cwd, dir, 'package.json');
  const pkgWebpackPath = join(cwd, dir, 'webpackConfig.js');
  const pkg = require(pkgPath);
  const webpackCfg = require(pkgWebpackPath);
  const distDir = join(dir, 'dist');
  rimraf.sync(join(cwd, distDir));

  if (watching) {
    watching.close();
  }

  const compiler = webpack(webpackCfg);


  if(watch) {
    
    watching = compiler.watch({
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: 2000
    }, (err, stats) => {
      if (err) {
        console.log(chalk.red('Errror: ' + err));
        return;
      }
      let d = new Date();
      let y = d.getFullYear(), M = d.getMonth() + 1, dd = d.getDate(), h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
      let preZero = function (n) {
        return n < 10 ? `0${n}` : n; 
      }
      console.log(chalk.green('[build done] '), chalk.blue(`change: ${y}-${preZero(M)}-${preZero(dd)} ${preZero(h)}:${preZero(m)}:${preZero(s)}`), pkg.name + '.js');

    });
    
    return;
  }
  compiler.run(function (err, st) {
    // do
    if (err) {
      console.log(chalk.red('Errror: ' + err));
      return;
    }
    console.log(chalk.green('[build done] '), 'success : ', pkg.name + '.js');
  });

}
const watch = process.argv.includes('-w') || process.argv.includes('--watch');
const dirs = readdirSync(join(cwd, 'packages'));
dirs.forEach(pkg => {
  if (pkg.charAt(0) === '.') return;
  build(`./packages/${pkg}`, {
    cwd,
    watch
  });
});