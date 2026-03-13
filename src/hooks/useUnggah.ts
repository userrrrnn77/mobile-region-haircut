// src/hooks/useUnggah.ts

import { useState } from "react";
import { Platform } from "react-native";

export const useUnggah = () => {
  const [sedangUnggah, setSedangUnggah] = useState<boolean>(false);

  const buatFormData = (
    dataTeks: Record<string, any>,
    files: string | string[] | null = null,
    namaField: string = "photo",
  ): FormData => {
    const formData = new FormData();

    // Masukkan data teks (misal: branchId, userId)
    Object.keys(dataTeks).forEach((key) => {
      if (dataTeks[key] !== undefined && dataTeks[key] !== null) {
        formData.append(key, dataTeks[key]);
      }
    });

    if (files) {
      if (Array.isArray(files)) {
        files.forEach((uri, index) => {
          // @ts-ignore (FormData di RN emang agak beda speknya ama web)
          formData.append(namaField, {
            uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
            name: `file-${index}-${Date.now()}.jpg`,
            type: "image/jpeg",
          });
        });
      } else {
        // @ts-ignore
        formData.append(namaField, {
          uri: Platform.OS === "android" ? files : files.replace("file://", ""),
          name: `single-${Date.now()}.jpg`,
          type: "image/jpeg",
        });
      }
    }

    return formData;
  };

  return { buatFormData, sedangUnggah, setSedangUnggah };
};
