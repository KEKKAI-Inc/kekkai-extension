const path = require('path');
const { exit } = require('process');

const spawn = require('cross-spawn');
const fs = require('fs-extra');
const readlineSync = require('readline-sync');

const { createApproval } = require('./lark');
const { getNextSmallVersion, isNextVersion } = require('./version');
const packageJson = require('../package.json');
const manifestJson = require('../src/manifest.json');

const currVersion = manifestJson.version;
const version =
  readlineSync.question(`What version needs to be released? (current version: ${currVersion}): `) ||
  getNextSmallVersion(currVersion);

if (!isNextVersion(version, currVersion)) {
  console.log('[ERROR] input version is less than the current version');
  exit(-1);
}

const updated = readlineSync.question("What's updated in this release? (feature: xxx; fix: xxx;): ") || '';

function writeVersionToFile(version) {
  packageJson.version = version;
  manifestJson.version = version;
  fs.writeFileSync(path.join(__dirname, '../package.json'), JSON.stringify(packageJson, null, 2));
  fs.writeFileSync(path.join(__dirname, '../src', 'manifest.json'), JSON.stringify(manifestJson, null, 2));
}

writeVersionToFile(version);

(async () => {
  try {
    console.log('>>>>>>>> start build');
    spawn.sync('yarn', ['build'], { stdio: 'inherit' });
    spawn.sync('yarn', ['zip'], { stdio: 'inherit' });

    spawn.sync('rm', ['-f', 'src.zip'], { stdio: 'inherit' });
    spawn.sync('zip', ['-q', '-r', 'src.zip', 'src'], { stdio: 'inherit' });
    console.log('>>>>>>>> finish build');

    await createApproval(version, updated);
    spawn('rm', ['-f', 'src.zip']);
    console.log('✓ release success');
    exit(0);
  } catch (err) {
    spawn('rm', ['-f', 'src.zip']);
    writeVersionToFile(currVersion);
    console.log(`[ERROR] ${err.toString()}`);
    exit(-1);
  }
})();
