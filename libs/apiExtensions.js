var redis = require('redis');
var async = require('async');

module.exports = function(logger, portalConfig, poolConfigs) {
    var _this = this;
    
    var logSystem = 'API';
    var logComponent = 'Extensions';
    
    var redisClient = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);
    
    // Enhanced miner statistics
    this.getMinerStats = function(address, callback) {
        var minerData = {
            address: address,
            hashrate: 0,
            hashrateString: '0 H/s',
            shares: 0,
            invalidShares: 0,
            efficiency: 0,
            workers: {},
            payments: [],
            earnings: {
                total: 0,
                pending: 0,
                paid: 0
            },
            charts: {
                hashrate: [],
                shares: []
            }
        };
        
        async.parallel([
            // Get current stats from all pools
            function(callback) {
                var poolTasks = [];
                
                Object.keys(poolConfigs).forEach(function(coin) {
                    poolTasks.push(function(callback) {
                        async.parallel([
                            function(callback) {
                                redisClient.hget(coin + ':balances', address, callback);
                            },
                            function(callback) {
                                redisClient.hget(coin + ':payouts', address, callback);
                            },
                            function(callback) {
                                // Get recent hashrate data
                                var windowTime = (((Date.now() / 1000) - 3600) | 0).toString(); // 1 hour
                                redisClient.zrangebyscore([coin + ':hashrate', windowTime, '+inf'], callback);
                            }
                        ], function(err, results) {
                            if (err) return callback(err);
                            
                            var balance = parseFloat(results[0]) || 0;
                            var paid = parseFloat(results[1]) || 0;
                            var hashrateData = results[2] || [];
                            
                            // Process hashrate data for this miner
                            var minerHashrateData = hashrateData.filter(function(entry) {
                                var parts = entry.split(':');
                                return parts[1] === address;
                            });
                            
                            var totalShares = 0;
                            var invalidShares = 0;
                            var hashrateSum = 0;
                            
                            minerHashrateData.forEach(function(entry) {
                                var parts = entry.split(':');
                                var difficulty = parseFloat(parts[0]);
                                var timestamp = parseInt(parts[2]);
                                
                                if (difficulty > 0) {
                                    totalShares += difficulty;
                                    hashrateSum += difficulty;
                                } else {
                                    invalidShares += Math.abs(difficulty);
                                }
                                
                                // Add to chart data
                                minerData.charts.hashrate.push({
                                    time: timestamp,
                                    value: difficulty > 0 ? difficulty : 0
                                });
                                
                                minerData.charts.shares.push({
                                    time: timestamp,
                                    value: difficulty > 0 ? 1 : 0
                                });
                            });
                            
                            minerData.shares += totalShares;
                            minerData.invalidShares += invalidShares;
                            minerData.earnings.pending += balance;
                            minerData.earnings.paid += paid;
                            minerData.earnings.total += balance + paid;
                            
                            // Calculate hashrate (shares per second * difficulty)
                            if (minerHashrateData.length > 0) {
                                var timeSpan = 3600; // 1 hour in seconds
                                minerData.hashrate += (hashrateSum * Math.pow(2, 32)) / timeSpan;
                            }
                            
                            callback();
                        });
                    });
                });
                
                async.parallel(poolTasks, callback);
            },
            
            // Get payment history
            function(callback) {
                var paymentTasks = [];
                
                Object.keys(poolConfigs).forEach(function(coin) {
                    paymentTasks.push(function(callback) {
                        // Get recent payments for this miner
                        redisClient.zrevrangebyscore([
                            coin + ':payments:' + address,
                            '+inf',
                            '-inf',
                            'WITHSCORES',
                            'LIMIT',
                            0,
                            50
                        ], function(err, results) {
                            if (err) return callback(err);
                            
                            for (var i = 0; i < results.length; i += 2) {
                                var paymentData = JSON.parse(results[i]);
                                var timestamp = parseInt(results[i + 1]);
                                
                                minerData.payments.push({
                                    time: timestamp,
                                    amount: paymentData.amount,
                                    txHash: paymentData.txHash,
                                    confirmations: paymentData.confirmations || 0
                                });
                            }
                            
                            callback();
                        });
                    });
                });
                
                async.parallel(paymentTasks, callback);
            }
        ], function(err) {
            if (err) return callback(err);
            
            // Calculate efficiency
            if (minerData.shares + minerData.invalidShares > 0) {
                minerData.efficiency = (minerData.shares / (minerData.shares + minerData.invalidShares)) * 100;
            }
            
            // Format hashrate string
            minerData.hashrateString = _this.getReadableHashRateString(minerData.hashrate);
            
            // Sort payments by time (newest first)
            minerData.payments.sort(function(a, b) {
                return b.time - a.time;
            });
            
            // Sort chart data by time
            minerData.charts.hashrate.sort(function(a, b) {
                return a.time - b.time;
            });
            
            minerData.charts.shares.sort(function(a, b) {
                return a.time - b.time;
            });
            
            callback(null, minerData);
        });
    };
    
    // Get pool blocks with additional details
    this.getPoolBlocks = function(poolName, limit, callback) {
        if (typeof limit === 'function') {
            callback = limit;
            limit = 50;
        }
        
        var coin = poolName.toLowerCase();
        
        async.parallel([
            function(callback) {
                redisClient.smembers(coin + ':blocksConfirmed', callback);
            },
            function(callback) {
                redisClient.smembers(coin + ':blocksPending', callback);
            },
            function(callback) {
                redisClient.smembers(coin + ':blocksOrphaned', callback);
            }
        ], function(err, results) {
            if (err) return callback(err);
            
            var confirmedBlocks = results[0] || [];
            var pendingBlocks = results[1] || [];
            var orphanedBlocks = results[2] || [];
            
            var allBlocks = [];
            
            // Process confirmed blocks
            confirmedBlocks.forEach(function(blockData) {
                var parts = blockData.split(':');
                allBlocks.push({
                    hash: parts[0],
                    txHash: parts[1],
                    height: parseInt(parts[2]),
                    status: 'confirmed',
                    time: Date.now() / 1000, // This should come from block data
                    reward: 0, // This should come from block data
                    difficulty: 0, // This should come from block data
                    confirmations: 100 // This should come from daemon
                });
            });
            
            // Process pending blocks
            pendingBlocks.forEach(function(blockData) {
                var parts = blockData.split(':');
                allBlocks.push({
                    hash: parts[0],
                    txHash: parts[1],
                    height: parseInt(parts[2]),
                    status: 'pending',
                    time: Date.now() / 1000,
                    reward: 0,
                    difficulty: 0,
                    confirmations: 0
                });
            });
            
            // Process orphaned blocks
            orphanedBlocks.forEach(function(blockData) {
                var parts = blockData.split(':');
                allBlocks.push({
                    hash: parts[0],
                    txHash: parts[1],
                    height: parseInt(parts[2]),
                    status: 'orphaned',
                    time: Date.now() / 1000,
                    reward: 0,
                    difficulty: 0,
                    confirmations: 0
                });
            });
            
            // Sort by height (newest first)
            allBlocks.sort(function(a, b) {
                return b.height - a.height;
            });
            
            // Limit results
            if (limit > 0) {
                allBlocks = allBlocks.slice(0, limit);
            }
            
            callback(null, allBlocks);
        });
    };
    
    // Get pool workers with enhanced data
    this.getPoolWorkers = function(poolName, callback) {
        var coin = poolName.toLowerCase();
        var windowTime = (((Date.now() / 1000) - 3600) | 0).toString(); // 1 hour
        
        async.parallel([
            function(callback) {
                redisClient.zrangebyscore([coin + ':hashrate', windowTime, '+inf'], callback);
            },
            function(callback) {
                redisClient.hgetall(coin + ':workers', callback);
            }
        ], function(err, results) {
            if (err) return callback(err);
            
            var hashrateData = results[0] || [];
            var workerData = results[1] || {};
            
            var workers = {};
            
            // Process hashrate data
            hashrateData.forEach(function(entry) {
                var parts = entry.split(':');
                var difficulty = parseFloat(parts[0]);
                var worker = parts[1];
                var timestamp = parseInt(parts[2]);
                
                if (!workers[worker]) {
                    workers[worker] = {
                        shares: 0,
                        invalidShares: 0,
                        hashrate: 0,
                        hashrateString: '0 H/s',
                        lastShare: 0,
                        efficiency: 0,
                        ip: workerData[worker + ':ip'] || 'Unknown',
                        difficulty: parseFloat(workerData[worker + ':difficulty']) || 0
                    };
                }
                
                if (difficulty > 0) {
                    workers[worker].shares += difficulty;
                } else {
                    workers[worker].invalidShares += Math.abs(difficulty);
                }
                
                workers[worker].lastShare = Math.max(workers[worker].lastShare, timestamp);
            });
            
            // Calculate hashrate and efficiency for each worker
            Object.keys(workers).forEach(function(worker) {
                var workerStats = workers[worker];
                
                // Calculate hashrate (simplified)
                var timeSpan = 3600; // 1 hour
                workerStats.hashrate = (workerStats.shares * Math.pow(2, 32)) / timeSpan;
                workerStats.hashrateString = _this.getReadableHashRateString(workerStats.hashrate);
                
                // Calculate efficiency
                var totalShares = workerStats.shares + workerStats.invalidShares;
                if (totalShares > 0) {
                    workerStats.efficiency = (workerStats.shares / totalShares) * 100;
                }
            });
            
            callback(null, workers);
        });
    };
    
    // Utility function to format hashrate
    this.getReadableHashRateString = function(hashrate) {
        var i = -1;
        var byteUnits = [' H/s', ' KH/s', ' MH/s', ' GH/s', ' TH/s', ' PH/s'];
        do {
            hashrate = hashrate / 1000;
            i++;
        } while (hashrate > 1000 && i < byteUnits.length - 1);
        return hashrate.toFixed(2) + byteUnits[i];
    };
    
    logger.debug(logSystem, logComponent, 'API extensions initialized');
    
    return this;
};