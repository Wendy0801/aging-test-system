<template>
  <div class="page-container">
    <Header />
    <el-container>
      <!-- 左侧边栏（串口设置和产品型号） -->
      <el-aside :class="{'hidden': !leftSidebarVisible}" class="sidebar left-sidebar">
        <button class="toggle-button left-toggle" @click="toggleLeftSidebar">
          <el-icon><el-icon-arrow-left v-if="leftSidebarVisible" /><el-icon-arrow-right v-else /></el-icon>
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
              <el-button @click="connectSerial" type="primary">打开串口</el-button>
              <el-button @click="disconnectSerial" type="danger">关闭串口</el-button>
            </div>
          </el-card>
          <el-card class="model-card">
            <h3>产品型号</h3>
            <el-form label-position="top">
              <el-form-item label="选择产品型号">
                <el-cascader
                  v-model="selectedModelPath"
                  :options="productModelOptions"
                  :props="cascaderProps"
                  placeholder="选择产品型号"
                  @change="handleModelChange"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item label="选择测试类型">
                <el-select v-model="selectedTestType" placeholder="选择测试类型" @change="handleModelChange">
                  <el-option label="写入电子标签测试" :value="0"></el-option>
                  <el-option label="读取电子标签测试" :value="1"></el-option>
                </el-select>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-aside>

      <!-- 主内容（串口测试和导出结果） -->
      <el-main>
        <el-card class="table-card">
          <div class="header-row">
            <h3>{{ selectedTestType === 0 ? '写入电子标签测试' : '读取电子标签测试' }}</h3>
            <el-form label-position="top" class="control-form">
              <el-form-item label="发送间隔 (ms)">
                <el-input-number v-model="sendInterval" :min="1" size="small" />
              </el-form-item>
              <el-form-item label="执行次数">
                <el-input-number v-model="totalExecutionTimes" :min="1" size="small" @change="updateTableExecutionTimes" />
              </el-form-item>
              <el-form-item style="align-content: flex-end;">
                <el-button :type="isTesting ? 'danger' : 'success'" @click="startTest">
                  {{ isTesting ? '结束测试' : '开始测试' }}
                </el-button>
              </el-form-item>
              <el-form-item style="align-content: flex-end;">
                <el-button type="primary" @click="exportResults">导出结果</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-table :data="tableData" border style="width: 100%" ref="testTable" height="760" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="编号" width="80" />
            <el-table-column prop="testContent" label="测试内容" />
            <el-table-column prop="commandData" label="命令数据" />
            <el-table-column prop="sendCommand" label="发送命令" />
            <el-table-column prop="receiveCommand" label="接收命令" />
            <el-table-column label="执行次数" width="100" align="center">
              <template #default="{ row }">
                <el-progress
                  v-if="calculateProgress(row.executedTimes, row.executionTimes) < 100"
                  type="circle"
                  :percentage="calculateProgress(row.executedTimes, row.executionTimes)"
                  :color="colors"
                  :width="50"
                  :stroke-width="5"
                />
                <el-progress
                  v-else
                  type="circle"
                  :percentage="100"
                  status="success"
                  :width="50"
                  :stroke-width="5"
                >
                  <el-button type="success" :icon="Check" circle size="small" />
                </el-progress>
              </template>
            </el-table-column>
            <el-table-column prop="testResult" label="测试结果" />
			<el-table-column label="通过率" width="100">
			    <template #default="{ row }">
			      {{ calculatePassRate(row.passCount, row.executedTimes) }}%
			    </template>
			  </el-table-column>
            <el-table-column prop="remarks" label="备注" />
          </el-table>
        </el-card>
      </el-main>

      <!-- 右侧边栏（日志） -->
      <el-aside :class="{'hidden': !rightSidebarVisible}" class="sidebar right-sidebar">
        <button class="toggle-button right-toggle" @click="toggleRightSidebar">
          <el-icon><el-icon-arrow-right v-if="rightSidebarVisible" /><el-icon-arrow-left v-else /></el-icon>
        </button>
        <div v-if="rightSidebarVisible" class="right-content">
          <el-card class="log-card">
            <h3>日志</h3>
            <el-scrollbar height="740">
              <pre>{{ log }}</pre>
            </el-scrollbar>
            <div class="button-group">
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
import { ref, onMounted } from 'vue';
import { productType, productCaseList } from '../api.js'; // 导入接口

