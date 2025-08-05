# NOMP Modernization Project

This project represents a complete modernization of the Node Open Mining Portal (NOMP) with a focus on creating a modern, responsive, and feature-rich mining pool interface.

## 🚀 New Features

### Frontend Modernization
- **React + Next.js** frontend with TypeScript
- **TailwindCSS** for modern, responsive design
- **Real-time WebSocket** connections for live data
- **Dark/Light mode** toggle
- **Mobile-first** responsive design
- **Component-based** architecture for maintainability

### Enhanced Miner Experience
- **Individual miner dashboards** with detailed statistics
- **Real-time hashrate charts** and performance metrics
- **Payment history** and earnings tracking
- **Worker management** with per-worker statistics
- **Efficiency tracking** and share analysis
- **Anonymous address-based** access (no login required)

### Advanced Pool Features
- **Mining.configure** protocol support
- **ASIC Boost** capability
- **Version rolling** support
- **Stratum V2** preparation (framework ready)
- **Enhanced difficulty** management
- **Multi-algorithm** support improvements

### Real-time Data & Visualization
- **WebSocket-based** live updates
- **Interactive charts** using Recharts
- **Historical data** visualization
- **Performance metrics** tracking
- **Block finding** notifications
- **Pool health** monitoring

### Admin Dashboard
- **Visual pool management** interface
- **Real-time monitoring** of pool health
- **Configuration management** via web UI
- **Alert system** for critical events
- **Connection statistics** and diagnostics
- **Pool restart/reload** capabilities

### API Enhancements
- **RESTful API** with comprehensive endpoints
- **Miner-specific** statistics API
- **Pool analytics** endpoints
- **Historical data** access
- **WebSocket API** for real-time subscriptions
- **CORS support** for cross-origin requests

## 📁 Project Structure

```
/
├── frontend/                 # React/Next.js frontend
│   ├── components/          # Reusable UI components
│   ├── pages/              # Next.js pages
│   ├── lib/                # Utilities and API clients
│   ├── store/              # State management (Zustand)
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Global styles and Tailwind config
├── libs/                    # Enhanced backend modules
│   ├── websocketServer.js  # Real-time WebSocket server
│   ├── apiExtensions.js    # Enhanced API endpoints
│   ├── enhancedWebsite.js  # Modernized web server
│   └── stratumEnhancements.js # Mining protocol improvements
├── pool_configs/           # Enhanced pool configurations
└── config_enhanced.json   # Updated main configuration
```

## 🛠 Installation & Setup

### Prerequisites
- Node.js 16+ 
- Redis server
- Coin daemons (Bitcoin, Litecoin, etc.)

### Backend Setup
1. Install dependencies:
```bash
npm install
```

2. Copy and configure the enhanced config:
```bash
cp config_enhanced.json config.json
# Edit config.json with your settings
```

3. Configure your pools:
```bash
cp pool_configs/litecoin_enhanced.json pool_configs/litecoin.json
# Edit with your pool settings
```

### Frontend Setup
1. Navigate to frontend directory:
```bash
cd frontend
npm install
```

2. Build the frontend:
```bash
npm run build
```

3. For development:
```bash
npm run dev
```

### Running the Pool
```bash
# Start the enhanced NOMP
node init.js
```

The pool will be available at:
- **Frontend**: http://localhost:8080
- **API**: http://localhost:8080/api
- **WebSocket**: ws://localhost:8080

## 🎯 Key Improvements

### User Experience
- **Intuitive navigation** with modern UI patterns
- **Real-time updates** without page refreshes
- **Mobile-optimized** interface
- **Accessibility** improvements
- **Performance optimizations**

### Mining Protocol
- **mining.configure** support for modern miners
- **ASIC Boost** compatibility
- **Version rolling** for improved efficiency
- **Enhanced difficulty** adjustment
- **Better error handling**

### Data Management
- **Comprehensive statistics** collection
- **Historical data** retention
- **Real-time metrics** calculation
- **Efficient data** structures
- **Scalable architecture**

### Monitoring & Alerts
- **Pool health** monitoring
- **Performance alerts**
- **Block finding** notifications
- **Payment confirmations**
- **System diagnostics**

## 🔧 Configuration

### Enhanced Pool Config
```json
{
  "miningConfigure": {
    "enabled": true,
    "asicBoost": true,
    "versionRolling": true
  },
  "stratumV2": {
    "enabled": false,
    "port": 3334
  },
  "notifications": {
    "blockFound": {
      "enabled": true,
      "discord": true
    }
  }
}
```

### WebSocket Configuration
The WebSocket server provides real-time updates for:
- Pool statistics
- Block discoveries
- Miner performance
- Payment notifications

### API Endpoints
- `GET /api/stats` - Global pool statistics
- `GET /api/miner/:address` - Individual miner stats
- `GET /api/pool/:name/blocks` - Pool block history
- `GET /api/pool/:name/workers` - Pool worker list
- `WebSocket /` - Real-time data subscriptions

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend && npm run build

# Start production server
NODE_ENV=production node init.js
```

### Docker Support (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install && cd frontend && npm install && npm run build
EXPOSE 8080
CMD ["node", "init.js"]
```

## 📊 Features Comparison

| Feature | Original NOMP | Enhanced NOMP |
|---------|---------------|---------------|
| Frontend | Static HTML | React/Next.js |
| Real-time Updates | Polling | WebSocket |
| Mobile Support | Basic | Fully Responsive |
| Miner Dashboard | None | Comprehensive |
| Charts | Basic | Interactive |
| Admin Panel | Limited | Full-featured |
| API | Basic | RESTful + WS |
| Mining Protocols | Basic Stratum | Enhanced + Configure |
| Notifications | None | Multi-channel |
| Theme Support | None | Dark/Light |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project maintains the original NOMP GPL-2.0 license while adding significant enhancements and modernizations.

## 🙏 Acknowledgments

- Original NOMP developers
- Stratum protocol contributors
- React and Next.js communities
- Mining pool operators providing feedback

---

**Note**: This modernization maintains backward compatibility with existing NOMP configurations while providing a path to enhanced functionality. Existing pools can be gradually migrated to take advantage of new features.