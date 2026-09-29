<template>
  <div class="home-container" @click="closeAllContextMenus">
    <Header />

    <div class="main-content">
      <!-- 左侧导航栏 -->
      <div class="sidebar">
        <el-scrollbar height="90vh">
          <el-menu
            class="el-menu-vertical"
            background-color="#f8f9fa"
            :default-openeds="defaultOpened"
          >
            <!-- 一级项目 -->
            <el-sub-menu
              v-for="level1 in directoryTree"
              :key="level1.id"
              :index="String(level1.id)"
            >
              <template #title>
                <span>{{ level1.name }}</span>
              </template>

              <!-- 二级类型 -->
              <el-sub-menu
                v-for="level2 in level1.children"
                :key="level2.id"
                :index="level1.id + '-' + level2.id"
                @contextmenu.prevent="openContextMenu($event, level2)"
              >
                <template #title>
                  <span>{{ level2.name }}</span>
                </template>

                <!-- 三级及以上功能模块树 -->
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
                    <template #empty>
                      <span>暂无功能模块</span>
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

      <!-- 表格右键菜单 -->
      <div
        v-if="tableContextMenuVisible"
        class="context-menu"
        :style="{ left: tableContextMenuPosition.x + 'px', top: tableContextMenuPosition.y + 'px' }"
        @click.stop
      >
        <div class="context-menu-item" @click="insertCaseBelow">
          在此处下方插入新用例
        </div>
      </div>

      <!-- 右侧主内容 -->
      <div class="side-main-content">
        <div class="main-content-top">
          <div>
            <el-tooltip
              :content="createCaseTooltip"
              :disabled="canCreateCase"
              placement="top"
              effect="dark"
            >
              <div style="display: inline-block;">
                <el-button
                  type="primary"
                  round
                  class="create-use-case"
                  @click="openDialog(false)"
                  :disabled="!canCreateCase"
                >
                  <img src="/src/assets/add2.png" class="el-button-img" />
                  新建用例
                </el-button>
              </div>
            </el-tooltip>

            <el-button
              type="primary"
              round
              @click="openExportDialog"
              class="export-use-cases"
            >
              <img src="/src/assets/derive1.png" class="el-button-img" />
              导出用例
            </el-button>
          </div>
          <div>
			<el-select
			  v-model="filters.priority"
			  clearable
			  placeholder="优先级"
			  style="width: 7vw; margin-right: 0.5vw;"
			  @change="applyPriorityFilter"
			>
			  <el-option label="P1" :value="0" />
			  <el-option label="P2" :value="1" />
			  <el-option label="P3" :value="2" />
			  <el-option label="P4" :value="3" />
			</el-select>
            <el-input
              v-model="filters.keyword"
              clearable
              placeholder="关键字搜索"
              @keyup.enter="handleSearch"
              style="width: 15vw; margin-right: 0.5vw;"
            />
            <el-button round @click="handleSearch">筛选</el-button>
          </div>
        </div>

        <!-- 用例表格 -->
        <el-table
          :data="pagedCaseList"
          stripe
          height="76vh"
          style="width: 100%;"
          @selection-change="handleSelectionChange"
          @row-contextmenu="openTableContextMenu"
        >
          <el-table-column type="selection" width="40" align="center" />
          <el-table-column label="编号" width="80" align="center">
            <template #default="{ $index }">
              T{{ (currentPage - 1) * pageSize + $index + 1 }}
            </template>
          </el-table-column>

          <!-- 新增一级模块列 -->
          <el-table-column label="一级模块" prop="level3_name" align="center" width="140" />
          <!-- 二级模块（原功能模块） -->
          <el-table-column label="二级模块" prop="module" align="center" width="160" />
		  <el-table-column label="测试项" align="center">
		    <template #default="{ row }">
		      <div class="cell-2line" :title="row.test_option">{{ row.test_option }}</div>
		    </template>
		  </el-table-column>
		  
		  <el-table-column label="测试步骤" align="center">
		    <template #default="{ row }">
		      <div class="cell-2line" :title="row.test_procedure">{{ row.test_procedure }}</div>
		    </template>
		  </el-table-column>
		  
		  <el-table-column label="预期结果" align="center">
		    <template #default="{ row }">
		      <div class="cell-2line" :title="row.expect_result">{{ row.expect_result }}</div>
		    </template>
		  </el-table-column>
		  
		  <el-table-column label="适用于" align="center">
		    <template #default="{ row }">
		      <div class="cell-2line" :title="row.platform">{{ row.platform }}</div>
		    </template>
		  </el-table-column>
		  
          <el-table-column label="优先级" prop="priority" width="80" align="center">
            <template #default="{ row }">
              <span :class="['priority-tag', 'priority-' + formatPriority(row)]">
                {{ formatPriority(row) }}
              </span>
            </template>
          </el-table-column>
		  
          <el-table-column label="操作" align="center">
            <template #default="{ row }">
              <el-button @click="openEditDialog(row)" size="small" type="primary" plain>编辑</el-button>
              <el-button @click="handleDeleteCase(row)" size="small" type="danger" plain>删除</el-button>
            </template>
          </el-table-column>
        </el-table>
		<!-- 分页显示 -->
		<div class="table-pagination">
		  <div class="pagination-info">
		    共 {{ total }} 行 | 共 {{ totalPages }} 页
		  </div>
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

    <!-- 新增目录弹窗 -->
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

    <!-- 删除确认弹窗 -->
    <el-dialog title="删除确认" v-model="deleteDialogVisible" width="35vw" center>
      <div style="font-size: 16px; text-align: center;">
        确定删除该目录节点及其所有子节点吗？<br/>
        <span style="color: #e74c3c;">此操作不可恢复！</span>
      </div>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDeleteDirectory">确定删除</el-button>
      </template>
    </el-dialog>
	
	<!-- 删除用例确认弹窗 -->
	<el-dialog
	  title="删除确认"
	  v-model="deleteCaseDialogVisible"
	  width="35vw"
	  center
	>
	  <div style="font-size: 16px; text-align: center;">
	    确定删除该测试用例吗？<br/>
	    <span style="color: #e74c3c;">此操作不可恢复！</span>
	  </div>
	  <template #footer>
	    <el-button @click="deleteCaseDialogVisible = false">取消</el-button>
	    <el-button type="danger" @click="confirmDeleteCase">确定删除</el-button>
	  </template>
	</el-dialog>

    <!-- 新建/编辑用例弹窗 -->
    <el-dialog
      :title="isEdit ? '编辑用例' : '新建用例'"
      v-model="isDialogVisible"
      width="50vw"
      @close="resetForm"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="一级模块">
          <el-input v-model="form.level3_name" disabled />
        </el-form-item>
        <el-form-item label="二级模块">
          <el-input v-model="form.module" disabled />
        </el-form-item>
        <el-form-item label="测试项">
          <el-input v-model="form.test_option" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="测试步骤">
          <el-input v-model="form.test_procedure" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="预期结果">
          <el-input v-model="form.expect_result" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="适用于">
          <el-input v-model="form.platform" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="form.priority" placeholder="请选择优先级">
            <el-option label="P1" :value="0" />
            <el-option label="P2" :value="1" />
            <el-option label="P3" :value="2" />
            <el-option label="P4" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导出弹窗 -->
    <el-dialog title="导出用例" v-model="isExportDialogVisible" width="35vw" @close="resetExportForm">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="exportForm.report_title" placeholder="请输入项目名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeExportDialog">取消</el-button>
        <el-button type="primary" @click="exportCases">导出</el-button>
      </template>
    </el-dialog>
	
	<!-- 编辑用例抽屉 -->
	<el-drawer
	  v-model="isEditDrawerVisible"
	  direction="rtl"
	  size="48%"
	  :with-header="false"
	  custom-class="beauty-drawer"
	>
	  <!-- ===== 顶部标题区 ===== -->
	  <div class="drawer-header">
	    <div class="drawer-title">
	      <span class="title-text">编辑测试用例</span>
	      <el-tag type="info" size="small" class="title-tag">
	        {{ form.case_id ? 'ID: ' + form.case_id : '未生成ID' }}
	      </el-tag>
	    </div>
	
	    <div class="drawer-subtitle">
	      <span class="sub-item">一级模块：{{ form.level3_name || '-' }}</span>
	      <span class="sub-item">二级模块：{{ form.module || '-' }}</span>
	    </div>
	  </div>
	
	  <!-- ===== 内容区滚动 ===== -->
	  <div class="drawer-body">
	    <el-form :model="form" label-width="90px" class="drawer-form">
	
	      <!-- 测试内容卡片 -->
	      <div class="drawer-card">
	        <div class="card-title">测试内容</div>
	
	        <el-form-item label="测试项">
	          <el-input v-model="form.test_option" type="textarea" :rows="3" class="beauty-textarea" />
	        </el-form-item>
	
	        <el-form-item label="测试步骤">
	          <el-input v-model="form.test_procedure" type="textarea" :rows="6" class="beauty-textarea" />
	        </el-form-item>
	
	        <el-form-item label="预期结果">
	          <el-input v-model="form.expect_result" type="textarea" :rows="6" class="beauty-textarea" />
	        </el-form-item>
	      </div>
	
	      <!-- 其他信息卡片 -->
	      <div class="drawer-card">
	        <div class="card-title">其他信息</div>
	
	        <el-row :gutter="14">
	          <el-col :span="12">
	            <el-form-item label="适用于">
	              <el-input
	                v-model="form.platform"
	                type="textarea"
	                :autosize="{ minRows: 2, maxRows: 6 }"
	                class="beauty-textarea"
	              />
	            </el-form-item>
	          </el-col>
	
	          <el-col :span="12">
	            <el-form-item label="优先级">
	              <el-select v-model="form.priority" placeholder="请选择">
	                <el-option label="P1" :value="0" />
	                <el-option label="P2" :value="1" />
	                <el-option label="P3" :value="2" />
	                <el-option label="P4" :value="3" />
	              </el-select>
	            </el-form-item>
	          </el-col>
	        </el-row>
	      </div>
	    </el-form>
	  </div>
	
	  <!-- ===== 底部固定按钮区 ===== -->
	  <div class="drawer-footer">
	    <el-button @click="isEditDrawerVisible = false" round>
	      取消
	    </el-button>
	    <el-button type="primary" @click="handleEditSave" round>
	      保存
	    </el-button>
	  </div>
	</el-drawer>
  </div>
