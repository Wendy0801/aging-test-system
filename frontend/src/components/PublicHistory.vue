<template>

  <el-form :inline="true" style="margin-bottom:20px">
    <el-form-item label="项目名称">
      <el-input v-model="filters.project_name" placeholder="模糊搜索" />
    </el-form-item>
    <el-form-item label="委托人">
      <el-input v-model="filters.owner_name" placeholder="模糊搜索" />
    </el-form-item>
    <el-form-item label="开始时间">
      <el-date-picker v-model="filters.start_date" type="datetime" placeholder="起始" />
    </el-form-item>
    <el-form-item label="结束时间">
      <el-date-picker v-model="filters.end_date" type="datetime" placeholder="截止" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </el-form-item>
  </el-form>
  <el-table :data="history" style="width:100%">
    <el-table-column prop="project_name" label="项目名称" />
    <el-table-column prop="owner" label="委托人" />
    <el-table-column prop="chamber_number" label="箱子编号" />
    <el-table-column prop="start_time" label="开始时间" :formatter="formatDate" />
    <el-table-column prop="actual_end_time" label="结束时间" :formatter="formatDate" />
    <el-table-column prop="result_text" label="结果" />
  </el-table>



</template>
<script>
import { ref } from 'vue'
import axios from 'axios'

export default {
  setup() {
    const history = ref([])
    const filters = ref({ project_name: '', owner_name: '', start_date: null, end_date: null })
    const search = async () => {
      const params = {}
      if (filters.value.project_name) params.project_name = filters.value.project_name
      if (filters.value.owner_name) params.owner_name = filters.value.owner_name
      if (filters.value.start_date) params.start_date = new Date(filters.value.start_date).toISOString()
      if (filters.value.end_date) params.end_date = new Date(filters.value.end_date).toISOString()
      const res = await axios.get('/api/public/history', { params })
      history.value = res.data
    }
    const reset = () => {
      filters.value = { project_name: '', owner_name: '', start_date: null, end_date: null }
      search()
    }
    const formatDate = (row, col, val) => val ? new Date(val).toLocaleString() : '-'
    search() // 初始加载
    return { history, filters, search, reset, formatDate }
  }
}
</script>
<style scoped>
.common-layout .el-header {
  display: inline-flex;
  justify-content: space-between;
}

.common-layout .el-header span {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  width: 200px;
}

.common-layout .el-header .login-button {
  width: 80px;
}
</style>
