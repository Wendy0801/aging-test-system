<template>
 <div class="page-container">
   <Header />
   <el-container>
     <!-- 左侧边栏（串口设置和产品型号） -->
     <el-aside :class="{'hidden': !leftSidebarVisible}" class="sidebar left-sidebar">
       <button class="toggle-button left-toggle" @click="toggleLeftSidebar">
         <el-icon class="custom-icon">
           <el-icon-arrow-left v-if="leftSidebarVisible" />
           <el-icon-arrow-right v-else />
         </el-icon>
       </button>
       <div v-if="leftSidebarVisible" class="left-content">
         <el-card class="settings-card">
           <h3>串口设置</h3>
           <el-form label-position="top">
             <el-form-item label="波特率">
               <el-select v-model="baudRate" placeholder="选择波特率">
                 <el-option v-for="rate in baudRates" :key="rate" :label="rate" :value="rate"></el-option>
               </el-select>
             </el-form-item>
           </el-form>
           <div class="button-group">
             <el-button
               :type="isSerialConnected ? 'danger' : 'primary'"
               @click="toggleSerial"
             >
               {{ isSerialConnected ? '关闭串口' : '打开串口' }}
             </el-button>
             <span class="serial-status" :class="isSerialConnected ? 'connected' : ''">
               {{ isSerialConnected ? '已连接' : '未连接' }}
             </span>
             <span class="serial-indicator" :class="isSerialConnected ? 'connected' : 'disconnected'"></span>
           </div>
         </el-card>

         <el-card class="model-card">
           <h3>产品型号</h3>
         
           <el-form label-position="top">
             <el-form-item label="选择写入类型">
               <el-select
                 v-model="writeType"
                 placeholder="选择写入类型"
                 style="width: 100%"
                 :disabled="isTesting"
                 @change="handleWriteTypeChange"
               >
                 <el-option
                   v-for="item in writeTypeOptions"
                   :key="item.value"
                   :label="item.label"
                   :value="item.value"
                 />
               </el-select>
             </el-form-item>
         
             <el-form-item label="选择产品型号">
               <el-cascader
                 v-model="selectedModelPath"
                 :options="productModelOptions"
                 :show-all-levels="false"
                 :props="cascaderProps"
                 :disabled="isResetUsageMode || isTesting"
                 placeholder="选择产品型号"
                 style="width: 100%"
                 @change="handleModelChange"
               />
             </el-form-item>
           </el-form>
         </el-card>
       </div>
     </el-aside>

     <!-- 主内容（串口测试） -->
     <el-main>
       <el-card class="table-card">
         <div class="header-row">
           <h3>{{ writePanelTitle }}</h3>
           <el-form label-position="top" class="control-form">
             <el-form-item style="align-content: flex-end;">
               <el-button :type="isTesting ? 'danger' : 'success'" @click="onWriteButtonClick">
                 {{ isTesting ? '结束写入' : writeButtonText }}
               </el-button>
             </el-form-item>
           </el-form>
         </div>

         <el-table
           ref="testTable"
           class="write-table"
           :data="tableData"
           border
           height="100%"
           style="width: 100%"
           @selection-change="handleSelectionChange"
         >
           <el-table-column type="selection" width="50" />
           <el-table-column prop="id" label="编号" width="55" />
           <el-table-column prop="testContent" label="写入项" />

           <el-table-column label="写入内容">
             <template #header>
               <span>写入内容</span>
               <el-button type="text" class="toggle-data-visibility" @click="toggleDataVisibility">
                 <el-icon class="examine-icon">
                   <el-icon-view v-if="showCommandData" />
                   <el-icon-hide v-else />
                 </el-icon>
               </el-button>
             </template>
             <template #default="{ row }">
               <el-input v-if="row.isEditing" v-model="row.commandData" placeholder="请输入写入内容" />
               <span v-else>{{ showCommandData ? row.commandData : '****' }}</span>
             </template>
           </el-table-column>

           <el-table-column prop="sendCommand" label="发送命令" width="180"/>
           <el-table-column prop="receiveCommand" label="接收命令" />
           <el-table-column prop="testResult" label="结果" width="70" />

           <el-table-column label="备注">
             <template #header>
               <span>备注</span>
               <el-button type="text" class="toggle-remarks-visibility" @click="toggleRemarksVisibility">
                 <el-icon class="examine-icon">
                   <el-icon-view v-if="showRemarks" />
                   <el-icon-hide v-else />
                 </el-icon>
               </el-button>
             </template>
             <template #default="{ row }">
               <span>{{ showRemarks ? row.remarks : (row.remarks ? '****' : '') }}</span>
             </template>
           </el-table-column>

           <el-table-column label="操作" width="100">
             <template #default="{ row }">
               <el-button
                 v-if="!row.isEditing"
                 size="small"
                 :disabled="
                   isResetUsageMode ||
                   (!canEditAll &&
                     row.testContent !== '写产品序列号' &&
                     row.testContent !== '写色温')
                 "
                 @click="editRow(row)"
                 type="primary"
               >
                 编辑
               </el-button>
               <el-button v-else size="small" @click="saveRow(row)" type="danger">保存</el-button>
             </template>
           </el-table-column>
         </el-table>
       </el-card>
     </el-main>

     <!-- 右侧边栏（日志） -->
     <el-aside :class="{'hidden': !rightSidebarVisible}" class="sidebar right-sidebar">
       <button class="toggle-button right-toggle" @click="toggleRightSidebar">
         <el-icon class="custom-icon">
           <el-icon-arrow-right v-if="rightSidebarVisible" />
           <el-icon-arrow-left v-else />
         </el-icon>
       </button>
       <div v-if="rightSidebarVisible" class="right-content">
         <el-card class="log-card">
           <h3>日志</h3>
           <el-scrollbar height="740">
             <pre>{{ log }}</pre>
           </el-scrollbar>
           <div class="button-group-right">
             <el-button @click="exportLog">导出日志</el-button>
             <el-button type="danger" @click="clearLog">清空日志</el-button>
           </div>
         </el-card>
       </div>
     </el-aside>
   </el-container>
 </div>
