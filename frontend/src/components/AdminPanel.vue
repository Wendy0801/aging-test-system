<template>
  <div>
    <h2>管理测试任务</h2>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="等待中的任务" name="waiting">
        <el-table :data="waitingTasks" style="width: 100%">
          <el-table-column prop="project_name" label="项目名称" />
          <el-table-column prop="owner_name" label="申请人" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="expected_end_time" label="预计完成" :formatter="formatDate" />
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button size="small" type="success" @click="openAssignDialog(row)">分配箱子并开始</el-button>
              <el-button size="small" type="danger" @click="rejectTask(row.id)">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="进行中的任务" name="ongoing">
        <el-table :data="ongoingTasks" style="width: 100%">
          <el-table-column prop="project_name" label="项目名称" />
          <el-table-column prop="owner_name" label="负责人" />
          <el-table-column prop="chamber_number" label="测试箱" />
          <el-table-column label="进度">
            <template #default="{ row }">
              <el-progress :percentage="row.progress" />
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button size="small" @click="editTask(row)">编辑/更新进度</el-button>
              <el-button size="small" type="primary" @click="completeTask(row.id)">完成测试</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 分配箱子对话框 -->
    <el-dialog v-model="assignDialogVisible" title="分配测试箱">
      <el-form>
        <el-form-item label="选择测试箱">
          <el-select v-model="selectedChamberId" placeholder="请选择空闲测试箱">
            <el-option v-for="ch in freeChambers" :key="ch.id" :label="ch.name" :value="ch.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="初始进度 (%)">
          <el-input-number v-model="initialProgress" :min="0" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="assignTask">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 编辑任务对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑任务">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="editForm.project_name" />
        </el-form-item>
        <el-form-item label="测试结果描述">
          <el-input type="textarea" v-model="editForm.result_text" />
        </el-form-item>
        <el-form-item label="进度 (%)">
          <el-input-number v-model="editForm.progress" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="预计结束时间">
          <el-date-picker v-model="editForm.expected_end_time" type="datetime" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTaskEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const activeTab = ref('waiting')
    const waitingTasks = ref([])
    const ongoingTasks = ref([])
    const allChambers = ref([])
    const assignDialogVisible = ref(false)
    const editDialogVisible = ref(false)
    const currentTaskId = ref(null)
    const selectedChamberId = ref(null)
    const initialProgress = ref(0)
    const editForm = ref({ project_name: '', result_text: '', progress: 0, expected_end_time: null })
    
    const freeChambers = ref([])

    const fetchData = async () => {
      try {
        const waitingRes = await axios.get('/api/tasks?status=waiting')
        waitingTasks.value = waitingRes.data
        const ongoingRes = await axios.get('/api/tasks?status=ongoing')
        ongoingTasks.value = ongoingRes.data
        const chambersRes = await axios.get('/api/chambers')
        allChambers.value = chambersRes.data
        updateFreeChambers()
      } catch (error) {
        ElMessage.error('加载数据失败')
      }
    }

    const updateFreeChambers = () => {
      freeChambers.value = allChambers.value.filter(c => !c.is_occupied)
    }

    const openAssignDialog = (task) => {
      currentTaskId.value = task.id
      updateFreeChambers()
      assignDialogVisible.value = true
    }

    const assignTask = async () => {
      if (!selectedChamberId.value) {
        ElMessage.warning('请选择测试箱')
        return
      }
      try {
        await axios.put(`/api/tasks/${currentTaskId.value}`, {
          status: 'ongoing',
          chamber_id: selectedChamberId.value,
          progress: initialProgress.value
        })
        ElMessage.success('测试已开始')
        assignDialogVisible.value = false
        fetchData()
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '操作失败')
      }
    }

    const editTask = (task) => {
      currentTaskId.value = task.id
      editForm.value = {
        project_name: task.project_name,
        result_text: task.result_text || '',
        progress: task.progress,
        expected_end_time: task.expected_end_time
      }
      editDialogVisible.value = true
    }

    const saveTaskEdit = async () => {
      try {
        await axios.put(`/api/tasks/${currentTaskId.value}`, editForm.value)
        ElMessage.success('更新成功')
        editDialogVisible.value = false
        fetchData()
      } catch (error) {
        ElMessage.error('更新失败')
      }
    }

    const completeTask = async (taskId) => {
      try {
        await axios.put(`/api/tasks/${taskId}`, { status: 'completed' })
        ElMessage.success('测试已完成')
        fetchData()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }

    const rejectTask = async (taskId) => {
      try {
        await axios.put(`/api/tasks/${taskId}`, { status: 'cancelled' })
        ElMessage.success('已拒绝该申请')
        fetchData()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }

    const formatDate = (row, column, value) => {
      return value ? new Date(value).toLocaleString() : '-'
    }

    onMounted(() => {
      fetchData()
    })

    return {
      activeTab,
      waitingTasks,
      ongoingTasks,
      assignDialogVisible,
      editDialogVisible,
      freeChambers,
      selectedChamberId,
      initialProgress,
      editForm,
      openAssignDialog,
      assignTask,
      editTask,
      saveTaskEdit,
      completeTask,
      rejectTask,
      formatDate
    }
  }
}
</script>