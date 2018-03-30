const path = require('path');
const { execFileSync } = require('child_process');
const fs = require('fs');

const cmdPid = (proc, filter) => {
  const pgrep = execFileSync('which', ['pgrep'], { encoding: 'utf8' });
  if (pgrep) {
    return execFileSync(pgrep, [filter], { encoding: 'utf8' });
  } else {
    return execFileSync('pidof', [proc], { encoding: 'utf8' });
  }
};

exports.findPidFile = (startPath, filter) => {
  let pidfile, tempPid;
  const walk = dir => {
    if (!fs.existsSync(dir)) {
      return null;
    }
    try {
      fs.accessSync(dir, fs.constants.R_OK);
    } catch (e) {
      return null;
    }
    try {
      fs.readdirSync(dir).map(f => path.resolve(dir, f)).some(files => {
        if (fs.statSync(files).isDirectory()) {
          walk(files);
        } else {
          if (path.extname(files) == '.pid') {
            if (files.includes(filter)) {
              tempPid = files;
              pidfile = parseInt(fs.readFileSync(files, 'utf8'));
              return true;
            }
          }
        }
        return false;
      });
    } catch (e) {
      if (tempPid) {
        tempPid = path.basename(tempPid, '.pid');
      }
      return cmdPid(tempPid, filter);
    }
  };
  walk(startPath);
  return (!pidfile || isNaN(pidfile)) ? null : pidfile;
};