</template>

<script>
import Header from '../components/common/Header.vue';
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  findDirectory,
  createDirectory,
  updateDirectory,
  deleteDirectory,
  findCase,
  addCase,
  editCase,
  deleteCase,
  createReport,
} from '../api.js';

export default {
  name: 'Home',
  components: { Header },
  setup() {
    const directoryTree = ref([]);
    const treeRefs = ref({});
    const defaultOpened = ref([]);
	const fetchSeq = ref(0);

    // ✅ 分页相关
    const currentPage = ref(1);
    const pageSize = ref(12);
    const total = ref(0);
    
    const pagedCaseList = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return caseList.value.slice(start, end);
    });
    
    const totalPages = computed(() => Math.ceil(total.value / pageSize.value));
    
    const handlePageChange = (page) => {
      currentPage.value = page;
    };
    
	const handleSizeChange = (size) => {
	  pageSize.value = size;
	  currentPage.value = 1;
	};

    const caseList = ref([]);
    const selectedCases = ref([]);
    const filters = ref({ keyword: '', priority: null });

    const isDialogVisible = ref(false);
	const isEditDrawerVisible = ref(false);
    const isExportDialogVisible = ref(false);
    const isEdit = ref(false);
	
	const deleteCaseDialogVisible = ref(false); // 用例删除弹窗显示控制
	const deleteCaseRow = ref(null);           // 当前准备删除的用例行

    const form = ref({
      case_id: null,
      level3_name: '',   // 一级模块（level=3）
      module: '',        // 二级模块（level=4）
      test_option: '',
      test_procedure: '',
      expect_result: '',
      platform: '',
      priority: null,
      case_order: null
    });

    const exportForm = ref({ report_title: '' });

    // 右键菜单
    const contextMenuVisible = ref(false);
    const contextMenuPosition = ref({ x: 0, y: 0 });
    const contextMenuItems = ref([]);
    const currentNode = ref(null);

    const tableContextMenuVisible = ref(false);
    const tableContextMenuPosition = ref({ x: 0, y: 0 });
    const currentRowIndex = ref(-1);
    // ✅ 新增：用ref存储插入标记，替代window全局变量，避免丢失
    const tempInsertIndex = ref(-1);

    // 目录增删改
    const addDialogVisible = ref(false);
    const addForm = ref({ directory_name: '', module_sort: 1 });
    let pendingAction = null;

    const editDialogVisible = ref(false);
    const editForm = ref({ module_id: null, module_name: '', module_sort: 1 });

    const deleteDialogVisible = ref(false);

    const canCreateCase = ref(false);
    const createCaseTooltip = ref('');

    const formatPriority = (row) => {
      const map = {
        0: 'P1',
        1: 'P2',
        2: 'P3',
        3: 'P4',
        '0': 'P1',
        '1': 'P2',
        '2': 'P3',
        '3': 'P4'
      };
      return map[row.priority] || '-';
    };

    const setTreeRef = (el, level2Id) => {
      if (el) treeRefs.value[level2Id] = el;
    };
	
	const sourceCaseList = ref([]); 
	
	const applyPriorityFilter = () => {
	  const p = filters.value.priority;
	
	  // p 为空：显示全部（关键字查询后的全量）
	  if (p === null || p === '' || p === undefined) {
	    caseList.value = sourceCaseList.value.slice();
	  } else {
	    caseList.value = sourceCaseList.value.filter(
	      item => Number(item.priority) === Number(p)
	    );
	  }
	
	  total.value = caseList.value.length;
	  currentPage.value = 1; // ✅ 切筛选回到第一页
	};

    const loadDirectory = async () => {
      try {
        const res = await findDirectory();
        directoryTree.value = res.data || [];
    
        // 递归补充 parent_id 字段 + 按 sort 排序
        const processTreeNodes = (nodes, parentId = null) => {
          // 按排序权重升序排列
          nodes.sort((a, b) => (a.sort || 1) - (b.sort || 1));
          nodes.forEach(node => {
            // 补充 parent_id 字段
            node.parent_id = parentId;
            // 递归处理子节点
            if (node.children && node.children.length) {
              processTreeNodes(node.children, node.id);
            }
          });
        };
        processTreeNodes(directoryTree.value);
    
        if (directoryTree.value.length > 0) {
          defaultOpened.value = [String(directoryTree.value[0].id)];
        }
        await nextTick();
        handleModuleCheck();
      } catch (e) {
        console.error('加载目录失败', e);
      }
    };

    const getLevel4IdsToQuery = () => {
      const allCheckedNodes = [];
      Object.values(treeRefs.value).forEach(tree => {
        if (tree) allCheckedNodes.push(...tree.getCheckedNodes());
      });

      const level4Ids = new Set();
      const hasLevel3 = allCheckedNodes.some(n => n.level === 3);

      allCheckedNodes.forEach(node => {
        if (node.level === 4) level4Ids.add(node.id);
        else if (node.level === 3 && hasLevel3) {
          const collect = (children) => {
            children.forEach(child => {
              if (child.level === 4) level4Ids.add(child.id);
              else if (child.children?.length) collect(child.children);
            });
          };
          if (node.children?.length) collect(node.children);
        }
      });
      return Array.from(level4Ids);
    };

    // 获取当前唯一选中的 level=4 节点及其 level=3 父节点
    const getCurrentSelectedModules = () => {
      const allChecked = [];
      Object.values(treeRefs.value).forEach(tree => {
        if (tree) allChecked.push(...tree.getCheckedNodes());
      });

      const level3Nodes = allChecked.filter(n => n.level === 3);
      const level4Nodes = allChecked.filter(n => n.level === 4);

      if (level3Nodes.length > 0 || level4Nodes.length !== 1) return null;

      const level4Node = level4Nodes[0];
      // 找父节点（level=3）
      let parent = null;
      const findParent = (nodes) => {
        for (const node of nodes) {
          if (node.children?.some(child => child.id === level4Node.id)) {
            parent = node;
            return true;
          }
          if (node.children?.length && findParent(node.children)) return true;
        }
        return false;
      };
      directoryTree.value.forEach(l1 => l1.children?.forEach(l2 => findParent(l2.children || [])));

      return { level4: level4Node, level3: parent };
    };
	
	let checkTimer = null;
	
	const handleTreeCheck = () => {
	  clearTimeout(checkTimer);
	  checkTimer = setTimeout(() => {
	    handleModuleCheck();   // 你原来的逻辑
	  }, 80); // 50~150ms 都行
	};
	
	const lastProjectKey = ref('');
	
	const triggerFetchCases = () => {
	  const ids = getLevel4IdsToQuery();
	  const key = ids.slice().sort((a,b)=>a-b).join(',');
	  if (key === lastProjectKey.value && filters.value.keyword === '') return;
	  lastProjectKey.value = key;
	  fetchCases();
	};

    const handleModuleCheck = () => {
      const allChecked = [];
      Object.values(treeRefs.value).forEach(tree => {
        if (tree) allChecked.push(...tree.getCheckedNodes());
      });

      const hasLevel3 = allChecked.some(n => n.level === 3);
      const level4Count = allChecked.filter(n => n.level === 4).length;

      if (hasLevel3) {
        canCreateCase.value = false;
        createCaseTooltip.value = '已勾选一级模块（三级目录），请只勾选一个二级模块（四级）';
      } else if (level4Count !== 1) {
        canCreateCase.value = false;
        createCaseTooltip.value = level4Count > 1
          ? '同时勾选了多个二级模块，请只勾选一个'
          : '请先勾选一个二级模块（四级功能模块）';
      } else {
        canCreateCase.value = true;
        createCaseTooltip.value = '';
      }
	  currentPage.value = 1;   // ✅ 勾选模块变了就回第一页
	  triggerFetchCases();
    };

    const fetchCases = async () => {
      const mySeq = ++fetchSeq.value;   // ✅ 本次请求序号
      const projectIds = getLevel4IdsToQuery();
    
      // ✅ 没有选中任何 level4：立刻清空，并“作废”之前所有请求回写
      if (projectIds.length === 0) {
        sourceCaseList.value = [];
        caseList.value = [];
        total.value = 0;
        currentPage.value = 1;
        return;
      }
    
      const postData = new FormData();
      postData.append('keyword', filters.value.keyword);
      postData.append('project_id', JSON.stringify(projectIds));
    
      try {
        const res = await findCase(postData);

        if (mySeq !== fetchSeq.value) return;
    
        const list = (res.data || []);
        
        // 构建 level4 → level3 映射
        const level4ToLevel3 = {};
        directoryTree.value.forEach(level1 => {
          level1.children?.forEach(level2 => {
            level2.children?.forEach(level3 => {
              level3.children?.forEach(level4 => {
                level4ToLevel3[level4.id] = {
                  level3_name: level3.name,
                  level2_name: level2.name,
                  level1_name: level1.name,
                };
              });
            });
          });
        });
        
        // 为每条用例补充层级信息
        list.forEach(item => {
          const projectId = item.project_id || item.module_id;
          const levelInfo = level4ToLevel3[projectId] || {};
          item.level3_name = levelInfo.level3_name || '';
          item.level2_name = levelInfo.level2_name || '';
          item.level1_name = levelInfo.level1_name || '';
          item.project_id = projectId;
        });
        
        // ✅ 新排序逻辑：先按一级模块，再按二级模块，再按用例顺序
        list.sort((a, b) => {
          const l1 = a.level1_name.localeCompare(b.level1_name);
          if (l1 !== 0) return l1;
          const l3 = a.level3_name.localeCompare(b.level3_name);
          if (l3 !== 0) return l3;
          const l2 = a.module.localeCompare(b.module);
          if (l2 !== 0) return l2;
          return a.case_order - b.case_order;
        });
        
        sourceCaseList.value = list;   // ✅ 保存后端结果（不动关键字逻辑）
        applyPriorityFilter();
      } catch (e) {
		if (mySeq !== fetchSeq.value) return;
        console.error('获取用例失败', e);
        ElMessage.error('获取用例列表失败');
      }
    };

    const handleSearch = () => {
      currentPage.value = 1;
      fetchCases();
    };

    // 目录右键菜单
    const openContextMenu = (event, node) => {
      currentNode.value = node;
      contextMenuVisible.value = true;
      contextMenuPosition.value = { x: event.clientX, y: event.clientY };
      contextMenuItems.value = [{ label: '新增子级', action: 'addChild' }];
    };

    const onNodeContextMenu = (event, node) => {
      event.preventDefault();
      currentNode.value = node;
      contextMenuVisible.value = true;
      contextMenuPosition.value = { x: event.clientX, y: event.clientY };

      const items = [];
      if (node.level === 3) items.push({ label: '新增同级', action: 'addSibling' });
      items.push({ label: '新增子级', action: 'addChild' });
      if (node.level >= 3) {
        items.push({ label: '编辑', action: 'edit' });
        items.push({ label: '删除', action: 'delete' });
      }
      contextMenuItems.value = items;
    };

    const handleContextMenuAction = (action) => {
      if (action === 'addChild' || action === 'addSibling') {
        pendingAction = action;
        addDialogVisible.value = true;
      } else if (action === 'edit') {
        editForm.value = {
          module_id: currentNode.value.id,
          module_name: currentNode.value.name,
          module_sort: currentNode.value.sort || 1
        };
        editDialogVisible.value = true;
      } else if (action === 'delete') {
        deleteDialogVisible.value = true;
      }
      contextMenuVisible.value = false;
    };

    const closeAllContextMenus = () => {
      contextMenuVisible.value = false;
      tableContextMenuVisible.value = false;
    };

    // 表格右键
    const openTableContextMenu = (row, column, event) => {
      event.preventDefault();
      // ✅ 修复：用findIndex精准匹配行，避免indexOf失效
      currentRowIndex.value = caseList.value.findIndex(item => item.case_id === row.case_id);
      tableContextMenuVisible.value = true;
      tableContextMenuPosition.value = { x: event.clientX, y: event.clientY };
      console.log('右键选中行索引:', currentRowIndex.value);
    };
	
    const insertCaseBelow = () => {
      tableContextMenuVisible.value = false;
      if (!canCreateCase.value) {
        ElMessage.warning(createCaseTooltip.value);
        return;
      }
      // ✅ 改用ref存储插入位置，避免window变量丢失
      tempInsertIndex.value = currentRowIndex.value + 1;
      console.log('插入位置:', tempInsertIndex.value);
      openDialog(true);
    };

    // 获取当前 project_id（level=4 id）
    const getCurrentProjectId = () => {
      const modules = getCurrentSelectedModules();
      return modules?.level4?.id || null;
    };

    // ✅ 新增参数isInsert，区分普通新建和插入模式
    const openDialog = (isInsert = false) => {
      if (!canCreateCase.value) {
        ElMessage.warning(createCaseTooltip.value);
        return;
      }

      const modules = getCurrentSelectedModules();
      // 仅普通新建时重置插入标记
      if (!isInsert) {
        tempInsertIndex.value = -1;
      }

      isEdit.value = false;
      form.value = {
        case_id: null,
        level3_name: modules.level3?.name || '',
        module: modules.level4?.name || '',
        test_option: '',
        test_procedure: '',
        expect_result: '',
        platform: '',
        priority: null,
        case_order: null
      };
      isDialogVisible.value = true;
    };

    const openEditDialog = (row) => {
      isEdit.value = true;
    
      const projectId = row.project_id || row.module_id;
      const priorityValue = typeof row.priority === 'string'
        ? parseInt(row.priority, 10)
        : row.priority;
    
      form.value = {
        ...row,
        priority: [0,1,2,3].includes(priorityValue) ? priorityValue : null,
        project_id: projectId
      };
    
      isEditDrawerVisible.value = true; // ✅ 打开抽屉
    };
	
	const handleEditSave = async () => {
	  await save();                 // 仍然调用 editCase
	  isEditDrawerVisible.value = false;
	};

    const save = async () => {
      if (!isEdit.value && !canCreateCase.value) {
        ElMessage.warning('请先正确勾选模块');
        return;
      }
    
      const data = new FormData();
      data.append('module', form.value.module || '');
      data.append('test_option', form.value.test_option || '');
      data.append('test_procedure', form.value.test_procedure || '');
      data.append('expect_result', form.value.expect_result || '');
      data.append('platform', form.value.platform || '');
      data.append('priority', form.value.priority ?? '');
      data.append('is_selected', 0);
    
      const projectId = getCurrentProjectId();
    
      if (isEdit.value) {
        data.append('case_id', form.value.case_id);
        // 新增：传递 project_id（优先用表单中的，兜底用当前选中的）
        const editProjectId = form.value.project_id || projectId;
        if (editProjectId) {
          data.append('project_id', editProjectId);
        }
        if (form.value.case_order !== undefined) {
          data.append('case_order', form.value.case_order);
        }
      } else {
        if (!projectId) {
          ElMessage.warning('无法获取模块信息');
          return;
        }
        data.append('project_id', projectId);
        data.append('case_id', '');
    
        let newOrder;
        // ✅ 修复：改用ref的插入标记，动态计算唯一order
        if (tempInsertIndex.value !== -1) {
          const idx = tempInsertIndex.value;
          const targetRow = caseList.value[idx - 1]; // 选中行（插入到这行下方）
          
          if (idx >= caseList.value.length) {
            // 插入到最后：最后一行order+1
            newOrder = (caseList.value[caseList.value.length - 1]?.case_order || 0) + 1;
          } else if (targetRow) {
            // 插入到中间：选中行order+1（保证唯一性）
            newOrder = (targetRow.case_order || 0) + 1;
          } else {
            // 兜底：默认1
            newOrder = 1;
          }
          console.log('插入模式 - 选中行order:', targetRow?.case_order, '新order:', newOrder);
        } else {
          // 普通新建：最后一行order+1
          newOrder = (caseList.value[caseList.value.length - 1]?.case_order || 0) + 1;
        }
        data.append('case_order', newOrder);
        console.log('最终发送case_order:', newOrder);
      }
      try {
          if (isEdit.value) {
            await editCase(data);
            ElMessage.success('编辑成功');
          } else {
            // 仅调用addCase新增，无任何后续更新
            await addCase(data);
            ElMessage.success('新建用例成功');
            tempInsertIndex.value = -1;
          }
          await fetchCases();
          closeDialog();
        } catch (e) {
          console.error('保存失败', e);
          ElMessage.error('保存失败');
        }
      };

    const closeDialog = () => (isDialogVisible.value = false);
    const resetForm = () => {
      // 重置插入标记
      tempInsertIndex.value = -1;
    };

    const openExportDialog = () => (isExportDialogVisible.value = true);
    const closeExportDialog = () => (isExportDialogVisible.value = false);
    const exportCases = () => {
      // 1. 导出 caseList（当前筛选全部结果）
      if (caseList.value.length === 0) {
        ElMessage.warning('当前没有可导出的用例');
        return;
      }
      // 2. 拼接导出数据（按你要求的字段）
      const reportData = caseList.value.map((row, index) => {
        const no = `T${index + 1}`;
    
        const level1 = row.level3_name || '';          // 一级模块
        const level2 = row.module || '';               // 二级模块
        const testOption = row.test_option || '';      // 测试项
        const testProcedure = row.test_procedure || '';// 测试步骤
        const expectResult = row.expect_result || '';  // 预期结果
    
        // 优先级格式化
        const priorityText = (() => {
          const map = { 0: 'P1', 1: 'P2', 2: 'P3', 3: 'P4' };
          const val = Number(row.priority);
          return map[val] || '';
        })();
    
		const testResult = '';        // 测试结果为空
        const remark = '';            // 备注为空
    
        return [
          no,             // 编号
          level1,         // 一级模块
          level2,         // 二级模块
          testOption,     // 测试项
          testProcedure,  // 测试步骤
          expectResult,   // 预期结果
          priorityText,   // 优先级
		  testResult,      //测试结果
          remark          // 备注
        ];
      });
      // 3. 其他元数据
      const report_user = localStorage.getItem('user_name') || '用户';
      const now = new Date();
      const report_time =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} `
        + `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
      const postData = {
        report_user,
        report_title: exportForm.value.report_title || '测试用例导出',
        report_heading: [
          "编号", "一级模块", "二级模块",
          "测试项", "测试步骤", "预期结果",
          "优先级","测试结果", "备注"
        ],
        report_data: reportData,
        report_time,
      };
      // 4. 请求后端并下载 Excel
      createReport(postData)
        .then(response => {
          const contentType = response.headers['content-type'];
    
          // ⛔ 如果返回 JSON，说明后端报错，不能当 Excel 下载
          if (contentType && contentType.includes('application/json')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              console.error('导出失败，服务器返回：', e.target.result);
            };
            reader.readAsText(response.data);
            ElMessage.error('导出失败：服务器返回错误，请查看控制台');
            return;
          }
    
          // 正常 Excel 文件
          const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${exportForm.value.report_title || '测试用例导出'}.xlsx`;
          link.click();
    
          closeExportDialog();
        })
        .catch(err => {
          console.error('导出失败', err);
          ElMessage.error('导出失败');
        });
    };

	
    const handleSelectionChange = (val) => (selectedCases.value = val);

    const handleDeleteCase = (row) => {
      deleteCaseRow.value = row;              // 记录当前要删的那行
      deleteCaseDialogVisible.value = true;   // 打开弹窗
    };
	
	const confirmDeleteCase = async () => {
	  const row = deleteCaseRow.value;
	  if (!row) {
	    deleteCaseDialogVisible.value = false;
	    return;
	  }
	
	  // ✅ 直接从行数据获取所属模块ID
	  const currentProjectId = row.project_id || row.module_id;
	  if (!currentProjectId) {
	    ElMessage.error('无法获取用例所属模块信息');
	    return;
	  }
	
	  if (!row.case_id) {
	    ElMessage.error('用例ID缺失，无法删除');
	    return;
	  }
	
	  const data = new FormData();
	  data.append('case_id', row.case_id);
	  data.append('project_id', currentProjectId);
	  if (row.case_order !== undefined && row.case_order !== null) {
	    data.append('case_order', row.case_order);
	  }
	
	  try {
	    await deleteCase(data);
	    ElMessage.success('删除成功');
	    deleteCaseDialogVisible.value = false;  // 关闭弹窗
	    deleteCaseRow.value = null;             // 清空状态
	    await fetchCases();                     // 刷新列表
	  } catch (e) {
	    console.error('删除失败', e);
	    ElMessage.error('删除失败');
	  }
	};


    // 目录增删改完整实现
    const confirmAddDirectory = async () => {
      if (!addForm.value.directory_name) {
        ElMessage.warning('请输入目录名称');
        return;
      }
    
      let level, parent_id;
      if (pendingAction === 'addChild') {
        // 新增子级：层级+1，父节点为当前节点
        level = currentNode.value.level + 1;
        parent_id = currentNode.value.id;
      } else if (pendingAction === 'addSibling') {
        // 新增同级：层级和当前节点一致，父节点为当前节点的父节点
        level = currentNode.value.level;
        
        // 修复核心：正确获取父节点 ID（兼容 Tree 组件和 Menu 组件的节点结构）
        if (currentNode.value.parent) {
          // Tree 组件的节点：parent 是父节点对象，id 在 parent.id 中
          parent_id = currentNode.value.parent.id || (currentNode.value.parent.data?.id || null);
        } else if (currentNode.value.parent_id) {
          // 兼容 Menu 组件的二级节点（level2），直接取 parent_id
          parent_id = currentNode.value.parent_id;
        } else {
          // 兜底：如果没找到父节点，按原层级的父级逻辑处理（避免创建为 level=1）
          // 针对 level=3 节点，强制找其所属的 level=2 父节点
          if (currentNode.value.level === 3) {
            // 从目录树中反向查找 level=3 节点的父节点（level=2）
            let findParentId = null;
            const findParent = (nodes) => {
              for (const node of nodes) {
                if (node.children?.some(child => child.id === currentNode.value.id)) {
                  findParentId = node.id;
                  return true;
                }
                if (node.children?.length && findParent(node.children)) {
                  return true;
                }
              }
              return false;
            };
            // 遍历一级节点的子节点（level2）
            directoryTree.value.forEach(level1 => {
              if (level1.children && findParent(level1.children)) return;
            });
            parent_id = findParentId;
          } else {
            parent_id = null;
          }
        }
      }
    
      try {
        // 确保参数正确传递：层级、名称、父节点ID、排序权重
        const res = await createDirectory(
          level, 
          addForm.value.directory_name, 
          parent_id, 
          addForm.value.module_sort  // 排序权重
        );
        if (res.data === 1) {
          ElMessage.success('新增成功');
          addDialogVisible.value = false;
          await loadDirectory(); // 重新加载目录树（触发排序）
          await nextTick();
          fetchCases();
        } else {
          ElMessage.error('新增失败');
        }
      } catch (e) {
        console.error('新增目录失败：', e);
        ElMessage.error('新增失败，请检查层级参数');
      } finally {
        resetAddForm();
      }
    };

    const confirmEditDirectory = async () => {
      if (!editForm.value.module_name) {
        ElMessage.warning('请输入目录名称');
        return;
      }
      try {
        const res = await updateDirectory(editForm.value.module_id, editForm.value.module_name, editForm.value.module_sort);
        if (res.data === 1) {
          ElMessage.success('编辑成功');
          editDialogVisible.value = false;
          await loadDirectory();
          await nextTick();
          fetchCases();
        } else {
          ElMessage.error('编辑失败');
        }
      } catch (e) {
        ElMessage.error('编辑失败');
      } finally {
        resetEditForm();
      }
    };

    const confirmDeleteDirectory = async () => {
      try {
        const res = await deleteDirectory(currentNode.value.id);
        if (res.data === 1) {
          ElMessage.success('删除成功');
          await loadDirectory();
          await nextTick();
          fetchCases();
        } else {
          ElMessage.error('删除失败');
        }
      } catch (e) {
        ElMessage.error('删除失败');
      } finally {
        deleteDialogVisible.value = false;
      }
    };

    const resetAddForm = () => {
      addForm.value = { directory_name: '', module_sort: 1 };
      pendingAction = null;
    };

    const resetEditForm = () => {
      editForm.value = { module_id: null, module_name: '', module_sort: 1 };
    };

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
      window.addEventListener('resize', handleResize);
      window.addEventListener('click', closeAllContextMenus);
      await loadDirectory();
      handleModuleCheck();
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', closeAllContextMenus);
    });

    return {
      directoryTree,
      defaultOpened,
      setTreeRef,
	  handleTreeCheck,
      handleModuleCheck,
      caseList,
      selectedCases,
      filters,
      form,
      exportForm,
      isDialogVisible,
      isExportDialogVisible,
      isEdit,
      formatPriority,
      handleSearch,
      openDialog,
      openEditDialog,
	  isEditDrawerVisible,
	  handleEditSave,
	  applyPriorityFilter,
      save,
      closeDialog,
      resetForm,
      openExportDialog,
      closeExportDialog,
      exportCases,
	  pagedCaseList,
	  currentPage,
	  pageSize,
	  total,
	  totalPages,
      handleSelectionChange,
      handleDeleteCase,
      canCreateCase,
      createCaseTooltip,
	  handlePageChange,
	  handleSizeChange,
	  deleteCaseDialogVisible,
	  deleteCaseRow,
	  confirmDeleteCase,

      // 目录右键
      contextMenuVisible,
      contextMenuPosition,
      contextMenuItems,
      openContextMenu,
      onNodeContextMenu,
      handleContextMenuAction,

      // 表格右键
      tableContextMenuVisible,
      tableContextMenuPosition,
      openTableContextMenu,
      insertCaseBelow,

      // 目录操作
      addDialogVisible,
      addForm,
      confirmAddDirectory,
      resetAddForm,
      editDialogVisible,
      editForm,
      confirmEditDirectory,
      resetEditForm,
      deleteDialogVisible,
      confirmDeleteDirectory,
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
.export-use-cases { width: 7vw; height: 4vh; font-size: 0.92rem; margin-left: 0.6vw; }
.el-button-img { width: 1vw; height: 1.8vh; margin-right: 0.5vw; }
.module-tree-wrapper { padding: 0.74vh 1.04vw; background: #fff; min-height: 4.63vh; }

.sidebar {
  background-color: #f4f5f4;
  padding: 5px;
}

.context-menu {
  position: fixed; background: white; border: 1px solid #e4e7ed; border-radius: 0.21vw;
  box-shadow: 0 0.19vh 1.11vh rgba(0,0,0,0.1); z-index: 3000; padding: 0.46vh 0; font-size: 0.73vw;
}
.context-menu-item { padding: 0.74vh 0.83vw; cursor: pointer; }
.context-menu-item:hover { background: #f5f7fa; }

.el-menu-vertical { border-right: none; }

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
.pagination-info {
  color: #606266;
}

:deep(.el-table__body td) {
  padding-top: 6px;
  padding-bottom: 6px;
}

:deep(.el-table__body td .cell) {
  height: 44px;
  line-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
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

.priority-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1;
}

/* P1：红底白字 */
.priority-P1 {
  background-color: #e74c3c;
  color: #ffffff;
}

/* P2：淡蓝底蓝字 */
.priority-P2 {
  background-color: #e3f2fd;
  color: #1976d2;
}

/* P3：淡绿底绿字 */
.priority-P3 {
  background-color: #e8f5e9;
  color: #2e7d32;
}

/* P4：淡灰底灰字（你描述里写成“P1淡灰”，这里按常识改成 P4） */
.priority-P4 {
  background-color: #f5f5f5;
  color: #757575;
}

:deep(.beauty-drawer) {
  padding: 0 !important;
}

/* 顶部标题区域 */
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

.title-text {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.title-tag {
  border-radius: 10px;
}

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

/* 内容区 */
.drawer-body {
  height: calc(100vh - 130px);
  overflow-y: auto;
  padding: 16px 20px;
  background: #f6f7fb;
}

/* 卡片效果 */
.drawer-card {
  background: #ffffff;
  border-radius: 14px;
  padding: 18px 18px 10px;
  margin-bottom: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
  color: #303133;
}

/* textarea 美化 */
.beauty-textarea :deep(textarea) {
  border-radius: 10px;
  background: #f9fafb;
}

/* 底部按钮固定 */
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

</style>