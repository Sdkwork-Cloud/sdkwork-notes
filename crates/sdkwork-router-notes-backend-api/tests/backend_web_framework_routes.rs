use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::routing::get;
use axum::Router;
use sdkwork_iam_web_adapter::IamDatabaseWebRequestContextResolver;
use sdkwork_router_notes_backend_api::{backend_route_manifest, wrap_router_with_web_framework};
use sdkwork_web_core::RouteAuth;
use tower::util::ServiceExt;

const DEV_AUTH_TOKEN: &str =
    "Bearer tenant_id=100001;user_id=30001;session_id=s-1;app_id=notes;auth_level=password";
const DEV_ACCESS_TOKEN: &str =
    "tenant_id=100001;user_id=30001;session_id=s-1;app_id=notes;environment=dev;deployment_mode=saas";

#[test]
fn backend_http_route_manifest_declares_dual_token_for_json_routes() {
    let manifest = backend_route_manifest();
    let json: serde_json::Value =
        serde_json::from_str(sdkwork_router_notes_backend_api::manifest::route_manifest_json())
            .expect("route manifest json");
    for route in json["routes"].as_array().expect("routes array") {
        let method = route["method"].as_str().expect("method");
        let path = route["path"].as_str().expect("path");
        let axum_path = openapi_path_to_axum(path);
        let matched = manifest
            .match_route(method, &axum_path)
            .unwrap_or_else(|| panic!("missing http route manifest for {method} {axum_path}"));
        assert_eq!(matched.auth, RouteAuth::DualToken);
        assert_eq!(
            matched.operation_id,
            route["operationId"].as_str().expect("operationId")
        );
    }
}

#[tokio::test]
async fn backend_router_web_framework_rejects_unauthenticated_requests() {
    let app = wrap_router_with_web_framework(
        IamDatabaseWebRequestContextResolver::new(None),
        sample_router(),
    );

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/backend/v3/api/notes/ai_jobs")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn backend_router_web_framework_accepts_dev_inline_dual_tokens() {
    let app = wrap_router_with_web_framework(
        IamDatabaseWebRequestContextResolver::new(None),
        sample_router(),
    );

    let response = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/backend/v3/api/notes/ai_jobs")
                .header("authorization", DEV_AUTH_TOKEN)
                .header("access-token", DEV_ACCESS_TOKEN)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_ne!(response.status(), StatusCode::UNAUTHORIZED);
}

fn sample_router() -> Router {
    Router::new().route(
        "/backend/v3/api/notes/ai_jobs",
        get(|| async { axum::http::StatusCode::OK }),
    )
}

fn openapi_path_to_axum(path: &str) -> String {
    path.replace("{aiSuggestionId}", "{ai_suggestion_id}")
        .replace("{aiJobId}", "{ai_job_id}")
}
