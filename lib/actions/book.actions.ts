"use server";

import { connectToDatabase } from "@/database/mongoose";
import { CreateBook, TextSegment } from "@/types";
import { generateSlug, serializeData } from "../utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import {revalidatePath} from "next/cache";

export const getAllBooks = async () => {
  try {
    await connectToDatabase();

    const books = await Book.find().sort({ createdAt: -1 }).lean();

    return {
      success: true,
      data: serializeData(books),
    };
  } catch (error: any) {
    console.error("Error fetching all books:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch books",
    };
  }
};

export const checkBookExists = async (title: string) => {
  try {
    await connectToDatabase();

    const slug = generateSlug(title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        exists: true,
        book: serializeData(existingBook),
      };
    }

    return {
      exists: false,
    };
  } catch (error: any) {
    console.error("Error checking book existence:", error);

    return {
      exists: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to check book existence",
    };
  }
};

export const createBook = async (data: CreateBook) => {
  try {
    await connectToDatabase();

    const slug = generateSlug(data.title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        success: true,
        data: serializeData(existingBook),
        alreadyExists: true,
      };
    }

    const book = await Book.create({
      ...data,
      slug,
      totalSegments: 0,
    });

    revalidatePath("/");

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (error: any) {
    console.error("========== CREATE BOOK ERROR ==========");
    console.error(error);

    if (error?.errors) {
      Object.keys(error.errors).forEach((key) => {
        console.error(`${key}:`, error.errors[key]?.message);
      });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create book",
    };
  }
};

export const saveBookSegments = async (
  bookId: string,
  clerkId: string,
  segments: TextSegment[],
) => {
  try {
    await connectToDatabase();

    console.log("Saving book segments...");

    const segmentsToInsert = segments.map(
      ({ text, segmentIndex, pageNumber, wordCount }) => ({
        clerkId,
        bookId,
        content: text,
        segmentIndex,
        pageNumber,
        wordCount,
      }),
    );

    await BookSegment.insertMany(segmentsToInsert);

    await Book.findByIdAndUpdate(bookId, {
      totalSegments: segments.length,
    });

    console.log("Book segments saved successfully");

    return {
      success: true,
      data: {
        segmentsCreated: segments.length,
      },
    };
  } catch (error: any) {
    console.error("Error saving book segments:", error);

    try {
      await BookSegment.deleteMany({ bookId });
      await Book.findByIdAndDelete(bookId);

      console.log(
        "Deleted book and segments due to failure while saving segments.",
      );
    } catch (cleanupError) {
      console.error("Cleanup failed:", cleanupError);
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save book segments",
    };
  }
};

export const getBookBySlug = async (slug: string) => {
  try {
    await connectToDatabase();

    const book = await Book.findOne({ slug }).lean();

    if (!book) {
      return {
        success: false,
        data: null,
      };
    }

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (error: any) {
    console.error("Error fetching book by slug:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch book",
    };
  }
};

export const searchBookSegments = async (
  bookId: string,
  query: string,
  segmentLimit: number,
) => {
  try {
    await connectToDatabase();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return {
        success: true,
        data: [],
      };
    }

    const segments = await BookSegment.find(
      {
        bookId,
        $text: {
          $search: trimmedQuery,
        },
      },
      {
        score: {
          $meta: "textScore",
        },
      },
    )
      .sort({
        score: {
          $meta: "textScore",
        },
      })
      .limit(segmentLimit)
      .lean();

    return {
      success: true,
      data: serializeData(segments),
    };
  } catch (error: any) {
    console.error("Error searching book segments:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to search book segments",
    };
  }
};
