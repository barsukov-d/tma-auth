require('dotenv').config()

const express = require('express')
const cors = require('cors')
const axios = require('axios')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(bodyParser.json())

// Конфигурация SberID из переменных окружения
const SBERID_CLIENT_ID = process.env.SBERID_CLIENT_ID
const SBERID_CLIENT_SECRET = process.env.SBERID_CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI

app.post('/exchange-code', async (req, res) => {
	try {
		const { code } = req.body

		if (!code) {
			return res.status(400).json({ error: 'Код авторизации не предоставлен' })
		}

		// Запрос к SberID для обмена кода на токен
		const tokenResponse = await axios.post(
			'https://online.sberbank.ru/CSAFront/oauth/token',
			new URLSearchParams({
				grant_type: 'authorization_code',
				code,
				redirect_uri: REDIRECT_URI,
				client_id: SBERID_CLIENT_ID,
				client_secret: SBERID_CLIENT_SECRET,
			}).toString(),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			}
		)

		// Отправляем токен клиенту
		res.json(tokenResponse.data)
	} catch (error) {
		console.error('Ошибка при обмене кода на токен:', error.response?.data || error.message)
		res.status(500).json({ error: 'Не удалось обменять код на токен' })
	}
})

app.post('/validate-token', async (req, res) => {
	try {
		const { token } = req.body

		if (!token) {
			return res.status(400).json({ error: 'Токен не предоставлен', valid: false })
		}

		// Запрос к SberID для проверки токена
		const validateResponse = await axios.get(
			'https://online.sberbank.ru/CSAFront/oidc/tokeninfo',
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)

		// Токен действителен
		res.json({ valid: true, data: validateResponse.data })
	} catch (error) {
		console.error('Ошибка при валидации токена:', error.response?.data || error.message)
		res.status(401).json({ valid: false, error: 'Недействительный токен' })
	}
})

app.get('/user-info', async (req, res) => {
	try {
		const token = req.headers.authorization?.split(' ')[1]

		if (!token) {
			return res.status(401).json({ error: 'Токен не предоставлен' })
		}

		// Получение данных пользователя
		const userInfoResponse = await axios.get(
			'https://online.sberbank.ru/CSAFront/oidc/userinfo',
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)

		res.json(userInfoResponse.data)
	} catch (error) {
		console.error('Ошибка при получении данных пользователя:', error)
		res.status(401).json({ error: 'Не удалось получить данные пользователя' })
	}
})

app.listen(port, () => {
	console.log(`Сервер запущен на порту ${port}`)
})
