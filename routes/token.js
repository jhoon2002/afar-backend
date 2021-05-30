const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
// require('dotenv').config()

// const { verifyToken } = require('./middlewares')

const key = "U-Koz56^--Yui"
const intervalNumber = "12"
const updateIntervalNumber = "-2"
const intervalUnit = "s"
const expiredInterval = intervalNumber + intervalUnit
const updateInterval = updateIntervalNumber + intervalUnit

