<template>
  <div>
    <h2>我的测试任务</h2>
    
    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>新建测试申请</span>
      </template>
      <el-form :model="newTask" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="newTask.project_name" />
        </el-form-item>
        <el-form-item label="测试描述">
          <el-input type="textarea" v-model="newTask.description" />
        </el-form-item>
        <el-form-item label="预计结束时间">
          <el-date-picker v-model="newTask.expected_end_time" type="datetime" placeholder="选择时间" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="createTask">提交申请</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="等待中" name="waiting">
        <el-table :data="waitingTasks">
          <el-table-column prop="project_name" label="项目名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="created_at" label="申请时间" :formatter="formatDate" />
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button size="small" type="danger" @click="cancelTask(row.id)">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="进行中" name="ongoing">
        <el-table :data="ongoingTasks">
          <el-table-column prop="project_name" label="项目名称" />
          <el-table-column prop="chamber_number" label="测试箱号" />
          <el-table-column label="进度">
            <template #default="{ row }">
              <el-progress :percentage="row.progress" />
            </template>
          </el-table-column>
          <el-table-column prop="start_time" label="开始时间" :formatter="formatDate" />
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="已完成" name="completed">
        <el-table :data="completedTasks">
          <el-table-column prop="project_name" label="项目名称" />
          <el-table-column prop="chamber_number" label="使用箱号" />
          <el-table-column prop="result_text" label="测试结果" />
          <el-table-column prop="actual_end_time" label="完成时间" :formatter="formatDate" />
        </el-table>
      </el-tab-pane>
    </el-tabs>
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