<template>
    <el-row :gutter="20">
        <el-col :span="8" v-for="chamber in chambers" :key="chamber.id">
            <el-card @click.native="goDetail(chamber.id)" style="cursor:pointer">
                <div class="chamber-header">
                    <span class="chamberName">{{ chamber.name }}</span>
                    <el-tag
                        :type="chamber.status === 'idle' ? 'info' : (chamber.status === 'available' ? 'success' : 'danger')">
                        {{ chamber.status === 'idle' ? '空闲' : (chamber.status === 'available' ? '可使用' :
                            '已满') }}
                    </el-tag>
                </div>
                <p>当前任务数：{{ chamber.task_count }}</p>
                <div v-if="chamber.tasks.length" class="task-list">
                    <p><strong>进行中的任务：</strong></p>
                    <ul>
                        <li v-for="(task, index) in chamber.tasks" :key="task.project_name">
                             {{ index + 1 }}. {{ task.owner }}--{{ task.project_name }} 进度：{{ task.progress }}%
                        </li>
                    </ul>
                </div>
                <div v-else class="task-list">暂无进行中的任务</div>
            </el-card>
        </el-col>
    </el-row>
</template>

<script>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
    setup() {
        const chambers = ref([])
        const router = useRouter()
        const fetchData = async () => {
            const res = await axios.get('/api/public/chambers')
            chambers.value = res.data
        }
        const goDetail = (id) => {
            router.push(`/public/chamber/${id}`)
        }
        onMounted(fetchData)
        return { chambers, goDetail }
    }
}
</script>

<style scoped>
:deep(.el-card__body){
    padding: 8px 10px;
}
.chamber-header {
    display: flex;
    justify-content: space-between;
    height: 36px;
    align-items: center;
}
.chamber-header .chamberName{
    font-weight: bold;
    font-size: 18px;
    }
.task-list {
    margin-top: 10px;
}
.task-list li{
    padding: 4px 0;
}
</style>