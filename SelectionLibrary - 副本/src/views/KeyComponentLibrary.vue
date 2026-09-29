<template>
  <div class="home-container" @click="closeAllContextMenus">
    <Header />

    <div class="main-content">
      <!-- 左侧目录 -->
      <div class="sidebar">
        <el-scrollbar height="90vh">
          <el-menu class="el-menu-vertical" background-color="#f8f9fa" :default-openeds="defaultOpened">
            <el-sub-menu v-for="level1 in directoryTree" :key="level1.id" :index="String(level1.id)">
              <template #title>
                <span class="dir-title" @click="handleLevel1Click(level1)">
                  <img class="dir-icon" src="/src/assets/first-level-directory.png" />
                  <span>{{ level1.name }}</span>
                </span>
              </template>

              <el-sub-menu
                v-for="level2 in level1.children"
                :key="level2.id"
                :index="level1.id + '-' + level2.id"
                @contextmenu.prevent="openContextMenu($event, level2)"
              >
                <template #title>
                  <span class="dir-title">
                    <img class="dir-icon" src="/src/assets/second-level-directory.png" />
                    <span>{{ level2.name }}</span>
                  </span>
                </template>

                <div class="module-tree-wrapper">
                  <el-tree
                    :data="level2.children"
                    node-key="id"
                    :ref="el => setTreeRef(el, level2.id)"
                    :props="{ label: 'name', children: 'children' }"
                    highlight-current
                    :expand-on-click-node="false"
                    @node-click="handleNodeClick"
                    @node-contextmenu="onNodeContextMenu"
                  >
                    <template #default="{ data }">
                      <span class="dir-title">
                        <img
                          class="dir-icon"
                          src="/src/assets/third-level-directory.png"
                          @error="onIconError"
                        />
                        <span>{{ data.name }}</span>
                      </span>
                    </template>
                  </el-tree>
                </div>
              </el-sub-menu>
            </el-sub-menu>
          </el-menu>
        </el-scrollbar>
      </div>

      <!-- 右键菜单（目录新增/编辑/删除） -->
      <div
        v-if="contextMenuVisible"
        class="context-menu"
        :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
        @click.stop
      >
        <div
          v-for="item in contextMenuItems"
          :key="item.label"
          class="context-menu-item"
          @click="handleContextMenuAction(item.action)"
        >
          {{ item.label }}
        </div>
      </div>

      <!-- 右侧主内容 -->
      <div class="side-main-content">
        <div class="main-content-top">
          <div>
            <el-tooltip :content="exportTooltip" :disabled="canExport" placement="top" effect="dark">
              <div style="display:inline-block;">
                <el-button
                  type="primary"
                  round
                  class="create-use-case"
                  :disabled="!canExport"
                  @click="handleExport"
                >
                  <img src="/src/assets/export.png" class="el-button-img" />
                  导出清单
                </el-button>
              </div>
            </el-tooltip>
          </div>

          <div class="filters-wrap">
            <el-input
              v-model="filters.keyword"
              clearable
              placeholder="关键字搜索（名称/物料编码/规格）"
              @keyup.enter="handleSearch"
              style="width: 22vw; margin-right: 0.5vw;"
            />
            <el-button round @click="handleSearch">筛选</el-button>
          </div>
        </div>

        <!-- 表格 -->
        <el-table :data="pagedTableData" stripe height="76vh" style="width: 100%;" @row-click="onRowClick" :row-class-name="() => 'clickable-row'" >
          <el-table-column label="编号" type="index" width="90" align="center" :index="indexMethod"/>

          <el-table-column label="名称" prop="name" align="center" min-width="140">
            <template #default="{ row }">
              <div class="cell-2line" :title="displayName(row)">{{ displayName(row) }}</div>
            </template>
          </el-table-column>

          <el-table-column label="物料编码" prop="material_code" align="center" width="160" />

          <el-table-column v-if="canViewManufacturer" label="生产商" prop="manufacturer" align="center" width="160">
            <template #default="{ row }">
              <div class="cell-2line" :title="displayManufacturer(row)">{{ displayManufacturer(row) }}</div>
            </template>
          </el-table-column>
          
          <el-table-column v-if="canViewSupplier" label="供应商" prop="supplier" align="center" width="160">
            <template #default="{ row }">
              <div class="cell-2line" :title="displaySupplier(row)">{{ displaySupplier(row) }}</div>
            </template>
          </el-table-column>

          <el-table-column label="型号/规格" prop="spec" align="center" min-width="160">
            <template #default="{ row }">
              <div class="cell-2line" :title="displaySpec(row)">{{ displaySpec(row) }}</div>
            </template>
          </el-table-column>

          <!-- 认证标签号：可多选，下拉框，选择后调用 materials.updateMaterial 覆盖提交 -->
          <el-table-column label="认证标签号" align="center" min-width="190">
            <template #default="{ row }">
              <el-popover placement="bottom" trigger="click" width="260" @after-leave="() => onCertPopoverClose(row)" >
                <template #reference>
                  <div class="cert-tags" @click.stop>
                    <el-tag
                      v-for="c in normalizeSelectedCert(row)"
                      :key="c"
                      size="small"
                      :type="certHasAttachment(row, c) ? 'success' : 'info'"
                      :effect="certHasAttachment(row, c) ? 'dark' : 'plain'"
                      :class="{ 'tag-disabled': !certHasAttachment(row, c) }"
                      style="margin: 2px 4px;"
                    >
                      {{ certShort(c) }}
                    </el-tag>
                    <el-tag v-if="normalizeSelectedCert(row).length === 0" size="small" type="info" effect="plain">
                      点击选择
                    </el-tag>
                  </div>
                </template>

                <div style="padding: 6px 2px;">
                  <div style="font-size: 12px; color:#606266; margin-bottom: 6px;">
                    <span v-if="canListEdit">可多选（勾选/取消会立即保存）</span>
                    <span v-else style="color:#e6a23c;">无权限：清单编辑</span>
                  </div>
                  <el-select
                    v-model="row.__editing_selected_cert"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="选择证书"
                    style="width: 100%;"
                    :disabled="!canListEdit"
                    @change="val => onSelectedCertChange(row, val)"
                  >
                    <el-option v-for="opt in CERT_OPTIONS" :key="opt" :label="opt" :value="opt" />
                  </el-select>
                </div>
              </el-popover>
            </template>
          </el-table-column>

          <!-- 认证证书（certification_number） -->
          <el-table-column label="认证证书" align="center" min-width="160">
            <template #default="{ row }">
              <div class="cert-time">
                <div
                  v-for="line in buildCertNumberLines(row)"
                  :key="line"
                  class="cell-1line"
                  :title="line"
                >
                  {{ line }}
                </div>
                <span v-if="buildCertNumberLines(row).length === 0">-</span>
              </div>
            </template>
          </el-table-column>

          <!-- 资料附件-->
          <el-table-column label="资料附件" align="center" min-width="120">
            <template #default="{ row }">
              <div class="attach-tags">
                <el-tag
                  size="small"
                  :type="getAttachmentFlags(row.attachments).cert ? 'success' : 'info'"
                  :effect="getAttachmentFlags(row.attachments).cert ? 'dark' : 'plain'"
                  :class="{
                    'tag-disabled': !getAttachmentFlags(row.attachments).cert || !canAttachView,
                    'tag-clickable': getAttachmentFlags(row.attachments).cert && canAttachView
                  }"
                  @click.stop="canAttachView && getAttachmentFlags(row.attachments).cert && openAttachmentGroupPreview(row, 'cert')"
                >
                  认证证书
                </el-tag>

                <el-tag
                  size="small"
                  :type="getAttachmentFlags(row.attachments).spec ? 'primary' : 'info'"
                  :effect="getAttachmentFlags(row.attachments).spec ? 'dark' : 'plain'"
                  :class="{
                    'tag-disabled': !getAttachmentFlags(row.attachments).spec || !canAttachView,
                    'tag-clickable': getAttachmentFlags(row.attachments).spec && canAttachView
                  }"
                  @click.stop="canAttachView && getAttachmentFlags(row.attachments).spec && openAttachmentGroupPreview(row, 'spec')"
                >
                  规格书
                </el-tag>
              </div>
            </template>
          </el-table-column>
        </el-table>
		<div class="table-pagination">
		  <div class="pagination-info">共 {{ total }} 行 | 共 {{ totalPages }} 页</div>
		  <el-pagination
		    background
		    layout="prev, pager, next, sizes"
		    :page-size="pageSize"
		    :current-page="currentPage"
		    :page-sizes="[10]"
		    :total="total"
		    @current-change="handlePageChange"
		    @size-change="handleSizeChange"
		  />
		</div>

        <!-- 附件组预览弹窗 -->
        <el-dialog v-model="attachmentDialogVisible" :title="attachmentDialogTitle" width="55vw">
          <el-table :data="attachmentDialogList" stripe style="width: 100%;">
            <el-table-column label="文件名" prop="file_name" min-width="220" />
            <el-table-column label="类型" prop="attachment_type" width="120" align="center" />
            <el-table-column label="证书编号" prop="certificate_number" width="140" align="center" />
            <el-table-column label="证书到期时间" prop="certification_time" width="120" align="center" />
            <el-table-column label="上传人" prop="uploader" width="100" align="center" />
            <el-table-column label="上传时间" prop="upload_time" width="160" align="center" />
            <el-table-column label="操作" width="160" align="center">
              <template #default="{ row }">
                <el-button size="small" type="primary" plain :disabled="!canAttachView || !(row.preview_url || row.download_url)" @click="canAttachView && openPdfPreview(row, '附件预览')">
                  预览
                </el-button>
                <el-button size="small" type="success" plain :disabled="!canAttachDownload || !row.download_url" @click="canAttachDownload && openDownload(row.download_url)">
                  下载
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-dialog>
		<el-dialog v-model="pdfPreviewDialogVisible" :title="pdfPreviewTitle" width="72vw" top="6vh" destroy-on-close>
		  <div class="pdf-preview-wrap">
		    <!-- 多文件时：左侧列表 -->
		    <div v-if="pdfPreviewFiles.length > 1" class="pdf-preview-left">
		      <el-select v-model="pdfPreviewActiveId" placeholder="选择文件" style="width: 100%;">
		        <el-option
		          v-for="f in pdfPreviewFiles"
		          :key="f._uid"
		          :label="f.file_name || ('附件' + f._uid)"
		          :value="f._uid"
		        />
		      </el-select>
		
		      <div class="pdf-preview-filelist">
		        <div
		          v-for="f in pdfPreviewFiles"
		          :key="f._uid"
		          class="pdf-preview-fileitem"
		          :class="{ active: f._uid === pdfPreviewActiveId }"
		          @click="pdfPreviewActiveId = f._uid"
		        >
		          {{ f.file_name || ('附件' + f._uid) }}
		        </div>
		      </div>
		    </div>
		
		    <!-- 预览区 -->
		    <div class="pdf-preview-right">
		      <iframe v-if="pdfPreviewUrl" :src="pdfPreviewUrl" class="pdf-iframe" />
		      <div v-else class="pdf-empty">无可预览地址（preview_url/download_url 为空）</div>
		    </div>
		  </div>
		
		  <template #footer>
		    <el-button @click="pdfPreviewDialogVisible = false">关闭</el-button>
		  </template>
		</el-dialog>
		<!-- 新增目录 -->
		<el-dialog title="新增目录" v-model="addDialogVisible" width="35vw" @close="resetAddForm">
		  <el-form :model="addForm" label-width="100px">
		    <el-form-item label="目录名称" required>
		      <el-input v-model="addForm.name" placeholder="请输入目录名称" />
		    </el-form-item>
		  </el-form>
		  <template #footer>
		    <el-button @click="addDialogVisible = false">取消</el-button>
		    <el-button type="primary" @click="confirmAddDirectory">确定</el-button>
		  </template>
		</el-dialog>
		
		<!-- 编辑目录 -->
		<el-dialog title="编辑目录" v-model="editDialogVisible" width="35vw" @close="resetEditForm">
		  <el-form :model="editForm" label-width="100px">
		    <el-form-item label="目录名称" required>
		      <el-input v-model="editForm.name" placeholder="请输入目录名称" />
		    </el-form-item>
		  </el-form>
		  <template #footer>
		    <el-button @click="editDialogVisible = false">取消</el-button>
		    <el-button type="primary" @click="confirmEditDirectory">保存</el-button>
		  </template>
		</el-dialog>
		
		<!-- 删除确认 -->
		<el-dialog title="删除确认" v-model="deleteDialogVisible" width="35vw" center>
		  <div style="font-size: 16px; text-align: center;">
		    确定删除该目录节点及其所有子节点吗？<br />
		    <span style="color:#e74c3c;">此操作不可恢复！</span>
		  </div>
		  <template #footer>
		    <el-button @click="deleteDialogVisible = false">取消</el-button>
		    <el-button type="danger" @click="confirmDeleteDirectory">确定删除</el-button>
		  </template>
		</el-dialog>
		
		<!-- 导出弹窗 -->
		<el-dialog v-model="exportDialogVisible" title="导出内容" width="32vw">
		  <el-form :model="exportForm" label-width="110px">
		    <!-- 国内/国外模板（必选，且单选） -->
		    <el-form-item :label="isForeign ? '国外模板' : '国内模板'" required>
		      <el-radio-group v-model="exportForm.model_type">
		        <el-radio v-if="!isForeign" label="省所">省所</el-radio>
		        <el-radio v-if="!isForeign" label="深圳所">深圳所</el-radio>
		        <el-radio v-if="isForeign" label="莱茵">莱茵</el-radio>
		      </el-radio-group>
		    </el-form-item>
		
		    <!-- 是否增加统一首页（homepage：是/否） -->
		    <el-form-item label="统一封面">
		      <el-checkbox v-model="exportForm.homepage">是否增加统一首页</el-checkbox>
		    </el-form-item>
		
		    <!-- 是否下载附件（download_file：是/否） -->
		    <el-form-item label="清单附件">
		      <el-checkbox v-model="exportForm.download_file">是否下载附件（认证报告+规格书）</el-checkbox>
		    </el-form-item>
		  </el-form>
		
		  <template #footer>
		    <el-button @click="exportDialogVisible = false">取消</el-button>
		    <el-button type="primary" @click="confirmExport">确定导出</el-button>
		  </template>
		</el-dialog>
		<el-drawer
		  v-model="isDetailDrawerVisible"
		  direction="rtl"
		  size="64%"
		  :with-header="false"
		  custom-class="beauty-drawer"
		>
		  <div class="drawer-header">
		    <div class="drawer-title">
		      <span class="title-text">{{ materialDetail.name || '-' }}</span>
		      <el-tag size="small" class="title-tag" type="info">ID: {{ materialDetail.id ?? '-' }}</el-tag>
		    </div>
		    <div class="drawer-subtitle">
		      <span class="sub-item">物料编码：{{ materialDetail.material_code || '-' }}</span>
		      <span class="sub-item">
		        规格型号：
		        {{
		          detailLocale === '国外'
		            ? (materialDetail.english_spec || '-')
		            : (materialDetail.spec || '-')
		        }}
		      </span>
		    </div>
		  </div>
		
		  <div class="drawer-body">
		    <!-- 基本信息 -->
		    <div class="drawer-card">
		      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
		        <span>基本信息</span>
		        <el-segmented
		          v-model="detailLocale"
		          :options="['国内','国外']"
		          size="small"
		        />
		      </div>
		
		      <div class="kv-grid">
		        <div class="kv-item">
		          <div class="kv-label">物料名称</div>
		          <div class="kv-value">
		            {{
		              detailLocale === '国外'
		                ? (materialDetail.english_name || '-')
		                : (materialDetail.name || '-')
		            }}
		          </div>
		        </div>
		
		        <div class="kv-item">
		          <div class="kv-label">物料编码</div>
		          <div class="kv-value">{{ materialDetail.material_code || '-' }}</div>
		        </div>
		
		        <div class="kv-item" v-if="canViewManufacturer">
		          <div class="kv-label">生产商</div>
		          <div class="kv-value">
		            {{
		              detailLocale === '国外'
		                ? (materialDetail.english_manufacturer || '-')
		                : (materialDetail.manufacturer || '-')
		            }}
		          </div>
		        </div>
		
		        <div class="kv-item" v-if="canViewSupplier">
		          <div class="kv-label">供应商</div>
		          <div class="kv-value">
		            {{
		              detailLocale === '国外'
		                ? (materialDetail.english_supplier || '-')
		                : (materialDetail.supplier || '-')
		            }}
		          </div>
		        </div>
		
		        <div class="kv-item">
		          <div class="kv-label">规格型号</div>
		          <div class="kv-value">
		            {{
		              detailLocale === '国外'
		                ? (materialDetail.english_spec || '-')
		                : (materialDetail.spec || '-')
		            }}
		          </div>
		        </div>
		
		        <div class="kv-item">
		          <div class="kv-label">推荐状态</div>
		          <div class="kv-value">
		            <span class="status-wrap">
		              <span class="status-dot" :class="statusDotClass(materialDetail.status)" />
		              <span>{{ materialDetail.status || '-' }}</span>
		            </span>
		          </div>
		        </div>
		      </div>
		    </div>
		
		    <!-- 用于项目 -->
		    <div class="drawer-card">
		      <div class="card-title">用于项目</div>
		      <el-table :data="materialDetail.projects || []" size="small" border style="width: 100%;">
		        <el-table-column label="编号" width="90" align="center">
		          <template #default="{ $index }">{{ $index + 1 }}</template>
		        </el-table-column>
		        <el-table-column label="项目名称" prop="project_name" width="240" align="center" />
		        <el-table-column label="国内外" prop="domestic_foreign" width="240" align="center" />
		        <el-table-column label="是否为关键元器件" prop="is_key_component" align="center" />
		        <el-table-column label="是否使用" prop="is_used" width="180" align="center" />
		      </el-table>
		    </div>
		
		    <!-- 技术参数 -->
		    <div class="drawer-card">
		      <div class="card-title">技术参数</div>
		      <el-table :data="materialDetail.tech_params || []" size="small" border style="width: 100%;">
		        <el-table-column label="编号" width="90" align="center">
		          <template #default="{ $index }">{{ $index + 1 }}</template>
		        </el-table-column>
		        <el-table-column label="关键参数" prop="param_name" align="center" />
		        <el-table-column label="参数指标" prop="param_value" align="center" />
		      </el-table>
		    </div>
		
		    <!-- 资料附件 -->
		    <div class="drawer-card">
		      <div class="card-title">资料附件</div>
		      <el-table :data="materialDetail.attachments || []" size="small" border style="width: 100%;">
		        <el-table-column label="编号" width="90" align="center">
		          <template #default="{ $index }">{{ $index + 1 }}</template>
		        </el-table-column>
		        <el-table-column label="文件类型" prop="attachment_type" width="120" align="center" />
		        <el-table-column label="文件名称" prop="file_name" align="center" />
		        <el-table-column label="上传时间" prop="upload_time" width="170" align="center" />
		        <el-table-column label="证书编号" prop="certificate_number" width="140" align="center" />
		        <el-table-column label="证书到期时间" prop="certification_time" width="140" align="center" />
		        <el-table-column label="操作" width="110" align="center">
		          <template #default="{ row }">
		            <el-button
		              size="small"
		              type="primary"
		              :disabled="!canAttachView || !(row.preview_url || row.download_url)"
		              plain
		              @click.stop="canAttachView && openPdfPreview(row, '附件预览')"
		            >
		              查看
		            </el-button>
		          </template>
		        </el-table-column>
		      </el-table>
		    </div>
		  </div>
		
		  <div class="drawer-footer">
		    <el-button type="primary" round @click="isDetailDrawerVisible = false">关闭</el-button>
		  </div>
		</el-drawer>
      </div>
    </div>
  </div>
