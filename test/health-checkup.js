/*
 * Copyright (c) 2016, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Promise = require('bluebird')
const test = require('blue-tape')

test('should run health checkup with a healthy and unhealthy check', (t) => {
  t.plan(8)

  delete require.cache[ require.resolve('../src/health-checkup') ]
  const Health = require('../src/health-checkup')

  const checks = []
  checks.push({
    name: 'healthy check',
    check: () => new Promise((resolve) => {
      t.pass('ran healthy check')

      return resolve()
    })
  })
  checks.push({
    name: 'unhealthy check',
    check: () => new Promise((resolve, reject) => {
      t.pass('ran unhealthy check')

      return reject(new Error('unhealthy by nature'))
    })
  })

  checks.forEach(({ name, check }) => Health.addCheck(name, check))

  return Health.checkup()
    .then(report => {
      t.equal(report.length, 2, 'health report has only 1 check')
      t.equal(report[ 0 ].name, 'healthy check', 'healthy check has correct name')
      t.equal(report[ 0 ].is_healthy, true, 'healthy check has correct health')
      t.equal(report[ 1 ].name, 'unhealthy check', 'healthy check has correct name')
      t.equal(report[ 1 ].is_healthy, false, 'unhealthy check has correct health')
      t.equal(report[ 1 ].reason, 'unhealthy by nature', 'unhealthy check has correct reason')
    })
})

test('should fail adding check when using invalid parameters', (t) => {
  t.plan(2)

  delete require.cache[ require.resolve('../src/health-checkup') ]
  const Health = require('../src/health-checkup')

  const name = 'check'
  const check = () => Promise.resolve()

  try {
    Health.addCheck(name, null)
  } catch (error) {
    t.pass('failed when adding invalid check function')
  }

  try {
    Health.addCheck(null, check)
  } catch (error) {
    t.pass('failed when adding invalid check name')
  }

  t.end()
})

test('should not cache unhealthy check', (t) => {
  t.plan(2)

  delete require.cache[ require.resolve('../src/health-checkup') ]
  const Health = require('../src/health-checkup')

  const check = () => {
    t.pass('ran unhealthy check')
    return Promise.reject()
  }

  Health.addCheck('unhealthy check', check)

  return Health.checkup()
    .catch(() => {
      return Health.checkup()
        .catch(() => {})
    })
})

test('should cache healthy check', (t) => {
  t.plan(1)

  delete require.cache[ require.resolve('../src/health-checkup') ]
  const Health = require('../src/health-checkup')

  const check = () => {
    t.pass('ran healthy check')
    return Promise.resolve()
  }

  Health.addCheck('healthy check', check)

  return Health.checkup()
    .then(() => Health.checkup())
})

test('should not cache healthy check after 150 ms', (t) => {
  t.plan(2)

  delete require.cache[ require.resolve('../src/health-checkup') ]
  const Health = require('../src/health-checkup')

  const check = () => {
    t.pass('ran healthy check')
    return Promise.resolve()
  }

  Health.addCheck('healthy check', check, { cacheMaxAge: 150 })

  return Health.checkup()
    .delay(150)
    .then(() => Health.checkup())
})


