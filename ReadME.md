# Exchange Platform Frontend Documentation

A modern React-based web application for currency exchange operations with real-time tracking, interactive charts, and AI-powered features.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Setup](#setup)
  - [Environment Setup](#environment-setup)
  - [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Components](#components)
- [Available Scripts](#available-scripts)
- [Accessibility Features](#accessibility-features)
- [Theme Support](#theme-support)

## Features

- Real-time exchange rate tracking
- Interactive charts with historical data
- User authentication system
- Transaction management
- AI-powered rate predictions (LSTM model integration)
- Chatbot integration
- Dark mode support
- Accessibility features including text-to-speech
- Responsive Material-UI design

## Requirements

- Node.js 18.0 or higher
- npm or yarn package manager
- Modern web browser with JavaScript enabled
- Backend API endpoint (running on localhost:5000)

## Setup

### Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/EECE430LSpring2025/exchange-openapi-group-8.git
cd exchange-openapi-group-8
```

2. Navigate to the frontend directory:

```bash
cd khaledammoura/exchange-frontend
```

3. Install dependencies:

```bash
npm install
# or
yarn install
```

### Configuration

Create a `.env` file in the frontend directory with the following variables:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WEBSOCKET_URL=ws://localhost:5000
```

## Running the Application

```bash
npm start
# or
yarn start
```

This will start the development server on `http://localhost:3000`.

## Project Structure

```
exchange-frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── UserCredentialsDialog/
│   │   ├── ChatbotModal/
│   │   ├── StatisticsModal/
│   │   └── ...
│   ├── context/
│   ├── services/
│   ├── storage/
│   ├── utils/
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Components

- **UserCredentialsDialog**: Handles user authentication
- **ChatbotModal**: AI-powered chat interface
- **StatisticsModal**: Displays exchange rate statistics
- **ExchangeRateDisplay**: Shows current rates
- **TransactionGrid**: Manages exchange transactions
- **PredictionCard**: Displays AI-based rate predictions
- **ChartComponent**: Visualizes historical data

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

## Accessibility Features

- Text-to-speech functionality
- Keyboard navigation support
- ARIA labels and roles
- Configurable speech rate and voice
- High contrast mode support

## Theme Support

- Light and dark mode
- Persistent theme preference storage
- Custom Material-UI theming
- Responsive design across devices

## Integration with Backend

The frontend communicates with the backend API endpoints:

- User Authentication: `/user/signin`, `/user/signup`
- Transactions: `/transaction/`, `/transaction/offer`
- Exchange Rates: `/rate/exchange_rate`, `/rate/graph`
- AI Features: `/rate/predict`, `/chatbot/chat`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.