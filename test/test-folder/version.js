/* eslint-env mocha */
'use strict'

const expect = require('chai').expect

const ipfs = require('../src')('localhost', 5001)

ipfs.commands(function (err, res) {
  if (err) throw err
  console.log(res)
})