</template>

<script setup>
import Header from '../components/common/Header.vue';
import { ref, onMounted, computed, nextTick } from 'vue';
import { productType, productCaseList } from '../api.js';

// 侧边栏控制
const leftSidebarVisible = ref(true);
const rightSidebarVisible = ref(true);
const toggleLeftSidebar = () => leftSidebarVisible.value = !leftSidebarVisible.value;
const toggleRightSidebar = () => rightSidebarVisible.value = !rightSidebarVisible.value;

const baudRates = ref([9600, 115200, 250000]);
const baudRate = ref(115200);
const log = ref('');
const selectedRows = ref([]);
const isTesting = ref(false);
const stopTestFlag = ref(false);
const isSerialConnected = ref(false);

// 新增状态
const clickCount = ref(0);
const canEditAll = ref(false);
const memberPermission = ref('2');

// 控制写入内容列的显示/隐藏
const showCommandData = ref(false);
// 控制备注列的显示/隐藏
const showRemarks = ref(false);

// ✅ 新增：色温默认值（解决 BDR-15 color_temperature 传 none 导致 500）
const DEFAULT_COLOR_TEMPERATURE = '1';

// 串口相关变量
let serialPort = null;
let reader = null;
let writer = null;

// 产品型号相关
const selectedModelPath = ref(['EN-14', 'EN-14_1（EN-14）']);
const productModelOptions = ref([]);
const cascaderProps = {
 value: 'value',
 label: 'label',
 children: 'children',
};

// 测试控制
const sendInterval = ref(1400);
const testTable = ref(null);
const tableData = ref([]);

// 加载前端固定的“清零使用时长”用例
const loadResetUsageTimeCase = async () => {
  tableData.value = [
    {
      ...RESET_USAGE_TIME_CASE,
    },
  ];

  selectedRows.value = [];

  await nextTick();
  testTable.value?.clearSelection();

  log.value += '📋 已切换为清零使用时长，使用前端固定命令\n';
};

// 切换写入类型
const handleWriteTypeChange = async () => {
  clickCount.value = 0;
  canEditAll.value = false;
  memberPermission.value = '2';
  selectedRows.value = [];

  await nextTick();
  testTable.value?.clearSelection();

  if (isResetUsageMode.value) {
    await loadResetUsageTimeCase();
  } else {
    await loadModelTests();
  }
};

// 切换写入内容显示/隐藏
const toggleDataVisibility = () => {
 showCommandData.value = !showCommandData.value;
};

// 切换备注显示/隐藏
const toggleRemarksVisibility = () => {
 showRemarks.value = !showRemarks.value;
};

// 获取串口
const getPorts = async () => {
 if ('serial' in navigator) {
   try {
     await navigator.serial.getPorts();
     log.value += "🔍 获取可用串口成功\n";
   } catch (error) {
     console.error("获取串口失败:", error);
     log.value += "❌ 获取串口失败: " + error.message + "\n";
   }
 } else {
   ElMessage.error("你的浏览器不支持 Web Serial API");
 }
};

// 切换串口状态
const toggleSerial = async () => {
 if (isSerialConnected.value) {
   await disconnectSerial();
 } else {
   await connectSerial();
 }
};

// 写入类型
const WRITE_TYPE = Object.freeze({
  WRITE_TAG: 'write_tag',
  RESET_USAGE_TIME: 'reset_usage_time',
});

const writeType = ref(WRITE_TYPE.WRITE_TAG);