</template>

<script>
import Header from '../components/common/Header.vue'
import { ref, onMounted, nextTick, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api/index.js'
import { getPermissionHelperFromLocal } from '../utils/permissions.js';


export default {
  name: 'KeyComponentLibrary',
  components: { Header },
  setup() {
	// =============================
	// ✅ 权限：从 localStorage 读取并解析（兼容 "['a','b']"）
	// =============================
	const getUserInfo = () => {
	  try {
	    return JSON.parse(localStorage.getItem('user_info') || '{}') || {}
	  } catch (e) {
	    return {}
	  }
	}
	
	const parsePermissions = (raw) => {
	  if (!raw) return []
	  if (Array.isArray(raw)) return raw.map(String)
	  if (typeof raw !== 'string') return []
	  const text = raw.trim()
	  if (!text) return []
	
	  // 先试标准 JSON
	  try {
	    const arr = JSON.parse(text)
	    if (Array.isArray(arr)) return arr.map(String)
	  } catch (_) {}
	
	  // 再兼容单引号数组
	  try {
	    const normalized = text.replace(/'/g, '"')
	    const arr = JSON.parse(normalized)
	    if (Array.isArray(arr)) return arr.map(String)
	  } catch (_) {}
	
	  return []
	}
	
	const userInfo = getUserInfo()
	const permSet = new Set(parsePermissions(userInfo.permissions).map(p => String(p).trim()).filter(Boolean))
	const hasPerm = (p) => permSet.has(String(p).trim())
	
	// 你这页用到的 8-14
	const P = {
	  ATTACH_VIEW: '8.附件查看',
	  ATTACH_DOWNLOAD: '9.附件下载',
	  PROJECT_MGMT: '10.项目管理',
	  LIST_EDIT: '11.清单编辑',
	  LIST_EXPORT: '12.清单导出',
	  MANUFACTURER_VIEW: '13.生产商字段查看权限',
	  SUPPLIER_VIEW: '14.供应商字段查看权限',
	}
	
	const canAttachView = computed(() => hasPerm(P.ATTACH_VIEW))
	const canAttachDownload = computed(() => hasPerm(P.ATTACH_DOWNLOAD))
	const canProjectManage = computed(() => hasPerm(P.PROJECT_MGMT))
	const canListEdit = computed(() => hasPerm(P.LIST_EDIT))
	const canListExport = computed(() => hasPerm(P.LIST_EXPORT))
	const canViewManufacturer = computed(() => hasPerm(P.MANUFACTURER_VIEW))
	const canViewSupplier = computed(() => hasPerm(P.SUPPLIER_VIEW))  
	
    // ============ 常量 ============
    const CERT_OPTIONS = [
      'UL', 'CCC', 'VDE', 'CQC', 'SA', 'CE', '规格书'
    ]
	
	const CERT_ONLY_TYPES = ['UL', 'CCC', 'VDE', 'CQC', 'SA', 'CE']

    const certShort = (full) => {
      const map = { UL:'UL', CCC:'CCC', VDE:'VDE', CQC:'CQC', SA:'SA', CE:'CE', '规格书':'规格书' }
      return map[full] || full
    }

    // ============ 目录树 ============
    const directoryTree = ref([])
    const defaultOpened = ref([])
    const treeRefs = ref({})
	const activeTreeLevel2Id = ref(null)    
	const activeLevel4Id = ref(null)     

    const setTreeRef = (el, level2Id) => {
      if (!el) return
      treeRefs.value[level2Id] = el
    
      // 如果不是当前激活的二级，就强制清高亮
      if (activeTreeLevel2Id.value != null && String(level2Id) !== String(activeTreeLevel2Id.value)) {
        el.setCurrentKey(null)
      } else if (activeLevel4Id.value != null) {
        // 是当前激活的树 → 保持高亮
        el.setCurrentKey(activeLevel4Id.value)
      }
    }

    const onIconError = (e) => {
      e.target.src = '/src/assets/third-level-directory.png'
    }

    // ======================
    // 目录管理 - 增删改
    // ======================
    const addDialogVisible   = ref(false)
    const addForm            = ref({ name: '' })
	const editDialogVisible  = ref(false)
	const editForm           = ref({ id: null, name: '', parent_id: null })
	const deleteDialogVisible = ref(false)
	let pendingAction = null  
    const contextMenuVisible = ref(false)
    const contextMenuPosition = ref({ x: 0, y: 0 })
    const contextMenuItems = ref([])
    const currentNode = ref(null)

    const openContextMenu = (event, node) => {
	  if (!canProjectManage.value) {
	      contextMenuVisible.value = false
	      return
	    }
      // node 可能是 level2（二级），也可能是 tree node 的 data（三级/四级）
      const realNode = node?.data || node;   // 兼容处理
    
      currentNode.value = realNode;
      contextMenuVisible.value = true;
      contextMenuPosition.value = { x: event.clientX, y: event.clientY };
    
      const items = [];
      const lv = Number(realNode.level || 0);
    
      if (lv === 2) {
        items.push({ label: '新增三级目录', action: 'addChild' });
      } else if (lv === 3) {
        items.push({ label: '新增同级（三级）', action: 'addSibling' });
        items.push({ label: '新增四级目录',     action: 'addChild' });
      } else if (lv === 4) {
        items.push({ label: '新增同级（四级）', action: 'addSibling' });
      }
    
      // 共通：编辑 + 删除（二级及以下都支持）
      if (lv >= 2) {
        items.push({ label: '编辑', action: 'edit' });
        items.push({ label: '删除', action: 'delete' });
      }
    
      contextMenuItems.value = items;
	  if (!items.length) contextMenuVisible.value = false
    };

	const onNodeContextMenu = (event, node) => {
	  event.preventDefault();
	  // node 就是 el-tree 传过来的 { data, ... }
	  openContextMenu(event, node?.data || node);
	};

    const handleContextMenuAction = (action) => {
      if (!currentNode.value) return
      pendingAction = action
      contextMenuVisible.value = false
    
      if (action === 'addChild' || action === 'addSibling') {
        // 禁止四级再新增子级
        if (action === 'addChild' && Number(currentNode.value.level) >= 4) {
          ElMessage.warning('四级目录不能再新增子目录')
          return
        }
        addDialogVisible.value = true
      } else if (action === 'edit') {
        editForm.value = {
          id: currentNode.value.id,
          name: currentNode.value.name,
          parent_id: currentNode.value.parent_id || null,
        }
        editDialogVisible.value = true
      } else if (action === 'delete') {
        deleteDialogVisible.value = true
      }
    }
	// 表单重置
	const resetAddForm  = () => { addForm.value = { name: '' }; pendingAction = null }
	const resetEditForm = () => { editForm.value = { id: null, name: '', parent_id: null } }
	
	// 新增目录确认
	const confirmAddDirectory = async () => {
	  if (!canProjectManage.value) return ElMessage.warning('无权限：项目管理')
	  if (!addForm.value.name?.trim()) return ElMessage.warning('请输入目录名称')
	
	  let parent_id = null
	  if (pendingAction === 'addChild')  parent_id = currentNode.value.id
	  if (pendingAction === 'addSibling') parent_id = currentNode.value.parent_id
	
	  try {
	    await api.keyComponentcategorys.createKeyComponentCatalog({
	      name: addForm.value.name.trim(),
	      parent_id,
	    })
	    ElMessage.success('新增成功')
	    addDialogVisible.value = false
	    resetAddForm()
	    await loadDirectory()           // 刷新树
	  } catch (err) {
	    console.error(err)
	    ElMessage.error('新增失败')
	  }
	}
	
	// 编辑目录确认
	const confirmEditDirectory = async () => {
	  if (!canProjectManage.value) return ElMessage.warning('无权限：项目管理')
	  if (!editForm.value.id) return
	  if (!editForm.value.name?.trim()) return ElMessage.warning('请输入目录名称')
	
	  try {
	    await api.keyComponentcategorys.updateKeyComponentCatalog(editForm.value.id, {
	      name: editForm.value.name.trim(),
	      parent_id: editForm.value.parent_id,
	    })
	    ElMessage.success('保存成功')
	    editDialogVisible.value = false
	    resetEditForm()
	    await loadDirectory()
	  } catch (err) {
	    console.error(err)
	    ElMessage.error('保存失败')
	  }
	}
	
	// 删除确认
	const confirmDeleteDirectory = async () => {
	  if (!canProjectManage.value) return ElMessage.warning('无权限：项目管理')
	  if (!currentNode.value?.id) return
	
	  try {
	    await api.keyComponentcategorys.deleteKeyComponentCatalog(currentNode.value.id)
	    ElMessage.success('删除成功')
	    deleteDialogVisible.value = false
	    await loadDirectory()
	  } catch (err) {
	    console.error(err)
	    ElMessage.error('删除失败')
	  } finally {
	    deleteDialogVisible.value = false
	  }
	}
	
	const clearSelectionAndTable = () => {
	  selectedLevel4.value = null
	  selectedDomesticForeign.value = ''
	  selectedProjectName.value = ''
	  tableData.value = []
	  total.value = 0
	  currentPage.value = 1
	}
	
	const clearOtherTreeHighlight = (currentTree) => {
	  Object.values(treeRefs.value).forEach(tree => {
	    if (tree && tree !== currentTree) {
	      tree.setCurrentKey(null)
	    }
	  })
	}
	
	const clearAllTreeHighlight = () => {
	  Object.values(treeRefs.value).forEach(tree => {
	    if (tree) tree.setCurrentKey(null)
	  })
	}
	
	// ✅ 点击一级目录：展示全部清单
	const handleLevel1Click = async () => {
	  listScope.value = 'ALL'; // ✅ 关键：筛选永远按 ALL
	
	  clearAllTreeHighlight();
	  activeTreeLevel2Id.value = null;
	  activeLevel4Id.value = null;
	
	  selectedLevel4.value = null;
	  selectedDomesticForeign.value = '';
	  selectedProjectName.value = '';
	
	  tableData.value = [];
	  total.value = 0;
	  currentPage.value = 1;
	
	  filters.value.keyword = '';
	
	  await fetchKeyComponentsAll();
	};
	
	// 点击节点：只允许选中四级
	const handleNodeClick = async (data, node, treeComponent) => {
	  const lv = Number(data?.level || 0)
	  if (lv === 3) {
	    node?.expand?.()
	    return
	  }

	  if (lv !== 4) {
	    clearAllTreeHighlight()
	    activeTreeLevel2Id.value = null
	    activeLevel4Id.value      = null
	    selectedLevel4.value      = null
	    selectedDomesticForeign.value = ''
	    selectedProjectName.value = ''
	    tableData.value = []
	    total.value = 0
	    currentPage.value = 1
	    return
	  }
	

	  activeTreeLevel2Id.value = treeComponent?.parent?.level2Id   
	  activeLevel4Id.value      = data.id
	
	  // 清掉其他树的高亮
	  clearOtherTreeHighlight(treeComponent)
	
	  // 选中逻辑
	  selectedLevel4.value = data
	  selectedProjectName.value = data.name
	  selectedDomesticForeign.value = idToLevel2Name.value.get(data.id) || ''
	
	  await fetchKeyComponents()
	}
	
    const closeAllContextMenus = () => (contextMenuVisible.value = false)

    // ============ 选中信息（必须单个 4 级） ============
    const selectedLevel4 = ref(null) // { id, name, level, ... }
    const selectedDomesticForeign = ref('') // 二级目录 name：国内/国外
    const selectedProjectName = ref('') // 四级目录 name

    const canExport = computed(() => !!selectedLevel4.value && canListExport.value)
    const exportTooltip = computed(() => {
      if (!canListExport.value) return '无权限：清单导出'
      return selectedLevel4.value ? '' : '请选中单个四级目录后再导出'
    })
	
	const safeStr = (v) => (v == null ? '' : String(v))
	
	const isForeign = computed(() => String(selectedDomesticForeign.value || '').trim() === '国外')
	
	// ✅ 表格显示用：根据国内/国外映射到中英字段
	const displayName = (row) => (isForeign.value ? (row.english_name || row.name || '-') : (row.name || '-'))
	const displayManufacturer = (row) => (isForeign.value ? (row.english_manufacturer || row.manufacturer || '-') : (row.manufacturer || '-'))
	const displaySupplier = (row) => (isForeign.value ? (row.english_supplier || row.supplier || '-') : (row.supplier || '-'))
	const displaySpec = (row) => (isForeign.value ? (row.english_spec || row.spec || '-') : (row.spec || '-'))

    // 仅 keyword
    const filters = ref({ keyword: '' })

    // 表格数据
    const tableData = ref([])

    const idToLevel2Name = ref(new Map())

    const rebuildIdToLevel2Name = (rootList) => {
      const map = new Map()

      // rootList = [root]
      const root = rootList?.[0]
      if (!root?.children) return map

      // 二级：root.children
      root.children.forEach((lv2) => {
        const lv2Name = lv2.name
        const walk = (nodes) => {
          ;(nodes || []).forEach((n) => {
            map.set(n.id, lv2Name) // 三级、四级都记到所属二级
            if (n.children?.length) walk(n.children)
          })
        }
        walk(lv2.children || [])
      })

      return map
    }

    // ============ 加载目录 ============
    const loadDirectory = async () => {
      try {
        const root = await api.keyComponentcategorys.getKeyComponentCatalogTree()
        const list = root ? [root] : []

        const normalize = (nodes) => {
          ;(nodes || []).forEach((n) => {
            if (!Array.isArray(n.children)) n.children = []
            normalize(n.children)
          })
        }
        normalize(list)

        directoryTree.value = list
        if (list[0]?.id) defaultOpened.value = [String(list[0].id)]

        idToLevel2Name.value = rebuildIdToLevel2Name(list)

        await nextTick()
      } catch (e) {
        console.error(e)
        ElMessage.error('加载关键元器件目录失败')
      }
    }
	// =============================
	// ✅ 分页（同物料页）
	// =============================
	const currentPage = ref(1)
	const pageSize = ref(10)
	const total = ref(0)
	
	const pagedTableData = computed(() => {
	  const start = (currentPage.value - 1) * pageSize.value
	  const end = start + pageSize.value
	  return tableData.value.slice(start, end)
	})
	
	const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
	const handlePageChange = (page) => (currentPage.value = page)
	const handleSizeChange = (size) => {
	  pageSize.value = size
	  currentPage.value = 1
	}

	const indexMethod = (index) => {
	  return (currentPage.value - 1) * pageSize.value + index + 1
	}
	
	const fetchKeyComponentsAll = async () => {
	  try {
	    const params = {
	      is_key_component: '是',
	      is_used: '是',
	    }
	    if (filters.value.keyword) params.keyword = filters.value.keyword
	
	    const data = await api.keyComponents.getKeyComponents(params)
	    tableData.value = Array.isArray(data) ? data : []
	
	    tableData.value.forEach((row) => {
	      row.english_name = row.english_name ?? ''
	      row.english_manufacturer = row.english_manufacturer ?? ''
	      row.english_supplier = row.english_supplier ?? ''
	      row.english_spec = row.english_spec ?? ''
	      row.__editing_selected_cert = normalizeSelectedCert(row)
	    })
	
	    total.value = tableData.value.length
	    currentPage.value = 1
	  } catch (e) {
	    console.error(e)
	    ElMessage.error('获取关键元器件清单失败')
	  }
	}
	
    const fetchKeyComponents = async () => {
      if (!selectedLevel4.value) return

      try {
        const params = {
          project_name: selectedProjectName.value,        // 四级目录 name
          domestic_foreign: selectedDomesticForeign.value, // 二级目录 name
          is_key_component: '是',
          is_used: '是',
        }
        if (filters.value.keyword) params.keyword = filters.value.keyword

        const data = await api.keyComponents.getKeyComponents(params)
        tableData.value = Array.isArray(data) ? data : []
		tableData.value.forEach((row) => {
		  row.english_name = row.english_name ?? ''
		  row.english_manufacturer = row.english_manufacturer ?? ''
		  row.english_supplier = row.english_supplier ?? ''
		  row.english_spec = row.english_spec ?? ''
		
		  row.__editing_selected_cert = normalizeSelectedCert(row)
		})
		
		// ✅ 分页信息
		total.value = tableData.value.length
		currentPage.value = 1

        // 给每行补一个用于编辑的临时字段：__editing_selected_cert
        tableData.value.forEach((row) => {
          row.__editing_selected_cert = normalizeSelectedCert(row)
        })
      } catch (e) {
        console.error(e)
        ElMessage.error('获取关键元器件清单失败')
      }
    }
	
	const listScope = ref('ALL');
    const handleSearch = async () => {
      if (listScope.value === 'LEVEL4') {
        await fetchKeyComponents();
        return;
      }
      await fetchKeyComponentsAll();
    };
    // ============ 导出 ============
	const exportDialogVisible = ref(false)
	const exportForm = ref({
	  model_type: '',        // 省所/深圳所/莱茵（必选）
	  homepage: false,       // 勾选 => 是，否则 否
	  download_file: false,  // 勾选 => 是，否则 否
	})
	
	const resetExportForm = () => {
	  exportForm.value = { model_type: '', homepage: false, download_file: false }
	}
	
    const handleExport = async () => {
	  if (!canListExport.value) return ElMessage.warning('无权限：清单导出')
	  if (!selectedLevel4.value) return ElMessage.warning('请选中单个四级目录后再导出')
    
      resetExportForm()
    
      // 可选：默认帮用户选一个模板（国内默认省所，国外默认莱茵）
      exportForm.value.model_type = isForeign.value ? '莱茵' : '省所'
    
      exportDialogVisible.value = true
    }
	
	const confirmExport = async () => {
	  if (!exportForm.value.model_type) {
	    ElMessage.warning('请选择导出模板')
	    return
	  }
	
	  try {
	    const params = {
	      project_name: selectedProjectName.value,
	      domestic_foreign: selectedDomesticForeign.value, // 二级目录 name（国内/国外）
	      is_key_component: '是',
	      is_used: '是',
	
	      model_type: exportForm.value.model_type,
	      homepage: exportForm.value.homepage ? '是' : '否',
	      download_file: exportForm.value.download_file ? '是' : '否',
	    }
	
	    const res = await api.keyComponents.exportKeyComponents(params)
	    if (res?.download_zip_url) {
	      ElMessage.success(`已生成：${res.file_name || '导出文件'}`)
	      exportDialogVisible.value = false
	      window.open(res.download_zip_url, '_blank')
	    } else {
	      ElMessage.error('导出失败：未返回下载地址')
	    }
	  } catch (e) {
	    console.error(e)
	    ElMessage.error('导出失败')
	  }
	}
    // ============ 认证标签号：解析、与附件联动高亮、保存(updateMaterial覆盖提交) ============
    const normalizeSelectedCert = (row) => {
      const p0 = row?.projects?.[0] || {}

      const raw = isForeign.value ? p0?.foreign_selected_cert : p0?.chinese_selected_cert

      if (Array.isArray(raw)) {
        return raw.filter(Boolean)  
      }
      // 如果是字符串且不为空，转为数组并清理空格
      if (typeof raw === 'string' && raw.trim()) {
        return raw.split(',').map(s => s.trim()).filter(Boolean)
      }
      // 如果是其他类型或空值，返回空数组
      return []
    }

    const certHasAttachment = (row, certType) => {
      const list = row?.attachments || []
    
      // ✅ 规格书：联动规格书附件
      if ((certType || '').trim() === '规格书') {
        return list.some((a) => (a?.attachment_type || '').trim() === '规格书')
      }
    
      // ✅ 证书：联动证书附件（UL/CCC/...）
      return list.some((a) => (a?.attachment_type || '').trim() === (certType || '').trim())
    }

    const buildCertTimeLines = (row) => {
      const certs = normalizeSelectedCert(row)
      if (!certs.length) return []
      const atts = row?.attachments || []

      return certs.map((c) => {
        const att = atts.find((a) => (a?.attachment_type || '').trim() === c)
        const t = att?.certification_time ? att.certification_time : '-'
        return `${certShort(c)}：${t}`
      })
    }

    const normalizeDomesticForeignForUpdate = (val) => {
      if (Array.isArray(val)) return val
      if (typeof val === 'string' && val.trim()) {
        return val.split(',').map((s) => s.trim()).filter(Boolean)
      }
      return []
    }

	const toStrArray = (v) => {
	  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean)
	  if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim()).filter(Boolean)
	  return []
	}

	const toCertArray = (v) => {
	  if (Array.isArray(v)) return v.filter(Boolean).map(x => String(x).trim())
	  if (typeof v === 'string' && v.trim()) return v.split(',').map(s => s.trim()).filter(Boolean)
	  return []
	}

    const onSelectedCertChange = async (row, newVal) => {
      if (!canListEdit.value) {
        ElMessage.warning('无权限：清单编辑')
        row.__editing_selected_cert = normalizeSelectedCert(row)
        return
      }
      const selected = Array.isArray(newVal) ? newVal : []
      row.__editing_selected_cert = selected
    
      try {
        const p0 = row.projects?.[0] || {}

        const df = toStrArray(p0.domestic_foreign)
        const domestic_foreign = df.length ? df : [String(selectedDomesticForeign.value || '').trim()].filter(Boolean)
    
        const oldChinese = toCertArray(p0.chinese_selected_cert)
        const oldForeign = toCertArray(p0.foreign_selected_cert)
    
        const projectPayload = {
          project_name: p0.project_name || selectedProjectName.value,
          is_key_component: '是',
          is_used: '是',
          domestic_foreign,
    
          chinese_selected_cert: isForeign.value ? oldChinese : selected,
          foreign_selected_cert: isForeign.value ? selected : oldForeign,
        }
    
        const payload = {
          name: safeStr(row.name),
          english_name: safeStr(row.english_name),
          material_code: safeStr(row.material_code),
    
          manufacturer: safeStr(row.manufacturer),
          english_manufacturer: safeStr(row.english_manufacturer),
    
          supplier: safeStr(row.supplier),
          english_supplier: safeStr(row.english_supplier),
    
          spec: safeStr(row.spec),
          english_spec: safeStr(row.english_spec),
    
          status: safeStr(row.status),
          new_supplier_status: safeStr(row.new_supplier_status),
          category_id: row.category_id,
    
          projects: [projectPayload],
    
          tech_params: Array.isArray(row.tech_params)
            ? row.tech_params.map((t) => ({ param_name: t.param_name, param_value: t.param_value }))
            : [],
        }
    
        await api.materials.updateMaterial(row.id, payload)
    
        // ✅ 本地同步（也按数组存）
        if (!row.projects) row.projects = []
        if (!row.projects[0]) row.projects[0] = {}
        row.projects[0].domestic_foreign = projectPayload.domestic_foreign
        row.projects[0].chinese_selected_cert = projectPayload.chinese_selected_cert
        row.projects[0].foreign_selected_cert = projectPayload.foreign_selected_cert
    
        row.__editing_selected_cert = normalizeSelectedCert(row)
    
        ElMessage.success('认证标签号已保存')
      } catch (e) {
        console.error(e)
        ElMessage.error('保存认证标签号失败')
        row.__editing_selected_cert = normalizeSelectedCert(row)
      }
    }
	
	// =============================
	// ✅ 详情抽屉
	// =============================
	const isDetailDrawerVisible = ref(false)
	const materialDetail = ref({})
	const detailLocale = ref('国内') // 抽屉内切换国内/国外显示
	
	const statusDotClass = (status) => {
	  const s = String(status || '').trim()
	  if (['推荐', '已选', '通过', '合格'].includes(s)) return 'dot-green'
	  if (['备选', '待定', '评估中'].includes(s)) return 'dot-orange'
	  if (['禁用', '不推荐', '不通过', '淘汰'].includes(s)) return 'dot-red'
	  return 'dot-gray'
	}
	

	const onRowClick = async (row) => {

	  detailLocale.value = isForeign.value ? '国外' : '国内'

	  materialDetail.value = { ...(row || {}) }
	
	
	  isDetailDrawerVisible.value = true
	}
	
	// =============================
	// ✅ PDF 预览弹窗（不新开页面）
	// =============================
	const pdfPreviewDialogVisible = ref(false)
	const pdfPreviewTitle = ref('附件预览')
	const pdfPreviewFiles = ref([])
	const pdfPreviewActiveId = ref(null)
	
	const pdfPreviewUrl = computed(() => {
	  const f = (pdfPreviewFiles.value || []).find(x => x._uid === pdfPreviewActiveId.value)
	  return f?.preview_url || f?.download_url || ''
	})
	
	const withUid = (list) => (list || []).map((x, i) => ({
	  ...x,
	  _uid: x?.id ?? `${Date.now()}_${i}`,
	}))
	
	// ✅ 单文件/多文件都支持：传 row 或传数组
	const openPdfPreview = (payload, title = '附件预览') => {
	  if (!canAttachView.value) {
	    ElMessage.warning('无权限：附件查看')
	    return
	  }
	  let files = []
	
	  if (Array.isArray(payload)) {
	    files = payload
	  } else if (payload && typeof payload === 'object') {
	    files = [payload]
	  } else if (typeof payload === 'string') {
	    files = [{ file_name: '附件', preview_url: payload, download_url: payload }]
	  }
	
	  // 过滤掉没有地址的
	  files = files.filter(f => (f?.preview_url || f?.download_url))
	  if (!files.length) {
	    ElMessage.warning('无可预览地址（preview_url/download_url 为空）')
	    return
	  }
	
	  pdfPreviewTitle.value = title
	  pdfPreviewFiles.value = withUid(files)
	  pdfPreviewActiveId.value = pdfPreviewFiles.value[0]._uid
	  pdfPreviewDialogVisible.value = true
	}


    // ============ 资料附件：复用逻辑（cert/spec） ============
    const isCertAttachment = (type) => CERT_ONLY_TYPES.includes((type || '').trim())
    const isSpecAttachment = (type) => (type || '').trim() === '规格书'
	
	const buildCertNumberLines = (row) => {
	  const certs = normalizeSelectedCert(row)
	  if (!certs.length) return []
	
	  const atts = row?.attachments || []
	
	  return certs.map((c) => {
	    if ((c || '').trim() === '规格书') {
	      return `规格书：-`
	    }
	
	    const att = atts.find((a) => (a?.attachment_type || '').trim() === c)
	    const num = att?.certificate_number ? att.certificate_number : '-'
	    return `${certShort(c)}：${num}`
	  })
	}

    const getAttachmentFlags = (attachments) => {
      const list = attachments || []
      return {
        cert: list.some((a) => isCertAttachment(a.attachment_type)),
        spec: list.some((a) => isSpecAttachment(a.attachment_type)),
      }
    }

    const attachmentDialogVisible = ref(false)
    const attachmentDialogTitle = ref('')
    const attachmentDialogList = ref([])

    const openAttachmentGroupPreview = (row, group) => {
      if (!canAttachView.value) {
        ElMessage.warning('无权限：附件查看')
        return
      }
      const list = row?.attachments || []
      let filtered = []

      if (group === 'cert') {
        filtered = list.filter((a) => isCertAttachment(a.attachment_type))
        attachmentDialogTitle.value = '认证证书'
      } else if (group === 'spec') {
        filtered = list.filter((a) => isSpecAttachment(a.attachment_type))
        attachmentDialogTitle.value = '规格书'
      }

      attachmentDialogList.value = filtered
      attachmentDialogVisible.value = true
    }

    const openDownload = (url) => {
      if (!canAttachDownload.value) {
        ElMessage.warning('无权限：附件下载')
        return
      }
      if (!url) {
        ElMessage.warning('无可下载地址')
        return
      }
      window.open(url, '_blank')
    }

    // resize/close
    let resizeTimer = null
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        document.querySelectorAll('.el-table').forEach((table) => {
          table.__vueParentComponent?.exposed?.doLayout?.()
        })
      }, 100)
    }

    onMounted(async () => {
      window.addEventListener('resize', handleResize)
      window.addEventListener('click', closeAllContextMenus)
      await loadDirectory()
	  await fetchKeyComponentsAll()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('click', closeAllContextMenus)
    })

    return {
      CERT_OPTIONS,
      certShort,
	  
	  addDialogVisible,
	  addForm,
	  resetAddForm,
	  confirmAddDirectory,
	  
	  editDialogVisible,
	  editForm,
	  resetEditForm,
	  confirmEditDirectory,
	  
	  deleteDialogVisible,
	  confirmDeleteDirectory,
	  
	  isForeign,
	  displayName,
	  displayManufacturer,
	  displaySupplier,
	  displaySpec,
	  
      directoryTree,
      defaultOpened,
      setTreeRef,
      onIconError,
	  indexMethod,
	  
	  isDetailDrawerVisible,
	  materialDetail,
	  detailLocale,
	  onRowClick,
	  statusDotClass,

      contextMenuVisible,
      contextMenuPosition,
      contextMenuItems,
	  currentNode,
      openContextMenu,
      onNodeContextMenu,
      handleContextMenuAction,
      closeAllContextMenus,
	  buildCertNumberLines,

      filters,
      tableData,

      canExport,
      exportTooltip,
      handleExport,
	  exportDialogVisible,
	  exportForm,
	  confirmExport,
      handleSearch,
	  handleLevel1Click,
	  
	  canAttachView,
	  canAttachDownload,
	  canProjectManage,
	  canListEdit,
	  canListExport,
	  canViewManufacturer,
	  canViewSupplier,

      handleNodeClick,

      normalizeSelectedCert,
      certHasAttachment,
      buildCertTimeLines,
      onSelectedCertChange,
	  pagedTableData,
	  total,
	  totalPages,
	  currentPage,
	  pageSize,
	  handlePageChange,
	  handleSizeChange,

      getAttachmentFlags,
      openAttachmentGroupPreview,
      attachmentDialogVisible,
      attachmentDialogTitle,
      attachmentDialogList,
      openDownload,
	  openPdfPreview,
	  pdfPreviewDialogVisible,
	  pdfPreviewTitle,
	  pdfPreviewFiles,
	  pdfPreviewActiveId,
	  pdfPreviewUrl,
    }
  },
}
</script>

