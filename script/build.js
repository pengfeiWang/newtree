const babel = require('@babel/core');
const { join, extname, resolve } = require('path');
const { existsSync, statSync, readdirSync } = require('fs');
const assert = require('assert');
const { Signale } = require('signale');
const slash = require('slash2');
const chalk = require('chalk');
const rimraf = require('rimraf');
const vfs = require('vinyl-fs');
const through = require('through2');
const chokidar = require('chokidar');
const webpack = require('webpack');

const cwd = process.cwd();
const signale = new Signale({
  types: {
    transform: {
      badge: '🎅',
      color: 'blue',
      label: 'transform',
    },
    pending: {
      badge: '++',
      color: 'magenta',
      label: 'pending'
    },
    watch: {
      badge: '**',
      color: 'yellow',
      label: 'watch'
    },
  }
});

function getBabelConfig(isBrowser, umd) {
  const targets = (isBrowser)
    ? {
      browsers: ['last 2 versions', 'IE 9'],
    }
    : { node: 6 };
  const plugins = [
    require.resolve('@babel/plugin-proposal-export-default-from'),
    require.resolve('@babel/plugin-proposal-do-expressions'),
    require.resolve('@babel/plugin-proposal-class-properties'),
    'add-module-exports'
  ];

  return {
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          targets
        },
      ],
    ],
    plugins,
  };
}

function addLastSlash(path) {
  return path.slice(-1) === '/' ? path : `${path}/`;
}

function transform(opts = {}) {
  const { content, path, pkg, root } = opts;
  assert(content, `opts.content should be supplied for transform()`);
  assert(path, `opts.path should be supplied for transform()`);
  assert(pkg, `opts.pkg should be supplied for transform()`);
  assert(root, `opts.root should be supplied for transform()`);
  assert(extname(path) === '.js', `extname of opts.path should be .js`);

  const { isBrowser, modName } = pkg.buildCfg || {};
  const babelConfig = getBabelConfig(isBrowser);
  babelConfig.filename = modName || opts.filename;
  signale.transform(
    chalk[isBrowser ? 'yellow' : 'blue'](
      `${slash(path).replace(`${cwd}/`, '')}`,
    ),
  );
  return babel.transform(content, babelConfig).code;
}

function build(dir, opts = {}) {
  const { cwd, watch } = opts;
  assert(dir.charAt(0) !== '/', `dir should be relative`);
  assert(cwd, `opts.cwd should be supplied`);

  const pkgPath = join(cwd, dir, 'package.json');
  const pkgWebpackPath = join(cwd, dir, 'webpackConfig.js');
  const webpackCfg = require(pkgWebpackPath);

  assert(existsSync(pkgPath), 'package.json should exists');
  
  const pkg = require(pkgPath);
  const libDir = join(dir, 'lib');
  const srcDir = join(dir, 'src');
  const distDir = join(dir, 'dist');

  // clean
  rimraf.sync(join(cwd, libDir));
  rimraf.sync(join(cwd, distDir));

  function createStream(src) {
    assert(typeof src === 'string', `src for createStream should be string`);
    
    var vfsIns = vfs
      .src([
        src,
        `!${join(srcDir, '**/fixtures/**/*')}`,
        `!${join(srcDir, '**/*.test.js')}`,
        `!${join(srcDir, '**/*.e2e.js')}`,
      ], {
        allowEmpty: true,
        base: srcDir,
      })
      .pipe(through.obj((f, env, cb) => {
        if (extname(f.path) === '.js') {
          f.contents = Buffer.from(
            transform({
              content: f.contents,
              path: f.path,
              pkg,
              filename: f.basename,
              root: join(cwd, dir),
            }),
          );
        }
        cb(null, f);
      }))
      .pipe(vfs.dest(libDir));
    // webpackBuild(pkgCfg, pkg.name);
    // if (watching) {
    //   watching.close();
    // }
    
    return vfsIns;
  }
  function createWebpack() {
    const compiler = webpack(webpackCfg);

    compiler.run(function (err, st) {
      // do
      if (err) {
        console.log(chalk.red('Errror: ' + err));
        return;
      }
      console.log(chalk.green('[build done] '), 'success : ', pkg.name + '.js');
    });
  }
  // build
  const stream = createStream(join(srcDir, '**/*'));
  

  stream.on('end', () => {

    // watch
    createWebpack();
    if (watch) {
      signale.pending('start watch', srcDir);
      const watcher = chokidar.watch(join(cwd, srcDir), {
        ignoreInitial: true,
      });
      watcher.on('all', (event, fullPath) => {
        const relPath = fullPath.replace(join(cwd, srcDir), '');
        signale.watch(`[${event}] ${join(srcDir, relPath)}`);
        if (!existsSync(fullPath)) return;
        if (statSync(fullPath).isFile()) {
          const streamW = createStream(fullPath);

          streamW.on('end', () => {
            createWebpack();
          });

        }
      });
    }
  });
}

function isLerna(cwd) {
  return existsSync(join(cwd, 'lerna.json'));
}

// Init
const watch = process.argv.includes('-w') || process.argv.includes('--watch');
const dir = process.argv[2];

if (dir && dir !== '-w' && dir !== '--watch') {
  build(`./packages/${dir}/`, {
    cwd,
    watch,
  });
} else {
  if (isLerna(cwd)) {
    const dirs = readdirSync(join(cwd, 'packages'));
    dirs.forEach(pkg => {
      if (pkg.charAt(0) === '.') return;
      build(`./packages/${pkg}`, {
        cwd,
        watch,
      });
    });
  } else {
    build('./', {
      cwd,
      watch,
    });
  }
}
