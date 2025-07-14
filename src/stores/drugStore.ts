import axios from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";
import Papa from "papaparse";

interface Drug {
  中文品名: string;
  主成分略述: string;
  劑型: string;
  包裝: string;
  包裝與國際條碼: string;
  有效日期: string;
  用法用量: string;
  申請商名稱: string;
  申請商地址: string;
  申請商統一編號: string;
  異動日期: string;
  發證日期: string;
  管制藥品分類級別: string;
  舊證字號: string;
  英文品名: string;
  藥品類別: string;
  製程: string;
  製造商名稱: string;
  製造廠公司地址: string;
  製造廠國別: string;
  製造廠廠址: string;
  許可證字號: string;
  許可證種類: string;
  註銷日期: string;
  註銷狀態: string;
  註銷理由: string;
  通關簽審文件編號: string;
  適應症: string;
  [key: string]: any;
}

export const useDrugStore = defineStore("drugStore", () => {
  const searchDrugs = ref<string>("");
  const drugs = ref<Drug[]>([]);
  const resultDrug = ref<Drug[]>([]);

  //載入csv data
  const loadCsv = async () => {
    if (drugs.value.length > 0) return;
    const res = await fetch(import.meta.env.BASE_URL + "fda.csv");
    const csv = await res.text();

    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        drugs.value = results.data;
      },
    });
  };

  //判斷藥品名稱為中英文並且過濾、模糊搜尋
  const findDrugByName = async (name: string) => {
    const isChineseOnly = /^[\u4e00-\u9fa5]+$/.test(name);
    const isEnglish = /^[A-Za-z\s]+$/.test(name);
    resultDrug.value = [];
    let matched: Drug | undefined;
    if (isChineseOnly) {
      matched = drugs.value.find((row) =>
        row["中文品名"]?.replace(/\s+/g, "").includes(name)
      );
    } else if (isEnglish) {
      const keyword = name.toUpperCase().replace(/\s+/g, "");
      matched = drugs.value.find((row) =>
        row["英文品名"]?.toUpperCase().replace(/\s+/g, "").includes(keyword)
      );
    }
    if (matched) {
      const img = await getDrugImg(matched["許可證字號"]);
      return {
        ...matched,
        ["外觀圖檔連結"]: img,
      };
    }
  };

  // 透過圖片過濾出文字後搜尋藥品資料（模糊比對）
  const findDrugByPhoto = (name: any) => {
    const keyword = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const found = drugs.value.find((row) =>
      row["英文品名"]
        ?.toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .includes(keyword)
    );

    // 如果找不到，回傳一個 fallback 資料
    if (!found) {
      return {
        英文品名: name,
        中文品名: "查無資料",
        適應症: "無相關資料",
        許可證字號: "",
        img: "/images/no_image.jpeg", // 可以自訂一張預設圖
      };
    }

    return found;
  };

  const getDrugImg = async (number: any) => {
    try {
      const res = await axios.get(
        `https://data.fda.gov.tw/opendata/exportDataList.do?method=openData&InfoId=42&許可證字號=${number}`
      );
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data[0]["外觀圖檔連結"];
      } else {
        console.log("no data");
        return "/images/no_image.jpeg";
      }
    } catch (error) {
      console.error("Error fetching attribute data:", error);
      return "/images/no_image.jpeg";
    }
  };

  return {
    loadCsv,
    findDrugByName,
    findDrugByPhoto,
    resultDrug,
    drugs,
    searchDrugs,
    getDrugImg,
  };
});
