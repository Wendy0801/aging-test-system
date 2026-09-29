<template>
  <Header />
  <div>
    <div class="firstDiv">
      <div class="firstLeftDiv">
        <!-- 新建按钮 -->
        <el-button type="primary" style="width: 9.6vw; height: 4vh; font-size: 17px;" @click="handleAdd" >
          <img src="/src/assets/add2.png" style="width: 1vw; height: 1.8vh; margin-right: 0.5vw; margin-left: 0.5vw;" />
          新建产品电子标签
        </el-button>
      </div>
      <!-- 产品系列筛选 -->
      <div>
        <el-input
          v-model="seriesFilter"
          placeholder="请输入产品系列"
          style="width: 15vw;"
          @input="filterTableData"
        />
      </div>
    </div>
    <div class="container">
      <el-table :data="filteredTableData" border style="width: 100%" height="840">
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="series" label="产品系列" />
        <el-table-column prop="identify_model" label="识别型号" />
        <el-table-column prop="light_type" label="光源及类型" width="200"/>
        <el-table-column prop="product_model" label="产品型号" />
        <el-table-column prop="button_count" label="按键数量" />
        <el-table-column prop="rotation_angle" label="sensor旋转角度" />
        <el-table-column prop="limit_use_time" label="限制使用时长" />
        <el-table-column prop="inter_outer_length" label="内外径" />
        <el-table-column prop="viewing_angle" label="切角" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" size="mini" @click="handleEdit(row)" plain>编辑</el-button>
            <el-button type="danger" size="mini" @click="handleDelete(row)" plain>删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 新增弹窗 -->
      <el-dialog title="新增产品电子标签" v-model="addDialogVisible" width="30%">
        <el-form :model="addForm" label-width="130px">
          <el-form-item label="产品系列" required>
            <el-input v-model="addForm.series" />
          </el-form-item>
          <el-form-item label="识别型号" required>
            <el-input v-model="addForm.identify_model" />
          </el-form-item>
          <el-form-item label="光源及类型" required>
            <el-input v-model="addForm.light_type" />
          </el-form-item>
          <el-form-item label="产品型号" required>
            <el-input v-model="addForm.product_model" />
          </el-form-item>
          <el-form-item label="按键数量" required>
            <el-input v-model="addForm.button_count" type="number" />
          </el-form-item>
          <el-form-item label="sensor旋转角度" required>
            <el-input v-model="addForm.rotation_angle" type="number" />
          </el-form-item>
          <el-form-item label="限制使用时长" required>
            <el-input v-model="addForm.limit_use_time" type="number" />
          </el-form-item>
          <el-form-item label="内外径" required>
            <el-input v-model="addForm.inter_outer_length" />
          </el-form-item>
          <el-form-item label="切角" required>
            <el-input v-model="addForm.viewing_angle" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAddSave">保存</el-button>
        </template>
      </el-dialog>

      <!-- 编辑弹窗 -->
      <el-dialog title="编辑产品电子标签" v-model="dialogVisible" width="30%">
        <el-form :model="editForm" label-width="130px">
          <el-form-item label="光源及类型" required>
            <el-input v-model="editForm.light_type" />
          </el-form-item>
          <el-form-item label="产品型号" required>
            <el-input v-model="editForm.product_model" />
          </el-form-item>
          <el-form-item label="按键数量" required>
            <el-input v-model="editForm.button_count" type="number" />
          </el-form-item>
          <el-form-item label="sensor旋转角度" required>
            <el-input v-model="editForm.rotation_angle" type="number" />
          </el-form-item>
          <el-form-item label="限制使用时长" required>
            <el-input v-model="editForm.limit_use_time" type="number" />
          </el-form-item>
          <el-form-item label="内外径" required>
            <el-input v-model="editForm.inter_outer_length" />
          </el-form-item>
          <el-form-item label="切角" required>
            <el-input v-model="editForm.viewing_angle" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </template>
      </el-dialog>

      <!-- 密码验证弹窗 -->
      <el-dialog title="有密码保护" v-model="passwordDialogVisible" width="30%">
        <el-form :model="passwordForm" label-width="100px">
          <el-form-item label="请输入密码" required>
            <el-input v-model="passwordForm.password" type="password" placeholder="请输入密码" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="verifyPassword">验证</el-button>
        </template>
      </el-dialog>

      <!-- 删除确认弹窗 -->
      <el-dialog title="删除确认" v-model="deleteConfirmVisible" width="30%">
        <span>确定要删除此项产品电子标签吗？（注意删除后不可恢复，请慎重！）</span>
        <template #footer>
          <el-button @click="deleteConfirmVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确认删除</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import Header from '../components/common/Header.vue';
