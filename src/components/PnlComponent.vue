<template>
    <section class="row mt-3 mx-0 bg-color rounded justify-content-between align-items-center py-2" :class="{
        'MTM': stickyMTM,
        'border border-warning': riskReached,
        'border border-success': targetReached,
        'border border-danger': killSwitchActive
    }">
        <div class="col-6 col-md-3 col-lg-3 d-flex align-items-center justify-content-center" style="height: 40px">
            <small class="text-muted">Total Capital</small>
            <span class="ms-1 fw-bold"
                :class="totalCapitalPercentage > 0 ? 'text-success' : totalCapitalPercentage < 0 ? 'text-danger' : null">
                {{ totalCapitalPercentage.toFixed(2) }}%
            </span>
        </div>
        <!-- <div class="col-6 col-md-3 col-lg-3 d-flex align-items-center justify-content-center" style="height: 40px">
            <small class="text-muted">Total Profit</small>
            <span class="ms-1 fw-bold"
                :class="totalProfit > 0 ? 'text-success' : totalProfit < 0 ? 'text-danger' : null">
                ₹{{ totalProfit.toFixed(2) }}
            </span>
        </div> -->
        <div class="col-6 col-md-3 col-lg-3 d-flex align-items-center justify-content-center" style="height: 40px">
            <small class="text-muted">Net Qty</small>
            <span class="ms-1 fw-bold"
                :class="totalNetQty > 0 ? 'text-success' : totalNetQty < 0 ? 'text-danger' : null">
                {{ totalNetQty }}
            </span>
        </div>
        <div class="col-6 col-md-3 col-lg-3 d-flex align-items-center justify-content-center" style="height: 40px">
            <small class="text-muted">Net PNL</small>
            <span class="ms-1 fw-bold" :class="netPnl > 0 ? 'text-success' : netPnl < 0 ? 'text-danger' : null">
                ₹{{ netPnl.toFixed(2) }}
            </span>
        </div>
        <div class="col-6 col-md-3 col-lg-3 d-flex align-items-center justify-content-center justify-content-md-end"
            style="height: 40px">
            <small class="text-muted">Kill Switch</small>
            <a :class="['ms-2', 'btn', 'btn-sm', killSwitchButtonClass]" @click="handleKillSwitchClick"
                :data-bs-target="killSwitchActive ? '' : '#KillSwitchActivationConfirmationModal'"
                :data-bs-toggle="killSwitchActive ? '' : 'modal'"
                :title="killSwitchActive ? killSwitchRemainingTime : ''">
                <span v-if="killSwitchActive">{{ currentClockEmoji }}</span>
                <span>{{ killSwitchButtonText }}</span>
            </a>
        </div>
    </section>
</template>

<script setup>
import { defineProps } from 'vue';
import { killSwitchButtonText, killSwitchButtonClass, handleKillSwitchClick } from '@/composables/useKillSwitch';

// Global State
import { currentClockEmoji, killSwitchActive } from '@/stores/globalStore';

const props = defineProps({
    stickyMTM: Boolean,
    totalCapitalPercentage: Number,
    totalProfit: Number,
    totalNetQty: Number,
    netPnl: Number,
    currentClockEmoji: String,
    riskReached: Boolean,
    targetReached: Boolean,
    killSwitchRemainingTime: String,
    killSwitchActive: Boolean
});

</script>
