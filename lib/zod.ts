import { z } from "zod";

const MAX_PDF_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export const UploadSchema = z.object({
  pdfFile: z
    .custom<File | null>((file) => file instanceof File, {
      message: "Please upload a PDF file.",
    })
    .refine((file) => file instanceof File && file.type === "application/pdf", {
      message: "Only PDF files are allowed.",
    })
    .refine((file) => file instanceof File && file.size <= MAX_PDF_SIZE, {
      message: "PDF must be 50MB or less.",
    }),
  coverImage: z
    .custom<File | null>((file) => file === null || file instanceof File, {
      message: "Cover image must be a file.",
    })
    .refine((file) => !file || file.type.startsWith("image/"), {
      message: "Only image files are allowed.",
    })
    .refine((file) => !file || file.size <= MAX_IMAGE_SIZE, {
      message: "Cover image must be 10MB or less.",
    }),
  title: z.string().min(1, "Title is required."),
  author: z.string().min(1, "Author name is required."),
  persona: z.string().min(1, "Please select a voice."),
});
