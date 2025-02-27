import React, { useEffect, useState } from 'react'
import './App.css'

function App() {
	const [webApp, setWebApp] = useState(null)
	const [user, setUser] = useState(null)

	useEffect(() => {
		// Получение доступа к Telegram WebApp API
		const tg = window.Telegram.WebApp

		// Инициализация WebApp
		tg.expand()
		tg.ready()

		setWebApp(tg)
		setUser(tg.initDataUnsafe?.user || {})

		// Установка темы
		document.body.className = tg.colorScheme || 'light'
	}, [])

	const handleMainButtonClick = () => {
		if (webApp) {
			// Отправка сообщения обратно в Telegram
			webApp.sendData(JSON.stringify({ action: 'button_clicked' }))
			webApp.close()
		}
	}

	// Настройка MainButton при загрузке WebApp
	useEffect(() => {
		if (webApp) {
			webApp.MainButton.setText('Отправить')
			webApp.MainButton.onClick(handleMainButtonClick)
			webApp.MainButton.show()
		}

		return () => {
			if (webApp) {
				webApp.MainButton.offClick(handleMainButtonClick)
			}
		}
	}, [webApp])

	return (
		<div className="App">
			<header className="App-header">
				<h1>Привет, {user?.first_name || 'Гость'}!</h1>
				<p>Это простое Telegram Mini App на React</p>
			</header>
			<main>
				<p>Нажмите кнопку внизу экрана, чтобы отправить данные в Telegram</p>
			</main>
		</div>
	)
}

export default App
