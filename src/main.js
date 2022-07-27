import {createApp} from "vue";
import App from './App.vue'
import {router} from "./router";
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from "axios";
import VueAxios from "vue-axios";
import {global} from "./global"

const app = createApp(App)
app.use(VueAxios,axios)
app.use(router)
app.use(ElementPlus)
app.mount('#app')

const url = 'https://api.bj-jiuqi.com/armApi/'

app.config.globalProperties.$http = async (param) => {
    let res = await axios({
        url:url+param.url,
        method:param.method,
        data:param.data
    })
    return res.data
}

app.config.globalProperties.$load = async (mid) => {
    global.mid = mid
    let res = await axios({
        url:url+'meetingAuth',
        method:'post',
        data:new URLSearchParams({id:global.mid})
    })
    global.token = res.data.data
    //get meeting info
     res = await axios({
        url:url+'meetingDPQM',
        method:'post',
        data:new URLSearchParams({id:global.mid,token:global.token})
    })

    global.did = res.data.data[0].did
    global.ws = 'wss://'+res.data.data[0].url+'/'+global.mid+'/web'
    //get board info
    res = await axios({
        url:url+'deviceDPQM',
        method:'post',
        data:new URLSearchParams({id:global.did,token:global.token})
    })

    global.boardInfo = res.data.data[0]
    //get audioVideo play url
    res = await axios({
        url:url+'play',
        method:'post',
        data:new URLSearchParams({id:global.mid,token:global.token})
    })
    global.playUrl = res.data.data

}

app.config.globalProperties.$hexStrToDEC =function(hex){
    var len = hex.length, a = new Array(len), code;
    for (var i = 0; i < len; i++) {
        code = hex.charCodeAt(i);
        if (48<=code && code < 58) {
            code -= 48;
        } else {
            code = (code & 0xdf) - 65 + 10;
        }
        a[i] = code;
    }

    return a.reduce(function(acc, c) {
        acc = 16 * acc + c;
        return acc;
    }, 0);
}