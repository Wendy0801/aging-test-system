import axios from 'axios';

// // 本地调试基础的 API 地址
// const API_BASE_URL = 'http://192.168.140.20:8899/opt_case';
// const API_TREE_URL = 'http://192.168.140.20:8899/opt_case_tree';
// const API_Serial_URL = 'http://192.168.140.20:8899/serial';

// // 本地调试登录接口
// export const login = (data) => {
//   // 使用 axios 发送 FormData 数据时，Content-Type 会自动设置为 multipart/form-data
//   return axios.post('http://192.168.140.20:8899/login', data, {
//     headers: {
//       'Content-Type': 'multipart/form-data',  // 设置为 form-data 类型
//     },
//   });
// };


// 部署 - API 地址
const API_BASE_URL = '/api/opt_case';
const API_TREE_URL = '/api/opt_case_tree';
const API_Serial_URL = '/api/serial';

// 部署 - 登录接口
export const login = (data) => {
  // 使用 axios 发送 FormData 数据时，Content-Type 会自动设置为 multipart/form-data
  return axios.post('/api/login', data, {
    headers: {
      'Content-Type': 'multipart/form-data',  // 设置为 form-data 类型
    },
  });
};




// 查询导航栏目录树
export const findDirectory = () => {
  return axios.post(`${API_TREE_URL}/find_directory`);
};

// 新增导航栏目录子节点
export const createDirectory = (level, directory_name, parent_id = null, module_sort = null) => {
  const data = new FormData();
  data.append('level', level);
  data.append('directory_name', directory_name);
  if (parent_id !== null) {
    data.append('parent_id', parent_id);
  }
  if (module_sort !== null) {
    data.append('module_sort', module_sort);
  }
  return axios.post(`${API_TREE_URL}/create_directory`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 修改目录节点
export const updateDirectory = (module_id, module_name, module_sort) => {
  const data = new FormData();
  data.append('module_id', module_id);
  data.append('module_name', module_name);
  data.append('module_sort', module_sort);
  return axios.post(`${API_TREE_URL}/update_directory`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 删除目录节点
export const deleteDirectory = (module_id) => {
  const data = new FormData();
  data.append('module_id', module_id);
  return axios.post(`${API_TREE_URL}/delete_directory`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 新建用例
export const addCase = (data) => {
  // 使用 axios 发送 FormData 数据时，Content-Type 会自动设置为 multipart/form-data
  return axios.post(`${API_BASE_URL}/add_case`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',  // 设置为 form-data 类型
    },
  });
};

// 编辑用例
export const editCase = (data) => {
  // 使用 axios 发送 FormData 数据时，Content-Type 会自动设置为 multipart/form-data
  return axios.post(`${API_BASE_URL}/edit_case`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',  // 设置为 form-data 类型
    },
  });
};

// 查询用例 —— 修改参数名为 project_id（数组）
export const findCase = (data) => {
  // data 现在是 FormData，里面可能有 keyword 和 project_id（JSON字符串）
  return axios.post(`${API_BASE_URL}/find_case`, data, {
    headers: {
      'Content-Type': 'multipart/form-data;charset=UTF-8',
    },
  });
};


// 删除用例
export const deleteCase = (data) => {
  // 使用 axios 发送 FormData 数据时，Content-Type 会自动设置为 multipart/form-data
  return axios.post(`${API_BASE_URL}/del_case`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',  // 设置为 form-data 类型
    },
  });
};

// 导出用例
export const createReport = (data) => {
  return axios.post(`${API_BASE_URL}/create_report`, data, {
    responseType: 'blob',      // 关键：告诉 axios 后端返回的是二进制
  });
};

// 查询导出报告记录
export const findReport = (data) => {
  return axios.post(`${API_BASE_URL}/find_report`, data, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// 查询导出报告详情
export const findReportInfo = (data) => {
  return axios.post(`${API_BASE_URL}/find_report_info`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

//产品型号
export const productType = (data) => {
  // 使用 axios 发送 FormData 数据时，Content-Type 会自动设置为 multipart/form-data
  return axios.post(`${API_Serial_URL}/get_product_type`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',  // 设置为 form-data 类型
    },
  });
};

//串口测试用例
export const productCaseList = (data) => {
  // 使用 axios 发送 FormData 数据时，Content-Type 会自动设置为 multipart/form-data
  return axios.post(`${API_Serial_URL}/get_product_case_list`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',  // 设置为 form-data 类型
    },
  });
};

//后台管理读取电子标签配置表
export const productSettingFile = (data) => {
  // 使用 axios 发送 FormData 数据时，Content-Type 会自动设置为 multipart/form-data
  return axios.post(`${API_Serial_URL}/get_product_setting_file`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',  // 设置为 form-data 类型
    },
  });
};

// 后台管理增、改电子标签配置表
export const updateProductSettingFile = (data) => {
  const jsonString = data.get('data'); // 获取 FormData 中的 data 字段
  // console.log('updateProductSettingFile JSON string:', jsonString); // 打印 JSON 字符串
  console.log('updateProductSettingFile FormData:', Object.fromEntries(data)); // 打印 FormData
  return axios.post(`${API_Serial_URL}/update_product_setting_file`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
