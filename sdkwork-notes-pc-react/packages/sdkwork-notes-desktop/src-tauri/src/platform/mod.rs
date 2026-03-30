const TARGET: &str = match option_env!("TARGET") {
    Some(target) => target,
    None => "unknown",
};

pub fn current_target() -> &'static str {
    TARGET
}

pub fn current_platform() -> &'static str {
    match std::env::consts::OS {
        "windows" => "windows",
        "macos" => "macos",
        "linux" => "linux",
        other => other,
    }
}

pub fn current_arch() -> &'static str {
    match std::env::consts::ARCH {
        "x86_64" | "amd64" => "x64",
        "aarch64" | "arm64" => "arm64",
        other => other,
    }
}
