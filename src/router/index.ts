// src/router/index.js
import { createRouter, createWebHashHistory } from "vue-router";
// import homeView from "../views/homeView.vue";
import searchView from "../views/searchView.vue";
import presView from "../views/presView.vue";
import remindView from "../views/remindView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: searchView,
  },
  {
    path: "/searchView",
    name: "searchView",
    component: searchView,
  },
  {
    path: "/presView",
    name: "presView",
    component: presView,
  },
  {
    path: "/remindView",
    name: "remindView",
    component: remindView,
  },
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
