use sdkwork_notes_api_server::build_router;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    let bind_address = std::env::var("SDKWORK_NOTES_APPLICATION_PUBLIC_INGRESS_BIND")
        .expect("SDKWORK_NOTES_APPLICATION_PUBLIC_INGRESS_BIND must be set from a topology profile env");
    let app = build_router()
        .await
        .expect("notes api-server bootstrap failed");
    let listener = tokio::net::TcpListener::bind(&bind_address)
        .await
        .expect("bind notes api-server listener failed");
    tracing::info!("sdkwork-notes-api-server listening on {bind_address}");
    axum::serve(listener, app)
        .await
        .expect("serve notes api-server failed");
}