const writeTypeOptions = [
  {
    label: '一键写入电子标签',
    value: WRITE_TYPE.WRITE_TAG,
  },
  {
    label: '清零使用时长',
    value: WRITE_TYPE.RESET_USAGE_TIME,
  },
];

const isResetUsageMode = computed(
  () => writeType.value === WRITE_TYPE.RESET_USAGE_TIME
);

const writePanelTitle = computed(() =>
  isResetUsageMode.value ? '清零使用时长' : '一键写入电子标签'
);

const writeButtonText = computed(() =>
  isResetUsageMode.value ? '开始清零' : '开始一键写入'
);

// 清零使用时长固定用例，不从后端获取
const RESET_USAGE_TIME_CASE = Object.freeze({
  id: 1,
  testContent: '清零使用时长',
  commandData: '清零使用时长',
  sendCommand: 'FA F9 04 01 01 51 F0',
  receiveCommand: 'FA F9 04 01 01 51 F0',
  testResult: '',
  remarks: '',
  isEditing: false,
});

// 判断是否成功连接串口
const connectSerial = async () => {
 try {
   serialPort = await navigator.serial.requestPort();
   await serialPort.open({ baudRate: baudRate.value });

   reader = serialPort.readable.getReader();
   writer = serialPort.writable.getWriter();
   isSerialConnected.value = true;
   log.value += "✅ 串口已连接\n";
   ElMessage.success("串口连接成功");
   readData();
 } catch (error) {
   console.error("串口连接失败:", error);
   log.value += "❌ 连接失败: " + error.message + "\n";
   ElMessage.error("串口连接失败: " + error.message);
   isSerialConnected.value = false;
 }
};

// 断开串口
const disconnectSerial = async () => {
 try {
   if (reader) {
     await reader.cancel();
     reader.releaseLock();
   }
   if (writer) {
     await writer.close();
     writer.releaseLock();
   }
   if (serialPort) {
     await serialPort.close();
   }
   isSerialConnected.value = false;
   log.value += "🔌 串口已关闭\n";
   ElMessage.success("串口已关闭");
 } catch (error) {
   console.error("断开串口失败:", error);
   log.value += "❌ 断开串口失败: " + error.message + "\n";
   ElMessage.error("断开串口失败: " + error.message);
 }
};

// 获取产品型号
const fetchProductTypes = async () => {
 try {
   const formData = new FormData();
   formData.append('member_permission', memberPermission.value);

   const response = await productType(formData);
   const data = response.data;
   log.value += "✅ 成功加载产品型号\n";

   productModelOptions.value = Object.keys(data).map(parent => ({
     value: parent,
     label: parent,
     children: Array.isArray(data[parent])
       ? data[parent].map(child => ({ value: child, label: child }))
       : [],
   }));

   await loadModelTests();
 } catch (error) {
   console.error("获取产品型号失败:", error);
   log.value += `❌ 获取产品型号失败: ${error.message}\n`;
   ElMessage.error("获取产品型号失败: " + error.message);
 }
};

// 当型号变化时加载测试用例
const handleModelChange = async () => {
  // 清零模式不需要根据产品型号请求后端
  if (isResetUsageMode.value) {
    return;
  }

  clickCount.value = 0;
  canEditAll.value = false;
  memberPermission.value = '2';

  await loadModelTests();
};

// 加载测试用例
const debugFormData = (fd, title = 'FormData') => {
  try {
    const entries = Array.from(fd.entries()).map(([k, v]) => [k, v]);
    // console.group(`[DEBUG] ${title}`);
    // console.table(entries);
    // console.groupEnd();

    // // 同时写到右侧日志（避免只看控制台）
    // log.value += `\n[DEBUG] ${title}\n`;
    // entries.forEach(([k, v]) => {
    //   log.value += `  - ${k}: ${v}\n`;
    // });
  } catch (e) {
    console.warn('debugFormData failed:', e);
  }
};

// ✅ 打印 Axios 错误详情
const logAxiosError = (error, title = 'AxiosError') => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  // log.value += `\n[DEBUG] ${title}\n`;
  // log.value += `  message: ${error?.message}\n`;
  if (status) log.value += `  status: ${status}\n`;
  if (data) log.value += `  response.data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n`;
};

