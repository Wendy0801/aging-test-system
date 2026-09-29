// api/auth.js
import axios from 'axios'

const API_BASE_URL = 'http://192.168.140.20:5001'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    accept: 'application/json',
  },
})

/**
 * 登录
 * POST /auth/login?account=xxx&password=xxx
 */
export const login = (account, password) => {
  return http.post('/auth/login', null, {
    params: { account, password },
  })
}

export default {
  login,
}
