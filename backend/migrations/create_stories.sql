create table stories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.user(id), 
    username text references user(userName),
    avatar text references user(avatar), 
    preview_media_snapshot text not null,
    add constraint unique_like,
    unique (story_item_id, user_id),
    created_at (timestamp),
    expired_at (timestamp),
)