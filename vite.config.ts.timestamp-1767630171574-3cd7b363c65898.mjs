// vite.config.ts
import { defineConfig } from "file:///F:/al-khatib-for-marketing-softwear/node_modules/vite/dist/node/index.js";
import react from "file:///F:/al-khatib-for-marketing-softwear/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import electron from "file:///F:/al-khatib-for-marketing-softwear/node_modules/vite-plugin-electron/dist/index.mjs";
import renderer from "file:///F:/al-khatib-for-marketing-softwear/node_modules/vite-plugin-electron-renderer/dist/index.mjs";
var __vite_injected_original_dirname = "F:\\al-khatib-for-marketing-softwear";
var vite_config_default = defineConfig(({ mode }) => ({
  base: "./",
  server: {
    host: "localhost",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    electron([
      {
        // Main-Process entry file of the Electron App.
        entry: "electron/main.ts",
        async onstart(options) {
          const { spawn } = await import("node:child_process");
          const electron2 = (await import("file:///F:/al-khatib-for-marketing-softwear/node_modules/electron/index.js")).default;
          console.log("[ViteConfig] Manually spawning Electron...");
          const child = spawn(electron2, ["dist-electron/main.js"], {
            stdio: "inherit",
            shell: true
          });
          child.on("exit", () => process.exit());
        },
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron", "better-sqlite3"]
            }
          }
        }
      },
      {
        entry: "electron/preload.ts",
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: "dist-electron"
          }
        }
      },
      // Only build the server with vite-plugin-electron in production.
      // In development, the user runs it manually via 'npm run dev:backend'.
      // Check both NODE_ENV and command to ensure server is built
      process.env.NODE_ENV === "production" || mode === "production" || process.argv.includes("build") ? {
        entry: "server/index.ts",
        onstart() {
          console.log("[ViteConfig] Building backend server...");
        },
        vite: {
          build: {
            outDir: "dist-server",
            lib: {
              entry: "server/index.ts",
              formats: ["cjs"],
              fileName: () => "index.cjs"
            },
            rollupOptions: {
              output: {
                format: "cjs"
              },
              external: [
                "better-sqlite3",
                "electron"
              ]
            }
          }
        }
      } : null
    ].filter(Boolean)),
    renderer()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFxhbC1raGF0aWItZm9yLW1hcmtldGluZy1zb2Z0d2VhclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRjpcXFxcYWwta2hhdGliLWZvci1tYXJrZXRpbmctc29mdHdlYXJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Y6L2FsLWtoYXRpYi1mb3ItbWFya2V0aW5nLXNvZnR3ZWFyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGVsZWN0cm9uIGZyb20gXCJ2aXRlLXBsdWdpbi1lbGVjdHJvblwiO1xuaW1wb3J0IHJlbmRlcmVyIGZyb20gXCJ2aXRlLXBsdWdpbi1lbGVjdHJvbi1yZW5kZXJlclwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgYmFzZTogJy4vJyxcbiAgc2VydmVyOiB7XG4gICAgaG9zdDogXCJsb2NhbGhvc3RcIixcbiAgICBwb3J0OiA4MDgwLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTozMDAxJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgfSxcbiAgICAgICcvdXBsb2Fkcyc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTozMDAxJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgZWxlY3Ryb24oW1xuICAgICAge1xuICAgICAgICAvLyBNYWluLVByb2Nlc3MgZW50cnkgZmlsZSBvZiB0aGUgRWxlY3Ryb24gQXBwLlxuICAgICAgICBlbnRyeTogXCJlbGVjdHJvbi9tYWluLnRzXCIsXG4gICAgICAgIGFzeW5jIG9uc3RhcnQob3B0aW9uczogeyBzdGFydHVwOiAoKSA9PiB2b2lkIH0pIHtcbiAgICAgICAgICAvLyBNYW51YWxseSBzcGF3biB0byBieXBhc3MgcG90ZW50aWFsIGVuY29kaW5nIGlzc3VlcyBpbiBwbHVnaW4ncyBzdGFydHVwKCkgb24gV2luZG93c1xuICAgICAgICAgIGNvbnN0IHsgc3Bhd24gfSA9IGF3YWl0IGltcG9ydCgnbm9kZTpjaGlsZF9wcm9jZXNzJyk7XG4gICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSAoYXdhaXQgaW1wb3J0KCdlbGVjdHJvbicpKS5kZWZhdWx0IGFzIHVua25vd24gYXMgc3RyaW5nO1xuXG4gICAgICAgICAgY29uc29sZS5sb2coJ1tWaXRlQ29uZmlnXSBNYW51YWxseSBzcGF3bmluZyBFbGVjdHJvbi4uLicpO1xuICAgICAgICAgIGNvbnN0IGNoaWxkID0gc3Bhd24oZWxlY3Ryb24sIFsnZGlzdC1lbGVjdHJvbi9tYWluLmpzJ10sIHtcbiAgICAgICAgICAgIHN0ZGlvOiAnaW5oZXJpdCcsXG4gICAgICAgICAgICBzaGVsbDogdHJ1ZVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgY2hpbGQub24oJ2V4aXQnLCAoKSA9PiBwcm9jZXNzLmV4aXQoKSk7XG4gICAgICAgIH0sXG4gICAgICAgIHZpdGU6IHtcbiAgICAgICAgICBidWlsZDoge1xuICAgICAgICAgICAgb3V0RGlyOiBcImRpc3QtZWxlY3Ryb25cIixcbiAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgZXh0ZXJuYWw6IFsnZWxlY3Ryb24nLCAnYmV0dGVyLXNxbGl0ZTMnXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGVudHJ5OiBcImVsZWN0cm9uL3ByZWxvYWQudHNcIixcbiAgICAgICAgb25zdGFydChvcHRpb25zOiB7IHJlbG9hZDogKCkgPT4gdm9pZCB9KSB7XG4gICAgICAgICAgLy8gTm90aWZ5IHRoZSBSZW5kZXJlci1Qcm9jZXNzIHRvIHJlbG9hZCB0aGUgcGFnZSB3aGVuIHRoZSBQcmVsb2FkLVNjcmlwdHMgYnVpbGQgaXMgY29tcGxldGUsIFxuICAgICAgICAgIC8vIGluc3RlYWQgb2YgcmVzdGFydGluZyB0aGUgZW50aXJlIEVsZWN0cm9uIEFwcC5cbiAgICAgICAgICBvcHRpb25zLnJlbG9hZCgpO1xuICAgICAgICB9LFxuICAgICAgICB2aXRlOiB7XG4gICAgICAgICAgYnVpbGQ6IHtcbiAgICAgICAgICAgIG91dERpcjogXCJkaXN0LWVsZWN0cm9uXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICAvLyBPbmx5IGJ1aWxkIHRoZSBzZXJ2ZXIgd2l0aCB2aXRlLXBsdWdpbi1lbGVjdHJvbiBpbiBwcm9kdWN0aW9uLlxuICAgICAgLy8gSW4gZGV2ZWxvcG1lbnQsIHRoZSB1c2VyIHJ1bnMgaXQgbWFudWFsbHkgdmlhICducG0gcnVuIGRldjpiYWNrZW5kJy5cbiAgICAgIC8vIENoZWNrIGJvdGggTk9ERV9FTlYgYW5kIGNvbW1hbmQgdG8gZW5zdXJlIHNlcnZlciBpcyBidWlsdFxuICAgICAgKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgfHwgbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nIHx8IHByb2Nlc3MuYXJndi5pbmNsdWRlcygnYnVpbGQnKSlcbiAgICAgICAgPyB7XG4gICAgICAgICAgZW50cnk6IFwic2VydmVyL2luZGV4LnRzXCIsXG4gICAgICAgICAgb25zdGFydCgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbVml0ZUNvbmZpZ10gQnVpbGRpbmcgYmFja2VuZCBzZXJ2ZXIuLi4nKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIHZpdGU6IHtcbiAgICAgICAgICAgIGJ1aWxkOiB7XG4gICAgICAgICAgICAgIG91dERpcjogXCJkaXN0LXNlcnZlclwiLFxuICAgICAgICAgICAgICBsaWI6IHtcbiAgICAgICAgICAgICAgICBlbnRyeTogXCJzZXJ2ZXIvaW5kZXgudHNcIixcbiAgICAgICAgICAgICAgICBmb3JtYXRzOiBbXCJjanNcIl0sXG4gICAgICAgICAgICAgICAgZmlsZU5hbWU6ICgpID0+IFwiaW5kZXguY2pzXCJcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgICAgZm9ybWF0OiBcImNqc1wiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWw6IFtcbiAgICAgICAgICAgICAgICAgICdiZXR0ZXItc3FsaXRlMycsXG4gICAgICAgICAgICAgICAgICAnZWxlY3Ryb24nXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH1cbiAgICAgICAgOiBudWxsLFxuICAgIF0uZmlsdGVyKEJvb2xlYW4pIGFzIGFueSksXG4gICAgcmVuZGVyZXIoKSxcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbn0pKTtcblxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErUixTQUFTLG9CQUFvQjtBQUM1VCxPQUFP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