<style scoped>
/* 1. 统一表格单元格的基础高度和对齐方式 */
:deep(.el-table .el-table__cell) {
  padding: 8px 0; /* 适当的内边距，保持呼吸感 */
}

:deep(.el-table .cell) {
  line-height: 1.4;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px; /* 确保所有行至少有两行的高度 */
}

/* 2. 限制文本显示为最多两行，超出显示省略号 */
.cell-2line {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 限制两行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  max-height: 46px; /* 约等于两行高度 */
  text-align: center;
}

/* 3. 针对“认证标签号”和“资料附件”的标签容器进行限高 */
.cert-tags, .attach-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: center;
  gap: 4px;
  max-height: 52px; /* 限制高度，防止标签过多撑开行高 */
  overflow-y: auto; /* 如果标签实在太多，允许容器内滚动，而不撑开表格行 */
}

/* 隐藏滚动条但保留滚动功能 (可选，为了美观) */
.cert-tags::-webkit-scrollbar, .attach-tags::-webkit-scrollbar {
  width: 0;
}

/* 4. 针对“认证证书”编号列的限高处理 */
.cert-time {
  max-height: 52px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.cert-time .cell-1line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}

/* 5. 确保图片按钮大小一致 */
.el-button-img {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  margin-right: 4px;
}

