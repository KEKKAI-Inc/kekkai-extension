const path = require('path');

const AdmZip = require('adm-zip');
const spawn = require('cross-spawn');
// const fs = require('fs-extra');

const browser = process.env.TARGET_BROWSER;

async function zipBuild() {
  const zip = new AdmZip();

  if (browser === 'chrome') {
    spawn.sync('rm', ['-f', 'build/chrome.zip'], { stdio: 'inherit' });

    zip.addLocalFolder(path.join(__dirname, '../build/chrome'));
    zip.writeZip('build/chrome.zip');
  }

  if (browser === 'firefox') {
    spawn.sync('rm', ['-f', 'build/firefox.zip'], { stdio: 'inherit' });

    // const firefoxDirPath = path.join(__dirname, '../build/firefox');
    // const filenames = (await fs.readdir(firefoxDirPath)).map(i => firefoxDirPath + '/' + i);
    // filenames.forEach(i => i.includes('.') ? zip.addLocalFile(i) : zip.addLocalFolder(i));
    zip.addLocalFolder(path.join(__dirname, '../build/firefox'));
    zip.writeZip('build/firefox.zip');
  }
}

zipBuild();
