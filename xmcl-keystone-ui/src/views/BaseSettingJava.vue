<template>
  <v-list
    two-line
    subheader
    style="background: transparent; width: 100%"
  >
    <v-subheader style="padding-right: 2px">
      Java
      <v-spacer />
      <v-tooltip left>
        <template #activator="{ on }">
          <v-btn
            icon
            :loading="refreshingLocalJava"
            v-on="on"
            @click="refreshLocalJava"
          >
            <v-icon>refresh</v-icon>
          </v-btn>
        </template>
        {{ t("java.refresh") }}
      </v-tooltip>
      <v-tooltip left>
        <template #activator="{ on }">
          <v-btn
            icon
            @click="browseFile"
            v-on="on"
          >
            <v-icon>add</v-icon>
          </v-btn>
        </template>
        {{ t("java.importFromFile") }}
      </v-tooltip>
    </v-subheader>
    <v-list-group
      no-action
    >
      <template #activator>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <span class="h-full text-center object-center self-center">
                {{ t("java.location") }}
              </span>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{
                java && java.path ? java.path : t("java.allocatedLong")
              }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </template>
      <JavaList
        v-model="java"
        :items="javas"
        :remove="removeJava"
      />
    </v-list-group>
    <v-list-item>
      <div class="flex flex-col px-[16px] py-[8px] gap-2 mt-2">
        <div class="flex flex-row items-center">
          {{ t("java.memory") }}
          <BaseSettingGlobalLabel
            :global="isGlobalAssignMemory"
            @click="gotoSetting"
            @clear="resetAssignMemory"
          />

          <div class="flex-grow" />
          <SettingJavaMemoryAssign v-model="assignMemory" />
        </div>
        <SettingJavaMemory
          :assign-memory="assignMemory"
          :min.sync="minMem"
          :max.sync="maxMem"
        />
      </div>
      <!-- t('java.noMemory') -->
    </v-list-item>
    <v-list-item
      style="margin-top: 5px"
    >
      <v-list-item-content>
        <v-list-item-title>
          {{ t("instance.vmOptions") }}
          <BaseSettingGlobalLabel
            :global="isGlobalVmOptions"
            @clear="resetVmOptions"
            @click="gotoSetting"
          />
        </v-list-item-title>
        <v-list-item-subtitle>
          <v-text-field
            v-model="vmOptions"
            class="m-1 mt-2"
            hide-details
            required
            outlined
            filled
            dense
            :placeholder="t('instance.vmOptionsHint')"
          />
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang=ts setup>
import { JavaRecord } from '@xmcl/runtime-api'
import { InstanceEditInjectionKey } from '../composables/instanceEdit'
import { useJava } from '../composables/java'
import JavaList from './BaseSettingJavaList.vue'
import { injection } from '@/util/inject'
import BaseSettingGlobalLabel from './BaseSettingGlobalLabel.vue'
import SettingJavaMemoryAssign from './SettingJavaMemoryAssign.vue'
import SettingJavaMemory from './SettingJavaMemory.vue'

const { t } = useI18n()
const { showOpenDialog } = windowController
const { all: javas, add, remove: removeJava, refreshLocalJava, refreshing: refreshingLocalJava } = useJava()
const {
  isGlobalAssignMemory,
  isGlobalVmOptions, assignMemory,
  resetAssignMemory,
  resetVmOptions,
  maxMemory: maxMem,
  vmOptions,
  minMemory: minMem,
  data,
} = injection(InstanceEditInjectionKey)

const java = computed({
  get: () => javas.value.find(v => v.path === data.javaPath) || { path: '', valid: false, majorVersion: 0, version: '' },
  set: (v: JavaRecord | undefined) => {
    data.javaPath = v?.path ?? ''
  },
})

const { push } = useRouter()
const gotoSetting = () => {
  push('/setting')
}

async function browseFile() {
  const { filePaths } = await showOpenDialog({
    title: t('java.importFromFile'),
  })
  filePaths.forEach(add)
}

</script>

<style scoped=true>
.theme--.v-list .v-list__group--active:after,
.theme--.v-list .v-list__group--active:before {
  background: unset;
}
</style>
<style>
.v-textarea.v-text-field--enclosed .v-text-field__slot textarea {
  word-break: break-all;
}
</style>