/* 6. 统一分页器位置 */
.table-pagination {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.home-container { width: 100%; max-width: 100%; overflow-x: hidden; }
.main-content { display: flex; flex: 1; overflow: hidden; }
.sidebar { width: 300px; flex-shrink: 0; border-right: 1px solid #e0e0e0; background: #f8f9fa; background-color: #f4f5f4; padding: 5px;}
.side-main-content { flex: 1; display: flex; flex-direction: column; padding: 20px; overflow: hidden; min-width: 0; }
.main-content-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0; }

.create-use-case { width: 8vw; height: 4vh; font-size: 0.92rem; }
.el-button-img { width: 1vw; height: 1.8vh; margin-right: 0.5vw; }

.filters-wrap { display: flex; align-items: center; }
.module-tree-wrapper { padding: 0.74vh 1.04vw; background: #fff; min-height: 4.63vh; }
.el-menu-vertical { border-right: none; }

.context-menu {
  position: fixed; background: white; border: 1px solid #e4e7ed; border-radius: 0.21vw;
  box-shadow: 0 0.19vh 1.11vh rgba(0,0,0,0.1); z-index: 3000; padding: 0.46vh 0; font-size: 0.73vw;
}
.context-menu-item { padding: 0.74vh 0.83vw; cursor: pointer; }
.context-menu-item:hover { background: #f5f7fa; }

.el-table { flex: 1; overflow: hidden; margin-top: 10px; }
.table-pagination {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 10px; font-size: 0.9rem; height: 6vh; padding: 0 1vw;
  background-color: #fff; border-top: 1px solid #ebeef5;
}
.pagination-info { color: #606266; }

.cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 22px;
  max-height: 44px;
  width: 100%;
  text-align: center;
}

.dir-title { display: inline-flex; align-items: center; gap: 6px; }
.dir-icon { width: 16px; height: 16px; object-fit: contain; flex-shrink: 0; padding-right: 2px; }

.cert-cell { display: flex; flex-direction: column; gap: 6px; align-items: center; }
.cert-tags { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.cert-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #dcdfe6;
  user-select: none;
}
.cert-tag-on { background: #ecf5ff; border-color: #409eff; color: #409eff; }
.cert-tag-off { background: #f2f2f2; border-color: #e0e0e0; color: #909399; }

.attach-list { display: flex; flex-direction: column; gap: 4px; align-items: center; }
.attach-item { line-height: 18px; max-width: 160px; }
.attach-link { color: #409eff; text-decoration: none; }
.attach-link:hover { text-decoration: underline; }
.attach-tags {
  display: flex;
  gap: 4px;          
  justify-content: center;
  flex-wrap: wrap;
}

.attach-tags .el-tag {
  margin: 2px 0;      /* 上下微调 */
}
.attach-tags .tag-disabled {
  opacity: 1 !important;
  color: #989ba1 !important;
  background-color: #f5f7fa !important;
  border-color: #e4e7ed !important;
}

.attach-tags .tag-disabled:hover {
  background-color: #e4e7ed !important;
}

.muted { color: #909399; }
.cert-tags{
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  cursor: pointer;
  min-height: 24px;
}

.tag-disabled{
  opacity: 0.55;
}

.tag-clickable{
  cursor: pointer;
}

.cell-1line{
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cert-time{
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.pdf-preview-wrap{
  display: flex;
  gap: 12px;
  height: 68vh;
}

.pdf-preview-left{
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pdf-preview-filelist{
  flex: 1;
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: #fff;
  padding: 6px;
}

.pdf-preview-fileitem{
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #303133;
}

.pdf-preview-fileitem:hover{
  background: #f5f7fa;
}

.pdf-preview-fileitem.active{
  background: #ecf5ff;
  color: #409eff;
}

.pdf-preview-right{
  flex: 1;
  min-width: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #ebeef5;
  background: #fff;
}

.pdf-iframe{
  width: 100%;
  height: 100%;
  border: none;
}

.pdf-empty{
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.table-pagination {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 10px; font-size: 0.9rem; height: 6vh; padding: 0 1vw;
  background-color: #fff; border-top: 1px solid #ebeef5;
}
.pagination-info { color: #606266; }

:deep(.el-dialog__body .el-form-item__label){
  font-weight: 700;
  text-align: center;
}

/* 行可点击 */
:deep(.clickable-row td) {
  cursor: pointer;
}

/* 抽屉美化 */
:deep(.beauty-drawer .el-drawer__body) {
  padding: 0;
  background: #f6f7fb;
}

.drawer-header{
  padding: 16px 18px;
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
}

.drawer-title{
  display:flex;
  align-items:center;
  gap: 10px;
}

.title-text{
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.drawer-subtitle{
  margin-top: 8px;
  display:flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color:#606266;
}

.drawer-body{
  padding: 14px 16px 90px;
  overflow: auto;
  height: calc(100vh - 140px);
}

.drawer-card{
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 14px 14px 10px;
  margin-bottom: 12px;
}

.card-title{
  font-weight: 700;
  color:#303133;
  margin-bottom: 10px;
}

.kv-grid{
  display:grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.kv-item{
  background: #fafafa;
  border: 1px solid #f0f2f5;
  border-radius: 10px;
  padding: 10px 12px;
}

.kv-label{
  font-size: 12px;
  color:#909399;
  margin-bottom: 4px;
}

.kv-value{
  font-size: 13px;
  color:#303133;
  word-break: break-word;
}

.status-wrap{
  display:inline-flex;
  align-items:center;
  gap: 8px;
}

.status-dot{
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display:inline-block;
}

.dot-green{ background: #67c23a; }
.dot-orange{ background: #e6a23c; }
.dot-red{ background: #f56c6c; }
.dot-gray{ background: #c0c4cc; }

.drawer-footer{
  position: fixed;
  right: 0;
  bottom: 0;
  width: 64%;             
  background: #fff;
  border-top: 1px solid #ebeef5;
  padding: 12px 16px;
  display:flex;
  justify-content: flex-end;
  gap: 10px;
  z-index: 10;
}


@media (max-width: 1200px){
  .drawer-footer{ width: 100%; }
}

</style>