import { productSettingFile, updateProductSettingFile } from '../api.js';
import { ElMessage } from 'element-plus';

// 表格数据
const tableData = ref([]);
// 筛选产品系列
const seriesFilter = ref('');
// 过滤后的表格数据
const filteredTableData = computed(() => {
  if (!seriesFilter.value) {
    return tableData.value;
  }
  return tableData.value.filter((item) =>
    item.series.toLowerCase().includes(seriesFilter.value.toLowerCase())
  );
});
// 弹窗显示状态
const dialogVisible = ref(false);
const addDialogVisible = ref(false);
const passwordDialogVisible = ref(false);
const deleteConfirmVisible = ref(false);
// 编辑表单数据
const editForm = ref({
  series: '',
  identify_model: '',
  light_type: '',
  product_model: '',
  button_count: '',
  rotation_angle: '',
  limit_use_time: '',
  inter_outer_length: '',
  viewing_angle: ''
});
// 新增表单数据
const addForm = ref({
  series: '',
  identify_model: '',
  light_type: '',
  product_model: '',
  button_count: '',
  rotation_angle: '',
  limit_use_time: '',
  inter_outer_length: '',
  viewing_angle: ''
});
// 密码表单数据
const passwordForm = ref({
  password: ''
});
// 当前编辑/删除的行索引
const currentEditIndex = ref(null);
const currentDeleteRow = ref(null);

// 获取产品设置数据
const fetchProductSettings = async () => {
  try {
    console.log('Fetching product settings...');
    const formData = new FormData();
    const response = await productSettingFile(formData);
    const data = response.data;

    // 格式化接口数据为表格所需格式
    const formattedData = [];
    for (const series in data) {
      const keys = Object.keys(data[series]).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      );
      for (const key of keys) {
        const item = data[series][key];
        formattedData.push({
          series: series,
          button_count: item.button_count,
          identify_model: item.identify_model,
          inter_outer_length: item['inter-outer_length'],
          light_type: item.light_type,
          limit_use_time: item.limit_use_time,
          product_model: item.product_model,
          rotation_angle: item.rotation_angle,
          viewing_angle: item.viewing_angle,
        });
      }
    }
    tableData.value = formattedData;
  } catch (error) {
    ElMessage.error('获取产品设置数据失败: ' + error.message);
    console.error('Error fetching product settings:', error);
  }
};

// 筛选表格数据
const filterTableData = () => {
  // computed 属性会自动更新 filteredTableData
};

// 点击新增按钮
const handleAdd = () => {
  addForm.value = {
    series: '',
    identify_model: '',
    light_type: '',
    product_model: '',
    button_count: '',
    rotation_angle: '',
    limit_use_time: '',
    inter_outer_length: '',
    viewing_angle: ''
  };
  addDialogVisible.value = true;
};

// 保存新增
const handleAddSave = async () => {
  const requiredFields = [
    'series',
    'identify_model',
    'light_type',
    'product_model',
    'button_count',
    'rotation_angle',
    'limit_use_time',
    'inter_outer_length',
    'viewing_angle'
  ];
  for (const field of requiredFields) {
    if (!addForm.value[field]) {
      ElMessage.error(`${field} 为必填项`);
      return;
    }
  }

  // 检查识别型号是否重复
  const isDuplicate = tableData.value.some(
    (item) => item.identify_model === addForm.value.identify_model
  );
  if (isDuplicate) {
    ElMessage.error('识别型号不能重复');
    return;
  }

  // 添加到表格数据
  tableData.value.push({ ...addForm.value });

  // 格式化数据为接口所需格式
  const formattedData = {};
  tableData.value.forEach((item) => {
    if (!formattedData[item.series]) {
      formattedData[item.series] = {};
    }
    formattedData[item.series][item.identify_model] = {
      button_count: item.button_count,
      identify_model: item.identify_model,
      'inter-outer_length': item.inter_outer_length,
      light_type: item.light_type,
      limit_use_time: item.limit_use_time,
      product_model: item.product_model,
      rotation_angle: item.rotation_angle,
      viewing_angle: item.viewing_angle
    };
  });

  // 检查 formattedData 是否为空
  if (Object.keys(formattedData).length === 0) {
    ElMessage.warning('数据为空，请联系管理员');
    addDialogVisible.value = false;
    return;
  }

  // 将数据转换为 FormData
  const formData = new FormData();
  formData.append('update_data', JSON.stringify(formattedData));

  try {
    const response = await updateProductSettingFile(formData);
    if (response.data === 1) {
      ElMessage.success('新增产品设置成功');
      addDialogVisible.value = false;
      await fetchProductSettings(); // 重新获取数据以确保同步
    } else {
      ElMessage.error('新增产品设置失败');
    }
  } catch (error) {
    ElMessage.error('新增产品设置失败: ' + error.message);
    console.error('Error adding product settings:', error);
  }
};

