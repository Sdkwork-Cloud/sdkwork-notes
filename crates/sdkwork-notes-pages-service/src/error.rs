use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NotesProductError {
    Validation(String),
    Conflict(String),
    NotFound(String),
    PermissionDenied(String),
    Internal(String),
}

impl Display for NotesProductError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Validation(message) => write!(formatter, "validation failed: {message}"),
            Self::Conflict(message) => write!(formatter, "conflict: {message}"),
            Self::NotFound(message) => write!(formatter, "not found: {message}"),
            Self::PermissionDenied(message) => write!(formatter, "permission denied: {message}"),
            Self::Internal(message) => write!(formatter, "internal error: {message}"),
        }
    }
}

impl std::error::Error for NotesProductError {}

pub fn internal_sql_error(context: &'static str) -> impl Fn(sqlx::Error) -> NotesProductError {
    move |error| NotesProductError::Internal(format!("{context}: {error}"))
}
