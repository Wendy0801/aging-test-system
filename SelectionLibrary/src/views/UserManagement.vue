<template>
  <div class="user-management-container">
    <Header />
    <div class="main-content">
      <UserSidebar />
      <div class="side-main-content">
        <div class="main-content-top">
          <el-button
            type="primary"
            round
            class="create-user-btn"
            @click="openAddUser"
          >
            <img src="/src/assets/add2.png" class="el-button-img" />
            新增用户
          </el-button>

          <div class="filters-wrap">
            <el-input
              v-model="keyword"
              clearable
              placeholder="关键字搜索（姓名 / 账号 / 所属企业）"
              style="width: 18vw; margin-right: 0.5vw;"
              @keyup.enter="handleSearch"
            />
            <!-- （可选）角色筛选 -->
            <el-select v-model="roleId" clearable placeholder="角色筛选" style="width: 10vw; margin-right: 0.5vw;" @change="handleSearch">
              <el-option v-for="(label, id) in roleMap" :key="id" :label="label" :value="Number(id)" />
            </el-select>
            <el-button round @click="handleSearch">搜索</el-button>
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="pagedUserList"
          stripe
          style="width: 100%; flex: 1;"         
          :row-style="{ height: '48px' }" 
          :header-row-style="{ height: '48px' }"
        >
          <el-table-column label="编号" type="index" width="80" align="center" :index="indexMethod" />
          <el-table-column label="姓名" prop="name" align="center" />
          <el-table-column label="所属企业" prop="enterprise" align="center" />
          <el-table-column label="账号" prop="account" align="center" />

          <el-table-column label="密码" prop="password" align="center">
            <template #default>
              ********
            </template>
          </el-table-column>

          <el-table-column label="角色" prop="role_id" align="center">
            <template #default="{ row }">
              {{ roleMap[row.role_id] || row.role_name || '未知角色' }}
            </template>
          </el-table-column>

          <el-table-column label="备注" prop="remark" align="center">
            <template #default="{ row }">
              <div class="cell-2line" :title="row.remark">
                {{ row.remark || '-' }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" prop="create_time" align="center" width="180" />

          <el-table-column label="操作" width="160" align="center">
            <template #default="{ row }">
              <el-button size="small" type="primary" plain @click="editUser(row)">
                编辑
              </el-button>
              <el-button size="small" type="danger" plain @click="deleteUserRow(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="table-pagination">
          <div class="pagination-info">
            共 {{ total }} 行 | 共 {{ totalPages }} 页
          </div>
          <el-pagination
            background
            layout="prev, pager, next, sizes"
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[11, 15, 20]"
            :total="total"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增用户' : '编辑用户'"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>

        <el-form-item label="所属企业" prop="enterprise">
          <el-select 
            v-model="form.enterprise" 
            placeholder="请选择所属企业" 
            style="width: 100%;"
            clearable
            filterable
          >
            <el-option
              v-for="item in enterpriseOptions"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="dialogMode === 'add'" label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入账号" />
        </el-form-item>

        <el-form-item :label="dialogMode === 'add' ? '密码' : '新密码'" :prop="dialogMode === 'add' ? 'password' : ''">
          <el-input
            v-model="form.password"
            show-password
            :placeholder="dialogMode === 'add' ? '请输入密码' : '不修改可留空'"
          />
        </el-form-item>

        <el-form-item label="角色" prop="role_id">
          <el-select
            v-model="form.role_id"
            placeholder="请选择角色"
            style="width: 100%;"
            :disabled="dialogMode === 'edit' && form.role_id === 1"
          >
            <!-- 如果正在编辑的用户是系统管理员：额外塞一个“系统管理员”选项用于显示 -->
            <el-option
              v-if="dialogMode === 'edit' && form.role_id === 1"
              :label="roleMap[1]"
              :value="1"
            />
            <el-option
              v-for="item in roleOptionsForForm"
              :key="item.id"
              :label="item.label"
              :value="item.id"
            />
          </el-select>
        
          <!-- 可选：给个提示文案 -->
          <div v-if="dialogMode === 'edit' && form.role_id === 1" style="font-size: 12px; color: #909399; margin-top: 6px;">
            系统管理员角色不允许在此处修改
          </div>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注（可选）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Header from '@/components/common/Header.vue'
import UserSidebar from '@/components/common/UserSidebar.vue'
import api from '@/api' 

const keyword = ref('')
const roleId = ref(null)

const roleMap = {
  1: '系统管理员',
  2: '测试主管',
  3: '测试工程师',
  4: '电子主管',
  5: '电子工程师',
  6: '结构主管',
  7: '结构工程师',
  8: '工程主管',
  9: '工程人员',
  10: '采购人员',
  11: '注册人员',
}

const DEFAULT_ROLE_ID = 2

const enterpriseOptions = [
  '珠海视新医用科技股份有限公司',
]

const loading = ref(false)
const saving = ref(false)

const userList = ref([])

// 分页（后端当前未给分页参数，这里做前端分页）
const currentPage = ref(1)
const pageSize = ref(11)
const indexMethod = (index) => {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

const total = computed(() => userList.value.length)
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const pagedUserList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return userList.value.slice(start, start + pageSize.value)
})

