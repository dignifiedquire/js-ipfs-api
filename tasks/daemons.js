'use strict'

const gulp = require('gulp')
const fs = require('fs')
const path = require('path')

let daemons

function startDisposableDaemons (callback) {
  const ipfsd = require('ipfsd-ctl')

  // a, b, c
  const ipfsNodes = {}

  // a, b, c
  const apiAddrs = {}

  let counter = 0

  function finish () {
    counter++
    if (counter === 3) {
      const targetPath = path.join(__dirname, '/../test/tmp-disposable-nodes-addrs.json')
      fs.writeFileSync(targetPath, JSON.stringify(apiAddrs))
      callback(ipfsNodes)
    }
  }

  function startIndependentNode (nodes, addrs, key, cb) {
    ipfsd.disposable((err1, node) => {
      if (err1) {
        throw err1
      }

      nodes[key] = node

      console.log('  ipfs init done - (bootstrap and mdns off) - ' + key)

      nodes[key].setConfig('Bootstrap', null, (err2) => {
        if (err2) {
          throw err2
        }
        nodes[key].setConfig('Discovery', '{}', (err3) => {
          if (err3) {
            throw err3
          }

          const headers = {
            HTTPHeaders: {
              'Access-Control-Allow-Origin': ['*']
            }
          }
          nodes[key].setConfig('API', JSON.stringify(headers), (err4) => {
            if (err4) {
              throw err4
            }

            nodes[key].startDaemon((err5, ignore) => {
              if (err5) {
                throw err5
              }

              addrs[key] = nodes[key].apiAddr
              cb()
            })
          })
        })
      })
    })
  }

  startIndependentNode(ipfsNodes, apiAddrs, 'a', finish)
  startIndependentNode(ipfsNodes, apiAddrs, 'b', finish)
  startIndependentNode(ipfsNodes, apiAddrs, 'c', finish)
}

function stopDisposableDaemons (ds, callback) {
  let counter = 0
  function finish () {
    counter++
    if (counter === 3) {
      callback()
    }
  }

  function stopIPFSNode (list, key, cb) {
    let nodeStopped
    list[key].stopDaemon((err) => {
      if (err) {
        throw err
      }
      if (!nodeStopped) {
        nodeStopped = true
        cb()
      }
    })
  }

  stopIPFSNode(ds, 'a', finish)
  stopIPFSNode(ds, 'b', finish)
  stopIPFSNode(ds, 'c', finish)
}

gulp.task('daemons:start', (done) => {
  startDisposableDaemons((d) => {
    daemons = d
    done()
  })
})

gulp.task('daemons:stop', (done) => {
  stopDisposableDaemons(daemons, () => {
    daemons = null
    done()
  })
})
