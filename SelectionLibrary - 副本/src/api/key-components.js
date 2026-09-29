// src/api/key-components.js
import axios from 'axios'

const API_BASE_URL = 'http://192.168.140.20:5001'

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { accept: 'application/json' },
})

/**
 * 获取/查询关键元器件清单
 * query:
 *  - project_name (四级目录 name)
 *  - domestic_foreign (二级目录 name：国内/国外)
 *  - is_key_component 固定：是
 *  - is_used 固定：是
 *  - keyword 关键字（名称/编码/规格）
 */
export const getKeyComponents = async (params) => {
  const res = await http.get('/key-components/', { params })
  return res.data
}

/**
 * 导出关键元器件清单（返回 zip 下载地址）
 * GET /key-components/export
 */
// src/api/key-components.js
export const exportKeyComponents = async (params) => {
  const {
    project_name,
    domestic_foreign,
    is_key_component,
    is_used,
    model_type,
    homepage,
    download_file,
  } = params || {}

  const res = await http.get('/key-components/export', {
    params: {
      project_name,
      domestic_foreign,
      is_key_component,
      is_used,
      model_type,
      homepage,
      download_file,
    },
  })
  return res.data
}

export default {
  getKeyComponents,
  exportKeyComponents,
}
