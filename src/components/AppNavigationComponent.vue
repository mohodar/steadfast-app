<template>
    <section class="Navigation AppNavigationComponent">
        <nav class="navbar navbar-expand-lg shadow-sm mt-0 mb-3">
            <div class="container-fluid pt-0">
                <RouterLink to="/" class="navbar-brand d-none">
                    <img src="/steadfast_logo.png" class="Navigation__logo" alt="Steadfast" />
                    <span class="ms-2 fw-bold text-color d-none d-md-inline">Steadfast</span>
                </RouterLink>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                    aria-expanded="false" aria-label="Toggle navigation">
                    <font-awesome-icon icon="bars" class="text-color" />
                </button>
                <!-- Always-on Notification Area -->
                <div class="notification-area d-flex align-items-center ms-3 d-lg-none">
                    <NotificationComponent v-model:showToast="showToast" v-model:message="toastMessage"
                        :notificationSound="notificationSound" />
                </div>
                <div class="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul class="navbar-nav me-md-auto">
                        <li class="nav-item" v-for="route in routes" :key="route.path">
                            <RouterLink v-if="!route.external" :to="route.path" class="nav-link"
                                :class="{ 'active-route': $route.path === route.path }">
                                <font-awesome-icon :icon="route.icon" :class="['nav-icon', route.iconClass]" />
                                <span class="nav-text">{{ route.name }}</span>
                            </RouterLink>
                            <a v-else :href="route.path" target="_blank" class="nav-link">
                                <font-awesome-icon :icon="route.icon" :class="['nav-icon', route.iconClass]" />
                                <span class="nav-text">{{ route.name }}</span>
                            </a>
                        </li>
                    </ul>
                    <!-- Always-on Notification Area -->
                    <div class="notification-area d-none d-lg-flex align-items-center ms-3">
                        <NotificationComponent v-model:showToast="showToast" v-model:message="toastMessage"
                            :notificationSound="notificationSound" />
                    </div>
                </div>
            </div>
        </nav>
    </section>
</template>

<script setup>
import { ref } from 'vue';
import { FontAwesomeIcon } from '@/font-awesome';
import { useRouter } from 'vue-router';
import NotificationComponent from './NotificationComponent.vue'

// Global State
import { notificationSound, toastMessage, showToast } from '@/stores/globalStore';

const routes = ref([
    { path: '/steadfast', name: 'Trade', icon: ['fas', 'bolt'], iconClass: 'text-danger' },
    { path: '/app-settings', name: 'Settings', icon: ['fas', 'cog'], iconClass: 'text-purple' },
    { path: '/manage-brokers', name: 'Brokers', icon: ['fas', 'dollar-sign'], iconClass: 'text-success' },
    { path: "/", name: "Support Open Source Development", icon: ['fas', 'hand-holding-dollar'], iconClass: 'text-danger' },
]);
// const routes = ref([
//     { path: "https://steadfastapp.in", name: "Get Premium Version", icon: ['fas', 'crown'], iconClass: 'text-warning', external: true }
// ]);
const router = useRouter();
</script>
