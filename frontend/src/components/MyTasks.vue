<template>
  <div>
    <h2>当前进行中的测试</h2>
    <el-table :data="ongoingTasks" style="width: 100%">
      <el-table-column prop="project_name" label="项目名称" />
      <el-table-column prop="owner_name" label="负责人" />
      <el-table-column prop="chamber_number" label="使用箱号" />
      <el-table-column label="进度">
        <template #default="{ row }">
          <el-progress :percentage="row.progress" />
        </template>
      </el-table-column>
      <el-table-column prop="start_time" label="开始时间" :formatter="formatDate" />
    </el-table>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  setup() {
    const allTasks = ref([])
    const newTask = ref({ project_name: '', description: '', expected_end_time: null })
    const activeTab = ref('waiting')

    const waitingTasks = computed(() => allTasks.value.filter(t => t.status === 'waiting'))
    const ongoingTasks = computed(() => allTasks.value.filter(t => t.status === 'ongoing'))
    const completedTasks = computed(() => allTasks.value.filter(t => t.status === 'completed'))

    const fetchMyTasks = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'))
        const res = await axios.get(`/api/tasks?user_id=${user.id}`)
        allTasks.value = res.data
      } catch (error) {
        ElMessage.error('加载任务失败')
      }
    }

    const createTask = async () => {
      if (!newTask.value.project_name) {
        ElMessage.warning('请填写项目名称')
        return
      }
      try {
        await axios.post('/api/tasks', newTask.value)
        ElMessage.success('申请已提交')
        newTask.value = { project_name: '', description: '', expected_end_time: null }
        fetchMyTasks()
      } catch (error) {
        ElMessage.error('提交失败')
      }
    }

    const cancelTask = async (taskId) => {
      try {
        await ElMessageBox.confirm('确定要取消这个测试申请吗？')
        await axios.put(`/api/tasks/${taskId}`, { status: 'cancelled' })
        ElMessage.success('已取消')
        fetchMyTasks()
      } catch (error) {
        if (error !== 'cancel') ElMessage.error('操作失败')
      }
    }

    const formatDate = (row, column, value) => {
      return value ? new Date(value).toLocaleString() : '-'
    }

    onMounted(() => {
      fetchMyTasks()
    })

    return { newTask, waitingTasks, ongoingTasks, completedTasks, activeTab, createTask, cancelTask, formatDate }
  }
}
</script>