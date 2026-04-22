export const GET_BOARD_COLUMNS = `
  query GetBoardColumns($boardId: ID!) {
    boards(ids: [$boardId]) {
      columns {
        id
        title
        type
      }
    }
  }
`;

export const GET_ITEM_UPDATES = `
  query GetItemUpdates($itemId: ID!) {
    items(ids: [$itemId]) {
      updates(limit: 100) {
        id
        created_at
        assets {
          id
          name
          url
          public_url
          file_size
          created_at
          file_extension
        }
      }
    }
  }
`;

export const GET_ITEM_ASSETS = `
  query GetItemAssets($itemId: ID!) {
    items(ids: [$itemId]) {
      assets {
        id
        name
        url
        public_url
        file_size
        created_at
        file_extension
      }
    }
  }
`;

export const GET_ITEM_FILES = `
  query GetItemFiles($itemId: ID!) {
    items(ids: [$itemId]) {
      column_values {
        id
        type
        ... on FileValue {
          files {
            ... on FileAssetValue {
              asset {
                id
                name
                url
                public_url
                file_size
                created_at
                file_extension
              }
            }
          }
        }
      }
    }
  }
`;