// 侧边栏控制
const leftSidebarVisible = ref(true);
const rightSidebarVisible = ref(true);
const toggleLeftSidebar = () => leftSidebarVisible.value = !leftSidebarVisible.value;
const toggleRightSidebar = () => rightSidebarVisible.value = !rightSidebarVisible.value;

const baudRates = ref([9600, 115200, 250000]);
const baudRate = ref(115200);
const log = ref('');
const selectedRows = ref([]); // 存储勾选的行
const isTesting = ref(false); // 测试进行中的状态
const stopTestFlag = ref(false); // 停止测试的标志


// 串口相关变量
let serialPort = null;
let reader = null;
let writer = null;


// 产品型号相关
const selectedModelPath = ref(['EN-14', 'EN-14_1']); // 默认选择 EN-14 和 EN-14_1
const productModelOptions = ref([]);
const cascaderProps = {
  value: 'value',
  label: 'label',
  children: 'children',
};

// 测试类型相关
const selectedTestType = ref(0); // 默认选择“写入电子标签测试”

// 主表格数据
const tableData = ref([]); // 初始化为空，等待接口填充

// 测试控制
const sendInterval = ref(1200); // 默认发送间隔 1000ms
const totalExecutionTimes = ref(1); // 默认总执行次数 1
const testTable = ref(null); // 表格引用

// 计算进度百分比
const calculateProgress = (executed, total) => {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((executed / total) * 100));
};

const colors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#1989fa', percentage: 60 },
  { color: '#7480dd', percentage: 80 },
  { color: '#5cb87a', percentage: 100 },
]

//获取串口
const getPorts = async () => {
  if ('serial' in navigator) {
    try {
      availablePorts.value = await navigator.serial.getPorts();
    } catch (error) {
      console.error("获取串口失败:", error);
    }
  } else {
    alert("你的浏览器不支持 Web Serial API");
  }
};

//判断是否成功连接串口
const connectSerial = async () => {
  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: baudRate.value });

    reader = serialPort.readable.getReader();
    writer = serialPort.writable.getWriter();
    log.value += "✅ 串口已连接\n";

    readData();
  } catch (error) {
    console.error("串口连接失败:", error);
    log.value += "❌ 连接失败: " + error.message + "\n";
  }
};

// 获取产品型号
const fetchProductTypes = async () => {
  try {
    const formData = new FormData();
    formData.append('member_permission', '1'); // 添加用户权限参数 1

    const response = await productType(formData); // 传递 formData
    const data = response.data;
    log.value += "✅ 成功加载产品型号\n";

    productModelOptions.value = Object.keys(data).map(parent => ({
      value: parent,
      label: parent,
      children: Array.isArray(data[parent]) ? data[parent].map(child => ({
        value: child,
        label: child,
      })) : [],
    }));

    // 初始化时加载默认型号的测试用例
    await loadModelTests();
  } catch (error) {
    console.error("获取产品型号失败:", error);
    log.value += `❌ 获取产品型号失败: ${error.message}\n`;
  }
};

// 当型号或测试类型变化时加载测试用例
const handleModelChange = async () => {
  await loadModelTests();
};

