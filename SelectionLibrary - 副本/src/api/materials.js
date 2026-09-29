// api/materials.js
import axios from 'axios'

const API_BASE_URL = 'http://192.168.140.20:5001'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  if (config.url?.startsWith('/materials/') && (config.method === 'put' || config.method === 'post')) {
    console.log('[materials request]', config.method, config.url, config.data);
  }
  return config;
});

// 获取或查询物料列表
// params: { status, keyword, category_id, project_name }
export const getMaterials = async (params = {}) => {
  const res = await http.get('/materials/', {
    params,
    headers: { accept: 'application/json' },
  })
  return res.data
}

// 获取物料详情
export const getMaterialDetail = async (material_id) => {
  const res = await http.get(`/materials/${material_id}`, {
    headers: { accept: 'application/json' },
  })
  return res.data
}

// 新增物料
export const createMaterial = async (data) => {
  const res = await http.post('/materials/', data, {
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
  return res.data
}

// 编辑物料
export const updateMaterial = async (material_id, data) => {
  const res = await http.put(`/materials/${material_id}`, data, {
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
  return res.data
}

// 删除物料
export const deleteMaterial = async (material_id) => {
  const res = await http.delete(`/materials/${material_id}`, {
    headers: { accept: 'application/json' },
  })
  return res.data
}
