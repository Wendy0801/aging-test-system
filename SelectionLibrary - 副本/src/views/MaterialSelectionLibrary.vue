<template>
  <div class="home-container" @click="closeAllContextMenus">
    <Header />

    <div class="main-content">
      <!-- 左侧导航栏 -->
      <div class="sidebar">
        <el-scrollbar height="90vh">
          <el-menu class="el-menu-vertical" background-color="#f8f9fa" :default-openeds="defaultOpened">
            <el-sub-menu
              v-for="level1 in directoryTree"
              :key="level1.id"
              :index="String(level1.id)"
              @contextmenu.prevent.stop="openContextMenu($event, level1)"
            >
              <template #title>
                <div class="dir-title level1-title" @click="handleLevel1Click(level1)">
                  <img class="dir-icon" src="/src/assets/first-level-directory.png" />
                  <span>{{ level1.name }}</span>
                </div>
              </template>

              <el-sub-menu
                v-for="level2 in level1.children"
                :key="level2.id"
                :index="level1.id + '-' + level2.id"
                @contextmenu.prevent.stop="openContextMenu($event, level2)"   
              >
                <template #title>
                  <span class="dir-title" @contextmenu.prevent.stop="openContextMenu($event, level2)">
                    <img class="dir-icon" src="/src/assets/second-level-directory.png" />
                    <span>{{ level2.name }}</span>
                  </span>
                </template>

                <div class="module-tree-wrapper">
				  <el-tree
				    :data="level2.children"
				    node-key="id"
				    :ref="el => setTreeRef(el, level2.id)"
				    :props="{ label: 'name', children: 'children', disabled: 'disabled' }"
				    highlight-current
					@current-change="(data, node) => handleTreeCurrentChange(data, level2.id)"
				    @node-contextmenu="onNodeContextMenu"
				    :default-expand-all="false"
				    :expand-on-click-node="true"
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
            <el-tooltip
              :content="!canMaterialAdd ? '无权限：物料新增' : createMaterialTooltip"
              :disabled="canCreateMaterial && canMaterialAdd"
              placement="top"
              effect="dark"
            >
              <div style="display: inline-block;">
                <el-button
                  type="primary"
                  round
                  class="create-use-case"
                  @click="openMaterialDrawer(false)"
                  :disabled="!(canCreateMaterial && canMaterialAdd)"
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
              placeholder="推荐状态"
              style="width: 9vw; margin-right: 0.5vw;"
              @change="handleSearch"
            >
              <el-option label="首选" value="首选" />
              <el-option label="备选" value="备选" />
              <el-option label="预警" value="预警" />
              <el-option label="禁用" value="禁用" />
			  <el-option label="开发中" value="开发中" />
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
          <el-table-column label="编号" width="90" align="center">
            <template #default="{ $index }">
              {{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="名称" prop="name" align="center" min-width="100">
            <template #default="{ row }">
              <div class="cell-2line" :title="row.name">{{ row.name }}</div>
            </template>
          </el-table-column>

          <el-table-column label="物料编码" prop="material_code" align="center" width="150" />
          <el-table-column
            v-if="canViewManufacturer"
            label="生产商"
            prop="manufacturer"
            align="center"
            width="140"
          >
            <template #default="{ row }">
              <div class="cell-2line" :title="row.manufacturer">{{ row.manufacturer }}</div>
            </template>
          </el-table-column>
          
          <el-table-column
            v-if="canViewSupplier"
            label="供应商"
            prop="supplier"
            align="center"
            width="140"
          >
            <template #default="{ row }">
              <div class="cell-2line" :title="row.supplier">{{ row.supplier }}</div>
            </template>
          </el-table-column>

          <el-table-column label="规格型号" prop="spec" align="center" min-width="140">
            <template #default="{ row }">
              <div class="cell-2line" :title="row.spec">{{ row.spec }}</div>
            </template>
          </el-table-column>

          <el-table-column label="推荐状态" align="center" width="100">
            <template #default="{ row }">
              <el-tooltip
                :content="statusTooltip(row.status)"
                placement="top"
                effect="dark"
                :disabled="!row.status"
              >
                <div class="status-wrap">
                  <span class="status-dot" :class="statusDotClass(row.status)" />
                  <span>{{ row.status || '-' }}</span>
                </div>
              </el-tooltip>
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
                    'tag-disabled': !getAttachmentFlags(row.attachments).cert || !canAttachmentView,
                    'tag-clickable': getAttachmentFlags(row.attachments).cert && canAttachmentView
                  }"
                  @click.stop="canAttachmentView && getAttachmentFlags(row.attachments).cert && openAttachmentGroupPreview(row, 'cert')"
                >
                  认证证书
                </el-tag>
                
                <el-tag
                  size="small"
                  :type="getAttachmentFlags(row.attachments).spec ? 'primary' : 'info'"
                  :effect="getAttachmentFlags(row.attachments).spec ? 'dark' : 'plain'"
                  :class="{
                    'tag-disabled': !getAttachmentFlags(row.attachments).spec || !canAttachmentView,
                    'tag-clickable': getAttachmentFlags(row.attachments).spec && canAttachmentView
                  }"
                  @click.stop="canAttachmentView && getAttachmentFlags(row.attachments).spec && openAttachmentGroupPreview(row, 'spec')"
                >
                  规格书
                </el-tag>
          
                <el-tag
                  size="small"
                  :type="getAttachmentFlags(row.attachments).test ? 'warning' : 'info'"
                  :effect="getAttachmentFlags(row.attachments).test ? 'dark' : 'plain'"
                  :class="{
                    'tag-disabled': !getAttachmentFlags(row.attachments).test || !canAttachmentView,
                    'tag-clickable': getAttachmentFlags(row.attachments).test && canAttachmentView
                  }"
				  @click.stop="canAttachmentView && getAttachmentFlags(row.attachments).test && openAttachmentGroupPreview(row, 'test')"
                >
                  测试数据
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" align="center" width="160">
            <template #default="{ row }">
              <el-button size="small" type="primary" plain @click="openDetailDrawer(row)">详情</el-button>
              <el-button
                v-if="canMaterialDelete"
                size="small"
                type="danger"
                plain
                @click="handleDeleteMaterial(row)"
              >
                删除
              </el-button>
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
            :page-sizes="[12]"
            :total="total"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </div>

    <!-- 新增目录弹窗 -->
    <el-dialog title="新增目录" v-model="addDialogVisible" width="35vw" @close="resetAddForm">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="目录名称" required>
          <el-input v-model="addForm.directory_name" placeholder="请输入目录名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddDirectory">确定</el-button>
      </template>
    </el-dialog>
	
	<!-- 编辑目录弹窗 -->
	<el-dialog title="编辑目录" v-model="editDialogVisible" width="35vw" @close="resetEditForm">
	  <el-form :model="editForm" label-width="100px">
	    <el-form-item label="目录名称" required>
	      <el-input v-model="editForm.name" placeholder="请输入新的目录名称" />
	    </el-form-item>
	  </el-form>
	  <template #footer>
	    <el-button @click="editDialogVisible = false">取消</el-button>
	    <el-button type="primary" @click="confirmEditDirectory">确定</el-button>
	  </template>
	</el-dialog>

    <!-- 删除目录确认弹窗 -->
    <el-dialog title="删除确认" v-model="deleteDialogVisible" width="22vw" center>
      <div style="font-size: 14px; text-align: center;">
        确定删除该目录节点及其所有子节点吗？<br />
        <span style="color: #e74c3c;">此操作不可恢复！</span>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteDirectory">确定删除</el-button>
      </template>
    </el-dialog>

    <!-- 删除物料确认弹窗 -->
    <el-dialog title="删除确认" v-model="deleteMaterialDialogVisible" width="22vw" center>
      <div style="font-size: 14px; text-align: center;">
        确定删除该物料吗？<br />
        <span style="color: #e74c3c;">此操作不可恢复！</span>
      </div>
      <template #footer>
        <el-button @click="deleteMaterialDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteMaterial">确定删除</el-button>
      </template>
    </el-dialog>
	
	<el-dialog
	  v-model="pdfPreviewDialogVisible"
	  :title="pdfPreviewTitle"
	  width="72vw"
	  top="6vh"
	  destroy-on-close
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
	
	    <!-- 预览区 -->
	    <div class="pdf-preview-right">
	      <iframe
	        v-if="pdfPreviewUrl"
	        :src="pdfPreviewUrl"
	        class="pdf-iframe"
	      />
	      <div v-else class="pdf-empty">
	        无可预览地址（preview_url 为空），请检查后端返回字段
	      </div>
	    </div>
	  </div>
	
	  <template #footer>
	    <el-button @click="pdfPreviewDialogVisible = false">关闭</el-button>
	    <el-button
	      v-if="pdfPreviewDownloadUrl"
	      type="primary"
	      plain
	      @click="openPreview(pdfPreviewDownloadUrl)"
	    >
	      下载文件
	    </el-button>
	  </template>
	</el-dialog>
	
	<!-- ✅ 过期提醒弹窗 -->
	<el-dialog
	  v-model="certExpireDialogVisible"
	  width="72vw"
	  top="8vh"
	  destroy-on-close
	  class="cert-expire-dialog"
	>
	  <!-- 自定义 header：标题加粗 + 提示语 -->
	  <template #header>
	    <div class="cert-expire-header">
	      <div class="cert-expire-title">过期提醒</div>
	      <div class="cert-expire-subtitle">以下证书即将过期，请及时关注！</div>
	    </div>
	  </template>
	
	  <el-table
	    :data="certExpireRows"
	    v-loading="certExpireLoading"
	    stripe
	    border
	    height="52vh"
	    style="width: 100%;"
	    class="cert-expire-table"
	  >
	    <el-table-column label="物料名称" min-width="140" align="center">
	      <template #default="{ row }">
	        <div class="cell-2line" :title="row['物料名称']">{{ row['物料名称'] || '-' }}</div>
	      </template>
	    </el-table-column>
	
	    <el-table-column label="物料编码" width="140" align="center">
	      <template #default="{ row }">{{ row['物料编码'] || '-' }}</template>
	    </el-table-column>
	
	    <el-table-column label="认证证书" min-width="220" align="center">
	      <template #default="{ row }">
	        <div class="cell-2line" :title="row['认证证书']">{{ row['认证证书'] || '-' }}</div>
	      </template>
	    </el-table-column>
	
	    <el-table-column label="到期时间" width="140" align="center">
	      <template #default="{ row }">{{ row['到期时间'] || '-' }}</template>
	    </el-table-column>
	
	    <el-table-column label="剩余天数" width="140" align="center">
	      <template #default="{ row }">
	        <span :class="{ 'expire-red': Number(row['剩余天数']) <= 0 }">
	          {{ formatRemainingDays(row['剩余天数']) }}
	        </span>
	      </template>
	    </el-table-column>
	  </el-table>
	
	  <!-- msg 放底部，弱化展示 -->
	  <div class="cert-expire-msg">
	    {{ certExpireMsg }}
	  </div>
	
	  <template #footer>
	    <el-button @click="certExpireDialogVisible = false">关闭</el-button>
	  </template>
	</el-dialog>

    <!-- ✅ 统一：新增/编辑 物料抽屉 -->
    <el-drawer
      v-model="isMaterialDrawerVisible"
      direction="rtl"
      size="65%"
      :with-header="false"
      custom-class="beauty-drawer"
      @close="resetMaterialForm"
    >
      <div class="drawer-header">
        <div class="drawer-title">{{ isEditMode ? '编辑物料' : '新增物料' }}</div>
      </div>

      <div class="drawer-body">
        <el-form :model="materialForm" label-width="120px">
          <div class="drawer-card">
            <div class="card-title">基础信息</div>
			
			<div class="kv-grid" style="grid-template-columns: 1fr 1fr; gap: 16px;">
			  <div class="kv-item">
				<div class="kv-label">物料编码<span class="req">*</span></div>
				<div class="kv-value">
				  <el-input v-model="materialForm.material_code" placeholder="请输入" />
				</div>
			  </div>
		
			  <div class="kv-item">
				<div class="kv-label">推荐状态<span class="req">*</span></div>
				<div class="kv-value">
				  <el-select v-model="materialForm.status" placeholder="请选择" style="width: 100%;">
					<el-option label="首选" value="首选" />
					<el-option label="备选" value="备选" />
					<el-option label="预警" value="预警" />
					<el-option label="禁用" value="禁用" />
					<el-option label="开发中" value="开发中" />
				  </el-select>
				</div>
			  </div>
			</div>
          
            <div class="kv-grid kv-form">
              <div class="kv-item">
                <div class="kv-label">物料名称<span class="req">*</span></div>
                <div class="kv-value">
                  <el-input v-model="materialForm.name" placeholder="请输入" />
                </div>
              </div>
          
              <div class="kv-item">
                <div class="kv-label">
                  物料名称(英)
                  <span v-if="requireEnglishFields" class="req">*</span>
                </div>
                <div class="kv-value">
                  <el-input v-model="materialForm.english_name" placeholder="请输入" />
                </div>
              </div>

              <div class="kv-item">
                <div class="kv-label">生产商<span class="req">*</span></div>
                <div class="kv-value">
                  <el-input v-model="materialForm.manufacturer" placeholder="请输入" />
                </div>
              </div>
          
              <div class="kv-item">
                <div class="kv-label">
                  生产商(英)
                  <span v-if="requireEnglishFields" class="req">*</span>
                </div>
                <div class="kv-value">
                  <el-input v-model="materialForm.english_manufacturer" placeholder="请输入" />
                </div>
              </div>
          
              <div class="kv-item">
                <div class="kv-label">供应商<span class="req">*</span></div>
                <div class="kv-value">
                  <el-input v-model="materialForm.supplier" placeholder="请输入" />
                </div>
              </div>
          
              <div class="kv-item">
                <div class="kv-label">
                  供应商(英)
                  <span v-if="requireEnglishFields" class="req">*</span>
                </div>
                <div class="kv-value">
                  <el-input v-model="materialForm.english_supplier" placeholder="请输入" />
                </div>
              </div>
          
              <div class="kv-item">
                <div class="kv-label">规格型号<span class="req">*</span></div>
                <div class="kv-value">
                  <el-input v-model="materialForm.spec" placeholder="请输入" />
                </div>
              </div>
          
              <div class="kv-item">
                <div class="kv-label">
                  规格型号(英)
                  <span v-if="requireEnglishFields" class="req">*</span>
                </div>
                <div class="kv-value">
                  <el-input v-model="materialForm.english_spec" placeholder="请输入" />
                </div>
              </div>
          
              <div class="kv-item">
                <div class="kv-label">新供方引入状态</div>
                <div class="kv-value">
                  <el-select v-model="materialForm.new_supplier_status" placeholder="请选择" style="width: 100%;">
                    <el-option label="是" value="是" />
                    <el-option label="否" value="否" />
                  </el-select>
                </div>
              </div>
            </div>
          
            <div
              v-if="requireEnglishFields"
              class="kv-warn"
            >
              已选择“国外”，物料名称(英)、生产商(英)、供应商(英)、规格型号(英)为必填项
            </div>
          </div>

          <div class="form-section-title">用于项目</div>
          <el-table :data="materialForm.projects" size="small" border style="width: 100%; margin-bottom: 10px;">
			<el-table-column label="编号" width="80" align="center">
			  <template #default="{ $index }">{{ $index + 1 }}</template>
			</el-table-column>
            <el-table-column label="项目名称" prop="project_name" width="240" align="center">
              <template #default="{ row }">
                <template v-if="row._editing">
                  <el-select
                    v-model="row.project_name"
                    size="small"
                    placeholder="请选择项目"
                    style="width: 100%;"
                    filterable
                  >
                    <el-option
                      v-for="p in projectOptions"
                      :key="p"
                      :label="p"
                      :value="p"
                    />
                  </el-select>
                </template>
                <template v-else>
                  {{ row.project_name || '-' }}
                </template>
              </template>
            </el-table-column>

            <el-table-column label="国内外" prop="domestic_foreign" width="240" align="center">
              <template #default="{ row }">
                <template v-if="row._editing">
                  <el-select v-model="row.domestic_foreign" multiple collapse-tags collapse-tags-tooltip size="small" style="width: 100%;">
                    <el-option label="国内" value="国内" />
                    <el-option label="国外" value="国外" />
                  </el-select>
                </template>
                <template v-else>
                  {{ Array.isArray(row.domestic_foreign) ? row.domestic_foreign.join('，') : (row.domestic_foreign || '-') }}
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
			
			<el-table-column label="是否使用" prop="is_used" width="180" align="center">
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
                <el-button
                  size="small"
                  type="primary"
                  plain
                  @click="toggleRowEdit(row)"
                >
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
			<el-table-column label="编号" width="80" align="center">
			  <template #default="{ $index }">{{ $index + 1 }}</template>
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

            <!-- ✅ 操作列：编辑、删除 -->
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

          <!-- ✅ 资料附件 -->
          <div class="form-section-title" style="margin-top: 14px;">资料附件</div>

          <div style="margin-bottom: 8px; display: flex; gap: 8px;">
            <el-button
              size="small"
              type="primary"
              plain
              :disabled="!canAttachmentUpload"
              @click="canAttachmentUpload && addAttachmentDraftRow()"
            >
              新增附件行
            </el-button>
            <div style="color:#909399; font-size:12px; line-height: 28px;">
              保存物料后才会真正上传；新增物料会先创建物料再上传附件
            </div>
          </div>

          <el-table :data="materialForm.attachments_draft" size="small" border style="width: 100%;">
            <el-table-column label="编号" width="80" align="center">
              <template #default="{ $index }">{{ $index + 1 }}</template>
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
                  <el-option
                    v-for="t in ATTACHMENT_TYPE_OPTIONS"
                    :key="t"
                    :label="t"
                    :value="t"
                  />
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

            <!-- ✅ 证书到期时间：日期选择器 YYYY-MM-DD -->
            <el-table-column label="证书到期时间" prop="certification_time" width="160" align="center">
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

            <!-- ✅ 操作：上传(选择文件)、删除 -->
            <el-table-column label="操作" width="160" align="center">
              <template #default="{ row, $index }">
                <!-- ✅ 只有“真正新增”的附件行才允许上传 -->
                <template v-if="row._isNew && !row.id">
                  <el-upload
                    v-if="canAttachmentUpload"
                    :show-file-list="false"
                    :auto-upload="false"
                    :on-change="(uploadFile) => handlePickAttachmentFile(row, uploadFile.raw)"
                  >
                    <el-button size="small" type="primary" plain>
                      上传
                    </el-button>
                  </el-upload>
            
                  <el-button
                    v-else
                    size="small"
                    type="info"
                    plain
                    disabled
                  >
                    无上传权限
                  </el-button>
                </template>
            
                <!-- ✅ 删除：新增 / 已有 都可删 -->
                <el-button
                  size="small"
                  type="danger"
                  plain
                  :style="{ marginLeft: (row._isNew && !row.id) ? '8px' : '0' }"
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

    <!-- 详情抽屉：右侧弹出 -->
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
            <div class="kv-item">
              <div class="kv-label">生产商</div>
              <div class="kv-value">
                {{
                  detailLocale === '国外'
                    ? (materialDetail.english_manufacturer || '-')
                    : (materialDetail.manufacturer || '-')
                }}
              </div>
            </div>
            <div class="kv-item">
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
            <el-table-column label="是否为关键元器件" prop="is_key_component" style="width: 100%;"align="center" />
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
          <el-table :data="materialDetail.attachments || []" size="small" border style="width: 100%;" >
            <el-table-column label="编号" width="90" align="center">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column label="文件类型" prop="attachment_type" width="120" align="center" />
            <el-table-column label="文件名称" prop="file_name" style="width: 100%;" align="center" />
            <el-table-column label="上传时间" prop="upload_time" width="170" align="center" />
            <el-table-column label="证书编号" prop="certificate_number" width="140" align="center" />
            <el-table-column label="证书到期时间" prop="certification_time" width="140" align="center" />
            <el-table-column label="操作" width="110" align="center">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  plain
                  :disabled="!(row.preview_url || row.download_url)"
                  @click="openPdfPreview(row, '附件预览')"
                >
                  {{ isPreviewableFile(row) ? '查看' : '下载' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="drawer-footer">
        <el-button v-if="canMaterialEdit" round @click="handleEditFromDetail">编辑</el-button>
        <el-button type="primary" round @click="isDetailDrawerVisible = false">关闭</el-button>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import Header from '../components/common/Header.vue';
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../api/index.js';
import { getPermissionHelperFromLocal } from '../utils/permissions.js';

export default {
  name: 'Home',
  components: { Header },
  setup() {
	// =============================
	// ✅ 权限：从 localStorage 读取
	// =============================
	const { userInfo, perm } = getPermissionHelperFromLocal();
	
	const P = {
	  CATEGORY_ADD: '1.分类新增',
	  CATEGORY_EDIT: '2.分类修改',
	  CATEGORY_DELETE: '3.分类删除',
	
	  MATERIAL_ADD: '4.物料新增',
	  MATERIAL_EDIT: '5.物料修改',
	  MATERIAL_DELETE: '6.物料删除',
	
	  ATTACH_UPLOAD: '7.附件上传',
	  ATTACH_VIEW: '8.附件查看',
	  ATTACH_DOWNLOAD: '9.附件下载', 
	
	  MANUFACTURER_VIEW: '13.生产商字段查看权限',
	  SUPPLIER_VIEW: '14.供应商字段查看权限',
	};
	// 目录权限
	const canCategoryAdd = computed(() => perm.has(P.CATEGORY_ADD));
	const canCategoryEdit = computed(() => perm.has(P.CATEGORY_EDIT));
	const canCategoryDelete = computed(() => perm.has(P.CATEGORY_DELETE));
	
	// 物料权限
	const canMaterialAdd = computed(() => perm.has(P.MATERIAL_ADD));
	const canMaterialEdit = computed(() => perm.has(P.MATERIAL_EDIT));
	const canMaterialDelete = computed(() => perm.has(P.MATERIAL_DELETE));
	
	// 附件权限
	const canAttachmentUpload = computed(() => perm.has(P.ATTACH_UPLOAD));
	const canAttachmentView = computed(() => perm.has(P.ATTACH_VIEW));
	
	// 字段可见性
	const canViewManufacturer = computed(() => perm.has(P.MANUFACTURER_VIEW));
	const canViewSupplier = computed(() => perm.has(P.SUPPLIER_VIEW));
	
	// =============================
	// ✅ 证书过期提醒
	// =============================
	const certExpireDialogVisible = ref(false)
	const certExpireLoading = ref(false)
	const certExpireRows = ref([])
	const certExpireMsg = ref('')
	
	// ✅ 剩余天数显示：负数统一显示“已过期”（标红）
	const formatRemainingDays = (v) => {
	  const n = Number(v)
	  if (!Number.isFinite(n)) return '-'
	  if (n <= 0) return '已过期'
	  return `${n}天`
	}
	
	const fetchCertExpire = async (withinDays = 30) => {
	  certExpireLoading.value = true
	  try {
	    certExpireMsg.value = ''
	    certExpireRows.value = []
	
	    const res = await api.attachments.checkCertExpire(withinDays)
	    const rows = Array.isArray(res?.data) ? res.data : []
	
	    // ✅ 无记录：不出现弹窗
	    if (!rows.length) {
	      certExpireDialogVisible.value = false
	      return
	    }
	
	    // ✅ 有记录：赋值 + 弹窗
	    certExpireMsg.value = res?.msg || ''
	    certExpireRows.value = rows
	    certExpireDialogVisible.value = true
	  } catch (e) {
	    console.error('获取证书到期提醒失败:', e)
	    certExpireDialogVisible.value = false
	    // 失败不强制弹窗，只提示一次
	    ElMessage.error('获取证书到期提醒失败')
	  } finally {
	    certExpireLoading.value = false
	  }
	}
    // =============================
    // 目录树
    // =============================
    const directoryTree = ref([]);
    const defaultOpened = ref([]);
    const treeRefs = ref({});

    const setTreeRef = (el, level2Id) => {
      if (!el) return;
      treeRefs.value[level2Id] = el;
    
      // ✅ 如果这棵树不是当前激活的二级目录，就清掉高亮
      if (activeTreeLevel2Id.value != null && String(level2Id) !== String(activeTreeLevel2Id.value)) {
        el.setCurrentKey(null);
      } else if (activeLevel3Id.value != null) {
        // ✅ 如果是当前激活树，确保 currentKey 正确
        el.setCurrentKey(activeLevel3Id.value);
      }
    };

    // 右键菜单（目录）
    const contextMenuVisible = ref(false);
    const contextMenuPosition = ref({ x: 0, y: 0 });
    const contextMenuItems = ref([]);
    const currentNode = ref(null);
    let pendingAction = null;

    // 新增目录弹窗
    const addDialogVisible = ref(false);
    const addForm = ref({ directory_name: '' });
    const deleteDialogVisible = ref(false);
	
	// 编辑目录相关
	const editDialogVisible = ref(false)
	const editForm = ref({ name: '' })
	
	const resetEditForm = () => {
	  editForm.value = { name: '' }
	}
	
	const confirmEditDirectory = async () => {
	  if (!currentNode.value) return
	  if (!editForm.value.name?.trim()) {
	    ElMessage.warning('请输入目录名称')
	    return
	  }
	
	  try {
	    await api.categories.updateCategory(currentNode.value.id, {
	      name: editForm.value.name.trim(),
	      parent_id: currentNode.value.parent_id ?? null,
	    })
	
	    ElMessage.success('目录名称修改成功')
	    editDialogVisible.value = false
	    resetEditForm()
	
	    // 刷新目录树
	    await loadDirectory()
	
	    // 如果当前选中的三级目录被改名了，刷新物料列表
	    if (selectedCategoryId.value === currentNode.value.id) {
	      await fetchMaterials()
	    }
	  } catch (e) {
	    console.error('编辑目录失败:', e)
	    ElMessage.error('修改失败，请稍后重试')
	  }
	}

    // =============================
    // 物料列表/分页/筛选
    // =============================
    const currentPage = ref(1);
    const pageSize = ref(12);
    const total = ref(0);
	const listScope = ref('ALL');

    const materialList = ref([]);
    const projectOptions = ref([]);
	// Fetch all projects when the component is mounted
	const fetchAllProjects = async () => {
	  try {
	    const list = await api.keyComponentcategorys.getAllProjects();
	    projectOptions.value = Array.isArray(list) ? list : [];
	  } catch (e) {
	    console.error('获取项目列表失败', e);
	    ElMessage.error('获取项目列表失败');
	  }
	};
	const loadProjectOptions = async () => {
	  try {
	    projectOptions.value = await api.keyComponentCatalogs.getAllProjects()
	    // 可选：排序
	    projectOptions.value.sort()
	  } catch (err) {
	    console.error('获取项目列表失败', err)
	    ElMessage.error('加载项目列表失败')
	    projectOptions.value = []
	  }
	}
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

    // 当前勾选的四级目录(category_id)
    const selectedCategoryId = ref(null);
    const canCreateMaterial = ref(false);
    const createMaterialTooltip = ref('');
	const activeTreeLevel2Id = ref(null); 
	const activeLevel3Id = ref(null);     

    // =============================
    // ✅ 新增/编辑 统一抽屉
    // =============================
    const isMaterialDrawerVisible = ref(false);
    const isEditMode = ref(false);
    const isDetailDrawerVisible = ref(false);
    const saving = ref(false);	
	const requireEnglishFields = computed(() => {
	  const ps = materialForm.value.projects || [];
	  return ps.some(p => Array.isArray(p.domestic_foreign) && p.domestic_foreign.includes('国外'));
	});

    const materialForm = ref({
      id: null,
      name: '',
      english_name: '',
      material_code: '',
      manufacturer: '',
      english_manufacturer: '',
      supplier: '',
      english_supplier: '',
      spec: '',
	  english_spec: '',
      status: '',
      new_supplier_status: '是',
      category_id: 0,
      projects: [],
      tech_params: [],
      // ✅ 资料附件本地缓存
      attachments_draft: [],
    });

    const normalizeEditableRows = (arr) => (arr || []).map(x => ({ ...x, _editing: false }));

    const resetMaterialForm = () => {
      materialForm.value = {
        id: null,
        name: '',
		english_name: '',
        material_code: '',
        manufacturer: '',
		english_manufacturer: '',
        supplier: '',
		english_supplier: '',
        spec: '',
		english_spec: '',
        status: '',
        new_supplier_status: '是',
        category_id: selectedCategoryId.value || 0,
        projects: [],
        tech_params: [],
        attachments_draft: [],
      };
    };
	
	const CERT_ENUMS = ['UL', 'CCC', 'VDE', 'CQC', 'SA', 'CE', '规格书'];
	
	const normalizeSelectedCerts = (v) => {
	  if (v == null || v === '') return [];
	
	  let arr = [];
	
	  if (Array.isArray(v)) {
	    // 兼容这种情况：["规格书,CE,UL"] 或 ["规格书", "CE", "UL"]
	    arr = v.flatMap(item =>
	      String(item)
	        .split(/[,，]/)
	        .map(s => s.trim())
	        .filter(Boolean)
	    );
	  } else {
	    // 兼容这种情况："规格书,CE,UL"
	    arr = String(v)
	      .split(/[,，]/)
	      .map(s => s.trim())
	      .filter(Boolean);
	  }
	
	  // 去重 + 过滤非法值
	  return [...new Set(arr)].filter(x => CERT_ENUMS.includes(x));
	};
	
	const parseDomesticForeign = (v) => {
	  if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
	
	  const s = String(v ?? '').trim();
	  if (!s) return [];
	
	  // ✅ 兼容 "国内,国外" / "国内，国外"
	  if (s.includes(',') || s.includes('，')) {
	    return s.split(/[,，]/).map(x => x.trim()).filter(Boolean);
	  }
	
	  return [s];
	};

    const openMaterialDrawer = async (edit = false, row = null) => {
      // ✅ 权限判断
      if (!edit && !canMaterialAdd.value) {
        ElMessage.warning('无权限：物料新增');
        return;
      }
      if (edit && !canMaterialEdit.value) {
        ElMessage.warning('无权限：物料修改');
        return;
      }
      if (!canCreateMaterial.value && !edit) {
        ElMessage.warning(createMaterialTooltip.value || '请先勾选一个四级目录');
        return;
      }

      resetMaterialForm();
      isEditMode.value = !!edit;

      if (edit && row?.id) {
        // 为了拿到 attachments 完整信息，优先用详情接口
        try {
          const detail = await api.materials.getMaterialDetail(row.id);
          const d = detail || row;

          materialForm.value = {
            id: d.id,
            name: d.name || '',
			english_name: d.english_name || '',
            material_code: d.material_code || '',
            manufacturer: d.manufacturer || '',
			english_manufacturer: d.english_manufacturer || '',
            supplier: d.supplier || '',
			english_supplier: d.english_supplier || '',
            spec: d.spec || '',
			english_spec: d.english_spec || '',
            status: d.status || '',
            new_supplier_status: d.new_supplier_status || '是',
            category_id: d.category_id ?? selectedCategoryId.value ?? 0,
            projects: normalizeEditableRows((d.projects || []).map(p => ({
              ...p,
              domestic_foreign: parseDomesticForeign(p.domestic_foreign),
              is_used: p.is_used || '是',
              chinese_selected_cert: normalizeSelectedCerts(p.chinese_selected_cert),
              foreign_selected_cert: normalizeSelectedCerts(p.foreign_selected_cert),
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
        domestic_foreign: ['国内'],
        is_used: '是',
        chinese_selected_cert: '',
        foreign_selected_cert: '',
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
	  if (!canAttachmentUpload.value) {
	    ElMessage.warning('无权限：附件上传');
	    return;
	  }
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
	  if (!canAttachmentUpload.value) {
	    ElMessage.warning('无权限：附件上传');
	    return false;
	  }
      row._localFile = file;
      row._localFileName = file?.name || '';
      row._isNew = row.id ? false : true;
      // 新行一定需要上传
      if (!row.id) row._dirty = true;
      return false;
    };

    const deleteAttachmentRow = async (row, idx) => {
      // 已有id：调接口删除；无id：删本地缓存
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
        ElMessage.warning('未获取到四级目录ID（category_id）');
        return false;
      }
	  if (requireEnglishFields.value) {
	    const f = materialForm.value;
	    if (!String(f.english_name || '').trim()) return (ElMessage.warning('已选择国外：物料名称(英)必填'), false);
	    if (!String(f.english_manufacturer || '').trim()) return (ElMessage.warning('已选择国外：生产商(英)必填'), false);
	    if (!String(f.english_supplier || '').trim()) return (ElMessage.warning('已选择国外：供应商(英)必填'), false);
		if (!String(f.english_spec || '').trim()) return (ElMessage.warning('已选择国外：规格型号(英)必填'), false);
	  }
      return true;
    };

    const buildMaterialPayload = () => {
      const f = materialForm.value;
    
      const safeStr = (v) => (v == null ? '' : String(v)).trim();
    
      const toDomesticForeignArray = (v) => {
        return parseDomesticForeign(v).map(safeStr);
      };
    
    
      return {
        name: safeStr(f.name),
        english_name: safeStr(f.english_name),
        material_code: safeStr(f.material_code),
        manufacturer: safeStr(f.manufacturer),
        english_manufacturer: safeStr(f.english_manufacturer),
        supplier: safeStr(f.supplier),
        english_supplier: safeStr(f.english_supplier),
        spec: safeStr(f.spec),
        english_spec: safeStr(f.english_spec),
        status: safeStr(f.status),
        new_supplier_status: safeStr(f.new_supplier_status),
        category_id: Number(f.category_id),
    
        projects: (Array.isArray(f.projects) ? f.projects : []).map(p => ({
          id: p?.id ?? undefined,
          project_name: safeStr(p?.project_name),
          is_key_component: safeStr(p?.is_key_component),
          domestic_foreign: toDomesticForeignArray(p?.domestic_foreign),
          is_used: safeStr(p?.is_used || '是'),
          chinese_selected_cert: normalizeSelectedCerts(p?.chinese_selected_cert),
          foreign_selected_cert: normalizeSelectedCerts(p?.foreign_selected_cert),
        })),
    
        tech_params: (Array.isArray(f.tech_params) ? f.tech_params : []).map(t => ({
          param_name: safeStr(t?.param_name),
          param_value: safeStr(t?.param_value),
        })),
    
        attachments: (Array.isArray(f.attachments_draft) ? f.attachments_draft : [])
          .filter(a => a?.id || (!a?._localFile && (a?.file_name || a?.preview_url || a?.download_url)))
          .map(a => ({
            id: a?.id ?? null,
            attachment_type: safeStr(a?.attachment_type),
            file_name: safeStr(a?.file_name || a?._localFileName),
            certificate_number: safeStr(a?.certificate_number),
            certification_time: safeStr(a?.certification_time),
            uploader: safeStr(a?.uploader),
            preview_url: safeStr(a?.preview_url),
            download_url: safeStr(a?.download_url),
          })),
      };
    };


    const validateAttachmentRowForUpload = (row) => {
      if (!row?._localFile) return '请先选择文件';
      return '';
    };
	
	const getApiErrorMsg = (error, defaultMsg = '操作失败') => {
	  if (!error?.response?.data) return defaultMsg;
	
	  const data = error.response.data;

	  if (data.error) return data.error;
	  if (data.message) return data.message;
	  if (data.detail) return data.detail;
	  if (data.non_field_errors?.length) return data.non_field_errors[0]; // DRF 常见
	
	  if (error.response.status === 400) {
	    return '删除失败，可能存在关联物料或其他约束';
	  }
	
	  return defaultMsg;
	};

    const saveMaterialAndAttachments = async () => {
      if (!validateMaterialForm()) return;
    
      saving.value = true;
      let materialId = materialForm.value.id;
    
      // 1) 先保存物料（跟附件完全解耦）
      try {
        const payload = buildMaterialPayload();
		console.log('[PUT/PATCH materials payload]', JSON.parse(JSON.stringify(payload)));
    
        if (materialId) {
          // 编辑
          await api.materials.updateMaterial(materialId, payload);
        } else {
          // 新增
          const created = await api.materials.createMaterial(payload);
    
          // 兼容多种返回结构：{id}, {data:{id}}, 或直接返回数字
          materialId =
            created?.id ??
            created?.data?.id ??
            (typeof created === 'number' ? created : null);
    
          if (!materialId) {
            throw new Error('创建物料成功但未返回id，无法上传附件');
          }
          materialForm.value.id = materialId;
        }
    
        // 走到这里说明物料本身已经成功
        ElMessage.success(isEditMode.value ? '物料保存成功' : '新增物料成功');
      } catch (e) {
        console.error('保存物料失败:', e);
        ElMessage.error(getApiErrorMsg(e, '保存物料失败'));
        saving.value = false;
        return; // ❗️物料都没成功，就不要再尝试上传附件了
      }
    
      // 2) 再处理附件（失败也不影响上面的物料保存结果）
      try {
        const drafts = materialForm.value.attachments_draft || [];
    
        // 2.1 更新已有附件元数据（有 id 且标记了 _dirty）
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
		
        // 2.2 上传新附件（没有 id 且选择了文件）
        const needUpload = drafts.filter(r => !r?.id && r?._localFile);
        for (const row of needUpload) {
          const msg = validateAttachmentRowForUpload(row);
          if (msg) {
            // 只是提示，不中断整个流程
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
    
          // 用后端返回覆盖本地行（变成已上传）
          Object.assign(row, created || {});
          row._isNew = false;
          row._dirty = false;
          row._localFile = null;
          row._localFileName = '';
        }
      } catch (e) {
        console.error('保存附件失败:', e);
        ElMessage.error(getApiErrorMsg(e, '附件保存失败，请稍后重试'));
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
	const detailLocale = ref('国内');

    const openDetailDrawer = async (row) => {
      try {
          const detail = await api.materials.getMaterialDetail(row.id);
          materialDetail.value = detail || {};
          detailLocale.value = '国内'; // ✅ 每次打开重置
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
	// ✅ PDF 预览弹窗（点击 Tag 打开）
	// =============================
	const pdfPreviewDialogVisible = ref(false);
	const pdfPreviewTitle = ref('附件预览');
	const pdfPreviewFiles = ref([]);       // 当前组的文件列表
	const pdfPreviewActiveId = ref(null);  // 当前选中文件 uid
	
	const pdfPreviewUrl = computed(() => {
	  const f = (pdfPreviewFiles.value || []).find(x => x._uid === pdfPreviewActiveId.value);
	  return f?.preview_url || f?.download_url || '';
	});
	
	const pdfPreviewDownloadUrl = computed(() => {
	  const f = (pdfPreviewFiles.value || []).find(x => x._uid === pdfPreviewActiveId.value);
	  return f?.preview_url || f?.download_url || '';
	});
	
	// 给每个附件一个 uid（避免没 id 的情况）
	const withUid = (list) => (list || []).map((x, i) => ({
	  ...x,
	  _uid: x?.id ?? `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
	}));
	
	const openAttachmentGroupPreview = (row, group) => {
	  if (!canAttachmentView.value) {
	    ElMessage.warning('无权限：附件查看');
	    return;
	  }
	
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
	
	  const validFiles = filtered.filter(a => a?.preview_url || a?.download_url);
	  if (!validFiles.length) {
	    ElMessage.warning('没有可用文件');
	    return;
	  }
	
	  // ✅ 分成“可预览”和“不可预览”
	  const previewableFiles = validFiles.filter(isPreviewableFile);
	  const nonPreviewableFiles = validFiles.filter(a => !isPreviewableFile(a));
	
	  // ✅ 只有一个文件时：直接按文件类型处理
	  if (validFiles.length === 1) {
	    const file = validFiles[0];
	    if (isPreviewableFile(file)) {
	      openPdfPreview(file, pdfPreviewTitle.value);
	    } else {
	      triggerDownload(file);
	    }
	    return;
	  }
	
	  // ✅ 多文件但一个都不能预览：直接下载全部
	  if (!previewableFiles.length) {
	    nonPreviewableFiles.forEach((file, index) => {
	      setTimeout(() => triggerDownload(file), index * 150);
	    });
	    ElMessage.info(`该分组下共 ${nonPreviewableFiles.length} 个文件，均为不可预览格式，已直接下载`);
	    return;
	  }
	
	  // ✅ 多文件：只把可预览的放进预览弹窗
	  pdfPreviewFiles.value = withUid(previewableFiles);
	  pdfPreviewActiveId.value = pdfPreviewFiles.value[0]?._uid || null;
	  pdfPreviewDialogVisible.value = true;
	
	  // ✅ 如果有不可预览文件，提示用户会直接下载/去详情下载
	  if (nonPreviewableFiles.length) {
	    ElMessage.info(`其中 ${nonPreviewableFiles.length} 个非 PDF/图片文件不支持预览，请在详情中下载`);
	  }
	};

    const openPreview = (url) => {
      if (!url) return ElMessage.warning('无预览地址');
      window.open(url, '_blank');
    };
	
	const PREVIEW_IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
	
	const getFileExt = (file) => {
	  const raw =
	    file?.file_name ||
	    file?._localFileName ||
	    file?.preview_url ||
	    file?.download_url ||
	    '';
	
	  const clean = String(raw).split('?')[0].split('#')[0];
	  const idx = clean.lastIndexOf('.');
	  if (idx === -1) return '';
	  return clean.slice(idx + 1).toLowerCase();
	};
	
	const isPreviewableFile = (file) => {
	  const ext = getFileExt(file);
	  return ext === 'pdf' || PREVIEW_IMAGE_EXTS.includes(ext);
	};
	
	const getBestDownloadUrl = (file) => {
	  return file?.download_url || file?.preview_url || '';
	};
	
	const triggerDownload = (file) => {
	  const url = getBestDownloadUrl(file);
	  if (!url) {
	    ElMessage.warning('无可下载地址');
	    return;
	  }
	  window.open(url, '_blank');
	};
	
	const normalizePreviewFile = (payload) => ({
	  ...payload,
	  _uid: payload?.id ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
	  file_name: payload?.file_name || payload?._localFileName || '附件',
	  preview_url: payload?.preview_url || payload?.download_url || '',
	  download_url: payload?.download_url || payload?.preview_url || '',
	});
	
	// ✅ 统一：弹窗内预览（支持传 row 或 url）
	const openPdfPreview = (payload, title = '附件预览') => {
	  if (!canAttachmentView.value) {
	    ElMessage.warning('无权限：附件查看');
	    return;
	  }
	
	  let file = null;
	
	  // 1) 字符串 URL
	  if (typeof payload === 'string') {
	    const url = payload;
	    if (!url) {
	      ElMessage.warning('无可用地址');
	      return;
	    }
	
	    file = normalizePreviewFile({
	      file_name: '附件',
	      preview_url: url,
	      download_url: url,
	    });
	  }
	  // 2) 附件对象
	  else if (payload && typeof payload === 'object') {
	    const url = payload.preview_url || payload.download_url || '';
	    if (!url) {
	      ElMessage.warning('无可用地址');
	      return;
	    }
	
	    // ✅ 非 PDF / 图片：直接下载，不打开预览弹窗
	    if (!isPreviewableFile(payload)) {
	      triggerDownload(payload);
	      return;
	    }
	
	    file = normalizePreviewFile(payload);
	  }
	
	  if (!file) return;
	
	  pdfPreviewTitle.value = title;
	  pdfPreviewFiles.value = [file];
	  pdfPreviewActiveId.value = file._uid;
	  pdfPreviewDialogVisible.value = true;
	};


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
	  if (s === '开发中') return 'dot-blue';
      return 'dot-gray';
    };
	
	const ATTACHMENT_TYPE_OPTIONS = [
	  'UL', 'CCC', 'VDE', 'CQC', 'SA', 'CE',
	  '规格书', '测试数据', '其他',
	];
	
	const CERT_TYPES = ['UL', 'CCC', 'VDE', 'CQC', 'SA', 'CE'];
	
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
	const statusTooltip = (status) => {
	  const s = String(status || '').trim();
	  const map = {
	    '首选': '公司验证成熟、最推荐的',
	    '备选': '备选，走新物料审批流程',
	    '预警': '有停产风险',
	    '禁用': '有质量问题',
	  };
	  return map[s] || '';
	};
	
	const handleLevel1Click = async () => {
	  listScope.value = 'ALL';

	  activeTreeLevel2Id.value = null;
	  activeLevel3Id.value = null;
	
	  selectedCategoryId.value = null;
	  canCreateMaterial.value = false;
	  createMaterialTooltip.value = '请点击选择一个四级目录才能新增物料';
	
	  // 清空所有树的高亮
	  Object.values(treeRefs.value).forEach(tree => {
	    if (tree) tree.setCurrentKey(null);
	  });
	  // 清空筛选条件
	  filters.value.status = '';
	  filters.value.project_name = '';
	  filters.value.keyword = '';
	
	  await fetchMaterials();
	};

    const fetchMaterials = async () => {
      try {
        const params = {};
    
        // ✅ 只有“四级目录范围”才传 category_id
        if (listScope.value === 'CATEGORY' && selectedCategoryId.value != null) {
          params.category_id = selectedCategoryId.value;
        }
    
        if (filters.value.status) params.status = filters.value.status;
        if (filters.value.keyword) params.keyword = filters.value.keyword;
        if (filters.value.project_name) params.project_name = filters.value.project_name;
    
        const data = await api.materials.getMaterials(params);
        materialList.value = Array.isArray(data) ? data : [];
        total.value = materialList.value.length;
        currentPage.value = 1;
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

        const normalize = (nodes, level = 1, parentId = null) => {
          (nodes || []).forEach((n) => {

            if (!Array.isArray(n.children)) n.children = [];
        
            if (n.level == null) n.level = level;
            if (n.parent_id == null) n.parent_id = parentId;
        
            // 递归子节点
            normalize(n.children, level + 1, n.id ?? parentId);
          });
        };
        
        normalize(list, 1, null);
        directoryTree.value = list;
        if (directoryTree.value.length > 0) {
          defaultOpened.value = [String(directoryTree.value[0].id)];
        }

        await nextTick();
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
      nextTick(() => {
        contextMenuPosition.value = { x: event.clientX, y: event.clientY };
      });
    
      const items = [];
      const lv = Number(node.level);
    
      if (lv === 1) {
        if (canCategoryAdd.value) items.push({ label: '新增二级目录', action: 'addChild' });
    
      } else if (lv === 2) {
        // ✅ 二级目录菜单
		if (canCategoryAdd.value) items.push({ label: '新增同级（二级）', action: 'addSibling' });
        if (canCategoryAdd.value) items.push({ label: '新增三级目录', action: 'addChild' });
		if (canCategoryEdit.value) items.push({ label: '编辑', action: 'edit' });
		if (canCategoryDelete.value) items.push({ label: '删除', action: 'delete' });

    
      } else if (lv === 3) {
        // ✅ 三级目录菜单
        if (canCategoryAdd.value) items.push({ label: '新增同级（三级）', action: 'addSibling' });
        if (canCategoryAdd.value) items.push({ label: '新增四级目录', action: 'addChild' }); 
        if (canCategoryEdit.value) items.push({ label: '编辑', action: 'edit' });
        if (canCategoryDelete.value) items.push({ label: '删除', action: 'delete' });
    
      } else if (lv === 4) {
        // ✅ 四级目录菜单
        if (canCategoryAdd.value) items.push({ label: '新增同级（四级）', action: 'addSibling' });
        if (canCategoryEdit.value) items.push({ label: '编辑', action: 'edit' });
        if (canCategoryDelete.value) items.push({ label: '删除', action: 'delete' });
      }
    
      contextMenuItems.value = items;
    
      if (!items.length) contextMenuVisible.value = false;
    };

    const onNodeContextMenu = (event, node) => {
      event.preventDefault();
      const data = node?.data ? node.data : node;
      openContextMenu(event, data);
    };

    const handleContextMenuAction = (action) => {
      if (!currentNode.value) return;
    
      // ✅ 二次兜底
      if ((action === 'addChild' || action === 'addSibling') && !canCategoryAdd.value) {
        ElMessage.warning('无权限：分类新增');
        return;
      }
      if (action === 'edit' && !canCategoryEdit.value) {
        ElMessage.warning('无权限：分类修改');
        return;
      }
      if (action === 'delete' && !canCategoryDelete.value) {
        ElMessage.warning('无权限：分类删除');
        return;
      }
      if (!currentNode.value) return
      pendingAction = action
    
      if (action === 'addChild' || action === 'addSibling') {
        if (action === 'addChild' && Number(currentNode.value.level) >= 4) {
          ElMessage.warning('当前为四级目录，不能再新增子级');
          contextMenuVisible.value = false;
          return;
        }
        addDialogVisible.value = true;
      } 
      else if (action === 'delete') {
        deleteDialogVisible.value = true
      } 
      else if (action === 'edit') {
        // =================== 新增：打开编辑弹窗 ===================
        editForm.value.name = currentNode.value.name || ''
        editDialogVisible.value = true
      }
      contextMenuVisible.value = false
    }

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
    
      // ✅ addChild：允许 1/2/3（新增二级/三级/四级），不允许 4
      if (pendingAction === 'addChild' && !(lv === 1 || lv === 2 || lv === 3)) {
        ElMessage.warning('只能在一级/二级/三级目录下新增子级');
        return;
      }
    
      // ✅ addSibling：允许 2/3/4
      if (pendingAction === 'addSibling' && !(lv === 2 || lv === 3 || lv === 4)) {
        ElMessage.warning('只能在二级/三级/四级目录下新增同级');
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
      addForm.value = { directory_name: '' };
      pendingAction = null;
    };

    const confirmDeleteDirectory = async () => {
      if (!currentNode.value) return
      try {
        await api.categories.deleteCategory(currentNode.value.id)
        ElMessage.success('删除成功')
        deleteDialogVisible.value = false
        await loadDirectory()
      } catch (e) {
        const errMsg = getApiErrorMsg(e, '删除失败')
        ElMessage.error(errMsg)
        console.error('删除目录失败:', e) 
      } finally {
        deleteDialogVisible.value = false
      }
    }

	
	const clearOtherTreeCurrent = (keepLevel2Id) => {
	  Object.entries(treeRefs.value).forEach(([level2Id, tree]) => {
	    if (!tree) return;
	    if (String(level2Id) !== String(keepLevel2Id)) {
	      tree.setCurrentKey(null); 
	    }
	  });
	};
	
	const handleTreeCurrentChange = async (data, level2Id) => {
	  if (!data) return;
	
	  const lv = Number(data.level);
	
	  // ✅ 二级 / 三级 / 四级都按目录过滤
	  if ([2, 3, 4].includes(lv)) {
	    listScope.value = 'CATEGORY';
	
	    activeTreeLevel2Id.value = level2Id;
	    activeLevel3Id.value = data.id;
	
	    Object.entries(treeRefs.value).forEach(([k, tree]) => {
	      if (!tree) return;
	      if (String(k) === String(level2Id)) tree.setCurrentKey(data.id);
	      else tree.setCurrentKey(null);
	    });
	
	    selectedCategoryId.value = data.id;
	
	    // ✅ 仍然只有四级目录允许新增物料
	    if (lv === 4) {
	      canCreateMaterial.value = true;
	      createMaterialTooltip.value = '';
	      materialForm.value.category_id = data.id;
	    } else {
	      canCreateMaterial.value = false;
	      createMaterialTooltip.value = '请点击选择一个四级目录才能新增物料';
	    }
	
	    await fetchMaterials();
	    return;
	  }
	
	  // 其他情况回到全部
	  listScope.value = 'ALL';
	
	  activeTreeLevel2Id.value = null;
	  activeLevel3Id.value = null;
	  Object.values(treeRefs.value).forEach(t => t?.setCurrentKey(null));
	
	  selectedCategoryId.value = null;
	  canCreateMaterial.value = false;
	  createMaterialTooltip.value = '请点击选择一个四级目录才能新增物料';
	
	  await fetchMaterials();
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

    onMounted(async () => {
      window.addEventListener('resize', handleResize)
      window.addEventListener('click', closeAllContextMenus)
    
      // ✅ 进页面先查证书到期
      fetchCertExpire(180)
      await loadDirectory()
    
      // 默认展示全部物料（不绑定任何三级目录）
      selectedCategoryId.value = null
      canCreateMaterial.value = false
      createMaterialTooltip.value = '请点击选择一个四级目录才能新增物料'
	  
      await fetchAllProjects();
      // 关键：直接加载全部
      await fetchMaterials()
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', closeAllContextMenus);
    });

    return {
	  // ✅ 权限
	  canCategoryAdd,
	  canCategoryEdit,
	  canCategoryDelete,
	  canMaterialAdd,
	  canMaterialEdit,
	  canMaterialDelete,
	  canAttachmentUpload,
	  canAttachmentView,
	  canViewManufacturer,
	  canViewSupplier,
	  
	  // ✅ 证书到期提醒
	  certExpireDialogVisible,
	  certExpireLoading,
	  certExpireRows,
	  certExpireMsg,
	  formatRemainingDays,
	  
	  filters,
	  projectOptions,
	  
      directoryTree,
      defaultOpened,
      setTreeRef,
      handleTreeCurrentChange,
	  handleLevel1Click,

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
	  openPdfPreview,
	  isPreviewableFile,
	  triggerDownload,
	  
	  editDialogVisible,
	  editForm,
	  confirmEditDirectory,
	  resetEditForm,

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
	  statusDotClass,
	  statusTooltip,

      // ✅ 抽屉
	  requireEnglishFields,
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

      // ✅ 附件缓存操作
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
	  openAttachmentGroupPreview,
	  pdfPreviewDialogVisible,
	  pdfPreviewTitle,
	  pdfPreviewFiles,
	  pdfPreviewActiveId,
	  pdfPreviewUrl,
	  pdfPreviewDownloadUrl,
	  requireEnglishFields,
	  detailLocale,

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
.sidebar { width: 300px; flex-shrink: 0; border-right: 1px solid #e0e0e0; background-color: #f4f5f4; padding: 5px; }
.side-main-content { flex: 1; display: flex; flex-direction: column; padding: 20px; overflow: hidden; min-width: 0; }
.main-content-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0; }

.create-use-case { width: 7vw; height: 4vh; font-size: 0.92rem; }
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
.dot-yellow { background: #fdce0e; }
.dot-orange { background: #ff7700; }
.dot-red { background: #ec1818; }
.dot-gray { background: #bdc3c7; }
.dot-blue { background: #0d70c7; }

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
  z-index: 999;
}

.level1-title {
  width: 100%;
  display: flex;
  align-items: center;
}

.dir-title{
  display: flex;
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

.attach-tags .tag-disabled {
  opacity: 1 !important;
  color: #989ba1 !important;
  background-color: #f5f7fa !important;
  border-color: #e4e7ed !important;
}

.attach-tags .tag-disabled:hover {
  background-color: #ebedf0 !important;
}

.attach-tags .tag-clickable {
  cursor: pointer;
}

.tag-disabled{
  opacity: 0.35;
  filter: grayscale(1);
}


.tag-clickable{
  cursor: pointer;
  user-select: none;
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

/* 弹窗 header */
.cert-expire-header{
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 6px;
}
.cert-expire-title{
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
}
.cert-expire-subtitle{
  font-size: 16px;
  color: #e74c3c;
}

/* 表头：蓝底白字 */
:deep(.cert-expire-table .el-table__header-wrapper th){
  background: #00bef7 !important;
  color: #ffffff !important;
  font-weight: 600;
}
:deep(.cert-expire-table .el-table__header-wrapper th .cell){
  color: #ffffff !important;
}

/* 已过期标红 */
.expire-red{
  color: #e74c3c;
  font-weight: 600;
}

/* 底部 msg 更弱化 */
.cert-expire-msg{
  margin-top: 10px;
  font-size: 14px;
  color: #909399;
}

.kv-form .kv-item{
  padding: 12px 12px;          /* 比详情稍微大一点点也行 */
}

.kv-form :deep(.el-input__wrapper),
.kv-form :deep(.el-select__wrapper){
  border-radius: 10px;
}

.kv-form :deep(.el-input__wrapper){
  height: 34px;                 /* 控件高度更紧凑 */
}

.kv-form :deep(.el-select){
  width: 100%;
}

.req{
  color: #e74c3c;
  margin-left: 4px;
  font-weight: 700;
}

.kv-warn{
  margin-top: 10px;
  font-size: 12px;
  color: #e6a23c;
  padding-left: 2px;
}
</style>
