/**
 * Copyright 2016 Keymetrics Team. All rights reserved.
 * Use of this source code is governed by a license that
 * can be found in the LICENSE file.
 */

const pmx = require('pmx');
const Probe = pmx.probe();

class Metrics {
  constructor (redis, workerInterval) {
    const self = this;
    workerInterval = parseInt(workerInterval);
    self.redis = redis;
    self.redis.infoAsync = (opt = 'all') => new Promise(resolve => {
      self.redis.info(opt, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    self.last_hits_nbr;
    self.last_miss_nbr;
    self.last_expi_nbr;
    self.last_evict_nbr;
    self.workerInterval = isNaN(workerInterval) ? 2000 : workerInterval * 1000;
    self.probes = {};
    self.initProbes();
  }

  /** Init all probes */
  initProbes () {
    const self = this;

    self.probes.redisTcp = Probe.metric({
      name: 'Redis tcp port',
      value () { return 'N/A'; }
    });

    self.probes.redisClients = Probe.metric({
      name: 'Connected clients',
      value () { return 'N/A'; }
    });

    self.probes.redisMem = Probe.metric({
      name: 'Used memory',
      value () { return 'N/A'; }
    });

    self.probes.redisUptime = Probe.metric({
      name: 'Uptime',
      value () { return 'N/A'; }
    });

    self.probes.redisMemRss = Probe.metric({
      name: 'Used memory rss',
      value () { return 'N/A'; }
    });

    self.probes.redisCmdSec = Probe.metric({
      name: 'cmd/sec',
      value () { return 'N/A'; }
    });

    self.probes.redisHitsSec = Probe.metric({
      name: 'hits/sec',
      value () { return 'N/A'; }
    });

    self.probes.redisMissSec = Probe.metric({
      name: 'miss/sec',
      value () { return 'N/A'; }
    });

    self.probes.redisExpSec = Probe.metric({
      name: 'exp/sec',
      value () { return 'N/A'; }
    });

    self.probes.redisEvtSec = Probe.metric({
      name: 'evt/sec',
      value () { return 'N/A'; }
    });

    self.probes.redisProcId = Probe.metric({
      name: 'Process Id',
      value () { return 'N/A'; }
    });

    self.probes.redisVersion = Probe.metric({
      name: 'Redis Version',
      value () { return 'N/A'; }
    });

    self.probes.redisKeys = Probe.metric({
      name: 'Total keys',
      value () { return 'N/A'; }
    });
  }
  async initMetrics () {
    const self = this;
    self.probes.redisTcp.set(self.redis.server_info.tcp_port);
    self.probes.redisProcId.set(self.redis.server_info.process_id);
    self.probes.redisVersion.set(self.redis.server_info.redis_version);
    await self.updateMetrics();
  }
  ticker () {
    const self = this;
    return new Promise((resolve) => {
      setTimeout(() => {
        return resolve(self.updateMetrics());
      }, self.workerInterval);
    });
  }
  async updateMetrics () {
    const self = this;
    let redisInfo = await self.redis.infoAsync('all');
    redisInfo = JSON.stringify(redisInfo);
    redisInfo = redisInfo.replace(/(\\r\\n){1,}/g, `\n`).replace(/#.+\n/g, '');
    redisInfo = new Map(redisInfo.split('\n').map(r => r.split(':')));
    const redis_uptime_seconds = redisInfo.get('uptime_in_seconds');
    const redis_uptime_days = redisInfo.get('uptime_in_days');
    const redis_uptime_hours = `${(redis_uptime_seconds / 3600).toFixed(1)} hours`;

    if (redis_uptime_hours > 48) { self.probes.redisUptime.set(redis_uptime_days); } else { self.probes.redisUptime.set(redis_uptime_hours); }

    /** Update connected clients metrics */
    const connected_clients = redisInfo.get('connected_clients');
    self.probes.redisClients.set(connected_clients);

    /** Update memory metrics */
    const redis_mem_bytes = redisInfo.get('used_memory');
    const redis_mem = `${(redis_mem_bytes / 1048576).toFixed(1)}MB`;
    self.probes.redisMem.set(redis_mem);
    const redis_mem_rss_bytes = redisInfo.get('used_memory_rss');
    const redis_mem_rss = `${(redis_mem_rss_bytes / 1048576).toFixed(1)}MB`;
    self.probes.redisMemRss.set(redis_mem_rss);

    /** Update all stats metrics */
    const redis_cmd_sec = redisInfo.get('instantaneous_ops_per_sec');
    self.probes.redisCmdSec.set(redis_cmd_sec);

    /** Update nbr of key hits per secs */
    const current_hits_nbr = redisInfo.get('keyspace_hits');
    let redis_hits_sec = 'N/A';
    if (self.last_hits_nbr) { redis_hits_sec = (current_hits_nbr - self.last_hits_nbr) / (self.workerInterval); }

    self.last_hits_nbr = current_hits_nbr;
    self.probes.redisHitsSec.set(redis_hits_sec);

    /** Update nbr of key misses per secs */
    self.current_miss_nbr = redisInfo.get('keyspace_misses');
    let redis_miss_sec = 'N/A';
    if (self.last_miss_nbr) { redis_miss_sec = (self.current_miss_nbr - self.last_miss_nbr) / (self.workerInterval); }

    self.last_miss_nbr = self.current_miss_nbr;
    self.probes.redisMissSec.set(redis_miss_sec);

    /** Update nbr of key expireds per secs */
    const current_expi_nbr = redisInfo.get('expired_keys');
    let redis_expi_sec = 'N/A';
    if (self.last_expi_nbr) { redis_expi_sec = (current_expi_nbr - self.last_expi_nbr) / (self.workerInterval); }

    self.last_expi_nbr = current_expi_nbr;
    self.probes.redisExpSec.set(redis_expi_sec);

    /** Update nbr of key evicted per secs */
    const current_evict_nbr = redisInfo.get('evicted_keys');
    let redis_evict_sec = 'N/A';
    if (self.last_evict_nbr) { redis_evict_sec = (current_evict_nbr - self.last_evict_nbr) / (self.workerInterval); }

    self.last_evict_nbr = current_evict_nbr;
    self.probes.redisEvtSec.set(redis_evict_sec);

    /** Update nbr of keys contained on redis */
    const redis_keys = `${redisInfo.get('db0').match(/(?=\d)\d+/)}`;
    self.probes.redisKeys.set(redis_keys);
    await self.ticker();
  }
}

module.exports = Metrics;
