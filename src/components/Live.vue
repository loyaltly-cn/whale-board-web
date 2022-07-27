<template>
  <div v-loading="bodyLoad" element-loading-text="正在缓冲">
    <div v-if="play" class="play">
      <el-icon @click="playfun" :size="100"><video-play /></el-icon>
    </div>
    <div class="flvStop" v-show="flvStop" >
      <p class="text">{{errorText}}</p>
      <el-icon @click="refresh" :size="100"><refresh-right /></el-icon>
    </div>
    <div class="main" v-show="!play" v-loading="loading"  element-loading-text="连接中断正在尝试重新连接">
      <div>
        <canvas class="SmartScreen" id="SmartScreen"></canvas>
      </div>
      <div v-show="false" class="player" id="player-con"></div>
    </div>
  </div>

</template>

<script>

import {global} from "../global";
import {liveFifo, playBackFifo} from "../FIFO";
import {VideoPlay,RefreshRight} from "@element-plus/icons-vue";
let player = null
let live = new liveFifo()
let playBack = new playBackFifo()
let lastPoint = 0
export default {
  name: "Live",
  components: {VideoPlay,RefreshRight},
  data(){
    return{
      ctx:null,
      nowPenColor:null,
      canvas:null,
      flag:false,
      xRatio:null,
      yRatio:null,
      timer:null,
      playTimer:null,
      lastPointTimeStamp:null,
      play:true,
      flvStop:false,
      loading:false,
      bodyLoad:false,
      errorText:'缓冲失败'
    }
  },
  async beforeCreate() {
    this.bodyLoad = true
    console.log('beforeCreate')
    await this.$load(this.$route.query.mid)
    this.canvas = document.querySelector('#SmartScreen')
    this.ctx = this.canvas.getContext('2d')
    this.timer = new Date().setHours(0, 0, 0, 0)
    this.setPenStyle()
    this.updateCanvas()
    this.startOnWindow()
    this.webSocket()
    this.loadLive()
    this.loadSync()
    this.loadPlay()
  },
  created() {
    console.log('created')
  },
  beforeMount() {
    console.log('beforeMount')
  },
  mounted() {
    console.log('mounted')
    // this.load = true
  },
  beforeUpdate() {
    console.log('beforeUpdate')
  },
  updated() {
    console.log('updated')
  },
  beforeDestroy() {
    console.log('beforeDestroy')
  },
  methods:{
    webSocket(){
      let ws = new WebSocket(global.ws)
      ws.onmessage = res =>{
        let reader = new FileReader()
        let that = this
        reader.onload = function (){
          let data = Array.prototype.map.call(new Uint8Array(this.result), x => ('00' + x.toString(16)).slice(-2)).join('')
          that.dataConvert(data)
        }
        reader.readAsArrayBuffer(res.data)
      }
    },
    dataConvert(data){
      if(data.length>10){
        let x = this.$hexStrToDEC(data.slice(2,6))
        let y = this.$hexStrToDEC(data.slice(6,10))
        let timeStamp = this.$hexStrToDEC(data.slice(10))
        // console.log('arm:'+timeStamp)
        let type = this.$hexStrToDEC(data.slice(0,2))
        x/=this.xRatio
        y/=this.yRatio
        this.setFifo({
          "type":type,
          "X":x,
          "Y":y,
          "timeStamp":timeStamp
        })
      }else{
        let type = this.$hexStrToDEC(data.slice(0,2))
        let timeStamp = this.$hexStrToDEC(data.slice(2))
        this.setFifo({
          "type":type,
          "timeStamp":timeStamp
        })
      }
    },
    setFifo(obj){
      if(obj.type&64){//0100 0000 是否是最后一位数据
        obj.type&=15 // 0000 1111
        playBack.set(obj)
      }

      if(this.typeJudge(obj.type)){
        obj.type&=15 // 0000 1111
        live.set(obj)
      }else{
        obj.type&=15 // 0000 1111
        if(obj.type === 7){//清除缓存
          playBack.clear()
        }
        playBack.set(obj)
      }
    },
    typeJudge(type){//xxxx xxxx
      if(type>>5){
        return 0
      }
      return 1
    },
    dataHandler(data){
      // console.log(data)
      switch(data.type){
        case 0://按下
          this.ctx.beginPath();
          lastPoint = 0;
          break;
        case 1://抬起
          lastPoint = [];
          break;
        case 2://广播

          break;
        case 3://黑笔
          this.setPenColor('#000000')
          break;
        case 4://蓝笔
          this.setPenColor('#00aaff')
          break;
        case 5://红笔
          this.setPenColor('#ff0000')
          break;
        case 6://快照

          break;
        case 7://清屏
          this.clearCanvas()
          break;
        case 8://笔的轨迹
          this.draw(data)
          break;
        case 9://手指的轨迹

          break;
        case 10://板擦的轨迹
          this.setPenColor('#ffffff')
          this.ctx.arc(data.X, data.Y, 20, 0, 2*Math.PI)
          this.ctx.fill();
          this.draw(data)
          break;
        case 11://会议开始

          break;
        case 12://会议结束
          // console.log('会议结束')

          break;
        default:
          //其他情况
          break
      }
    },
    draw(data){
      if(lastPoint !== 0){
        this.ctx.moveTo(lastPoint.X, lastPoint.Y)
        this.ctx.lineTo(data.X, data.Y)
        this.ctx.stroke()
      }
      lastPoint = data;
    },
    clearCanvas(){
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.stroke()
    },
    startOnWindow(){
      window.onresize = () => {
       this.updateCanvas()
      }
    },
    updateCanvas() {
      let windowHeight = document.documentElement.clientHeight - 20
      let windowWidth = document.documentElement.clientWidth - 20
      let windowProportion = windowWidth / windowHeight
      let boardProportion = global.boardInfo.physWidth / global.boardInfo.physHeight
      // console.log(windowProportion+''+boardProportion)
      if (windowProportion > boardProportion){
        this.canvas.height = windowHeight
        this.canvas.width = windowHeight*boardProportion
      }else {
        this.canvas.width = windowWidth
        this.canvas.height = windowWidth/boardProportion
      }
      this.xRatio = global.boardInfo.maximumX/this.canvas.width
      this.yRatio = global.boardInfo.maximumY/this.canvas.height
    },
    setPenStyle() {
      this.ctx.lineWidth = 0.5
      this.ctx.lineCap = 'round'
      this.ctx.lineJoin = 'round'
      this.setPenColor('#000000')
    },
    setPenColor(color){
      if(color!==this.nowPenColor&&this.ctx.fillStyle!=='#ffffff'){
        this.ctx.fillStyle = color
        this.ctx.strokeStyle = color
        if (color!=='#ffffff'){
          this.nowPenColor = color
        }
      }
    },
    loadLive(){
     setInterval(()=>{
        if(this.flag&&live.len()){
         for(let i = 0; i < live.len(); i++){
            let data = live.get()
            let tmp = new Date().getTime() - this.timer
            if(tmp >= data.timeStamp+1000){//延迟时间设置 作递归处理
              data = live.reget()
              this.lastPointTimeStamp = data.timeStamp
              this.dataHandler(data)
            }
            break
          }
        }
      },10);
    },
    loadSync(){
      setInterval(()=>{
        if (live.get()){
          // console.log('liveTimeStamp:'+live.get().timeStamp+' playTimeStamp:'+this.playTimer)
          let difference = live.get().timeStamp - this.playTimer
          // console.log(difference)
          if (difference > 10000){
            this.flag = false
          }
          if (difference <0||isNaN(difference)){
            this.flag = true
          }
        }
      },1000)
    },
    loadPlay(){
      let that = this
      player = new Aliplayer({
        "id": "player-con",
        "source": global.playUrl,
        "width": "20%",
        "height": "25%",
        "autoplay": true,
        "isLive": true,
        "rePlay": false,
        "preload": true,
        "controlBarVisibility": "never",
        "useH5Prism": true
      }
    );
      let sei = function(e){
        let list = e.paramData
        console.log(list)
        let timeStamp = ''
        for (let i=3;i<list.length-2;i++){
          timeStamp+=list[i]-48
        }
        // console.log(timeStamp)0
        that.playTimer = timeStamp - that.timer
      }
      let liveStreamStop = function (e){
        console.log('liveStreamStop')
        if (this.play){
          that.bodyLoad = false
          that.play = false
          that.loading = false
          that.flvStop =  true
        }else{
          that.loading = false
          that.errorText = '与服务器重连失败'
          that.flvStop =  true
        }
      }
      let ready = function (e){
        console.log('ready')
        this.bodyLoad = false
        let cache = playBack.getAll()
        cache.forEach(function(data){
          that.dataHandler(data)
        })
        that.flag = true
      }
      let waiting = function (e){
        that.flag = false
      }
      let canplay = function (e){
        that.loading = false
        that.flge = true
      }
      let play = function (e){
        // console.log('暂停恢复播放')
      }
      let onM3u8Retry = function (e){
        console.log('重连')
        that.loading = true
      }
      player.on('ready',ready)
      player.on('seiFrame',sei);
      player.on('liveStreamStop',liveStreamStop)
      player.on('waiting',waiting)
      player.on('canplay',canplay)
      player.on('play',play)
      player.on('onM3u8Retry',onM3u8Retry)
    },
    playfun(){
      player.play()
      this.play = false
    },
    refresh(){
      location.reload()
      this.flvStop = false
    }
  }
}
</script>

<style scoped>
  body{
    background: #60605f;
    text-align: center;
  }
  .SmartScreen{
    background: white;
    margin-left: 7%;
    box-shadow: 10px 10px 5px #888888;
  }
  .main{
    /*display: flex;*/
  }
  .player{
    position: absolute;
    right: 30px;
  }
  .play{
    /*position: absolute;*/
    margin-left: 47%;
    margin-top: 20%;
  }
  .flvStop{
    position: absolute;
    margin-left: 47%;
    margin-top: 20%;
  }
  p.text{
    color: #b2b2ac;
    font-style: oblique;
    font-weight: bold;
  }
</style>