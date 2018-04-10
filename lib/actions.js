const pmx = require('pmx');
const assert = require('assert');
const parser = (data, el) => {
  assert(data, 'parser: missing data');
  assert(el, 'parser: missing params');
  el = el.split(',');
  try {
    data = JSON.parse(data);
    el = el.map(k => data[k] || null);
    return el;
  } catch (e) {
    return [data];
  }
};

module.exports = (redis) => {
  pmx.action('shutdown', reply => {
    try {
      redis.shutdown();
      reply(true);
    } catch (e) {
      reply(e);
    }
  });
  pmx.action('listall:keys', reply => {
    redis.keys('*', (err, value) => {
      if (err) {
        reply(err);
      } else {
        reply(value);
      }
    });
  });
  pmx.action('listall:values', (data, reply) => {
    const [key] = parser(data, 'key');
    if (!key) {
      return reply({ error: 'Key missing' });
    }
    redis.hgetall(key, (err, value) => {
      if (err) {
        reply(err);
      } else {
        reply(value);
      }
    });
  });
  pmx.action('delete:key', (data, reply) => {
    const [key] = parser(data, 'key');
    if (!key) {
      return reply({ error: 'Key missing' });
    }
    redis.unlink(key, (err, value) => {
      if (err) {
        reply(err);
      } else {
        reply(value);
      }
    });
  });
  pmx.action('delete:key:field', (data, reply) => {
    const [key, field] = parser(data, 'key,field');
    if (!key || !field) {
      return reply({ error: 'Key/Field missing' });
    }
    redis.hdel(key, field, (err, value) => {
      if (err) {
        reply(err);
      } else {
        reply(value);
      }
    });
  });
  pmx.action('delete:all', (reply) => {
    redis.flushdb((err, value) => {
      if (err) {
        reply(err);
      } else {
        reply(value);
      }
    });
  });
};
