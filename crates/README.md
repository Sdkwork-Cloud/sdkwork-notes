# crates/

Rust HTTP route crates, auth layer, API server, and SQLx repositories for SDKWork Notes.

| Crate | Role |
| --- | --- |
| `sdkwork-routes-notes-app-api` | App API routes (`/app/v3/api/notes/...`) |
| `sdkwork-routes-notes-backend-api` | Backend/admin API routes |
| `sdkwork-routes-notes-http-auth` | HTTP auth helpers and web-framework layer wiring |
| `sdkwork-api-notes-standalone-gateway` | Runnable API server binary |
| `sdkwork-notes-pages-repository-sqlx` | SQLx repository for Notes-owned tables |

Product/business logic lives in [../services/](../services/).
