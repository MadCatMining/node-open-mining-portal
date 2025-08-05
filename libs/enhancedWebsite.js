var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var compress = require('compression');
var cors = require('cors');

var api = require('./api.js');
var apiExtensions = require('./apiExtensions.js');
var websocketServer = require('./websocketServer.js');

module.exports = function(logger) {
    var portalConfig = JSON.parse(process.env.portalConfig);
    var poolConfigs = JSON.parse(process.env.pools);
    
    var websiteConfig = portalConfig.website;
    var logSystem = 'Website';
    
    var portalApi = new api(logger, portalConfig, poolConfigs);
    var apiExt = new apiExtensions(logger, portalConfig, poolConfigs);
    var portalStats = portalApi.stats;
    
    var app = express();
    var server = require('http').createServer(app);
    
    // Initialize WebSocket server
    var wsServer = new websocketServer(logger, portalConfig, poolConfigs, server);
    
    // Middleware
    app.use(compress());
    app.use(cors({
        origin: process.env.NODE_ENV === 'production' ? 
            ['https://yourdomain.com'] : 
            ['http://localhost:3001', 'http://localhost:3000'],
        credentials: true
    }));
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
    
    // Serve static files from frontend build
    if (fs.existsSync(path.join(__dirname, '../frontend/out'))) {
        app.use(express.static(path.join(__dirname, '../frontend/out')));
    }
    
    // Enhanced API routes
    app.get('/api/stats', function(req, res) {
        res.header('Content-Type', 'application/json');
        res.end(portalStats.statsString);
    });
    
    app.get('/api/pool_stats', function(req, res) {
        res.header('Content-Type', 'application/json');
        res.end(JSON.stringify(portalStats.statPoolHistory));
    });
    
    // New enhanced endpoints
    app.get('/api/pool/:poolName', function(req, res) {
        var poolName = req.params.poolName;
        var pool = portalStats.stats && portalStats.stats.pools[poolName];
        
        if (!pool) {
            return res.status(404).json({ error: 'Pool not found' });
        }
        
        res.json(pool);
    });
    
    app.get('/api/pool/:poolName/blocks', function(req, res) {
        var poolName = req.params.poolName;
        var limit = parseInt(req.query.limit) || 50;
        
        apiExt.getPoolBlocks(poolName, limit, function(err, blocks) {
            if (err) {
                logger.error(logSystem, 'API', 'Error getting pool blocks: ' + err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            res.json(blocks);
        });
    });
    
    app.get('/api/pool/:poolName/workers', function(req, res) {
        var poolName = req.params.poolName;
        
        apiExt.getPoolWorkers(poolName, function(err, workers) {
            if (err) {
                logger.error(logSystem, 'API', 'Error getting pool workers: ' + err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            res.json(workers);
        });
    });
    
    app.get('/api/miner/:address', function(req, res) {
        var address = req.params.address;
        
        // Validate address format
        if (!address || address.length < 26) {
            return res.status(400).json({ error: 'Invalid address format' });
        }
        
        apiExt.getMinerStats(address, function(err, stats) {
            if (err) {
                logger.error(logSystem, 'API', 'Error getting miner stats: ' + err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            res.json(stats);
        });
    });
    
    app.get('/api/miner/:address/payments', function(req, res) {
        var address = req.params.address;
        
        apiExt.getMinerStats(address, function(err, stats) {
            if (err) {
                logger.error(logSystem, 'API', 'Error getting miner payments: ' + err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            res.json(stats.payments || []);
        });
    });
    
    app.get('/api/miner/:address/charts', function(req, res) {
        var address = req.params.address;
        var period = req.query.period || '24h';
        
        apiExt.getMinerStats(address, function(err, stats) {
            if (err) {
                logger.error(logSystem, 'API', 'Error getting miner charts: ' + err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            
            // Filter chart data based on period
            var now = Date.now() / 1000;
            var timeLimit;
            
            switch (period) {
                case '1h':
                    timeLimit = now - 3600;
                    break;
                case '6h':
                    timeLimit = now - (6 * 3600);
                    break;
                case '24h':
                    timeLimit = now - (24 * 3600);
                    break;
                case '7d':
                    timeLimit = now - (7 * 24 * 3600);
                    break;
                default:
                    timeLimit = now - (24 * 3600);
            }
            
            var filteredCharts = {
                hashrate: stats.charts.hashrate.filter(function(point) {
                    return point.time >= timeLimit;
                }),
                shares: stats.charts.shares.filter(function(point) {
                    return point.time >= timeLimit;
                })
            };
            
            res.json(filteredCharts);
        });
    });
    
    // Admin endpoints
    app.get('/api/admin/pools', function(req, res) {
        // Add authentication check here
        res.json({ result: poolConfigs });
    });
    
    app.put('/api/admin/pool/:poolName', function(req, res) {
        // Add authentication check here
        var poolName = req.params.poolName;
        var config = req.body;
        
        // Validate and update pool configuration
        // This would require implementing configuration management
        res.json({ success: true, message: 'Pool configuration updated' });
    });
    
    app.post('/api/admin/pool/:poolName/restart', function(req, res) {
        // Add authentication check here
        var poolName = req.params.poolName;
        
        // Send restart command to pool worker
        process.send({
            type: 'reloadpool',
            coin: poolName
        });
        
        res.json({ success: true, message: 'Pool restart initiated' });
    });
    
    // WebSocket connection stats
    app.get('/api/websocket/stats', function(req, res) {
        res.json(wsServer.getConnectionStats());
    });
    
    // Live stats endpoint (Server-Sent Events fallback)
    app.get('/api/live_stats', function(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });
        
        res.write('\n');
        
        var uid = Math.random().toString();
        portalApi.liveStatConnections[uid] = res;
        
        req.on('close', function() {
            delete portalApi.liveStatConnections[uid];
        });
    });
    
    // Catch-all handler for React Router
    app.get('*', function(req, res) {
        if (fs.existsSync(path.join(__dirname, '../frontend/out/index.html'))) {
            res.sendFile(path.join(__dirname, '../frontend/out/index.html'));
        } else {
            res.status(404).send('Frontend not built. Please run: cd frontend && npm run build');
        }
    });
    
    // Enhanced stats collection with WebSocket broadcasting
    var originalGetGlobalStats = portalStats.getGlobalStats;
    portalStats.getGlobalStats = function(callback) {
        originalGetGlobalStats.call(this, function() {
            // Broadcast updated stats via WebSocket
            if (portalStats.stats) {
                wsServer.broadcastStats(portalStats.stats);
            }
            
            if (callback) callback();
        });
    };
    
    // Error handling
    app.use(function(err, req, res, next) {
        logger.error(logSystem, 'Express', 'Error: ' + err.stack);
        res.status(500).json({ error: 'Internal server error' });
    });
    
    // Start server
    try {
        server.listen(portalConfig.website.port, portalConfig.website.host, function() {
            logger.debug(logSystem, 'Server', 'Enhanced website started on ' + 
                portalConfig.website.host + ':' + portalConfig.website.port);
        });
    } catch (e) {
        logger.error(logSystem, 'Server', 'Could not start website on ' + 
            portalConfig.website.host + ':' + portalConfig.website.port + 
            ' - ' + e.message);
    }
};