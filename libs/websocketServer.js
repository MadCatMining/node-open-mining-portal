var socketIo = require('socket.io');
var redis = require('redis');

module.exports = function(logger, portalConfig, poolConfigs, server) {
    var _this = this;
    
    var logSystem = 'WebSocket';
    var logComponent = 'Server';
    
    // Initialize Socket.IO
    var io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        },
        transports: ['websocket', 'polling']
    });
    
    // Redis client for pub/sub
    var redisClient = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);
    var redisSubscriber = redis.createClient(portalConfig.redis.port, portalConfig.redis.host);
    
    // Track connected clients and their subscriptions
    var connectedClients = {};
    var minerSubscriptions = {};
    var poolSubscriptions = {};
    
    // Subscribe to Redis channels for real-time updates
    redisSubscriber.subscribe('pool_stats_update');
    redisSubscriber.subscribe('block_found');
    redisSubscriber.subscribe('miner_update');
    
    redisSubscriber.on('message', function(channel, message) {
        try {
            var data = JSON.parse(message);
            
            switch(channel) {
                case 'pool_stats_update':
                    io.emit('stats', data);
                    break;
                    
                case 'block_found':
                    io.emit('block_found', data);
                    // Notify specific pool subscribers
                    if (poolSubscriptions[data.pool]) {
                        poolSubscriptions[data.pool].forEach(function(socketId) {
                            var socket = connectedClients[socketId];
                            if (socket) {
                                socket.emit('pool_update', data.pool, data);
                            }
                        });
                    }
                    break;
                    
                case 'miner_update':
                    // Notify specific miner subscribers
                    if (minerSubscriptions[data.address]) {
                        minerSubscriptions[data.address].forEach(function(socketId) {
                            var socket = connectedClients[socketId];
                            if (socket) {
                                socket.emit('miner_update', data.address, data);
                            }
                        });
                    }
                    break;
            }
        } catch (e) {
            logger.error(logSystem, logComponent, 'Error parsing Redis message: ' + e.message);
        }
    });
    
    // Handle client connections
    io.on('connection', function(socket) {
        var clientId = socket.id;
        connectedClients[clientId] = socket;
        
        logger.debug(logSystem, logComponent, 'Client connected: ' + clientId);
        
        // Send initial stats
        _this.sendInitialStats(socket);
        
        // Handle miner subscription
        socket.on('subscribe_miner', function(address) {
            if (!minerSubscriptions[address]) {
                minerSubscriptions[address] = [];
            }
            if (minerSubscriptions[address].indexOf(clientId) === -1) {
                minerSubscriptions[address].push(clientId);
                logger.debug(logSystem, logComponent, 'Client ' + clientId + ' subscribed to miner: ' + address);
            }
        });
        
        // Handle miner unsubscription
        socket.on('unsubscribe_miner', function(address) {
            if (minerSubscriptions[address]) {
                var index = minerSubscriptions[address].indexOf(clientId);
                if (index !== -1) {
                    minerSubscriptions[address].splice(index, 1);
                    logger.debug(logSystem, logComponent, 'Client ' + clientId + ' unsubscribed from miner: ' + address);
                }
            }
        });
        
        // Handle pool subscription
        socket.on('subscribe_pool', function(poolName) {
            if (!poolSubscriptions[poolName]) {
                poolSubscriptions[poolName] = [];
            }
            if (poolSubscriptions[poolName].indexOf(clientId) === -1) {
                poolSubscriptions[poolName].push(clientId);
                logger.debug(logSystem, logComponent, 'Client ' + clientId + ' subscribed to pool: ' + poolName);
            }
        });
        
        // Handle pool unsubscription
        socket.on('unsubscribe_pool', function(poolName) {
            if (poolSubscriptions[poolName]) {
                var index = poolSubscriptions[poolName].indexOf(clientId);
                if (index !== -1) {
                    poolSubscriptions[poolName].splice(index, 1);
                    logger.debug(logSystem, logComponent, 'Client ' + clientId + ' unsubscribed from pool: ' + poolName);
                }
            }
        });
        
        // Handle disconnection
        socket.on('disconnect', function() {
            logger.debug(logSystem, logComponent, 'Client disconnected: ' + clientId);
            
            // Clean up subscriptions
            delete connectedClients[clientId];
            
            // Remove from miner subscriptions
            Object.keys(minerSubscriptions).forEach(function(address) {
                var index = minerSubscriptions[address].indexOf(clientId);
                if (index !== -1) {
                    minerSubscriptions[address].splice(index, 1);
                }
            });
            
            // Remove from pool subscriptions
            Object.keys(poolSubscriptions).forEach(function(poolName) {
                var index = poolSubscriptions[poolName].indexOf(clientId);
                if (index !== -1) {
                    poolSubscriptions[poolName].splice(index, 1);
                }
            });
        });
    });
    
    // Send initial stats to new clients
    this.sendInitialStats = function(socket) {
        // Get current stats from Redis
        redisClient.get('pool_stats', function(err, result) {
            if (!err && result) {
                try {
                    var stats = JSON.parse(result);
                    socket.emit('stats', stats);
                } catch (e) {
                    logger.error(logSystem, logComponent, 'Error parsing initial stats: ' + e.message);
                }
            }
        });
    };
    
    // Broadcast stats update to all clients
    this.broadcastStats = function(stats) {
        // Store in Redis for new clients
        redisClient.setex('pool_stats', 300, JSON.stringify(stats)); // 5 minute expiry
        
        // Publish to Redis for other processes
        redisClient.publish('pool_stats_update', JSON.stringify(stats));
    };
    
    // Broadcast block found
    this.broadcastBlockFound = function(blockData) {
        redisClient.publish('block_found', JSON.stringify(blockData));
    };
    
    // Broadcast miner update
    this.broadcastMinerUpdate = function(address, minerData) {
        redisClient.publish('miner_update', JSON.stringify({
            address: address,
            data: minerData
        }));
    };
    
    // Get connection stats
    this.getConnectionStats = function() {
        return {
            connectedClients: Object.keys(connectedClients).length,
            minerSubscriptions: Object.keys(minerSubscriptions).length,
            poolSubscriptions: Object.keys(poolSubscriptions).length
        };
    };
    
    logger.debug(logSystem, logComponent, 'WebSocket server initialized');
    
    return this;
};