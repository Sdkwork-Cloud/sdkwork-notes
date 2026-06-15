use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::PathBuf;

#[test]
fn route_manifest_matches_app_openapi_operations() {
    let manifest: Value =
        serde_json::from_str(sdkwork_router_notes_app_api::manifest::route_manifest_json())
            .expect("route manifest json should be valid");

    assert_eq!(manifest["schemaVersion"], 1);
    assert_eq!(manifest["kind"], "sdkwork.route.manifest");
    assert_eq!(manifest["packageName"], "sdkwork-router-notes-app-api");
    assert_eq!(manifest["surface"], "app-api");
    assert_eq!(manifest["owner"], "sdkwork-notes");
    assert_eq!(manifest["domain"], "notes");
    assert_eq!(manifest["capability"], "notes");
    assert_eq!(manifest["apiAuthority"], "sdkwork-notes-app-api");
    assert_eq!(manifest["sdkFamily"], "sdkwork-notes-app-sdk");
    assert_eq!(manifest["prefix"], "/app/v3/api");

    let openapi = read_openapi();
    let openapi_operations = openapi_operations(&openapi);
    let routes = manifest["routes"]
        .as_array()
        .expect("manifest routes should be an array");

    let expected_operations = BTreeSet::from([
        "GET /app/v3/api/notes/workspaces".to_string(),
        "POST /app/v3/api/notes/workspaces".to_string(),
        "GET /app/v3/api/notes/workspaces/{workspaceId}/bootstrap".to_string(),
        "GET /app/v3/api/notes/workspaces/{workspaceId}/pages".to_string(),
        "POST /app/v3/api/notes/workspaces/{workspaceId}/pages".to_string(),
        "GET /app/v3/api/notes/pages/{pageId}".to_string(),
        "PATCH /app/v3/api/notes/pages/{pageId}".to_string(),
        "GET /app/v3/api/notes/pages/{pageId}/content".to_string(),
        "PUT /app/v3/api/notes/pages/{pageId}/content".to_string(),
        "GET /app/v3/api/notes/pages/{pageId}/versions".to_string(),
        "POST /app/v3/api/notes/pages/{pageId}/versions/{driveVersionId}/restore".to_string(),
        "GET /app/v3/api/notes/pages/{pageId}/ai_suggestions".to_string(),
        "POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/accept".to_string(),
        "POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/reject".to_string(),
        "POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/apply".to_string(),
        "POST /app/v3/api/notes/ai_suggestions/{aiSuggestionId}/feedback".to_string(),
        "GET /app/v3/api/notes/search".to_string(),
        "POST /app/v3/api/notes/ai_jobs".to_string(),
    ]);

    let mut manifest_operations = BTreeSet::new();
    for route in routes {
        let key = format!(
            "{} {}",
            route["method"].as_str().expect("method should be string"),
            route["path"].as_str().expect("path should be string")
        );
        manifest_operations.insert(key.clone());
        assert!(
            expected_operations.contains(&key),
            "unexpected manifest route {key}"
        );

        let openapi_operation = openapi_operations
            .get(&key)
            .unwrap_or_else(|| panic!("{key} should exist in OpenAPI authority"));
        assert_eq!(route["operationId"], openapi_operation["operationId"]);
        assert_eq!(
            route["ownership"]["owner"],
            openapi_operation["x-sdkwork-owner"]
        );
        assert_eq!(route["ownership"]["apiAuthority"], "sdkwork-notes-app-api");
        assert_eq!(
            openapi_operation["x-sdkwork-api-authority"],
            "sdkwork-notes-app-api"
        );
        assert_eq!(route["auth"]["mode"], "dual-token");
    }

    assert_eq!(manifest_operations, expected_operations);
}

fn read_openapi() -> Value {
    let path = workspace_root().join("generated/openapi/notes-app-api.openapi.json");
    let text = fs::read_to_string(path).expect("notes app OpenAPI authority should be readable");
    serde_json::from_str(&text).expect("notes app OpenAPI authority should be valid json")
}

fn workspace_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(2)
        .expect("route crate should live under crates")
        .to_path_buf()
}

fn openapi_operations(openapi: &Value) -> BTreeMap<String, Value> {
    let mut operations = BTreeMap::new();
    let paths = openapi["paths"]
        .as_object()
        .expect("OpenAPI paths should be an object");
    for (path, path_item) in paths {
        let Some(path_item) = path_item.as_object() else {
            continue;
        };
        for (method, operation) in path_item {
            if !matches!(method.as_str(), "get" | "post" | "put" | "patch" | "delete") {
                continue;
            }
            operations.insert(
                format!("{} {}", method.to_uppercase(), path),
                operation.clone(),
            );
        }
    }
    operations
}
