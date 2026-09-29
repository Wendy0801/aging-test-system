// src/api/key-component-catalogs.js
import axios from 'axios'

const API_BASE_URL = 'http://192.168.140.20:5001'

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { accept: 'application/json' },
})

/**
 * 获取目录树（返回根节点对象：{id,name,level,children:[...] }）
 */
export const getKeyComponentCatalogTree = async () => {
  const res = await http.get('/key-component-catalogs/')
  return res.data
}

/**
 * 获取所有项目名称列表
 */
export const getAllProjects = async () => {
  const res = await http.get('/key-component-catalogs/project_catalog');
  return res.data.projects; 
};

/**
 * 新增三级/四级目录
 * @param {{name: string, parent_id: number}} payload
 */
export const createKeyComponentCatalog = async (payload) => {
  const res = await http.post('/key-component-catalogs/', payload, {
    headers: { 'Content-Type': 'application/json' },
  })
  return res.data
}

/**
 * 删除目录
 * @param {number} catalogId
 */
export const deleteKeyComponentCatalog = async (catalogId) => {
  const res = await http.delete(`/key-component-catalogs/${catalogId}`)
  return res.data
}

/**
 * 编辑目录（编辑时 parent_id 不改动，但接口仍要求传）
 * @param {number} catalogId
 * @param {{name: string, parent_id: number}} payload
 */
export const updateKeyComponentCatalog = async (catalogId, payload) => {
  const res = await http.put(`/key-component-catalogs/${catalogId}`, payload, {
    headers: { 'Content-Type': 'application/json' },
  })
  return res.data
}

export default {
  getKeyComponentCatalogTree,
  getAllProjects, 
  createKeyComponentCatalog,
  deleteKeyComponentCatalog,
  updateKeyComponentCatalog,
}
