<template>
  <div class="home-container" @click="closeAllContextMenus">
    <Header />

    <div class="main-content">
      <!-- 左侧导航栏 -->
      <div class="sidebar">
        <el-scrollbar height="90vh">
          <el-menu class="el-menu-vertical" background-color="#f8f9fa" :default-openeds="defaultOpened">
            <el-sub-menu v-for="level1 in directoryTree" :key="level1.id" :index="String(level1.id)">
              <template #title>
                <span class="dir-title">
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
                    show-checkbox
                    node-key="id"
                    :ref="el => setTreeRef(el, level2.id)"
                    :props="{ label: 'name', children: 'children', disabled: 'disabled' }"
                    @check="handleTreeCheck"
                    @node-contextmenu="onNodeContextMenu"
                    :default-expand-all="false"
                    :expand-on-click-node="false"
                    :check-on-click-node="true"
                  >
                    <template #default="{ data }">
                      <span class="dir-title">
                        <img class="dir-icon" src="/src/assets/third-level-directory.png" />
                        <span>{{ data.name }}</span>
                      </span>
                    </template>

                    <template #empty>
                      <span>暂无目录</span>
                    </template>
                  </el-tree>
                </div>
              </el-sub-menu>
            </el-sub-menu>
          </el-menu>
        </el-scrollbar>
      </div>

      <!-- 目录右键菜单 -->
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
            <el-tooltip :content="createMaterialTooltip" :disabled="canCreateMaterial" placement="top" effect="dark">
              <div style="display: inline-block;">
                <el-button
                  type="primary"
                  round
                  class="create-use-case"
                  @click="openMaterialDrawer(false)"
                  :disabled="!canCreateMaterial"
                >
                  <img src="/src/assets/add2.png" class="el-button-img" />
                  新增物料
                </el-button>
              </div>
            </el-tooltip>
          </div>

          <div class="filters-wrap">
            <el-select
              v-model="filters.status"
              clearable
              placeholder="选型状态"
              style="width: 9vw; margin-right: 0.5vw;"
              @change="handleSearch"
            >
              <el-option label="首选" value="首选" />
              <el-option label="备选" value="备选" />
              <el-option label="预警" value="预警" />
              <el-option label="禁用" value="禁用" />
            </el-select>

            <el-select
              v-model="filters.project_name"
              clearable
              placeholder="全部项目"
              style="width: 11vw; margin-right: 0.5vw;"
              @change="handleSearch"
            >
              <el-option label="全部项目" value="" />
              <el-option v-for="p in projectOptions" :key="p" :label="p" :value="p" />
            </el-select>

            <el-input
              v-model="filters.keyword"
              clearable
              placeholder="关键字搜索（名称/物料编码/规格）"
              @keyup.enter="handleSearch"
              style="width: 18vw; margin-right: 0.5vw;"
            />
            <el-button round @click="handleSearch">筛选</el-button>
          </div>
        </div>

        <!-- 物料表格 -->
        <el-table :data="pagedMaterialList" stripe height="76vh" style="width: 100%;">
          <el-table-column label="编号" prop="id" width="90" align="center" />

          <el-table-column label="名称" prop="name" align="center" min-width="100">
            <template #default="{ row }">
              <div class="cell-2line" :title="row.name">{{ row.name }}</div>
            </template>
          </el-table-column>

          <el-table-column label="物料编码" prop="material_code" align="center" width="150" />
          <el-table-column label="生产商" prop="manufacturer" align="center" width="140">
            <template #default="{ row }">
              <div class="cell-2line" :title="row.manufacturer">{{ row.manufacturer }}</div>
            </template>
          </el-table-column>
          <el-table-column label="供应商" prop="supplier" align="center" width="140">
            <template #default="{ row }">
              <div class="cell-2line" :title="row.supplier">{{ row.supplier }}</div>
            </template>
          </el-table-column>

          <el-table-column label="规格型号" prop="spec" align="center" min-width="140">
            <template #default="{ row }">
              <div class="cell-2line" :title="row.spec">{{ row.spec }}</div>
            </template>
          </el-table-column>

          <el-table-column label="选项状态" align="center" width="100">
            <template #default="{ row }">
              <div class="status-wrap">
                <span class="status-dot" :class="statusDotClass(row.status)" />
                <span>{{ row.status || '-' }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="资料附件" align="center" min-width="120">
            <template #default="{ row }">
              <div class="attach-tags">
                <el-tag
                  size="small"
                  :type="getAttachmentFlags(row.attachments).cert ? 'success' : 'info'"
                  :effect="getAttachmentFlags(row.attachments).cert ? 'dark' : 'plain'"
                  :class="{
                    'tag-disabled': !getAttachmentFlags(row.attachments).cert,
                    'tag-clickable': getAttachmentFlags(row.attachments).cert
                  }"
                  @click.stop="getAttachmentFlags(row.attachments).cert && openAttachmentGroupPreview(row, 'cert')"
                >
                  认证证书
                </el-tag>

                <el-tag
                  size="small"
                  :type="getAttachmentFlags(row.attachments).spec ? 'primary' : 'info'"
                  :effect="getAttachmentFlags(row.attachments).spec ? 'dark' : 'plain'"
                  :class="{
                    'tag-disabled': !getAttachmentFlags(row.attachments).spec,
                    'tag-clickable': getAttachmentFlags(row.attachments).spec
                  }"
                  @click.stop="getAttachmentFlags(row.attachments).spec && openAttachmentGroupPreview(row, 'spec')"
                >
                  规格书
                </el-tag>

                <el-tag
                  size="small"
                  :type="getAttachmentFlags(row.attachments).test ? 'warning' : 'info'"
                  :effect="getAttachmentFlags(row.attachments).test ? 'dark' : 'plain'"
                  :class="{ 'tag-disabled': !getAttachmentFlags(row.attachments).test }"
                >
                  测试数据
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" align="center" width="160">
            <template #default="{ row }">
              <el-button size="small" type="primary" plain @click="openDetailDrawer(row)">详情</el-button>
              <el-button size="small" type="danger" plain @click="handleDeleteMaterial(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="table-pagination">
          <div class="pagination-info">共 {{ total }} 行 | 共 {{ totalPages }} 页</div>
          <el-pagination
            background
            layout="prev, pager, next, sizes"
            :page-size="pageSize"
            :current-page="currentPage"
            :page-sizes="[12, 16, 20]"
            :total="total"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <!-- 新增目录弹窗（原逻辑保留） -->
    <el-dialog title="新增目录" v-model="addDialogVisible" width="35vw" @close="resetAddForm">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="目录名称" required>
          <el-input v-model="addForm.directory_name" placeholder="请输入目录名称" />
        </el-form-item>
        <el-form-item label="排序权重" required>
          <el-input-number v-model="addForm.module_sort" :min="1" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddDirectory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 删除目录确认弹窗（原逻辑保留） -->
    <el-dialog title="删除确认" v-model="deleteDialogVisible" width="35vw" center>
      <div style="font-size: 16px; text-align: center;">
        确定删除该目录节点及其所有子节点吗？<br />
        <span style="color: #e74c3c;">此操作不可恢复！</span>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteDirectory">确定删除</el-button>
      </template>
    </el-dialog>

    <!-- 删除物料确认弹窗 -->
    <el-dialog title="删除确认" v-model="deleteMaterialDialogVisible" width="35vw" center>
      <div style="font-size: 16px; text-align: center;">
        确定删除该物料吗？<br />
        <span style="color: #e74c3c;">此操作不可恢复！</span>
      </div>
      <template #footer>
        <el-button @click="deleteMaterialDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteMaterial">确定删除</el-button>
      </template>
    </el-dialog>

    <!-- ✅ PDF 预览弹窗：改为 pdf.js(canvas) 渲染 -->
    <el-dialog
      v-model="pdfPreviewDialogVisible"
      :title="pdfPreviewTitle"
      width="78vw"
      top="5vh"
      destroy-on-close
      @closed="cleanupPdfPreview"
    >
      <div class="pdf-preview-wrap">
        <!-- 多文件时：左侧选择 -->
        <div v-if="pdfPreviewFiles.length > 1" class="pdf-preview-left">
          <el-select v-model="pdfPreviewActiveId" placeholder="选择文件" style="width: 100%;">
            <el-option
              v-for="f in pdfPreviewFiles"
              :key="f._uid"
              :label="f.file_name || f._localFileName || ('附件' + f._uid)"
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
              {{ f.file_name || f._localFileName || ('附件' + f._uid) }}
            </div>
          </div>
        </div>

        <!-- 右侧：pdf.js 查看器 -->
        <div class="pdf-preview-right">
          <div class="pdf-toolbar">
            <div class="pdf-toolbar-left">
              <el-button size="small" @click="pdfPrevPage" :disabled="pdfLoading || pdfPageNum <= 1">
                上一页
              </el-button>
              <div class="pdf-page-indicator">
                <el-input
                  v-model="pdfPageInput"
                  size="small"
                  style="width: 70px;"
                  :disabled="pdfLoading || pdfNumPages <= 0"
                  @keyup.enter="pdfJumpPage"
                />
                <span class="pdf-page-split">/</span>
                <span class="pdf-page-total">{{ pdfNumPages || 0 }}</span>
              </div>
              <el-button size="small" @click="pdfNextPage" :disabled="pdfLoading || pdfPageNum >= pdfNumPages">
                下一页
              </el-button>
            </div>

            <div class="pdf-toolbar-right">
              <el-button size="small" @click="pdfZoomOut" :disabled="pdfLoading">缩小</el-button>
              <span class="pdf-zoom">{{ Math.round(pdfScale * 100) }}%</span>
              <el-button size="small" @click="pdfZoomIn" :disabled="pdfLoading">放大</el-button>

              <el-button size="small" type="primary" plain :disabled="!pdfPreviewUrl" @click="openPreview(pdfPreviewUrl)">
                新窗口打开
              </el-button>
              <el-button size="small" type="primary" plain :disabled="!pdfPreviewDownloadUrl" @click="openPreview(pdfPreviewDownloadUrl)">
                下载/打开源文件
              </el-button>
            </div>
          </div>

          <div class="pdf-canvas-wrap" v-loading="pdfLoading" element-loading-text="PDF加载中...">
            <canvas ref="pdfCanvasRef" class="pdf-canvas" />
            <div v-if="pdfError" class="pdf-error">
              {{ pdfError }}
              <div class="pdf-error-hint">
                常见原因：URL 跨域(CORS)不允许、返回的不是 PDF、或需要鉴权 Cookie/Token。
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="pdfPreviewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- ✅ 统一：新增/编辑 物料抽屉 -->
    <el-drawer
      v-model="isMaterialDrawerVisible"
      direction="rtl"
      size="52%"
      :with-header="false"
      custom-class="beauty-drawer"
      @close="resetMaterialForm"
    >
      <div class="drawer-header">
        <div class="drawer-title">{{ isEditMode ? '编辑物料' : '新增物料' }}</div>
      </div>

      <div class="drawer-body">
        <el-form :model="materialForm" label-width="120px">
          <el-form-item label="物料名称" required>
            <el-input v-model="materialForm.name" />
          </el-form-item>
          <el-form-item label="物料编码" required>
            <el-input v-model="materialForm.material_code" />
          </el-form-item>
          <el-form-item label="生产商" required>
            <el-input v-model="materialForm.manufacturer" />
          </el-form-item>
          <el-form-item label="供应商" required>
            <el-input v-model="materialForm.supplier" />
          </el-form-item>
          <el-form-item label="规格型号" required>
            <el-input v-model="materialForm.spec" />
          </el-form-item>
          <el-form-item label="选项状态" required>
            <el-select v-model="materialForm.status" placeholder="请选择">
              <el-option label="首选" value="首选" />
              <el-option label="备选" value="备选" />
              <el-option label="预警" value="预警" />
              <el-option label="禁用" value="禁用" />
            </el-select>
          </el-form-item>
          <el-form-item label="新供方引入状态">
            <el-select v-model="materialForm.new_supplier_status" placeholder="请选择">
              <el-option label="是" value="是" />
              <el-option label="否" value="否" />
            </el-select>
          </el-form-item>

          <!-- 用于项目 -->
          <div class="form-section-title">用于项目</div>
          <el-table :data="materialForm.projects" size="small" border style="width: 100%; margin-bottom: 10px;">
            <el-table-column label="编号" prop="id" width="80" align="center">
              <template #default="{ row }">{{ row.id ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="项目名称" prop="project_name" width="140" align="center">
              <template #default="{ row }">
                <template v-if="row._editing">
                  <el-input v-model="row.project_name" size="small" />
                </template>
                <template v-else>
                  {{ row.project_name || '-' }}
                </template>
              </template>
            </el-table-column>

            <el-table-column label="国内外" prop="domestic_foreign" width="120" align="center">
              <template #default="{ row }">
                <template v-if="row._editing">
                  <el-select v-model="row.domestic_foreign" size="small" style="width: 100%;">
                    <el-option label="国内" value="国内" />
                    <el-option label="国外" value="国外" />
                  </el-select>
                </template>
                <template v-else>
                  {{ row.domestic_foreign || '-' }}
                </template>
              </template>
            </el-table-column>

            <el-table-column label="是否为关键元器件" prop="is_key_component" align="center">
              <template #default="{ row }">
                <template v-if="row._editing">
                  <el-select v-model="row.is_key_component" size="small" style="width: 100%;">
                    <el-option label="是" value="是" />
                    <el-option label="否" value="否" />
                  </el-select>
                </template>
                <template v-else>
                  {{ row.is_key_component || '-' }}
                </template>
              </template>
            </el-table-column>

            <el-table-column label="是否使用" prop="is_used" width="110" align="center">
              <template #default="{ row }">
                <template v-if="row._editing">
                  <el-select v-model="row.is_used" size="small" style="width: 100%;">
                    <el-option label="是" value="是" />
                    <el-option label="否" value="否" />
                  </el-select>
                </template>
                <template v-else>
                  {{ row.is_used || '-' }}
                </template>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row, $index }">
                <el-button size="small" type="primary" plain @click="toggleRowEdit(row)">
                  {{ row._editing ? '完成' : '编辑' }}
                </el-button>
                <el-button size="small" type="danger" plain @click="removeProjectRow($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button size="small" type="primary" plain @click="addProjectRow">新增项目行</el-button>

          <!-- 技术参数 -->
          <div class="form-section-title" style="margin-top: 14px;">技术参数</div>
          <el-table :data="materialForm.tech_params" size="small" border style="width: 100%; margin-bottom: 10px;">
            <el-table-column label="编号" prop="id" width="80" align="center">
              <template #default="{ row }">{{ row.id ?? '-' }}</template>
            </el-table-column>
            <el-table-column label="关键参数" prop="param_name" align="center">
              <template #default="{ row }">
                <template v-if="row._editing">
                  <el-input v-model="row.param_name" size="small" />
                </template>
                <template v-else>
                  {{ row.param_name || '-' }}
                </template>
              </template>
            </el-table-column>

            <el-table-column label="参数指标" prop="param_value" align="center">
              <template #default="{ row }">
                <template v-if="row._editing">
                  <el-input v-model="row.param_value" size="small" />
                </template>
                <template v-else>
                  {{ row.param_value || '-' }}
                </template>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row, $index }">
                <el-button size="small" type="primary" plain @click="toggleRowEdit(row)">
                  {{ row._editing ? '完成' : '编辑' }}
                </el-button>
                <el-button size="small" type="danger" plain @click="removeTechRow($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button size="small" type="primary" plain @click="addTechRow">新增参数行</el-button>

          <!-- ✅ 资料附件（新增/编辑抽屉都有） -->
          <div class="form-section-title" style="margin-top: 14px;">资料附件</div>

          <div style="margin-bottom: 8px; display: flex; gap: 8px;">
            <el-button size="small" type="primary" plain @click="addAttachmentDraftRow">
              新增附件行(本地缓存)
            </el-button>
            <div style="color:#909399; font-size:12px; line-height: 28px;">
              保存物料后才会真正上传；新增物料会先创建物料再上传附件
            </div>
          </div>

          <el-table :data="materialForm.attachments_draft" size="small" border style="width: 100%;">
            <el-table-column label="编号" prop="id" width="80" align="center">
              <template #default="{ row }">{{ row.id ?? '-' }}</template>
            </el-table-column>

            <el-table-column label="文件类型" prop="attachment_type" width="140" align="center">
              <template #default="{ row }">
                <el-select
                  v-model="row.attachment_type"
                  size="small"
                  placeholder="请选择"
                  style="width: 100%;"
                  @change="markAttachmentDirty(row)"
                >
                  <el-option v-for="t in ATTACHMENT_TYPE_OPTIONS" :key="t" :label="t" :value="t" />
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="文件名称" prop="file_name" min-width="160" align="center">
              <template #default="{ row }">
                <div class="cell-2line" :title="row.file_name || row._localFileName || ''">
                  {{ row.file_name || row._localFileName || '-' }}
                </div>
              </template>
            </el-table-column>

            <el-table-column label="上传时间" prop="upload_time" width="170" align="center">
              <template #default="{ row }">{{ row.upload_time || '-' }}</template>
            </el-table-column>

            <el-table-column label="证书编号" prop="certificate_number" width="140" align="center">
              <template #default="{ row }">
                <el-input v-model="row.certificate_number" size="small" @input="markAttachmentDirty(row)" />
              </template>
            </el-table-column>

            <el-table-column label="认证时间" prop="certification_time" width="160" align="center">
              <template #default="{ row }">
                <el-date-picker
                  v-model="row.certification_time"
                  type="date"
                  size="small"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%;"
                  @change="markAttachmentDirty(row)"
                />
              </template>
            </el-table-column>

            <el-table-column label="上传人" prop="uploader" width="130" align="center">
              <template #default="{ row }">
                <el-input v-model="row.uploader" size="small" @input="markAttachmentDirty(row)" />
              </template>
            </el-table-column>

            <el-table-column label="预览" width="90" align="center">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  plain
                  :disabled="!getBestPdfUrl(row)"
                  @click="openSingleAttachmentPreview(row, '附件预览')"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="160" align="center">
              <template #default="{ row, $index }">
                <el-upload
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="(uploadFile) => handlePickAttachmentFile(row, uploadFile.raw)"
                >
                  <el-button size="small" type="primary" plain>上传</el-button>
                </el-upload>

                <el-button
                  size="small"
                  type="danger"
                  plain
                  style="margin-left: 8px;"
                  @click="deleteAttachmentRow(row, $index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form>
      </div>

      <div class="drawer-footer">
        <el-button round @click="isMaterialDrawerVisible = false">取消</el-button>
        <el-button type="primary" round :loading="saving" @click="saveMaterialAndAttachments">保存</el-button>
      </div>
    </el-drawer>

    <!-- 详情抽屉：右侧弹出（原逻辑保留） -->
    <el-drawer
      v-model="isDetailDrawerVisible"
      direction="rtl"
      size="48%"
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
          <span class="sub-item">规格型号：{{ materialDetail.spec || '-' }}</span>
        </div>
      </div>

      <div class="drawer-body">
        <div class="drawer-card">
          <div class="card-title">基本信息</div>
          <div class="kv-grid">
            <div class="kv-item">
              <div class="kv-label">物料名称</div>
              <div class="kv-value">{{ materialDetail.name || '-' }}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">物料编码</div>
              <div class="kv-value">{{ materialDetail.material_code || '-' }}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">生产商</div>
              <div class="kv-value">{{ materialDetail.manufacturer || '-' }}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">供应商</div>
              <div class="kv-value">{{ materialDetail.supplier || '-' }}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">规格型号</div>
              <div class="kv-value">{{ materialDetail.spec || '-' }}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">选项状态</div>
              <div class="kv-value">
                <span class="status-wrap">
                  <span class="status-dot" :class="statusDotClass(materialDetail.status)" />
                  <span>{{ materialDetail.status || '-' }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-card">
          <div class="card-title">用于项目</div>
          <el-table :data="materialDetail.projects || []" size="small" border style="width: 100%;">
            <el-table-column label="编号" prop="id" width="90" align="center" />
            <el-table-column label="项目名称" prop="project_name" width="140" align="center" />
            <el-table-column label="国内外" prop="domestic_foreign" width="120" align="center" />
            <el-table-column label="是否为关键元器件" prop="is_key_component" align="center" />
            <el-table-column label="是否使用" prop="is_used" align="center" />
          </el-table>
        </div>

        <div class="drawer-card">
          <div class="card-title">技术参数</div>
          <el-table :data="materialDetail.tech_params || []" size="small" border style="width: 100%;">
            <el-table-column label="编号" prop="id" width="90" align="center" />
            <el-table-column label="关键参数" prop="param_name" align="center" />
            <el-table-column label="参数指标" prop="param_value" align="center" />
          </el-table>
        </div>

        <div class="drawer-card">
          <div class="card-title">资料附件</div>
          <el-table :data="materialDetail.attachments || []" size="small" border style="width: 100%;">
            <el-table-column label="编号" prop="id" width="90" align="center" />
            <el-table-column label="文件类型" prop="attachment_type" width="120" align="center" />
            <el-table-column label="文件名称" prop="file_name" min-width="160" align="center" />
            <el-table-column label="上传时间" prop="upload_time" width="170" align="center" />
            <el-table-column label="证书编号" prop="certificate_number" width="140" align="center" />
            <el-table-column label="认证时间" prop="certification_time" width="140" align="center" />
            <el-table-column label="操作" width="110" align="center">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  plain
                  :disabled="!getBestPdfUrl(row)"
                  @click="openSingleAttachmentPreview(row, '附件预览')"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="drawer-footer">
        <el-button round @click="handleEditFromDetail">编辑</el-button>
        <el-button type="primary" round @click="isDetailDrawerVisible = false">关闭</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import Header from '../components/common/Header.vue';
import { ref, shallowRef, markRaw, onMounted, nextTick, onBeforeUnmount, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../api/index.js';

// ✅ pdf.js
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default {
  name: 'Home',
  components: { Header },
  setup() {
    // =============================
    // 目录树
    // =============================
    const directoryTree = ref([]);
    const defaultOpened = ref([]);
    const treeRefs = ref({});

    const setTreeRef = (el, level2Id) => {
      if (el) treeRefs.value[level2Id] = el;
    };

    // 右键菜单（目录）
    const contextMenuVisible = ref(false);
    const contextMenuPosition = ref({ x: 0, y: 0 });
    const contextMenuItems = ref([]);
    const currentNode = ref(null);
    let pendingAction = null;

    // 新增目录弹窗
    const addDialogVisible = ref(false);
    const addForm = ref({ directory_name: '', module_sort: 1 });
    const deleteDialogVisible = ref(false);

    // =============================
    // 物料列表/分页/筛选
    // =============================
    const currentPage = ref(1);
    const pageSize = ref(12);
    const total = ref(0);

    const materialList = ref([]);
    const projectOptions = ref([]);
    const filters = ref({
      status: '',
      project_name: '',
      keyword: '',
    });

    const pagedMaterialList = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return materialList.value.slice(start, end);
    });

    const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
    const handlePageChange = (page) => (currentPage.value = page);
    const handleSizeChange = (size) => {
      pageSize.value = size;
      currentPage.value = 1;
    };

    // 当前勾选的三级目录(category_id)
    const selectedCategoryId = ref(null);
    const canCreateMaterial = ref(false);
    const createMaterialTooltip = ref('');

    // =============================
    // ✅ 新增/编辑 统一抽屉
    // =============================
    const isMaterialDrawerVisible = ref(false);
    const isEditMode = ref(false);
    const isDetailDrawerVisible = ref(false);
    const saving = ref(false);

    const materialForm = ref({
      id: null,
      name: '',
      material_code: '',
      manufacturer: '',
      supplier: '',
      spec: '',
      status: '',
      new_supplier_status: '是',
      category_id: 0,
      projects: [],
      tech_params: [],
      attachments_draft: [],
    });

    const normalizeEditableRows = (arr) => (arr || []).map(x => ({ ...x, _editing: false }));

    const resetMaterialForm = () => {
      materialForm.value = {
        id: null,
        name: '',
        material_code: '',
        manufacturer: '',
        supplier: '',
        spec: '',
        status: '',
        new_supplier_status: '是',
        category_id: selectedCategoryId.value || 0,
        projects: [],
        tech_params: [],
        attachments_draft: [],
      };
    };

    const openMaterialDrawer = async (edit = false, row = null) => {
      if (!canCreateMaterial.value && !edit) {
        ElMessage.warning(createMaterialTooltip.value || '请先勾选一个三级目录');
        return;
      }

      resetMaterialForm();
      isEditMode.value = !!edit;

      if (edit && row?.id) {
        try {
          const detail = await api.materials.getMaterialDetail(row.id);
          const d = detail || row;

          materialForm.value = {
            id: d.id,
            name: d.name || '',
            material_code: d.material_code || '',
            manufacturer: d.manufacturer || '',
            supplier: d.supplier || '',
            spec: d.spec || '',
            status: d.status || '',
            new_supplier_status: d.new_supplier_status || '是',
            category_id: d.category_id ?? selectedCategoryId.value ?? 0,
            projects: normalizeEditableRows((d.projects || []).map(p => ({
              ...p,
              domestic_foreign: Array.isArray(p.domestic_foreign) ? (p.domestic_foreign[0] || '') : (p.domestic_foreign || ''),
              is_used: p.is_used || '是',
            }))),
            tech_params: normalizeEditableRows((d.tech_params || []).map(t => ({ ...t }))),
            attachments_draft: (d.attachments || []).map(a => ({
              ...a,
              _dirty: false,
              _isNew: false,
              _localFile: null,
              _localFileName: '',
            })),
          };
        } catch (e) {
          console.error(e);
          ElMessage.error('获取物料详情失败');
          return;
        }
      } else {
        materialForm.value.category_id = selectedCategoryId.value || 0;
      }

      isMaterialDrawerVisible.value = true;
    };

    const toggleRowEdit = (row) => {
      row._editing = !row._editing;
    };

    const addProjectRow = () => {
      materialForm.value.projects.push({
        project_name: '',
        is_key_component: '否',
        domestic_foreign: '国内',
        is_used: '是',
        _editing: true,
      });
    };
    const removeProjectRow = (idx) => materialForm.value.projects.splice(idx, 1);

    const addTechRow = () => {
      materialForm.value.tech_params.push({
        param_name: '',
        param_value: '',
        _editing: true,
      });
    };
    const removeTechRow = (idx) => materialForm.value.tech_params.splice(idx, 1);

    // =============================
    // ✅ 资料附件：本地缓存 + 选择文件 + 删除
    // =============================
    const addAttachmentDraftRow = () => {
      materialForm.value.attachments_draft.push({
        id: null,
        attachment_type: '',
        file_name: '',
        upload_time: '',
        certificate_number: '',
        certification_time: '',
        uploader: '',
        preview_url: '',
        download_url: '',
        _dirty: true,
        _isNew: true,
        _localFile: null,
        _localFileName: '',
      });
    };

    const markAttachmentDirty = (row) => {
      if (row) row._dirty = true;
    };

    const handlePickAttachmentFile = (row, file) => {
      row._localFile = file;
      row._localFileName = file?.name || '';
      row._isNew = row.id ? false : true;
      if (!row.id) row._dirty = true;
      return false;
    };

    const deleteAttachmentRow = async (row, idx) => {
      if (row?.id) {
        try {
          await ElMessageBox.confirm('确定删除该附件吗？', '提示', { type: 'warning' });
          await api.attachments.deleteAttachment(row.id);
          ElMessage.success('删除成功');
          materialForm.value.attachments_draft.splice(idx, 1);
        } catch (e) {
          if (String(e).includes('cancel')) return;
          console.error(e);
          ElMessage.error('删除附件失败');
        }
      } else {
        materialForm.value.attachments_draft.splice(idx, 1);
      }
    };

    // =============================
    // ✅ 保存：先保存物料，再处理附件
    // =============================
    const validateMaterialForm = () => {
      const f = materialForm.value;
      if (!f.name || !f.material_code || !f.manufacturer || !f.supplier || !f.spec || !f.status) {
        ElMessage.warning('请把必填项填写完整');
        return false;
      }
      if (!f.category_id) {
        ElMessage.warning('未获取到三级目录ID（category_id）');
        return false;
      }
      return true;
    };

    const buildMaterialPayload = () => {
      const f = materialForm.value;
      const safeStr = (v) => (v == null ? '' : String(v)).trim();
      const toDomesticForeignArray = (v) => {
        if (Array.isArray(v)) return v.filter(Boolean).map(safeStr);
        const s = safeStr(v);
        return s ? [s] : [];
      };

      return {
        name: safeStr(f.name),
        material_code: safeStr(f.material_code),
        manufacturer: safeStr(f.manufacturer),
        supplier: safeStr(f.supplier),
        spec: safeStr(f.spec),
        status: safeStr(f.status),
        new_supplier_status: safeStr(f.new_supplier_status),
        category_id: Number(f.category_id),

        projects: (Array.isArray(f.projects) ? f.projects : []).map(p => ({
          project_name: safeStr(p?.project_name),
          is_key_component: safeStr(p?.is_key_component),
          domestic_foreign: toDomesticForeignArray(p?.domestic_foreign),
          is_used: safeStr(p?.is_used || '是'),
        })),

        tech_params: (Array.isArray(f.tech_params) ? f.tech_params : []).map(t => ({
          param_name: safeStr(t?.param_name),
          param_value: safeStr(t?.param_value),
        })),
      };
    };

    const validateAttachmentRowForUpload = (row) => {
      if (!row?._localFile) return '请先选择文件';
      return '';
    };

    const saveMaterialAndAttachments = async () => {
      if (!validateMaterialForm()) return;

      saving.value = true;
      let materialId = materialForm.value.id;

      try {
        const payload = buildMaterialPayload();
        if (materialId) {
          await api.materials.updateMaterial(materialId, payload);
        } else {
          const created = await api.materials.createMaterial(payload);
          materialId = created?.id ?? created?.data?.id ?? (typeof created === 'number' ? created : null);
          if (!materialId) throw new Error('创建物料成功但未返回id，无法上传附件');
          materialForm.value.id = materialId;
        }
        ElMessage.success(isEditMode.value ? '物料保存成功' : '新增物料成功');
      } catch (e) {
        console.error('保存物料失败:', e);
        const detail = e?.response?.data?.detail || e?.message || '保存物料失败';
        ElMessage.error(detail);
        saving.value = false;
        return;
      }

      try {
        const drafts = materialForm.value.attachments_draft || [];

        const needUpdate = drafts.filter(r => r?.id && r._dirty);
        for (const row of needUpdate) {
          await api.attachments.updateAttachmentMeta(row.id, {
            attachment_type: row.attachment_type,
            certificate_number: row.certificate_number,
            certification_time: row.certification_time,
            uploader: row.uploader,
          });
          row._dirty = false;
        }

        const needUpload = drafts.filter(r => !r?.id && r?._localFile);
        for (const row of needUpload) {
          const msg = validateAttachmentRowForUpload(row);
          if (msg) {
            ElMessage.warning(msg);
            continue;
          }

          const created = await api.attachments.uploadAttachment(materialId, {
            attachment_type: row.attachment_type,
            certificate_number: row.certificate_number,
            certification_time: row.certification_time,
            uploader: row.uploader,
            file: row._localFile,
          });

          Object.assign(row, created || {});
          row._isNew = false;
          row._dirty = false;
          row._localFile = null;
          row._localFileName = '';
        }
      } catch (e) {
        console.error('保存附件失败:', e);
        const detail = e?.response?.data?.detail || e?.message || '附件保存失败，请稍后在编辑物料时重试';
        ElMessage.error(detail);
      } finally {
        saving.value = false;
        isMaterialDrawerVisible.value = false;
        await fetchMaterials();
      }
    };

    // =============================
    // 详情抽屉 & 从详情发起编辑
    // =============================
    const materialDetail = ref({});

    const openDetailDrawer = async (row) => {
      try {
        const detail = await api.materials.getMaterialDetail(row.id);
        materialDetail.value = detail || {};
        isDetailDrawerVisible.value = true;
      } catch (e) {
        console.error(e);
        ElMessage.error('获取详情失败');
      }
    };

    const handleEditFromDetail = () => {
      const d = materialDetail.value;
      if (!d?.id) return;
      isDetailDrawerVisible.value = false;
      openMaterialDrawer(true, d);
    };

    // =============================
    // ✅ PDF 预览：pdf.js
    // =============================
    const pdfPreviewDialogVisible = ref(false);
    const pdfPreviewTitle = ref('附件预览');
    const pdfPreviewFiles = ref([]);
    const pdfPreviewActiveId = ref(null);

    const withUid = (list) => (list || []).map((x, i) => ({
      ...x,
      _uid: x?.id ?? `${Date.now()}_${i}`,
    }));

    // 优先使用 download_url（更可能是直链pdf），再 fallback preview_url
    const getBestPdfUrl = (a) => {
      const u1 = (a?.download_url || '').trim();
      const u2 = (a?.preview_url || '').trim();
      return u1 || u2 || '';
    };

    const pdfPreviewUrl = computed(() => {
      const f = (pdfPreviewFiles.value || []).find(x => x._uid === pdfPreviewActiveId.value);
      return f ? getBestPdfUrl(f) : '';
    });

    const pdfPreviewDownloadUrl = computed(() => {
      const f = (pdfPreviewFiles.value || []).find(x => x._uid === pdfPreviewActiveId.value);
      return f?.download_url || getBestPdfUrl(f) || '';
    });

    const openSingleAttachmentPreview = (attachmentRow, title = '附件预览') => {
      const url = getBestPdfUrl(attachmentRow);
      if (!url) {
        ElMessage.warning('无可预览地址（download_url/preview_url 为空）');
        return;
      }

      pdfPreviewTitle.value = title;
      const files = withUid([attachmentRow]);
      pdfPreviewFiles.value = files;
      pdfPreviewActiveId.value = files[0]._uid;
      pdfPreviewDialogVisible.value = true;
    };

    const CERT_TYPES = ['UL证书', 'CCC证书', 'VDE证书', 'CQC证书', 'SA证书', 'CE证书'];
    const openAttachmentGroupPreview = (row, group) => {
      const attachments = Array.isArray(row?.attachments) ? row.attachments : [];
      const typeOf = (a) => String(a?.attachment_type || '').trim();

      let filtered = [];
      if (group === 'cert') {
        filtered = attachments.filter(a => CERT_TYPES.includes(typeOf(a)));
        pdfPreviewTitle.value = '认证证书预览';
      } else if (group === 'spec') {
        filtered = attachments.filter(a => typeOf(a) === '规格书');
        pdfPreviewTitle.value = '规格书预览';
      } else if (group === 'test') {
        filtered = attachments.filter(a => typeOf(a) === '测试数据');
        pdfPreviewTitle.value = '测试数据预览';
      }

      const canPreview = filtered.filter(a => !!getBestPdfUrl(a));
      if (!canPreview.length) {
        ElMessage.warning('没有可预览的文件（download_url/preview_url 为空）');
        return;
      }

      const files = withUid(canPreview);
      pdfPreviewFiles.value = files;
      pdfPreviewActiveId.value = files[0]._uid;
      pdfPreviewDialogVisible.value = true;
    };

    // ---- pdf.js 状态
    const pdfCanvasRef = ref(null);
    const pdfLoading = ref(false);
    const pdfError = ref('');
    const pdfDocRef = shallowRef(null);
    const pdfPageNum = ref(1);
    const pdfNumPages = ref(0);
    const pdfScale = ref(1.2);
    const pdfPageInput = ref('1');

    let pdfRenderTask = null;
    const pdfLoadingTaskRef = shallowRef(null);

    const cleanupPdfPreview = () => {
      pdfError.value = '';
      pdfLoading.value = false;

      if (pdfRenderTask?.cancel) {
        try { pdfRenderTask.cancel(); } catch (_) {}
      }
      pdfRenderTask = null;

      if (pdfLoadingTaskRef.value?.destroy) {
        try { pdfLoadingTaskRef.value.destroy(); } catch (_) {}
      }
      pdfLoadingTaskRef.value = null;
      
      if (pdfDocRef.value?.destroy) {
        try { pdfDocRef.value.destroy(); } catch (_) {}
      }
      pdfDocRef.value = null;

      pdfNumPages.value = 0;
      pdfPageNum.value = 1;
      pdfPageInput.value = '1';
      pdfScale.value = 1.2;

      // 清空画布
      const canvas = pdfCanvasRef.value;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx && ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    const renderPdfPage = async () => {
      const doc = pdfDocRef.value;
      const canvas = pdfCanvasRef.value;
      if (!doc || !canvas) return;

      pdfError.value = '';
      pdfLoading.value = true;

      try {
        const page = await doc.getPage(pdfPageNum.value);
        const viewport = page.getViewport({ scale: pdfScale.value });

        const ctx = canvas.getContext('2d');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        if (pdfRenderTask?.cancel) {
          try { pdfRenderTask.cancel(); } catch (_) {}
        }

        pdfRenderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        await pdfRenderTask.promise;
      } catch (e) {
        console.error(e);
        pdfError.value = e?.message || 'PDF渲染失败';
      } finally {
        pdfLoading.value = false;
        pdfPageInput.value = String(pdfPageNum.value);
      }
    };

    const loadPdfFromUrl = async (url) => {
      if (!url) return;

      cleanupPdfPreview();
      pdfLoading.value = true;
      pdfError.value = '';

      try {
        // ⚠️ 若需要带 cookie：可以改成 { url, withCredentials: true }
        pdfLoadingTaskRef.value = markRaw(pdfjsLib.getDocument({ url }));
        const doc = await pdfLoadingTaskRef.value.promise;
        pdfDocRef.value = markRaw(doc);
        pdfNumPages.value = doc.numPages || 0;
        pdfPageNum.value = 1;
        pdfPageInput.value = '1';

        await renderPdfPage();
      } catch (e) {
        console.error(e);
        pdfError.value = e?.message || 'PDF加载失败';
      } finally {
        pdfLoading.value = false;
      }
    };

    const pdfPrevPage = async () => {
      if (pdfPageNum.value <= 1) return;
      pdfPageNum.value -= 1;
      await renderPdfPage();
    };

    const pdfNextPage = async () => {
      if (pdfPageNum.value >= pdfNumPages.value) return;
      pdfPageNum.value += 1;
      await renderPdfPage();
    };

    const pdfJumpPage = async () => {
      const n = Number(String(pdfPageInput.value || '').trim());
      if (!Number.isFinite(n) || n < 1 || n > pdfNumPages.value) {
        ElMessage.warning('页码不合法');
        pdfPageInput.value = String(pdfPageNum.value);
        return;
      }
      pdfPageNum.value = n;
      await renderPdfPage();
    };

    const pdfZoomIn = async () => {
      pdfScale.value = Math.min(3, Number((pdfScale.value + 0.15).toFixed(2)));
      await renderPdfPage();
    };

    const pdfZoomOut = async () => {
      pdfScale.value = Math.max(0.5, Number((pdfScale.value - 0.15).toFixed(2)));
      await renderPdfPage();
    };

    // 当切换文件（或打开弹窗后默认文件）
    watch([pdfPreviewDialogVisible, pdfPreviewActiveId], async ([vis]) => {
      if (!vis) return;
      const url = pdfPreviewUrl.value;
      if (url) await loadPdfFromUrl(url);
    });

    // =============================
    // 删除物料
    // =============================
    const deleteMaterialDialogVisible = ref(false);
    const deleteMaterialRow = ref(null);

    const handleDeleteMaterial = (row) => {
      deleteMaterialRow.value = row;
      deleteMaterialDialogVisible.value = true;
    };

    const confirmDeleteMaterial = async () => {
      if (!deleteMaterialRow.value?.id) return;
      try {
        await api.materials.deleteMaterial(deleteMaterialRow.value.id);
        ElMessage.success('删除成功');
        deleteMaterialDialogVisible.value = false;
        deleteMaterialRow.value = null;
        await fetchMaterials();
      } catch (e) {
        console.error(e);
        ElMessage.error('删除失败');
      }
    };

    // =============================
    // 状态灯
    // =============================
    const statusDotClass = (status) => {
      const s = (status || '').trim();
      if (s === '首选') return 'dot-green';
      if (s === '备选') return 'dot-yellow';
      if (s === '预警') return 'dot-orange';
      if (s === '禁用') return 'dot-red';
      return 'dot-gray';
    };

    const ATTACHMENT_TYPE_OPTIONS = [
      'UL证书', 'CCC证书', 'VDE证书', 'CQC证书', 'SA证书', 'CE证书',
      '规格书', '测试数据', '其他',
    ];

    const getAttachmentFlags = (attachments) => {
      const list = Array.isArray(attachments) ? attachments : [];
      const types = list.map(a => (a?.attachment_type || '').trim()).filter(Boolean);

      return {
        cert: types.some(t => CERT_TYPES.includes(t)),
        spec: types.includes('规格书'),
        test: types.includes('测试数据'),
      };
    };

    // =============================
    // 拉取物料列表
    // =============================
    const rebuildProjectOptions = (list) => {
      const set = new Set();
      (list || []).forEach(m => {
        (m.projects || []).forEach(p => {
          if (p?.project_name) set.add(p.project_name);
        });
      });
      projectOptions.value = Array.from(set);
    };

    const fetchMaterials = async () => {
      if (!selectedCategoryId.value) {
        materialList.value = [];
        total.value = 0;
        projectOptions.value = [];
        return;
      }

      try {
        const params = { category_id: selectedCategoryId.value };
        if (filters.value.status) params.status = filters.value.status;
        if (filters.value.keyword) params.keyword = filters.value.keyword;
        if (filters.value.project_name) params.project_name = filters.value.project_name;

        const data = await api.materials.getMaterials(params);
        materialList.value = Array.isArray(data) ? data : [];
        total.value = materialList.value.length;
        currentPage.value = 1;

        rebuildProjectOptions(materialList.value);
      } catch (e) {
        console.error(e);
        ElMessage.error('获取物料列表失败');
      }
    };

    const handleSearch = async () => {
      currentPage.value = 1;
      await fetchMaterials();
    };

    // =============================
    // 目录加载
    // =============================
    const loadDirectory = async () => {
      try {
        const data = await api.categories.getCategoryTree();
        const list = Array.isArray(data) ? data : [data];

        const normalize = (nodes) => {
          nodes.forEach(n => {
            if (!Array.isArray(n.children)) n.children = [];
            normalize(n.children);
          });
        };
        normalize(list);

        directoryTree.value = list;
        if (directoryTree.value.length > 0) {
          defaultOpened.value = [String(directoryTree.value[0].id)];
        }

        await nextTick();
        handleModuleCheck();
      } catch (e) {
        console.error('加载目录失败', e);
        ElMessage.error('加载目录失败');
      }
    };

    // =============================
    // 目录右键菜单
    // =============================
    const openContextMenu = (event, node) => {
      currentNode.value = node;
      contextMenuVisible.value = true;
      contextMenuPosition.value = { x: event.clientX, y: event.clientY };

      const items = [];
      const lv = Number(node.level);

      if (lv === 1) {
        items.push({ label: '新增二级目录', action: 'addChild' });
      } else if (lv === 2) {
        items.push({ label: '新增同级（二级）', action: 'addSibling' });
        items.push({ label: '新增三级目录', action: 'addChild' });
        items.push({ label: '编辑', action: 'edit' });
        items.push({ label: '删除', action: 'delete' });
      } else if (lv === 3) {
        items.push({ label: '新增同级（三级）', action: 'addSibling' });
        items.push({ label: '编辑', action: 'edit' });
        items.push({ label: '删除', action: 'delete' });
      }

      contextMenuItems.value = items;
    };

    const onNodeContextMenu = (event, node) => {
      event.preventDefault();
      const data = node?.data ? node.data : node;
      openContextMenu(event, data);
    };

    const handleContextMenuAction = (action) => {
      if (!currentNode.value) return;

      pendingAction = action;

      if (action === 'addChild' || action === 'addSibling') {
        if (action === 'addChild' && Number(currentNode.value.level) >= 3) {
          ElMessage.warning('当前为三级目录，不能再新增子级');
          contextMenuVisible.value = false;
          return;
        }
        addDialogVisible.value = true;
      } else if (action === 'delete') {
        deleteDialogVisible.value = true;
      } else if (action === 'edit') {
        ElMessage.warning('你原来的目录编辑弹窗代码未贴出，这里未改动（如需我也可一并补齐）');
      }

      contextMenuVisible.value = false;
    };

    const closeAllContextMenus = () => {
      contextMenuVisible.value = false;
    };

    const confirmAddDirectory = async () => {
      if (!addForm.value.directory_name) {
        ElMessage.warning('请输入目录名称');
        return;
      }
      if (!currentNode.value) return;

      const lv = Number(currentNode.value.level);
      let parent_id = null;

      if (pendingAction === 'addChild') parent_id = currentNode.value.id;
      else if (pendingAction === 'addSibling') parent_id = currentNode.value.parent_id;

      if (pendingAction === 'addChild' && !(lv === 1 || lv === 2)) {
        ElMessage.warning('只能在一级或二级目录下新增子级');
        return;
      }
      if (pendingAction === 'addSibling' && !(lv === 2 || lv === 3)) {
        ElMessage.warning('只能在二级或三级目录下新增同级');
        return;
      }

      try {
        await api.categories.createCategory({
          name: addForm.value.directory_name,
          parent_id: parent_id ?? null,
        });

        ElMessage.success('新增成功');
        addDialogVisible.value = false;
        resetAddForm();
        await loadDirectory();
      } catch (e) {
        console.error('新增目录失败：', e);
        ElMessage.error('新增失败');
      }
    };

    const resetAddForm = () => {
      addForm.value = { directory_name: '', module_sort: 1 };
      pendingAction = null;
    };

    const confirmDeleteDirectory = async () => {
      if (!currentNode.value) return;
      try {
        await api.categories.deleteCategory(currentNode.value.id);
        ElMessage.success('删除成功');
        deleteDialogVisible.value = false;
        await loadDirectory();
      } catch (e) {
        console.error('删除失败', e);
        ElMessage.error('删除失败');
      } finally {
        deleteDialogVisible.value = false;
      }
    };

    // =============================
    // 树勾选：只允许勾选 1 个三级目录
    // =============================
    let checkTimer = null;
    const handleTreeCheck = () => {
      clearTimeout(checkTimer);
      checkTimer = setTimeout(() => {
        handleModuleCheck();
      }, 80);
    };

    const getCheckedNodesAll = () => {
      const allChecked = [];
      Object.values(treeRefs.value).forEach(tree => {
        if (tree) allChecked.push(...tree.getCheckedNodes());
      });
      return allChecked;
    };

    const handleModuleCheck = async () => {
      const allChecked = getCheckedNodesAll();
      const level3Nodes = allChecked.filter(n => Number(n.level) === 3);

      if (level3Nodes.length !== 1) {
        canCreateMaterial.value = false;
        createMaterialTooltip.value =
          level3Nodes.length > 1 ? '同时勾选了多个三级目录，请只勾选一个' : '请先勾选一个三级目录';
        selectedCategoryId.value = null;

        materialList.value = [];
        total.value = 0;
        projectOptions.value = [];
      } else {
        canCreateMaterial.value = true;
        createMaterialTooltip.value = '';
        selectedCategoryId.value = level3Nodes[0].id;

        materialForm.value.category_id = selectedCategoryId.value;
        await fetchMaterials();
      }
    };

    // resize
    let resizeTimer = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        document.querySelectorAll('.el-table').forEach(table => {
          table.__vueParentComponent?.exposed?.doLayout?.();
        });
      }, 100);
    };

    const openPreview = (url) => {
      if (!url) return ElMessage.warning('无预览地址');
      window.open(url, '_blank');
    };

    onMounted(async () => {
      window.addEventListener('resize', handleResize);
      window.addEventListener('click', closeAllContextMenus);
      await loadDirectory();
      await handleModuleCheck();
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', closeAllContextMenus);
      cleanupPdfPreview();
    });

    return {
      directoryTree,
      defaultOpened,
      setTreeRef,
      handleTreeCheck,

      contextMenuVisible,
      contextMenuPosition,
      contextMenuItems,
      openContextMenu,
      onNodeContextMenu,
      handleContextMenuAction,
      closeAllContextMenus,

      addDialogVisible,
      addForm,
      confirmAddDirectory,
      resetAddForm,

      deleteDialogVisible,
      confirmDeleteDirectory,

      filters,
      projectOptions,
      materialList,
      pagedMaterialList,
      total,
      totalPages,
      currentPage,
      pageSize,
      handlePageChange,
      handleSizeChange,
      handleSearch,

      canCreateMaterial,
      createMaterialTooltip,

      // 抽屉
      isMaterialDrawerVisible,
      isEditMode,
      materialForm,
      openMaterialDrawer,
      resetMaterialForm,
      saving,
      saveMaterialAndAttachments,
      ATTACHMENT_TYPE_OPTIONS,
      getAttachmentFlags,

      // 行编辑
      toggleRowEdit,
      addProjectRow,
      removeProjectRow,
      addTechRow,
      removeTechRow,

      // 附件缓存操作
      addAttachmentDraftRow,
      markAttachmentDirty,
      handlePickAttachmentFile,
      deleteAttachmentRow,

      // 详情
      isDetailDrawerVisible,
      materialDetail,
      openDetailDrawer,
      handleEditFromDetail,
      openPreview,

      // ✅ pdf.js 预览
      pdfPreviewDialogVisible,
      pdfPreviewTitle,
      pdfPreviewFiles,
      pdfPreviewActiveId,
      pdfPreviewUrl,
      pdfPreviewDownloadUrl,
      openAttachmentGroupPreview,
      openSingleAttachmentPreview,
      cleanupPdfPreview,
      getBestPdfUrl,

      pdfCanvasRef,
      pdfLoading,
      pdfError,
      pdfPageNum,
      pdfNumPages,
      pdfScale,
      pdfPageInput,
      pdfPrevPage,
      pdfNextPage,
      pdfJumpPage,
      pdfZoomIn,
      pdfZoomOut,

      // 删除物料
      deleteMaterialDialogVisible,
      deleteMaterialRow,
      handleDeleteMaterial,
      confirmDeleteMaterial,

      statusDotClass,
    };
  }
};
</script>