// 点击编辑按钮
const handleEdit = (row) => {
  editForm.value = { ...row };
  currentEditIndex.value = tableData.value.findIndex(
    (item) => item.identify_model === row.identify_model
  );
  dialogVisible.value = true;
};

// 点击删除按钮
const handleDelete = (row) => {
  currentDeleteRow.value = row;
  passwordDialogVisible.value = true;
};

// 验证密码
const verifyPassword = () => {
  if (passwordForm.value.password === 'seesheen') {
    passwordDialogVisible.value = false;
    passwordForm.value.password = ''; // 清空密码
    deleteConfirmVisible.value = true; // 打开删除确认弹窗
  } else {
    ElMessage.error('密码错误，请输入正确的密码！');
  }
};

// 确认删除
const confirmDelete = async () => {
  tableData.value = tableData.value.filter(
    (item) => item.identify_model !== currentDeleteRow.value.identify_model
  );

  const formattedData = {};
  tableData.value.forEach((item) => {
    if (!formattedData[item.series]) {
      formattedData[item.series] = {};
    }
    formattedData[item.series][item.identify_model] = {
      button_count: item.button_count,
      identify_model: item.identify_model,
      'inter-outer_length': item.inter_outer_length,
      light_type: item.light_type,
      limit_use_time: item.limit_use_time,
      product_model: item.product_model,
      rotation_angle: item.rotation_angle,
      viewing_angle: item.viewing_angle
    };
  });

  // 检查 formattedData 是否为空
  if (Object.keys(formattedData).length === 0) {
    ElMessage.warning('数据为空，请联系管理员');
    deleteConfirmVisible.value = false;
    await fetchProductSettings(); // 重新获取数据以确保同步
    return;
  }

  const formData = new FormData();
  formData.append('update_data', JSON.stringify(formattedData));

  try {
    const response = await updateProductSettingFile(formData);
    if (response.data === 1) {
      ElMessage.success('删除产品设置成功');
      deleteConfirmVisible.value = false;
      await fetchProductSettings();
    } else {
      ElMessage.error('删除产品设置失败');
    }
  } catch (error) {
    ElMessage.error('删除产品设置失败: ' + error.message);
    console.error('Error deleting product settings:', error);
  }
};

// 保存编辑
const handleSave = async () => {
  const requiredFields = [
    'light_type',
    'product_model',
    'button_count',
    'rotation_angle',
    'limit_use_time',
    'inter_outer_length',
    'viewing_angle'
  ];
  for (const field of requiredFields) {
    if (!editForm.value[field]) {
      ElMessage.error(`${field} 为必填项`);
      return;
    }
  }

  if (currentEditIndex.value !== null) {
    tableData.value[currentEditIndex.value] = { ...editForm.value };
  }

  const formattedData = {};
  tableData.value.forEach((item) => {
    if (!formattedData[item.series]) {
      formattedData[item.series] = {};
    }
    formattedData[item.series][item.identify_model] = {
      button_count: item.button_count,
      identify_model: item.identify_model,
      'inter-outer_length': item.inter_outer_length,
      light_type: item.light_type,
      limit_use_time: item.limit_use_time,
      product_model: item.product_model,
      rotation_angle: item.rotation_angle,
      viewing_angle: item.viewing_angle
    };
  });

  // 检查 formattedData 是否为空
  if (Object.keys(formattedData).length === 0) {
    ElMessage.warning('数据为空，请联系管理员');
    dialogVisible.value = false;
    return;
  }

  const formData = new FormData();
  formData.append('update_data', JSON.stringify(formattedData));

  try {
    const response = await updateProductSettingFile(formData);
    if (response.data === 1) {
      ElMessage.success('更新产品设置成功');
      dialogVisible.value = false;
      await fetchProductSettings();
    } else {
      ElMessage.error('更新产品设置失败');
    }
  } catch (error) {
    ElMessage.error('更新产品设置失败: ' + error.message);
    console.error('Error updating product settings:', error);
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchProductSettings();
});
</script>



<style scoped>
.firstDiv {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2vh;
  padding: 0 20px;
}

.firstLeftDiv {
  display: flex;
  gap: 1vw;
}

.container {
  padding: 20px;
}

:deep(.el-table__header th) {
  background-color: #e3eff7; /* 设置table背景颜色 */
}

:deep(.el-table tr) {
  background-color: #f7f7f7;
}
</style>

