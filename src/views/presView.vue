<script setup>
import { onMounted, ref } from "vue";
import { useDrugStore } from "../stores/drugStore";
const previewUrl = ref(null);
const ocrResult = ref("");
const isLoading = ref(false);
const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
// 圖片轉 base64
function convertToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
const drugStore = useDrugStore();
const result = ref();
onMounted(async () => {
  await drugStore.loadCsv();
  const saved = localStorage.getItem("ocrResult");
  if (saved) {
    try {
      ocrResult.value = JSON.parse(saved);
    } catch (e) {
      console.error("無法解析儲存的資料", e);
    }
  }
});

const routeAbbreviations = new Set([
  "PO",
  "IU",
  "AS",
  "AD",
  "AU",
  "OD",
  "OS",
  "OU",
  "IRR",
  "SC",
  "HD",
  "IC",
  "ID",
  "TPN",
  "IM",
  "SL",
  "INH",
  "TOP",
  "LI",
  "LA",
  "REC",
  "TAE",
  "IVI",
  "SPI",
  "IE",
  "IA",
  "SCI",
  "PL",
  "URO",
  "ET",
  "VAG",
  "VT",
  "IMP",
  "IT",
  "EPI",
  "IS",
  "IP",
  "PER",
  "GAR",
  "NA",
  "MSC",
  "IV",
  "IVD",
  "IVA",
  "IVP",
]);

// 清除函式
function clearOcrResult() {
  ocrResult.value = "";
  previewUrl.value = null;
  localStorage.removeItem("ocrResult");
}

async function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // 圖片預覽
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(file);
  const base64 = await convertToBase64(file);

  // OCR 開始辨識
  isLoading.value = true;
  ocrResult.value = "";

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64,
            },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    }
  );
  const result = await response.json();
  const filteredResult = result.responses[0].fullTextAnnotation.text
    .split("\n")
    .filter((ele) => {
      return ele !== "";
    })
    .filter((item) => {
      const hasEnglish = /[a-zA-Z]/.test(item); // 至少有英文
      const isChineseOnly = /^[\u4e00-\u9fa5\s:;，、。、（）()]+$/.test(item); // 全中文
      const isOnlyNumber = /^[\d\s.,]+$/.test(item); // 純數字（含空白、小數點）
      // 👉 判斷是否為縮寫（整行是縮寫或縮寫加雜訊）
      const tokens = item
        .toUpperCase()
        .split(/\s|:|，|。|\(|\)/)
        .filter(Boolean);
      const hasRouteCode = tokens.some((token) =>
        routeAbbreviations.has(token)
      );
      // 🔴 排除包含 [] 或 [xxx] 的項目
      const hasBrackets = /\[.*\]/.test(item);

      return (
        hasEnglish &&
        !isChineseOnly &&
        !isOnlyNumber &&
        !hasRouteCode &&
        !hasBrackets
      );
    })
    .map((item) =>
      item
        .replace(/一天[一二三四五六七八九\d]+次/g, "")
        .replace(/每[日早中晚]{1,2}服用一次/g, "")
        .replace(/睡前服用一次/g, "")
        .replace(/內服/g, "")
        .replace(/外用/g, "")
        .replace(/每日[一二三四五六七八九\d]+次/g, "")
        .replace(/每日上午使用/g, "")
        // ✅ 刪除括號與裡面的內容（例如 (BUMETANIDE)）
        .replace(/\([^)]*\)/g, "")
        // ✅ 刪除雙引號與裡面的內容（例如 "ROOT"）
        .replace(/"[^"]*"/g, "")
        .replace(/\(\s*[^)]*$/, "")
        .replace(/\(\s*[^)]*\)/g, "")
        .replace(/\b\d+(\.\d+)?\s*(MG|ML|G|MCG|KG|IU)\b/gi, "") // ← ✅ 劑量
        .replace(/\b\d+(\.\d+)?\b/g, "") // ← ✅ 純數字
        .replace(/\s{2,}/g, " ")
        .trim()
    )
    .map((i, index) => {
      return drugStore.findDrugByPhoto(i);
    });
  const drugsImgPath = await Promise.all(
    filteredResult.map(async (i, index) => {
      if (!i || !i["許可證字號"]) {
        return {
          英文品名: i?.["英文品名"] || "未知藥品",
          中文品名: i?.["中文品名"] || "查無資料",
          適應症: i?.["適應症"] || "無相關資料",
          img: "/images/no_image.jpeg",
        };
      }
      const img = await drugStore.getDrugImg(i["許可證字號"]);
      return {
        ...i,
        img,
      };
    })
  );
  ocrResult.value = drugsImgPath.filter(Boolean);
  localStorage.setItem("ocrResult", JSON.stringify(drugsImgPath));
  isLoading.value = false;
}
</script>
<template>
  <div class="container m-auto">
    <p class="mt-6">請將個資部分裁切，只需提供藥品清單部分</p>
    <label
      for="file-upload"
      class="px-3 py-1 rounded-lg bg-sky-200 text-sky-900 inline-block my-6"
      >上傳藥單</label
    >
    <input
      type="file"
      name="file-upload"
      id="file-upload"
      accept="image/*"
      @change="handleFileChange"
      class="hidden"
    />
    <button class="ml-2 my-6 px-3 py-1 bg-red-200 text-red-900 rounded-lg" @click="clearOcrResult">
      清除資料
    </button>
    <img
      v-if="previewUrl"
      :src="previewUrl"
      alt="預覽圖"
      class="w-100 object-cover border rounded mb-6"
    />
    <p v-if="isLoading">辨識中，請稍候...</p>
    <div v-else class="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
      <div
        v-for="(i, index) in ocrResult"
        class="bg-gray-200/50 rounded-lg p-2 flex flex-col justify-between "
      >
        <div class="textContainer">
          <p>中文品名：{{ i["中文品名"] }}</p>
          <p>英文品名：{{ i["英文品名"] }}</p>
          <p>適應症：{{ i["適應症"] }}</p>
        </div>
        <div class="imgContainer">
          <p>藥品圖片：</p>
          <img
            v-if="i.img"
            :src="i.img"
            alt="藥品圖片"
            class="w-32 h-32 object-contain"
          />
        </div>
      </div>
    </div>
  </div>
</template>
