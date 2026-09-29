<template>
	<Header />
	<el-container>
	    <!-- 左侧边栏（串口设置） -->
	    <el-aside :class="{'hidden': !leftSidebarVisible}" class="sidebar left-sidebar">
	      <button class="toggle-button left-toggle" @click="toggleLeftSidebar">
	        <el-icon><el-icon-arrow-left v-if="leftSidebarVisible" /><el-icon-arrow-right v-else /></el-icon>
	      </button>
	      <el-card v-if="leftSidebarVisible" class="settings-card">
	        <h3>串口设置</h3>
	        <el-form label-position="top">
	          <el-form-item label="串口">
	            <el-select v-model="selectedPort" placeholder="选择串口">
	              <el-option v-for="port in availablePorts" :key="port" :label="port" :value="port"></el-option>
	            </el-select>
	          </el-form-item>
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
	    </el-aside>
	
	    <!-- 主内容 -->
	    <el-main>
	      <el-card class="log-card">
	        <h3>日志</h3>
	        <el-scrollbar height="300px">
	          <pre>{{ log }}</pre>
	        </el-scrollbar>
	        <div class="button-group">
	          <el-button @click="exportLog">导出日志</el-button>
	          <el-button type="danger" @click="clearLog">清空日志</el-button>
	        </div>
	      </el-card>
	
	      <el-card class="send-card">
	        <h3>发送指令</h3>
	        <el-input v-model="inputMessage" placeholder="输入指令 (支持字符串或HEX)" />
	        <div class="checkbox-group">
	          <el-checkbox v-model="isHexMode">HEX 发送</el-checkbox>
	        </div>
	        <div class="button-group">
	          <el-button @click="sendMessage" type="success">发送</el-button>
	        </div>
	      </el-card>
	    </el-main>
	
	    <!-- 右侧快捷 AT 指令面板 -->
	    <el-aside :class="{'hidden': !rightSidebarVisible}" class="sidebar right-sidebar">
	      <button class="toggle-button right-toggle" @click="toggleRightSidebar">
	        <el-icon><el-icon-arrow-right v-if="rightSidebarVisible" /><el-icon-arrow-left v-else /></el-icon>
	      </button>
	      <el-card v-if="rightSidebarVisible" class="at-card">
	        <h3>快捷 AT 指令</h3>
	        <el-form label-position="top">
	          <el-form-item label="选择 AT 指令">
	            <el-select v-model="selectedAT" placeholder="选择 AT 指令">
	              <el-option v-for="(cmd, index) in atCommands" :key="index" :label="cmd.label" :value="cmd.command"></el-option>
	            </el-select>
	          </el-form-item>
	        </el-form>
	        <div class="button-group">
	          <el-button @click="sendATCommand" type="primary">发送</el-button>
	        </div>
	      </el-card>
	    </el-aside>
	</el-container>
</template>

<script setup>
import Header from '../components/common/Header.vue';
import { ref, onMounted } from 'vue';

// 侧边栏控制
const leftSidebarVisible = ref(true);
const rightSidebarVisible = ref(true);
const toggleLeftSidebar = () => leftSidebarVisible.value = !leftSidebarVisible.value;
const toggleRightSidebar = () => rightSidebarVisible.value = !rightSidebarVisible.value;

const sidebarVisible = ref(true);
const selectedPort = ref(null);
const availablePorts = ref([]);
const baudRates = ref([9600, 115200, 250000]);
const baudRate = ref(115200);
const log = ref('');
const inputMessage = ref('');
const isHexMode = ref(false);
const selectedAT = ref(null);

let serialPort = null;
let reader = null;
let writer = null;

// AT 指令列表
const atCommands = ref([
  { label: "测试 AT 启动", command: "AT" },
  { label: "重启模块", command: "AT+RST" },
  { label: "获取版本信息", command: "AT+GMR" },
  { label: "查询所有 AT 指令", command: "AT+CMD?" }
]);

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

const readData = async () => {
  try {
    const decoder = new TextDecoder();
    while (serialPort.readable) {
      const { value, done } = await reader.read();
      if (done) {
        log.value += "🔌 串口断开连接\n";
        reader.releaseLock();
        break;
      }
      const receivedData = decoder.decode(value);
      log.value += "📩 接收: " + parseData(receivedData) + "\n";
    }
  } catch (error) {
    console.error("读取失败:", error);
  }
};

const sendMessage = async () => {
  if (!serialPort || !writer) {
    log.value += "❌ 串口未连接\n";
    return;
  }

  try {
    let data;
    if (isHexMode.value) {
      data = hexStringToUint8Array(inputMessage.value);
      log.value += "📤 发送 (HEX): " + inputMessage.value + "\n";
    } else {
      data = new TextEncoder().encode(inputMessage.value + "\n");
      log.value += "📤 发送 (文本): " + inputMessage.value + "\n";
    }

    await writer.write(data);
    inputMessage.value = "";
  } catch (error) {
    console.error("发送失败:", error);
    log.value += "❌ 发送失败: " + error.message + "\n";
  }
};

const sendATCommand = () => {
  if (!selectedAT.value) return;
  inputMessage.value = selectedAT.value;
  sendMessage();
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

const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

// 解析数据
const parseData = (data) => {
  try {
    if (/^[0-9A-Fa-f\s]+$/.test(data)) {
      return `HEX: ${data}`;
    }
    return `文本: ${data}`;
  } catch {
    return `无法解析: ${data}`;
  }
};

// HEX 转 Uint8Array
const hexStringToUint8Array = (hexString) => {
  hexString = hexString.replace(/\s+/g, "");
  if (hexString.length % 2 !== 0) {
    log.value += "❌ HEX 格式错误\n";
    return new Uint8Array([]);
  }
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes;
};

onMounted(getPorts);

</script>

<style scoped>
/* 侧边栏 */
.sidebar {
  transition: width 0.3s;
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
  padding: 10px;
}

.hidden {
  width: 20px !important;
}

/* 左侧边栏 */
.left-sidebar {
  width: 300px;
  padding-right: 15px;
}

.left-toggle {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

/* 右侧边栏 */
.right-sidebar {
  width: 300px;
  padding-left: 15px;
}

.right-toggle {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
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
/* 表单元素间距优化 */
.settings-card, .at-card {
  padding: 15px;
}

.el-form-item {
  margin-bottom: 15px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

/* 日志面板优化 */
.log-card {
  padding: 15px;
  margin-bottom: 15px;
}

/* 发送面板优化 */
.send-card {
  padding: 15px;
  margin-bottom: 15px;
}

.checkbox-group {
  margin-top: 10px;
}
</style>