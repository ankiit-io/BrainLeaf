import ClerkPricingTable from "@/components/ClerkPricingTable";

const SubscriptionsPage = () => {
  return (
    <main className="clerk-subscriptions">
      <section className="max-w-2xl text-center">
        <h1 className="page-title">Subscription Plans</h1>
        <p className="page-description">
          Choose the perfect plan for your learning journey.
        </p>
      </section>
      <section className="mt-10 w-full">
        <ClerkPricingTable />
      </section>
    </main>
  );
};

export default SubscriptionsPage;