// ✅ 加载测试用例（写入用例 test_type=0）——这里也补 color_temperature
const loadModelTests = async (serialNum = '929040039C') => {
  if (isResetUsageMode.value) {
      await loadResetUsageTimeCase();
      return;
  }
  if (!selectedModelPath.value || selectedModelPath.value.length < 2) {
    tableData.value = [];
    return;
  }

  const productLine = selectedModelPath.value[0];
  const identifyModel = selectedModelPath.value[1];

  try {
    const formData = new FormData();
    formData.append('product_line', productLine);
    formData.append('identify_model', identifyModel);
    formData.append('test_type', '0');
    formData.append('member_permission', memberPermission.value);
    formData.append('product_serial_num', serialNum);

    // ✅ 关键：BDR-15 写入用例阶段可能也要求 color_temperature 不为 none
    formData.append('color_temperature', DEFAULT_COLOR_TEMPERATURE);

    debugFormData(formData, `loadModelTests test_type=0 (model=${identifyModel})`);

    const response = await productCaseList(formData);
    const cases = response.data;

    tableData.value = cases.map((item, index) => {
      const testContent = item[0] || '';
      let commandData = item[1] || '';

      // ✅ 如果后端给了“写色温”但为空，前端补默认 A
      if (testContent === '写色温' && !commandData) {
        commandData = DEFAULT_COLOR_TEMPERATURE;
      }

      return {
        id: index + 1,
        testContent,
        commandData,
        sendCommand: item[2] || '',
        receiveCommand: item[3] || '',
        testResult: '',
        remarks: '',
        isEditing: false,
      };
    });

    log.value += `📋 成功加载型号 ${identifyModel} ，加载 ${cases.length} 条数据\n`;
  } catch (error) {
    console.error("获取电子标签信息失败:", error);
    log.value += `❌ 获取电子标签信息失败: ${error.message}\n`;
    logAxiosError(error, 'loadModelTests failed');
    tableData.value = [];
    ElMessage.error("获取电子标签信息失败: " + (error?.response?.data?.message || error.message));
  }
};

// 获取读取用例（不展示）
const fetchReadTests = async (serialNum = '929040039C') => {
  if (isResetUsageMode.value) {
      return [];
  }
  if (!selectedModelPath.value || selectedModelPath.value.length < 2) {
    return [];
  }

  const productLine = selectedModelPath.value[0];
  const identifyModel = selectedModelPath.value[1];

  try {
    const formData = new FormData();
    formData.append('product_line', productLine);
    formData.append('identify_model', identifyModel);
    formData.append('test_type', '1');
    formData.append('member_permission', memberPermission.value);
    formData.append('product_serial_num', serialNum);

    // ✅ 默认 A
    let pictureParameter = DEFAULT_COLOR_TEMPERATURE;

    tableData.value.forEach(row => {
      switch (row.testContent) {
        case '写产品型号':
          formData.append('product_model', row.commandData || '');
          break;
        case '写光源类型及数量':
          formData.append('light_type', row.commandData || '');
          break;
        case '写按键数量':
          formData.append('button_count', row.commandData || '');
          break;
        case '写图像翻转角度':
          formData.append('rotation_angle', row.commandData || '');
          break;
        case '写限制使用时长':
          formData.append('limit_use_time', row.commandData || '');
          break;
        case '写内外径':
          formData.append('inter_outer_length', row.commandData || '');
          break;
        case '写切角':
          formData.append('viewing_angle', row.commandData || '');
          break;
        case '写产品序列号':
          formData.append('product_serial_num', row.commandData || serialNum);
          break;
        case '写色温':
          pictureParameter = row.commandData || pictureParameter;
          break;
      }
    });

    // ✅ 无条件追加，防止传 none/空
    formData.append('color_temperature', pictureParameter || DEFAULT_COLOR_TEMPERATURE);

    debugFormData(formData, `fetchReadTests test_type=1 (model=${identifyModel})`);

    const response = await productCaseList(formData);
    const cases = response.data;

    log.value += `📋 成功加载读取用例，加载 ${cases.length} 条数据\n`;
    return cases.map((item, index) => ({
      id: index + 1,
      testContent: item[0] || '',
      commandData: item[1] || '',
      sendCommand: item[2] || '',
      receiveCommand: item[3] || '',
    }));
  } catch (error) {
    console.error("获取读取用例失败:", error);
    log.value += `❌ 获取读取用例失败: ${error.message}\n`;
    logAxiosError(error, 'fetchReadTests failed');
    ElMessage.error("获取读取用例失败: " + (error?.response?.data?.message || error.message));
    return [];
  }
};

// 编辑和保存行
const editRow = (row) => {
  if (isResetUsageMode.value) {
    return;
  }

  tableData.value.forEach(item => (item.isEditing = false));
  row.isEditing = true;
};

const saveRow = async (row) => {
 row.isEditing = false;
 log.value += `✅ 写入内容已更新: ${row.testContent} - ${row.commandData}\n`;
 ElMessage.success(`写入内容已更新: ${row.testContent}`);

 // 保存后发送所有行的 commandData
 await updateProductCaseList();
};

