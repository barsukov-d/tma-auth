import React, { useEffect, useState } from 'react'
import './App.css'

function App() {
	const [webApp, setWebApp] = useState(null)
	const [user, setUser] = useState(null)
	const [sberIdToken, setSberIdToken] = useState(null)
	const [isLoading, setIsLoading] = useState(false)

	// SberID client ID и redirect URI
	const SBERID_CLIENT_ID = 'YOUR_SBERID_CLIENT_ID' // Замените на ваш CLIENT_ID
	const REDIRECT_URI = encodeURIComponent(window.location.origin)
	const SBERID_AUTH_URL = `https://online.sberbank.ru/CSAFront/oauth/authorize?response_type=code&client_id=${SBERID_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid+name+email`

	useEffect(() => {
		// Проверяем, что мы запущены в контексте Telegram WebApp
		if (!window.Telegram || !window.Telegram.WebApp) {
			console.error('Приложение должно быть запущено в Telegram WebApp')
			return
		}

		// Получение доступа к Telegram WebApp API
		const tg = window.Telegram.WebApp

		// Инициализация WebApp
		tg.expand()
		tg.ready()

		setWebApp(tg)
		setUser(tg.initDataUnsafe?.user || {})

		// Установка темы
		document.body.className = tg.colorScheme || 'light'

		// Проверка наличия кода авторизации в URL
		const urlParams = new URLSearchParams(window.location.search)
		const authCode = urlParams.get('code')

		if (authCode) {
			exchangeCodeForToken(authCode)
		}

		// Проверяем, есть ли сохраненный токен
		const savedToken = localStorage.getItem('sberIdToken')
		if (savedToken) {
			setSberIdToken(savedToken)
			validateToken(savedToken) // Функция для проверки действительности токена
		}
	}, [])

	const exchangeCodeForToken = async (code) => {
		setIsLoading(true)
		try {
			// В реальном приложении этот запрос должен быть к вашему бэкенду,
			// так как секретный ключ не должен храниться в клиентском коде
			const response = await fetch('YOUR_BACKEND_URL/exchange-code', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ code }),
			})

			const data = await response.json()

			if (data.access_token) {
				saveToken(data.access_token)
				// Информируем Telegram, что пользователь успешно авторизовался
				if (webApp) {
					webApp.sendData(
						JSON.stringify({
							action: 'sberid_auth_success',
							token: data.access_token,
						})
					)
				}
			}
		} catch (error) {
			console.error('Ошибка при обмене кода на токен:', error)
		} finally {
			setIsLoading(false)
		}
	}

	const handleSberIdLogin = () => {
		// Открываем страницу авторизации SberID
		window.location.href = SBERID_AUTH_URL
	}

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

	const saveToken = (token) => {
		localStorage.setItem('sberIdToken', token)
		setSberIdToken(token)
	}

	const validateToken = async (token) => {
		// Этот метод должен проверить действительность токена
		// через ваш бэкенд или напрямую в SberID
		try {
			const response = await fetch('YOUR_BACKEND_URL/validate-token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token }),
			})

			const data = await response.json()

			if (!data.valid) {
				localStorage.removeItem('sberIdToken')
				setSberIdToken(null)
			}
		} catch (error) {
			console.error('Ошибка при валидации токена:', error)
			localStorage.removeItem('sberIdToken')
			setSberIdToken(null)
		}
	}

	const handleLogout = () => {
		localStorage.removeItem('sberIdToken')
		setSberIdToken(null)

		// Сообщаем Telegram, что пользователь вышел
		if (webApp) {
			webApp.sendData(
				JSON.stringify({
					action: 'sberid_logout',
				})
			)
		}
	}

	return (
		<div className="App">
			<header className="App-header">
				<h1>Привет, {user?.first_name || 'Гость'}!</h1>
				<p>Это простое Telegram Mini App с авторизацией через SberID</p>
			</header>
			<main>
				{isLoading ? (
					<p>Загрузка...</p>
				) : sberIdToken ? (
					<div>
						<p>Вы успешно авторизованы через SberID!</p>
						<p>Нажмите кнопку внизу экрана, чтобы отправить данные в Telegram</p>
						<button onClick={handleLogout}>Выйти</button>
					</div>
				) : (
					<div>
						<p>Авторизуйтесь через SberID для использования приложения</p>
						<button onClick={handleSberIdLogin}>Войти через SberID</button>
					</div>
				)}
			</main>
		</div>
	)
}

export default App
