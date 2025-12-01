"use client"; // Wajib di baris paling atas

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // Memanggil JS Bootstrap hanya di sisi browser (client)
    require("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return null; // Komponen ini tidak merender tampilan apa-apa
}