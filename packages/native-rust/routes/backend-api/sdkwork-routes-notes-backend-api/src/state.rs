use sdkwork_notes_product::ports::{DrivePageContentPort, NotesRepository};
use sdkwork_notes_product::service::NotesService;

#[derive(Clone)]
pub struct NotesBackendState<R, D>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    pub service: NotesService<R, D>,
}

impl<R, D> NotesBackendState<R, D>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    pub fn new(service: NotesService<R, D>) -> Self {
        Self { service }
    }
}
