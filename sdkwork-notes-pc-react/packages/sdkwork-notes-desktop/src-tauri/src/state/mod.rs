use serde::{Deserialize, Serialize};
use std::{
    fs,
    io,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
};

const APP_CONFIG_FILE_NAME: &str = "desktop-config.json";

pub const APP_LANGUAGE_PREFERENCE_SYSTEM: &str = "system";
pub const APP_LANGUAGE_PREFERENCE_ENGLISH: &str = "en-US";
pub const APP_LANGUAGE_PREFERENCE_SIMPLIFIED_CHINESE: &str = "zh-CN";

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AppMetadata {
    pub name: String,
    pub version: String,
    pub target: String,
    pub platform: String,
    pub arch: String,
}

impl AppMetadata {
    pub fn new(
        name: String,
        version: String,
        target: String,
        platform: String,
        arch: String,
    ) -> Self {
        Self {
            name,
            version,
            target,
            platform,
            arch,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub language: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            language: APP_LANGUAGE_PREFERENCE_SYSTEM.to_string(),
        }
    }
}

impl AppConfig {
    pub fn public_projection(&self) -> PublicAppConfig {
        PublicAppConfig {
            language: self.language.clone(),
        }
    }

    pub fn with_language(mut self, language: &str) -> Self {
        self.language = normalize_app_language_preference(language).to_string();
        self
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicAppConfig {
    pub language: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPaths {
    pub app_data_dir: String,
    pub app_config_file: String,
}

pub struct AppState {
    metadata: AppMetadata,
    app_data_dir: PathBuf,
    config_file: PathBuf,
    config: Mutex<AppConfig>,
    shutdown_requested: AtomicBool,
}

impl AppState {
    pub fn from_metadata(app_data_dir: PathBuf, metadata: AppMetadata) -> io::Result<Self> {
        fs::create_dir_all(&app_data_dir)?;
        let config_file = app_data_dir.join(APP_CONFIG_FILE_NAME);
        let config = read_config(&config_file)?;

        Ok(Self {
            metadata,
            app_data_dir,
            config_file,
            config: Mutex::new(config),
            shutdown_requested: AtomicBool::new(false),
        })
    }

    pub fn metadata(&self) -> &AppMetadata {
        &self.metadata
    }

    pub fn config_snapshot(&self) -> AppConfig {
        self.config.lock().expect("app config lock").clone()
    }

    pub fn replace_config(&self, config: AppConfig) {
        *self.config.lock().expect("app config lock") = config;
    }

    pub fn config_file(&self) -> &Path {
        &self.config_file
    }

    pub fn app_paths(&self) -> AppPaths {
        AppPaths {
            app_data_dir: self.app_data_dir.to_string_lossy().into_owned(),
            app_config_file: self.config_file.to_string_lossy().into_owned(),
        }
    }

    pub fn is_shutdown_requested(&self) -> bool {
        self.shutdown_requested.load(Ordering::Relaxed)
    }

    pub fn request_shutdown(&self) {
        self.shutdown_requested.store(true, Ordering::Relaxed);
    }
}

pub fn normalize_app_language_preference(language: &str) -> &'static str {
    let normalized = language.trim().to_ascii_lowercase();
    if normalized.starts_with("zh") {
        APP_LANGUAGE_PREFERENCE_SIMPLIFIED_CHINESE
    } else if normalized.starts_with("en") {
        APP_LANGUAGE_PREFERENCE_ENGLISH
    } else {
        APP_LANGUAGE_PREFERENCE_SYSTEM
    }
}

pub fn read_config(path: &Path) -> io::Result<AppConfig> {
    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let raw = fs::read_to_string(path)?;
    let config = serde_json::from_str::<AppConfig>(&raw).unwrap_or_default();
    let language = config.language.clone();
    Ok(config.with_language(&language))
}

pub fn write_config(path: &Path, config: &AppConfig) -> io::Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let normalized = config.clone().with_language(&config.language);
    let content = serde_json::to_string_pretty(&normalized)
        .map_err(|error| io::Error::new(io::ErrorKind::InvalidData, error))?;
    fs::write(path, format!("{content}\n"))
}

#[cfg(test)]
mod tests {
    use super::{
        normalize_app_language_preference, read_config, write_config, AppConfig,
        APP_LANGUAGE_PREFERENCE_ENGLISH, APP_LANGUAGE_PREFERENCE_SIMPLIFIED_CHINESE,
        APP_LANGUAGE_PREFERENCE_SYSTEM,
    };
    use std::{
        fs,
        time::{SystemTime, UNIX_EPOCH},
    };

    fn create_temp_dir(prefix: &str) -> std::path::PathBuf {
        let path = std::env::temp_dir().join(format!(
            "{prefix}-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .expect("clock")
                .as_nanos()
        ));
        fs::create_dir_all(&path).expect("create temp dir");
        path
    }

    #[test]
    fn language_preference_normalization_accepts_notes_locale_preferences() {
        assert_eq!(
            normalize_app_language_preference("zh-CN"),
            APP_LANGUAGE_PREFERENCE_SIMPLIFIED_CHINESE
        );
        assert_eq!(
            normalize_app_language_preference("en"),
            APP_LANGUAGE_PREFERENCE_ENGLISH
        );
        assert_eq!(
            normalize_app_language_preference("system"),
            APP_LANGUAGE_PREFERENCE_SYSTEM
        );
    }

    #[test]
    fn config_roundtrip_persists_normalized_language() {
        let root = create_temp_dir("sdkwork-notes-config");
        let config_file = root.join("desktop-config.json");

        write_config(
            &config_file,
            &AppConfig {
                language: "en".to_string(),
            },
        )
        .expect("write config");

        let config = read_config(&config_file).expect("read config");
        assert_eq!(config.language, APP_LANGUAGE_PREFERENCE_ENGLISH);

        let _ = fs::remove_dir_all(root);
    }
}
