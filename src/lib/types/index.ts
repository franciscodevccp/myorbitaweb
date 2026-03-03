export type BookStatus = "PROCESSING" | "READY" | "ERROR";

export interface BookForList {
  id: string;
  title: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  originalSize: number | null;
  totalPages: number;
  status: BookStatus;
  subject: string | null;
  createdAt: Date;
}
