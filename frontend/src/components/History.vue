<template>
  <div>
    <h2>历史测试记录</h2>
    <el-table :data="completedTasks" style="width: 100%">
      <el-table-column prop="project_name" label="项目名称" />
      <el-table-column prop="owner_name" label="负责人" />
      <el-table-column prop="chamber_number" label="使用箱号" />
      <el-table-column prop="result_text" label="测试结果" />
      <el-table-column prop="start_time" label="开始时间" :formatter="formatDate" />
      <el-table-column prop="actual_end_time" label="结束时间" :formatter="formatDate" />
    </el-table>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const completedTasks = ref([])

    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/tasks?status=completed')
        completedTasks.value = res.data
      } catch (error) {
        ElMessage.error('加载历史记录失败')
      }
    }

    const formatDate = (row, column, value) => {
      return value ? new Date(value).toLocaleString() : '-'
    }

    onMounted(() => {
      fetchHistory()
    })

    return { completedTasks, formatDate }
  }
}
</script>