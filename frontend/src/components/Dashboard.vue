<template>
  <div>
  
    <h2>测试箱实时状态</h2>
    <el-row :gutter="20">
      <el-col :span="8" v-for="chamber in chambers" :key="chamber.id">
        <el-card class="chamber-card">
          <template #header>
            <div class="chamber-header">
              <span>{{ chamber.name }}</span>
              <el-tag :type="chamber.is_occupied ? 'danger' : 'success'">
                {{ chamber.is_occupied ? '使用中' : '空闲' }}
              </el-tag>
            </div>
          </template>
          <div v-if="chamber.is_occupied">
            <p><strong>当前项目：</strong>{{ chamber.current_task.project_name }}</p>
            <p><strong>负责人：</strong>{{ chamber.current_task.owner }}</p>
            <p><strong>进度：</strong>
              <el-progress :percentage="chamber.current_task.progress" />
            </p>
            <p><strong>开始时间：</strong>{{ formatDate(chamber.current_task.start_time) }}</p>
          </div>
          <div v-else>
            <p style="color: #67C23A">箱子空闲，可安排测试</p>
          </div>
        </el-card>
      </el-col>
    </el-row>


    
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const chambers = ref([])
    const ongoingTasks = ref([])

    const fetchData = async () => {
      try {
        const chambersRes = await axios.get('/api/chambers')
        chambers.value = chambersRes.data
        
        const tasksRes = await axios.get('/api/tasks?status=ongoing')
        ongoingTasks.value = tasksRes.data
      } catch (error) {
        ElMessage.error('加载数据失败')
      }
    }

    const formatDate = (row, column, value) => {
      return value ? new Date(value).toLocaleString() : '-'
    }

    onMounted(() => {
      fetchData()
    })

    return { chambers, ongoingTasks, formatDate }
  }
}
</script>

<style scoped>
.chamber-card {
  margin-bottom: 20px;
}
.chamber-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>