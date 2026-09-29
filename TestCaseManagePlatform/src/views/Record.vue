<template>
  <Header />
  <div class="container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-input
        v-model="filters.projectName"
        placeholder="请输入项目名称搜索"
        clearable
        @input="handleSearch"
        style="width: 30vw; max-width: 500px;"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 卡片列表 -->
    <div class="card-container">
      <el-card
        v-for="record in filteredRecords"
        :key="record.report_id"
        class="record-card"
        shadow="hover"
      >
        <div class="card-content">
          <p><strong>导出人员：</strong>{{ record.report_user }}</p>
          <p><strong>项目名称：</strong>{{ record.report_title }}</p>
          <p><strong>导出时间：</strong>{{ record.report_time }}</p>
        </div>
        <div class="card-footer">
          <el-button type="text" @click="viewDetail(record)">查看详情</el-button>
        </div>
      </el-card>

      <!-- 没有记录时的提示 -->
      <div v-if="filteredRecords.length === 0" class="no-records">
        <el-empty description="暂无导出记录" />
      </div>
    </div>
  </div>

  <!-- 弹出框 -->
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="60%"
    :before-close="handleClose"
  >
    <el-table :data="dialogTableData" height="40vw" style="width: 100%">
      <el-table-column
        v-for="(header, index) in tableHeaders"
        :key="index"
        :prop="header.prop"
        :label="header.label"
        :width="header.width || 'auto'"
      />
    </el-table>
  </el-dialog>
</template>

<script>
import Header from '../components/common/Header.vue';
import { ref, computed, onMounted } from 'vue';
import { Search } from '@element-plus/icons-vue';
import { findReport, findReportInfo } from '../api.js';
import { ElMessage } from 'element-plus';

export default {
  name: 'ExportRecords',
  components: {
    Header,
    Search,
  },
  setup() {
    const records = ref([]);
    const filters = ref({
      projectName: '',
    });
    const dialogVisible = ref(false);
    const dialogTableData = ref([]);
    const dialogTitle = ref('用例列表');
    const tableHeaders = ref([]);

    // 清理字符串以修复潜在的 JSON 格式问题
    const cleanJsonString = (str) => {
      if (typeof str !== 'string') return str;
      try {
        let cleaned = str
          .replace(/'/g, '"') // 单引号转双引号
          .replace(/[\n\r\t]/g, '') // 移除换行符和制表符
          .replace(/\\(?![\\bfnrt"])/g, '') // 移除无效反斜杠
          .replace(/，/g, ',') // 替换中文逗号
          .replace(/。/g, '.') // 替换中文句号
          .replace(/～/g, '~') // 替换中文波浪号
          .replace(/[\u200B-\u200F\u2028-\u202F]/g, ''); // 移除不可见 Unicode 字符

        // 修复未闭合的字符串
        if (cleaned.match(/,\s*\[[^\]]*?$/)) {
          // 如果最后一个元素未闭合，补全引号和括号
          cleaned = cleaned.replace(/,\s*\[([^\]]*?)$/, ', ["$1"]');
          cleaned = cleaned.replace(/,(\s*[^,\]\["]*?)$/, ',"$1"]');
        }
        return cleaned;
      } catch (error) {
        console.error('清理字符串失败:', error, '原始字符串:', str);
        return str;
      }
    };

    // 获取报表列表
    const fetchRecords = async () => {
      try {
        const response = await findReport({});
        const data = await response.data.text();
        const parsedData = JSON.parse(data);
        records.value = parsedData.sort((a, b) => a.report_id - b.report_id);
      } catch (error) {
        console.error('获取报表数据失败:', error);
        records.value = [];
        ElMessage.error('获取报表数据失败，请稍后重试');
      }
    };

    // 组件挂载时获取数据
    onMounted(() => {
      fetchRecords();
    });

    // 过滤记录
    const filteredRecords = computed(() => {
      const keyword = filters.value.projectName.toLowerCase().trim();
      if (!keyword) return records.value;
      return records.value.filter(record =>
        record.report_title.toLowerCase().includes(keyword)
      );
    });

    // 搜索处理
    const handleSearch = () => {
      // 搜索逻辑已通过 filteredRecords 实现
    };

    // 查看详情
    const viewDetail = async (record) => {
      try {
        const response = await findReportInfo({ report_id: record.report_id });
        const data = response.data;
		console.log(record.report_id)
        if (data && data.length > 0) {
          const report = data[0];
          dialogTitle.value = report.report_title;

          // 解析表头
          let headers;
          try {
            console.log('原始 report_head:', report.report_head);
            const cleanedHead = cleanJsonString(report.report_head);
            console.log('清理后 report_head:', cleanedHead);
            headers = JSON.parse(cleanedHead);
          } catch (error) {
            console.error('解析 report_head 失败:', error, '原始数据:', report.report_head);
            ElMessage.warning('解析表头失败，使用默认表头');
            headers = ['编号', '分类', '类别', '模块', '测试项', '测试方法', '测试结果', '备注'];
          }

          // 设置动态表头
          tableHeaders.value = headers.map((label, index) => ({
            prop: ['id', 'category', 'type', 'module', 'item', 'method', 'result', 'remark'][index] || `column${index}`,
            label,
            width: index === 0 ? '80' : 'auto',
          }));

          // 解析表内容
          let body;
          try {
            console.log('原始 report_body:', report.report_body);
            const cleanedBody = cleanJsonString(report.report_body);
            console.log('清理后 report_body:', cleanedBody);
            body = JSON.parse(cleanedBody);
          } catch (error) {
            console.error('解析 report_body 失败:', error, '原始数据:', report.report_body);
            ElMessage.error('解析表内容失败，请检查数据格式');
            dialogTableData.value = [];
            dialogVisible.value = true;
            return;
          }

          // 动态映射数据，补齐空值
          dialogTableData.value = body.map(row => {
            const paddedRow = [...row, ...Array(Math.max(0, headers.length - row.length)).fill('')]; // 补齐缺失字段
            return headers.reduce((obj, _, index) => {
              obj[tableHeaders.value[index].prop] = paddedRow[index] || '';
              return obj;
            }, {});
          });
        } else {
          dialogTableData.value = [];
          ElMessage.warning('未获取到报表详情数据');
        }
        dialogVisible.value = true;
      } catch (error) {
        console.error('获取报表详情失败:', error);
        dialogTableData.value = [];
        ElMessage.error('获取报表详情失败，请稍后重试');
        dialogVisible.value = true;
      }
    };

    // 关闭弹窗
    const handleClose = () => {
      dialogVisible.value = false;
      dialogTableData.value = [];
      tableHeaders.value = [];
    };

    return {
      records,
      filters,
      filteredRecords,
      handleSearch,
      dialogVisible,
      dialogTableData,
      dialogTitle,
      tableHeaders,
      viewDetail,
      handleClose,
    };
  },
};
</script>

<style scoped>
.container {
  padding: 20px;
}

.search-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.card-container {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  padding: 0 20px;
}

.record-card {
  background-color: #fff;
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.record-card:hover {
  transform: translateY(-5px);
}

.card-content {
  padding: 10px;
}

.card-content p {
  margin: 10px 0;
  font-size: 14px;
  color: #303133;
}

.card-content strong {
  color: #606266;
}

.card-footer {
  text-align: right;
}

.no-records {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px 0;
}

@media (max-width: 1200px) {
  .card-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .card-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .card-container {
    grid-template-columns: 1fr;
  }
}
</style>