const handleSearch = async () => {
  currentPage.value = 1
  await fetchUsers()
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 拉取用户列表
const fetchUsers = async () => {
  loading.value = true
  try {
    const params = {}
    if (keyword.value) params.keyword = keyword.value
    if (roleId.value) params.role_id = roleId.value

    const res = await api.users.getUsers(params)
    // 期望后端返回: { total, data: [...] }
    const data = res?.data?.data ?? []
    userList.value = Array.isArray(data) ? data : []
  } catch (e) {
    ElMessage.error(e?.response?.data?.detail || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

/** 弹窗：新增/编辑 **/
const dialogVisible = ref(false)
const dialogMode = ref('add') // 'add' | 'edit'
const editingId = ref(null)

const formRef = ref(null)
const form = ref({
  name: '',
  enterprise: '',
  account: '',
  password: '',
  role_id: DEFAULT_ROLE_ID,
  remark: '',
})

const roleOptionsForForm = computed(() =>
  Object.entries(roleMap)
    .map(([id, label]) => ({ id: Number(id), label }))
    .filter(item => item.id !== 1) // 禁止选择系统管理员
)

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  enterprise: [{ required: true, message: '请选择所属企业', trigger: 'change' }],  // ← 改这里
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role_id: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

const resetForm = () => {
  form.value = {
    name: '',
    enterprise: '',
    account: '',
    password: '',
    role_id: DEFAULT_ROLE_ID,
    remark: '',
  }
  editingId.value = null
}

const openAddUser = () => {
  dialogMode.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const editUser = (row) => {
  dialogMode.value = 'edit'
  editingId.value = row.id
  form.value = {
    name: row.name || '',
    enterprise: row.enterprise || '',
    account: row.account || '',
    password: '',
    role_id: row.role_id ?? DEFAULT_ROLE_ID,
    remark: row.remark || '',
  }

  dialogVisible.value = true
}

// 构建 payload：避免把前端多余字段带过去
const buildCreatePayload = () => ({
  name: String(form.value.name || '').trim(),
  enterprise: String(form.value.enterprise || '').trim(),
  account: String(form.value.account || '').trim(),
  password: String(form.value.password || '').trim(),
  role_id: Number(form.value.role_id),
  remark: String(form.value.remark || '').trim(),
})

const buildUpdatePayload = () => {
  const payload = {
    name: String(form.value.name || '').trim(),
    enterprise: String(form.value.enterprise || '').trim(),
    remark: String(form.value.remark || '').trim(),
  }

  // ✅ 只有非管理员才允许传 role_id（管理员保持原样）
  if (!(dialogMode.value === 'edit' && form.value.role_id === 1)) {
    payload.role_id = Number(form.value.role_id)
  }

  if (form.value.password && String(form.value.password).trim()) {
    payload.password = String(form.value.password).trim()
  }
  return payload
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      if (dialogMode.value === 'add') {
        await api.users.createUser(buildCreatePayload())
        ElMessage.success('新增成功')
      } else {
        await api.users.updateUser(editingId.value, buildUpdatePayload())
        ElMessage.success('编辑成功')
      }
      dialogVisible.value = false
      await fetchUsers()
    } catch (e) {
      ElMessage.error(e?.response?.data?.detail || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

const deleteUserRow = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定删除用户「${row.name}」吗？`,
      '提示',
      { type: 'warning' }
    )
    await api.users.deleteUser(row.id)
    ElMessage.success('删除成功')
    await fetchUsers()
  } catch (e) {
    if (e?.response) {
      ElMessage.error(e?.response?.data?.detail || '删除失败')
    }
  }
}
</script>

<style scoped>
.user-management-container {
  width: 100%;
  height: 97vh;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.side-main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;          
  min-width: 0;
}

.main-content-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.create-user-btn {
  width: 7vw;
  height: 4vh;
  font-size: 0.92rem;
}

.el-button-img {
  width: 1vw;
  height: 1.8vh;
  margin-right: 0.5vw;
}

.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  height: 12vh;
  padding: 0 1vw;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
  font-size: 0.9rem;
}

.pagination-info {
  color: #606266;
}

.cell-2line {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 22px;
}

.filters-wrap {
  display: flex;
  align-items: center;
}
</style>
