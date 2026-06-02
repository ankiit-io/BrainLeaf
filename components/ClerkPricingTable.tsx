"use client";

import { PricingTable } from "@clerk/nextjs";

const ClerkPricingTable = () => {
  return (
    <div className="clerk-pricing-table-wrapper">
      <PricingTable />
    </div>
  );
};

export default ClerkPricingTable;