// 加载测试用例
const loadModelTests = async () => {
  if (!selectedModelPath.value || selectedModelPath.value.length < 2) {
    tableData.value = [];
    return;
  }

  const productLine = selectedModelPath.value[0];
  const identifyModel = selectedModelPath.value[1];
  const testType = selectedTestType.value;

  try {
    const formData = new FormData();
    formData.append('product_line', productLine);
    formData.append('identify_model', identifyModel);
    formData.append('test_type', testType);
	formData.append('member_permission', '1');
	formData.append('product_serial_num', '929040039C');

    const response = await productCaseList(formData);
    const cases = response.data;
    tableData.value = cases.map((item, index) => ({
      id: index + 1,
      testContent: item[0] || '',
      commandData: item[1] || '',
      sendCommand: item[2] || '',
      receiveCommand: item[3] || '',
      executionTimes: totalExecutionTimes.value,
      executedTimes: 0,
      passCount: 0, // 新增：通过次数
      testResult: '',
      remarks: '',
    }));
    log.value += `📋 成功加载型号 ${identifyModel} (测试类型: ${testType === 0 ? '写入' : '读取'}) 的测试用例，加载 ${cases.length} 条数据\n`;
  } catch (error) {
    console.error("获取测试用例失败:", error);
    log.value += `❌ 获取测试用例失败: ${error.message}\n`;
    tableData.value = [];
  }
};

const handleSelectionChange = (rows) => {
  selectedRows.value = rows; // 更新勾选的行
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
  return wCRC.toString(16).toUpperCase().padStart(4, '0'); // 返回 4 位大写 HEX
};

// 解析接收数据寻找 FA F9 报表头
const parseReceivedData = (hexString) => {
  const bytes = hexString.replace(/\s/g, '').match(/.{1,2}/g) || [];
  let startIdx = -1;

  // 寻找 FA F9 报表头
  for (let i = 0; i < bytes.length - 1; i++) {
    if (bytes[i] === 'FA' && bytes[i + 1] === 'F9') {
      startIdx = i;
      break;
    }
  }

  if (startIdx === -1 || startIdx + 5 >= bytes.length) {
    return null; // 出现粘包等特殊情况，找不到完整数据
  }

  // 提取完整数据包
  const packet = bytes.slice(startIdx);
  const dataLen = packet.length - 4; // 去掉头 2 字节和校验码 2 字节
  if (dataLen <= 0) return null;

  const header = packet.slice(0, 2); // FA F9
  const data = packet.slice(2, -2); // 中间数据
  const receivedCRC = packet.slice(-2).join(''); // 最后两位校验码
  // console.log('这是接收命令的校验码' , receivedCRC)

  // 计算 CRC16
  const dataBytes = data.map(byte => parseInt(byte, 16));
  const calculatedCRC = data2CRC16(dataBytes, dataBytes.length); // 得出校验码
  // console.log('这是计算得出的校验码' , calculatedCRC)

  return {
    fullPacket: packet.join(''),
    data: data,
    receivedCRC: receivedCRC,
    calculatedCRC: calculatedCRC,
  };
};

let lastReceivedData = ref(''); // 存储最近一次接收的 HEX 数据

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
        break;
      }

      buffer.push(...new Uint8Array(value));
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const receivedData = parseData(new Uint8Array(buffer));
        lastReceivedData.value = receivedData; // 保存 HEX 格式数据
        log.value += "📩 接收 (HEX): " + receivedData + "\n";
        buffer = [];
      }, TIMEOUT_MS);
    }
  } catch (error) {
    console.error("读取失败:", error);
    log.value += "❌ 读取失败: " + error.message + "\n";
  }
};

