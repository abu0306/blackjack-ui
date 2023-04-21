import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import "./style.css"
// import init from '@aleohq/wasm';

// // Initialize WASM
// await init("../node_modules/@aleohq/wasm/aleo_wasm_bg.wasm");

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
