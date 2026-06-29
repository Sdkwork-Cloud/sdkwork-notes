use sdkwork_notes_pages_service::domain::PageInfo as DomainPageInfo;
use sdkwork_utils_rust::{PageInfo, PageMode, SdkWorkPageData, SdkWorkResourceData};

pub fn domain_page_info(info: DomainPageInfo) -> PageInfo {
    PageInfo {
        mode: PageMode::Offset,
        page: Some(info.page as i32),
        page_size: Some(info.page_size as i32),
        total_items: None,
        total_pages: None,
        next_cursor: info.next_cursor,
        has_more: Some(info.has_more),
    }
}

pub fn page_data<T>(items: Vec<T>, page_info: DomainPageInfo) -> SdkWorkPageData<T> {
    SdkWorkPageData {
        items,
        page_info: domain_page_info(page_info),
    }
}

pub fn resource_data<T>(item: T) -> SdkWorkResourceData<T> {
    SdkWorkResourceData { item }
}
