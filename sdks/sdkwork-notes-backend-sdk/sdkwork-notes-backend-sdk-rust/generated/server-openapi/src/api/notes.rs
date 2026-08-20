use std::sync::Arc;

use crate::api::paths::backend_path;
use crate::api::paths::append_query_string;
use crate::http::{SdkworkError, SdkworkHttpClient};
use crate::models::{AdminUpdateWorkspaceRequest, AiJob, AiSuggestion, AiSuggestionApplyRequest, AiSuggestionDecisionRequest, CompleteAiJobRequest, CreateIndexJobRequest, IndexJob, PageContent, RebuildProjectionRequest, RepairDriveOrphansRequest, WorkspaceAdmin};

#[derive(Clone)]
pub struct NotesApi {
    client: Arc<SdkworkHttpClient>,
}

impl NotesApi {
    pub fn new(client: Arc<SdkworkHttpClient>) -> Self {
        Self { client }
    }

    /// List Notes workspaces for backend-admin governance.
    pub async fn workspaces_admin_list(&self, page: Option<i64>, page_size: Option<i64>, q: Option<&str>) -> Result<serde_json::Value, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("q", q, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/notes/workspaces".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Retrieve backend-admin workspace diagnostics.
    pub async fn workspaces_admin_retrieve(&self, workspace_id: &str) -> Result<WorkspaceAdmin, SdkworkError> {
        let path = backend_path(&format!("/notes/workspaces/{}", serialize_path_parameter(workspace_id, PathParameterSpec::new("workspaceId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Update backend-admin workspace governance fields.
    pub async fn workspaces_admin_update(&self, workspace_id: &str, body: &AdminUpdateWorkspaceRequest) -> Result<WorkspaceAdmin, SdkworkError> {
        let path = backend_path(&format!("/notes/workspaces/{}", serialize_path_parameter(workspace_id, PathParameterSpec::new("workspaceId", "simple", false))));
        self.client.patch(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Queue a projection rebuild for a Notes workspace.
    pub async fn workspaces_projection_rebuild(&self, workspace_id: &str, body: &RebuildProjectionRequest) -> Result<IndexJob, SdkworkError> {
        let path = backend_path(&format!("/notes/workspaces/{}/projection_rebuild", serialize_path_parameter(workspace_id, PathParameterSpec::new("workspaceId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// List Notes index and projection jobs.
    pub async fn index_jobs_list(&self, page: Option<i64>, page_size: Option<i64>, workspace_id: Option<&str>) -> Result<serde_json::Value, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("workspace_id", workspace_id, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/notes/index_jobs".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Create an index or projection job.
    pub async fn index_jobs_create(&self, body: &CreateIndexJobRequest) -> Result<IndexJob, SdkworkError> {
        let path = backend_path(&"/notes/index_jobs".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Retrieve an index or projection job.
    pub async fn index_jobs_retrieve(&self, index_job_id: &str) -> Result<IndexJob, SdkworkError> {
        let path = backend_path(&format!("/notes/index_jobs/{}", serialize_path_parameter(index_job_id, PathParameterSpec::new("indexJobId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// List AI jobs for backend-admin review.
    pub async fn ai_jobs_admin_list(&self, page: Option<i64>, page_size: Option<i64>, workspace_id: Option<&str>) -> Result<serde_json::Value, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
            QueryParameterSpec::new("workspace_id", workspace_id, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/notes/ai_jobs".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Retrieve backend-admin AI job details.
    pub async fn ai_jobs_admin_retrieve(&self, ai_job_id: &str) -> Result<AiJob, SdkworkError> {
        let path = backend_path(&format!("/notes/ai_jobs/{}", serialize_path_parameter(ai_job_id, PathParameterSpec::new("aiJobId", "simple", false))));
        self.client.get(&path, None, None).await
    }

    /// Cancel a running AI job through backend-admin controls.
    pub async fn ai_jobs_cancel(&self, ai_job_id: &str) -> Result<AiJob, SdkworkError> {
        let path = backend_path(&format!("/notes/ai_jobs/{}/cancel", serialize_path_parameter(ai_job_id, PathParameterSpec::new("aiJobId", "simple", false))));
        self.client.post(&path, Option::<&serde_json::Value>::None, None, None, None).await
    }

    /// List Notes metadata records with missing or inconsistent Drive bindings.
    pub async fn diagnostics_drive_orphans_list(&self, workspace_id: Option<&str>, page: Option<i64>, page_size: Option<i64>) -> Result<serde_json::Value, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("workspace_id", workspace_id, "form", true, false, None),
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&"/notes/diagnostics/drive_orphans".to_string()), &query);
        self.client.get(&path, None, None).await
    }

    /// Queue repair for Notes metadata records with inconsistent Drive bindings.
    pub async fn diagnostics_drive_orphans_create(&self, body: &RepairDriveOrphansRequest) -> Result<IndexJob, SdkworkError> {
        let path = backend_path(&"/notes/diagnostics/drive_orphans".to_string());
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Claim a queued AI job for backend worker execution.
    pub async fn ai_jobs_claim(&self, ai_job_id: &str) -> Result<AiJob, SdkworkError> {
        let path = backend_path(&format!("/notes/ai_jobs/{}/claim", serialize_path_parameter(ai_job_id, PathParameterSpec::new("aiJobId", "simple", false))));
        self.client.post(&path, Option::<&serde_json::Value>::None, None, None, None).await
    }

    /// Complete a running AI job and persist reviewable suggestions.
    pub async fn ai_jobs_complete(&self, ai_job_id: &str, body: &CompleteAiJobRequest) -> Result<AiJob, SdkworkError> {
        let path = backend_path(&format!("/notes/ai_jobs/{}/complete", serialize_path_parameter(ai_job_id, PathParameterSpec::new("aiJobId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Accept an AI suggestion through backend-admin controls.
    pub async fn ai_suggestions_accept(&self, ai_suggestion_id: &str, body: &AiSuggestionDecisionRequest) -> Result<AiSuggestion, SdkworkError> {
        let path = backend_path(&format!("/notes/ai_suggestions/{}/accept", serialize_path_parameter(ai_suggestion_id, PathParameterSpec::new("aiSuggestionId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Reject an AI suggestion through backend-admin controls.
    pub async fn ai_suggestions_reject(&self, ai_suggestion_id: &str, body: &AiSuggestionDecisionRequest) -> Result<AiSuggestion, SdkworkError> {
        let path = backend_path(&format!("/notes/ai_suggestions/{}/reject", serialize_path_parameter(ai_suggestion_id, PathParameterSpec::new("aiSuggestionId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// Apply an accepted AI suggestion through backend-admin controls.
    pub async fn ai_suggestions_apply(&self, ai_suggestion_id: &str, body: &AiSuggestionApplyRequest) -> Result<PageContent, SdkworkError> {
        let path = backend_path(&format!("/notes/ai_suggestions/{}/apply", serialize_path_parameter(ai_suggestion_id, PathParameterSpec::new("aiSuggestionId", "simple", false))));
        self.client.post(&path, Some(body), None, None, Some("application/json")).await
    }

    /// List AI suggestion feedback for backend-admin quality review.
    pub async fn ai_suggestions_feedback_list(&self, ai_suggestion_id: &str, page: Option<i64>, page_size: Option<i64>) -> Result<serde_json::Value, SdkworkError> {
        let query = build_query_string(&[
            QueryParameterSpec::new("page", page, "form", true, false, None),
            QueryParameterSpec::new("page_size", page_size, "form", true, false, None),
        ]);
        let path = append_query_string(backend_path(&format!("/notes/ai_suggestions/{}/feedback", serialize_path_parameter(ai_suggestion_id, PathParameterSpec::new("aiSuggestionId", "simple", false)))), &query);
        self.client.get(&path, None, None).await
    }

}

struct PathParameterSpec<'a> {
    name: &'a str,
    style: &'a str,
    explode: bool,
}

impl<'a> PathParameterSpec<'a> {
    fn new(name: &'a str, style: &'a str, explode: bool) -> Self {
        Self { name, style, explode }
    }
}

fn serialize_path_parameter<T: serde::Serialize>(value: T, spec: PathParameterSpec<'_>) -> String {
    let value = serde_json::to_value(value).unwrap_or(serde_json::Value::Null);
    if value.is_null() {
        return String::new();
    }
    let style = if spec.style.is_empty() { "simple" } else { spec.style };
    match value {
        serde_json::Value::Array(values) => serialize_path_array(spec.name, &values, style, spec.explode),
        serde_json::Value::Object(values) => serialize_path_object(spec.name, &values, style, spec.explode),
        value => format!("{}{}", path_primitive_prefix(spec.name, style), percent_encode(&primitive_to_string(&value))),
    }
}

fn serialize_path_array(name: &str, values: &[serde_json::Value], style: &str, explode: bool) -> String {
    let serialized = values
        .iter()
        .filter(|value| !value.is_null())
        .map(|value| percent_encode(&primitive_to_string(value)))
        .collect::<Vec<_>>();
    if serialized.is_empty() {
        return path_prefix(name, style);
    }
    if style == "matrix" {
        if explode {
            return serialized.iter().map(|item| format!(";{}={}", name, item)).collect::<Vec<_>>().join("");
        }
        return format!(";{}={}", name, serialized.join(","));
    }
    let separator = if explode { "." } else { "," };
    format!("{}{}", path_prefix(name, style), serialized.join(separator))
}

fn serialize_path_object(
    name: &str,
    values: &serde_json::Map<String, serde_json::Value>,
    style: &str,
    explode: bool,
) -> String {
    let mut entries = Vec::new();
    let mut exploded = Vec::new();
    for (key, value) in values {
        if value.is_null() {
            continue;
        }
        let escaped_key = percent_encode(key);
        let escaped_value = percent_encode(&primitive_to_string(value));
        if explode {
            if style == "matrix" {
                exploded.push(format!(";{}={}", escaped_key, escaped_value));
            } else {
                exploded.push(format!("{}={}", escaped_key, escaped_value));
            }
        } else {
            entries.push(escaped_key);
            entries.push(escaped_value);
        }
    }
    if style == "matrix" {
        if explode {
            return exploded.join("");
        }
        return format!(";{}={}", name, entries.join(","));
    }
    if explode {
        let separator = if style == "label" { "." } else { "," };
        return format!("{}{}", path_prefix(name, style), exploded.join(separator));
    }
    format!("{}{}", path_prefix(name, style), entries.join(","))
}

fn path_prefix(name: &str, style: &str) -> String {
    match style {
        "label" => ".".to_string(),
        "matrix" => format!(";{}", name),
        _ => String::new(),
    }
}

fn path_primitive_prefix(name: &str, style: &str) -> String {
    if style == "matrix" {
        format!(";{}=", name)
    } else {
        path_prefix(name, style)
    }
}


struct QueryParameterSpec<'a> {
    name: &'a str,
    value: serde_json::Value,
    style: &'a str,
    explode: bool,
    allow_reserved: bool,
    content_type: Option<&'a str>,
}

impl<'a> QueryParameterSpec<'a> {
    fn new<T: serde::Serialize>(
        name: &'a str,
        value: T,
        style: &'a str,
        explode: bool,
        allow_reserved: bool,
        content_type: Option<&'a str>,
    ) -> Self {
        Self {
            name,
            value: serde_json::to_value(value).unwrap_or(serde_json::Value::Null),
            style,
            explode,
            allow_reserved,
            content_type,
        }
    }
}

fn build_query_string(parameters: &[QueryParameterSpec<'_>]) -> String {
    let mut pairs = Vec::new();
    for parameter in parameters {
        append_serialized_parameter(&mut pairs, parameter);
    }
    pairs.join("&")
}

fn append_serialized_parameter(pairs: &mut Vec<String>, parameter: &QueryParameterSpec<'_>) {
    if parameter.value.is_null() {
        return;
    }
    if parameter.content_type.is_some() {
        pairs.push(format!(
            "{}={}",
            percent_encode(parameter.name),
            encode_query_value(&parameter.value.to_string(), parameter.allow_reserved)
        ));
        return;
    }

    let style = if parameter.style.is_empty() { "form" } else { parameter.style };
    match &parameter.value {
        serde_json::Value::Array(values) => append_array_parameter(pairs, parameter.name, values, style, parameter.explode, parameter.allow_reserved),
        serde_json::Value::Object(values) if style == "deepObject" => append_deep_object_parameter(pairs, parameter.name, values, parameter.allow_reserved),
        serde_json::Value::Object(values) => append_object_parameter(pairs, parameter.name, values, style, parameter.explode, parameter.allow_reserved),
        value => pairs.push(format!("{}={}", percent_encode(parameter.name), encode_query_value(&primitive_to_string(value), parameter.allow_reserved))),
    }
}

fn append_array_parameter(
    pairs: &mut Vec<String>,
    name: &str,
    values: &[serde_json::Value],
    style: &str,
    explode: bool,
    allow_reserved: bool,
) {
    let serialized = values.iter().filter(|value| !value.is_null()).map(primitive_to_string).collect::<Vec<_>>();
    if serialized.is_empty() {
        return;
    }
    if style == "form" && explode {
        for item in serialized {
            pairs.push(format!("{}={}", percent_encode(name), encode_query_value(&item, allow_reserved)));
        }
        return;
    }
    pairs.push(format!("{}={}", percent_encode(name), encode_query_value(&serialized.join(","), allow_reserved)));
}

fn append_object_parameter(
    pairs: &mut Vec<String>,
    name: &str,
    values: &serde_json::Map<String, serde_json::Value>,
    style: &str,
    explode: bool,
    allow_reserved: bool,
) {
    let mut serialized = Vec::new();
    for (key, value) in values {
        if value.is_null() {
            continue;
        }
        if style == "form" && explode {
            pairs.push(format!("{}={}", percent_encode(key), encode_query_value(&primitive_to_string(value), allow_reserved)));
        } else {
            serialized.push(key.clone());
            serialized.push(primitive_to_string(value));
        }
    }
    if !serialized.is_empty() {
        pairs.push(format!("{}={}", percent_encode(name), encode_query_value(&serialized.join(","), allow_reserved)));
    }
}

fn append_deep_object_parameter(
    pairs: &mut Vec<String>,
    name: &str,
    values: &serde_json::Map<String, serde_json::Value>,
    allow_reserved: bool,
) {
    for (key, value) in values {
        if !value.is_null() {
            pairs.push(format!("{}={}", percent_encode(&format!("{}[{}]", name, key)), encode_query_value(&primitive_to_string(value), allow_reserved)));
        }
    }
}

fn encode_query_value(value: &str, allow_reserved: bool) -> String {
    let mut encoded = percent_encode(value);
    if !allow_reserved {
        return encoded;
    }
    for (escaped, reserved) in [
        ("%3A", ":"), ("%2F", "/"), ("%3F", "?"), ("%23", "#"),
        ("%5B", "["), ("%5D", "]"), ("%40", "@"), ("%21", "!"),
        ("%24", "$"), ("%26", "&"), ("%27", "'"), ("%28", "("),
        ("%29", ")"), ("%2A", "*"), ("%2B", "+"), ("%2C", ","),
        ("%3B", ";"), ("%3D", "="),
    ] {
        encoded = encoded.replace(escaped, reserved);
    }
    encoded
}

fn primitive_to_string(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::String(value) => value.clone(),
        serde_json::Value::Number(value) => value.to_string(),
        serde_json::Value::Bool(value) => value.to_string(),
        other => other.to_string(),
    }
}

fn percent_encode(value: &str) -> String {
    value
        .bytes()
        .flat_map(|byte| match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                vec![byte as char]
            }
            _ => format!("%{:02X}", byte).chars().collect(),
        })
        .collect()
}
