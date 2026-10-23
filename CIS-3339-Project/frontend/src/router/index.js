import { createRouter, createWebHistory } from 'vue-router'
import { useLoggedInUserStore } from '../store/loggedInUser'

// requiresAuth   -> must be logged in
// requiresEditor -> must be logged in AND have role 'editor' (F4)
const routes = [
  {
    path: '/',
    name: 'home',
    // dashboard data is organization data, so it needs a login once the backend enforces S1
    meta: { requiresAuth: true },
    component: () => import('../views/home.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/login.vue')
  },
  {
    path: '/clientform',
    name: 'clientform',
    meta: { requiresAuth: true, requiresEditor: true },
    component: () => import('../views/clientform.vue')
  },
  {
    path: '/findclient',
    name: 'findclient',
    meta: { requiresAuth: true },
    component: () => import('../views/findclient.vue')
  },
  {
    path: '/clientdetails/:id',
    name: 'clientdetails',
    meta: { requiresAuth: true },
    component: () => import('../views/clientdetails.vue')
  },
  {
    path: '/eventform',
    name: 'eventform',
    meta: { requiresAuth: true, requiresEditor: true },
    component: () => import('../views/eventform.vue')
  },
  {
    path: '/findevents',
    name: 'findevents',
    meta: { requiresAuth: true },
    component: () => import('../views/findevents.vue')
  },
  {
    path: '/eventdetails/:id',
    name: 'eventdetails',
    meta: { requiresAuth: true },
    // file is eventDetails.vue (capital D). The old lowercase import only worked on Windows.
    component: () => import('../views/eventDetails.vue')
  },
  {
    path: '/serviceform',
    name: 'serviceform',
    meta: { requiresAuth: true, requiresEditor: true },
    component: () => import('../views/serviceform.vue')
  },
  {
    path: '/findservice',
    name: 'findservice',
    meta: { requiresAuth: true },
    component: () => import('../views/findservice.vue')
  },
  {
    path: '/servicedetails/:id',
    name: 'servicedetails',
    meta: { requiresAuth: true },
    component: () => import('../views/servicedetails.vue')
  },
  {
    // catch-all: unknown URLs go to the dashboard instead of a blank page
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// One global guard for login AND role checks
router.beforeEach((to) => {
  const store = useLoggedInUserStore()

  if ((to.meta.requiresAuth || to.meta.requiresEditor) && !store.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresEditor && store.role !== 'editor') {
    // logged-in viewer typed an editor-only URL
    return { path: '/' }
  }

  // already logged in -> no reason to show the login page
  if (to.path === '/login' && store.isLoggedIn) {
    return { path: '/' }
  }
})

export default router