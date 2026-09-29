// api/attachments.js
import axios from 'axios'

const API_BASE_URL = 'http://192.168.140.20:5001'

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// ✅ 获取即将过期证书 GET /attachments/check_cert_expire/{within_days}
export const checkCertExpire = async (within_days = 100) => {
  const res = await http.get(`/attachments/check_cert_expire/${within_days}`, {
    headers: { accept: 'application/json' },
  })
  return res.data
}

// 上传物料附件  POST /attachments/{material_id}
export const uploadAttachment = async (material_id, payload) => {
  // payload: { attachment_type, certificate_number, certification_time, uploader, file(File) }
  if (!material_id) throw new Error('material_id is required')

  const fd = new FormData()
  if (payload?.attachment_type != null) fd.append('attachment_type', payload.attachment_type)
  if (payload?.certificate_number != null) fd.append('certificate_number', payload.certificate_number)
  if (payload?.certification_time != null) fd.append('certification_time', payload.certification_time)
  if (payload?.uploader != null) fd.append('uploader', payload.uploader)
  if (payload?.file) fd.append('file', payload.file)

  const res = await http.post(`/attachments/${material_id}`, fd, {
    headers: {
      accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

// 删除物料附件 DELETE /attachments/{attachment_id}
export const deleteAttachment = async (attachment_id) => {
  if (!attachment_id) throw new Error('attachment_id is required')
  const res = await http.delete(`/attachments/${attachment_id}`, {
    headers: { accept: 'application/json' },
  })
  return res.data
}

// 编辑物料附件元数据 PUT /attachments/{attachment_id}
export const updateAttachmentMeta = async (attachment_id, data) => {
  if (!attachment_id) throw new Error('attachment_id is required')
  const res = await http.put(`/attachments/${attachment_id}`, data, {
    headers: {
      accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
  return res.data
}

export default {
  uploadAttachment,
  deleteAttachment,
  updateAttachmentMeta,
  checkCertExpire,
}
