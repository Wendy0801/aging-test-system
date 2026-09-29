<template>
  <div class="field-permissions-container">
    <Header />

    <div class="main-content">
      <UserSidebar />

      <div class="side-main-content">
        <div class="main-content-top">
          <div class="title-wrap">
            <div class="page-title">字段权限配置</div>
            <div class="page-subtitle">勾选后自动保存</div>
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

          <el-table-column label="字段权限" align="left">
            <template #default="{ row }">
              <div class="perm-wrap">
                <el-checkbox-group
                  :model-value="getCheckedField(row.role_id)"
                  @change="(val) => onCheckboxChange(row.role_id, val)"
                >
                  <el-checkbox
                    v-for="p in fieldPermissions"
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
          提示：此页面只配置字段权限；保存时会与该角色其它权限合并后覆盖提交，避免丢失其它权限。
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

/* 角色固定列表 */
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
  Object.entries(roleMap).map(([id, name]) => ({
    role_id: Number(id),
    role_name: name,
  }))
  .filter(role => role.role_id !== 1) 
)

/** 后端权限项 */
const allPermissions = ref([])

/** 字段权限：id 13~14 */
const fieldPermissions = computed(() => {
  const list = allPermissions.value || []
  return list.filter((p) => p.id >= 13 && p.id <= 14)
})

/**
 * 每个角色的权限本地缓存：
 * - checkedField: 当前页面（13~14）
 * - checkedOther: 其它权限（1~12），用于“合并提交”，避免覆盖丢失
 */
const checkedField = ref({}) // { [roleId]: number[] }  13~14
const checkedOther = ref({}) // { [roleId]: number[] }  1~12

/** 加载/保存状态 */
const loading = ref(false)
const savingRoleId = ref(null)

/** 拉取：所有权限项 */
const fetchAllPermissions = async () => {
  const res = await api.rolePermissions.getPermissions()
  const data = res?.data ?? []
  allPermissions.value = Array.isArray(data) ? data : []
}

/** 拉取：某角色已配置权限 -> 拆成字段权限/其它权限 */
const fetchRoleChecked = async (roleId) => {
  const res = await api.rolePermissions.getRolePermissions(roleId)
  const perms = res?.data?.data?.permissions ?? []
  const ids = Array.isArray(perms) ? perms.map((p) => p.id) : []

  checkedField.value[roleId] = ids.filter((id) => id >= 13 && id <= 14)
  checkedOther.value[roleId] = ids.filter((id) => id >= 1 && id <= 12)
}

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

const getCheckedField = (roleId) => checkedField.value[roleId] || []

/**
 * 保存：POST 覆盖（合并提交）
 * 合并：字段权限(13~14) + 其它权限(1~12)
 */
const postRolePermissions = async (roleId) => {
  const idsField = checkedField.value[roleId] || []
  const idsOther = checkedOther.value[roleId] || []
  const merged = Array.from(new Set([...idsOther, ...idsField])).sort((a, b) => a - b)

  savingRoleId.value = roleId
  try {
    await api.rolePermissions.setRolePermissions({
      role_id: roleId,
      permission_ids: merged,
    })
    ElMessage.success(`角色「${roleMap[roleId]}」字段权限已更新`)
  } catch (e) {
    ElMessage.error(e?.response?.data?.detail || '保存失败，已保留当前勾选状态')
  } finally {
    savingRoleId.value = null
  }
}

/** 每个角色一个简单防抖，避免连点导致频繁请求 */
const saveTimers = ref({}) // { [roleId]: any }

const scheduleSave = (roleId) => {
  if (saveTimers.value[roleId]) clearTimeout(saveTimers.value[roleId])
  saveTimers.value[roleId] = setTimeout(() => {
    postRolePermissions(roleId)
  }, 300)
}

/** 勾选变化：写入本地 + 自动 post（合并提交） */
const onCheckboxChange = (roleId, newCheckedIds) => {
  const clean = Array.isArray(newCheckedIds) ? newCheckedIds.map((x) => Number(x)) : []
  checkedField.value[roleId] = clean
  scheduleSave(roleId)
}
</script>

<style scoped>
.field-permissions-container {
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
