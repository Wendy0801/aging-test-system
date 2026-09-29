// api.js
import axios from 'axios';
import { ElMessage } from 'element-plus';

// =============================================
//                  基础配置
// =============================================
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://192.168.140.20:5001', 
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// 统一错误处理
http.interceptors.response.use(
  response => response.data,           // 直接返回 data
  error => {
    const msg = error.response?.data?.detail 
      || error.response?.data?.message 
      || error.message 
      || '请求失败，请稍后重试';

    ElMessage.error(msg);
    return Promise.reject(error);
  }
);

// =============================================
//                  目录相关接口
// =============================================

/**
 * 获取完整目录树
 * @returns {Promise<Array>} 树形结构数组
 */
export const getCategoryTree = () => http.get('/categories/');

/**
 * 新增目录
 * @param {Object} data
 * @param {string} data.name        目录名称
 * @param {number|null} data.parent_id 父级ID（一级目录传 null）
 * @returns {Promise<Object>} 新创建的目录节点
 */
export const createCategory = (data) => http.post('/categories/', data);

/**
 * 修改目录（目前只支持改名称）
 * @param {number} id 
 * @param {Object} data
 * @param {string} [data.name]
 * @returns {Promise<Object>}
 */
export const updateCategory = (id, data) => http.put(`/categories/${id}`, data);

/**
 * 删除目录（会级联删除子目录）
 * @param {number} id 
 * @returns {Promise<void>}
 */
export const deleteCategory = (id) => http.delete(`/categories/${id}`);

// 如果以后有批量操作或其他接口，可以继续在这里扩展

export default {
  getCategoryTree,
  createCategory,
  updateCategory,
  deleteCategory,
};