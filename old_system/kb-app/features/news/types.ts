// Response structure for news API
export interface NewsResponse {
  news: NewsItem[];
}

export interface TargetCustomer {
  id: string;
  name: string;
}

// Individual news item in the list
export interface NewsItem {
  id: string;
  createdAt: string;
  title: string;
  featuredImage?: string;
  status: "published" | "draft" | "archived";
  excludedCustomers: string[]; // Array of customer IDs that are excluded from this news
  content?: string; // Optional content for detailed view
  pdfFiles?: PdfFile[]; // Optional PDF attachments
  userName?: string; // Optional author name
  userRole?: string; // Optional author role
  targetCustomers?: TargetCustomer[];
}

// PDF file attachment
export interface PdfFile {
  fileName: string;
  fileSize: number;
  s3Key: string;
  s3Url: string;
}

// News item for list view (simplified version)
export interface NewsItemInList {
  id: string;
  title: string;
  createdAt: string;
  featuredImage?: string;
  status: "published" | "draft" | "archived";
  excludedCustomers: string[];
  targetCustomers?: TargetCustomer[];
  subtitle?: string; // Optional excerpt/subtitle for card display
}

// Props for news components
export interface NewsListProps {
  news: NewsItem[];
  isLoading: boolean;
  error?: string;
  onRefresh?: () => void;
  onItemPress: (newsId: string) => void;
}

export interface NewsDetailProps {
  news: NewsItem;
  isLoading: boolean;
  error?: string;
}

// Query response types
export interface NewsQueryResponse {
  data: NewsResponse;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface NewsByIdQueryResponse {
  data: NewsItem;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}