<style scoped>
.home-container { width: 100%; max-width: 100%; overflow-x: hidden; }
.main-content { display: flex; flex: 1; overflow: hidden; }
.sidebar { width: 300px; flex-shrink: 0; border-right: 1px solid #e0e0e0; background: #f8f9fa; }
.side-main-content { flex: 1; display: flex; flex-direction: column; padding: 20px; overflow: hidden; min-width: 0; }
.main-content-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0; }

.create-use-case { width: 7vw; height: 4vh; font-size: 0.92rem; }
.el-button-img { width: 1vw; height: 1.8vh; margin-right: 0.5vw; }

.filters-wrap { display: flex; align-items: center; }

.module-tree-wrapper { padding: 0.74vh 1.04vw; background: #fff; min-height: 4.63vh; }
.sidebar { background-color: #f4f5f4; padding: 5px; }
.el-menu-vertical { border-right: none; }

.context-menu {
  position: fixed; background: white; border: 1px solid #e4e7ed; border-radius: 0.21vw;
  box-shadow: 0 0.19vh 1.11vh rgba(0,0,0,0.1); z-index: 3000; padding: 0.46vh 0; font-size: 0.73vw;
}
.context-menu-item { padding: 0.74vh 0.83vw; cursor: pointer; }
.context-menu-item:hover { background: #f5f7fa; }

.el-table { flex: 1; overflow: hidden; margin-top: 10px; }
.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 0.9rem;
  height: 6vh;
  padding: 0 1vw;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}
.pagination-info { color: #606266; }

:deep(.el-table__body td) { padding-top: 6px; padding-bottom: 6px; }
:deep(.el-table__body td .cell) {
  height: 44px; line-height: 22px; display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}

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

/* status */
.status-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}
.dot-green { background: #2ecc71; }
.dot-yellow { background: #f1c40f; }
.dot-orange { background: #e67e22; }
.dot-red { background: #e74c3c; }
.dot-gray { background: #bdc3c7; }

.form-section-title {
  margin: 10px 0 8px;
  font-weight: 600;
  color: #303133;
}

/* Drawer 美化（沿用你原来的风格） */
:deep(.beauty-drawer) { padding: 0 !important; }

.drawer-header {
  padding: 18px 20px 14px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(90deg, #f8fafc, #ffffff);
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-text { font-size: 18px; font-weight: 600; color: #303133; }
.title-tag { border-radius: 10px; }

.drawer-subtitle {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
  display: flex;
  gap: 18px;
}

.sub-item {
  background: #f5f7fa;
  padding: 4px 10px;
  border-radius: 8px;
}

.drawer-body {
  height: calc(100vh - 130px);
  overflow-y: auto;
  padding: 16px 20px;
  background: #f6f7fb;
}

.drawer-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 18px 18px 14px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
  color: #303133;
}

.kv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.kv-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 10px 12px;
}

.kv-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.kv-value {
  font-size: 13px;
  color: #303133;
  word-break: break-word;
}

.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 14px 20px;
  border-top: 1px solid #ebeef5;
  background: #ffffff;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dir-title{
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dir-icon{
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
  padding-right: 2px;
}

.attach-tags{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag-disabled{
  opacity: 0.35;
  filter: grayscale(1);
}

.tag-clickable{
  cursor: pointer;
  user-select: none;
}

/* ✅ PDF 预览弹窗布局 */
.pdf-preview-wrap{
  display: flex;
  gap: 12px;
  height: 72vh;
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
  display: flex;
  flex-direction: column;
}

/* ✅ pdf.js 工具栏 */
.pdf-toolbar{
  height: 46px;
  flex-shrink: 0;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  background: #fafcff;
}

.pdf-toolbar-left,
.pdf-toolbar-right{
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.pdf-page-indicator{
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pdf-page-split{ color: #909399; }
.pdf-page-total{ color: #606266; font-size: 12px; min-width: 24px; text-align: left; }

.pdf-zoom{
  color: #606266;
  font-size: 12px;
  min-width: 44px;
  text-align: center;
}

/* ✅ canvas 容器 */
.pdf-canvas-wrap{
  flex: 1;
  overflow: auto;
  position: relative;
  padding: 12px;
  background: #f6f7fb;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.pdf-canvas{
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.06);
}

.pdf-error{
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  color: #cf1322;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
}

.pdf-error-hint{
  margin-top: 6px;
  color: #a8071a;
  font-size: 12px;
}
</style>

