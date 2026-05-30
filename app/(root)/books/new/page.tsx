import React from "react";

import UploadForm from "@/components/UploadForm";

const page = () => {
  return (
    <main className="new-book">
      <section className="flex flex-col gap-5">
        <h1 className="page-title-xl">Add New Book</h1>
        <p className="subtitle">
          Upload a PDF to generate interactive interview
        </p>
      </section>
      <UploadForm />
    </main>
  );
};

export default page;
