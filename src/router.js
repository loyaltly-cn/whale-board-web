import {createRouter, createWebHashHistory, createWebHistory} from "vue-router"

const index = () => import('./components/Index.vue')
const live = () => import('./components/Live.vue')
const routes =[
    {
        path:'/',
        redirect:'/index'
    },
    {
        path: '/index',
        component:index
    },
    {
        path: '/live',
        component:live
    }
]

export const router = createRouter({
    history:createWebHashHistory('/meeting/'),
    routes:routes
})