// api/users.js
import axios from 'axios'

const API_BASE_URL = 'http://192.168.140.20:5001'

// 统一 axios 实例（建议后面其他 api 也统一这样写）
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

// 获取/查询用户列表
// keyword: 搜索关键字（姓名/账号/所属企业）
// role_id: 角色ID筛选
export const getUsers = (params = {}) => {
  return http.get('/users/', { params })
}

// 新增用户
export const createUser = (data) => {
  return http.post('/users/', data)
}

// 编辑用户
export const updateUser = (userId, data) => {
  return http.put(`/users/${userId}`, data)
}

// 删除用户
export const deleteUser = (userId) => {
  return http.delete(`/users/${userId}`)
}

// （可选）把 http 导出去方便别处复用/加拦截器
export { http }
