# crates/

Rust HTTP route crates, auth layer, API server, and SQLx repositories for SDKWork Notes.

| Crate | Role |
| --- | --- |
| `sdkwork-router-notes-app-api` | App API routes (`/app/v3/api/notes/...`) |
| `sdkwork-router-notes-backend-api` | Backend/admin API routes |
| `sdkwork-router-notes-http-auth` | HTTP auth helpers and web-framework layer wiring |
| `sdkwork-notes-api-server` | Runnable API server binary |
| `sdkwork-notes-pages-repository-sqlx` | SQLx repository for Notes-owned tables |

Product/business logic lives in [../services/](../services/).
