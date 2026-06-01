import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Mic, MicOff } from "lucide-react";

import { getBookBySlug } from "@/lib/actions/book.actions";

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { slug } = await params;
  const bookResult = await getBookBySlug(slug);

  if (!bookResult.success || !bookResult.data) {
    redirect("/");
  }

  const { title, author, coverURL, persona } = bookResult.data;

  return (
    <main className="book-page-container">
      <Link href="/" className="back-btn-floating" aria-label="Back to library">
        <ArrowLeft className="text-[var(--text-primary)]" size={20} />
      </Link>
      <section className="vapi-main-container">
        <div className="vapi-header-card vapi-card-layout w-full">
          <div className="vapi-cover-wrapper">
            <Image
              src={coverURL}
              alt={title}
              width={130}
              height={195}
              className="vapi-cover-image"
              unoptimized
            />
            <div className="vapi-mic-wrapper">
              <button
                type="button"
                className="vapi-mic-btn vapi-mic-btn-inactive"
                aria-label="Mic is off"
              >
                <MicOff className="text-[#212a3b]" size={24} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--text-primary)]">
                {title}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm sm:text-base">
                by {author}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="vapi-status-indicator">
                <span className="vapi-status-dot vapi-status-dot-ready" />
                <span className="vapi-status-text">Ready</span>
              </div>
              <div className="vapi-status-indicator">
                <span className="vapi-status-text">
                  Voice: {persona ?? "Default"}
                </span>
              </div>
              <div className="vapi-status-indicator">
                <span className="vapi-status-text">0:00/15:00</span>
              </div>
            </div>
          </div>
        </div>

        <div className="vapi-transcript-wrapper w-full mt-6">
          <div className="transcript-container">
            <div className="transcript-empty">
              <Mic className="text-[var(--text-primary)]" size={48} />
              <p className="transcript-empty-text">No conversation yet</p>
              <p className="transcript-empty-hint">
                Click the mic button above to start talking
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
