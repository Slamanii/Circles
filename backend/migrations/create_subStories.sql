create table storyItems (
    id uuid priamary key default gen_random_uuid(),
    story_id uuid references stories(id), 
    duration integer not null default 15,
    mediaUrl text not null,
    media_type text not null
        checks (media_type("image", "video")),
    position integer not null,
    caption text,
    created_at (timestamp),
)

create table storyViews (
    id uuid priamary key default gen_random_uuid(),
    story_item_id uuid references storyItems(id),
    viewer_id uuid references users(id),
    add constraint unique_view,
    unique (story_item_id, viewer_id),
    views_count integer default 0,
    viewed_at (timestamp),
)

create table storyLikes (
    id uuid priamary key default gen_random_uuid(),
    story_item_id uuid references storyItems(id),
    user_id uuid references users(id),
    likes_count integer default 0,
    created_at (timestamp),
)