// 更新 productCaseList 接口，发送所有行的 commandData
const updateProductCaseList = async () => {
  if (isResetUsageMode.value) {
      await loadResetUsageTimeCase();
      return;
  }
  try {
    const formData = new FormData();
    formData.append('test_type', '0');

    let identifyModel = selectedModelPath.value[1] || '';
    let productLine = selectedModelPath.value[0] || '';

    // ✅ 默认 A
    let pictureParameter = DEFAULT_COLOR_TEMPERATURE;

    tableData.value.forEach(row => {
      switch (row.testContent) {
        case '写识别型号':
          identifyModel = row.commandData || identifyModel;
          break;
        case '写产品型号':
          formData.append('product_model', row.commandData || '');
          break;
        case '写光源类型及数量':
          formData.append('light_type', row.commandData || '');
          break;
        case '写按键数量':
          formData.append('button_count', row.commandData || '');
          break;
        case '写图像翻转角度':
          formData.append('rotation_angle', row.commandData || '');
          break;
        case '写限制使用时长':
          formData.append('limit_use_time', row.commandData || '');
          break;
        case '写内外径':
          formData.append('inter_outer_length', row.commandData || '');
          break;
        case '写切角':
          formData.append('viewing_angle', row.commandData || '');
          break;
        case '写产品序列号':
          formData.append('product_serial_num', row.commandData || '');
          break;
        case '写色温':
          pictureParameter = row.commandData || pictureParameter;
          break;
      }
    });

    formData.append('identify_model', identifyModel);
    formData.append('product_line', productLine);
    formData.append('member_permission', memberPermission.value);

    // ✅ 无条件追加，防止传 none/空
    formData.append('color_temperature', pictureParameter || DEFAULT_COLOR_TEMPERATURE);

    debugFormData(formData, `updateProductCaseList test_type=0 (model=${identifyModel})`);

    const response = await productCaseList(formData);
    const cases = response.data;

    tableData.value = cases.map((item, index) => {
      const testContent = item[0] || '';
      let commandData = item[1] || '';
      if (testContent === '写色温' && !commandData) {
        commandData = DEFAULT_COLOR_TEMPERATURE;
      }
      return {
        id: index + 1,
        testContent,
        commandData,
        sendCommand: item[2] || '',
        receiveCommand: item[3] || '',
        testResult: '',
        remarks: '',
        isEditing: false,
      };
    });

    log.value += `✅ 成功更新所有写入内容数据\n`;
  } catch (error) {
    console.error("更新电子标签信息失败:", error);
    log.value += `❌ 更新电子标签信息失败: ${error.message}\n`;
    logAxiosError(error, 'updateProductCaseList failed');
    ElMessage.error("更新电子标签信息失败: " + (error?.response?.data?.message || error.message));
  }
};


// 处理按钮点击
const onWriteButtonClick = async () => {
  // 正在执行时，点击按钮只负责停止
  if (isTesting.value) {
    stopTestFlag.value = true;
    return;
  }
  // 高级编辑模式只对电子标签写入生效
  if (!isResetUsageMode.value) {
    clickCount.value++;

    if (clickCount.value >= 5) {
      clickCount.value = 0;
      canEditAll.value = true;
      memberPermission.value = '3';

      log.value += '✅ 已连续点击5次，启用高级模式，所有行可编辑\n';

      await updateProductCaseList();
    }
  }

  await startWriting();
};

// 选择行
const handleSelectionChange = (rows) => {
 selectedRows.value = rows;
};

// CRC16 校验表
const wCRCTableAbs = [
 0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
 0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
];

// CRC16 计算函数
const data2CRC16 = (pchMsg, lwDataLen) => {
 let wCRC = 0xFFFF;
 for (let i = 0; i < lwDataLen; i++) {
   const chChar = pchMsg[i];
   wCRC = wCRCTableAbs[(chChar ^ wCRC) & 15] ^ (wCRC >> 4);
   wCRC = wCRCTableAbs[((chChar >> 4) ^ wCRC) & 15] ^ (wCRC >> 4);
 }
 return wCRC.toString(16).toUpperCase().padStart(4, '0');
};

// 解析接收数据寻找 FA F9 报表头
const parseReceivedData = (hexString) => {
 const bytes = hexString.replace(/\s/g, '').match(/.{1,2}/g) || [];
 let startIdx = -1;

 for (let i = 0; i < bytes.length - 1; i++) {
   if (bytes[i] === 'FA' && bytes[i + 1] === 'F9') {
     startIdx = i;
     break;
   }
 }

 if (startIdx === -1 || startIdx + 5 >= bytes.length) return null;

 const packet = bytes.slice(startIdx);
 const dataLen = packet.length - 4;
 if (dataLen <= 0) return null;

 const data = packet.slice(2, -2);
 const receivedCRC = packet.slice(-2).join('');

 const dataBytes = data.map(byte => parseInt(byte, 16));
 const calculatedCRC = data2CRC16(dataBytes, dataBytes.length);

 const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
 let asciiStr = decoder.decode(new Uint8Array(dataBytes)).trim();
 asciiStr = asciiStr.replace(/[\x00-\x1F\x7F\uFFFD]+/g, '');

 return {
   fullPacket: packet.join(''),
   data,
   receivedCRC,
   calculatedCRC,
   asciiStr: asciiStr || '无有效文本',
 };
};

