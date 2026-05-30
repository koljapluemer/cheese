import { createRouter, createWebHistory } from 'vue-router'

import { getStoredPlayerSession } from '@/features/player-session/playerSessionStore'
import ChooseCheesePage from '@/pages/choose-cheese/ChooseCheesePage.vue'
import InventoryPage from '@/pages/inventory/InventoryPage.vue'
import LeaderboardPage from '@/pages/leaderboard/LeaderboardPage.vue'
import NameScreenPage from '@/pages/name-screen/NameScreenPage.vue'
import PlaceholderPage from '@/pages/placeholder/PlaceholderPage.vue'
import TraderPage from '@/pages/trader/TraderPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    showTopBar?: boolean
    showBottomNav?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'leaderboard',
      component: LeaderboardPage,
      meta: {
        showBottomNav: true,
        showTopBar: true,
      },
    },
    {
      path: '/name',
      name: 'name',
      component: NameScreenPage,
    },
    {
      path: '/choose-cheese',
      name: 'choose-cheese',
      component: ChooseCheesePage,
      meta: {
        showTopBar: true,
      },
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryPage,
      meta: {
        showBottomNav: true,
        showTopBar: true,
      },
    },
    {
      path: '/offers',
      name: 'offers',
      component: PlaceholderPage,
      props: {
        label: 'Offers',
      },
      meta: {
        showBottomNav: true,
        showTopBar: true,
      },
    },
    {
      path: '/marketplace',
      name: 'marketplace',
      component: PlaceholderPage,
      props: {
        label: 'Marketplace',
      },
      meta: {
        showBottomNav: true,
        showTopBar: true,
      },
    },
    {
      path: '/trader',
      name: 'trader',
      component: TraderPage,
      meta: {
        showBottomNav: true,
        showTopBar: true,
      },
    },
    {
      path: '/wheel',
      name: 'wheel',
      component: PlaceholderPage,
      props: {
        label: 'Wheel',
      },
      meta: {
        showBottomNav: true,
        showTopBar: true,
      },
    },
  ],
})

router.beforeEach((to) => {
  const storedSession = getStoredPlayerSession()

  if (!storedSession && to.name !== 'name') {
    return { name: 'name' }
  }

  if (storedSession && to.name === 'name') {
    return storedSession.starterPicksCompleted < 3
      ? { name: 'choose-cheese' }
      : { name: 'leaderboard' }
  }

  if (storedSession && storedSession.starterPicksCompleted < 3 && to.name !== 'choose-cheese') {
    return { name: 'choose-cheese' }
  }

  if (storedSession && storedSession.starterPicksCompleted >= 3 && to.name === 'choose-cheese') {
    return { name: 'leaderboard' }
  }

  return true
})

export { router }
