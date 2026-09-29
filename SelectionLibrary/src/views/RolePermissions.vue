<template>
  <div class="role-permissions-container">
    <Header />

    <div class="main-content">
      <UserSidebar />

      <div class="side-main-content">
        <div class="main-content-top">
          <div class="title-wrap">
            <div class="page-title">角色权限配置</div>
            <div class="page-subtitle">勾选后自动保存</div>
          </div>

          <div class="filters-wrap">
            <el-select
              v-model="selectedLibrary"
              style="width: 16vw;"
            >
              <el-option
                v-for="opt in libraryOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </div>
        </div>

        <el-table
          v-loading="loading"
          :data="roleRows"
          stripe
          height="74vh"
          style="width: 100%;"
        >
          <el-table-column label="编号" prop="role_id" width="90" align="center" />
          <el-table-column label="角色" prop="role_name" width="160" align="center" />

          <el-table-column label="操作权限" align="left">
            <template #default="{ row }">
              <div class="perm-wrap">
                <el-checkbox-group
                  :model-value="getCheckedByLibrary(row.role_id)"
                  @change="(val) => onCheckboxChange(row.role_id, val)"
                >
                  <el-checkbox
                    v-for="p in currentLibraryPermissions"
                    :key="p.id"
                    :label="p.id"
                    :disabled="savingRoleId === row.role_id"
                  >
                    {{ p.name }}
                  </el-checkbox>
                </el-checkbox-group>

                <div class="row-tip">
                  <span v-if="savingRoleId === row.role_id">保存中...</span>
                </div>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="footer-tip">
          提示：切换库只影响“显示/勾选”的权限范围；保存时会合并两个库的权限并覆盖提交，避免互相覆盖丢失。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Header from '@/components/common/Header.vue'
import UserSidebar from '@/components/common/UserSidebar.vue'
import api from '@/api'

/** 角色固定列表 */
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
  11: '注册人员/品质人员',
}

const roleRows = computed(() =>
  Object.entries(roleMap)
    .map(([id, name]) => ({
      role_id: Number(id),
      role_name: name,
    }))
    .filter(role => role.role_id !== 1) 
)

/** 库切换 */
const libraryOptions = [
  { value: 'material', label: '物料选型库' },
  { value: 'bom', label: '关键元器件清单库' },
]
const selectedLibrary = ref('material')

/** 后端权限项 */
const allPermissions = ref([])

/** 每个角色已勾选权限（按库分别存，避免互相覆盖） */
const checkedMaterial = ref({}) // { [roleId]: number[] }  id:1~9
const checkedBom = ref({}) // { [roleId]: number[] }  id:10~12

/** 加载/保存状态 */
const loading = ref(false)
const savingRoleId = ref(null)

/** 当前库显示哪些权限 */
const currentLibraryPermissions = computed(() => {
  const list = allPermissions.value || []
  if (selectedLibrary.value === 'material') {
    return list.filter((p) => p.id >= 1 && p.id <= 9)
  }
  return list.filter((p) => p.id >= 10 && p.id <= 12)
})

const getCheckedByLibrary = (roleId) => {
  if (selectedLibrary.value === 'material') {
    return checkedMaterial.value[roleId] || []
  }
  return checkedBom.value[roleId] || []
}

/** 拉取：所有权限项 */
const fetchAllPermissions = async () => {
  const res = await api.rolePermissions.getPermissions()
  const data = res?.data ?? []
  allPermissions.value = Array.isArray(data) ? data : []
}

/** 拉取：某角色已配置权限 -> 分配到两个库 */
const fetchRoleChecked = async (roleId) => {
  const res = await api.rolePermissions.getRolePermissions(roleId)
  const perms = res?.data?.data?.permissions ?? []
  const ids = Array.isArray(perms) ? perms.map((p) => p.id) : []

  checkedMaterial.value[roleId] = ids.filter((id) => id >= 1 && id <= 9)
  checkedBom.value[roleId] = ids.filter((id) => id >= 10 && id <= 12)
}

/** 初始化：先权限项，再并发拉每个角色配置 */
const initPage = async () => {
  loading.value = true
  try {
    await fetchAllPermissions()

    const ids = roleRows.value.map((r) => r.role_id)
    await Promise.all(ids.map((id) => fetchRoleChecked(id)))
  } catch (e) {
    ElMessage.error(e?.response?.data?.detail || '初始化权限数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initPage()
})


/**
 * 保存：POST 覆盖
 * 注意：为了避免切换库时把另一库权限覆盖掉，提交时合并两个库
 */
const postRolePermissions = async (roleId) => {
  const idsMaterial = checkedMaterial.value[roleId] || []
  const idsBom = checkedBom.value[roleId] || []
  const merged = Array.from(new Set([...idsMaterial, ...idsBom])).sort((a, b) => a - b)

  savingRoleId.value = roleId
  try {
    await api.rolePermissions.setRolePermissions({
      role_id: roleId,
      permission_ids: merged,
    })
    ElMessage.success(`角色「${roleMap[roleId]}」权限已更新`)
  } catch (e) {
    ElMessage.error(e?.response?.data?.detail || '保存失败，已保留当前勾选状态')
  } finally {
    savingRoleId.value = null
  }
}

/** 每个角色一个简单防抖，避免疯狂点导致连发 */
const saveTimers = ref({}) // { [roleId]: any }

const scheduleSave = (roleId) => {
  if (saveTimers.value[roleId]) clearTimeout(saveTimers.value[roleId])
  saveTimers.value[roleId] = setTimeout(() => {
    postRolePermissions(roleId)
  }, 300)
}

/** 勾选变化：立刻写入本地缓存 + 自动 post */
const onCheckboxChange = (roleId, newCheckedIds) => {
  const clean = Array.isArray(newCheckedIds) ? newCheckedIds.map((x) => Number(x)) : []

  if (selectedLibrary.value === 'material') {
    checkedMaterial.value[roleId] = clean
  } else {
    checkedBom.value[roleId] = clean
  }

  scheduleSave(roleId)
}
</script>

<style scoped>
.role-permissions-container {
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

.title-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  font-size: 0.85rem;
  color: #909399;
}

.filters-wrap {
  display: flex;
  align-items: center;
}

.perm-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.row-tip {
  min-width: 70px;
  text-align: right;
  color: #909399;
  font-size: 0.85rem;
  line-height: 28px;
}

.footer-tip {
  margin-top: 10px;
  padding: 10px 12px;
  font-size: 0.88rem;
  color: #606266;
  background: #fff;
  border-top: 1px solid #ebeef5;
}
</style>
