import React from 'react'
import ReactDOM from 'react-dom/client'
// Убираем импорт CSS, если файла нет
// import './index.css'
import App from './App.jsx'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>
)
