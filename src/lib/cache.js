const Promise   = require('bluebird');
module.exports = Promise.promisifyAll(require('redis').createClient({
    db: 6
}));