let lastReceivedData = ref('');

// 读取数据
const readData = async () => {
 try {
   let buffer = [];
   let timeoutId = null;
   const TIMEOUT_MS = 100;

   while (serialPort.readable) {
     const { value, done } = await reader.read();
     if (done) {
       log.value += "🔌 串口断开连接\n";
       reader.releaseLock();
       isSerialConnected.value = false;
       break;
     }

     buffer.push(...new Uint8Array(value));
     if (timeoutId) clearTimeout(timeoutId);

     timeoutId = setTimeout(() => {
       const receivedData = parseData(new Uint8Array(buffer));
       lastReceivedData.value = receivedData;
       log.value += "📩 接收 (HEX): " + receivedData + "\n";
       buffer = [];
     }, TIMEOUT_MS);
   }
 } catch (error) {
   console.error("读取失败:", error);
   log.value += "❌ 读取失败: " + error.message + "\n";
   ElMessage.error("读取失败: " + error.message);
   isSerialConnected.value = false;
 }
};

// 发送命令
const sendMessage = async (command) => {
 if (!serialPort || !writer) {
   log.value += "❌ 串口未连接\n";
   ElMessage.error("串口未连接");
   return false;
 }

 try {
   const hexCommand = command.replace(/\s/g, '');
   const data = new Uint8Array(hexCommand.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
   log.value += "📤 发送 (HEX): " + command + "\n";
   await writer.write(data);
   return true;
 } catch (error) {
   console.error("发送失败:", error);
   log.value += "❌ 发送失败: " + error.message + "\n";
   ElMessage.error("发送失败: " + error.message);
   return false;
 }
};

const normalizeHex = (value = '') => {
  return value
    .replace(/[^0-9a-fA-F]/g, '')
    .toUpperCase();
};

// 执行清零使用时长
const executeResetUsageTime = async () => {
  for (const row of selectedRows.value) {
    if (stopTestFlag.value) {
      break;
    }

    lastReceivedData.value = '';

    const success = await sendMessage(row.sendCommand);

    if (!success) {
      row.testResult = 'Fail';
      row.remarks = '发送清零命令失败';
      log.value += `❌ ${row.testContent}发送失败\n`;
      continue;
    }

    await new Promise(resolve =>
      setTimeout(resolve, sendInterval.value)
    );

    const receivedHex = normalizeHex(lastReceivedData.value);
    const expectedHex = normalizeHex(row.receiveCommand);

    // 使用 includes，避免串口一次收到的数据中包含其他前后字节
    const passed =
      receivedHex.length > 0 &&
      expectedHex.length > 0 &&
      receivedHex.includes(expectedHex);

    if (passed) {
      row.testResult = 'Pass';
      row.remarks = `当前读到的内容为: ${lastReceivedData.value}`;
      log.value += `✅ ${row.testContent}执行成功\n`;
    } else {
      row.testResult = 'Fail';
      row.remarks =
        `接收命令不匹配，接收: ${lastReceivedData.value || '无数据'}，` +
        `预期: ${row.receiveCommand}`;

      log.value += `❌ ${row.testContent}执行失败，` +
        `接收: ${lastReceivedData.value || '无数据'}，` +
        `预期: ${row.receiveCommand}\n`;
    }
  }
};

const finishWriting = () => {
  const wasStopped = stopTestFlag.value;

  isTesting.value = false;
  stopTestFlag.value = false;

  log.value += wasStopped
    ? '🛑 已手动停止\n'
    : '✅ 所有写入和读取操作完成\n';
};


// 开始写入并读取
const startWriting = async () => {
 if (isTesting.value) {
   stopTestFlag.value = true;
   return;
 }

 if (!serialPort || !serialPort.readable || !serialPort.writable) {
   log.value += "❌ 串口未连接，请先打开串口\n";
   ElMessage.error("串口未连接，请先打开串口");
   return;
 }
 if (!selectedRows.value || selectedRows.value.length === 0) {
   log.value += "❌ 请勾选至少一行进行写入\n";
   ElMessage.error("请勾选至少一行进行写入");
   return;
 }

 isTesting.value = true;
 stopTestFlag.value = false;
 log.value += "🚀 开始写入\n";

 selectedRows.value.forEach(row => {
   row.testResult = '';
   row.remarks = '';
 });
 
 // 清零使用时长完全使用前端固定用例，不获取后端读取用例
 if (isResetUsageMode.value) {
   await executeResetUsageTime();
   finishWriting();
   return;
 }

 // 第一步：执行写入操作
 for (const row of selectedRows.value) {
   if (stopTestFlag.value) break;

   if (row.sendCommand) {
     lastReceivedData.value = '';
     const success = await sendMessage(row.sendCommand);
     if (success) {
       await new Promise(resolve => setTimeout(resolve, sendInterval.value));
       log.value += `📤 发送命令: ${row.testContent} - ${row.sendCommand}\n`;
     } else {
       log.value += `❌ 发送失败: ${row.testContent}\n`;
     }
   }
   log.value += `✅ ${row.testContent} 写入完成\n`;
 }

 // 第二步：获取读取用例
 const serialNum = tableData.value.find(row => row.testContent === '写产品序列号')?.commandData || '929040039C';
 const readTests = await fetchReadTests(serialNum);

 // 第三步：映射读取用例的 testContent 到写入用例的 testContent
 const testContentMap = {
   '读识别型号': '写识别型号',
   '读光源类型及数量': '写光源类型及数量',
   '读产品型号': '写产品型号',
   '读按键数量': '写按键数量',
   '读图像翻转角度': '写图像翻转角度',
   '读限制使用时长': '写限制使用时长',
   '读内外径': '写内外径',
   '读切角': '写切角',
   '读产品序列号': '写产品序列号',
   '读色温': '写色温',
 };

 // 第三步：执行读取操作并校验
 for (const readTest of readTests) {
   if (stopTestFlag.value) break;

   if (readTest.sendCommand) {
     lastReceivedData.value = '';
     const success = await sendMessage(readTest.sendCommand);

     if (success) {
       await new Promise(resolve => setTimeout(resolve, sendInterval.value));
       const packetInfo = parseReceivedData(lastReceivedData.value);

       let testResult = '';
       let remarks = '';

       const mappedTestContent = testContentMap[readTest.testContent] || readTest.testContent;
       const targetRow = tableData.value.find(row => row.testContent === mappedTestContent);

       if (!packetInfo) {
         testResult = "Fail";
         remarks = `读取失败，接收: ${lastReceivedData.value}，未找到有效数据包`;
         log.value += "❌ 未找到以 FA F9 开头的数据包\n";
       } else {
         log.value += `📦 读取数据包: ${packetInfo.fullPacket}\n`;
         log.value += `🔍 计算校验码: ${packetInfo.calculatedCRC}, 接收校验码: ${packetInfo.receivedCRC}\n`;

         if (packetInfo.calculatedCRC === packetInfo.receivedCRC) {
           remarks = packetInfo.asciiStr || "无有效文本";
           log.value += `📝 读取解读结果: ${remarks}\n`;

           if (targetRow && packetInfo.asciiStr === targetRow.commandData) {
             testResult = "Pass";
           } else {
             testResult = "Fail";
             remarks = `读取失败，接收: ${lastReceivedData.value}，解读: ${packetInfo.asciiStr || '无有效文本'}`;
             if (!targetRow) {
               remarks += `，未找到对应的写入行: ${mappedTestContent}`;
             } else {
               remarks += `，预期: ${targetRow.commandData}`;
             }
           }
         } else {
           testResult = "Fail";
           remarks = `读取失败，接收: ${lastReceivedData.value}，校验码不匹配`;
           log.value += "❌ 读取校验码不匹配\n";
         }
       }

       if (targetRow) {
         targetRow.testResult = testResult;
         targetRow.remarks = `当前读到的内容为: ${remarks}`;
         log.value += `📋 读取结果: ${mappedTestContent} - ${testResult} (原始: ${readTest.testContent})\n`;
       } else {
         log.value += `❌ 未找到匹配的行: ${readTest.testContent} (映射后: ${mappedTestContent})\n`;
       }
     } else {
       const mappedTestContent = testContentMap[readTest.testContent] || readTest.testContent;
       const targetRow = tableData.value.find(row => row.testContent === mappedTestContent);
       if (targetRow) {
         targetRow.testResult = "Fail";
         targetRow.remarks = "读取发送失败";
         log.value += `📋 读取结果: ${mappedTestContent} - Fail (原始: ${readTest.testContent})\n`;
       } else {
         log.value += `❌ 未找到匹配的行: ${readTest.testContent} (映射后: ${mappedTestContent})\n`;
       }
     }
   }
 }

 finishWriting();
};

// 导出日志
const exportLog = () => {
 const blob = new Blob([log.value], { type: 'text/plain' });
 const link = document.createElement('a');
 link.href = URL.createObjectURL(blob);
 link.download = 'serial_log.txt';
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 log.value += "✅ 日志已导出\n";
};

// 清空日志
const clearLog = () => {
 log.value = "";
};

// 解析数据
const parseData = (data) => {
 try {
   const hexString = Array.from(new Uint8Array(data))
     .map(byte => byte.toString(16).padStart(2, '0'))
     .join(' ');
   return hexString.toUpperCase();
 } catch {
   return `无法解析: ${data}`;
 }
};

// 初始化加载产品型号
onMounted(() => {
 getPorts();
 fetchProductTypes();
});
</script>

<style scoped>
/* 页面容器 */
.page-container {
 height: 100vh;
 display: flex;
 flex-direction: column;
 overflow: hidden;
 min-height: 0;
}


/* 头部组件 */
Header {
 flex-shrink: 0;
}

/* Element Plus 容器 */
.el-container {
 flex: 1;
 min-height: 0;
 overflow: hidden;
}

/* 侧边栏 */
.sidebar {
 transition: width 0.3s;
 position: relative;
 overflow: hidden;
 background: #f8f9fa;
 padding: 10px;
 height: 100%;
}

.hidden {
 width: 20px !important;
}

/* 左侧边栏 */
.left-sidebar {
 width: 355px;
 padding-right: 15px;
}

.left-content {
 display: flex;
 flex-direction: column;
 height: 100%;
 overflow-y: auto;
}

/* 串口状态文字 */
.serial-status {
 display: inline-block;
 margin-left: 10px;
 vertical-align: middle;
 font-size: 14px;
 color: #999;
}

.serial-status.connected {
 color: #67c23a;
}

.serial-status:not(.connected) {
 color: #f56c6c;
}

/* 红绿灯指示器 */
.serial-indicator {
 display: inline-block;
 width: 12px;
 height: 12px;
 border-radius: 50%;
 margin-left: 8px;
 vertical-align: middle;
}

.serial-indicator.connected {
 background-color: #67c23a;
}

.serial-indicator.disconnected {
 background-color: #f56c6c;
}

/* 按钮组样式调整 */
.button-group {
 display: flex;
 align-items: center;
 gap: 10px;
 margin-top: 10px;
}

/* 主内容区域 */
.el-main {
 padding: 0;
 height: 100%;
 min-width: 0;
 min-height: 0;
 overflow: hidden;
}

.custom-icon svg{
 color: #000000;
}

.examine-icon svg{
 color: #e3eff7;
}


:deep(.el-table tr) {
 background-color: #f7f7f7;
}

:deep(.el-table__body-wrapper .el-table__row) {
 height: 64px;
}

/* 表格卡片 */
.table-card {
 height: 100%;
 margin: 0;
 box-sizing: border-box;
}

.table-card :deep(.el-card__body) {
 height: 100%;
 min-height: 0;
 padding: 0;
 box-sizing: border-box;
 display: flex;
 flex-direction: column;
}

/* 右侧边栏 */
.right-sidebar {
 width: 355px;
 padding-left: 15px;
}

.right-content {
 display: flex;
 flex-direction: column;
 height: 100%;
}

/* 隐藏时的按钮 */
.toggle-button {
 align-items: center;
 background: none;
 display: flex;
 flex: none;
 font-size: 20px;
 height: 100%;
 justify-content: center;
 width: 20px;
 z-index: 1;
 background-color: #f8f9fa;
 border: none;
 cursor: pointer;
}

.left-toggle {
 position: absolute;
 right: 0;
 top: 50%;
 transform: translateY(-50%);
}

.right-toggle {
 position: absolute;
 left: 0;
 top: 50%;
 transform: translateY(-50%);
}

/* 表单元素间距优化 */
.settings-card,
.model-card,
.log-card {
 padding: 15px;
 margin-bottom: 15px;
}

.el-form-item {
 margin-bottom: 15px;
}

.button-group-left {
 display: flex;
 gap: 10px;
 margin-top: 10px;
}

.button-group-right {
 display: flex;
 gap: 10px;
 margin-top: 10px;
 justify-content: space-around;
}

/* 主内容头部样式 */
.header-row {
 flex: none;
 display: flex;
 align-items: center;
 justify-content: space-between;
 margin-bottom: 0;
 padding: 15px 20px;
}

.write-table {
 flex: 1;
 min-height: 0;
}

/* 防止 Element Plus 表格内部高度计算异常 */
.write-table :deep(.el-table__inner-wrapper) {
 height: 100%;
}

/* 眼睛按钮样式 */
.toggle-data-visibility,
.toggle-remarks-visibility {
 margin-left: 10px;
 vertical-align: middle;
}

.write-table :deep(.el-table__header th) {
 background-color: #e3eff7;
 font-size: 15px;
 font-weight: 600;
}

/* 表格正文 */
.write-table :deep(.el-table__body td) {
 font-size: 15px;
}

/* 单元格文字和按钮 */
.write-table :deep(.cell) {
 font-size: 15px;
 line-height: 22px;
}

/* 编辑状态下的输入框字体 */
.write-table :deep(.el-input__inner) {
 font-size: 15px;
}

/* 表格操作按钮字体 */
.write-table :deep(.el-button) {
 font-size: 14px;
}
</style>
