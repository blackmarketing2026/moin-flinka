import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        impressum: resolve(__dirname, "impressum.html"),
        datenschutz: resolve(__dirname, "datenschutz.html"),
        dankesseite: resolve(__dirname, "dankesseite.html"),
        schilder: resolve(__dirname, "schilder.html"),
      },
    },
  },
});