//发送命令
const sendMessage = async (command) => {
  if (!serialPort || !writer) {
    log.value += "❌ 串口未连接\n";
    return false;
  }

  try {
    const hexCommand = command.replace(/\s/g, ''); // 移除空格
    const data = new Uint8Array(
      hexCommand.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    log.value += "📤 发送 (HEX): " + command + "\n";
    await writer.write(data);
    return true;
  } catch (error) {
    console.error("发送失败:", error);
    log.value += "❌ 发送失败: " + error.message + "\n";
    return false;
  }
};


const disconnectSerial = async () => {
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
  log.value += "🔌 串口已关闭\n";
};

// 更新表格中的执行次数
const updateTableExecutionTimes = () => {
  tableData.value.forEach(row => {
    row.executionTimes = totalExecutionTimes.value;
  });
};

// 计算通过率
const calculatePassRate = (passCount, executedTimes) => {
  if (!executedTimes || executedTimes <= 0) return 0;
  return Math.round((passCount / executedTimes) * 100);
};

// 开始测试或结束测试
const startTest = async () => {
  if (isTesting.value) {
    stopTestFlag.value = true;
    return;
  }

  if (!serialPort || !serialPort.readable || !serialPort.writable) {
    log.value += "❌ 串口未连接，请先打开串口\n";
    return;
  }
  if (!selectedRows.value || selectedRows.value.length === 0) {
    log.value += "❌ 请勾选至少一行进行测试\n";
    return;
  }

  isTesting.value = true;
  stopTestFlag.value = false;
  log.value += "🚀 开始测试\n";

  // 清空测试结果、通过率、备注，并重置执行次数
  selectedRows.value.forEach(row => {
    row.executedTimes = 0;
    row.passCount = 0;
    row.testResult = '';
    row.remarks = '';
  });

  for (const row of selectedRows.value) {
    if (stopTestFlag.value) break;

    row.executedTimes = 0;
    row.passCount = 0; // 重置通过次数
    for (let i = 0; i < totalExecutionTimes.value && !stopTestFlag.value; i++) {
      if (row.sendCommand) {
        const success = await sendMessage(row.sendCommand);
        if (success) {
          row.executedTimes += 1;
          await new Promise(resolve => setTimeout(resolve, sendInterval.value));
          const expectedReceive = row.receiveCommand.replace(/\s/g, '').toUpperCase();
          const actualReceive = lastReceivedData.value.replace(/\s/g, '').toUpperCase();

          if (selectedTestType.value === 0) {
            // 写入电子标签测试
            if (actualReceive === expectedReceive) {
              row.testResult = "Pass";
              row.passCount += 1;
              row.remarks = "写入成功";
            } else {
              row.testResult = "Fail";
              row.remarks = `第 ${row.executedTimes} 次失败，接收: ${actualReceive}`;
            }
            log.value += `📋 测试结果: ${row.testContent} - ${row.testResult} (第 ${row.executedTimes} 次)\n`;
          } else if (selectedTestType.value === 1) {
            // 读取电子标签测试
            const packetInfo = parseReceivedData(actualReceive);
            if (packetInfo) {
              log.value += `📦 数据包: ${packetInfo.fullPacket}\n`;
              log.value += `🔍 计算校验码: ${packetInfo.calculatedCRC}, 接收校验码: ${packetInfo.receivedCRC}\n`;

              if (packetInfo.calculatedCRC === packetInfo.receivedCRC) {
                const dataBytes = packetInfo.data.map(byte => parseInt(byte, 16));
                const asciiStr = dataBytes
                  .map(byte => (byte >= 0x20 && byte <= 0x7E) ? String.fromCharCode(byte) : '')
                  .join('')
                  .trim();
                row.remarks = asciiStr || "无有效文本";
                log.value += `📝 解读结果: ${row.remarks}\n`;

                if (actualReceive === expectedReceive) {
                  row.testResult = "Pass";
                  row.passCount += 1;
                } else {
                  row.testResult = "Fail";
                  row.remarks = `第 ${row.executedTimes} 次失败，接收: ${actualReceive}，解读: ${asciiStr || '无有效文本'}`;
                }
              } else {
                row.testResult = "Fail";
                row.remarks = `第 ${row.executedTimes} 次失败，接收: ${actualReceive}，校验码不匹配`;
                log.value += "❌ 校验码不匹配\n";
              }
            } else {
              row.testResult = "Fail";
              row.remarks = `第 ${row.executedTimes} 次失败，接收: ${actualReceive}，未找到有效数据包`;
              log.value += "❌ 未找到以 FA F9 开头的数据包\n";
            }
            log.value += `📋 测试结果: ${row.testContent} - ${row.testResult} (第 ${row.executedTimes} 次)\n`;
          }
        } else {
          row.testResult = "Fail";
          row.remarks = `第 ${row.executedTimes} 次失败，发送失败`;
          log.value += `📋 测试结果: ${row.testContent} - ${row.testResult} (第 ${row.executedTimes} 次)\n`;
        }
      }
    }
    log.value += `✅ ${row.testContent} 执行完成 ${totalExecutionTimes.value} 次\n`;
  }

  isTesting.value = false;
  stopTestFlag.value = false;
  log.value += stopTestFlag.value ? "🛑 测试已手动停止\n" : "✅ 所有测试完成\n";
};

// 导出测试结果
const exportResults = () => {
  if (tableData.value.length === 0) {
    log.value += "❌ 表格为空，无法导出\n";
    return;
  }

  const headers = ['编号', '测试内容', '发送命令', '接收命令', '执行次数', '测试结果', '备注'];
  const csvRows = [
    headers.join(','),
    ...tableData.value.map(row =>
      [row.id, row.testContent, row.sendCommand, row.receiveCommand, row.executionTimes, row.testResult, row.remarks]
        .map(field => `"${field || ''}"`) // 处理空值并添加引号
        .join(',')
    )
  ];
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `test_results_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  log.value += "✅ 测试结果已导出\n";
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
};

const clearLog = () => {
  log.value = "";
};

// 解析数据
const parseData = (data) => {
  try {
    // 将原始数据转换为 HEX 格式
    const hexString = Array.from(new Uint8Array(data))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(' ');
    return hexString.toUpperCase(); // 返回大写 HEX 字符串
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
  height: 98vh; /* 占满视口高度 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 禁止页面滚动 */
}

/* 头部组件 */
Header {
  flex-shrink: 0; /* 头部高度固定，不被压缩 */
}

/* Element Plus 容器 */
.el-container {
  flex: 1; /* 占用剩余高度 */
  overflow: hidden; /* 禁止容器滚动 */
}

/* 侧边栏 */
.sidebar {
  transition: width 0.3s;
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
  padding: 10px;
  height: 100%; /* 占满容器高度 */
}

.hidden {
  width: 20px !important;
}

/* 左侧边栏 */
.left-sidebar {
  width: 300px;
  padding-right: 15px;
}

.left-content {
  display: flex;
  flex-direction: column;
  height: 100%; /* 占满侧边栏高度 */
  overflow-y: auto; /* 内容超长时允许内部滚动 */
}

/* 主内容 */
.el-main {
  padding: 0; /* 移除默认内边距 */
  height: 100%; /* 占满容器高度 */
}

/* 主内容table__header颜色 */
:deep(.el-table__header th) {
  background-color: #e3eff7; /* 设置你想要的背景颜色 */
}

:deep(.el-table tr) {
  background-color: #f7f7f7; 
}

.demo-progress .el-progress--circle {
  text-align: center;
}

.table-card {
  height: 99%; /* 占满主内容高度 */
  margin: 0;
  display: flex;
  flex-direction: column;
}

.el-table {
  flex: 1; /* 表格占用剩余空间 */
  overflow-y: auto; /* 表格内容超长时允许滚动 */
}

/* 右侧边栏 */
.right-sidebar {
  width: 300px;
  padding-left: 15px;
}

.right-content {
  display: flex;
  flex-direction: column;
  height: 100%; /* 占满侧边栏高度 */
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

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

/* 主内容头部样式 */
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 15px; /* 与 table-card 内边距一致 */
}

.control-form {
  display: flex;
  gap: 20px;
}
</style>
