use sdkwork_notes_product::ports::{DrivePageContentPort, NotesRepository};
use sdkwork_notes_product::service::NotesService;

#[derive(Clone)]
pub struct NotesAppState<R, D>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    pub service: NotesService<R, D>,
}

impl<R, D> NotesAppState<R, D>
where
    R: NotesRepository,
    D: DrivePageContentPort,
{
    pub fn new(service: NotesService<R, D>) -> Self {
        Self { service }
    }
}
