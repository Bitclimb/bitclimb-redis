const path = require('path');
const fs = require('fs');

exports.findPidFile = (startPath, filter) => {
  let pidfile;
  const walk = dir => {
    if (!fs.existsSync(dir)) {
      return null;
    }
    try {
      fs.accessSync(dir, fs.constants.R_OK);
    } catch (e) {
      return null;
    }
    fs.readdirSync(dir).map(f => path.resolve(dir, f)).some(files => {
      if (fs.statSync(files).isDirectory()) {
        walk(files);
      } else {
        if (path.extname(files) == '.pid') {
          if (files.includes(filter)) {
            pidfile = parseInt(fs.readFileSync(files, 'utf8'));
            return true;
          }
        }
      }
      return false;
    });
  };
  walk(startPath);
  return (!pidfile || isNaN(pidfile)) ? null : pidfile;
};
