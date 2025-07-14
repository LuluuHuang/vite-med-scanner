<script setup>
import { onMounted, ref } from "vue";
import { useDrugStore } from "../stores/drugStore";
const drugStore = useDrugStore();
onMounted(async () => {
  await drugStore.loadCsv();
});
const search = async () => {
  const result = await drugStore.findDrugByName(drugStore.searchDrugs);
  if (result) {
    drugStore.resultDrug = [result];
  } else {
    drugStore.resultDrug = [];
  }
};
function clean(){
  drugStore.searchDrugs = '';
  drugStore.resultDrug = [];
}
</script>
<template>
  <div class="container mx-auto">
    <div class="flex flex-col grid grid-cols-2">
      <div class="mt-6 mb-4 col-span-2">
        <input
          id="name"
          name="name"
          type="text"
          v-model="drugStore.searchDrugs"
          class="rounded-md border-2 border-gray-700 focus:border-pink-600 mr-2 p-1"
          placeholder="請輸入藥品名稱"
        />
        <input
          type="submit"
          value="提交"
          @click="search"
          class="rounded-md border-2 border-orange-500/75 mx-2 bg-orange-100 px-2 py-1"
        />
        <input
          type="button"
          value="清除"
          @click="clean"
          class="rounded-md border-2 border-orange-500/75 mx-2 bg-orange-100 px-2 py-1"
        />
      </div>
      <div v-if="drugStore.resultDrug" class="md:col-span-1 col-span-2">
        <div v-for="(drug, index) in drugStore.resultDrug" :key="index" class="bg-gray-200/50 rounded-lg p-4">
          <h2><strong>中文品名：</strong>{{ drug["中文品名"] }}</h2>
          <p><strong>英文品名：</strong>{{ drug["英文品名"] }}</p>
          <p><strong>形狀：</strong>{{ drug["形狀"] }}</p>
          <p><strong>適應症：</strong>{{ drug["適應症"] }}</p>
          <p><strong>外觀：</strong></p>
          <img :src="drug['外觀圖檔連結']" alt="藥品圖片" class="drugImg" />
        </div>
      </div>
      <div v-else>
        <p>載入中或無資料</p>
      </div>
    </div>
  </div>
</template>
<style>
.drugImg {
  width: 100px;
}
</style>
