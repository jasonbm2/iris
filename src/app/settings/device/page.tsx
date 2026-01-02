/**
 * File:     settings/device/page.tsx
 * Purpose:  Handles device/provider related settings.
 * Authors:  Ojos Project & Iris contributors
 * License:  GNU General Public License v3.0
 */
"use client";
import { useEffect, useState } from "react";
import SettingSection from "../_components/SettingsSection";
import Toggle from "react-toggle";
import "react-toggle/style.css";
import useKeyPress from "@/components/useKeyPress";
import { useRouter } from "next/navigation";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from "../page.module.css";
import { Config } from "@/types/settings";
import {
  getConfig,
  setAppearanceConfig,
  setMotionDetectionConfig,
  setEyeTrackingConfig
} from "@/utils/settings";

export default function Page() {
  const [kioskEnabled, setKioskEnabled] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);
  const router = useRouter();

  useKeyPress("Escape", () => {
    router.push("/");
  });

  useEffect(() => {
    async function getAutostartInfo() {
      setKioskEnabled(await isEnabled());
    }

    async function initConfig() {
      const c = await getConfig();
      setConfig(c);
    }

    getAutostartInfo();
    initConfig();
  }, []);

  return (
    <section className={styles.sectionContainer}>
      <SettingSection
        label="Provider information"
        description="This software is provided to you by Ojos Project."
      >
        <img src="https://ojosproject.org/images/header.png" />
      </SettingSection>
      <SettingSection
        label="Appearance"
        description="Change the appearance of the system."
      >
        <div className={styles.appearanceToggleContainer}>
          <p>Light</p>
          <Toggle
            icons={false}
            checked={config ? config.appearance === "dark" : false}
            className="toggle"
            onChange={async (e) => {
              const newConfig = {
                onboarding_completed: config?.onboarding_completed,
                appearance: e.target.checked ? "dark" : "light",
              } as Config;

              const window = getCurrentWindow();
              window.setTheme(newConfig.appearance);

              setConfig(newConfig);
              await setAppearanceConfig(newConfig.appearance);
            }}
          />
          <p>Dark</p>
        </div>
      </SettingSection>
      <SettingSection
        label="Kiosk mode"
        description="Start Iris in fullscreen on system startup."
      >
        <Toggle
          icons={false}
          checked={kioskEnabled}
          className="toggle"
          onChange={async (e) => {
            setKioskEnabled(e.target.checked);
            const window = getCurrentWindow();

            if (e.target.checked) {
              await enable();
              await window.setFullscreen(true);
            } else {
              await disable();
              await window.setFullscreen(false);
            }
          }}
        />
      </SettingSection>
      <SettingSection
        label="Eye Tracking"
        description="Allow user to use their eyes to navigate Palliaview."
      >
        <Toggle
          icons={false}
          checked={config?.eye_tracking_enabled ?? false}  // the ?? means "if eye_tracking_enabled == null, set it = false"
          className="toggle"
          onChange={async (e) => {
            const newConfig = {
              ...config,
              eye_tracking_enabled: e.target.checked,
            } as Config;
            
            setConfig(newConfig);
            await setEyeTrackingConfig(e.target.checked); // comes from utils/settings.ts
            // add backend connection/implementation here,
            // (enable() & disable())
          }}
      />
      </SettingSection>
      <SettingSection
        label="Motion Detection"
        description="Detect motion while Palliaview is inactive and save a log locally."
      >
        <Toggle
          icons={false}
          checked={config?.motion_detection_enabled ?? false}
          className="toggle"
          onChange={async (e) => {
            const newConfig = {
              ...config,
              motion_detection_enabled: e.target.checked,
            } as Config;

            setConfig(newConfig);
            await setMotionDetectionConfig(e.target.checked);
            // add backend connection/implementation here
          }}
        />
      </SettingSection>
    </section>
  );
}
