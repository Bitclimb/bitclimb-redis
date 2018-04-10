/**
 * Copyright 2016 Keymetrics Team, Copyright 2018 Keymetrics Team. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */

const pmx = require('pmx');
const { execFileSync } = require('child_process');
const Redis = require('redis');
const metricsMod = require('./lib/metrics');
const actions = require('./lib/actions');
const { findPidFile } = require('./lib/helpers');

pmx.initModule({
  pid: findPidFile('/var/run', 'redis'),
  widget: {
    type: 'generic',
    logo: 'https://raw.githubusercontent.com/pm2-hive/pm2-redis/master/pres/redis-white.png',
    theme: ['#D32F2F', '#1b2228', '#607D8B', '#F44336'],
    el: {
      probes: true,
      actions: true
    },
    block: {
      actions: false,
      issues: true,
      meta: false,
      main_probes: ['Total keys', 'cmd/sec', 'hits/sec', 'miss/sec', 'evt/sec', 'exp/sec']
    }
  }
}, (err, conf) => {
  let jsonconf;
  if (conf.jsonfile) {
    try {
      jsonconf = require(conf.jsonfile);
    } catch (e) {
      console.error(e.message);
      jsonconf = null;
    }
  }
  if (!jsonconf) {
    conf.port = process.env.REDIS_PORT || process.env.PM2_REDIS_PORT || conf.port;
    conf.host = process.env.REDIS_HOST || process.env.PM2_REDIS_HOST || conf.host;
    conf.password = process.env.REDIS_PW || process.env.PM2_REDIS_PW || conf.password;
    conf.url = process.env.REDIS_URL || process.env.PM2_REDIS_URL || conf.url;
    /* delete sensitive information */
    delete process.env.REDIS_PW;
    delete process.env.PM2_REDIS_PW;
    delete process.env.REDIS_URL;
    delete process.env.PM2_REDIS_URL;
  } else {
    if (jsonconf.REDIS_URL) {
      conf.url = jsonconf.REDIS_URL;
    } else {
      conf.port = jsonconf.REDIS_PORT || 6379;
      conf.host = jsonconf.REDIS_HOST || '127.0.0.1';
      conf.password = jsonconf.REDIS_PW || null;
    }
  }
  const redis = Redis.createClient(conf.url || conf);
  redis.on('error', err => {
    console.error(err.stack || err.message);
  });
  redis.on('ready', async () => {
    const metrics = new metricsMod(redis, conf.workerInterval);
    await metrics.initMetrics();
  });
  actions(redis);
});
