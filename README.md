## Description

An updated fork of PM2 module `pm2-redis` that monitors a Redis server with Keymetrics.

## Install

`pm2 install bitclimb-redis`

## Configure

- `workerInterval` (Defaults to `2` in secs) : You can control at which interval the worker is updating the stats (minimum is `1`)
- `host` (Defaults to `127.0.0.1`): Set the host of your redis server.
- `port` (Defaults to `6379`): Set the port of your redis server.
- `password` (Defaults to `empty`): Set the password if you have activated the authentification
- `url` (Defaults to `empty`): Optional. You can also use a Redis Url. Allowed formats: `[redis:]//[:password@][host][:port]` `[rediss:]//[: password@][host][:port]`

#### How to set these values ?

 After having installed the module you have to type :
`pm2 set bitclimb-redis: `

e.g: 
- `pm2 set bitclimb-redis:workerInterval 5` (every 5 seconds)
- `pm2 set bitclimb-redis:host 42.42.42.42` (host of my redis server)
- `pm2 set bitclimb-redis:password "bestpassword"` (the password will be used to connect to redis)
- `pm2 set bitclimb-redis:url "redis://:authpassword@42.42.42.42:6379"` (Optional. The url will be used to connect to redis)

This module also accepts the following environment variables:(all values are prefixed with `process.env`)

- `REDIS_HOST` or `PM2_REDIS_HOST`
- `REDIS_PORT` or `PM2_REDIS_PORT`
- `REDIS_PW` or `PM2_REDIS_PW`
- `REDIS_URL` or `PM2_REDIS_URL`

**Recomnended (jsonfile)**

It is recommended to put your sensitive info hidden from prying eyes. This module now accepts loading Redis credentials via json file.
- `pm2 set bitclimb-redis:jsonfile "/home/user/yourpath/to/whatevername.json"` 

The json file format accepts the following example:
```json
{
  "REDIS_HOST": "127.0.0.1",
  "REDIS_PORT": 6379,
  "REDIS_PW": "youramazingpassword"
}
```

Or simply by Redis Url:
```json
{
  "REDIS_URL": "redis://:authpassword@42.42.42.42:6379"
}
```

## Uninstall

`pm2 uninstall bitclimb-redis`

## Changelog(difference from the original module `pm2-redis`)

- Updated [redis](https://www.npmjs.com/package/redis)
- Updated configuration based on the latest [redis](https://www.npmjs.com/package/redis)
- Allow usage of Redis Url and all other available configurations of [redis](https://www.npmjs.com/package/redis)
- Allow usage of json configration file by declaring the path as a `jsonfile` config
- Structure codebase for modularity
- Dynamic lookup of Redis PID at `/var/run`
- Async/Await and ES6 classes
- Uses `setTimeout` instead of `setInterval`
