// Product Hunt API Types
export interface ProductHuntPost {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  votesCount: number;
  url: string;
  thumbnail?: {
    url: string;
  };
}

export interface ProductHuntPostEdge {
  node: ProductHuntPost;
}

export interface ProductHuntPostsResponse {
  posts: {
    edges: ProductHuntPostEdge[];
  };
}

export interface ProductHuntGraphQLResponse<T> {
  data: T;
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
  }>;
}

// Transformed types for internal use
export interface TransformedPost {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  votes: number;
  url: string;
  thumbnail?: string | undefined;
  rank: number;
}

export interface TopPostsResult {
  posts: TransformedPost[];
  totalCount: number;
  hasNextPage: boolean;
}
