import { Config } from "@/types/settings";
import { userConfigDir } from "./folders";
import {
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";

export async function getConfig(): Promise<Config> {
  const configDir = await userConfigDir();
  const configPath = await join(configDir, "config.json");
  const configExists = await exists(configPath);

  if (!configExists) {
    if (!(await exists(configDir))) {
      await mkdir(configDir, { recursive: true });
    }

    const template: Config = {
      appearance: null,
      onboarding_completed: false,
      motion_detection_enabled: false,
      eye_tracking_enabled: false,
    };

    await writeTextFile(configPath, JSON.stringify(template));
    return template;
  } else {
    const content = await readTextFile(configPath);
    const config: Config = JSON.parse(content);
    return config;
  }
}

export async function completeOnboarding() {
  const configDir = await userConfigDir();
  const configPath = await join(configDir, "config.json");
  const config = await getConfig();

  await writeTextFile(
    configPath,
    JSON.stringify({
      ...config, 
      // ... is the spread operator, implicitly getting all unnamed properties
      // in addition to the one we explicitly define
      onboarding_completed: true,
    } as Config),
  );
}

export async function setAppearanceConfig(value: "light" | "dark" | null) {
  const configDir = await userConfigDir();
  const configPath = await join(configDir, "config.json");
  const config = await getConfig();

  await writeTextFile(
    configPath,
    JSON.stringify({
      ...config,
      onboarding_completed: config.onboarding_completed,
    } as Config),
  );
}

export async function setMotionDetectionConfig(enabled:boolean) {
  const configDir = await userConfigDir();
  const configPath = await join(configDir, "config.json");
  const config = await getConfig();

  await writeTextFile(
    configPath,
    JSON.stringify({
      ...config,
      motion_detection_enabled: enabled,
    } as Config),
  );
}

export async function setEyeTrackingConfig(enabled:boolean) {
  const configDir = await userConfigDir();
  const configPath = await join(configDir, "config.json");
  const config = await getConfig();

  await writeTextFile(
    configPath,
    JSON.stringify({
      ...config,
      eye_tracking_enabled: enabled,
    } as Config),
  );
}
