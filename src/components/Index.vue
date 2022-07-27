<template>
  <div class="main">
    <div>
      <img src="https://smartscreen-static.oss-cn-shanghai.aliyuncs.com/img/logo.png" alt="logo" height="80" width="80">
    </div>
    <div class="index-body">
<!--      <el-input  v-model="code" :autofocus="true" :clearable="true" type="text" :maxlength="6"  placeholder="请输入临时会议号" />-->
      <input class="inputCode"  onkeyup="value=value.replace(/[^\d]/g,'') "
             @input="updateInput"  v-model="code" autofocus="autofocus" maxlength="6" placeholder="请输入临时会议号"  type="text">
      <el-icon v-show="iconShow" class="icon" @click="param"  :size="30"><right /></el-icon>
    </div>
  </div>
</template>

<script>

import {Right} from "@element-plus/icons-vue";
import {ElMessage} from "element-plus";
import {global} from "../global"
export default {
  name: "Index",
  data(){
    return{
      code:'',
      iconShow:false
    }
  },
  components:{
    Right
  },
  methods:{
    async param() {
      if (this.code.length !==6){
        ElMessage({
          message:'请输入正确的会议号',
          type:'error',
          center:true
        })
      }else {
        let res = await this.$http({
          url:'parseCode',
          method:'post',
          data:new URLSearchParams({code:this.code})
        })
        if (res.code){
          global.mid = res.data
          await this.$router.push({
            path:'/live',
            query:{
              mid:global.mid
            }
          })
        }else {
          ElMessage({
            message:'会议号错误或过期',
            type:'error',
            center:true
          })
        }
      }
    },
    updateInput(){
      this.iconShow = this.code.length === 6;
    }
  }

}
</script>

<style scoped>
  body{
    background: #ffffff;
  }
  .main{
    margin-left: 45%;
    margin-top: 20%;
    line-height: 5;
  }
  .index-body{
    display: flex;
    width: 25%;
    /*box-shadow: 10px 10px 5px #888888;*/
  }
  input.inputCode{
    border: #ffffff;
    background: #faf9f9;
    outline:none;
    text-align: center;
    color: #000000;
    border-bottom: 1px solid #79bbff;

  }
  .icon{
    /*box-shadow: 10px 10px 5px #888888;*/
  }
  img{
    margin-left: 3%;
  }
</style>