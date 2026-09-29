// src/api/role-permissions.js
import axios from 'axios'

const API_BASE_URL = 'http://192.168.140.20:5001'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

/**
 * 获取所有可配置的权限项
 * GET /role-permissions/permissions
 */
export const getPermissions = () => {
  return http.get('/role-permissions/permissions')
}

/**
 * 查询某个角色已配置的权限
 * GET /role-permissions/{role_id}
 */
export const getRolePermissions = (roleId) => {
  return http.get(`/role-permissions/${roleId}`)
}

/**
 * 配置角色权限（覆盖原有权限）
 * POST /role-permissions/
 * body: { role_id, permission_ids: [] }
 */
export const setRolePermissions = (payload) => {
  return http.post('/role-permissions/', payload)
}

export default {
  getPermissions,
  getRolePermissions,
  setRolePermissions,
}
