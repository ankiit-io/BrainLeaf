"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";

import type { BookUploadFormValues } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UploadSchema } from "@/lib/zod";
import { cn, parsePDFFile } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import {toast} from "sonner";
import { useRouter } from "next/navigation";
import { checkBookExists, createBook, saveBookSegments } from "@/lib/actions/book.actions";
import { upload } from "@vercel/blob/client";
const voiceGroups = {
  male: [
    {
      id: "dave",
      name: "Dave",
      description: "Young male, British-Essex, casual & conversational",
    },
    {
      id: "daniel",
      name: "Daniel",
      description: "Middle-aged male, British, authoritative but warm",
    },
    {
      id: "chris",
      name: "Chris",
      description: "Male, casual & easy-going",
    },
  ],
  female: [
    {
      id: "rachel",
      name: "Rachel",
      description: "Young female, American, calm & clear",
    },
    {
      id: "sarah",
      name: "Sarah",
      description: "Young female, American, soft & approachable",
    },
  ],
};

const LoadingOverlay = () => {
  return (
    <div className="loading-wrapper" role="status" aria-live="polite">
      <div className="loading-shadow-wrapper bg-[var(--bg-tertiary)] shadow-[var(--shadow-soft)]">
        <div className="loading-shadow">
          <Loader2 className="loading-animation h-10 w-10 text-[var(--accent-warm)]" />
          <p className="loading-title">Preparing your book</p>
          <div className="loading-progress">
            <div className="loading-progress-item">
              <span className="loading-progress-status" />
              <span className="text-[var(--text-secondary)]">
                Uploading files
              </span>
            </div>
            <div className="loading-progress-item">
              <span className="loading-progress-status" />
              <span className="text-[var(--text-secondary)]">
                Validating metadata
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadForm = () => {
  const { userId } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookUploadFormValues>({
    resolver: zodResolver(UploadSchema),
    defaultValues: {
      title: "",
      author: "",
      persona: "",
      pdfFile: undefined,
      coverImage: undefined,
    },
  });

  const handleSubmit = async (data: BookUploadFormValues) => {
    if (!userId) {
      return toast.error("You must be logged in to upload a book.");
    }

    setIsSubmitting(true);

    try {
      const existsCheck = await checkBookExists(data.title);

      if (existsCheck.exists && existsCheck.book) {
        toast.info("A book with this title already exists.");
        form.reset();
        router.push(`/books/${book.data.slug}`);
        return;
      }

      const fileTitle = data.title.replace(/\s+/g, "-").toLowerCase();
      const pdfFile = data.pdfFile;

      if (!pdfFile) {
        toast.error("Please select a PDF file");
        return;
      }
      const parsedPDF = await parsePDFFile(pdfFile);

      if (parsedPDF.content.length === 0) {
        toast.error("The uploaded PDF file is empty or invalid.");
        return;
      }

      const uploadedPDFBlob = await upload(fileTitle, pdfFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: "application/pdf",
      });

      let coverUrl: string;

     if (data.coverImage) {
       const coverFile = data.coverImage;
       const uploadedCoverBlob = await upload(`${fileTitle}-cover`, coverFile, {
         access: "public",
         handleUploadUrl: "/api/upload",
         contentType: coverFile.type,
       });

       coverUrl = uploadedCoverBlob.url;
     } else {
       const response = await fetch(parsedPDF.cover);
       const blob = await response.blob();

       const uploadedCoverBlob = await upload(`${fileTitle}-cover`, blob, {
         access: "public",
         handleUploadUrl: "/api/upload",
         contentType: "image/png",
       });

       coverUrl = uploadedCoverBlob.url;
     }

      const book = await createBook({
        clerkId: userId,
        title: data.title,
        author: data.author,
        persona: data.persona,
        fileURL: uploadedPDFBlob.url,
        fileBlobKey: uploadedPDFBlob.pathname,
        coverURL: coverUrl,
        fileSize: pdfFile.size,
      });

      if (!book.success) {
        throw new Error("Book creation failed");
      }

      if (book.alreadyExists) {
        toast.info("A book with this title already exists.");
        form.reset();
        router.push(`/books/${existsCheck.book.slug}`);
        return;
      }

      const segments = await saveBookSegments(
        book.data._id,
        userId,
        parsedPDF.content,
      );

      if (!segments.success) {
        throw new Error("Saving book segments failed");
      }

      toast.success("Book uploaded successfully!");

      form.reset();
      router.push("/");
    } catch (error) {
      console.error("Error during book upload:", error);
      toast.error(
        "An error occurred while uploading your book. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-book-wrapper">
      {isSubmitting ? <LoadingOverlay /> : null}
      <Form {...form}>
        <form className="space-y-8" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="pdfFile"
            render={({ field }) => {
              const inputId = "pdf-file-input";
              const file = field.value;

              return (
                <FormItem>
                  <FormLabel htmlFor={inputId}>Book PDF File</FormLabel>
                  <FormControl id={inputId}>
                    <input
                      className="sr-only"
                      type="file"
                      name={field.name}
                      accept="application/pdf"
                      disabled={isSubmitting}
                      onChange={(event) => {
                        const selectedFile = event.target.files?.[0] ?? null;
                        field.onChange(selectedFile);
                      }}
                    />
                  </FormControl>
                  <label
                    className={cn(
                      "upload-dropzone border border-dashed border-[var(--border-medium)]",
                      file ? "upload-dropzone-uploaded" : null,
                      isSubmitting ? "opacity-70 cursor-not-allowed" : null,
                    )}
                    htmlFor={inputId}
                  >
                    {file ? (
                      <div className="flex items-center gap-3">
                        <Upload className="upload-dropzone-icon" />
                        <div>
                          <p className="upload-dropzone-text">{file.name}</p>
                          <p className="upload-dropzone-hint">
                            PDF file (max 50MB)
                          </p>
                        </div>
                        <button
                          type="button"
                          className="upload-dropzone-remove"
                          aria-label="Remove PDF"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            form.setValue("pdfFile", null, {
                              shouldValidate: true,
                            });
                          }}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="upload-dropzone-icon" />
                        <p className="upload-dropzone-text">
                          Click to upload PDF
                        </p>
                        <p className="upload-dropzone-hint">
                          PDF file (max 50MB)
                        </p>
                      </>
                    )}
                  </label>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => {
              const inputId = "cover-image-input";
              const file = field.value;

              return (
                <FormItem>
                  <FormLabel htmlFor={inputId}>
                    Cover Image (Optional)
                  </FormLabel>
                  <FormControl id={inputId}>
                    <input
                      className="sr-only"
                      type="file"
                      name={field.name}
                      accept="image/*"
                      disabled={isSubmitting}
                      onChange={(event) => {
                        const selectedFile = event.target.files?.[0] ?? null;
                        field.onChange(selectedFile);
                      }}
                    />
                  </FormControl>
                  <label
                    className={cn(
                      "upload-dropzone border border-dashed border-[var(--border-medium)]",
                      file ? "upload-dropzone-uploaded" : null,
                      isSubmitting ? "opacity-70 cursor-not-allowed" : null,
                    )}
                    htmlFor={inputId}
                  >
                    {file ? (
                      <div className="flex items-center gap-3">
                        <ImageIcon className="upload-dropzone-icon" />
                        <div>
                          <p className="upload-dropzone-text">{file.name}</p>
                          <p className="upload-dropzone-hint">
                            Leave empty to auto-generate from PDF
                          </p>
                        </div>
                        <button
                          type="button"
                          className="upload-dropzone-remove"
                          aria-label="Remove cover image"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            form.setValue("coverImage", null, {
                              shouldValidate: true,
                            });
                          }}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="upload-dropzone-icon" />
                        <p className="upload-dropzone-text">
                          Click to upload cover image
                        </p>
                        <p className="upload-dropzone-hint">
                          Leave empty to auto-generate from PDF
                        </p>
                      </>
                    )}
                  </label>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    className="form-input"
                    placeholder="ex: Rich Dad Poor Dad"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author Name</FormLabel>
                <FormControl>
                  <input
                    {...field}
                    className="form-input"
                    placeholder="ex: Robert Kiyosaki"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="persona"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Choose Assistant Voice</FormLabel>
                <FormControl>
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--text-secondary)]">
                        Male Voices
                      </p>
                      <div className="voice-selector-options">
                        {voiceGroups.male.map((voice) => {
                          const isSelected = field.value === voice.id;
                          return (
                            <label
                              key={voice.id}
                              className={cn(
                                "voice-selector-option voice-selector-option-default",
                                isSelected
                                  ? "voice-selector-option-selected"
                                  : null,
                                isSubmitting
                                  ? "voice-selector-option-disabled"
                                  : null,
                              )}
                            >
                              <input
                                type="radio"
                                name={field.name}
                                value={voice.id}
                                checked={isSelected}
                                onChange={() => field.onChange(voice.id)}
                                disabled={isSubmitting}
                                className="sr-only"
                              />
                              <span
                                className="voice-selector-radio"
                                aria-hidden="true"
                              >
                                <span className="voice-selector-radio-dot" />
                              </span>
                              <div className="voice-selector-content">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                  {voice.name}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)]">
                                  {voice.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--text-secondary)]">
                        Female Voices
                      </p>
                      <div className="voice-selector-options">
                        {voiceGroups.female.map((voice) => {
                          const isSelected = field.value === voice.id;
                          return (
                            <label
                              key={voice.id}
                              className={cn(
                                "voice-selector-option voice-selector-option-default",
                                isSelected
                                  ? "voice-selector-option-selected"
                                  : null,
                                isSubmitting
                                  ? "voice-selector-option-disabled"
                                  : null,
                              )}
                            >
                              <input
                                type="radio"
                                name={field.name}
                                value={voice.id}
                                checked={isSelected}
                                onChange={() => field.onChange(voice.id)}
                                disabled={isSubmitting}
                                className="sr-only"
                              />
                              <span
                                className="voice-selector-radio"
                                aria-hidden="true"
                              >
                                <span className="voice-selector-radio-dot" />
                              </span>
                              <div className="voice-selector-content">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                  {voice.name}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)]">
                                  {voice.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="form-btn" type="submit" disabled={isSubmitting}>
            Begin Synthesis
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default UploadForm;
